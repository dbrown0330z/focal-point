import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug } from '@/lib/club-context'
import { redirect } from 'next/navigation'
import StandingsClient from './StandingsClient'
import type { AwardTier } from '@/types/competition'

// ── Season helpers ─────────────────────────────────────────────────────────────

function currentSeasonStartYear(startMonth: number): number {
  const today = new Date()
  const m = today.getMonth() + 1
  const y = today.getFullYear()
  return m >= startMonth ? y : y - 1
}

function seasonBounds(startMonth: number, startYear: number) {
  return {
    start: new Date(startYear,     startMonth - 1, 1).toISOString(),
    end:   new Date(startYear + 1, startMonth - 1, 1).toISOString(),
    label: `${startYear}–${startYear + 1}`,
  }
}

// ── Exported types (consumed by StandingsClient) ───────────────────────────────

export type PoyEntry = {
  rank:                number
  tied:                boolean   // true = shares rank with at least one other
  memberId:            string
  displayName:         string
  avatarUrl:           string | null
  skillLevel:          string | null
  score:               number
  competitionsEntered: number
  byCategory:          Record<string, number[]> // category name → individual scores, sorted desc (max TOP_PER_CATEGORY)
  isCurrentUser:       boolean
}

export type AwardLeaderboardEntry = {
  memberId:     string
  displayName:  string
  avatarUrl:    string | null
  total:        number
  byType:       Record<string, number>
  isCurrentUser: boolean
}

export type RecentAward = {
  memberId:         string
  memberName:       string
  memberAvatarUrl:  string | null
  awardName:        string
  competitionTitle: string
  awardedAt:        string
}

export type SeasonOption = {
  year:      number
  label:     string
  isCurrent: boolean
}

export type CurrentProfile = {
  id:               string
  displayName:      string
  avatarUrl:        string | null
  skillLevel:       string | null
  shootingInterests: string[] | null
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function StandingsPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; tab?: string }>
}) {
  const clubSlug = await requireClubSlug()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()
  if (!user) redirect(`/${clubSlug}/login`)

  const params = await searchParams

  // Club settings
  const { data: settingsRaw } = await admin
    .from('club_settings')
    .select('season_start_month')
    .single()
  const startMonth: number = settingsRaw?.season_start_month ?? 9

  // Season
  const currentYear = currentSeasonStartYear(startMonth)
  const requestedYear = params.season ? parseInt(params.season) : NaN
  const seasonYear = !isNaN(requestedYear) ? requestedYear : currentYear
  const season = seasonBounds(startMonth, seasonYear)

  // Offer current + 5 previous seasons
  const seasonOptions: SeasonOption[] = Array.from({ length: 6 }, (_, i) => {
    const y = currentYear - i
    return { year: y, label: `${y}–${y + 1}`, isCurrent: i === 0 }
  })

  // Current user profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: me } = await (supabase as any)
    .from('profiles')
    .select('id, display_name, avatar_url, experience_level, shooting_interests')
    .eq('id', user.id)
    .single()

  const currentProfile: CurrentProfile | null = me ? {
    id:               me.id,
    displayName:      me.display_name,
    avatarUrl:        me.avatar_url ?? null,
    skillLevel:       me.experience_level ?? null,
    shootingInterests: me.shooting_interests ?? null,
  } : null

  // Competitions with published results in this season window
  const { data: compsRaw } = await admin
    .from('competitions')
    .select('id, title, awards_enabled, award_types, closes_at')
    .in('status', ['results_published', 'closed'])
    .is('deleted_at', null)
    .gte('closes_at', season.start)
    .lt('closes_at', season.end)

  type CompRow = {
    id: string
    title: string
    awards_enabled: boolean
    award_types: AwardTier[] | null
    closes_at: string
  }
  const competitions: CompRow[] = (compsRaw as CompRow[] | null) ?? []
  const compIds = competitions.map(c => c.id)

  // Last updated = most recent competition close date with published results
  const lastUpdatedAt = competitions.length > 0
    ? competitions.reduce((latest, c) => c.closes_at > latest ? c.closes_at : latest, competitions[0].closes_at)
    : null
  const awardsConfigured = competitions.some(c => c.awards_enabled)

  // ── Defaults ─────────────────────────────────────────────────────────────────
  let poyStandings:     PoyEntry[]               = []
  let awardLeaderboard: AwardLeaderboardEntry[]  = []
  let recentAwards:     RecentAward[]            = []
  let categoryNames:    string[]                 = []

  // Top N results per category count toward standings
  const TOP_PER_CATEGORY = 4

  if (compIds.length > 0) {
    // Category names for this season's competitions (deduped by name across comps)
    const { data: catsRaw } = await admin
      .from('competition_categories')
      .select('id, name, competition_id')
      .in('competition_id', compIds)

    const catIdToName = new Map<string, string>(
      (catsRaw ?? []).map(c => [c.id, c.name])
    )
    // Stable ordered list of unique category names
    categoryNames = [...new Set((catsRaw ?? []).map(c => c.name))]

    // Submissions + scores for this season's competitions
    const { data: subsRaw } = await admin
      .from('submissions')
      .select('id, member_id, competition_id, category_id, scores(score, award_id)')
      .in('competition_id', compIds)
      .eq('status', 'submitted')

    type ScoreRow = { score: number; award_id: string | null }
    type SubRow   = { id: string; member_id: string; competition_id: string; category_id: string; scores: ScoreRow[] }
    const submissions: SubRow[] = subsRaw ?? []

    // Member profiles for everyone who submitted
    const memberIds = [...new Set(submissions.map(s => s.member_id))]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profilesRaw } = await (supabase as any)
      .from('profiles')
      .select('id, display_name, avatar_url, experience_level, shooting_interests')
      .in('id', memberIds)

    type ProfileRow = { id: string; display_name: string; avatar_url: string | null; experience_level: string | null; shooting_interests: string[] | null }
    const profileMap = new Map<string, ProfileRow>(
      (profilesRaw ?? []).map((p: ProfileRow) => [p.id, p])
    )

    // ── POY standings ──────────────────────────────────────────────────────────
    // Scoring: for each member, for each category, take the top TOP_PER_CATEGORY
    // competition scores and sum them. Total = sum across all categories.
    //
    // Each submission's score = average of judge scores for that submission.

    // member → category name → list of per-submission averages
    const memberCatScores = new Map<string, Map<string, number[]>>()
    const memberComps     = new Map<string, Set<string>>()

    for (const sub of submissions) {
      if (!sub.scores?.length) continue
      const avg     = sub.scores.reduce((s, sc) => s + sc.score, 0) / sub.scores.length
      const catName = catIdToName.get(sub.category_id) ?? 'Other'

      if (!memberCatScores.has(sub.member_id)) memberCatScores.set(sub.member_id, new Map())
      const cm = memberCatScores.get(sub.member_id)!
      if (!cm.has(catName)) cm.set(catName, [])
      cm.get(catName)!.push(avg)

      if (!memberComps.has(sub.member_id)) memberComps.set(sub.member_id, new Set())
      memberComps.get(sub.member_id)!.add(sub.competition_id)
    }

    // Compute per-category contribution (top N) and total score per member
    type MemberAgg = { totalScore: number; byCategory: Record<string, number> }
    const agg = new Map<string, MemberAgg>()

    for (const [memberId, catMap] of memberCatScores) {
      const byCategory: Record<string, number[]> = {}
      let totalScore = 0
      for (const [catName, scores] of catMap) {
        const top      = [...scores].sort((a, b) => b - a).slice(0, TOP_PER_CATEGORY)
        const catTotal = top.reduce((s, sc) => s + sc, 0)
        byCategory[catName] = top.map(s => Math.round(s * 10) / 10)
        totalScore += catTotal
      }
      agg.set(memberId, { totalScore: Math.round(totalScore * 10) / 10, byCategory })
    }

    // Sort by score desc, tie-break by fewer competitions entered
    const sorted = [...agg.entries()]
      .map(([memberId, m]) => ({
        memberId,
        score:               m.totalScore,
        byCategory:          m.byCategory,
        competitionsEntered: memberComps.get(memberId)?.size ?? 0,
      }))
      .sort((a, b) => b.score - a.score || a.competitionsEntered - b.competitionsEntered)

    // Assign ranks (tied entries share rank)
    let rank = 1
    poyStandings = sorted.map((entry, i) => {
      if (i > 0 && entry.score < sorted[i - 1].score) rank = i + 1
      const prevTied = i > 0 && entry.score === sorted[i - 1].score
      const nextTied = i < sorted.length - 1 && entry.score === sorted[i + 1].score
      const profile = profileMap.get(entry.memberId)
      return {
        rank,
        tied:                prevTied || nextTied,
        memberId:            entry.memberId,
        displayName:         profile?.display_name ?? 'Unknown',
        avatarUrl:           profile?.avatar_url ?? null,
        skillLevel:          profile?.experience_level ?? null,
        score:               entry.score,
        byCategory:          entry.byCategory,
        competitionsEntered: entry.competitionsEntered,
        isCurrentUser:       entry.memberId === user.id,
      }
    })

    // ── Awards ──────────────────────────────────────────────────────────────────
    if (awardsConfigured) {
      // Build award label map from all competitions' award_types arrays
      const awardLabelMap = new Map<string, string>()
      for (const comp of competitions) {
        for (const tier of (comp.award_types ?? [])) {
          if (tier.id && tier.label) awardLabelMap.set(tier.id, tier.label)
        }
      }

      // Aggregate award counts per member
      const memberAwards = new Map<string, Map<string, number>>()
      type AwardListItem = { sub: SubRow; awardId: string; comp: CompRow }
      const awardList: AwardListItem[] = []

      for (const sub of submissions) {
        for (const sc of (sub.scores ?? [])) {
          if (!sc.award_id) continue
          if (!memberAwards.has(sub.member_id)) memberAwards.set(sub.member_id, new Map())
          const ma = memberAwards.get(sub.member_id)!
          ma.set(sc.award_id, (ma.get(sc.award_id) ?? 0) + 1)
          const comp = competitions.find(c => c.id === sub.competition_id)
          if (comp) awardList.push({ sub, awardId: sc.award_id, comp })
        }
      }

      awardLeaderboard = [...memberAwards.entries()].map(([memberId, byAwardId]) => {
        const profile = profileMap.get(memberId)
        const byType: Record<string, number> = {}
        let total = 0
        for (const [awardId, count] of byAwardId) {
          const label = awardLabelMap.get(awardId) ?? awardId
          byType[label] = (byType[label] ?? 0) + count
          total += count
        }
        return {
          memberId,
          displayName:   profile?.display_name ?? 'Unknown',
          avatarUrl:     profile?.avatar_url ?? null,
          total,
          byType,
          isCurrentUser: memberId === user.id,
        }
      }).sort((a, b) => b.total - a.total)

      recentAwards = awardList
        .sort((a, b) => new Date(b.comp.closes_at).getTime() - new Date(a.comp.closes_at).getTime())
        .slice(0, 20)
        .map(({ sub, awardId, comp }) => {
          const profile = profileMap.get(sub.member_id)
          return {
            memberId:         sub.member_id,
            memberName:       profile?.display_name ?? 'Unknown',
            memberAvatarUrl:  profile?.avatar_url ?? null,
            awardName:        awardLabelMap.get(awardId) ?? awardId,
            competitionTitle: comp.title,
            awardedAt:        comp.closes_at,
          }
        })
    }
  }

  return (
    <StandingsClient
      clubSlug={clubSlug}
      currentProfile={currentProfile}
      seasonYear={seasonYear}
      seasonOptions={seasonOptions}
      hasCompetitionsThisSeason={compIds.length > 0}
      poyStandings={poyStandings}
      categoryNames={categoryNames}
      topPerCategory={TOP_PER_CATEGORY}
      lastUpdatedAt={lastUpdatedAt}
      benchmarkConfigured={false}
      awardsConfigured={awardsConfigured}
      awardLeaderboard={awardLeaderboard}
      recentAwards={recentAwards}
      initialTab={(params.tab === 'benchmark' || params.tab === 'awards') ? params.tab : 'poy'}
    />
  )
}

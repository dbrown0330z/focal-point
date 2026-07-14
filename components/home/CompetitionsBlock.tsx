import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { CompetitionsSettings } from '@/lib/homepage/types'
import OpenCompEntryButton from './OpenCompEntryButton'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysRemaining(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

function displayName(comp: { title: string; short_title?: string | null }) {
  return comp.short_title?.trim() || comp.title
}

// ─── SVG score distribution chart ────────────────────────────────────────────

function ScoreChart({
  distribution,
  scoreMin,
  scoreMax,
  average,
}: {
  distribution: { score: number; count: number }[]
  scoreMin:     number
  scoreMax:     number
  average:      number
}) {
  const scores: number[] = []
  for (let s = scoreMin; s <= scoreMax; s++) scores.push(s)

  const maxCount = Math.max(...distribution.map(d => d.count), 1)
  const BAR_H    = 44
  const BAR_W    = 18
  const GAP      = 3
  const LABEL_H  = 16
  const totalW   = scores.length * (BAR_W + GAP) - GAP
  const totalH   = BAR_H + LABEL_H

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width={totalW}
        height={totalH}
        style={{ flexShrink: 0, overflow: 'visible' }}
        aria-label="Score distribution chart"
      >
        {scores.map((score, i) => {
          const item  = distribution.find(d => d.score === score)
          const count = item?.count ?? 0
          const barH  = count === 0 ? 2 : Math.max(3, Math.round((count / maxCount) * BAR_H))
          const x     = i * (BAR_W + GAP)
          const y     = BAR_H - barH
          const isMode = distribution.reduce((best, d) => d.count > best.count ? d : best, { score: 0, count: 0 }).score === score
          return (
            <g key={score}>
              <rect
                x={x} y={y} width={BAR_W} height={barH} rx={2}
                fill={isMode ? 'var(--action-primary)' : 'var(--action-primary)'}
                opacity={count === 0 ? 0.12 : 0.55 + 0.45 * (count / maxCount)}
              />
              <text
                x={x + BAR_W / 2} y={BAR_H + LABEL_H - 2}
                textAnchor="middle" fontSize={9}
                fill="var(--text-tertiary)"
              >
                {score}
              </text>
            </g>
          )
        })}
      </svg>
      <div>
        <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-lora, Georgia, serif)', lineHeight: 1 }}>
          {average.toFixed(1)}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>avg score</p>
      </div>
    </div>
  )
}

// ─── Zone 1 — Open now ────────────────────────────────────────────────────────

type OpenComp = {
  id:               string
  title:            string
  short_title:      string | null
  closes_at:        string | null
  submission_limit: number
  totalEntries:     number
  memberUsed:       number
  categories:       { id: string; name: string; count?: number }[]
}

function OpenCompCard({ comp, userId }: { comp: OpenComp; userId: string | null }) {
  const days   = comp.closes_at ? daysRemaining(comp.closes_at) : null
  const status = comp.memberUsed === 0
    ? 'none'
    : comp.memberUsed >= comp.submission_limit
      ? 'full'
      : 'partial'

  const closeLabel = comp.closes_at
    ? new Date(comp.closes_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <div style={{
      background:   'var(--surface-1)',
      borderRadius: 10,
      padding:      '16px 18px',
      border:       '1px solid var(--border-default)',
      borderLeft:   '3px solid var(--phase-open-border)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-lora, Georgia, serif)', lineHeight: 1.3 }}>
            {displayName(comp)}
          </p>
          {closeLabel && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
              Submissions close {closeLabel}
              {days !== null && <> · <strong style={{ color: days <= 3 ? 'var(--status-warning)' : 'inherit' }}>{days} day{days !== 1 ? 's' : ''} remaining</strong></>}
            </p>
          )}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0, paddingTop: 2 }}>
          {comp.totalEntries} {comp.totalEntries === 1 ? 'entry' : 'entries'} so far
        </span>
      </div>

      {/* Member entry state */}
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {status === 'full' ? (
          <p style={{ fontSize: 13, color: 'var(--status-success-text)', fontWeight: 500 }}>
            ✓ All {comp.submission_limit} {comp.submission_limit === 1 ? 'entry' : 'entries'} submitted
          </p>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {status === 'none'
                ? "You haven't entered yet."
                : `You've submitted ${comp.memberUsed} of ${comp.submission_limit} ${comp.submission_limit === 1 ? 'entry' : 'entries'}.`}
            </p>
            {userId ? (
              <OpenCompEntryButton comp={comp} userId={userId} status={status} />
            ) : (
              <Link
                href="/login"
                style={{ flexShrink: 0, fontSize: 13, fontWeight: 600, color: 'var(--action-primary)', textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Sign in to enter →
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Zone 2 — Recently closed (results published) ────────────────────────────

type SubmissionResult = {
  id:           string
  category_id:  string
  member_id:    string
  image_id:     string
  imageTitle:   string
  storagePath:  string
  memberName:   string
  memberId:     string
  avgScore:     number
  awardId:      string | null
}

type CategoryResult = {
  categoryId:   string
  categoryName: string
  top:          SubmissionResult
  placement:    number  // 1-based rank within category
}

type RecentResultData = {
  id:            string
  title:         string
  short_title:   string | null
  totalImages:   number
  categoryCount: number
  average:       number
  distribution:  { score: number; count: number }[]
  topByCategory: CategoryResult[]
  scoreMin:      number
  scoreMax:      number
  awardTypes:    { id: string; name: string; icon?: string }[]
  awardsEnabled: boolean
}

type MemberOwnResult = {
  imageTitle:   string
  storagePath:  string
  categoryName: string
  score:        number
  placement:    number
}

function AwardBadge({ awardId, awardTypes }: { awardId: string | null; awardTypes: { id: string; name: string; icon?: string }[] }) {
  if (!awardId) return null
  const award = awardTypes.find(a => a.id === awardId)
  if (!award) return null
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--spot-gold)' }}>
      {award.icon ?? '🏆'} {award.name}
    </span>
  )
}

function TopImageCard({
  result,
  publicUrl,
  compId,
  showAward,
  awardTypes,
}: {
  result:     CategoryResult
  publicUrl:  string
  compId:     string
  showAward:  boolean
  awardTypes: { id: string; name: string; icon?: string }[]
}) {
  const placementLabels: Record<number, string> = { 1: '🥇 First', 2: '🥈 Second', 3: '🥉 Third' }
  const placeLabel = placementLabels[result.placement] ?? `${ordinal(result.placement)} place`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>
        {result.categoryName}
      </p>
      <Link href={`/competitions/${compId}`} style={{ display: 'block', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'relative', paddingTop: '75%', background: 'var(--surface-1)' }}>
          <Image
            src={publicUrl}
            alt={result.top.imageTitle}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </div>
      </Link>
      <div style={{ marginTop: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {result.top.imageTitle}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3, gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{result.top.memberName}</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>{result.top.avgScore.toFixed(1)}</p>
        </div>
        <p style={{ fontSize: 11, marginTop: 3, color: 'var(--text-tertiary)' }}>
          {showAward && result.top.awardId
            ? <AwardBadge awardId={result.top.awardId} awardTypes={awardTypes} />
            : placeLabel}
        </p>
      </div>
    </div>
  )
}

// ─── Shared constants ─────────────────────────────────────────────────────────

const JUDGING_STATUSES = ['judging', 'judging_on_hold', 'results_pending'] as const

// ─── Main server component ────────────────────────────────────────────────────

export default async function CompetitionsBlock({
  settings,
}: {
  settings: CompetitionsSettings
}) {
  const supabaseRaw = await createClient()
  const supabase = supabaseRaw
  const nowIso = new Date().toISOString()

  const { data: { user } } = await supabaseRaw.auth.getUser()
  const userId = user?.id ?? null

  // ── 1. Open competitions (must be open AND closes_at in the future) ────────
  const { data: openCompsRaw } = await supabase
    .from('competitions')
    .select('id, title, short_title, closes_at, submission_limit, competition_categories(id, name)')
    .eq('status', 'open')
    .gt('closes_at', nowIso)
    .order('closes_at', { ascending: true, nullsFirst: false })
    .limit(settings.maxOpenShown)

  // ── 1b. Judging competitions ──────────────────────────────────────────────
  // Include: explicit judging statuses, plus 'open' comps whose closes_at has passed
  const [{ data: judgingByStatusRaw }, { data: judgingExpiredRaw }] = await Promise.all([
    supabase
      .from('competitions')
      .select('id, title, short_title')
      .in('status', [...JUDGING_STATUSES])
      .order('closes_at', { ascending: false, nullsFirst: false }),
    supabase
      .from('competitions')
      .select('id, title, short_title')
      .eq('status', 'open')
      .lte('closes_at', nowIso)
      .order('closes_at', { ascending: false, nullsFirst: false }),
  ])

  type JudgingComp = { id: string; title: string; short_title: string | null }
  const seenJudging = new Set<string>()
  const judgingComps: JudgingComp[] = []
  for (const c of [...(judgingByStatusRaw ?? []), ...(judgingExpiredRaw ?? [])] as JudgingComp[]) {
    if (!seenJudging.has(c.id)) { seenJudging.add(c.id); judgingComps.push(c) }
  }

  const openComps: OpenComp[] = []
  if ((openCompsRaw ?? []).length > 0) {
    const openIds: string[] = (openCompsRaw ?? []).map((c: { id: string }) => c.id)

    // Total entries per open competition, also track per-category counts
    const { data: allEntriesRaw } = await supabase
      .from('submissions')
      .select('competition_id, category_id')
      .in('competition_id', openIds)
      .eq('status', 'submitted')

    const entryCounts: Record<string, number> = {}
    const catCounts: Record<string, Record<string, number>> = {} // compId → { catId → count }
    for (const row of (allEntriesRaw ?? [])) {
      entryCounts[row.competition_id] = (entryCounts[row.competition_id] ?? 0) + 1
      if (!catCounts[row.competition_id]) catCounts[row.competition_id] = {}
      catCounts[row.competition_id][row.category_id] = (catCounts[row.competition_id][row.category_id] ?? 0) + 1
    }

    // Member's entries per open competition
    const memberCounts: Record<string, number> = {}
    if (userId) {
      const { data: memberEntriesRaw } = await supabase
        .from('submissions')
        .select('competition_id')
        .in('competition_id', openIds)
        .eq('member_id', userId)
        .eq('status', 'submitted')

      for (const row of (memberEntriesRaw ?? [])) {
        memberCounts[row.competition_id] = (memberCounts[row.competition_id] ?? 0) + 1
      }
    }

    for (const c of (openCompsRaw ?? [])) {
      const cats = (c.competition_categories as unknown as { id: string; name: string }[]) ?? []
      const compCatCounts = catCounts[c.id] ?? {}
      openComps.push({
        id:               c.id,
        title:            c.title,
        short_title:      c.short_title,
        closes_at:        c.closes_at,
        submission_limit: c.submission_limit,
        totalEntries:     entryCounts[c.id] ?? 0,
        memberUsed:       memberCounts[c.id] ?? 0,
        categories:       cats.map(cat => ({ id: cat.id, name: cat.name, count: compCatCounts[cat.id] ?? 0 })),
      })
    }
  }

  // ── 2. Most recently published results ───────────────────────────────────
  let recentResult: RecentResultData | null = null
  let memberOwnResult: MemberOwnResult | null = null

  const { data: recentCompRaw } = await supabase
    .from('competitions')
    .select('id, title, short_title, results_at, score_min, score_max, awards_enabled, award_types')
    .eq('status', 'results_published')
    .order('results_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (recentCompRaw) {
    const compId = recentCompRaw.id
    const scoreMin: number = recentCompRaw.score_min ?? 1
    const scoreMax: number = recentCompRaw.score_max ?? 10
    const awardTypes: { id: string; name: string; icon?: string }[] = (recentCompRaw.award_types ?? []) as { id: string; name: string; icon?: string }[]
    const awardsEnabled: boolean = recentCompRaw.awards_enabled ?? false

    // Categories
    const { data: categoriesRaw } = await supabase
      .from('competition_categories')
      .select('id, name')
      .eq('competition_id', compId)
      .order('created_at')

    const categoryMap: Record<string, string> = {}
    for (const cat of (categoriesRaw ?? [])) categoryMap[cat.id] = cat.name

    // All submissions with nested image + member info
    const { data: subsRaw } = await supabase
      .from('submissions')
      .select('id, category_id, member_id, images(id, storage_path, title), profiles!member_id(id, display_name)')
      .eq('competition_id', compId)
      .eq('status', 'submitted')

    const submissionIds: string[] = (subsRaw ?? []).map((s: { id: string }) => s.id)

    // All scores
    const { data: scoresRaw } = await supabase
      .from('scores')
      .select('submission_id, score, award_id')
      .in('submission_id', submissionIds.length > 0 ? submissionIds : ['00000000-0000-0000-0000-000000000000'])

    // Build score map: submission_id → { scores[], award_id }
    type ScoreRow = { submission_id: string; score: number; award_id: string | null }
    const scoresBySubmission: Record<string, ScoreRow[]> = {}
    for (const row of (scoresRaw ?? [])) {
      if (!scoresBySubmission[row.submission_id]) scoresBySubmission[row.submission_id] = []
      scoresBySubmission[row.submission_id].push(row)
    }

    // Build SubmissionResult array with average scores
    const results: SubmissionResult[] = []
    for (const sub of (subsRaw ?? [])) {
      const img     = sub.images
      const profile = sub.profiles
      if (!img || !profile) continue
      const subScores = scoresBySubmission[sub.id] ?? []
      if (subScores.length === 0) continue  // unscored — skip
      const avg = subScores.reduce((s: number, r: ScoreRow) => s + r.score, 0) / subScores.length
      results.push({
        id:          sub.id,
        category_id: sub.category_id,
        member_id:   sub.member_id,
        image_id:    img.id,
        imageTitle:  img.title,
        storagePath: img.storage_path,
        memberName:  profile.display_name,
        memberId:    profile.id,
        avgScore:    avg,
        awardId:     subScores[0]?.award_id ?? null,
      })
    }

    // Score distribution (all individual score values)
    const allScoreValues: number[] = (scoresRaw ?? []).map((r: ScoreRow) => r.score)
    const distMap: Record<number, number> = {}
    for (const v of allScoreValues) distMap[v] = (distMap[v] ?? 0) + 1
    const distribution = Object.entries(distMap)
      .map(([s, c]) => ({ score: Number(s), count: c }))
      .sort((a, b) => a.score - b.score)

    const average = allScoreValues.length > 0
      ? allScoreValues.reduce((a, b) => a + b, 0) / allScoreValues.length
      : 0

    // Top result per category (sorted by avgScore desc within each category, top = index 0)
    const topByCategory: CategoryResult[] = []
    const categories = categoriesRaw ?? []
    const maxCats = settings.topImageCount

    // Sort results by avg score descending within each category to get placement
    for (const cat of categories) {
      const catResults = results
        .filter(r => r.category_id === cat.id)
        .sort((a, b) => b.avgScore - a.avgScore)

      if (catResults.length === 0) continue
      topByCategory.push({
        categoryId:   cat.id,
        categoryName: cat.name,
        top:          catResults[0],
        placement:    1,
      })
    }

    // Sort categories by their top score descending, then trim to maxCats
    topByCategory.sort((a, b) => b.top.avgScore - a.top.avgScore)
    const shownCategories = settings.showTopImages ? topByCategory.slice(0, maxCats) : []

    recentResult = {
      id:            compId,
      title:         recentCompRaw.title,
      short_title:   recentCompRaw.short_title,
      totalImages:   results.length,
      categoryCount: categories.length,
      average,
      distribution,
      topByCategory: shownCategories,
      scoreMin,
      scoreMax,
      awardTypes,
      awardsEnabled,
    }

    // Member's own result
    if (settings.showMemberResult && userId) {
      const memberResults = results
        .filter(r => r.member_id === userId)
        .sort((a, b) => b.avgScore - a.avgScore)

      if (memberResults.length > 0) {
        const best = memberResults[0]
        const catResults = results
          .filter(r => r.category_id === best.category_id)
          .sort((a, b) => b.avgScore - a.avgScore)
        const placement = catResults.findIndex(r => r.id === best.id) + 1

        memberOwnResult = {
          imageTitle:   best.imageTitle,
          storagePath:  best.storagePath,
          categoryName: categoryMap[best.category_id] ?? 'Unknown',
          score:        best.avgScore,
          placement,
        }
      }
    }
  }

  // ── 3. Upcoming competitions ──────────────────────────────────────────────
  type UpcomingComp = { id: string; title: string; short_title: string | null; opens_at: string }
  let upcomingComps: UpcomingComp[] = []

  if (settings.showComingSoon) {
    const { data: upcomingRaw } = await supabase
      .from('competitions')
      .select('id, title, short_title, opens_at')
      .eq('status', 'draft')
      .not('opens_at', 'is', null)
      .gt('opens_at', new Date().toISOString())
      .order('opens_at', { ascending: true })
      .limit(1)

    upcomingComps = (upcomingRaw ?? []) as UpcomingComp[]
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  const hasAnything = openComps.length > 0 || judgingComps.length > 0 || recentResult || upcomingComps.length > 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="border-b border-[var(--border-subtle)] py-7 last:border-b-0">
      {/* Block heading */}
      <h2 style={{
        fontFamily:    'var(--font-lora, Georgia, serif)',
        fontSize:      18,
        fontWeight:    700,
        letterSpacing: '-0.01em',
        color:         'var(--text-primary)',
        marginBottom:  20,
        lineHeight:    1.3,
      }}>
        {settings.heading}
      </h2>

      {!hasAnything ? (
        /* Empty state */
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic', marginBottom: 16 }}>
            No competitions yet. Check back soon — your club admin will announce upcoming competitions here.
          </p>
          <Link href="/competitions" style={{ fontSize: 13, fontWeight: 600, color: 'var(--action-primary)', textDecoration: 'none' }}>
            View all competitions →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Zone 1 — Open now */}
          {openComps.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--action-primary)', marginBottom: 10 }}>
                Open now
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {openComps.map(comp => (
                  <OpenCompCard key={comp.id} comp={comp} userId={userId} />
                ))}
              </div>
            </div>
          )}

          {/* Zone 1b — Judging in progress */}
          {judgingComps.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--status-warning)', marginBottom: 10 }}>
                Judging in progress
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {judgingComps.map(comp => (
                  <div key={comp.id} style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          10,
                    padding:      '10px 14px 10px 12px',
                    borderRadius: 10,
                    border:       '1px solid var(--border-default)',
                    borderLeft:   '3px solid var(--status-warning)',
                    background:   'var(--phase-warning-bg)',
                  }}>
                    <span style={{ fontSize: 15, color: 'var(--status-warning)', flexShrink: 0, lineHeight: 1 }}>◐</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-lora, Georgia, serif)', flex: 1, minWidth: 0 }}>
                      {displayName(comp)}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>
                      Judging in progress
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Zone 2 — Recently published results */}
          {recentResult && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 12 }}>
                Latest results
              </p>

              {/* Competition header */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-lora, Georgia, serif)', lineHeight: 1.3 }}>
                  {displayName(recentResult)}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                  {recentResult.totalImages} {recentResult.totalImages === 1 ? 'image' : 'images'}
                  {' · '}
                  {recentResult.categoryCount} {recentResult.categoryCount === 1 ? 'category' : 'categories'}
                </p>
              </div>

              {/* Score distribution chart — hidden on mobile via CSS */}
              {settings.showScoreChart && recentResult.distribution.length > 0 && (
                <>
                  {/* Desktop chart */}
                  <div className="hidden sm:block" style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                      Score distribution
                    </p>
                    <ScoreChart
                      distribution={recentResult.distribution}
                      scoreMin={recentResult.scoreMin}
                      scoreMax={recentResult.scoreMax}
                      average={recentResult.average}
                    />
                  </div>
                  {/* Mobile — just stats line */}
                  <div className="sm:hidden" style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      Average score: <strong style={{ color: 'var(--text-primary)' }}>{recentResult.average.toFixed(1)}</strong>
                      {' · '}{recentResult.totalImages} images
                      {' · '}{recentResult.categoryCount} categories
                    </p>
                  </div>
                </>
              )}

              {/* Top images per category */}
              {settings.showTopImages && recentResult.topByCategory.length > 0 && (
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(recentResult.topByCategory.length, settings.topImageCount)}, minmax(0, 1fr))`,
                  }}
                >
                  {recentResult.topByCategory.map(catResult => {
                    const publicUrl = supabaseRaw.storage
                      .from('images')
                      .getPublicUrl(catResult.top.storagePath).data.publicUrl
                    return (
                      <TopImageCard
                        key={catResult.categoryId}
                        result={catResult}
                        publicUrl={publicUrl}
                        compId={recentResult!.id}
                        showAward={recentResult!.awardsEnabled}
                        awardTypes={recentResult!.awardTypes}
                      />
                    )
                  })}
                </div>
              )}

              {/* Member's own result */}
              {settings.showMemberResult && memberOwnResult && (
                <div style={{
                  marginTop:    16,
                  padding:      '12px 16px',
                  background:   'var(--surface-1)',
                  borderRadius: 8,
                  border:       '1px solid var(--border-subtle)',
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                    Your result
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative', width: 52, height: 40, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-0)' }}>
                      <Image
                        src={supabaseRaw.storage.from('images').getPublicUrl(memberOwnResult.storagePath).data.publicUrl}
                        alt={memberOwnResult.imageTitle}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="52px"
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {memberOwnResult.imageTitle}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {memberOwnResult.categoryName}
                        {' · '}
                        Score: <strong>{memberOwnResult.score.toFixed(1)}</strong>
                        {' · '}
                        {ordinal(memberOwnResult.placement)} place
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Zone 3 — Coming soon */}
          {settings.showComingSoon && upcomingComps.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                Coming up
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {upcomingComps.map(comp => {
                  const openLabel = comp.opens_at
                    ? new Date(comp.opens_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                    : null
                  return (
                    <p key={comp.id} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{displayName(comp)}</span>
                      {openLabel && <span style={{ color: 'var(--text-tertiary)' }}> · Submissions open {openLabel}</span>}
                    </p>
                  )
                })}
              </div>
            </div>
          )}

          {/* Zone 4 — Footer */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
            <Link
              href="/competitions"
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--action-primary)', textDecoration: 'none' }}
            >
              View all competitions →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

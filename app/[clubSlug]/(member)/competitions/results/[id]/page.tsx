import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug } from '@/lib/club-context'
import ResultsClient from './ResultsClient'
import type { AwardTier } from '@/types/competition'

export const dynamic = 'force-dynamic'

// ─── Score aggregation ────────────────────────────────────────────────────────

function aggregateScores(scores: number[], method: string): number {
  const sum = scores.reduce((a, b) => a + b, 0)
  if (method === 'sum') return sum
  if (method === 'drop_extremes' && scores.length >= 3) {
    const sorted = [...scores].sort((a, b) => a - b)
    const trimmed = sorted.slice(1, -1)
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length
  }
  return sum / scores.length // 'average' or fallback
}

function resolveAwardId(awardIds: (string | null)[]): string | null {
  const valid = awardIds.filter(Boolean) as string[]
  if (valid.length === 0) return null
  const counts = new Map<string, number>()
  for (const id of valid) counts.set(id, (counts.get(id) ?? 0) + 1)
  let best: string | null = null
  let max = 0
  for (const [id, n] of counts) { if (n > max) { max = n; best = id } }
  return best
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type RankedEntry = {
  rank: number
  submissionId: string
  imageTitle: string
  imageUrl: string
  memberName: string
  aggregatedScore: number | null
  awardId: string | null
  awardLabel: string | null
  judgeNotes: string[]
}

export type CategoryResults = {
  categoryId: string
  categoryName: string
  entries: RankedEntry[]
}

export type ResultsData = {
  id: string
  title: string
  closesAt: string | null
  resultsAt: string | null
  judgeNames: string[]
  scoreAggregation: string
  awardsEnabled: boolean
  hasScores: boolean
  categories: CategoryResults[]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CompetitionResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const clubSlug = await requireClubSlug()
  const supabase = await createClient()
  const admin = createServiceClient()

  // Fetch competition (closed only — results aren't visible during judging)
  const { data: comp } = await supabase
    .from('competitions')
    .select(`
      id, title, closes_at, results_at,
      score_aggregation, awards_enabled, award_types,
      competition_categories(id, name, sort_order),
      judge_tokens(judge_name)
    `)
    .eq('id', id)
    .eq('status', 'closed')
    .is('deleted_at', null)
    .single()

  if (!comp) notFound()

  // Fetch all submitted entries for this competition
  const { data: rawSubs } = await supabase
    .from('submissions')
    .select(`
      id, member_id, category_id,
      images(title, storage_path),
      profiles(display_name, first_name, last_name),
      scores(score, rank, award_id, notes),
      competition_categories(id, name)
    `)
    .eq('competition_id', id)
    .eq('status', 'submitted')

  const subs = rawSubs ?? []

  // Build award lookup from JSONB
  const awardTypes = ((comp as unknown as { award_types: AwardTier[] }).award_types ?? []) as AwardTier[]
  const awardMap = new Map<string, string>(awardTypes.map(a => [a.id, a.label]))

  // Sort categories by sort_order
  type RawCat = { id: string; name: string; sort_order?: number | null }
  const rawCats = (comp.competition_categories as unknown as RawCat[]) ?? []
  const sortedCats = [...rawCats].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  // Aggregate scores and group entries by category
  let hasScores = false
  const byCat = new Map<string, RankedEntry[]>()

  for (const sub of subs) {
    const img     = sub.images as unknown as { title: string; storage_path: string }
    const profile = sub.profiles as unknown as { display_name: string | null; first_name: string | null; last_name: string | null }
    const scores  = (sub.scores as unknown as { score: number | null; rank: number | null; award_id: string | null; notes: string | null }[]) ?? []

    const validScores = scores.filter(s => s.score !== null).map(s => s.score as number)
    if (validScores.length > 0) hasScores = true

    const aggregatedScore = validScores.length > 0
      ? aggregateScores(validScores, comp.score_aggregation ?? 'sum')
      : null

    const awardId    = resolveAwardId(scores.map(s => s.award_id))
    const awardLabel = awardId ? (awardMap.get(awardId) ?? null) : null
    const judgeNotes = scores.map(s => s.notes).filter(Boolean) as string[]

    const imageUrl   = admin.storage.from('images').getPublicUrl(img?.storage_path ?? '').data.publicUrl
    const memberName = profile?.display_name
      || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
      || 'Unknown'

    const entry: RankedEntry = {
      rank: 0, // assigned below
      submissionId: sub.id,
      imageTitle:   img?.title ?? 'Untitled',
      imageUrl,
      memberName,
      aggregatedScore,
      awardId,
      awardLabel,
      judgeNotes,
    }

    const catId = sub.category_id
    if (!byCat.has(catId)) byCat.set(catId, [])
    byCat.get(catId)!.push(entry)
  }

  // Sort and assign ranks within each category
  const categories: CategoryResults[] = sortedCats
    .filter(cat => byCat.has(cat.id))
    .map(cat => {
      const entries = byCat.get(cat.id)!

      // Primary: aggregated score DESC (nulls last); Secondary: submission order
      entries.sort((a, b) => {
        if (a.aggregatedScore === null && b.aggregatedScore === null) return 0
        if (a.aggregatedScore === null) return 1
        if (b.aggregatedScore === null) return -1
        return b.aggregatedScore - a.aggregatedScore
      })

      // Assign ranks — tied scores share the same rank
      let currentRank = 1
      for (let i = 0; i < entries.length; i++) {
        if (i > 0 && entries[i].aggregatedScore !== entries[i - 1].aggregatedScore) {
          currentRank = i + 1
        }
        entries[i].rank = currentRank
      }

      return { categoryId: cat.id, categoryName: cat.name, entries }
    })

  const judgeNames = ((comp.judge_tokens as unknown as { judge_name: string }[]) ?? [])
    .map(j => j.judge_name)
    .filter(Boolean)

  const data: ResultsData = {
    id:               comp.id,
    title:            comp.title,
    closesAt:         (comp as unknown as { closes_at: string | null }).closes_at ?? null,
    resultsAt:        (comp as unknown as { results_at: string | null }).results_at ?? null,
    judgeNames,
    scoreAggregation: comp.score_aggregation ?? 'sum',
    awardsEnabled:    (comp as unknown as { awards_enabled: boolean }).awards_enabled ?? false,
    hasScores,
    categories,
  }

  return <ResultsClient data={data} clubSlug={clubSlug} />
}

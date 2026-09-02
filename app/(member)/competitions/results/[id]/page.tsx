import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ResultsClient from './ResultsClient'

export type Entry = {
  submissionId: string
  imageUrl: string
  imageTitle: string
  memberName: string
  categoryId: string
  categoryName: string
  score: number | null
  awardId: string | null
}

export type ResultsData = {
  id: string
  title: string
  closesAt: string | null
  judgeNames: string[]
  categories: { id: string; name: string }[]
  totalImages: number
  membersSubmitted: number
  totalMembers: number
  averageScore: number | null
  entries: Entry[]
  mySubmissionIds: string[]
}

export default async function ResultsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Competition + categories + judges
  const { data: comp } = await supabase
    .from('competitions')
    .select('id, title, closes_at, competition_categories(id, name), judge_tokens(judge_name)')
    .eq('id', id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .in('status', ['results_published', 'closed'] as any)
    .single()

  if (!comp) notFound()

  const categories = (comp.competition_categories as unknown as { id: string; name: string }[]) ?? []
  const judgeNames = (
    (comp.judge_tokens as unknown as { judge_name: string }[] | null) ?? []
  ).map(t => t.judge_name)

  // All submitted entries with image + member info
  const { data: subsRaw } = await supabase
    .from('submissions')
    .select(
      'id, member_id, category_id, images(title, storage_path), profiles(display_name), competition_categories(name)',
    )
    .eq('competition_id', id)
    .eq('status', 'submitted')

  const subs = subsRaw ?? []

  // Scores for all submissions in this competition
  const { data: scoresRaw } = await supabase
    .from('scores')
    .select('submission_id, score')
    .in(
      'submission_id',
      subs.map(s => s.id),
    )

  // Group scores by submission_id and average them
  const scoreMap = new Map<string, { total: number; count: number; awardId: string | null }>()
  for (const s of (scoresRaw as { submission_id: string; score: number }[] | null) ?? []) {
    const existing = scoreMap.get(s.submission_id)
    if (existing) {
      existing.total += s.score
      existing.count += 1
    } else {
      scoreMap.set(s.submission_id, { total: s.score, count: 1, awardId: null })
    }
  }

  // Build entries list
  const catMap = new Map(categories.map(c => [c.id, c.name]))
  const entries: Entry[] = subs.map(sub => {
    const img = sub.images as unknown as { title: string; storage_path: string } | null
    const profile = sub.profiles as unknown as { display_name: string } | null
    const scoreData = scoreMap.get(sub.id)
    const avgScore = scoreData ? scoreData.total / scoreData.count : null

    return {
      submissionId: sub.id,
      imageUrl: img
        ? supabase.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl
        : '',
      imageTitle: img?.title ?? 'Untitled',
      memberName: profile?.display_name ?? 'Unknown',
      categoryId: sub.category_id,
      categoryName: catMap.get(sub.category_id) ?? 'Unknown',
      score: avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
      awardId: scoreData?.awardId ?? null,
    }
  })

  // Sort by score desc (nulls last)
  entries.sort((a, b) => {
    if (a.score === null && b.score === null) return 0
    if (a.score === null) return 1
    if (b.score === null) return -1
    return b.score - a.score
  })

  // Aggregate stats
  const totalImages = entries.length
  const memberIds = new Set(subs.map(s => s.member_id))
  const membersSubmitted = memberIds.size

  const scoredEntries = entries.filter(e => e.score !== null)
  const averageScore =
    scoredEntries.length > 0
      ? Math.round(
          (scoredEntries.reduce((sum, e) => sum + (e.score ?? 0), 0) / scoredEntries.length) * 100,
        ) / 100
      : null

  // Total active members in club
  const { count: totalMembers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('membership_status', 'active')

  const mySubmissionIds = subs
    .filter(s => s.member_id === user.id)
    .map(s => s.id)

  const data: ResultsData = {
    id: comp.id,
    title: comp.title,
    closesAt: comp.closes_at,
    judgeNames,
    categories,
    totalImages,
    membersSubmitted,
    totalMembers: totalMembers ?? 0,
    averageScore,
    entries,
    mySubmissionIds,
  }

  return <ResultsClient data={data} />
}

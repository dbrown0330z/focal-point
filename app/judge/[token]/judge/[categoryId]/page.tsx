import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import JudgingClient from './JudgingClient'

export type SubmissionForJudge = {
  id:          string
  entryNumber: number
  imageTitle:  string
  description: string | null
  thumbUrl:    string
  fullUrl:     string
  score:       number | null
  notes:       string | null
  rank:        number | null
  flagged:     boolean
  memberName:  string | null
  exifData:    Record<string, unknown> | null
}

export default async function JudgeCategoryPage({
  params,
}: {
  params: Promise<{ token: string; categoryId: string }>
}) {
  const { token, categoryId } = await params

  // Session guard
  const cookieStore = await cookies()
  if (cookieStore.get(`jv_${token}`)?.value !== '1') {
    redirect(`/judge/${token}/access`)
  }

  const supabase = createServiceClient()

  const { data: judgeToken } = await supabase
    .from('judge_tokens')
    .select(`id, judge_name, competition_id, submitted_at,
             competitions(title, status, score_min, score_max,
                          allow_half_points, anonymise_members, anonymise_exif,
                          require_feedback)`)
    .eq('token', token)
    .single()

  const competition = judgeToken?.competitions as unknown as {
    title:             string
    status:            string
    score_min:         number
    score_max:         number
    allow_half_points: boolean
    anonymise_members: boolean
    anonymise_exif:    boolean
    require_feedback:  boolean
  } | null

  if (!judgeToken || competition?.status !== 'judging') {
    redirect(`/judge/${token}/expired`)
  }

  // Validate category belongs to this competition
  const { data: category } = await supabase
    .from('competition_categories')
    .select('id, name')
    .eq('id', categoryId)
    .eq('competition_id', judgeToken.competition_id)
    .single()

  if (!category) redirect(`/judge/${token}/landing`)

  // All categories (for navigation)
  const { data: allCategories } = await supabase
    .from('competition_categories')
    .select('id, name')
    .eq('competition_id', judgeToken.competition_id)
    .order('created_at')

  // Submissions for this category
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, member_id, images(title, description, storage_path, exif_data), profiles!member_id(display_name)')
    .eq('competition_id', judgeToken.competition_id)
    .eq('category_id', categoryId)
    .eq('status', 'submitted')
    .order('submitted_at')

  // Existing scores from this judge for these submissions
  const { data: scores } = await supabase
    .from('scores')
    .select('submission_id, score, notes, rank, flagged')
    .eq('judge_token_id', judgeToken.id)
    .in('submission_id', submissions?.map(s => s.id) ?? [])

  const scoreMap = new Map(scores?.map(s => [s.submission_id, {
    score:   s.score,
    notes:   s.notes,
    rank:    s.rank,
    flagged: s.flagged,
  }]) ?? [])

  // Build public URLs and hydrate — entry number is 1-based position in submission order
  const items: SubmissionForJudge[] = (submissions ?? []).map((sub, idx) => {
    const image   = sub.images as unknown as { title: string; description: string | null; storage_path: string; exif_data: Record<string, unknown> | null }
    const profile = sub.profiles as unknown as { display_name: string } | null
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(image.storage_path)
    const existing = scoreMap.get(sub.id)
    return {
      id:          sub.id,
      entryNumber: idx + 1,
      imageTitle:  image.title,
      description: image.description ?? null,
      thumbUrl:    publicUrl,
      fullUrl:     publicUrl,
      score:       existing?.score ?? null,
      notes:       existing?.notes ?? null,
      rank:        existing?.rank ?? null,
      flagged:     existing?.flagged ?? false,
      memberName:  profile?.display_name ?? null,
      exifData:    image.exif_data ?? null,
    }
  })

  const categoryIds = (allCategories ?? []).map(c => c.id)
  const currentIdx  = categoryIds.indexOf(categoryId)
  const prevCatId   = currentIdx > 0 ? categoryIds[currentIdx - 1] : null
  const nextCatId   = currentIdx < categoryIds.length - 1 ? categoryIds[currentIdx + 1] : null

  return (
    <JudgingClient
      token={token}
      categoryId={categoryId}
      categoryName={category.name}
      submissions={items}
      prevCategoryId={prevCatId}
      nextCategoryId={nextCatId}
      allCategories={(allCategories ?? []).map(c => ({ id: c.id, name: c.name }))}
      scoreMin={competition?.score_min ?? 1}
      scoreMax={competition?.score_max ?? 10}
      allowHalfPoints={competition?.allow_half_points ?? false}
      requireFeedback={competition?.require_feedback ?? false}
      showMemberName={!(competition?.anonymise_members ?? true)}
      showExif={!(competition?.anonymise_exif ?? true)}
      isSubmitted={!!judgeToken.submitted_at}
    />
  )
}

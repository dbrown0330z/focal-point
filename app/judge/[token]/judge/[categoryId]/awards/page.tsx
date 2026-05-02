import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import AwardsClient from './AwardsClient'
import type { AwardTier } from '@/types/competition'

export type SubmissionForAwards = {
  id:          string
  entryNumber: number
  imageTitle:  string
  thumbUrl:    string
  fullUrl:     string
  score:       number | null
  awardId:     string | null
  memberName:  string | null
}

export default async function AwardsPage({
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

  const supabase = await createClient()

  const { data: judgeToken } = await supabase
    .from('judge_tokens')
    .select(`id, judge_name, competition_id, submitted_at,
             competitions(title, status, preset, awards_enabled, award_types, anonymise_members)`)
    .eq('token', token)
    .single()

  const competition = judgeToken?.competitions as unknown as {
    title:             string
    status:            string
    preset:            string
    awards_enabled:    boolean
    award_types:       AwardTier[]
    anonymise_members: boolean
  } | null

  if (!judgeToken || competition?.status !== 'judging') {
    redirect(`/judge/${token}/expired`)
  }

  // Only accessible if awards are enabled (or awards-only preset)
  if (!competition.awards_enabled && competition.preset !== 'awards-only') {
    redirect(`/judge/${token}/landing`)
  }

  // Validate category belongs to this competition
  const { data: category } = await supabase
    .from('competition_categories')
    .select('id, name')
    .eq('id', categoryId)
    .eq('competition_id', judgeToken.competition_id)
    .single()

  if (!category) redirect(`/judge/${token}/landing`)

  // All categories for navigation
  const { data: allCategories } = await supabase
    .from('competition_categories')
    .select('id, name')
    .eq('competition_id', judgeToken.competition_id)
    .order('created_at')

  // Submissions for this category
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, member_id, images(title, storage_path), profiles!member_id(display_name)')
    .eq('competition_id', judgeToken.competition_id)
    .eq('category_id', categoryId)
    .eq('status', 'submitted')
    .order('submitted_at')

  // Scores for this judge in this category (for score display + award_id)
  const submissionIds = submissions?.map(s => s.id) ?? []
  const { data: scores } = await supabase
    .from('scores')
    .select('submission_id, score, award_id')
    .eq('judge_token_id', judgeToken.id)
    .in('submission_id', submissionIds)

  const scoreMap = new Map(scores?.map(s => [s.submission_id, { score: s.score, awardId: s.award_id }]) ?? [])

  // Check if this category's awards pass has been completed
  const { data: completion } = await supabase
    .from('judge_category_awards')
    .select('completed_at')
    .eq('judge_token_id', judgeToken.id)
    .eq('category_id', categoryId)
    .maybeSingle()

  const isAwardsOnly   = competition.preset === 'awards-only'
  const showMemberName = !(competition.anonymise_members ?? true)
  const awardTypes     = (competition.award_types ?? []) as AwardTier[]

  const items: SubmissionForAwards[] = (submissions ?? []).map((sub, idx) => {
    const image   = sub.images as unknown as { title: string; storage_path: string }
    const profile = sub.profiles as unknown as { display_name: string } | null
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(image.storage_path)
    const existing = scoreMap.get(sub.id)
    return {
      id:          sub.id,
      entryNumber: idx + 1,
      imageTitle:  image.title,
      thumbUrl:    publicUrl,
      fullUrl:     publicUrl,
      score:       existing?.score ?? null,
      awardId:     existing?.awardId ?? null,
      memberName:  showMemberName ? (profile?.display_name ?? null) : null,
    }
  })

  // Sort: scored preset → by score desc; awards-only → submission order (already ordered)
  if (!isAwardsOnly) {
    items.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  }

  const categoryIds = (allCategories ?? []).map(c => c.id)
  const currentIdx  = categoryIds.indexOf(categoryId)
  const prevCatId   = currentIdx > 0 ? categoryIds[currentIdx - 1] : null
  const nextCatId   = currentIdx < categoryIds.length - 1 ? categoryIds[currentIdx + 1] : null

  return (
    <AwardsClient
      token={token}
      categoryId={categoryId}
      categoryName={category.name}
      submissions={items}
      awardTypes={awardTypes}
      isAwardsOnly={isAwardsOnly}
      alreadyComplete={!!completion}
      prevCategoryId={prevCatId}
      nextCategoryId={nextCatId}
      allCategories={(allCategories ?? []).map(c => ({ id: c.id, name: c.name }))}
      isSubmitted={!!judgeToken.submitted_at}
    />
  )
}

'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug } from '@/lib/club-context'

export async function moveSubmissionCategory(
  submissionId: string,
  newCategoryId: string,
  competitionId: string,
): Promise<{ error?: string }> {
  const admin = createServiceClient()
  const { error } = await admin
    .from('submissions')
    .update({ category_id: newCategoryId })
    .eq('id', submissionId)

  if (error) return { error: error.message }

  const clubSlug = await requireClubSlug()
  revalidatePath(`/${clubSlug}/admin/competitions/${competitionId}/entries`)
  return {}
}

export async function removeSubmission(
  submissionId: string,
  competitionId: string,
): Promise<{ error?: string }> {
  const admin = createServiceClient()
  // Withdraw rather than delete — preserves the audit record and frees the image
  const { error } = await admin
    .from('submissions')
    .update({ status: 'withdrawn' })
    .eq('id', submissionId)

  if (error) return { error: error.message }

  const clubSlug = await requireClubSlug()
  revalidatePath(`/${clubSlug}/admin/competitions/${competitionId}/entries`)
  revalidatePath(`/${clubSlug}/admin/competitions/${competitionId}`)
  return {}
}

export async function reinstateSubmission(
  submissionId: string,
  competitionId: string,
): Promise<{ error?: string }> {
  const admin = createServiceClient()
  const { error } = await admin
    .from('submissions')
    .update({ status: 'submitted' })
    .eq('id', submissionId)

  if (error) return { error: error.message }

  const clubSlug = await requireClubSlug()
  revalidatePath(`/${clubSlug}/admin/competitions/${competitionId}/entries`)
  revalidatePath(`/${clubSlug}/admin/competitions/${competitionId}`)
  return {}
}

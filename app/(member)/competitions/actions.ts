'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { SupabaseClient } from '@supabase/supabase-js'

async function guardOpenCompetition(admin: SupabaseClient, competitionId: string, userId: string) {
  const { data: comp } = await admin
    .from('competitions')
    .select('status, submission_limit')
    .eq('id', competitionId)
    .single()
  if (comp?.status !== 'open') throw new Error('Competition is not open for submissions')

  const { count } = await admin
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('competition_id', competitionId)
    .eq('member_id', userId)
    .eq('status', 'submitted')
  if ((count ?? 0) >= (comp.submission_limit ?? 0)) throw new Error('Submission limit reached')
}

export async function submitFromLibrary(
  imageId: string,
  competitionId: string,
  categoryId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createServiceClient()
  try {
    await guardOpenCompetition(admin, competitionId, user.id)
  } catch (e) {
    return { error: (e as Error).message }
  }

  const { error } = await admin.from('submissions').insert({
    competition_id: competitionId,
    category_id: categoryId,
    image_id: imageId,
    member_id: user.id,
  })

  if (error) {
    const msg = error.code === '23505'
      ? 'That photo is already submitted to a competition'
      : error.message
    return { error: msg }
  }

  revalidatePath('/competitions')
  return { error: null }
}

export async function submitUploadedImage(data: {
  storagePath: string
  title: string
  exifData: Record<string, unknown> | null
  competitionId: string
  categoryId: string
}): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createServiceClient()
  try {
    await guardOpenCompetition(admin, data.competitionId, user.id)
  } catch (e) {
    return { error: (e as Error).message }
  }

  const { data: img, error: imgErr } = await admin.from('images').insert({
    owner_id: user.id,
    title: data.title,
    storage_path: data.storagePath,
    exif_data: data.exifData,
  }).select('id').single()

  if (imgErr || !img) return { error: imgErr?.message ?? 'Failed to save image' }

  const { error: subErr } = await admin.from('submissions').insert({
    competition_id: data.competitionId,
    category_id: data.categoryId,
    image_id: img.id,
    member_id: user.id,
  })

  if (subErr) {
    await admin.from('images').delete().eq('id', img.id)
    const msg = subErr.code === '23505'
      ? 'That photo is already submitted to a competition'
      : subErr.message
    return { error: msg }
  }

  revalidatePath('/competitions')
  return { error: null }
}

export async function withdrawFromCompetition(
  submissionId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createServiceClient()
  const { error } = await admin
    .from('submissions')
    .update({ status: 'withdrawn' })
    .eq('id', submissionId)
    .eq('member_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/competitions')
  return { error: null }
}

export async function editImageTitleAction(
  imageId: string,
  newTitle: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createServiceClient()
  const { error } = await admin
    .from('images')
    .update({ title: newTitle.trim() })
    .eq('id', imageId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/competitions')
  return { error: null }
}

export async function changeCategoryAction(
  submissionId: string,
  newCategoryId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createServiceClient()
  const { data: sub } = await admin
    .from('submissions')
    .select('competition_id')
    .eq('id', submissionId)
    .eq('member_id', user.id)
    .single()

  if (!sub) return { error: 'Submission not found' }

  const { data: comp } = await admin
    .from('competitions')
    .select('status')
    .eq('id', sub.competition_id)
    .single()

  if (comp?.status !== 'open') return { error: 'Category can only be changed while submissions are open' }

  const { error } = await admin
    .from('submissions')
    .update({ category_id: newCategoryId })
    .eq('id', submissionId)
    .eq('member_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/competitions')
  return { error: null }
}

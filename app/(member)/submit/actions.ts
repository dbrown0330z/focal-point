'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type SubmitInput = {
  competitionId: string
  categoryId:    string
  imageSource:   'upload' | 'library'
  // Upload path
  storagePath?:   string
  fileSize?:      number
  widthPx?:       number
  heightPx?:      number
  exifData?:      Record<string, unknown> | null
  exifUniqueId?:  string | null
  pHash?:         string | null
  // Library path
  libraryImageId?: string
  // Shared
  title:                   string
  notes?:                  string
  duplicateWarningShown:   boolean
  duplicateWarningOverride: boolean
}

export type SubmitResult =
  | { ok: true;  submissionId: string; entryNum: number; entriesRemaining: number }
  | { ok: false; error: string }

export async function finalizeSubmission(input: SubmitInput): Promise<SubmitResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  // ── Validate competition ────────────────────────────────────────────────────
  const { data: comp } = await supabase
    .from('competitions')
    .select('status, submission_limit, max_entries_per_category')
    .eq('id', input.competitionId)
    .single()

  if (!comp) return { ok: false, error: 'Competition not found.' }
  if (comp.status !== 'open') return { ok: false, error: 'This competition is not open for submissions.' }

  // ── Check overall entry limit ───────────────────────────────────────────────
  const { count: memberCount } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('competition_id', input.competitionId)
    .eq('member_id', user.id)
    .eq('status', 'submitted')

  if ((memberCount ?? 0) >= comp.submission_limit) {
    return { ok: false, error: `You've reached the maximum of ${comp.submission_limit} entries for this competition.` }
  }

  // ── Check per-category limit ────────────────────────────────────────────────
  const maxPerCat = (comp as Record<string, unknown>).max_entries_per_category as number | null
  if (maxPerCat) {
    const { count: catCount } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('competition_id', input.competitionId)
      .eq('category_id', input.categoryId)
      .eq('member_id', user.id)
      .eq('status', 'submitted')

    if ((catCount ?? 0) >= maxPerCat) {
      return { ok: false, error: `You've reached the limit for this category.` }
    }
  }

  // ── Create or resolve image record ─────────────────────────────────────────
  let imageId: string

  if (input.imageSource === 'upload') {
    if (!input.storagePath || !input.title) return { ok: false, error: 'Missing required fields.' }

    const { data: newImage, error: imgErr } = await supabase
      .from('images')
      .insert({
        owner_id:       user.id,
        title:          input.title,
        storage_path:   input.storagePath,
        exif_data:      input.exifData ?? null,
        exif_unique_id: input.exifUniqueId ?? null,
        p_hash:         input.pHash ?? null,
        p_hash_status:  input.pHash ? 'complete' : 'failed',
        file_size:      input.fileSize ?? null,
        width_px:       input.widthPx ?? null,
        height_px:      input.heightPx ?? null,
      } as Record<string, unknown>)
      .select('id')
      .single()

    if (imgErr || !newImage) {
      return { ok: false, error: 'Failed to save image: ' + (imgErr?.message ?? 'unknown error') }
    }
    imageId = newImage.id
  } else {
    if (!input.libraryImageId) return { ok: false, error: 'No image selected.' }
    // Update title if changed on an existing library image
    await supabase
      .from('images')
      .update({ title: input.title })
      .eq('id', input.libraryImageId)
      .eq('owner_id', user.id)
    imageId = input.libraryImageId
  }

  // ── Create submission ───────────────────────────────────────────────────────
  const { data: submission, error: subErr } = await supabase
    .from('submissions')
    .insert({
      image_id:                  imageId,
      competition_id:            input.competitionId,
      category_id:               input.categoryId,
      member_id:                 user.id,
      notes:                     input.notes || null,
      duplicate_warning_shown:   input.duplicateWarningShown,
      duplicate_warning_override: input.duplicateWarningOverride,
    } as Record<string, unknown>)
    .select('id')
    .single()

  if (subErr || !submission) {
    // Clean up orphaned image record if the submission itself failed
    if (input.imageSource === 'upload') {
      await supabase.from('images').delete().eq('id', imageId).eq('owner_id', user.id)
    }
    const msg = subErr?.code === '23505'
      ? 'This image is already entered in another competition.'
      : (subErr?.message ?? 'Failed to submit entry.')
    return { ok: false, error: msg }
  }

  // ── Compute remaining entries for confirmation screen ──────────────────────
  const { count: newMemberCount } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('competition_id', input.competitionId)
    .eq('member_id', user.id)
    .eq('status', 'submitted')

  const { count: totalEntries } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('competition_id', input.competitionId)
    .eq('status', 'submitted')

  revalidatePath('/competitions')
  revalidatePath(`/competitions/${input.competitionId}`)
  revalidatePath('/library')
  revalidatePath('/submit')

  return {
    ok:               true,
    submissionId:     submission.id,
    entryNum:         totalEntries ?? 1,
    entriesRemaining: comp.submission_limit - (newMemberCount ?? 0),
  }
}

export async function withdrawSubmission(submissionId: string, competitionId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('submissions')
    .update({ status: 'withdrawn' })
    .eq('id', submissionId)
    .eq('member_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/competitions')
  revalidatePath(`/competitions/${competitionId}`)
  revalidatePath('/library')
  return { ok: true }
}

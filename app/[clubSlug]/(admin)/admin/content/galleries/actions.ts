'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext, requireClubSlug } from '@/lib/club-context'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const clubSlug = await requireClubSlug()
  if (!user) redirect(`/${clubSlug}/login`)
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect(`/${clubSlug}/admin`)
  return { user, clubSlug }
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'gallery'
}

async function uniqueSlug(base: string, clubId: string, excludeId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  let slug = base, i = 1
  while (true) {
    let q = db.from('club_galleries').select('id').eq('club_id', clubId).eq('slug', slug)
    if (excludeId) q = q.neq('id', excludeId)
    const { data } = await q.maybeSingle()
    if (!data) return slug
    slug = `${base}-${i++}`
  }
}

export async function createClubGallery(data: {
  name:        string
  description: string
  visibility:  'public' | 'members_only'
}): Promise<{ error: string | null; id?: string }> {
  const { clubSlug } = await requireAdmin()
  const ctx = await getClubContext()
  if (!ctx?.clubId) return { error: 'Club not found' }
  const name = data.name.trim()
  if (!name) return { error: 'Gallery name is required.' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db   = createServiceClient() as any
  const slug = await uniqueSlug(slugify(name), ctx.clubId)
  const { data: gallery, error } = await db.from('club_galleries').insert({
    club_id:     ctx.clubId,
    name,
    slug,
    description: data.description.trim() || null,
    visibility:  data.visibility,
  }).select('id').single()
  if (error) return { error: (error as { message: string }).message }
  revalidatePath(`/${clubSlug}/admin/content/navigation`)
  revalidatePath(`/${clubSlug}/our-club/galleries`)
  return { error: null, id: gallery.id }
}

export async function updateClubGalleryMeta(galleryId: string, data: {
  name:                 string
  description:          string
  visibility:           'public' | 'members_only'
  featured_on_homepage: boolean
}): Promise<{ error: string | null }> {
  const { clubSlug } = await requireAdmin()
  const ctx  = await getClubContext()
  const name = data.name.trim()
  if (!name) return { error: 'Gallery name is required.' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db   = createServiceClient() as any
  const slug = await uniqueSlug(slugify(name), ctx!.clubId, galleryId)
  const { error } = await db.from('club_galleries')
    .update({ name, slug, description: data.description.trim() || null, visibility: data.visibility, featured_on_homepage: data.featured_on_homepage })
    .eq('id', galleryId)
    .eq('club_id', ctx!.clubId)
  if (error) return { error: (error as { message: string }).message }
  revalidatePath(`/${clubSlug}/admin/content/navigation`)
  revalidatePath(`/${clubSlug}/our-club/galleries`)
  return { error: null }
}

export async function archiveClubGallery(galleryId: string): Promise<{ error: string | null }> {
  const { clubSlug } = await requireAdmin()
  const ctx = await getClubContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db  = createServiceClient() as any
  const { error } = await db.from('club_galleries')
    .update({ archived_at: new Date().toISOString(), featured_on_homepage: false })
    .eq('id', galleryId)
    .eq('club_id', ctx!.clubId)
  if (error) return { error: (error as { message: string }).message }
  revalidatePath(`/${clubSlug}/admin/content/navigation`)
  revalidatePath(`/${clubSlug}/our-club/galleries`)
  return { error: null }
}

export async function deleteClubGallery(galleryId: string): Promise<{ error: string | null }> {
  const { clubSlug } = await requireAdmin()
  const ctx = await getClubContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db  = createServiceClient() as any
  const { error } = await db.from('club_galleries')
    .delete()
    .eq('id', galleryId)
    .eq('club_id', ctx!.clubId)
  if (error) return { error: (error as { message: string }).message }
  revalidatePath(`/${clubSlug}/admin/content/navigation`)
  revalidatePath(`/${clubSlug}/our-club/galleries`)
  return { error: null }
}

export async function setClubGalleryCover(galleryId: string, submissionId: string | null): Promise<{ error: string | null }> {
  const { clubSlug } = await requireAdmin()
  const ctx = await getClubContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db  = createServiceClient() as any
  const { error } = await db.from('club_galleries')
    .update({ cover_submission_id: submissionId })
    .eq('id', galleryId)
    .eq('club_id', ctx!.clubId)
  if (error) return { error: (error as { message: string }).message }
  revalidatePath(`/${clubSlug}/admin/content/navigation`)
  return { error: null }
}

export async function addImagesToClubGallery(galleryId: string, submissionIds: string[]): Promise<{ error: string | null }> {
  const { clubSlug } = await requireAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db  = createServiceClient() as any

  const { data: existing } = await db.from('club_gallery_images')
    .select('sort_order')
    .eq('gallery_id', galleryId)
    .order('sort_order', { ascending: false })
    .limit(1)
  const base = ((existing as { sort_order: number }[] | null)?.[0]?.sort_order ?? -1) + 1

  const rows = submissionIds.map((id, i) => ({
    gallery_id:    galleryId,
    submission_id: id,
    sort_order:    base + i,
  }))

  const { error } = await db.from('club_gallery_images')
    .upsert(rows, { onConflict: 'gallery_id,submission_id', ignoreDuplicates: true })
  if (error) return { error: (error as { message: string }).message }
  revalidatePath(`/${clubSlug}/admin/content/navigation`)
  return { error: null }
}

export async function removeFromClubGallery(galleryImageId: string): Promise<{ error: string | null }> {
  const { clubSlug } = await requireAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { error } = await db.from('club_gallery_images').delete().eq('id', galleryImageId)
  if (error) return { error: (error as { message: string }).message }
  revalidatePath(`/${clubSlug}/admin/content/navigation`)
  return { error: null }
}

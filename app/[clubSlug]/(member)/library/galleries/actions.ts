'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext, requireClubSlug } from '@/lib/club-context'

const GALLERY_LIMIT = 3

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'gallery'
}

async function uniqueSlug(base: string, memberId: string, clubId: string, excludeId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  let slug = base, i = 1
  while (true) {
    let q = db.from('member_galleries')
      .select('id')
      .eq('member_id', memberId)
      .eq('club_id', clubId)
      .eq('slug', slug)
    if (excludeId) q = q.neq('id', excludeId)
    const { data } = await q.maybeSingle()
    if (!data) return slug
    slug = `${base}-${i++}`
  }
}

export async function createGallery(data: {
  name:         string
  visibility:   'public' | 'members_only' | 'private'
  imageIds:     string[]
  coverId:      string | null
  gallery_type?: 'standard' | 'dynamic'
}): Promise<{ error: string | null; id?: string; gallery_type?: 'standard' | 'dynamic' }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const clubSlug = await requireClubSlug()
  if (!user) redirect(`/${clubSlug}/login`)

  const ctx = await getClubContext()
  if (!ctx?.clubId) return { error: 'Club context not found' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any

  const { count } = await db.from('member_galleries')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', user.id)
    .eq('club_id', ctx.clubId)
  if ((count ?? 0) >= GALLERY_LIMIT) return { error: `You can only create up to ${GALLERY_LIMIT} galleries.` }

  const name = data.name.trim()
  if (!name) return { error: 'Gallery name is required.' }

  const type = data.gallery_type ?? 'standard'
  const base = slugify(name)
  const slug = await uniqueSlug(base, user.id, ctx.clubId)

  const { data: gallery, error } = await db.from('member_galleries').insert({
    club_id:        ctx.clubId,
    member_id:      user.id,
    name,
    slug,
    visibility:     data.visibility,
    gallery_type:   type,
    cover_image_id: data.coverId ?? data.imageIds[0] ?? null,
    image_ids:      data.imageIds,
  }).select('id').single()

  if (error) return { error: (error as { message: string }).message }

  revalidatePath(`/${clubSlug}/library/galleries`)
  return { error: null, id: gallery.id, gallery_type: type }
}

export async function updateGalleryMeta(galleryId: string, data: {
  name:       string
  visibility: 'public' | 'members_only' | 'private'
}): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const clubSlug = await requireClubSlug()
  if (!user) redirect(`/${clubSlug}/login`)

  const name = data.name.trim()
  if (!name) return { error: 'Gallery name is required.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db  = createServiceClient() as any
  const base = slugify(name)
  const ctx = await getClubContext()
  const slug = await uniqueSlug(base, user.id, ctx!.clubId, galleryId)

  const { error } = await db.from('member_galleries')
    .update({ name, visibility: data.visibility, slug })
    .eq('id', galleryId)
    .eq('member_id', user.id)

  if (error) return { error: (error as { message: string }).message }
  revalidatePath(`/${clubSlug}/library/galleries`)
  return { error: null }
}

export async function deleteGallery(galleryId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const clubSlug = await requireClubSlug()
  if (!user) redirect(`/${clubSlug}/login`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { error } = await db.from('member_galleries')
    .delete()
    .eq('id', galleryId)
    .eq('member_id', user.id)

  if (error) return { error: (error as { message: string }).message }
  revalidatePath(`/${clubSlug}/library/galleries`)
  return { error: null }
}

export async function updateGalleryFull(galleryId: string, data: {
  name:       string
  visibility: 'public' | 'members_only' | 'private'
  imageIds:   string[]
  coverId:    string | null
}): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const clubSlug = await requireClubSlug()
  if (!user) redirect(`/${clubSlug}/login`)

  const name = data.name.trim()
  if (!name) return { error: 'Gallery name is required.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db   = createServiceClient() as any
  const ctx  = await getClubContext()
  const base = slugify(name)
  const slug = await uniqueSlug(base, user.id, ctx!.clubId, galleryId)

  const { error } = await db.from('member_galleries')
    .update({
      name,
      slug,
      visibility:     data.visibility,
      image_ids:      data.imageIds,
      cover_image_id: data.coverId,
    })
    .eq('id', galleryId)
    .eq('member_id', user.id)

  if (error) return { error: (error as { message: string }).message }
  revalidatePath(`/${clubSlug}/library/galleries`)
  return { error: null }
}

export async function updateGalleryImages(galleryId: string, imageIds: string[]): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const clubSlug = await requireClubSlug()
  if (!user) redirect(`/${clubSlug}/login`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { error } = await db.from('member_galleries')
    .update({ image_ids: imageIds })
    .eq('id', galleryId)
    .eq('member_id', user.id)

  if (error) return { error: (error as { message: string }).message }
  revalidatePath(`/${clubSlug}/library/galleries`)
  return { error: null }
}

export async function setCoverImage(galleryId: string, imageId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const clubSlug = await requireClubSlug()
  if (!user) redirect(`/${clubSlug}/login`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { error } = await db.from('member_galleries')
    .update({ cover_image_id: imageId })
    .eq('id', galleryId)
    .eq('member_id', user.id)

  if (error) return { error: (error as { message: string }).message }
  revalidatePath(`/${clubSlug}/library/galleries`)
  return { error: null }
}

export type DynamicFilters = {
  scoreMin:   number
  scoreMax:   number
  categories: string[]
  dateFrom:   string | null
  dateTo:     string | null
}

export async function updateDynamicFilters(
  galleryId: string,
  filters:   DynamicFilters,
  imageIds:  string[],
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const clubSlug = await requireClubSlug()
  if (!user) redirect(`/${clubSlug}/login`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any
  const { error } = await db.from('member_galleries')
    .update({
      filters,
      image_ids:      imageIds,
      cover_image_id: imageIds[0] ?? null,
    })
    .eq('id', galleryId)
    .eq('member_id', user.id)

  if (error) return { error: (error as { message: string }).message }
  revalidatePath(`/${clubSlug}/library/galleries`)
  return { error: null }
}

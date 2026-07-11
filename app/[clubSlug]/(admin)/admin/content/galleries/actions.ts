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

export type AdminGalleryFilters = {
  memberIds:  'all' | string[]
  scoreMin:   number
  categories: string[]
  years:      string[]   // empty = all years; e.g. ['2026/27', '2025/26']
}

export async function createAdminGallery(data: {
  name:     string
  filters:  AdminGalleryFilters
  imageIds: string[]
  coverId:  string | null
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
    club_id:    ctx.clubId,
    name,
    slug,
    visibility: 'draft',
    filters:    data.filters,
    image_ids:  data.imageIds,
  }).select('id').single()
  if (error) return { error: (error as { message: string }).message }
  revalidatePath(`/${clubSlug}/admin/content/navigation`)
  revalidatePath(`/${clubSlug}/our-club/galleries`)
  return { error: null, id: gallery.id }
}

export async function updateAdminGalleryMeta(galleryId: string, data: {
  name:       string
  visibility: 'draft' | 'members_only' | 'public'
}): Promise<{ error: string | null }> {
  const { clubSlug } = await requireAdmin()
  const ctx  = await getClubContext()
  const name = data.name.trim()
  if (!name) return { error: 'Gallery name is required.' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db   = createServiceClient() as any
  const slug = await uniqueSlug(slugify(name), ctx!.clubId, galleryId)
  const { error } = await db.from('club_galleries')
    .update({ name, slug, visibility: data.visibility })
    .eq('id', galleryId)
    .eq('club_id', ctx!.clubId)
  if (error) return { error: (error as { message: string }).message }
  revalidatePath(`/${clubSlug}/admin/content/navigation`)
  revalidatePath(`/${clubSlug}/our-club/galleries`)
  return { error: null }
}

export async function updateAdminGalleryFilters(galleryId: string, data: {
  filters:  AdminGalleryFilters
  imageIds: string[]
  coverId:  string | null
}): Promise<{ error: string | null }> {
  const { clubSlug } = await requireAdmin()
  const ctx = await getClubContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db  = createServiceClient() as any
  const { error } = await db.from('club_galleries')
    .update({
      filters:   data.filters,
      image_ids: data.imageIds,
    })
    .eq('id', galleryId)
    .eq('club_id', ctx!.clubId)
  if (error) return { error: (error as { message: string }).message }
  revalidatePath(`/${clubSlug}/admin/content/navigation`)
  revalidatePath(`/${clubSlug}/our-club/galleries`)
  return { error: null }
}

export async function deleteAdminGallery(galleryId: string): Promise<{ error: string | null }> {
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

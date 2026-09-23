'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId } from '@/lib/club-context'

// ── Local types (resource tables not yet in generated DB types) ──────────────

export type ResourceCategoryLayout = 'auto' | 'list' | 'video_grid' | 'link_cards' | 'featured_cards'
export type ResourceSourceType     = 'file' | 'link' | 'video'
export type ResourceVisibility     = 'public' | 'members' | 'board'
export type ResourceStatus         = 'draft' | 'published'
export type ResourceLinkStatus     = 'ok' | 'broken' | 'unchecked'
export type ResourceVideoProvider  = 'youtube' | 'vimeo'

export type ResourceCategory = {
  id:         string
  club_id:    string
  name:       string
  slug:       string
  layout:     ResourceCategoryLayout
  is_visible: boolean
  is_system:  boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type Resource = {
  id:                 string
  club_id:            string
  category_id:        string
  source_type:        ResourceSourceType
  title:              string
  description:        string | null
  author:             string | null
  visibility:         ResourceVisibility
  status:             ResourceStatus
  is_pinned:          boolean
  pinned_order:       number | null
  sort_order:         number
  show_new_badge:     boolean
  published_at:       string | null
  content_updated_at: string | null
  review_on:          string | null
  file_path:          string | null
  file_name:          string | null
  file_mime:          string | null
  file_size:          number | null
  page_count:         number | null
  url:                string | null
  url_host:           string | null
  video_provider:     ResourceVideoProvider | null
  video_id:           string | null
  duration_seconds:   number | null
  thumbnail_url:      string | null
  link_status:        ResourceLinkStatus
  link_checked_at:    string | null
  link_error:         string | null
  view_count:         number
  created_by:         string | null
  updated_by:         string | null
  created_at:         string
  updated_at:         string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const DEFAULT_CATEGORIES: Array<{
  name: string; slug: string; layout: ResourceCategoryLayout; is_system: boolean; sort_order: number
}> = [
  { name: 'Start here',          slug: 'start-here',           layout: 'featured_cards', is_system: true,  sort_order: 0 },
  { name: 'Club Info',           slug: 'club-info',            layout: 'auto',           is_system: false, sort_order: 1 },
  { name: 'Competitions',        slug: 'competitions',         layout: 'auto',           is_system: false, sort_order: 2 },
  { name: 'Lessons & Tutorials', slug: 'lessons-tutorials',   layout: 'auto',           is_system: false, sort_order: 3 },
  { name: 'Meeting Recordings',  slug: 'meeting-recordings',  layout: 'video_grid',     is_system: false, sort_order: 4 },
  { name: 'Inspiration',         slug: 'inspiration',         layout: 'auto',           is_system: false, sort_order: 5 },
]

// ── Seed ─────────────────────────────────────────────────────────────────────

export async function seedDefaultCategories(clubId: string): Promise<void> {
  const supabase = createServiceClient()

  // Check if any categories already exist
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('resource_categories')
    .select('id', { count: 'exact', head: true })
    .eq('club_id', clubId)

  if ((count ?? 0) > 0) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('resource_categories')
    .insert(
      DEFAULT_CATEGORIES.map(c => ({ ...c, club_id: clubId }))
    )
}

// ── Categories ───────────────────────────────────────────────────────────────

export async function listCategories(): Promise<ResourceCategory[]> {
  const clubId  = await requireClubId()
  const supabase = createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('resource_categories')
    .select('*')
    .eq('club_id', clubId)
    .order('sort_order')

  return (data as ResourceCategory[]) ?? []
}

export async function upsertCategory(data: {
  id?:        string
  name:       string
  layout?:    ResourceCategoryLayout
  is_visible?: boolean
}): Promise<{ error: string | null }> {
  const clubId  = await requireClubId()
  const supabase = createServiceClient()
  const slug    = slugify(data.name)

  if (data.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('resource_categories')
      .update({
        name:       data.name,
        slug,
        layout:     data.layout,
        is_visible: data.is_visible,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .eq('club_id', clubId)
    if (error) return { error: (error as { message: string }).message }
  } else {
    // Get max sort_order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (supabase as any)
      .from('resource_categories')
      .select('sort_order')
      .eq('club_id', clubId)
      .order('sort_order', { ascending: false })
      .limit(1)
    const maxOrder = rows?.[0]?.sort_order ?? -1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('resource_categories')
      .insert({
        club_id:    clubId,
        name:       data.name,
        slug,
        layout:     data.layout ?? 'auto',
        is_visible: data.is_visible ?? true,
        is_system:  false,
        sort_order: maxOrder + 1,
      })
    if (error) return { error: (error as { message: string }).message }
  }

  revalidatePath('/admin/resources')
  return { error: null }
}

export async function deleteCategory(
  id:       string,
  moveToId?: string,
): Promise<{ error: string | null }> {
  const clubId  = await requireClubId()
  const supabase = createServiceClient()

  if (moveToId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('resources')
      .update({ category_id: moveToId })
      .eq('category_id', id)
      .eq('club_id', clubId)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('resource_categories')
    .delete()
    .eq('id', id)
    .eq('club_id', clubId)

  if (error) return { error: (error as { message: string }).message }

  revalidatePath('/admin/resources')
  return { error: null }
}

export async function reorderCategories(ids: string[]): Promise<{ error: string | null }> {
  const clubId  = await requireClubId()
  const supabase = createServiceClient()

  const updates = ids.map((id, index) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('resource_categories')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('club_id', clubId)
  )

  await Promise.all(updates)
  revalidatePath('/admin/resources')
  return { error: null }
}

// ── Resources ────────────────────────────────────────────────────────────────

export async function listResources(): Promise<Resource[]> {
  const clubId  = await requireClubId()
  const supabase = createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('resources')
    .select('*')
    .eq('club_id', clubId)
    .order('sort_order')
    .order('created_at', { ascending: false })

  return (data as Resource[]) ?? []
}

export async function createResource(data: Partial<Resource>): Promise<{ id: string | null; error: string | null }> {
  const clubId  = await requireClubId()
  const supabase = createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error } = await (supabase as any)
    .from('resources')
    .insert({ ...data, club_id: clubId })
    .select('id')
    .single()

  if (error) return { id: null, error: (error as { message: string }).message }

  revalidatePath('/admin/resources')
  return { id: row.id, error: null }
}

export async function updateResource(
  id:   string,
  data: Partial<Resource>,
): Promise<{ error: string | null }> {
  const clubId  = await requireClubId()
  const supabase = createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('resources')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('club_id', clubId)

  if (error) return { error: (error as { message: string }).message }

  revalidatePath('/admin/resources')
  revalidatePath(`/admin/resources/${id}`)
  return { error: null }
}

export async function deleteResource(id: string): Promise<{ error: string | null }> {
  const clubId  = await requireClubId()
  const supabase = createServiceClient()

  // Get file path first so we can delete from storage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await (supabase as any)
    .from('resources')
    .select('file_path')
    .eq('id', id)
    .eq('club_id', clubId)
    .single()

  if (row?.file_path) {
    await supabase.storage.from('resources').remove([row.file_path])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('resources')
    .delete()
    .eq('id', id)
    .eq('club_id', clubId)

  if (error) return { error: (error as { message: string }).message }

  revalidatePath('/admin/resources')
  return { error: null }
}

export async function publishResource(id: string): Promise<{ error: string | null }> {
  return updateResource(id, {
    status:       'published',
    published_at: new Date().toISOString(),
  })
}

export async function unpublishResource(id: string): Promise<{ error: string | null }> {
  return updateResource(id, { status: 'draft' })
}

export async function pinResource(id: string): Promise<{ error: string | null }> {
  const clubId  = await requireClubId()
  const supabase = createServiceClient()

  // Check max 3 pinned
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('resources')
    .select('id', { count: 'exact', head: true })
    .eq('club_id', clubId)
    .eq('is_pinned', true)

  if ((count ?? 0) >= 3) {
    return { error: 'Maximum of 3 resources can be pinned to Start here.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (supabase as any)
    .from('resources')
    .select('pinned_order')
    .eq('club_id', clubId)
    .eq('is_pinned', true)
    .order('pinned_order', { ascending: false })
    .limit(1)

  const nextOrder = (rows?.[0]?.pinned_order ?? -1) + 1

  return updateResource(id, { is_pinned: true, pinned_order: nextOrder })
}

export async function unpinResource(id: string): Promise<{ error: string | null }> {
  return updateResource(id, { is_pinned: false, pinned_order: null })
}

export async function recheckLink(id: string): Promise<{ error: string | null }> {
  const clubId  = await requireClubId()
  const supabase = createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await (supabase as any)
    .from('resources')
    .select('url')
    .eq('id', id)
    .eq('club_id', clubId)
    .single()

  if (!row?.url) return { error: 'No URL to check.' }

  let linkStatus: ResourceLinkStatus = 'unchecked'
  let linkError: string | null = null

  try {
    const res = await fetch(row.url, {
      method:  'HEAD',
      signal:  AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'FocalPoint-LinkChecker/1.0' },
    })

    if (res.ok || (res.status >= 300 && res.status < 400)) {
      linkStatus = 'ok'
    } else if (res.status === 404 || res.status === 410) {
      linkStatus = 'broken'
      linkError  = `HTTP ${res.status}`
    } else {
      linkStatus = 'broken'
      linkError  = `HTTP ${res.status}`
    }
  } catch (err) {
    linkStatus = 'broken'
    linkError  = err instanceof Error ? err.message : 'Unknown error'
  }

  return updateResource(id, {
    link_status:     linkStatus,
    link_checked_at: new Date().toISOString(),
    link_error:      linkError,
  })
}

export async function getSignedUrl(filePath: string): Promise<{ url: string | null; error: string | null }> {
  const supabase = createServiceClient()
  const { data, error } = await supabase.storage
    .from('resources')
    .createSignedUrl(filePath, 3600) // 1 hour

  if (error) return { url: null, error: error.message }
  return { url: data.signedUrl, error: null }
}

export async function getUploadUrl(fileName: string): Promise<{ path: string; token: string; error: string | null }> {
  const clubId  = await requireClubId()
  const supabase = createServiceClient()

  const path = `${clubId}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const { data, error } = await supabase.storage
    .from('resources')
    .createSignedUploadUrl(path)

  if (error || !data) return { path: '', token: '', error: error?.message ?? 'Failed to get upload URL' }
  return { path: data.path, token: data.token, error: null }
}

export async function fetchOgData(url: string): Promise<{
  title: string | null; description: string | null; error: string | null
}> {
  try {
    const res   = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const html  = await res.text()
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null
    const desc  = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim()
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1]?.trim()
      ?? null
    return { title, description: desc, error: null }
  } catch (err) {
    return { title: null, description: null, error: err instanceof Error ? err.message : 'Fetch failed' }
  }
}

export async function fetchVideoMeta(url: string): Promise<{
  title:     string | null
  thumbnail: string | null
  provider:  ResourceVideoProvider | null
  videoId:   string | null
  error:     string | null
}> {
  // Detect YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  )
  if (ytMatch) {
    const videoId = ytMatch[1]
    try {
      const oembed = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        { signal: AbortSignal.timeout(8000) }
      )
      const data = await oembed.json() as { title?: string; thumbnail_url?: string }
      return {
        title:     data.title ?? null,
        thumbnail: data.thumbnail_url ?? null,
        provider:  'youtube',
        videoId,
        error:     null,
      }
    } catch {
      return { title: null, thumbnail: null, provider: 'youtube', videoId, error: null }
    }
  }

  // Detect Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeoMatch) {
    const videoId = vimeoMatch[1]
    try {
      const oembed = await fetch(
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(8000) }
      )
      const data = await oembed.json() as { title?: string; thumbnail_url?: string }
      return {
        title:     data.title ?? null,
        thumbnail: data.thumbnail_url ?? null,
        provider:  'vimeo',
        videoId,
        error:     null,
      }
    } catch {
      return { title: null, thumbnail: null, provider: 'vimeo', videoId, error: null }
    }
  }

  return { title: null, thumbnail: null, provider: null, videoId: null, error: 'Unrecognised video URL. Paste a YouTube or Vimeo link.' }
}

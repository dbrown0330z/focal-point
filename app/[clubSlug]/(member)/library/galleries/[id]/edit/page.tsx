import { redirect }          from 'next/navigation'
import { createClient }       from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug, getClubContext } from '@/lib/club-context'
import EditGalleryPage        from './EditGalleryPage'

export const dynamic = 'force-dynamic'

export type GalleryItem = {
  id:         string
  title:      string
  publicUrl:  string
  created_at: string
}

export type EditableGallery = {
  id:             string
  name:           string
  slug:           string
  visibility:     'public' | 'members_only' | 'private'
  cover_image_id: string | null
  clubName:       string
}

export default async function EditGalleryRoute({
  params,
}: {
  params: Promise<{ clubSlug: string; id: string }>
}) {
  const { id } = await params
  const clubSlug = await requireClubSlug()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${clubSlug}/login`)

  const ctx   = await getClubContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createServiceClient() as any

  // ── Gallery record ────────────────────────────────────────────────────────
  const { data: gallery } = await admin
    .from('member_galleries')
    .select('id, name, slug, visibility, cover_image_id, image_ids')
    .eq('id', id)
    .eq('member_id', user.id)
    .single()

  if (!gallery) redirect(`/${clubSlug}/library/galleries`)

  const imageIds = (gallery.image_ids as string[]) ?? []

  // ── Resolve gallery images in original order ──────────────────────────────
  const initialItems: GalleryItem[] = []
  if (imageIds.length > 0) {
    const { data: imgs } = await admin
      .from('images')
      .select('id, title, storage_path, created_at')
      .in('id', imageIds)

    const imgMap = new Map((imgs ?? []).map((i: { id: string; title: string; storage_path: string; created_at: string }) => [i.id, i]))
    for (const imgId of imageIds) {
      const img = imgMap.get(imgId) as { id: string; title: string; storage_path: string; created_at: string } | undefined
      if (!img) continue
      initialItems.push({
        id:         img.id,
        title:      img.title as string,
        publicUrl:  admin.storage.from('images').getPublicUrl(img.storage_path as string).data.publicUrl,
        created_at: img.created_at as string,
      })
    }
  }

  // ── Full library for Add Photos modal ─────────────────────────────────────
  const { data: libRaw } = await admin
    .from('images')
    .select('id, title, storage_path, created_at')
    .eq('owner_id', user.id)
    .eq('club_id', ctx!.clubId)
    .order('created_at', { ascending: false })

  const libraryImages: GalleryItem[] = (libRaw ?? []).map((img: { id: string; title: string; storage_path: string; created_at: string }) => ({
    id:         img.id as string,
    title:      img.title as string,
    publicUrl:  admin.storage.from('images').getPublicUrl(img.storage_path as string).data.publicUrl,
    created_at: img.created_at as string,
  }))

  return (
    <EditGalleryPage
      clubSlug={clubSlug}
      userId={user.id}
      gallery={{
        id:             gallery.id as string,
        name:           gallery.name as string,
        slug:           gallery.slug as string,
        visibility:     gallery.visibility as 'public' | 'members_only' | 'private',
        cover_image_id: gallery.cover_image_id as string | null,
        clubName:       ctx?.clubName ?? '',
      }}
      initialItems={initialItems}
      libraryImages={libraryImages}
    />
  )
}

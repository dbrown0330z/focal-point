import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import GalleryViewer from '@/app/[clubSlug]/gallery/[memberId]/[gallerySlug]/GalleryViewer'
import { DEFAULT_DISPLAY_SETTINGS } from '@/app/[clubSlug]/(member)/library/galleries/gallery-defaults'

export const dynamic = 'force-dynamic'

export default async function ClubGalleryPage({
  params,
}: {
  params: Promise<{ clubSlug: string; gallerySlug: string }>
}) {
  const { gallerySlug } = await params
  const ctx      = await getClubContext()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin    = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any

  const { data: galleryRaw } = await adminAny
    .from('club_galleries')
    .select('id, name, description, visibility, image_ids')
    .eq('club_id', ctx!.clubId)
    .eq('slug', gallerySlug)
    .is('archived_at', null)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gallery = galleryRaw as any
  if (!gallery) notFound()
  if (gallery.visibility === 'members_only' && !user) notFound()
  if (gallery.visibility === 'draft') notFound()

  // Fetch images from image_ids JSONB array
  const imageIds: string[] = Array.isArray(gallery.image_ids) ? gallery.image_ids as string[] : []

  const images: { id: string; title: string; publicUrl: string; score: number | null }[] = []

  if (imageIds.length > 0) {
    const { data: imageRows } = await adminAny
      .from('images')
      .select('id, title, storage_path')
      .in('id', imageIds)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rowMap = new Map<string, any>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((imageRows ?? []) as any[]).map((r: any) => [r.id as string, r])
    )

    // Maintain the order from image_ids
    for (const id of imageIds) {
      const row = rowMap.get(id)
      if (!row) continue
      images.push({
        id:        row.id as string,
        title:     row.title as string,
        publicUrl: admin.storage.from('images').getPublicUrl(row.storage_path as string).data.publicUrl,
        score:     null,
      })
    }
  }

  return (
    <GalleryViewer
      galleryId={gallery.id as string}
      galleryName={gallery.name as string}
      clubSlug={ctx!.clubSlug}
      ownerName="Club gallery"
      images={images}
      isOwner={false}
      initialDisplaySettings={DEFAULT_DISPLAY_SETTINGS}
    />
  )
}

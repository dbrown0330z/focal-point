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
    .select('id, name, description, visibility')
    .eq('club_id', ctx!.clubId)
    .eq('slug', gallerySlug)
    .is('archived_at', null)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gallery = galleryRaw as any
  if (!gallery) notFound()
  if (gallery.visibility === 'members_only' && !user) notFound()

  // Fetch ordered images via club_gallery_images
  const { data: rows } = await adminAny
    .from('club_gallery_images')
    .select(`
      sort_order,
      submissions!club_gallery_images_submission_id_fkey(
        images!submissions_image_id_fkey(id, title, storage_path, exif_data)
      )
    `)
    .eq('gallery_id', gallery.id)
    .order('sort_order', { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const images = ((rows ?? []) as any[]).map((row: any) => {
    const r = row as {
      submissions?: {
        images?: { id: string; title: string; storage_path: string; exif_data: Record<string, unknown> | null } | null
      } | null
    }
    const img = r.submissions?.images
    if (!img) return null
    return {
      id:        img.id,
      title:     img.title,
      publicUrl: admin.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl,
      score:     null,
    }
  }).filter(Boolean) as { id: string; title: string; publicUrl: string; score: number | null }[]

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

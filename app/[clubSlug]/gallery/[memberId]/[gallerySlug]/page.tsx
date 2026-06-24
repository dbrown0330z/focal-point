import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import GalleryViewer from './GalleryViewer'

export const dynamic = 'force-dynamic'

export default async function PublicGalleryPage({
  params,
}: {
  params: Promise<{ clubSlug: string; memberId: string; gallerySlug: string }>
}) {
  const { memberId, gallerySlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const ctx      = await getClubContext()
  const admin    = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any

  // Fetch gallery
  const { data: galleryRaw } = await adminAny
    .from('member_galleries')
    .select('id, name, visibility, image_ids, cover_image_id, member_id')
    .eq('member_id', memberId)
    .eq('club_id', ctx!.clubId)
    .eq('slug', gallerySlug)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gallery = galleryRaw as any
  if (!gallery) notFound()

  // Access check
  if (gallery.visibility === 'private' && gallery.member_id !== user?.id) notFound()
  if (gallery.visibility === 'members_only' && !user) notFound()

  // Fetch member profile
  const { data: profile } = await admin
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', memberId)
    .single()

  // Fetch images in order
  const imageIds = (gallery.image_ids as string[]) ?? []

  const images: { id: string; title: string; publicUrl: string; exifData: Record<string, unknown> | null }[] = []
  if (imageIds.length > 0) {
    const { data: imgs } = await admin
      .from('images')
      .select('id, title, storage_path, exif_data')
      .in('id', imageIds)

    const byId = new Map((imgs ?? []).map(i => [i.id as string, i]))
    for (const id of imageIds) {
      const img = byId.get(id)
      if (!img) continue
      images.push({
        id:         img.id as string,
        title:      img.title as string,
        publicUrl:  admin.storage.from('images').getPublicUrl(img.storage_path as string).data.publicUrl,
        exifData:   (img.exif_data as Record<string, unknown> | null) ?? null,
      })
    }
  }

  return (
    <GalleryViewer
      galleryName={gallery.name as string}
      ownerName={profile?.display_name ?? 'Unknown member'}
      images={images}
    />
  )
}

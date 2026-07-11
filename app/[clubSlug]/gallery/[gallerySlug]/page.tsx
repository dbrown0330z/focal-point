import { notFound }           from 'next/navigation'
import { createClient }        from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext }      from '@/lib/club-context'
import GalleryViewer           from '@/app/[clubSlug]/gallery/[memberId]/[gallerySlug]/GalleryViewer'
import { DEFAULT_DISPLAY_SETTINGS } from '@/app/[clubSlug]/(member)/library/galleries/gallery-defaults'
import type { DisplaySettings } from '@/app/[clubSlug]/(member)/library/galleries/actions'

export const dynamic = 'force-dynamic'

export default async function ClubGalleryPage({
  params,
  searchParams,
}: {
  params:       Promise<{ clubSlug: string; gallerySlug: string }>
  searchParams: Promise<{ exitUrl?: string }>
}) {
  const { clubSlug, gallerySlug } = await params
  const { exitUrl } = await searchParams
  const ctx      = await getClubContext()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin    = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any

  const { data: galleryRaw } = await adminAny
    .from('club_galleries')
    .select('id, name, description, visibility, image_ids, display_settings')
    .eq('club_id', ctx!.clubId)
    .eq('slug', gallerySlug)
    .is('archived_at', null)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gallery = galleryRaw as any
  if (!gallery) notFound()
  if (gallery.visibility === 'members_only' && !user) notFound()
  if (gallery.visibility === 'draft')                  notFound()

  // Check if current user is a club admin
  let isAdmin = false
  if (user) {
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    isAdmin = (profile as { role?: string } | null)?.role === 'admin'
  }

  // Fetch images from image_ids JSONB array (preserve order)
  const imageIds: string[] = Array.isArray(gallery.image_ids) ? gallery.image_ids as string[] : []
  const images: { id: string; title: string; publicUrl: string; score: number | null; makerName?: string }[] = []

  if (imageIds.length > 0) {
    const { data: imageRows } = await adminAny
      .from('images')
      .select('id, title, storage_path, owner_id')
      .in('id', imageIds)

    // Collect unique owner IDs and fetch their display names
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ownerIds = [...new Set(((imageRows ?? []) as any[]).map((r: any) => r.owner_id as string).filter(Boolean))]
    const makerMap = new Map<string, string>()
    if (ownerIds.length > 0) {
      const { data: profiles } = await admin.from('profiles').select('id, display_name').in('id', ownerIds)
      for (const p of (profiles ?? []) as { id: string; display_name: string }[]) {
        makerMap.set(p.id, p.display_name)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rowMap = new Map<string, any>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((imageRows ?? []) as any[]).map((r: any) => [r.id as string, r])
    )
    for (const id of imageIds) {
      const row = rowMap.get(id)
      if (!row) continue
      images.push({
        id:        row.id as string,
        title:     row.title as string,
        publicUrl: admin.storage.from('images').getPublicUrl(row.storage_path as string).data.publicUrl,
        score:     null,
        makerName: makerMap.get(row.owner_id as string),
      })
    }
  }

  const galleryId = gallery.id as string
  const displaySettings: DisplaySettings =
    (gallery.display_settings as DisplaySettings | null) ?? DEFAULT_DISPLAY_SETTINGS

  // Server action — persists display settings to club_galleries
  async function saveDisplaySettings(settings: DisplaySettings) {
    'use server'
    const svc = createServiceClient() as any
    await svc.from('club_galleries').update({ display_settings: settings }).eq('id', galleryId)
  }

  const clubName = ctx!.clubName

  return (
    <GalleryViewer
      galleryId={galleryId}
      galleryName={gallery.name as string}
      clubSlug={clubSlug}
      ownerName={clubName}
      images={images}
      isOwner={false}
      isAdmin={isAdmin}
      isPublic={gallery.visibility === 'public'}
      backUrl={isAdmin && exitUrl ? exitUrl : undefined}
      clubName={clubName}
      onSaveSettings={isAdmin ? saveDisplaySettings : undefined}
      subtitle={
        <>
          {images.length} photo{images.length !== 1 ? 's' : ''}&nbsp;·&nbsp;
          <a
            href={`/${clubSlug}`}
            style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            {clubName}
          </a>
        </>
      }
      initialDisplaySettings={displaySettings}
    />
  )
}

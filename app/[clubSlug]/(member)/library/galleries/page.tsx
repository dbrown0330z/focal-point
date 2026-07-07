import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug, getClubContext } from '@/lib/club-context'
import GalleriesClient from './GalleriesClient'

export const dynamic = 'force-dynamic'

export type GalleryData = {
  id:             string
  name:           string
  slug:           string
  visibility:     'public' | 'members_only' | 'private'
  gallery_type:   'standard' | 'dynamic'
  cover_image_id: string | null
  coverImageUrl:  string | null
  imageCount:     number
}

export default async function MyGalleriesPage() {
  const clubSlug = await requireClubSlug()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${clubSlug}/login`)

  const ctx   = await getClubContext()
  const admin = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any

  // ── Member's galleries ────────────────────────────────────────────────────
  const { data: galleriesRaw } = await adminAny
    .from('member_galleries')
    .select('id, name, slug, visibility, gallery_type, cover_image_id, image_ids')
    .eq('member_id', user.id)
    .eq('club_id', ctx!.clubId)
    .order('created_at', { ascending: false })

  const galleries: GalleryData[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const g of (galleriesRaw ?? []) as any[]) {
    const ids = (g.image_ids as string[]) ?? []
    let coverUrl: string | null = null
    const coverId = (g.cover_image_id as string | null) ?? ids[0] ?? null
    if (coverId) {
      const { data: img } = await admin.from('images').select('storage_path').eq('id', coverId).single()
      if (img?.storage_path) {
        coverUrl = admin.storage.from('images').getPublicUrl(img.storage_path as string).data.publicUrl
      }
    }
    galleries.push({
      id:             g.id as string,
      name:           g.name as string,
      slug:           g.slug as string,
      visibility:     g.visibility as 'public' | 'members_only' | 'private',
      gallery_type:   (g.gallery_type as 'standard' | 'dynamic') ?? 'standard',
      cover_image_id: g.cover_image_id as string | null,
      coverImageUrl:  coverUrl,
      imageCount:     ids.length,
    })
  }

  // ── Does this member have any library images? ─────────────────────────────
  const { count: imgCount } = await adminAny
    .from('images')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .eq('club_id', ctx!.clubId)
  const hasImages = (imgCount ?? 0) > 0

  return (
    <GalleriesClient
      clubSlug={clubSlug}
      userId={user.id}
      galleries={galleries}
      hasImages={hasImages}
    />
  )
}

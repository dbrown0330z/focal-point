import { notFound }         from 'next/navigation'
import { createClient }      from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext }    from '@/lib/club-context'
import GalleryViewer         from './GalleryViewer'
import type { DisplaySettings } from '@/app/[clubSlug]/(member)/library/galleries/actions'
import { DEFAULT_DISPLAY_SETTINGS } from '@/app/[clubSlug]/(member)/library/galleries/gallery-defaults'

export const dynamic = 'force-dynamic'

export default async function PublicGalleryPage({
  params,
  searchParams,
}: {
  params:       Promise<{ clubSlug: string; memberId: string; gallerySlug: string }>
  searchParams: Promise<{ exitUrl?: string }>
}) {
  const { clubSlug, memberId, gallerySlug } = await params
  const { exitUrl } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const ctx      = await getClubContext()
  const admin    = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any

  // ── Gallery record ────────────────────────────────────────────────────────
  const { data: galleryRaw } = await adminAny
    .from('member_galleries')
    .select('id, name, visibility, image_ids, cover_image_id, member_id, display_settings')
    .eq('member_id', memberId)
    .eq('club_id', ctx!.clubId)
    .eq('slug', gallerySlug)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gallery = galleryRaw as any
  if (!gallery) notFound()

  // ── Access control ────────────────────────────────────────────────────────
  if (gallery.visibility === 'private'      && gallery.member_id !== user?.id) notFound()
  if (gallery.visibility === 'members_only' && !user)                          notFound()

  const isOwner = user?.id === memberId

  // ── Member profile + club name ────────────────────────────────────────────
  const [{ data: profile }, { data: clubSettings }] = await Promise.all([
    admin.from('profiles').select('display_name').eq('id', memberId).single(),
    admin.from('club_settings').select('club_name').eq('club_id', ctx!.clubId).single(),
  ])
  const clubName = (clubSettings as { club_name?: string } | null)?.club_name ?? ''

  // ── Images in stored order ────────────────────────────────────────────────
  const imageIds = (gallery.image_ids as string[]) ?? []
  const imageList: {
    id: string; title: string; publicUrl: string; score: number | null
  }[] = []

  if (imageIds.length > 0) {
    const { data: imgs } = await admin
      .from('images')
      .select('id, title, storage_path')
      .in('id', imageIds)

    // Fetch average scores for these images
    const { data: scoreRows } = await adminAny
      .from('submissions')
      .select('image_id, scores!inner(score)')
      .in('image_id', imageIds)

    // Build image_id → avg score map
    const scoreMap = new Map<string, number[]>()
    for (const row of (scoreRows ?? []) as { image_id: string; scores: { score: number }[] }[]) {
      const scores = (row.scores ?? []).map((s: { score: number }) => s.score)
      if (!scoreMap.has(row.image_id)) scoreMap.set(row.image_id, [])
      scoreMap.get(row.image_id)!.push(...scores)
    }

    const byId = new Map((imgs ?? []).map(i => [i.id as string, i]))
    for (const id of imageIds) {
      const img = byId.get(id)
      if (!img) continue
      const rawScores = scoreMap.get(id) ?? []
      const avg = rawScores.length
        ? Math.round((rawScores.reduce((a, b) => a + b, 0) / rawScores.length) * 10) / 10
        : null
      imageList.push({
        id:         img.id as string,
        title:      img.title as string,
        publicUrl:  admin.storage.from('images').getPublicUrl(img.storage_path as string).data.publicUrl,
        score:      avg,
      })
    }
  }

  const displaySettings: DisplaySettings = (gallery.display_settings as DisplaySettings | null) ?? DEFAULT_DISPLAY_SETTINGS

  return (
    <GalleryViewer
      galleryId={gallery.id as string}
      galleryName={gallery.name as string}
      clubSlug={clubSlug}
      ownerName={profile?.display_name ?? 'Unknown member'}
      images={imageList}
      isOwner={isOwner}
      backUrl={isOwner && exitUrl ? exitUrl : undefined}
      clubName={clubName}
      initialDisplaySettings={displaySettings}
    />
  )
}

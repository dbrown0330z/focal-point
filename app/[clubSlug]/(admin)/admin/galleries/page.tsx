import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import ClubGalleriesTab, { type AdminGalleryData, type ClubMember } from '../content/galleries/ClubGalleriesTab'

export const dynamic = 'force-dynamic'

export default async function GalleriesPage() {
  const admin  = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any
  const ctx    = await getClubContext()

  const { data: galleriesRaw } = await adminAny
    .from('club_galleries')
    .select('id, name, slug, visibility, filters, image_ids, cover_submission_id, created_at')
    .eq('club_id', ctx!.clubId)
    .order('created_at', { ascending: false })

  const galleries: AdminGalleryData[] = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((galleriesRaw ?? []) as any[]).map(async (g: any) => {
      const imageIds: string[] = Array.isArray(g.image_ids) ? g.image_ids : []
      let coverUrl: string | null = null

      if (imageIds.length > 0) {
        const { data: imgRow } = await adminAny
          .from('images')
          .select('storage_path')
          .eq('id', imageIds[0])
          .single()
        if (imgRow?.storage_path) {
          coverUrl = admin.storage.from('images').getPublicUrl(imgRow.storage_path as string).data.publicUrl
        }
      }

      return {
        id:         g.id as string,
        name:       g.name as string,
        slug:       g.slug as string,
        visibility: (g.visibility as 'draft' | 'members_only' | 'public') ?? 'draft',
        filters:    g.filters ?? null,
        imageIds,
        coverUrl,
        imageCount: imageIds.length,
      } satisfies AdminGalleryData
    })
  )

  const { data: membershipRows } = await adminAny
    .from('club_memberships')
    .select('user_id')
    .eq('club_id', ctx!.clubId)
    .eq('membership_status', 'active')

  const memberIds = ((membershipRows ?? []) as { user_id: string }[]).map(m => m.user_id)
  let members: ClubMember[] = []

  if (memberIds.length > 0) {
    const { data: memberProfiles } = await adminAny
      .from('profiles')
      .select('id, first_name, last_name, display_name')
      .in('id', memberIds)

    members = ((memberProfiles ?? []) as { id: string; first_name?: string; last_name?: string; display_name?: string }[]).map(p => ({
      id:          p.id,
      displayName: p.display_name
        ?? ([p.first_name, p.last_name].filter(Boolean).join(' ') || 'Member'),
    }))
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Galleries</h1>
        <p className="mt-1 text-[13px] text-content-secondary">Dynamic galleries curated from competition submissions and published to members or the public.</p>
      </div>
      <ClubGalleriesTab galleries={galleries} members={members} clubSlug={ctx!.clubSlug} />
    </div>
  )
}

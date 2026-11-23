import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import { DEFAULT_BLOCKS, mergeBlocks, type ContentBlock } from '@/lib/homepage/types'
import HomepageEditor from '../navigation/HomepageEditor'
import type { AdminGalleryData, ClubMember } from '../galleries/ClubGalleriesTab'

export const dynamic = 'force-dynamic'

export default async function HomepageAdminPage() {
  const admin = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any
  const ctx = await getClubContext()

  const [{ data: csBlocks }, galleriesRaw, membershipRows] = await Promise.all([
    adminAny.from('club_settings').select('homepage_blocks, club_name').eq('club_id', ctx!.clubId).single(),
    adminAny.from('club_galleries').select('id, name, slug, visibility, filters, image_ids').eq('club_id', ctx!.clubId).order('created_at', { ascending: false }),
    adminAny.from('club_memberships').select('user_id').eq('club_id', ctx!.clubId).eq('membership_status', 'active'),
  ])

  const saved: ContentBlock[] = (csBlocks?.homepage_blocks as ContentBlock[] | null) ?? DEFAULT_BLOCKS
  const clubName: string = csBlocks?.club_name ?? ''
  const homepageBlocks: ContentBlock[] = mergeBlocks(saved, DEFAULT_BLOCKS)

  const galleries: AdminGalleryData[] = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((galleriesRaw.data ?? []) as any[]).map(async (g: any) => {
      const imageIds: string[] = Array.isArray(g.image_ids) ? g.image_ids : []
      let coverUrl: string | null = null
      if (imageIds.length > 0) {
        const { data: imgRow } = await adminAny.from('images').select('storage_path').eq('id', imageIds[0]).single()
        if (imgRow?.storage_path) {
          coverUrl = admin.storage.from('images').getPublicUrl(imgRow.storage_path as string).data.publicUrl
        }
      }
      return {
        id: g.id as string, name: g.name as string, slug: g.slug as string,
        visibility: (g.visibility as 'draft' | 'members_only' | 'public') ?? 'draft',
        filters: g.filters ?? null, imageIds, coverUrl, imageCount: imageIds.length,
      } satisfies AdminGalleryData
    })
  )

  const memberIds = ((membershipRows.data ?? []) as { user_id: string }[]).map(m => m.user_id)
  let members: ClubMember[] = []
  if (memberIds.length > 0) {
    const { data: profiles } = await adminAny.from('profiles').select('id, first_name, last_name, display_name').in('id', memberIds)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    members = ((profiles ?? []) as any[]).map(p => ({
      id: p.id,
      displayName: p.display_name ?? ([p.first_name, p.last_name].filter(Boolean).join(' ') || 'Member'),
    }))
  }

  return (
    <HomepageEditor
      initialBlocks={homepageBlocks}
      galleries={galleries}
      members={members}
      clubName={clubName}
    />
  )
}

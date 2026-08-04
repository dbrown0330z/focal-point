import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import NavigationClient, { type CustomPage, type CustomTab, type BuiltinPageVisibility } from './NavigationClient'
import type { AdminGalleryData, ClubMember } from '../galleries/ClubGalleriesTab'
import { DEFAULT_BLOCKS, mergeBlocks, type ContentBlock } from '@/lib/homepage/types'

export const dynamic = 'force-dynamic'

export default async function NavigationPage() {
  const supabase = await createClient()
  const admin    = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any
  const ctx      = await getClubContext()

  const [{ data: customPages }, { data: customTabs }, { data: csBlocks }, { data: csVis }] = await Promise.all([
    admin.from('nav_custom_pages').select('id,title,slug,parent_system,tab_id,page_type,external_url,visibility,status,sort_order,updated_at').eq('club_id', ctx!.clubId).order('sort_order'),
    admin.from('nav_custom_tabs').select('*').eq('club_id', ctx!.clubId).order('sort_order'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('club_settings').select('homepage_blocks').eq('club_id', ctx!.clubId).single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('club_settings').select('page_visibility').eq('club_id', ctx!.clubId).maybeSingle(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saved: ContentBlock[] = ((csBlocks as any)?.homepage_blocks as ContentBlock[] | null) ?? DEFAULT_BLOCKS
  const homepageBlocks: ContentBlock[] = mergeBlocks(saved, DEFAULT_BLOCKS)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawPageVis = ((csVis as any)?.page_visibility as Record<string, string> | null) ?? {}
  const builtinVisibility: BuiltinPageVisibility = {
    about:    (rawPageVis.about    === 'public' ? 'public' : 'members_only'),
    calendar: (rawPageVis.calendar === 'public' ? 'public' : 'members_only'),
  }

  // ── Club galleries ──────────────────────────────────────────────────────────
  const { data: galleriesRaw } = await adminAny
    .from('club_galleries')
    .select('id, name, slug, visibility, filters, image_ids, cover_submission_id, created_at')
    .eq('club_id', ctx!.clubId)
    .order('created_at', { ascending: false })

  // For each gallery, resolve cover URL from first image_id
  const galleries: AdminGalleryData[] = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((galleriesRaw ?? []) as any[]).map(async (g: any) => {
      const imageIds: string[] = Array.isArray(g.image_ids) ? g.image_ids : []
      let coverUrl: string | null = null

      if (imageIds.length > 0) {
        const firstId = imageIds[0]
        const { data: imgRow } = await adminAny
          .from('images')
          .select('storage_path')
          .eq('id', firstId)
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

  // ── Club members ────────────────────────────────────────────────────────────
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
    <NavigationClient
      customPages={(customPages ?? []) as unknown as CustomPage[]}
      customTabs={(customTabs ?? []) as unknown as CustomTab[]}
      initialHomepageBlocks={homepageBlocks}
      initialGalleries={galleries}
      members={members}
      clubId={ctx!.clubId}
      initialBuiltinVisibility={builtinVisibility}
    />
  )
}

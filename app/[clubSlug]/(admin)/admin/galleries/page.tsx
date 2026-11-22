import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext, requireClubId } from '@/lib/club-context'
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: visRow } = await adminAny
    .from('club_settings')
    .select('page_visibility')
    .eq('club_id', ctx!.clubId)
    .single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawVis      = ((visRow?.page_visibility) as Record<string, unknown>) ?? {}
  const pageEnabled = rawVis.galleries_enabled !== false

  async function enableGalleries() {
    'use server'
    const clubId = await requireClubId()
    const svc    = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (svc as any)
      .from('club_settings').select('page_visibility').eq('club_id', clubId).single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = (existing?.page_visibility as Record<string, unknown>) ?? {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (svc as any)
      .from('club_settings')
      .update({ page_visibility: { ...current, galleries_enabled: true } })
      .eq('club_id', clubId)
    const ctx2 = await getClubContext()
    revalidatePath(`/${ctx2?.clubSlug}/admin/galleries`)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Galleries</h1>
        <p className="mt-1 text-[13px] text-content-secondary">Dynamic galleries curated from competition submissions and published to members or the public.</p>
      </div>

      {!pageEnabled && (
        <div style={{
          marginBottom: 24, padding: '14px 20px',
          background: 'var(--status-warning-bg)',
          border: '1px solid rgba(166,124,0,0.4)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 3px', fontWeight: 600, fontSize: 14, color: 'var(--status-warning-text)' }}>
              Club Galleries page is disabled
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--status-warning-text)', lineHeight: 1.5 }}>
              This page is hidden from members. You can still manage galleries here, but they won&apos;t appear in navigation until enabled.
            </p>
          </div>
          <form action={enableGalleries} style={{ flexShrink: 0 }}>
            <button type="submit" style={{
              padding: '7px 16px', borderRadius: 'var(--radius-md)',
              background: 'var(--action-primary)', color: 'white',
              fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
            }}>
              Enable page
            </button>
          </form>
        </div>
      )}

      <ClubGalleriesTab galleries={galleries} members={members} clubSlug={ctx!.clubSlug} />
    </div>
  )
}

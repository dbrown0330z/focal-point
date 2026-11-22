import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId, requireClubSlug } from '@/lib/club-context'
import ResourcesClient from './ResourcesClient'
import type { ResourceCategory, Resource } from './actions'
import { seedDefaultCategories } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminResourcesPage() {
  const [clubId, clubSlug] = await Promise.all([requireClubId(), requireClubSlug()])
  const supabase = createServiceClient()

  // Seed default categories if this is the first visit (no-op if table doesn't exist yet)
  try { await seedDefaultCategories(clubId) } catch { /* migration not yet applied */ }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [catsResult, resResult, visResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('resource_categories')
      .select('*')
      .eq('club_id', clubId)
      .order('sort_order'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('resources')
      .select('*')
      .eq('club_id', clubId)
      .order('sort_order')
      .order('created_at', { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('club_settings')
      .select('page_visibility')
      .eq('club_id', clubId)
      .single(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories: ResourceCategory[] = ((catsResult as any)?.data as ResourceCategory[]) ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resources:  Resource[]          = ((resResult as any)?.data as Resource[]) ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawVis       = ((visResult as any)?.data?.page_visibility as Record<string, unknown>) ?? {}
  const pageEnabled  = rawVis.resources_enabled !== false

  async function enableResources() {
    'use server'
    const id    = await requireClubId()
    const admin = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (admin as any)
      .from('club_settings').select('page_visibility').eq('club_id', id).single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = (existing?.page_visibility as Record<string, unknown>) ?? {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('club_settings')
      .update({ page_visibility: { ...current, resources_enabled: true } })
      .eq('club_id', id)
    revalidatePath(`/${await requireClubSlug()}/admin/resources`)
  }

  return (
    <>
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
              Resources page is disabled
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--status-warning-text)', lineHeight: 1.5 }}>
              This page is hidden from members. You can still manage content here, but it won&apos;t appear in navigation until enabled.
            </p>
          </div>
          <form action={enableResources} style={{ flexShrink: 0 }}>
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
      <ResourcesClient categories={categories} resources={resources} clubSlug={clubSlug} />
    </>
  )
}

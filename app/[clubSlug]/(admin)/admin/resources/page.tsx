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

  const [catsResult, resResult] = await Promise.all([
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
  ])

  const categories: ResourceCategory[] = ((catsResult as any)?.data as ResourceCategory[]) ?? []
  const resources:  Resource[]          = ((resResult as any)?.data as Resource[]) ?? []

  return <ResourcesClient categories={categories} resources={resources} clubSlug={clubSlug} />
}

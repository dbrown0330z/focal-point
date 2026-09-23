import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId, requireClubSlug } from '@/lib/club-context'
import { seedDefaultCategories } from '../actions'
import ResourceFormClient from '../ResourceFormClient'
import type { ResourceCategory } from '../actions'

export const dynamic = 'force-dynamic'

export default async function NewResourcePage() {
  const [clubId, clubSlug] = await Promise.all([requireClubId(), requireClubSlug()])
  const supabase = createServiceClient()

  try { await seedDefaultCategories(clubId) } catch { /* migration guard */ }

  const [catsResult, countResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('resource_categories')
      .select('*')
      .eq('club_id', clubId)
      .order('sort_order'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('resources')
      .select('id', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('is_pinned', true),
  ])

  const categories: ResourceCategory[] = ((catsResult as any)?.data as ResourceCategory[]) ?? []
  const pinnedCount: number             = (countResult as any)?.count ?? 0

  return (
    <div>
      <div className="mb-4">
        <a
          href={`/${clubSlug}/admin/resources`}
          className="text-sm text-content-secondary hover:underline"
        >
          ← Resources
        </a>
        <h1 className="mt-1 text-[22px] font-bold tracking-[-0.015em] text-content-primary">
          Add resource
        </h1>
      </div>
      <ResourceFormClient
        categories={categories}
        pinnedCount={pinnedCount}
        clubSlug={clubSlug}
      />
    </div>
  )
}

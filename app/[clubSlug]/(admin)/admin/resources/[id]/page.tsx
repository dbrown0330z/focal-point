import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId, requireClubSlug } from '@/lib/club-context'
import ResourceFormClient from '../ResourceFormClient'
import type { ResourceCategory, Resource } from '../actions'

export const dynamic = 'force-dynamic'

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }   = await params
  const [clubId, clubSlug] = await Promise.all([requireClubId(), requireClubSlug()])
  const supabase = createServiceClient()

  const [catsResult, resourceResult, countResult] = await Promise.all([
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
      .eq('id', id)
      .eq('club_id', clubId)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('resources')
      .select('id', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('is_pinned', true),
  ])

  if (!(resourceResult as any)?.data) notFound()

  const categories: ResourceCategory[] = ((catsResult as any)?.data as ResourceCategory[]) ?? []
  const resource:   Resource            = (resourceResult as any).data as Resource
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
          Edit resource
        </h1>
      </div>
      <ResourceFormClient
        categories={categories}
        existing={resource}
        pinnedCount={pinnedCount}
        clubSlug={clubSlug}
      />
    </div>
  )
}

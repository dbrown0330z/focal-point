import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId, requireClubSlug } from '@/lib/club-context'
import ResourcesClient from './ResourcesClient'
import type { ResourceCategory, Resource, ResourceVisibility } from './types'

export const dynamic = 'force-dynamic'

export default async function ResourcesPage() {
  const [clubId, clubSlug] = await Promise.all([requireClubId(), requireClubSlug()])
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()

  // Determine what visibility levels this viewer can see
  let visibleLevels: ResourceVisibility[] = ['public']
  if (user) {
    const { data: membership } = await admin
      .from('club_memberships')
      .select('role, membership_status')
      .eq('user_id', user.id)
      .eq('club_id', clubId)
      .maybeSingle()

    const isActive = ['active', 'complimentary'].includes(membership?.membership_status ?? '')
    if (isActive) {
      visibleLevels = ['public', 'members']
      if ((membership?.role as string) === 'admin' || (membership?.role as string) === 'board') {
        visibleLevels = ['public', 'members', 'board']
      }
    }
  }

  const [catsResult, resResult, memberCountResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('resource_categories')
      .select('*')
      .eq('club_id', clubId)
      .eq('is_visible', true)
      .order('sort_order'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('resources')
      .select('*')
      .eq('club_id', clubId)
      .eq('status', 'published')
      .in('visibility', visibleLevels)
      .order('sort_order')
      .order('published_at', { ascending: false }),
    // Count member-only items when viewing as public (for the "sign in to see more" prompt)
    !user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (admin as any)
          .from('resources')
          .select('id', { count: 'exact', head: true })
          .eq('club_id', clubId)
          .eq('status', 'published')
          .in('visibility', ['members', 'board'])
      : Promise.resolve({ count: 0 }),
  ])

  const categories: ResourceCategory[] = ((catsResult as any)?.data as ResourceCategory[]) ?? []
  const resources:  Resource[]          = ((resResult as any)?.data as Resource[]) ?? []
  const hiddenCount: number             = (memberCountResult as any)?.count ?? 0

  return (
    <ResourcesClient
      categories={categories}
      resources={resources}
      hiddenCount={hiddenCount}
      isAuthenticated={!!user}
      clubSlug={clubSlug}
    />
  )
}

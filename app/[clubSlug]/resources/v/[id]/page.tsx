import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId, requireClubSlug } from '@/lib/club-context'
import { notFound } from 'next/navigation'
import ResourcesClient from '../../ResourcesClient'
import type { ResourceCategory, Resource, ResourceVisibility } from '../../types'

export const dynamic = 'force-dynamic'

// noindex for video share pages
export const metadata = { robots: 'noindex' }

export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }     = await params
  const [clubId, clubSlug] = await Promise.all([requireClubId(), requireClubSlug()])
  const supabase   = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin      = createServiceClient()

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

  const [catsResult, resResult] = await Promise.all([
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
  ])

  const categories: ResourceCategory[] = ((catsResult as any)?.data as ResourceCategory[]) ?? []
  const resources:  Resource[]          = ((resResult as any)?.data as Resource[]) ?? []

  // Verify the resource exists and is visible
  const video = resources.find(r => r.id === id && r.source_type === 'video')
  if (!video) notFound()

  return (
    <ResourcesClient
      categories={categories}
      resources={resources}
      hiddenCount={0}
      isAuthenticated={!!user}
      clubSlug={clubSlug}
      initialVideoId={id}
    />
  )
}

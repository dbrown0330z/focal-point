import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId } from '@/lib/club-context'
import CompetitionDefaultsClient from './CompetitionDefaultsClient'

export default async function CompetitionDefaultsPage() {
  const supabase = await createClient()
  const admin = createServiceClient()
  const clubId = await requireClubId()

  const [{ data: categories }, { data: defaults }] = await Promise.all([
    admin
      .from('competition_default_categories')
      .select('id, name')
      .eq('club_id', clubId)
      .order('sort_order', { ascending: true }),
    admin
      .from('competition_defaults')
      .select('*')
      .eq('club_id', clubId)
      .maybeSingle(),
  ])

  return (
    <CompetitionDefaultsClient
      initialCategories={categories ?? []}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initial={(defaults as any) ?? undefined}
    />
  )
}

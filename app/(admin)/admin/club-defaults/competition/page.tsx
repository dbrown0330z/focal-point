import { createServiceClient } from '@/lib/supabase/service'
import CompetitionDefaultsClient from './CompetitionDefaultsClient'

export default async function CompetitionDefaultsPage() {
  const admin = createServiceClient()

  const [{ data: categories }, { data: defaults }] = await Promise.all([
    admin
      .from('competition_default_categories')
      .select('id, name')
      .order('sort_order', { ascending: true }),
    admin
      .from('competition_defaults')
      .select('*')
      .single(),
  ])

  return (
    <CompetitionDefaultsClient
      initialCategories={categories ?? []}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initial={(defaults as any) ?? undefined}
    />
  )
}

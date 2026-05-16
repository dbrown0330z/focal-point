import { createClient } from '@/lib/supabase/server'
import CompetitionDefaultsClient from './CompetitionDefaultsClient'

export default async function CompetitionDefaultsPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: defaults }] = await Promise.all([
    supabase
      .from('competition_default_categories')
      .select('id, name')
      .order('sort_order', { ascending: true }),
    supabase
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

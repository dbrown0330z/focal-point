import { createClient } from '@/lib/supabase/server'
import CompetitionDefaultsClient from './CompetitionDefaultsClient'

export default async function CompetitionDefaultsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('competition_default_categories')
    .select('id, name')
    .order('sort_order', { ascending: true })

  return <CompetitionDefaultsClient initialCategories={data ?? []} />
}

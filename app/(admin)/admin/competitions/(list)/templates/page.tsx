import { createServiceClient } from '@/lib/supabase/service'
import TemplatesClient from './TemplatesClient'
import type { CompetitionConfig } from '@/types/competition'

export const dynamic = 'force-dynamic'

export default async function CompetitionTemplatesPage() {
  const supabase = createServiceClient()

  const { data: templates } = await supabase
    .from('competition_templates')
    .select('id, name, config, created_at, updated_at')
    .order('created_at', { ascending: false })

  const rows = (templates ?? []).map(t => ({
    id:         t.id,
    name:       t.name,
    config:     t.config as unknown as CompetitionConfig,
    created_at: t.created_at,
    updated_at: t.updated_at,
  }))

  const { data: categoryRows } = await supabase
    .from('competition_default_categories')
    .select('name')
    .order('sort_order', { ascending: true })

  const clubCategories = categoryRows?.map(r => r.name) ?? ['Open', 'Nature', 'Monochrome']

  return (
    <TemplatesClient templates={rows} clubCategories={clubCategories} />
  )
}

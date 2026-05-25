import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug } from '@/lib/club-context'
import TemplatesClient from './TemplatesClient'
import type { CompetitionConfig } from '@/types/competition'

export const dynamic = 'force-dynamic'

export default async function CompetitionTemplatesPage() {
  const clubSlug = await requireClubSlug()
  const supabase = createServiceClient()

  const [{ data: templates }, { data: usageRows }] = await Promise.all([
    supabase
      .from('competition_templates')
      .select('id, name, config, created_at, updated_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('competitions')
      .select('template_id')
      .not('template_id', 'is', null),
  ])

  // Build a usage-count map: template_id → number of competitions
  const usageMap: Record<string, number> = {}
  for (const row of usageRows ?? []) {
    if (row.template_id) usageMap[row.template_id] = (usageMap[row.template_id] ?? 0) + 1
  }

  const rows = (templates ?? []).map(t => ({
    id:         t.id,
    name:       t.name,
    config:     t.config as unknown as CompetitionConfig,
    created_at: t.created_at,
    updated_at: t.updated_at,
    usageCount: usageMap[t.id] ?? 0,
  }))

  const { data: categoryRows } = await supabase
    .from('competition_default_categories')
    .select('name')
    .order('sort_order', { ascending: true })

  const clubCategories = categoryRows?.map(r => r.name) ?? ['Open', 'Nature', 'Monochrome']

  return (
    <TemplatesClient templates={rows} clubCategories={clubCategories} clubSlug={clubSlug} />
  )
}

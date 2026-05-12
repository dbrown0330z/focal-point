import { createClient } from '@/lib/supabase/server'
import NavigationClient from './NavigationClient'
import { DEFAULT_BLOCKS, type ContentBlock } from '@/lib/homepage/types'

export const dynamic = 'force-dynamic'

export default async function NavigationPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any

  const [{ data: customPages }, { data: customTabs }, { data: clubSettings }] = await Promise.all([
    supabase.from('nav_custom_pages').select('id,title,slug,parent_system,tab_id,page_type,external_url,visibility,status,sort_order,updated_at').order('sort_order'),
    supabase.from('nav_custom_tabs').select('*').order('sort_order'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('club_settings').select('homepage_blocks').single(),
  ])

  const saved: ContentBlock[] = clubSettings?.homepage_blocks ?? DEFAULT_BLOCKS
  // Append any block types added to DEFAULT_BLOCKS since the last save
  const savedIds = new Set(saved.map((b: ContentBlock) => b.id))
  const homepageBlocks: ContentBlock[] = [
    ...saved,
    ...DEFAULT_BLOCKS.filter(d => !savedIds.has(d.id)),
  ]

  return (
    <NavigationClient
      customPages={customPages ?? []}
      customTabs={customTabs ?? []}
      initialHomepageBlocks={homepageBlocks}
    />
  )
}

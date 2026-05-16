import { createClient } from '@/lib/supabase/server'
import NavigationClient, { type CustomPage, type CustomTab } from './NavigationClient'
import { DEFAULT_BLOCKS, mergeBlocks, type ContentBlock } from '@/lib/homepage/types'

export const dynamic = 'force-dynamic'

export default async function NavigationPage() {
  const supabase = await createClient()

  const [{ data: customPages }, { data: customTabs }, { data: clubSettings }] = await Promise.all([
    supabase.from('nav_custom_pages').select('id,title,slug,parent_system,tab_id,page_type,external_url,visibility,status,sort_order,updated_at').order('sort_order'),
    supabase.from('nav_custom_tabs').select('*').order('sort_order'),
    supabase.from('club_settings').select('homepage_blocks').single(),
  ])

  const saved: ContentBlock[] = (clubSettings?.homepage_blocks as ContentBlock[] | null) ?? DEFAULT_BLOCKS
  const homepageBlocks: ContentBlock[] = mergeBlocks(saved, DEFAULT_BLOCKS)

  return (
    <NavigationClient
      customPages={(customPages ?? []) as unknown as CustomPage[]}
      customTabs={(customTabs ?? []) as unknown as CustomTab[]}
      initialHomepageBlocks={homepageBlocks}
    />
  )
}

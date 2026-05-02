import { createClient } from '@/lib/supabase/server'
import NavigationClient from './NavigationClient'

export const dynamic = 'force-dynamic'

export default async function NavigationPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any

  const [{ data: customPages }, { data: customTabs }] = await Promise.all([
    supabase.from('nav_custom_pages').select('id,title,slug,parent_system,tab_id,page_type,external_url,visibility,status,sort_order,updated_at').order('sort_order'),
    supabase.from('nav_custom_tabs').select('*').order('sort_order'),
  ])

  return (
    <NavigationClient
      customPages={customPages ?? []}
      customTabs={customTabs ?? []}
    />
  )
}

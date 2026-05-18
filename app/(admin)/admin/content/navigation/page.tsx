import { createServiceClient } from '@/lib/supabase/service'
import NavigationClient from './NavigationClient'

export const dynamic = 'force-dynamic'

export default async function NavigationPage() {
  const admin = createServiceClient()

  const [{ data: customPages }, { data: customTabs }] = await Promise.all([
    admin.from('nav_custom_pages').select('id,title,slug,parent_system,tab_id,page_type,external_url,visibility,status,sort_order,updated_at').order('sort_order'),
    admin.from('nav_custom_tabs').select('*').order('sort_order'),
  ])

  return (
    <NavigationClient
      customPages={customPages ?? []}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customTabs={(customTabs ?? []) as any}
    />
  )
}

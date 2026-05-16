import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CustomPageEditor from './CustomPageEditor'

export const dynamic = 'force-dynamic'

export default async function EditCustomPagePage({
  params,
}: {
  params: Promise<{ pageId: string }>
}) {
  const { pageId } = await params
  const supabase = await createClient()

  const { data: page, error } = await supabase
    .from('nav_custom_pages')
    .select('id, title, slug, visibility, status, content, page_type, updated_at')
    .eq('id', pageId)
    .single()

  if (error || !page) redirect('/admin/content/navigation')
  if (page.page_type !== 'rich_text') redirect('/admin/content/navigation')

  return (
    <CustomPageEditor
      pageId={page.id}
      menuLabel={page.title}
      initialTitle={page.title}
      initialContent={page.content ?? ''}
      initialVisibility={page.visibility as 'all_members' | 'members_only' | 'hidden'}
      initialStatus={page.status as 'draft' | 'published'}
      slug={page.slug}
    />
  )
}

import { createClient } from '@/lib/supabase/server'
import AboutPageEditor from './AboutPageEditor'

export const dynamic = 'force-dynamic'

type RawPage = { id: string; content: string | null }

export default async function AdminAboutPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any

  const { data } = await supabase
    .from('pages')
    .select('id, content')
    .eq('slug', 'about')
    .single() as { data: RawPage | null }

  return (
    <AboutPageEditor
      pageId={data?.id ?? null}
      initialContent={data?.content ?? '<p>Write something about your club here…</p>'}
    />
  )
}

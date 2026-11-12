import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import JoinPageEditor from './JoinPageEditor'

export const dynamic = 'force-dynamic'

export default async function AdminJoinPage() {
  const admin  = createServiceClient()
  const ctx    = await getClubContext()
  const clubId = ctx?.clubId

  const { data: pageRaw } = await (
    clubId
      ? (admin.from('pages').select('id, content').eq('slug', 'join-renew').eq('club_id', clubId).maybeSingle() as unknown as Promise<{ data: { id: string; content: string | null } | null }>)
      : Promise.resolve({ data: null })
  )

  return (
    <JoinPageEditor
      pageId={pageRaw?.id ?? null}
      initialContent={pageRaw?.content ?? '<p>Welcome! We\'d love to have you as a member of our club. Here\'s everything you need to know about joining or renewing your membership.</p>'}
      clubSlug={ctx?.clubSlug ?? ''}
    />
  )
}

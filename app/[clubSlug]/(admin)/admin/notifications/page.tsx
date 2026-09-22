import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug } from '@/lib/club-context'
import CommunicationClient from './CommunicationClient'

export const dynamic = 'force-dynamic'

export default async function SentMessagesPage() {
  const [clubSlug] = await Promise.all([requireClubSlug()])
  const admin = createServiceClient()

  const [{ data: messages }, { data: members }, { data: settings }] = await Promise.all([
    admin
      .from('sent_messages')
      .select('id, subject, sent_to, sent_at, sent_by')
      .order('sent_at', { ascending: false })
      .limit(100),
    admin
      .from('profiles')
      .select('id, display_name, first_name, last_name, membership_status')
      .not('membership_status', 'is', null)
      .order('display_name'),
    admin
      .from('club_settings')
      .select('club_name, from_email')
      .single(),
  ])

  const clubName    = settings?.club_name?.trim() || 'Your Club'
  const rawFrom     = settings?.from_email?.trim()
  const appDomain   = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'focalpointhq.com'
  const fromAddress = rawFrom
    ? `${clubName} <${rawFrom}>`
    : `${clubName} <notifications@${appDomain}>`

  return (
    <CommunicationClient
      messages={messages ?? []}
      members={members ?? []}
      fromAddress={fromAddress}
      clubName={clubName}
      clubSlug={clubSlug}
    />
  )
}

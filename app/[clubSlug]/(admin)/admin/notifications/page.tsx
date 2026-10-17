import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug, requireClubId } from '@/lib/club-context'
import CommunicationClient from './CommunicationClient'

export const dynamic = 'force-dynamic'

export default async function SentMessagesPage() {
  const [clubSlug, clubId] = await Promise.all([requireClubSlug(), requireClubId()])
  const admin = createServiceClient()

  // Get club members for recipient picker (scoped via club_memberships)
  const { data: membershipRows } = await admin
    .from('club_memberships')
    .select('user_id')
    .eq('club_id', clubId)
    .in('membership_status', ['active', 'complimentary'])

  const memberIds = (membershipRows ?? []).map(r => r.user_id)

  const [{ data: messages }, { data: members }, { data: settings }] = await Promise.all([
    admin
      .from('sent_messages')
      .select('id, subject, sent_to, sent_at, sent_by')
      .eq('club_id', clubId)
      .order('sent_at', { ascending: false })
      .limit(100),
    memberIds.length > 0
      ? admin
          .from('profiles')
          .select('id, display_name, first_name, last_name, membership_status')
          .in('id', memberIds)
          .order('display_name')
      : Promise.resolve({ data: [] }),
    admin
      .from('club_settings')
      .select('club_name, from_email')
      .eq('club_id', clubId)
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

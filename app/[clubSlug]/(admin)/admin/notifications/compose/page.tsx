import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import ComposeClient from './ComposeClient'

export default async function ComposePage() {
  const supabase = await createClient()
  const admin = createServiceClient()

  const [{ data: members }, { data: settings }] = await Promise.all([
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

  const clubName  = settings?.club_name?.trim() || 'Your Club'
  const rawFrom   = settings?.from_email?.trim()
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'focalpointhq.com'
  // Show the exact address the action will use, so the admin always sees a value
  const fromAddress = rawFrom
    ? `${clubName} <${rawFrom}>`
    : `${clubName} <notifications@${appDomain}>`

  return <ComposeClient members={members ?? []} fromAddress={fromAddress} clubName={clubName} />
}

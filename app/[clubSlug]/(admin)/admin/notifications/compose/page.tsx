import { createClient } from '@/lib/supabase/server'
import ComposeClient from './ComposeClient'

export default async function ComposePage() {
  const supabase = await createClient()

  const [{ data: members }, { data: settings }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, first_name, last_name, membership_status')
      .not('membership_status', 'is', null)
      .order('display_name'),
    supabase
      .from('club_settings')
      .select('club_name, from_email')
      .single(),
  ])

  const fromEmail = settings?.from_email?.trim() || ''
  const clubName  = settings?.club_name?.trim() || 'Your Club'

  return <ComposeClient members={members ?? []} fromEmail={fromEmail} clubName={clubName} />
}

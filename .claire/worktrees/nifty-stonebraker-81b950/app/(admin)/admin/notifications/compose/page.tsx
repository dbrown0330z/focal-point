import { createClient } from '@/lib/supabase/server'
import ComposeClient from './ComposeClient'

export default async function ComposePage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('profiles')
    .select('id, display_name, first_name, last_name, membership_status')
    .not('membership_status', 'is', null)
    .order('display_name')

  // TODO: pull from club settings once that table has an email field
  const fromEmail = 'club@example.com'

  return <ComposeClient members={members ?? []} fromEmail={fromEmail} />
}

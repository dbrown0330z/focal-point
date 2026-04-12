import { createClient } from '@/lib/supabase/server'
import MembersClient from './MembersClient'

export default async function MembersPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, member_number, membership_status, membership_class, role, created_at')
    .order('member_number', { ascending: true })

  return <MembersClient profiles={profiles ?? []} />
}

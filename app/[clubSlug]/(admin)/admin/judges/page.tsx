import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId } from '@/lib/club-context'
import JudgesClient from './JudgesClient'

export const dynamic = 'force-dynamic'

export default async function JudgesPage() {
  const admin  = createServiceClient()
  const clubId = await requireClubId()

  const { data } = await admin
    .from('judge_directory')
    .select('id, name, email')
    .eq('club_id', clubId)
    .order('name', { ascending: true })

  const judges = (data ?? []).map(j => ({
    id:    j.id,
    name:  j.name,
    email: j.email,
  }))

  return <JudgesClient judges={judges} />
}

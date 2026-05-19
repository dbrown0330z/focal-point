import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId } from '@/lib/club-context'
import JudgesClient from './JudgesClient'
import type { JudgeRow } from './actions'

export const dynamic = 'force-dynamic'

export default async function JudgesPage() {
  const admin  = createServiceClient()
  const clubId = await requireClubId()

  const { data } = await admin
    .from('judge_directory')
    .select('id, first_name, last_name, email, phone, website')
    .eq('club_id', clubId)
    .order('last_name', { ascending: true })

  const judges: JudgeRow[] = (data ?? []).map(j => ({
    id:         j.id,
    first_name: j.first_name ?? '',
    last_name:  j.last_name  ?? '',
    email:      j.email,
    phone:      j.phone   ?? null,
    website:    j.website ?? null,
  }))

  return <JudgesClient judges={judges} />
}

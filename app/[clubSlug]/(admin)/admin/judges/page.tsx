import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId } from '@/lib/club-context'
import JudgesClient from './JudgesClient'

export const dynamic = 'force-dynamic'

export type JudgeWithCount = {
  id:               string
  first_name:       string
  last_name:        string
  email:            string
  phone:            string | null
  website:          string | null
  competitionCount: number
}

export default async function JudgesPage() {
  const admin  = createServiceClient()
  const clubId = await requireClubId()

  const [{ data }, { data: tokens }] = await Promise.all([
    admin
      .from('judge_directory')
      .select('id, first_name, last_name, email, phone, website')
      .eq('club_id', clubId)
      .order('last_name', { ascending: true }),
    admin
      .from('judge_tokens')
      .select('judge_email')
      .eq('club_id', clubId),
  ])

  const countMap: Record<string, number> = {}
  for (const t of tokens ?? []) {
    countMap[t.judge_email] = (countMap[t.judge_email] ?? 0) + 1
  }

  const judges: JudgeWithCount[] = (data ?? []).map(j => ({
    id:               j.id,
    first_name:       j.first_name ?? '',
    last_name:        j.last_name  ?? '',
    email:            j.email,
    phone:            j.phone   ?? null,
    website:          j.website ?? null,
    competitionCount: countMap[j.email] ?? 0,
  }))

  return <JudgesClient judges={judges} />
}

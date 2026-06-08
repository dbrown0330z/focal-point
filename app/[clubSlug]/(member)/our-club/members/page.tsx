import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import MembersClient from './MembersClient'

export const dynamic = 'force-dynamic'

export type MemberRow = {
  id:                 string
  first_name:         string | null
  last_name:          string | null
  display_name:       string
  avatar_url:         string | null
  bio:                string | null
  experience_level:   string | null
  shooting_interests: string[] | null
  camera_brands:      string[] | null
  location:           string | null
  member_since:       string | null
  member_number:      number | null
  membership_class:   string | null
  submissions_all:    number
  submissions_ytd:    number
}

export default async function MembersPage() {
  const admin  = createServiceClient()
  const ctx    = await getClubContext()
  const clubId = ctx?.clubId

  const { data: settingsRaw } = clubId
    ? await admin
        .from('club_settings')
        .select('member_directory_visibility')
        .eq('club_id', clubId)
        .single()
    : { data: null }

  const visible = settingsRaw?.member_directory_visibility !== 'admin_only'

  // Step 1: active member user_ids for this club
  const { data: memberships } = visible && clubId
    ? await admin
        .from('club_memberships')
        .select('user_id')
        .eq('club_id', clubId)
        .eq('membership_status', 'active')
    : { data: null }

  const userIds = (memberships ?? []).map(m => m.user_id)

  if (userIds.length === 0) {
    return <MembersClient members={[]} directoryVisible={visible} />
  }

  const thisYear      = new Date().getFullYear()
  const yearStart     = `${thisYear}-01-01`

  // Fetch profiles + submission counts in parallel
  const [{ data: profilesRaw }, { data: subsAll }, { data: subsYtd }] = await Promise.all([
    admin
      .from('profiles')
      .select('id, first_name, last_name, display_name, avatar_url, bio, experience_level, shooting_interests, camera_brands, location, created_at, member_number, membership_class')
      .in('id', userIds)
      .order('last_name', { ascending: true }),

    // All-time submission counts
    admin
      .from('submissions')
      .select('member_id')
      .in('member_id', userIds)
      .eq('status', 'submitted'),

    // YTD submission counts — submitted_at exists at runtime; cast to bypass TS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from('submissions') as any)
      .select('member_id')
      .in('member_id', userIds)
      .eq('status', 'submitted')
      .gte('submitted_at', yearStart),
  ])

  // Aggregate counts
  const allCount: Record<string, number> = {}
  const ytdCount: Record<string, number> = {}
  for (const s of subsAll  ?? []) allCount[s.member_id] = (allCount[s.member_id] ?? 0) + 1
  for (const s of subsYtd  ?? []) ytdCount[s.member_id] = (ytdCount[s.member_id] ?? 0) + 1

  const members: MemberRow[] = (profilesRaw ?? []).map(p => ({
    id:                 p.id,
    first_name:         p.first_name  ?? null,
    last_name:          p.last_name   ?? null,
    display_name:       p.display_name,
    avatar_url:         p.avatar_url  ?? null,
    bio:                p.bio         ?? null,
    experience_level:   p.experience_level ?? null,
    shooting_interests: p.shooting_interests ?? null,
    camera_brands:      p.camera_brands     ?? null,
    location:           p.location    ?? null,
    member_since:       p.created_at  ?? null,
    member_number:      p.member_number ?? null,
    membership_class:   p.membership_class ?? null,
    submissions_all:    allCount[p.id] ?? 0,
    submissions_ytd:    ytdCount[p.id] ?? 0,
  }))

  return (
    <MembersClient
      members={members}
      directoryVisible={visible}
    />
  )
}

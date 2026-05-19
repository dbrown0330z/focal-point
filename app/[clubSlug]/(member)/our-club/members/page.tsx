import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import MembersClient from './MembersClient'

export const dynamic = 'force-dynamic'

export type MemberRow = {
  id:                 string
  display_name:       string
  avatar_url:         string | null
  bio:                string | null
  skill_level:        string | null
  shooting_interests: string[] | null
  camera_brands:      string[] | null
  location:           string | null
  member_since:       string | null
}

export default async function MembersPage() {
  const admin = createServiceClient()
  const ctx = await getClubContext()
  const clubId = ctx?.clubId

  const { data: settingsRaw } = clubId
    ? await admin
        .from('club_settings')
        .select('member_directory_visibility')
        .eq('club_id', clubId)
        .single()
    : { data: null }

  const visible = settingsRaw?.member_directory_visibility !== 'admin_only'

  // Step 1: get active member user_ids for this club
  const { data: memberships } = visible && clubId
    ? await admin
        .from('club_memberships')
        .select('user_id')
        .eq('club_id', clubId)
        .eq('membership_status', 'active')
    : { data: null }

  const userIds = (memberships ?? []).map(m => m.user_id)

  // Step 2: fetch profiles for those user_ids
  const { data: profilesRaw } = userIds.length > 0
    ? await admin
        .from('profiles')
        .select('id, display_name, avatar_url, bio, skill_level, shooting_interests, camera_brands, location, created_at')
        .in('id', userIds)
        .order('display_name')
    : { data: null }

  const members: MemberRow[] = (profilesRaw ?? []).map(p => ({
    id:                 p.id,
    display_name:       p.display_name,
    avatar_url:         p.avatar_url ?? null,
    bio:                p.bio ?? null,
    skill_level:        p.skill_level ?? null,
    shooting_interests: p.shooting_interests ?? null,
    camera_brands:      p.camera_brands ?? null,
    location:           p.location ?? null,
    member_since:       p.created_at ?? null,
  }))

  return (
    <MembersClient
      members={members}
      directoryVisible={visible}
    />
  )
}

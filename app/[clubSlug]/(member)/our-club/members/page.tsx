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

  const { data: settingsRaw } = await admin
    .from('club_settings')
    .select('member_directory_visibility')
    .single()

  const visible = settingsRaw?.member_directory_visibility !== 'admin_only'

  // Query active club members via club_memberships → profiles join
  const { data: memberships } = visible && clubId
    ? await admin
        .from('club_memberships')
        .select('user_id, profiles(id, display_name, avatar_url, bio, skill_level, shooting_interests, camera_brands, location, created_at)')
        .eq('club_id', clubId)
        .eq('membership_status', 'active')
    : { data: null }

  const members: MemberRow[] = (memberships ?? []).flatMap(row => {
    const p = row.profiles as unknown as {
      id: string; display_name: string; avatar_url: string | null
      bio: string | null; skill_level: string | null
      shooting_interests: string[] | null; camera_brands: string[] | null
      location: string | null; created_at: string
    } | null
    if (!p) return []
    return [{
      id:                 p.id,
      display_name:       p.display_name,
      avatar_url:         p.avatar_url ?? null,
      bio:                p.bio ?? null,
      skill_level:        p.skill_level ?? null,
      shooting_interests: p.shooting_interests ?? null,
      camera_brands:      p.camera_brands ?? null,
      location:           p.location ?? null,
      member_since:       p.created_at ?? null,
    }]
  }).sort((a, b) => a.display_name.localeCompare(b.display_name))

  return (
    <MembersClient
      members={members}
      directoryVisible={visible}
    />
  )
}

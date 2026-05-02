import { createClient } from '@/lib/supabase/server'
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

type RawMember = {
  id: string; display_name: string; avatar_url: string | null
  bio: string | null; skill_level: string | null
  shooting_interests: string[] | null; camera_brands: string[] | null
  location: string | null; created_at: string
}

export default async function MembersPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any

  const { data: settingsRaw } = await supabase
    .from('club_settings')
    .select('member_directory_visibility')
    .single() as { data: { member_directory_visibility: string } | null }

  const visible = settingsRaw?.member_directory_visibility !== 'admin_only'

  const membersRaw: RawMember[] = visible
    ? ((await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, bio, skill_level, shooting_interests, camera_brands, location, created_at')
        .eq('membership_status', 'active')
        .order('display_name') as { data: RawMember[] | null }).data ?? [])
    : []

  const members: MemberRow[] = membersRaw.map(m => ({
    id:                 m.id,
    display_name:       m.display_name,
    avatar_url:         m.avatar_url ?? null,
    bio:                m.bio ?? null,
    skill_level:        m.skill_level ?? null,
    shooting_interests: m.shooting_interests ?? null,
    camera_brands:      m.camera_brands ?? null,
    location:           m.location ?? null,
    member_since:       m.created_at ?? null,
  }))

  return (
    <MembersClient
      members={members}
      directoryVisible={visible}
    />
  )
}

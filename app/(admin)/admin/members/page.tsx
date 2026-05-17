import { createServiceClient } from '@/lib/supabase/service'
import MembersClient from './MembersClient'

export default async function MembersPage() {
  const serviceSupabase = createServiceClient()

  const [
    { data: profiles },
    { data: submissions },
    { data: clubSettings },
    { data: { users } },
    { data: memberClasses },
  ] = await Promise.all([
    serviceSupabase
      .from('profiles')
      .select('id, first_name, last_name, display_name, member_number, membership_status, membership_class, role, created_at, bio, camera_brands, shooting_interests, experience_level, avatar_url')
      .order('member_number', { ascending: true }),
    serviceSupabase.from('submissions').select('member_id'),
    serviceSupabase.from('club_settings').select('member_classes_enabled').single(),
    serviceSupabase.auth.admin.listUsers({ perPage: 1000 }),
    serviceSupabase.from('member_classes').select('id, name').order('sort_order').order('created_at'),
  ])

  const emailById: Record<string, string> = {}
  for (const u of users) {
    if (u.email) emailById[u.id] = u.email
  }

  const submissionCounts: Record<string, number> = {}
  for (const s of submissions ?? []) {
    submissionCounts[s.member_id] = (submissionCounts[s.member_id] ?? 0) + 1
  }

  const profilesWithCounts = (profiles ?? []).map(p => ({
    ...p,
    submission_count: submissionCounts[p.id] ?? 0,
    email: emailById[p.id] ?? null,
  }))

  return (
    <MembersClient
      profiles={profilesWithCounts}
      memberClassesEnabled={clubSettings?.member_classes_enabled ?? false}
      memberClasses={memberClasses ?? []}
    />
  )
}

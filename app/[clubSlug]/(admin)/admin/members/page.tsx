import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import MembersClient from './MembersClient'

export default async function MembersPage() {
  const supabase        = await createClient()
  const admin = createServiceClient()

  const [
    { data: profiles },
    { data: submissions },
    { data: clubSettings },
    { data: { users } },
    { data: memberClasses },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, last_name, display_name, member_number, membership_status, membership_class, role, created_at, bio, camera_brands, shooting_interests, experience_level, avatar_url, location, phone')
      .order('member_number', { ascending: true }),
    admin.from('submissions').select('member_id'),
    admin.from('club_settings').select('member_classes_enabled').single(),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('member_classes').select('id, name').order('sort_order').order('created_at'),
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
    submission_count:         submissionCounts[p.id] ?? 0,
    email:                    emailById[p.id] ?? null,
    // Permission columns added by migration 20260525000001 — default false
    // until the migration has been applied to this environment.
    perm_competition_manager:  (p as { perm_competition_manager?: boolean }).perm_competition_manager ?? false,
    perm_event_manager:        (p as { perm_event_manager?: boolean }).perm_event_manager ?? false,
    perm_comms_manager:        (p as { perm_comms_manager?: boolean }).perm_comms_manager ?? false,
    // Preference columns added by migration 20260525000002 — default true until migration runs
    pref_competition_reminders: (p as { pref_competition_reminders?: boolean }).pref_competition_reminders ?? true,
    pref_results_notifications: (p as { pref_results_notifications?: boolean }).pref_results_notifications ?? true,
  }))

  return (
    <MembersClient
      profiles={profilesWithCounts}
      memberClassesEnabled={clubSettings?.member_classes_enabled ?? false}
      memberClasses={memberClasses ?? []}
    />
  )
}

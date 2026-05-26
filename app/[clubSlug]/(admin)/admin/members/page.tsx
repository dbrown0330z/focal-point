import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import MembersClient from './MembersClient'

export default async function MembersPage() {
  const supabase = await createClient()
  const admin    = createServiceClient()

  const thisYear     = new Date().getFullYear()
  const yearStart    = `${thisYear}-01-01`
  const nextYearStart = `${thisYear + 1}-01-01`

  const [
    { data: profiles },
    { data: submissions },
    { data: submissionsThisYear },
    { data: clubSettings },
    { data: { users } },
    { data: memberClasses },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, last_name, display_name, member_number, membership_status, membership_class, role, created_at, bio, camera_brands, shooting_interests, experience_level, avatar_url, location, phone')
      .order('member_number', { ascending: true }),
    admin.from('submissions').select('member_id'),
    admin.from('submissions').select('member_id').gte('created_at', yearStart).lt('created_at', nextYearStart),
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

  const submissionCountsThisYear: Record<string, number> = {}
  for (const s of submissionsThisYear ?? []) {
    submissionCountsThisYear[s.member_id] = (submissionCountsThisYear[s.member_id] ?? 0) + 1
  }

  const profilesWithCounts = (profiles ?? []).map(p => ({
    ...p,
    submission_count:           submissionCounts[p.id] ?? 0,
    submission_count_this_year: submissionCountsThisYear[p.id] ?? 0,
    email:                      emailById[p.id] ?? null,
    // Permission columns added by migration 20260525000001 — default false until migration runs
    perm_competition_manager:   (p as { perm_competition_manager?: boolean }).perm_competition_manager ?? false,
    perm_event_manager:         (p as { perm_event_manager?: boolean }).perm_event_manager ?? false,
    perm_comms_manager:         (p as { perm_comms_manager?: boolean }).perm_comms_manager ?? false,
    // Preference columns — default true until migrations 20260525000002/3 run
    pref_competition_reminders: (p as { pref_competition_reminders?: boolean }).pref_competition_reminders ?? true,
    pref_results_notifications: (p as { pref_results_notifications?: boolean }).pref_results_notifications ?? true,
    pref_club_newsletter:       (p as { pref_club_newsletter?: boolean }).pref_club_newsletter ?? true,
    pref_public_profile:        (p as { pref_public_profile?: boolean }).pref_public_profile ?? true,
    pref_show_scores_publicly:  (p as { pref_show_scores_publicly?: boolean }).pref_show_scores_publicly ?? true,
  }))

  return (
    <MembersClient
      profiles={profilesWithCounts}
      memberClassesEnabled={clubSettings?.member_classes_enabled ?? false}
      memberClasses={memberClasses ?? []}
    />
  )
}

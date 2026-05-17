import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import ClubDefaultsClient from './ClubDefaultsClient'

export default async function ClubDefaultsPage() {
  const supabase = await createClient()
  const admin = createServiceClient()

  const [{ data: settingsRow }, { data: locations }] = await Promise.all([
    admin.from('club_settings').select('*').single(),
    admin.from('meeting_locations').select('id, name, address').order('sort_order').order('created_at'),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = settingsRow as any
  const settings = {
    club_name:                     row?.club_name                     ?? '',
    club_short_name:               row?.club_short_name               ?? '',
    club_location:                 row?.club_location                 ?? '',
    contact_email:                 row?.contact_email                 ?? '',
    from_email:                    row?.from_email                    ?? '',
    timezone:                      row?.timezone                      ?? 'America/New_York',
    logo_path:                     row?.logo_path                     ?? null,
    season_start_month:            row?.season_start_month            ?? 9,
    season_end_month:              row?.season_end_month              ?? 8,
    member_directory_visibility:   row?.member_directory_visibility   ?? 'members',
    membership_terms_source:       row?.membership_terms_source       ?? 'default',
    membership_terms_reviewed:     row?.membership_terms_reviewed     ?? false,
    membership_terms_updated_at:   row?.membership_terms_updated_at   ?? null,
    membership_terms_content:      row?.membership_terms_content      ?? null,
    membership_terms_file_path:    row?.membership_terms_file_path    ?? null,
    membership_terms_file_name:    row?.membership_terms_file_name    ?? null,
  }

  return (
    <ClubDefaultsClient
      settings={settings}
      locations={locations ?? []}
    />
  )
}

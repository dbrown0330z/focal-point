import { createClient } from '@/lib/supabase/server'
import ClubDefaultsClient from './ClubDefaultsClient'

export default async function ClubDefaultsPage() {
  const supabase = await createClient()

  const [{ data: settingsRow }, { data: locations }] = await Promise.all([
    supabase.from('club_settings').select('*').single(),
    supabase.from('meeting_locations').select('id, name, address').order('sort_order').order('created_at'),
  ])

  const settings = {
    club_name:          settingsRow?.club_name          ?? '',
    club_short_name:    settingsRow?.club_short_name    ?? '',
    club_location:      settingsRow?.club_location      ?? '',
    timezone:           settingsRow?.timezone           ?? 'America/New_York',
    logo_path:          settingsRow?.logo_path          ?? null,
    season_start_month: settingsRow?.season_start_month ?? 9,
    season_end_month:   settingsRow?.season_end_month   ?? 8,
  }

  return (
    <ClubDefaultsClient
      settings={settings}
      locations={locations ?? []}
    />
  )
}

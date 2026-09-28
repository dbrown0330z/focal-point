import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import AboutPageEditor from './AboutPageEditor'

export const dynamic = 'force-dynamic'

type ClubInfo = {
  club_name:              string
  club_location:          string | null
  contact_email:          string | null
  website_url:            string | null
  facebook_url:           string | null
  instagram_url:          string | null
  annual_dues:            string | null
  join_fee:               string | null
  meeting_schedule:       string | null
  meeting_notes:          string | null
  founded_year:           number | null
  member_count_actual:    number | null
  join_open:              boolean
  panel_show_founded_year: boolean
  panel_show_member_count: boolean
  panel_show_schedule:     boolean
  panel_show_location:     boolean
  panel_show_instagram:    boolean
  panel_show_facebook:     boolean
  panel_show_join_button:  boolean
  panel_show_contact:      boolean
}

export default async function AdminAboutPage() {
  const admin  = createServiceClient()
  const ctx    = await getClubContext()
  const clubId = ctx?.clubId

  const [{ data: pageRaw }, { data: settingsRaw }, { count: memberCount }] = await Promise.all([
    clubId
      ? (admin.from('pages').select('id, content').eq('slug', 'about').eq('club_id', clubId).maybeSingle() as unknown as Promise<{ data: { id: string; content: string | null } | null }>)
      : Promise.resolve({ data: null }),
    clubId
      ? (admin.from('club_settings').select(
          'club_name, club_location, contact_email, website_url, facebook_url, instagram_url, annual_dues, join_fee, meeting_schedule, meeting_notes, founded_year, join_open, panel_show_founded_year, panel_show_member_count, panel_show_schedule, panel_show_location, panel_show_instagram, panel_show_facebook, panel_show_join_button, panel_show_contact'
        ).eq('club_id', clubId).single() as unknown as Promise<{ data: ClubInfo | null }>)
      : Promise.resolve({ data: null }),
    clubId
      ? admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'member')
      : Promise.resolve({ count: null }),
  ] as const)

  const clubInfo: ClubInfo = {
    club_name:              settingsRaw?.club_name              ?? 'Our Camera Club',
    club_location:          settingsRaw?.club_location          ?? null,
    contact_email:          settingsRaw?.contact_email          ?? null,
    website_url:            settingsRaw?.website_url            ?? null,
    facebook_url:           settingsRaw?.facebook_url           ?? null,
    instagram_url:          settingsRaw?.instagram_url          ?? null,
    annual_dues:            settingsRaw?.annual_dues            ?? null,
    join_fee:               settingsRaw?.join_fee               ?? null,
    meeting_schedule:       settingsRaw?.meeting_schedule       ?? null,
    meeting_notes:          settingsRaw?.meeting_notes          ?? null,
    founded_year:           settingsRaw?.founded_year           ?? null,
    member_count_actual:    memberCount ?? null,
    join_open:              settingsRaw?.join_open              ?? true,
    panel_show_founded_year: settingsRaw?.panel_show_founded_year ?? true,
    panel_show_member_count: settingsRaw?.panel_show_member_count ?? true,
    panel_show_schedule:     settingsRaw?.panel_show_schedule    ?? true,
    panel_show_location:     settingsRaw?.panel_show_location    ?? true,
    panel_show_instagram:    settingsRaw?.panel_show_instagram   ?? true,
    panel_show_facebook:     settingsRaw?.panel_show_facebook    ?? true,
    panel_show_join_button:  settingsRaw?.panel_show_join_button ?? true,
    panel_show_contact:      settingsRaw?.panel_show_contact     ?? true,
  }

  return (
    <AboutPageEditor
      pageId={pageRaw?.id ?? null}
      initialContent={pageRaw?.content ?? '<p>Write something about your club here\u2026</p>'}
      clubInfo={clubInfo}
    />
  )
}

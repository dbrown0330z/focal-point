import { createClient }       from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext }      from '@/lib/club-context'
import AboutClient             from './AboutClient'
import { getSocialAccounts }   from '@/lib/social-accounts/actions'

export const dynamic = 'force-dynamic'

type ClubInfo = {
  club_name:              string
  club_location:          string | null
  contact_email:          string | null
  website_url:            string | null
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
  panel_shown_social_ids:  string[]
  panel_show_join_button:  boolean
  panel_show_contact:      boolean
}

export default async function AboutPage() {
  const supabase = await createClient()
  const admin    = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any
  const ctx      = await getClubContext()
  const clubId   = ctx?.clubId

  const [
    { data: { user } },
    { data: settingsRaw },
    { data: pageRaw },
    { count: memberCount },
    socialAccounts,
  ] = await Promise.all([
    supabase.auth.getUser(),
    clubId
      ? (admin.from('club_settings').select(
          'club_name, club_location, contact_email, website_url, annual_dues, join_fee, meeting_schedule, meeting_notes, founded_year, join_open, panel_show_founded_year, panel_show_member_count, panel_show_schedule, panel_show_location, panel_show_join_button, panel_show_contact, panel_shown_social_ids'
        ).eq('club_id', clubId).single() as unknown as Promise<{ data: ClubInfo | null }>)
      : Promise.resolve({ data: null }),
    clubId
      ? (adminAny.from('pages').select('id, content').eq('slug', 'about').eq('club_id', clubId).maybeSingle() as Promise<{ data: { id: string; content: string | null } | null }>)
      : Promise.resolve({ data: null }),
    clubId
      ? admin.from('club_memberships').select('id', { count: 'exact', head: true }).eq('club_id', clubId).eq('membership_status', 'active')
      : Promise.resolve({ count: null }),
    getSocialAccounts(),
  ] as const)

  const clubName   = settingsRaw?.club_name ?? 'Our Camera Club'
  const clubSlug   = ctx?.clubSlug ?? ''
  const html       = pageRaw?.content ?? null
  const isLoggedIn = Boolean(user)

  const info: ClubInfo = {
    club_name:              clubName,
    club_location:          settingsRaw?.club_location          ?? null,
    contact_email:          settingsRaw?.contact_email          ?? null,
    website_url:            settingsRaw?.website_url            ?? null,
    annual_dues:            settingsRaw?.annual_dues            ?? null,
    join_fee:               settingsRaw?.join_fee               ?? null,
    meeting_schedule:       settingsRaw?.meeting_schedule       ?? null,
    meeting_notes:          settingsRaw?.meeting_notes          ?? null,
    founded_year:           settingsRaw?.founded_year           ?? null,
    member_count_actual:    memberCount ?? null,
    join_open:              settingsRaw?.join_open              ?? true,
    panel_show_founded_year: settingsRaw?.panel_show_founded_year ?? false,
    panel_show_member_count: settingsRaw?.panel_show_member_count ?? false,
    panel_show_schedule:     settingsRaw?.panel_show_schedule    ?? false,
    panel_show_location:     settingsRaw?.panel_show_location    ?? false,
    panel_shown_social_ids:  (settingsRaw?.panel_shown_social_ids ?? []) as string[],
    panel_show_join_button:  settingsRaw?.panel_show_join_button ?? true,
    panel_show_contact:      settingsRaw?.panel_show_contact     ?? true,
  }

  return (
    <AboutClient
      clubName={clubName}
      clubSlug={clubSlug}
      html={html}
      isLoggedIn={isLoggedIn}
      info={info}
      socialAccounts={socialAccounts}
    />
  )
}

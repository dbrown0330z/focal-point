import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import AboutPageEditor from './AboutPageEditor'

export const dynamic = 'force-dynamic'

type RawPage = { id: string; content: string | null }

type ClubInfo = {
  club_name:           string
  club_location:       string | null
  contact_email:       string | null
  website_url:         string | null
  facebook_url:        string | null
  instagram_url:       string | null
  annual_dues:         string | null
  join_fee:            string | null
  meeting_schedule:    string | null
  meeting_notes:       string | null
  founded_year:        number | null
  member_count_approx: number | null
  join_open:           boolean
}

export default async function AdminAboutPage() {
  const admin  = createServiceClient()
  const ctx    = await getClubContext()
  const clubId = ctx?.clubId

  const [
    { data: pageRaw },
    { data: settingsRaw },
  ] = await Promise.all([
    admin.from('pages').select('id, content')
      .eq('slug', 'about')
      .maybeSingle() as unknown as Promise<{ data: RawPage | null }>,
    clubId
      ? (admin.from('club_settings').select(
          'club_name, club_location, contact_email, website_url, facebook_url, instagram_url, annual_dues, join_fee, meeting_schedule, meeting_notes, founded_year, member_count_approx, join_open'
        ).eq('club_id', clubId).single() as unknown as Promise<{ data: ClubInfo | null }>)
      : Promise.resolve({ data: null }),
  ])

  const clubInfo: ClubInfo = settingsRaw ?? {
    club_name: 'Our Camera Club', club_location: null, contact_email: null,
    website_url: null, facebook_url: null, instagram_url: null,
    annual_dues: null, join_fee: null, meeting_schedule: null,
    meeting_notes: null, founded_year: null, member_count_approx: null,
    join_open: true,
  }

  return (
    <AboutPageEditor
      pageId={pageRaw?.id ?? null}
      initialContent={pageRaw?.content ?? '<p>Write something about your club here\u2026</p>'}
      clubInfo={clubInfo}
    />
  )
}

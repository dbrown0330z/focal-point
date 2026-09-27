import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import AboutClient from './AboutClient'

export const dynamic = 'force-dynamic'

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

export default async function AboutPage() {
  const supabase = await createClient()
  const admin    = createServiceClient()
  const ctx      = await getClubContext()
  const clubId   = ctx?.clubId

  const [
    { data: { user } },
    { data: settingsRaw },
    { data: pageRaw },
  ] = await Promise.all([
    supabase.auth.getUser(),
    clubId
      ? admin.from('club_settings').select(
          'club_name, club_location, contact_email, website_url, facebook_url, instagram_url, annual_dues, join_fee, meeting_schedule, meeting_notes, founded_year, member_count_approx, join_open'
        ).eq('club_id', clubId).single() as unknown as Promise<{ data: ClubInfo | null }>
      : Promise.resolve({ data: null }),
    clubId
      ? admin.from('pages').select('id, content').eq('slug', 'about').eq('club_id', clubId).maybeSingle() as unknown as Promise<{ data: { id: string; content: string | null } | null }>
      : Promise.resolve({ data: null }),
  ])

  const clubName   = settingsRaw?.club_name ?? 'Our Camera Club'
  const clubSlug   = ctx?.clubSlug ?? ''
  const html       = pageRaw?.content ?? null
  const isLoggedIn = Boolean(user)
  const info: ClubInfo = settingsRaw ?? {
    club_name: clubName, club_location: null, contact_email: null,
    website_url: null, facebook_url: null, instagram_url: null,
    annual_dues: null, join_fee: null, meeting_schedule: null,
    meeting_notes: null, founded_year: null, member_count_approx: null,
    join_open: true,
  }

  return (
    <AboutClient
      clubName={clubName}
      clubSlug={clubSlug}
      html={html}
      isLoggedIn={isLoggedIn}
      info={info}
    />
  )
}

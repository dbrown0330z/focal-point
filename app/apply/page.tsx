import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import ApplyClient from './ApplyClient'

export default async function ApplyPage() {
  // Look up the default club and redirect to the club-specific apply page
  const admin = createServiceClient()
  const { data: club } = await admin
    .from('clubs')
    .select('slug')
    .limit(1)
    .single()

  if (club?.slug) {
    redirect(`/${club.slug}/apply`)
  }

  // Fallback: no club found — render form with generic data
  const { data } = await admin
    .from('club_settings')
    .select('club_name, membership_terms_source, membership_terms_content, membership_terms_file_path')
    .single() as {
      data: {
        club_name: string
        membership_terms_source: string
        membership_terms_content: string | null
        membership_terms_file_path: string | null
      } | null
    }

  const clubName = data?.club_name ?? 'Our Camera Club'

  const hasTerms = Boolean(
    data?.membership_terms_content ||
    (data?.membership_terms_source === 'custom' && data?.membership_terms_file_path)
  )

  return <ApplyClient clubName={clubName} termsUrl={hasTerms ? '/terms' : null} />
}

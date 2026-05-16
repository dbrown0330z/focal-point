import { createClient } from '@/lib/supabase/server'
import ApplyClient from './ApplyClient'

export default async function ApplyPage() {
  const supabase = await createClient()
  const { data } = await supabase
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

  // Terms are always available (default template is seeded for every club)
  const hasTerms = Boolean(
    data?.membership_terms_content ||
    (data?.membership_terms_source === 'custom' && data?.membership_terms_file_path)
  )

  return <ApplyClient clubName={clubName} termsUrl={hasTerms ? '/terms' : null} />
}

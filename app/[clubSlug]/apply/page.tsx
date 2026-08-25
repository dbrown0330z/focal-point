import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import ApplyClient from '@/app/apply/ApplyClient'

export default async function ClubApplyPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>
}) {
  const { clubSlug } = await params
  const ctx = await getClubContext()
  const clubId = ctx?.clubId

  const admin = createServiceClient()
  const { data } = clubId
    ? await admin
        .from('club_settings')
        .select('club_name, membership_terms_source, membership_terms_content, membership_terms_file_path, approval_mode')
        .eq('club_id', clubId)
        .single() as {
          data: {
            club_name: string
            membership_terms_source: string
            membership_terms_content: string | null
            membership_terms_file_path: string | null
            approval_mode: string | null
          } | null
        }
    : { data: null }

  const clubName    = data?.club_name ?? 'Our Camera Club'
  const approvalMode = data?.approval_mode ?? 'email_verification'

  const hasTerms = Boolean(
    data?.membership_terms_content ||
    (data?.membership_terms_source === 'custom' && data?.membership_terms_file_path)
  )

  return (
    <ApplyClient
      clubName={clubName}
      termsUrl={hasTerms ? '/terms' : null}
      clubSlug={clubSlug}
      approvalMode={approvalMode}
    />
  )
}

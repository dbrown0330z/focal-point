import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'

// Entry point. Validates token, then routes:
//   - invalid / not in judging → /expired
//   - already verified (cookie) → /landing
//   - first visit → /access (code entry)
//
// Uses the service client because judge_tokens has no public-read RLS policy —
// token validation is intentionally server-side only.
export default async function JudgeEntryPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const service = createServiceClient()

  const { data: judgeToken } = await service
    .from('judge_tokens')
    .select('id, submitted_at, competitions(status)')
    .eq('token', token)
    .single()

  const competition = judgeToken?.competitions as unknown as { status: string } | null

  // Allow through if competition is still open for judging, OR if this judge
  // has already submitted (so they can see their confirmation page).
  const isSubmitted = !!judgeToken?.submitted_at
  if (!judgeToken || (competition?.status !== 'judging' && !isSubmitted)) {
    redirect(`/judge/${token}/expired`)
  }

  const cookieStore = await cookies()
  const verified = cookieStore.get(`jv_${token}`)?.value === '1'

  // Submitted judges always go to the landing (success state); they don't
  // need to re-enter the PIN because they already have a session cookie.
  redirect(verified || isSubmitted ? `/judge/${token}/landing` : `/judge/${token}/access`)
}

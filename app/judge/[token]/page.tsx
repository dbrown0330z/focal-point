import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

// Entry point. Validates token, then routes:
//   - invalid / not in judging → /expired
//   - already verified (cookie) → /landing
//   - first visit → /access (code entry)
export default async function JudgeEntryPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  const { data: judgeToken } = await supabase
    .from('judge_tokens')
    .select('id, competitions(status)')
    .eq('token', token)
    .single()

  const competition = judgeToken?.competitions as unknown as { status: string } | null

  if (!judgeToken || competition?.status !== 'judging') {
    redirect(`/judge/${token}/expired`)
  }

  const cookieStore = await cookies()
  const verified = cookieStore.get(`jv_${token}`)?.value === '1'

  redirect(verified ? `/judge/${token}/landing` : `/judge/${token}/access`)
}

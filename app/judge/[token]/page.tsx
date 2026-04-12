import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Entry point for judges. Validates the token and redirects to the scoring view.
export default async function JudgeEntryPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  const { data: judgeToken } = await supabase
    .from('judge_tokens')
    .select('id, judge_name, competitions(status)')
    .eq('token', token)
    .single()

  const competition = judgeToken?.competitions as unknown as { status: string } | null

  if (!judgeToken || competition?.status !== 'judging') {
    redirect(`/judge/${token}/expired`)
  }

  redirect(`/judge/${token}/score`)
}

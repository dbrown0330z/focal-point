'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

export async function submitScores(token: string): Promise<void> {
  const service = createServiceClient()

  const { data: judgeToken } = await service
    .from('judge_tokens')
    .select('id, competition_id, competitions(status)')
    .eq('token', token)
    .single()

  const competition = judgeToken?.competitions as unknown as { status: string } | null
  if (!judgeToken || competition?.status !== 'judging') {
    redirect(`/judge/${token}/expired`)
  }
  await service
    .from('judge_tokens')
    .update({ submitted_at: new Date().toISOString() })
    .eq('id', judgeToken.id)

  await service
    .from('competitions')
    .update({ status: 'results_pending' })
    .eq('id', judgeToken.competition_id)

  revalidatePath(`/judge/${token}/landing`)
  revalidatePath(`/admin/competitions/${judgeToken.competition_id}`)
  revalidatePath('/admin/competitions')
  revalidatePath('/competitions')
}

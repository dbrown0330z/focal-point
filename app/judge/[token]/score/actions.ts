'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function upsertScore(token: string, formData: FormData) {
  const supabase = await createClient()

  // Validate the token and that the competition is still in judging
  const { data: judgeToken } = await supabase
    .from('judge_tokens')
    .select('id, competitions(status)')
    .eq('token', token)
    .single()

  const competition = judgeToken?.competitions as unknown as { status: string } | null

  if (!judgeToken || competition?.status !== 'judging') {
    redirect(`/judge/${token}/expired`)
  }

  const submissionId = formData.get('submission_id') as string
  const score        = Number(formData.get('score'))
  const notes        = (formData.get('notes') as string).trim() || null

  // Use service client to bypass RLS — judge has no Supabase session
  const service = createServiceClient()
  await service.from('scores').upsert(
    { submission_id: submissionId, judge_token_id: judgeToken.id, score, notes },
    { onConflict: 'submission_id,judge_token_id' }
  )

  revalidatePath(`/judge/${token}/score`)
  revalidatePath(`/judge/${token}/score/${submissionId}`)
}

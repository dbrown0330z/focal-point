'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'

export async function verifyCode(
  token: string,
  code: string,
): Promise<{ error: string } | void> {
  const service = createServiceClient()

  const { data: judgeToken } = await service
    .from('judge_tokens')
    .select('id, access_code, competitions(status)')
    .eq('token', token)
    .single()

  const competition = judgeToken?.competitions as unknown as { status: string } | null

  if (!judgeToken || competition?.status !== 'judging') {
    redirect(`/judge/${token}/expired`)
  }

  if (judgeToken.access_code !== code) {
    return { error: 'Incorrect code' }
  }

  // Set a session cookie that persists for 30 days
  const cookieStore = await cookies()
  cookieStore.set(`jv_${token}`, '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: `/judge/${token}`,
    maxAge: 60 * 60 * 24 * 30,
  })

  redirect(`/judge/${token}/landing`)
}

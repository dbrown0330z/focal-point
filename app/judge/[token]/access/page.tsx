import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import CodeEntry from './CodeEntry'

export default async function JudgeAccessPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Skip code screen if already verified
  const cookieStore = await cookies()
  if (cookieStore.get(`jv_${token}`)?.value === '1') {
    redirect(`/judge/${token}/landing`)
  }

  const supabase = createServiceClient()
  const { data: judgeToken } = await supabase
    .from('judge_tokens')
    .select('id, judge_name, competitions(status)')
    .eq('token', token)
    .single()

  const competition = judgeToken?.competitions as unknown as { status: string } | null

  if (!judgeToken || competition?.status !== 'judging') {
    redirect(`/judge/${token}/expired`)
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 52px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        {/* Lock icon */}
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--surface-2)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          margin: '0 auto 20px',
        }}>
          🔒
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.015em',
          margin: '0 0 8px',
        }}>
          Enter your access code
        </h1>

        <p style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          margin: '0 0 32px',
        }}>
          Hi {judgeToken.judge_name}. Enter the 4-digit code from your
          invitation email to continue.
        </p>

        <CodeEntry token={token} />
      </div>
    </div>
  )
}

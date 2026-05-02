import { createClient } from '@/lib/supabase/server'
import JudgeTopbar from './JudgeTopbar'

export default async function JudgeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  const [{ data: club }, { data: judgeToken }] = await Promise.all([
    supabase.from('club_settings').select('club_name').single(),
    supabase.from('judge_tokens').select('judge_name').eq('token', token).single(),
  ])

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--surface-0)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <JudgeTopbar
        clubName={club?.club_name ?? 'Focal Point'}
        judgeName={judgeToken?.judge_name ?? null}
      />
      <main>{children}</main>
    </div>
  )
}

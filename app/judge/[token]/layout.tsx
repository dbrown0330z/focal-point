import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import JudgeTopbar from './JudgeTopbar'
import { AppFooter } from '@/components/layout/AppFooter'

export default async function JudgeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // club_settings is publicly readable — anon client is fine.
  // judge_tokens requires service role because we removed the public-read RLS
  // policy (tokens should never be enumerable by unauthenticated callers).
  const supabase = await createClient()
  const service  = createServiceClient()

  const [{ data: club }, { data: judgeToken }] = await Promise.all([
    supabase.from('club_settings').select('club_name').single(),
    service.from('judge_tokens').select('judge_name').eq('token', token).single(),
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
      <AppFooter variant="judge" />
    </div>
  )
}

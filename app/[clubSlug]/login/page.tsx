import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import LoginForm from '@/app/(auth)/login/LoginForm'
import { AppFooter } from '@/components/layout/AppFooter'

export default async function ClubLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>
  searchParams: Promise<{ error?: string; pending?: string; reset?: string; next?: string }>
}) {
  const { clubSlug } = await params
  const { error, pending, reset, next } = await searchParams

  const ctx = await getClubContext()
  const clubId = ctx?.clubId

  const admin = createServiceClient()
  const { data: settings } = clubId
    ? await admin.from('club_settings').select('club_name').eq('club_id', clubId).single()
    : { data: null }

  const clubName = (settings as { club_name?: string } | null)?.club_name ?? 'Our Camera Club'

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: '#141414' }}
    >
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <h1
            style={{
              fontFamily: 'var(--font-lora, Lora, Georgia, serif)',
              fontSize: '26px',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: 'var(--action-primary)',
              lineHeight: 1.2,
            }}
          >
            {clubName}
          </h1>
          <p
            style={{
              marginTop: '6px',
              fontSize: '14px',
              color: '#9E9E9E',
              fontFamily: 'var(--font-nunito, Nunito, system-ui, sans-serif)',
            }}
          >
            Your camera club, online.
          </p>
        </div>

        <div
          className="w-full max-w-sm rounded-xl p-8"
          style={{
            background: '#1E1E1E',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <LoginForm
            errorParam={error}
            pendingParam={pending}
            resetParam={reset}
            nextParam={next}
            clubSlug={clubSlug}
          />
        </div>
      </div>

      <AppFooter variant="auth" />
    </div>
  )
}

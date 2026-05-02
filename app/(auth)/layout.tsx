import { createClient } from '@/lib/supabase/server'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data } = await supabase.from('club_settings').select('club_name').single()
  const clubName = data?.club_name ?? 'Our Camera Club'

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{ background: '#141414' }}
    >
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
        {children}
      </div>
    </div>
  )
}

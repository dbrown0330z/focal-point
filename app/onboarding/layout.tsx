import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingThemeProvider from '@/components/layout/OnboardingThemeProvider'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  if (process.env.NODE_ENV !== 'development') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('membership_status')
      .eq('id', user.id)
      .single()

    if (profile?.membership_status === 'active') redirect('/')
    if (profile?.membership_status !== 'approved') redirect('/')
  }

  return (
    <OnboardingThemeProvider>
      <div className="dark min-h-screen bg-surface-0">
        <header className="border-b border-border-default bg-surface-2">
          <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
            <span className="font-[family-name:var(--font-lora)] text-base font-bold" style={{ color: 'var(--action-primary)' }}>
              Focal Point
            </span>
          </div>
        </header>
        <div className="mx-auto max-w-5xl px-8 py-12">
          {children}
        </div>
      </div>
    </OnboardingThemeProvider>
  )
}

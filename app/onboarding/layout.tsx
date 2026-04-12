import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('membership_status')
    .eq('id', user.id)
    .single()

  if (profile?.membership_status === 'active') redirect('/')
  if (profile?.membership_status !== 'approved') redirect('/')

  return (
    <div className="min-h-screen bg-surface-0">
      <header className="border-b border-border-default bg-surface-2">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
          <Link href="/" className="text-sm font-semibold text-content-primary">Focal Point</Link>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-10">
        {children}
      </div>
    </div>
  )
}

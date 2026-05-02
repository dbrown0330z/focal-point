import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MemberNav from '@/components/layout/MemberNav'
import MemberThemeProvider from '@/components/layout/MemberThemeProvider'

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: clubSettings }] = await Promise.all([
    supabase.from('profiles').select('display_name, role, membership_status').eq('id', user.id).single(),
    supabase.from('club_settings').select('club_name').single(),
  ])

  if (profile?.membership_status !== 'active') redirect('/')

  return (
    <MemberThemeProvider>
      <div className="flex min-h-screen flex-col">
        <MemberNav clubName={clubSettings?.club_name ?? 'Focal Point'} displayName={profile.display_name} email={user.email ?? ''} role={profile.role} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
      </div>
    </MemberThemeProvider>
  )
}

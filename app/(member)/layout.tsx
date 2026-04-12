import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MemberNav from '@/components/layout/MemberNav'

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role, membership_status')
    .eq('id', user.id)
    .single()

  if (profile?.membership_status !== 'active') redirect('/')

  return (
    <div className="flex min-h-screen flex-col">
      <MemberNav displayName={profile.display_name} email={user.email ?? ''} role={profile.role} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  )
}

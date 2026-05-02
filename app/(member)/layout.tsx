import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MemberNav from '@/components/layout/MemberNav'
import MemberThemeProvider from '@/components/layout/MemberThemeProvider'

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: clubSettings }, { data: customPages }, { data: customTabs }] = await Promise.all([
    supabase.from('profiles').select('display_name, role, membership_status, avatar_url').eq('id', user.id).single(),
    supabase.from('club_settings').select('club_name').single(),
    supabase.from('nav_custom_pages')
      .select('id, title, slug, parent_system, tab_id, page_type, external_url, visibility, sort_order')
      .eq('status', 'published')
      .neq('visibility', 'hidden')
      .order('sort_order'),
    supabase.from('nav_custom_tabs')
      .select('id, name, slug, sort_order')
      .order('sort_order'),
  ])

  if (profile?.membership_status !== 'active') redirect('/')

  return (
    <MemberThemeProvider>
      <div className="flex min-h-screen flex-col">
        <MemberNav
          clubName={clubSettings?.club_name ?? 'Focal Point'}
          displayName={profile.display_name}
          email={user.email ?? ''}
          role={profile.role}
          avatarUrl={(profile as unknown as { avatar_url: string | null }).avatar_url ?? null}
          customPages={customPages ?? []}
          customTabs={customTabs ?? []}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
      </div>
    </MemberThemeProvider>
  )
}

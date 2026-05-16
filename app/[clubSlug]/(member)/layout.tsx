import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireClubId } from '@/lib/club-context'
import MemberNav from '@/components/layout/MemberNav'
import MemberThemeProvider from '@/components/layout/MemberThemeProvider'

export default async function MemberLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clubSlug: string }>
}) {
  const { clubSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const clubId = await requireClubId()

  const [
    { data: membership },
    { data: profile },
    { data: clubSettings },
    { data: customPages },
    { data: customTabs },
  ] = await Promise.all([
    supabase
      .from('club_memberships')
      .select('role, membership_status')
      .eq('user_id', user.id)
      .eq('club_id', clubId)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('club_settings')
      .select('club_name')
      .eq('club_id', clubId)
      .single(),
    supabase
      .from('nav_custom_pages')
      .select('id, title, slug, parent_system, tab_id, page_type, external_url, visibility, sort_order')
      .eq('club_id', clubId)
      .eq('status', 'published')
      .neq('visibility', 'hidden')
      .order('sort_order'),
    supabase
      .from('nav_custom_tabs')
      .select('id, name, slug, sort_order')
      .eq('club_id', clubId)
      .order('sort_order'),
  ])

  if (membership?.membership_status !== 'active') redirect(`/${clubSlug}`)

  return (
    <MemberThemeProvider>
      <div className="flex min-h-screen flex-col">
        <MemberNav
          clubSlug={clubSlug}
          clubName={clubSettings?.club_name ?? 'Focal Point'}
          displayName={profile?.display_name ?? ''}
          email={user.email ?? ''}
          role={membership?.role ?? null}
          avatarUrl={(profile as { avatar_url: string | null } | null)?.avatar_url ?? null}
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

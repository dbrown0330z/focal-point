import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId } from '@/lib/club-context'
import MemberNav from '@/components/layout/MemberNav'
import MemberThemeProvider from '@/components/layout/MemberThemeProvider'
import { AppFooter } from '@/components/layout/AppFooter'

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

  if (!user) redirect(`/${clubSlug}/login`)

  const clubId = await requireClubId()

  // Use service client to bypass RLS gaps. Auth already verified above.
  const admin = createServiceClient()

  const [
    { data: membership },
    { data: profile },
    { data: clubSettings },
    { data: customPages },
    { data: customTabs },
    { count: pendingCount },
  ] = await Promise.all([
    admin
      .from('club_memberships')
      .select('role, membership_status')
      .eq('user_id', user.id)
      .eq('club_id', clubId)
      .maybeSingle(),
    admin
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single(),
    admin
      .from('club_settings')
      .select('club_name')
      .eq('club_id', clubId)
      .single(),
    admin
      .from('nav_custom_pages')
      .select('id, title, slug, parent_system, tab_id, page_type, external_url, visibility, sort_order')
      .eq('club_id', clubId)
      .eq('status', 'published')
      .neq('visibility', 'hidden')
      .order('sort_order'),
    admin
      .from('nav_custom_tabs')
      .select('id, name, slug, sort_order')
      .eq('club_id', clubId)
      .order('sort_order'),
    // Pending count — only used when rendering for an admin
    admin
      .from('club_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('membership_status', 'pending'),
  ])

  const ALLOWED_STATUSES = ['active', 'complimentary']
  if (!ALLOWED_STATUSES.includes(membership?.membership_status ?? '')) redirect(`/${clubSlug}`)

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
          pendingCount={pendingCount ?? 0}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
        <AppFooter variant="app" />
      </div>
    </MemberThemeProvider>
  )
}

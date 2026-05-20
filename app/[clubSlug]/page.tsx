import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId } from '@/lib/club-context'
import { redirect } from 'next/navigation'
import MemberNav from '@/components/layout/MemberNav'
import MemberThemeProvider from '@/components/layout/MemberThemeProvider'
import HomepageRenderer from '@/components/home/HomepageRenderer'
import WelcomeHeader from '@/components/home/WelcomeHeader'
import { DEFAULT_BLOCKS, mergeBlocks, type ContentBlock } from '@/lib/homepage/types'
import { logout } from '@/app/(auth)/actions'
import { AppFooter } from '@/components/layout/AppFooter'

export default async function ClubHomePage({
  params,
}: {
  params: Promise<{ clubSlug: string }>
}) {
  const { clubSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const clubId = await requireClubId()

  // Use service client for membership/settings to bypass RLS gaps on these tables.
  // Auth is already verified above via supabase.auth.getUser().
  const admin = createServiceClient()

  const [{ data: membership }, { data: profile }, { data: clubSettings }] = await Promise.all([
    admin
      .from('club_memberships')
      .select('role, membership_status')
      .eq('user_id', user.id)
      .eq('club_id', clubId)
      .maybeSingle(),
    admin
      .from('profiles')
      .select('first_name, display_name, avatar_url')
      .eq('id', user.id)
      .single(),
    admin
      .from('club_settings')
      .select('club_name, homepage_blocks')
      .eq('club_id', clubId)
      .single(),
  ])

  if (!profile || !membership) redirect('/login')

  // Member just approved but hasn't completed onboarding
  if (membership.membership_status === 'approved') redirect('/onboarding/profile')

  const clubName = clubSettings?.club_name?.trim() || 'Focal Point'

  // ── Active member: render the club homepage ───────────────────────────────
  if (membership.membership_status === 'active' && membership.role) {
    const saved: ContentBlock[] = (clubSettings?.homepage_blocks as ContentBlock[] | null) ?? DEFAULT_BLOCKS
    const blocks: ContentBlock[] = mergeBlocks(saved, DEFAULT_BLOCKS)

    const [{ data: customPages }, { data: customTabs }] = await Promise.all([
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
    ])

    return (
      <MemberThemeProvider>
        <div className="flex min-h-screen flex-col">
          <MemberNav
            clubSlug={clubSlug}
            clubName={clubName}
            displayName={profile.display_name}
            email={user.email ?? ''}
            role={membership.role}
            avatarUrl={(profile as { avatar_url: string | null }).avatar_url ?? null}
            customPages={customPages ?? []}
            customTabs={customTabs ?? []}
          />
          <WelcomeHeader
            firstName={(profile as { first_name: string | null }).first_name || profile.display_name.split(' ')[0]}
            userId={user.id}
          />
          <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10">
            <HomepageRenderer blocks={blocks} clubName={clubName} />
          </div>
          <AppFooter variant="app" />
        </div>
      </MemberThemeProvider>
    )
  }

  if (membership.membership_status === 'expired') {
    return <ExpiredPage displayName={profile.display_name} />
  }

  // pending / unknown
  return <PendingPage displayName={profile.display_name} />
}

function PendingPage({ displayName }: { displayName?: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-sm">
        <h1 className="text-2xl font-semibold text-content-primary">
          Hi{displayName ? `, ${displayName}` : ''}
        </h1>
        <p className="mt-3 text-content-secondary">
          Your application is being reviewed by a club admin. We'll be in touch once you've been approved.
        </p>
        <form action={logout} className="mt-6">
          <button type="submit" className="text-sm text-content-tertiary hover:text-content-secondary hover:underline">
            Sign out
          </button>
        </form>
      </div>
    </main>
  )
}

function ExpiredPage({ displayName }: { displayName?: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-sm">
        <h1 className="text-2xl font-semibold text-content-primary">
          Hi{displayName ? `, ${displayName}` : ''}
        </h1>
        <p className="mt-3 text-content-secondary">
          Your membership has expired. Please contact a club admin to renew.
        </p>
        <form action={logout} className="mt-6">
          <button type="submit" className="text-sm text-content-tertiary hover:text-content-secondary hover:underline">
            Sign out
          </button>
        </form>
      </div>
    </main>
  )
}

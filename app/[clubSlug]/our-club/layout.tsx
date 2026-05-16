import { createClient } from '@/lib/supabase/server'
import { getClubContext } from '@/lib/club-context'
import Link from 'next/link'
import MemberNav from '@/components/layout/MemberNav'
import MemberThemeProvider from '@/components/layout/MemberThemeProvider'

export default async function OurClubLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clubSlug: string }>
}) {
  const { clubSlug } = await params
  const supabase = await createClient()
  const ctx    = await getClubContext()
  const clubId = ctx?.clubId

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: membership }, { data: profile }, { data: clubSettings }] = await Promise.all([
    user && clubId
      ? supabase
          .from('club_memberships')
          .select('role, membership_status')
          .eq('user_id', user.id)
          .eq('club_id', clubId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase.from('profiles').select('display_name, avatar_url').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
    clubId
      ? supabase.from('club_settings').select('club_name').eq('club_id', clubId).single()
      : Promise.resolve({ data: null }),
  ])

  const clubName       = (clubSettings as { club_name?: string } | null)?.club_name ?? 'Our Camera Club'
  const isActiveMember = (membership as { membership_status?: string } | null)?.membership_status === 'active'

  // Logged-in active member — full MemberNav
  if (user && isActiveMember) {
    return (
      <MemberThemeProvider>
        <div className="flex min-h-screen flex-col">
          <MemberNav
            clubSlug={clubSlug}
            clubName={clubName}
            displayName={(profile as { display_name?: string } | null)?.display_name ?? ''}
            email={user.email ?? ''}
            role={(membership as { role?: string | null } | null)?.role ?? null}
            avatarUrl={(profile as { avatar_url?: string | null } | null)?.avatar_url ?? null}
          />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
            {children}
          </main>
        </div>
      </MemberThemeProvider>
    )
  }

  // Anonymous visitor (or pending member) — minimal public header
  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--surface-0)' }}>
      <header className="border-b border-border-default bg-surface-2">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            href={`/${clubSlug}`}
            className="font-[family-name:var(--font-lora)] text-base font-bold whitespace-nowrap"
            style={{ color: 'var(--action-primary)' }}
          >
            {clubName}
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/apply" className="text-content-secondary hover:text-content-primary transition-colors">
              Join
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 font-medium text-white transition-colors hover:opacity-90"
              style={{ background: 'var(--action-primary)' }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  )
}

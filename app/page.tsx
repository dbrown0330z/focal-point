import { createClient } from '@/lib/supabase/server'
import { logout } from './(auth)/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MemberNav from '@/components/layout/MemberNav'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <MarketingPage />

  const [{ data: profile }, { data: clubSettings }] = await Promise.all([
    supabase.from('profiles').select('display_name, role, membership_status').eq('id', user.id).single(),
    supabase.from('club_settings').select('club_name').single(),
  ])
  const clubName = clubSettings?.club_name ?? 'Focal Point'

  if (!profile) return <MarketingPage />

  if (profile.membership_status === 'approved') redirect('/onboarding/profile')

  if (profile.membership_status === 'active' && profile.role) {
    return (
      <div className="flex min-h-screen flex-col">
        <MemberNav clubName={clubName} displayName={profile.display_name} email={user.email ?? ''} role={profile.role} />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
          <NewsFeed displayName={profile.display_name} />
        </main>
      </div>
    )
  }

  if (profile.membership_status === 'expired') {
    return <ExpiredPage displayName={profile.display_name} />
  }

  // pending
  return <PendingPage displayName={profile.display_name} />
}

function MarketingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-semibold tracking-tight text-content-primary">Focal Point</h1>
      <p className="mt-3 max-w-sm text-content-secondary">
        A home for your camera club — competitions, image libraries, and club news in one place.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/apply" className="rounded-lg bg-action-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-action-primary-hover transition-colors">
          Apply to be a member
        </Link>
        <Link href="/login" className="rounded-lg border border-border-default px-5 py-2.5 text-sm font-medium text-content-primary hover:bg-surface-1 transition-colors">
          Sign in
        </Link>
      </div>
    </main>
  )
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

function NewsFeed({ displayName }: { displayName: string }) {
  return (
    <>
      <h1 className="text-2xl font-semibold text-content-primary">
        Welcome back, {displayName}
      </h1>
      <p className="mt-2 text-content-secondary">Your club activity will appear here.</p>
    </>
  )
}

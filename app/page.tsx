import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

/**
 * Focal Point marketing / landing page.
 *
 * Authenticated users with an active club membership are redirected straight
 * to their club homepage. Everyone else sees the public marketing page.
 */
export default async function FocalPointHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Find the first active club membership for this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (supabase as any)
      .from('club_memberships')
      .select('club_id')
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .limit(1)
      .maybeSingle()

    if (membership?.club_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: club } = await (supabase as any)
        .from('clubs')
        .select('slug')
        .eq('id', membership.club_id)
        .maybeSingle()

      if (club?.slug) redirect(`/${club.slug}`)
    }

    // Authenticated but no active membership — show marketing page with sign-out option
    // (don't redirect to /login — that creates an infinite loop)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1
        className="font-[family-name:var(--font-lora)] font-bold text-content-primary"
        style={{ fontSize: '36px', letterSpacing: '-0.02em' }}
      >
        Focal Point
      </h1>
      <p className="mt-3 max-w-sm text-content-secondary" style={{ fontSize: '16px' }}>
        The complete platform for camera clubs — competitions, image libraries, and club news in one place.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/apply"
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ background: 'var(--action-primary)' }}
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-lg border px-5 py-2.5 text-sm font-medium text-content-primary transition-colors hover:bg-surface-1"
          style={{ borderColor: 'var(--border-default)' }}
        >
          Sign in
        </Link>
      </div>
    </main>
  )
}

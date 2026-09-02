import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

/**
 * Handles email-verification links that use the token_hash approach.
 *
 * Why not /auth/callback?
 * The existing /auth/callback route uses PKCE code exchange, which requires a
 * code-verifier cookie set at signup time. When a user clicks a verification link
 * from their email client it opens in a fresh browser with no cookies, so the
 * exchange fails with "PKCE code verifier not found in storage".
 *
 * The token_hash flow is self-contained — no browser storage required.
 *
 * Supabase email template for "Confirm signup" should use:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const tokenHash = searchParams.get('token_hash')
  const type      = searchParams.get('type') as EmailOtpType | null

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=Invalid+confirmation+link`)
  }

  const cookieStore = await cookies()

  // Collect session cookies set during verifyOtp so they travel with the redirect.
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(c => pendingCookies.push(c))
        },
      },
    }
  )

  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
  if (error) {
    console.error('[auth/confirm] verifyOtp error:', error.message)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    )
  }

  // After verification, promote the member and resolve their club slug.
  let destination = `${origin}/login` // safe fallback — avoids root 404
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) {
      const service = createServiceClient()

      // Promote in both tables (don't override already-active members).
      await Promise.all([
        service
          .from('club_memberships')
          .update({ membership_status: 'approved' })
          .eq('user_id', user.id)
          .eq('membership_status', 'pending'),
        service
          .from('profiles')
          .update({ membership_status: 'approved' })
          .eq('id', user.id)
          .neq('membership_status', 'active'),
      ])

      // Resolve the club slug separately so a join error can't block the above.
      const { data: membership } = await service
        .from('club_memberships')
        .select('club_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (membership?.club_id) {
        const { data: club } = await service
          .from('clubs')
          .select('slug')
          .eq('id', membership.club_id)
          .maybeSingle()

        if (club?.slug) {
          destination = `${origin}/${club.slug}/onboarding/profile`
        }
      }
    }
  } catch (err) {
    console.error('[auth/confirm] post-verify error:', err)
  }

  // Stamp session cookies onto the redirect response.
  const redirectResponse = NextResponse.redirect(destination)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pendingCookies.forEach(({ name, value, options }) => {
    redirectResponse.cookies.set(name, value, options as any)
  })

  return redirectResponse
}

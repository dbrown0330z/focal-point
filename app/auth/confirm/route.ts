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

  // We build the final redirect URL after verifying (we need the user's club slug).
  // Start with a fallback; it will be replaced below on success.
  let destination = `${origin}/`

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        // Cookies are set on the response after we build it below.
        setAll() {},
      },
    }
  )

  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    )
  }

  // Promote pending → approved and resolve the club slug for the redirect.
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) {
      const service = createServiceClient()

      // Promote in both tables in parallel; also fetch club slug for the redirect.
      const [,, membershipRow] = await Promise.all([
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
        service
          .from('club_memberships')
          .select('clubs!inner(slug)')
          .eq('user_id', user.id)
          .limit(1)
          .single(),
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const slug = (membershipRow.data?.clubs as any)?.slug as string | undefined
      if (slug) {
        destination = `${origin}/${slug}/onboarding/profile`
      }
    }
  } catch (err) {
    console.error('[auth/confirm] failed to promote member status:', err)
  }

  // Build the final redirect response and stamp the session cookies onto it.
  const redirectResponse = NextResponse.redirect(destination)
  const freshCookies = cookieStore.getAll()
  freshCookies.forEach(({ name, value }) => {
    redirectResponse.cookies.set(name, value)
  })

  return redirectResponse
}

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
 * The token_hash flow is self-contained — no browser storage required — which
 * makes it reliable regardless of which browser opens the link.
 *
 * Supabase email template for "Confirm signup" should use:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&redirect_to={{ .RedirectTo }}
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const tokenHash  = searchParams.get('token_hash')
  const type       = searchParams.get('type') as EmailOtpType | null

  // 'verify=1' bleeds out of the emailRedirectTo URL when it's appended unencoded
  // (e.g. ...&redirect_to=https://...?next=/slug/onboarding/profile&verify=1)
  const verify = searchParams.get('verify') === '1'

  // Extract the 'next' path from the redirect_to value.
  // redirect_to is the emailRedirectTo URL we passed at signup, which carries
  // ?next=/<clubSlug>/onboarding/profile as a query parameter of its own.
  const redirectToRaw = searchParams.get('redirect_to') ?? ''
  let next = '/'
  try {
    const rUrl = new URL(redirectToRaw)
    next = rUrl.searchParams.get('next') ?? '/'
  } catch {
    if (redirectToRaw.startsWith('/')) next = redirectToRaw
  }

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=Invalid+confirmation+link`)
  }

  const cookieStore     = await cookies()
  const redirectResponse = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    )
  }

  // After a successful signup email verification, promote the member from
  // 'pending' → 'approved' so they land on the onboarding profile page.
  if (verify) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        const service = createServiceClient()
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
            .eq('membership_status', 'pending'),
        ])
      }
    } catch (err) {
      // Non-fatal — member can be manually approved if this fails
      console.error('[auth/confirm] failed to promote member status:', err)
    }
  }

  return redirectResponse
}

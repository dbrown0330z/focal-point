import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/login
 *
 * Handles email/password sign-in and sets the session cookies directly on
 * the redirect response — bypassing the Next.js 16 server-action cookie issue
 * where cookies set via cookieStore.set() don't survive the redirect.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email    = formData.get('email')    as string
  const password = formData.get('password') as string

  // Collect cookies that Supabase wants to set
  const cookiesToApply: Array<{
    name: string
    value: string
    options: Parameters<NextResponse['cookies']['set']>[2]
  }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) =>
            cookiesToApply.push({ name, value, options })
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  const redirectUrl = error
    ? new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
    : new URL('/default', request.url)

  const response = NextResponse.redirect(redirectUrl, { status: 303 })

  // Apply session cookies directly to the response so the browser stores them
  cookiesToApply.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}

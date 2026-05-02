import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // ── Session refresh ─────────────────────────────────────────────────────────
  // Must create the client and call getUser() on every request so the SDK can
  // rotate the auth cookie before it expires. Do not skip this even for routes
  // that don't need auth — the cookie refresh must happen unconditionally.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── Route protection ─────────────────────────────────────────────────────────
  // Layouts do the definitive auth check (with full profile data and proper
  // redirect messaging). Middleware provides a fast first-line guard so
  // unauthenticated requests never reach server component rendering.
  //
  // Judge routes (/judge/…) are token-gated inside each server page — no
  // middleware protection needed. Onboarding (/onboarding) is guarded by its
  // own layout, which also lets development bypass the active-status check.

  const { pathname } = request.nextUrl

  const isMemberRoute =
    pathname.startsWith('/library')      ||
    pathname.startsWith('/competitions') ||
    pathname.startsWith('/profile')      ||
    pathname.startsWith('/calendar')     ||
    pathname.startsWith('/our-club')     ||
    pathname.startsWith('/submit')       ||
    pathname.startsWith('/p/')

  const isAdminRoute = pathname.startsWith('/admin')

  if (isMemberRoute || isAdminRoute) {
    // Not signed in at all → login
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Fetch role + membership_status in one query (admin and member checks share it)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, membership_status')
      .eq('id', user.id)
      .single()

    if (isAdminRoute && profile?.role !== 'admin') {
      // Signed in but not an admin → home
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (isMemberRoute && profile?.membership_status !== 'active') {
      // Signed in but membership not active (pending/approved/expired/banned) → home
      // The root page shows the appropriate state message.
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

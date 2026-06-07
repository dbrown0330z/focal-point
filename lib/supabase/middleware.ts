import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// ─── Reserved top-level path segments ────────────────────────────────────────
// These are NOT club slugs. Any first path segment not in this set is treated
// as a potential club slug and looked up in the database.

const RESERVED_SEGMENTS = new Set([
  // Auth
  'login', 'logout', 'apply', 'signup', 'forgot-password', 'reset-password',
  // Global auth callback
  'auth',
  // Focal Point internal
  'super-admin',
  // API + assets
  'api', '_next', 'favicon.ico', 'sitemap.xml', 'robots.txt',
  // Judge portal (token-gated, not club-scoped via slug)
  'judge',
  // Onboarding (runs before club context is established)
  'onboarding',
  // Legal / public
  'terms',
  // Club app route segments — these must never be treated as club slugs.
  // If a bare redirect accidentally sends a user to /competitions, the
  // middleware would previously match it as a club slug lookup, poison
  // all nav links, and cascade 404s on every subsequent click.
  'competitions', 'library', 'submit', 'profile', 'calendar',
  'our-club', 'admin', 'p',
])

// ─── Club slug resolution ─────────────────────────────────────────────────────

type ClubRow = { id: string; name: string; slug: string; status: string } | null

async function resolveClub(
  supabase: ReturnType<typeof createServerClient>,
  slug: string,
): Promise<ClubRow> {
  const { data } = await supabase
    .from('clubs')
    .select('id, name, slug, status')
    .eq('slug', slug)
    .maybeSingle()
  return data as ClubRow
}

// ─── Main middleware function ─────────────────────────────────────────────────

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // ── Session refresh (must run on every request) ───────────────────────────
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Club slug resolution ──────────────────────────────────────────────────
  // Extract the first path segment and check if it's a club slug.
  // e.g. /portland-camera-club/library → slug = "portland-camera-club"

  const segments   = pathname.split('/').filter(Boolean)
  const firstSeg   = segments[0] ?? ''
  const isReserved = RESERVED_SEGMENTS.has(firstSeg) || firstSeg === ''

  if (!isReserved && firstSeg) {
    const club = await resolveClub(supabase, firstSeg)

    if (club) {
      if (club.status === 'suspended') {
        // Club suspended — show a static suspended page
        return NextResponse.rewrite(new URL('/club-suspended', request.url))
      }

      if (club.status === 'pending') {
        // Club provisioned but not yet approved — only FP admins can access
        // (handled by super-admin routes; non-admins get a pending screen)
        return NextResponse.rewrite(new URL('/club-pending', request.url))
      }

      // ── Inject club context as short-lived session cookies ───────────────
      // NextResponse.next({ request: { headers } }) does not reliably forward
      // custom headers to server components in Next.js 16. Using response
      // cookies instead — they are always readable via cookies() in any SC.
      supabaseResponse = NextResponse.next({ request })

      const cookieOpts = { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 }
      supabaseResponse.cookies.set('x-club-id',   club.id,   cookieOpts)
      supabaseResponse.cookies.set('x-club-slug', club.slug, cookieOpts)
      supabaseResponse.cookies.set('x-club-name', club.name, cookieOpts)

      // ── Route protection (club-scoped routes) ─────────────────────────────
      // Derive the path segment after the club slug for route classification.
      const innerPath = '/' + segments.slice(1).join('/')

      const isMemberRoute =
        // Homepage is public — guests see the landing view, members see their feed
        innerPath.startsWith('/library')               ||
        innerPath.startsWith('/competitions')          ||
        innerPath.startsWith('/profile')               ||
        innerPath.startsWith('/calendar')              ||
        innerPath.startsWith('/our-club/members')      ||
        innerPath.startsWith('/our-club/documents')    ||
        innerPath.startsWith('/submit')                ||
        innerPath.startsWith('/p/')

      const isAdminRoute = innerPath.startsWith('/admin')

      if (isMemberRoute || isAdminRoute) {
        if (!user) {
          // Not signed in → redirect to global login
          return NextResponse.redirect(new URL('/login', request.url))
        }
        // Membership and role checks are handled at the page/layout level.
        // Doing them here requires an extra DB round-trip and RLS on club_memberships
        // from the middleware context, which has caused redirect loops.
      }

      return supabaseResponse
    }

    // ── Slug not found ────────────────────────────────────────────────────────
    // Not a reserved segment and not a known club slug.
    // Could be a 404 or a not-yet-provisioned club.
    // Fall through to standard Next.js 404 handling.
  }

  // ── Non-club routes (marketing page, super-admin, global auth) ──────────

  const isSuperAdmin = pathname.startsWith('/super-admin')

  if (isSuperAdmin) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_fp_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_fp_admin) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

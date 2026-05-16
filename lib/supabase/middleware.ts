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

      // ── Inject club context into request headers ──────────────────────────
      // All server components and server actions read these to scope their queries.
      const requestWithClub = new Request(request, {
        headers: new Headers({
          ...Object.fromEntries(request.headers),
          'x-club-id':   club.id,
          'x-club-slug': club.slug,
          'x-club-name': club.name,
        }),
      })

      // Rewrite the internal path: strip the slug prefix so existing page
      // files at /library, /competitions etc. continue to match.
      // External URL keeps the slug; internal routing doesn't see it.
      const internalPath = '/' + segments.slice(1).join('/')

      supabaseResponse = NextResponse.rewrite(
        new URL(internalPath || '/', request.url),
        { request: requestWithClub }
      )

      // Copy auth cookies to the rewritten response
      request.cookies.getAll().forEach(({ name, value }) => {
        supabaseResponse.cookies.set(name, value)
      })

      // ── Route protection (club-scoped routes) ─────────────────────────────
      const innerPath = internalPath || '/'

      const isMemberRoute =
        innerPath === '/' ||
        innerPath.startsWith('/library')      ||
        innerPath.startsWith('/competitions') ||
        innerPath.startsWith('/profile')      ||
        innerPath.startsWith('/calendar')     ||
        innerPath.startsWith('/our-club')     ||
        innerPath.startsWith('/submit')       ||
        innerPath.startsWith('/p/')

      const isAdminRoute = innerPath.startsWith('/admin')

      if (isMemberRoute || isAdminRoute) {
        if (!user) {
          // Not signed in → redirect to club login (preserving slug in URL)
          return NextResponse.redirect(new URL(`/${firstSeg}/login`, request.url))
        }

        const { data: membership } = await supabase
          .from('club_memberships')
          .select('role, membership_status')
          .eq('user_id', user.id)
          .eq('club_id', club.id)
          .maybeSingle()

        if (isAdminRoute && membership?.role !== 'admin') {
          return NextResponse.redirect(new URL(`/${firstSeg}`, request.url))
        }

        if (isMemberRoute && membership?.membership_status !== 'active') {
          // Not an active member of this specific club → club homepage
          // (which shows the appropriate pending/expired state)
          return NextResponse.redirect(new URL(`/${firstSeg}`, request.url))
        }
      }

      return supabaseResponse
    }

    // ── Slug not found ────────────────────────────────────────────────────────
    // Not a reserved segment and not a known club slug.
    // Could be a 404 or a not-yet-provisioned club.
    // Fall through to standard Next.js 404 handling.
  }

  // ── Non-club routes (global auth, marketing, super-admin) ─────────────────
  // Preserve the existing single-tenant route protection for routes that
  // don't have a club slug prefix (during the transition period).

  const isMemberRoute =
    pathname.startsWith('/library')      ||
    pathname.startsWith('/competitions') ||
    pathname.startsWith('/profile')      ||
    pathname.startsWith('/calendar')     ||
    pathname.startsWith('/our-club')     ||
    pathname.startsWith('/submit')       ||
    pathname.startsWith('/p/')

  const isAdminRoute    = pathname.startsWith('/admin')
  const isSuperAdmin    = pathname.startsWith('/super-admin')

  if (isMemberRoute || isAdminRoute) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, membership_status')
      .eq('id', user.id)
      .single()

    if (isAdminRoute && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (isMemberRoute && profile?.membership_status !== 'active') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

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

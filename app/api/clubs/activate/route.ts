import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/clubs/activate
 *
 * Combined email verification + password creation + sign-in.
 * Replaces the previous two-step verify → create-password flow.
 *
 * Body (form-encoded): token, password
 * On success: sets session cookies and redirects to /{slug}/setup
 * On error:   redirects back to /verify?token=...&error=...
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const token    = (formData.get('token')    as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null)?.trim() ?? ''

  if (!token) {
    return NextResponse.redirect(new URL('/verify?error=missing_token', request.url), { status: 303 })
  }

  if (password.length < 8) {
    return NextResponse.redirect(
      new URL(`/verify?token=${encodeURIComponent(token)}&error=password_too_short`, request.url),
      { status: 303 },
    )
  }

  const admin = createServiceClient()

  const { data: club } = await admin
    .from('clubs')
    .select('id, slug, contact_email, name, admin_first_name, admin_last_name, verification_expires_at, verified_at')
    .eq('verification_token', token)
    .maybeSingle()

  if (!club) {
    return NextResponse.redirect(
      new URL(`/verify?token=${encodeURIComponent(token)}&error=invalid`, request.url),
      { status: 303 },
    )
  }

  if (club.verified_at) {
    // Already activated — send to their login
    return NextResponse.redirect(new URL(`/${club.slug}/login`, request.url), { status: 303 })
  }

  if (!club.verification_expires_at || new Date(club.verification_expires_at) < new Date()) {
    return NextResponse.redirect(
      new URL(`/verify?token=${encodeURIComponent(token)}&error=expired`, request.url),
      { status: 303 },
    )
  }

  // ── Create auth user (or find existing) ──────────────────────────────────────
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email:         club.contact_email!,
    email_confirm: true,
  })

  if (userError && !userError.message.includes('already')) {
    return NextResponse.redirect(
      new URL(`/verify?token=${encodeURIComponent(token)}&error=provision_failed`, request.url),
      { status: 303 },
    )
  }

  let userId = userData?.user?.id
  if (!userId) {
    const { data: { users } } = await admin.auth.admin.listUsers()
    userId = users.find(u => u.email === club.contact_email)?.id
  }

  if (!userId) {
    return NextResponse.redirect(
      new URL(`/verify?token=${encodeURIComponent(token)}&error=provision_failed`, request.url),
      { status: 303 },
    )
  }

  // ── Set the password ──────────────────────────────────────────────────────────
  const { error: pwErr } = await admin.auth.admin.updateUserById(userId, { password })
  if (pwErr) {
    return NextResponse.redirect(
      new URL(`/verify?token=${encodeURIComponent(token)}&error=${encodeURIComponent(pwErr.message)}`, request.url),
      { status: 303 },
    )
  }

  // ── Provision club data ───────────────────────────────────────────────────────
  await admin
    .from('club_settings')
    .upsert({ club_id: club.id, club_name: club.name ?? '' }, { onConflict: 'club_id' })

  await admin
    .from('clubs')
    .update({ status: 'active', verified_at: new Date().toISOString(), verification_token: null })
    .eq('id', club.id)

  const firstName   = club.admin_first_name ?? ''
  const lastName    = club.admin_last_name  ?? ''
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || club.contact_email!

  await admin
    .from('profiles')
    .update({ role: 'admin', display_name: displayName, first_name: firstName, last_name: lastName || null })
    .eq('id', userId)

  await admin
    .from('club_memberships')
    .upsert(
      { user_id: userId, club_id: club.id, role: 'admin', membership_status: 'active' },
      { onConflict: 'user_id,club_id' },
    )

  // ── Sign in ───────────────────────────────────────────────────────────────────
  const cookiesToApply: Array<{
    name:    string
    value:   string
    options: Parameters<NextResponse['cookies']['set']>[2]
  }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll:  () => request.cookies.getAll(),
        setAll:  (cookies) => {
          cookies.forEach(({ name, value, options }) => cookiesToApply.push({ name, value, options }))
        },
      },
    },
  )

  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email:    club.contact_email!,
    password,
  })

  if (signInErr) {
    return NextResponse.redirect(
      new URL(`/verify?token=${encodeURIComponent(token)}&error=${encodeURIComponent(signInErr.message)}`, request.url),
      { status: 303 },
    )
  }

  const response = NextResponse.redirect(new URL(`/${club.slug}/setup`, request.url), { status: 303 })

  cookiesToApply.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}

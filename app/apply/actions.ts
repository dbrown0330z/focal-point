'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import { sendAdminNewApplication } from '@/lib/email/send'

export interface ApplyData {
  firstName: string
  lastName:  string
  email:     string
  password:  string
}

export async function applyForMembership(
  data: ApplyData,
): Promise<{ error?: string; requiresVerification?: boolean }> {
  const displayName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim()
  const ctx     = await getClubContext()
  const service = createServiceClient()

  // Read club's approval mode.
  // 'email_verification' → send verification email; member auto-approved once verified.
  // 'admin_approval'     → skip email verification; hold as 'pending' for admin review.
  const { data: clubSettingsRow } = ctx?.clubId
    ? await service.from('club_settings').select('approval_mode').eq('club_id', ctx.clubId).single()
    : { data: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const approvalMode = (clubSettingsRow as any)?.approval_mode ?? 'email_verification'
  const isEmailVerification = approvalMode !== 'admin_approval'

  let userId: string | undefined

  if (isEmailVerification) {
    // ── Email-verification flow ─────────────────────────────────────────────
    // Use flowType:'implicit' so Supabase issues a plain OTP token_hash (no
    // pkce_ prefix). The /auth/confirm route verifies it with verifyOtp(), which
    // only works with implicit-mode tokens — PKCE tokens require the stored code
    // verifier which won't be present when the user opens the email in Gmail.
    const cookieStore = await (await import('next/headers')).cookies()
    const { createServerClient } = await import('@supabase/ssr')
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { flowType: 'implicit' },
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch { /* server component context */ }
          },
        },
      }
    )
    const { data: signUpData, error: createErr } = await supabase.auth.signUp({
      email:    data.email,
      password: data.password,
      options: {
        data: {
          display_name: displayName,
          first_name:   data.firstName.trim(),
          last_name:    data.lastName.trim(),
          club_name:    ctx?.clubName ?? '',
        },
      },
    })

    if (createErr) return { error: createErr.message }
    userId = signUpData.user?.id

  } else {
    // ── Admin-approval flow ─────────────────────────────────────────────────
    // Bypass email verification; admin is the gatekeeper.
    const { data: newUser, error: createErr } = await service.auth.admin.createUser({
      email:         data.email,
      password:      data.password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        first_name:   data.firstName.trim(),
        last_name:    data.lastName.trim(),
      },
    })

    if (createErr) return { error: createErr.message }
    userId = newUser?.user?.id
  }

  // Save profile fields captured at signup. The DB trigger creates the profile
  // row from user_metadata; we upsert here so profile data is always saved
  // even if the trigger hasn't fired yet.
  if (userId) {
    await service.from('profiles').upsert({
      id:               userId,
      first_name:       data.firstName.trim(),
      last_name:        data.lastName.trim(),
      display_name:     displayName,
      membership_status: 'pending',
    }, { onConflict: 'id' })
  }

  // Create club_memberships row. Pending in both modes:
  // - email_verification: callback upgrades to 'approved' after email click
  // - admin_approval: stays pending until admin acts
  if (userId && ctx?.clubId) {
    await service
      .from('club_memberships')
      .upsert(
        { user_id: userId, club_id: ctx.clubId, membership_status: 'pending' },
        { onConflict: 'user_id,club_id' }
      )

    // Notify admins only when their manual review is required
    if (!isEmailVerification) try {
      const base        = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://focalpointhq.com'
      const reviewUrl   = `${base}/${ctx.clubSlug}/admin/members`
      const appliedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      const clubName    = ctx.clubName

      const { data: adminMemberships } = await service
        .from('club_memberships')
        .select('user_id')
        .eq('club_id', ctx.clubId)
        .eq('role', 'admin')

      if (adminMemberships && adminMemberships.length > 0) {
        const adminUserIds = adminMemberships.map(a => a.user_id)
        const [{ data: adminProfiles }, { data: { users: adminUsers } }] = await Promise.all([
          service.from('profiles').select('id, first_name, display_name').in('id', adminUserIds),
          service.auth.admin.listUsers({ perPage: 1000 }),
        ])
        const adminEmails: Record<string, string> = {}
        for (const u of adminUsers) {
          if (u.email && adminUserIds.includes(u.id)) adminEmails[u.id] = u.email
        }
        const profileById: Record<string, { first_name: string | null; display_name: string }> = {}
        for (const p of adminProfiles ?? []) profileById[p.id] = p

        await Promise.allSettled(
          adminUserIds.map(adminId => {
            const email = adminEmails[adminId]
            if (!email) return Promise.resolve()
            const p = profileById[adminId]
            const adminFirstName = p?.first_name || p?.display_name?.split(' ')[0] || 'Admin'
            return sendAdminNewApplication({
              adminEmail:     email,
              adminFirstName,
              applicantName:  displayName,
              appliedDate,
              clubName,
              reviewUrl,
            })
          })
        )
      }
    } catch (err) {
      // Non-fatal — application is recorded even if notification fails
      console.error('[apply] failed to notify admins:', err)
    }
  }

  if (!isEmailVerification) {
    // Auto-sign in for admin-approval mode so the root page shows their pending status
    const supabase = await createClient()
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email:    data.email,
      password: data.password,
    })
    if (signInErr) console.warn('[apply] auto sign-in failed:', signInErr.message)
  }

  return { requiresVerification: isEmailVerification }
}

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

export async function applyForMembership(data: ApplyData): Promise<{ error?: string }> {
  const displayName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim()
  const ctx = await getClubContext()

  const service = createServiceClient()

  // Read club's approval mode so we set the right initial membership status.
  // 'email_verification' → auto-approve on signup (go straight to onboarding).
  // 'admin_approval'     → hold as 'pending' until an admin reviews.
  const { data: clubSettingsRow } = ctx?.clubId
    ? await service.from('club_settings').select('approval_mode').eq('club_id', ctx.clubId).single()
    : { data: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const approvalMode = (clubSettingsRow as any)?.approval_mode ?? 'email_verification'
  const initialStatus = approvalMode === 'admin_approval' ? 'pending' : 'approved'
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

  const userId = newUser?.user?.id

  // Save profile fields captured at signup. The DB trigger creates the profile
  // row from user_metadata; we upsert here so profile data is always saved
  // even if the trigger hasn't fired yet.
  // Save basic name fields — experience level, interests, brands and bio
  // are collected during the post-approval onboarding step, not at signup.
  if (userId) {
    await service.from('profiles').upsert({
      id:           userId,
      first_name:   data.firstName.trim(),
      last_name:    data.lastName.trim(),
      display_name: displayName,
    }, { onConflict: 'id' })
  }

  // Ensure a club_memberships row exists for this applicant.
  if (userId && ctx?.clubId) {
    await service
      .from('club_memberships')
      .upsert(
        { user_id: userId, club_id: ctx.clubId, membership_status: initialStatus },
        { onConflict: 'user_id,club_id' }
      )

    // Notify admins of new application only when their review is needed
    if (initialStatus === 'pending') try {
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
    } // end if (initialStatus === 'pending')
  }

  // Sign them in immediately so the root page can show the pending-approval
  // state without requiring a separate login step.
  const supabase = await createClient()
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email:    data.email,
    password: data.password,
  })

  // Non-fatal — user can sign in manually if this fails
  if (signInErr) console.warn('[apply] auto sign-in failed:', signInErr.message)

  return {}
}

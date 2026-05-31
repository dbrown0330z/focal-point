'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import { sendMemberApproved, sendMemberRejected, sendMemberStatusChanged, sendMemberEmailChanged } from '@/lib/email/send'
import type { Database } from '@/types/database'

type MembershipStatus = Database['public']['Enums']['membership_status']

export async function setMemberStatus(memberId: string, status: MembershipStatus) {
  const supabase = createServiceClient()
  const ctx = await getClubContext()

  // Read the member's current role so we never accidentally strip admin access
  // when only changing membership status. Admin role must be removed explicitly
  // via removeAdminRole / makeAdmin — not as a side-effect of a status change.
  const { data: current } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', memberId)
    .single()

  const currentRole = current?.role ?? null
  const isAdmin = currentRole === 'admin'

  // Only set role for non-admin members; for active/complimentary set to 'member'
  const roleByStatus: Partial<Record<MembershipStatus, 'member' | null>> = {
    active:        'member',
    complimentary: 'member',
    pending:       null,
    approved:      null,
    expired:       null,
    cancelled:     null,
    paused:        null,
    banned:        null,
  }
  // Preserve existing admin role; for regular members derive role from status
  const newRole = isAdmin ? currentRole : (roleByStatus[status] ?? null)

  // Update the flat profile (legacy + used by admin area)
  await supabase
    .from('profiles')
    .update({ membership_status: status, role: newRole })
    .eq('id', memberId)

  // Keep club_memberships in sync — this is what the member-facing directory
  // and layout guards query.
  if (ctx?.clubId) {
    await supabase
      .from('club_memberships')
      .update({ membership_status: status, role: newRole })
      .eq('user_id', memberId)
      .eq('club_id', ctx.clubId)
  }

  revalidatePath('/admin/members')
}

export async function approveMember(memberId: string) {
  await setMemberStatus(memberId, 'approved')

  // Send approval email with link to the onboarding wizard
  try {
    const service = createServiceClient()
    const [{ data: profile }, { data: clubSettings }, { data: { user } }] = await Promise.all([
      service.from('profiles').select('first_name, display_name').eq('id', memberId).single(),
      service.from('club_settings').select('club_name').single(),
      service.auth.admin.getUserById(memberId),
    ])

    const email          = user?.email
    const firstName      = profile?.first_name || profile?.display_name || 'there'
    const clubName       = clubSettings?.club_name ?? 'the club'
    const base           = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://focalpointhq.com'
    const onboardingUrl  = `${base}/onboarding/profile`

    if (email) {
      await sendMemberApproved({ memberEmail: email, firstName, clubName, onboardingUrl })
    }
  } catch (err) {
    // Non-fatal — approval is complete even if the email fails
    console.error('[approveMember] failed to send approval email:', err)
  }
}

export async function rejectMember(memberId: string, reason: string) {
  // Send rejection email before deleting the record
  try {
    const service = createServiceClient()
    const [{ data: profile }, { data: clubSettings }, { data: { user } }] = await Promise.all([
      service.from('profiles').select('first_name, display_name').eq('id', memberId).single(),
      service.from('club_settings').select('club_name').single(),
      service.auth.admin.getUserById(memberId),
    ])

    const email      = user?.email
    const firstName  = profile?.first_name || profile?.display_name || 'there'
    const clubName   = clubSettings?.club_name ?? 'the club'
    if (email) {
      await sendMemberRejected({ memberEmail: email, firstName, clubName, reason })
    }
  } catch (err) {
    console.error('[rejectMember] failed to send rejection email:', err)
  }

  // Delete the applicant's account — they can reapply
  await deleteMember(memberId)
}

export async function suspendMember(memberId: string, reason: string) {
  // Status 'paused' = Suspended in the UI
  await setMemberStatus(memberId, 'paused')

  // Send notification to member
  try {
    const service = createServiceClient()
    const [{ data: profile }, { data: clubSettings }, { data: { user } }] = await Promise.all([
      service.from('profiles').select('first_name, display_name').eq('id', memberId).single(),
      service.from('club_settings').select('club_name').single(),
      service.auth.admin.getUserById(memberId),
    ])
    const email      = user?.email
    const firstName  = profile?.first_name || profile?.display_name || 'there'
    const clubName   = clubSettings?.club_name ?? 'the club'
    if (email) {
      await sendMemberStatusChanged({ memberEmail: email, firstName, clubName, action: 'suspended' })
    }
    // Store reason as an internal note (non-fatal if this fails)
    console.info(`[suspendMember] ${memberId} suspended. Reason: ${reason}`)
  } catch (err) {
    console.error('[suspendMember] failed to send notification:', err)
  }
}

export async function banMember(memberId: string) {
  await setMemberStatus(memberId, 'banned')

  // Send termination notification to member
  try {
    const service = createServiceClient()
    const [{ data: profile }, { data: clubSettings }, { data: { user } }] = await Promise.all([
      service.from('profiles').select('first_name, display_name').eq('id', memberId).single(),
      service.from('club_settings').select('club_name').single(),
      service.auth.admin.getUserById(memberId),
    ])
    const email      = user?.email
    const firstName  = profile?.first_name || profile?.display_name || 'there'
    const clubName   = clubSettings?.club_name ?? 'the club'
    if (email) {
      await sendMemberStatusChanged({ memberEmail: email, firstName, clubName, action: 'terminated' })
    }
  } catch (err) {
    console.error('[banMember] failed to send notification:', err)
  }
}

export async function resignMember(memberId: string) {
  // Status 'cancelled' = Resigned in the UI
  await setMemberStatus(memberId, 'cancelled')
}

type PermissionKey = 'perm_competition_manager' | 'perm_event_manager' | 'perm_comms_manager'
type PreferenceKey = 'pref_competition_reminders' | 'pref_results_notifications'

export async function setMemberPermission(
  memberId: string,
  permission: PermissionKey,
  enabled: boolean,
): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('profiles')
    .update({ [permission]: enabled })
    .eq('id', memberId)
  if (error) return { error: error.message }
  revalidatePath('/admin/members')
  return {}
}

export async function deleteMember(memberId: string) {
  const supabase = createServiceClient()

  // Find images that were ever submitted to a competition — keep those for the
  // club record (competition gallery, results history). Delete everything else.
  const { data: submittedImages } = await supabase
    .from('submissions')
    .select('image_id')
    .eq('member_id', memberId)

  const retainedImageIds = new Set((submittedImages ?? []).map(s => s.image_id))

  const { data: allImages } = await supabase
    .from('images')
    .select('id, storage_path')
    .eq('owner_id', memberId)

  const toDelete = (allImages ?? []).filter(img => !retainedImageIds.has(img.id))

  if (toDelete.length) {
    await supabase.storage.from('images').remove(toDelete.map(i => i.storage_path))
    await supabase.from('images').delete().in('id', toDelete.map(i => i.id))
  }

  // Anonymise the profile — keep the row so competition history stays intact.
  // Retained images remain in the table; their owner_id still points here,
  // so galleries can display them under "Deleted member".
  await supabase
    .from('profiles')
    .update({
      first_name:         null,
      last_name:          null,
      display_name:       'Deleted member',
      bio:                null,
      avatar_url:         null,
      camera_brands:      [],
      shooting_interests: [],
      experience_level:   null,
      membership_status:  'cancelled',
      role:               null,
    })
    .eq('id', memberId)

  revalidatePath('/admin/members')
}

export async function updateMemberName(memberId: string, firstName: string, lastName: string) {
  const supabase = createServiceClient()
  const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || firstName
  await supabase
    .from('profiles')
    .update({
      first_name:   firstName || null,
      last_name:    lastName || null,
      display_name: displayName,
    })
    .eq('id', memberId)
  revalidatePath('/admin/members')
  revalidatePath('/our-club/members')
  revalidatePath('/', 'layout')   // nav bar + home page pick up the new display_name
}

export async function removeAdminRole(memberId: string) {
  const supabase = createServiceClient()
  const ctx = await getClubContext()
  await supabase
    .from('profiles')
    .update({ role: 'member' })
    .eq('id', memberId)
  if (ctx?.clubId) {
    await supabase
      .from('club_memberships')
      .update({ role: 'member' })
      .eq('user_id', memberId)
      .eq('club_id', ctx.clubId)
  }
  revalidatePath('/admin/members')
}

export async function makeAdmin(memberId: string) {
  const supabase = createServiceClient()
  const ctx = await getClubContext()
  await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', memberId)
  if (ctx?.clubId) {
    await supabase
      .from('club_memberships')
      .update({ role: 'admin' })
      .eq('user_id', memberId)
      .eq('club_id', ctx.clubId)
  }
  revalidatePath('/admin/members')
}

export async function setMemberSkillLevel(memberId: string, className: string | null) {
  const supabase = createServiceClient()
  await supabase
    .from('profiles')
    .update({ membership_class: className })
    .eq('id', memberId)
  revalidatePath('/admin/members')
}

export async function setMemberClassesEnabled(enabled: boolean): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('club_settings')
    .update({ member_classes_enabled: enabled })
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return { error: error.message }
  revalidatePath('/admin/members')
  return {}
}

export async function addMemberClass(name: string): Promise<{ error?: string; id?: string }> {
  const supabase = createServiceClient()
  const { data: existing } = await supabase
    .from('member_classes')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  const sort_order = (existing?.sort_order ?? -1) + 1
  const { data, error } = await supabase
    .from('member_classes')
    .insert({ name: name.trim(), sort_order })
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/admin/members')
  return { id: data.id }
}

export async function renameMemberClass(id: string, name: string): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('member_classes')
    .update({ name: name.trim() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/members')
  return {}
}

export async function deleteMemberClass(id: string): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('member_classes')
    .delete()
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/members')
  return {}
}

export async function updateMemberEmail(memberId: string, newEmail: string): Promise<{ error?: string }> {
  const supabase = createServiceClient()

  // Capture the old email before overwriting it
  const { data: { user: existing } } = await supabase.auth.admin.getUserById(memberId)
  const oldEmail = existing?.email ?? null

  // Update the canonical email in Supabase Auth (admin API — no verification required)
  const { error } = await supabase.auth.admin.updateUserById(memberId, { email: newEmail })
  if (error) return { error: error.message }

  // Send notification to both old and new addresses (non-fatal)
  if (oldEmail) {
    try {
      const [{ data: profile }, { data: clubSettings }] = await Promise.all([
        supabase.from('profiles').select('first_name, display_name').eq('id', memberId).single(),
        supabase.from('club_settings').select('club_name').single(),
      ])
      const firstName = profile?.first_name || profile?.display_name || 'there'
      const clubName  = clubSettings?.club_name ?? 'the club'
      await sendMemberEmailChanged({ oldEmail, newEmail, firstName, clubName })
    } catch (err) {
      console.error('[updateMemberEmail] failed to send notification:', err)
    }
  }

  revalidatePath('/admin/members')
  return {}
}

export async function sendPasswordReset(memberId: string): Promise<{ error?: string }> {
  const service = createServiceClient()
  const { data: { user }, error: userError } = await service.auth.admin.getUserById(memberId)
  if (userError || !user?.email) return { error: userError?.message ?? 'No email on file' }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://focalpointhq.com'
  const { error } = await service.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${base}/auth/callback`,
  })
  if (error) return { error: error.message }
  return {}
}

export async function saveEnrollmentSettings(settings: {
  approvalMode: 'admin_approval' | 'email_verification'
  notifyNewApplication: boolean
  notifyMemberActivates: boolean
  notifyPaymentLinkExpires: boolean
  notifyMembershipExpires: boolean
  notifyAllAdmins: boolean
}): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: any = {
    approval_mode:               settings.approvalMode,
    notify_new_application:      settings.notifyNewApplication,
    notify_member_activates:     settings.notifyMemberActivates,
    notify_payment_link_expires: settings.notifyPaymentLinkExpires,
    notify_membership_expires:   settings.notifyMembershipExpires,
    notify_all_admins:           settings.notifyAllAdmins,
  }
  const { error } = await supabase
    .from('club_settings')
    .update(patch)
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return { error: error.message }
  revalidatePath('/admin/members')
  return {}
}

export async function setMemberPreference(
  memberId: string,
  preference: PreferenceKey,
  enabled: boolean,
): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('profiles')
    .update({ [preference]: enabled })
    .eq('id', memberId)
  if (error) return { error: error.message }
  revalidatePath('/admin/members')
  return {}
}

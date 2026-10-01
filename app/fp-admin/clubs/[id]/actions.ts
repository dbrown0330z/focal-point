'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

async function currentUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

export async function provisionClub(clubId: string): Promise<{ error?: string }> {
  try {
    const userId = await currentUserId()
    const admin  = createServiceClient()

    // Load club record
    const { data: club } = await (admin as any)
      .from('clubs')
      .select('*')
      .eq('id', clubId)
      .single()

    if (!club) return { error: 'Club not found' }
    if (club.status === 'active') return { error: 'Club is already active' }

    // 1. Create club_settings row
    const { error: settingsErr } = await (admin as any)
      .from('club_settings')
      .upsert({
        club_id:      clubId,
        club_name:    club.name,
        contact_email: club.contact_email,
        join_open:    false,
        setup_complete: false,
      }, { onConflict: 'club_id' })
    if (settingsErr) return { error: settingsErr.message }

    // 2. Invite club admin via Supabase magic link
    const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://focalpointhq.com'
    const setupUrl  = `${siteUrl}/${club.slug}/setup`

    const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
      club.contact_email,
      {
        data:       { display_name: [club.admin_first_name, club.admin_last_name].filter(Boolean).join(' ') },
        redirectTo: setupUrl,
      }
    )
    if (inviteErr) return { error: inviteErr.message }

    const invitedUserId = inviteData?.user?.id

    // 3. Create club_memberships row for the new admin
    if (invitedUserId) {
      await (admin as any).from('profiles').upsert({
        id:           invitedUserId,
        first_name:   club.admin_first_name,
        last_name:    club.admin_last_name,
        display_name: [club.admin_first_name, club.admin_last_name].filter(Boolean).join(' '),
      }, { onConflict: 'id' })

      await (admin as any).from('club_memberships').upsert({
        user_id:           invitedUserId,
        club_id:           clubId,
        role:              'admin',
        membership_status: 'active',
      }, { onConflict: 'user_id,club_id' })
    }

    // 4. Activate the club
    await (admin as any).from('clubs').update({
      status:         'active',
      approved_at:    new Date().toISOString(),
      approved_by:    userId,
      invite_sent_at: new Date().toISOString(),
    }).eq('id', clubId)

    revalidatePath('/fp-admin')
    revalidatePath('/fp-admin/clubs')
    revalidatePath(`/fp-admin/clubs/${clubId}`)
    return {}
  } catch (err: any) {
    return { error: err.message ?? 'Unexpected error' }
  }
}

export async function resendInvite(clubId: string): Promise<{ error?: string }> {
  try {
    const admin = createServiceClient()
    const { data: club } = await (admin as any)
      .from('clubs')
      .select('contact_email, slug, admin_first_name, admin_last_name')
      .eq('id', clubId)
      .single()
    if (!club) return { error: 'Club not found' }

    const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://focalpointhq.com'
    const { error } = await admin.auth.admin.inviteUserByEmail(
      club.contact_email,
      {
        data:       { display_name: [club.admin_first_name, club.admin_last_name].filter(Boolean).join(' ') },
        redirectTo: `${siteUrl}/${club.slug}/setup`,
      }
    )
    if (error) return { error: error.message }

    await (admin as any).from('clubs').update({
      invite_sent_at: new Date().toISOString(),
    }).eq('id', clubId)

    revalidatePath(`/fp-admin/clubs/${clubId}`)
    return {}
  } catch (err: any) {
    return { error: err.message ?? 'Unexpected error' }
  }
}

export async function suspendClub(clubId: string): Promise<{ error?: string }> {
  const admin = createServiceClient()
  const { error } = await (admin as any)
    .from('clubs').update({ status: 'suspended' }).eq('id', clubId)
  if (error) return { error: error.message }
  revalidatePath('/fp-admin/clubs')
  revalidatePath(`/fp-admin/clubs/${clubId}`)
  return {}
}

export async function reactivateClub(clubId: string): Promise<{ error?: string }> {
  const admin = createServiceClient()
  const { error } = await (admin as any)
    .from('clubs').update({ status: 'active' }).eq('id', clubId)
  if (error) return { error: error.message }
  revalidatePath('/fp-admin/clubs')
  revalidatePath(`/fp-admin/clubs/${clubId}`)
  return {}
}

export async function saveNotes(clubId: string, notes: string): Promise<{ error?: string }> {
  const admin = createServiceClient()
  const { error } = await (admin as any)
    .from('clubs').update({ notes }).eq('id', clubId)
  if (error) return { error: error.message }
  revalidatePath(`/fp-admin/clubs/${clubId}`)
  return {}
}

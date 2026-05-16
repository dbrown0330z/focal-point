'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getResend } from '@/lib/email/client'

export type SendResult =
  | { ok: true;  recipientCount: number }
  | { ok: false; error: string }

export async function sendNotification(args: {
  subject:    string
  htmlBody:   string
  toOption:   'all_active' | 'all_members' | 'custom'
  customIds?: string[]
}): Promise<SendResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  // ── Resolve recipients ───────────────────────────────────────────────────────
  let query = supabase
    .from('profiles')
    .select('id, email:id, display_name, first_name, last_name')
    .not('email', 'is', null)

  if (args.toOption === 'all_active') {
    query = query.eq('membership_status', 'active')
  } else if (args.toOption === 'all_members') {
    query = query.in('membership_status', ['active', 'expired', 'paused', 'complimentary'])
  } else {
    if (!args.customIds?.length) return { ok: false, error: 'No recipients selected' }
    query = query.in('id', args.customIds)
  }

  const { data: profileRows, error: profileErr } = await query
  if (profileErr) return { ok: false, error: profileErr.message }

  // Fetch emails separately (auth.users not exposed through profiles directly)
  const recipientIds = (profileRows ?? []).map(p => p.id)
  if (recipientIds.length === 0) return { ok: false, error: 'No matching recipients found' }

  // Use service role to read auth emails
  const { createServiceClient } = await import('@/lib/supabase/service')
  const service = createServiceClient()

  // Build email list from profiles joined to auth via admin API
  const emailList: string[] = []
  for (const id of recipientIds) {
    const { data } = await service.auth.admin.getUserById(id)
    const email = data.user?.email
    if (email) emailList.push(email)
  }

  if (emailList.length === 0) return { ok: false, error: 'No email addresses found for recipients' }

  // ── Get club settings for from address ───────────────────────────────────────
  const { data: settings } = await supabase
    .from('club_settings')
    .select('club_name, from_email')
    .single()

  const clubName  = settings?.club_name  ?? 'Your Camera Club'
  const fromEmail = settings?.from_email?.trim()
  const fromAddress = fromEmail
    ? `${clubName} <${fromEmail}>`
    : `${clubName} <notifications@${process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'focalpointhq.com'}>`

  // ── Send via Resend ───────────────────────────────────────────────────────────
  // Send in batches of 50 (Resend batch limit)
  const resend = getResend()
  const BATCH = 50
  for (let i = 0; i < emailList.length; i += BATCH) {
    const batch = emailList.slice(i, i + BATCH)
    const { error: sendErr } = await resend.emails.send({
      from:    fromAddress,
      to:      batch,
      subject: args.subject,
      html:    args.htmlBody,
    })
    if (sendErr) return { ok: false, error: `Send failed: ${sendErr.message}` }
  }

  // ── Log to sent_messages ──────────────────────────────────────────────────────
  const sentToLabel =
    args.toOption === 'all_active'   ? `All active members (${emailList.length})` :
    args.toOption === 'all_members'  ? `All members (${emailList.length})` :
                                       `${emailList.length} selected member${emailList.length === 1 ? '' : 's'}`

  await supabase.from('sent_messages').insert({
    sent_by:          user.id,
    subject:          args.subject,
    html_body:        args.htmlBody,
    sent_to:          sentToLabel,
    recipient_count:  emailList.length,
  })

  revalidatePath('/admin/notifications')
  return { ok: true, recipientCount: emailList.length }
}

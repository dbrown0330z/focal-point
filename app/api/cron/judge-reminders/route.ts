import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  sendAdminReminder7Day,
  sendAdminReminder1Day,
  sendAdminReminderOnOpen,
  sendAdminReminderFollowUp,
  sendJudgeReminder1Day,
  sendJudgeReminderClosingDay,
} from '@/lib/email/send'

// Runs daily at 06:00 UTC via Vercel Cron.
// All checks are idempotent — uses reminders_sent flags to avoid duplicates.

function toDateStr(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth()    === b.getUTCMonth()    &&
    a.getUTCDate()     === b.getUTCDate()
  )
}

export async function GET(req: Request) {
  // Verify Vercel cron secret to prevent unauthenticated calls
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const today    = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // ── Fetch relevant competitions ────────────────────────────────────────────

  const { data: competitions, error } = await supabase
    .from('competitions')
    .select('id, title, status, judging_opens_at, judging_closes_at, reminders_sent, judge_tokens(id, judge_name, judge_email, token, invitation_sent_at)')
    .in('status', ['open', 'judging', 'judging_on_hold'])
    .not('judging_opens_at', 'is', null)

  if (error || !competitions) {
    console.error('Cron: failed to fetch competitions', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }

  // ── Fetch admin profile for email personalisation ──────────────────────────

  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id, first_name')
    .eq('role', 'admin')
    .limit(1)
    .single()

  const { data: clubSettings } = await supabase
    .from('club_settings')
    .select('club_name')
    .single()

  // Admin email is in Supabase Auth, not the profiles table
  let adminEmail = ''
  let adminFirstName = 'Admin'
  if (adminProfiles) {
    adminFirstName = adminProfiles.first_name ?? 'Admin'
    const { data: authUser } = await supabase.auth.admin.getUserById(adminProfiles.id)
    adminEmail = authUser?.user?.email ?? ''
  }

  const clubName    = clubSettings?.club_name ?? 'your club'
  const origin      = process.env.NEXT_PUBLIC_APP_URL ?? 'https://focalpointapp.com'
  const results: string[] = []

  for (const comp of competitions) {
    const judgingOpens  = new Date(comp.judging_opens_at!)
    const judgingCloses = comp.judging_closes_at ? new Date(comp.judging_closes_at) : null
    const reminders     = comp.reminders_sent as {
      admin7Day: boolean; admin1Day: boolean; adminOnOpen: boolean
      adminFollowUpCount: number; judge1Day: boolean; judgeClosingDay: boolean
    }
    const judges        = (comp.judge_tokens as { id: string; judge_name: string; judge_email: string; token: string; invitation_sent_at: string | null }[]) ?? []
    const hasJudge      = judges.length > 0
    const detailUrl     = `${origin}/admin/competitions/${comp.id}`

    const patch: Record<string, unknown> = {}

    // ── ADMIN reminders (no judge assigned) ───────────────────────────────

    if (!hasJudge && adminEmail) {
      const daysUntilOpen = daysBetween(today, judgingOpens)

      // Reminder 1 — 7 days before
      if (daysUntilOpen === 7 && !reminders.admin7Day) {
        try {
          await sendAdminReminder7Day({
            adminEmail, adminFirstName,
            competitionName: comp.title,
            judgingOpenDate: toDateStr(comp.judging_opens_at!),
            detailPageUrl:   detailUrl,
          })
          patch['reminders_sent'] = { ...reminders, admin7Day: true }
          results.push(`${comp.title}: admin 7-day reminder sent`)
        } catch (e) { console.error(`Reminder 7-day failed for ${comp.title}`, e) }
      }

      // Reminder 2 — 1 day before
      if (daysUntilOpen === 1 && !reminders.admin1Day) {
        try {
          await sendAdminReminder1Day({
            adminEmail, adminFirstName,
            competitionName: comp.title,
            judgingOpenDate: toDateStr(comp.judging_opens_at!),
            detailPageUrl:   detailUrl,
          })
          patch['reminders_sent'] = { ...reminders, ...(patch['reminders_sent'] as object ?? {}), admin1Day: true }
          results.push(`${comp.title}: admin 1-day reminder sent`)
        } catch (e) { console.error(`Reminder 1-day failed for ${comp.title}`, e) }
      }

      // Reminder 3 — judging window opens today, no judge → set judging_on_hold
      if (sameDay(today, judgingOpens) && !reminders.adminOnOpen) {
        try {
          await sendAdminReminderOnOpen({ adminEmail, adminFirstName, competitionName: comp.title, detailPageUrl: detailUrl })
          patch['status']          = 'judging_on_hold'
          patch['reminders_sent']  = { ...reminders, ...(patch['reminders_sent'] as object ?? {}), adminOnOpen: true }
          results.push(`${comp.title}: judging on hold + admin on-open reminder sent`)
        } catch (e) { console.error(`Reminder on-open failed for ${comp.title}`, e) }
      }

      // Reminder 4 — daily follow-up (max 3)
      if (
        comp.status === 'judging_on_hold' &&
        judgingCloses && today <= judgingCloses &&
        reminders.adminOnOpen &&
        reminders.adminFollowUpCount < 3
      ) {
        const daysOnHold = daysBetween(judgingOpens, today)
        if (daysOnHold >= 1) {
          try {
            await sendAdminReminderFollowUp({
              adminEmail, adminFirstName,
              competitionName: comp.title,
              daysOnHold,
              detailPageUrl: detailUrl,
            })
            patch['reminders_sent'] = {
              ...reminders,
              ...(patch['reminders_sent'] as object ?? {}),
              adminFollowUpCount: reminders.adminFollowUpCount + 1,
            }
            results.push(`${comp.title}: admin follow-up #${reminders.adminFollowUpCount + 1} sent`)
          } catch (e) { console.error(`Follow-up failed for ${comp.title}`, e) }
        }
      }
    }

    // ── JUDGE reminders ───────────────────────────────────────────────────

    if (hasJudge && judgingCloses) {
      const daysUntilClose = daysBetween(today, judgingCloses)
      const judge          = judges[0]
      const judgingUrl     = `${origin}/judge/${judge.token}`
      const judgeFirstName = judge.judge_name.split(' ')[0]

      // Judge reminder — 1 day before close
      if (daysUntilClose === 1 && !reminders.judge1Day) {
        try {
          await sendJudgeReminder1Day({
            judgeEmail:       judge.judge_email,
            judgeFirstName,
            competitionName:  comp.title,
            judgingCloseDate: toDateStr(comp.judging_closes_at!),
            judgingUrl,
            clubName,
          })
          patch['reminders_sent'] = { ...reminders, ...(patch['reminders_sent'] as object ?? {}), judge1Day: true }
          results.push(`${comp.title}: judge 1-day reminder sent`)
        } catch (e) { console.error(`Judge 1-day reminder failed for ${comp.title}`, e) }
      }

      // Judge reminder — closing day
      if (sameDay(today, judgingCloses) && !reminders.judgeClosingDay) {
        try {
          await sendJudgeReminderClosingDay({
            judgeEmail:       judge.judge_email,
            judgeFirstName,
            competitionName:  comp.title,
            judgingCloseDate: toDateStr(comp.judging_closes_at!),
            judgingUrl,
            clubName,
          })
          patch['reminders_sent'] = { ...reminders, ...(patch['reminders_sent'] as object ?? {}), judgeClosingDay: true }
          results.push(`${comp.title}: judge closing-day reminder sent`)
        } catch (e) { console.error(`Judge closing-day reminder failed for ${comp.title}`, e) }
      }
    }

    // Persist any state changes
    if (Object.keys(patch).length > 0) {
      await supabase.from('competitions').update(patch).eq('id', comp.id)
    }
  }

  return NextResponse.json({ ok: true, processed: competitions.length, actions: results })
}

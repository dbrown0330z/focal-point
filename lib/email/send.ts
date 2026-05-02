import { getResend, FROM_ADDRESS } from './client'
import {
  adminReminder7Day,
  adminReminder1Day,
  adminReminderOnOpen,
  adminReminderFollowUp,
  judgeInvitation,
  judgeReminder1Day,
  judgeReminderClosingDay,
  memberCancellationNotification,
  judgeCancellationNotification,
} from './templates'

// ─── Admin reminders ──────────────────────────────────────────────────────────

export async function sendAdminReminder7Day(args: {
  adminEmail:       string
  adminFirstName:   string
  competitionName:  string
  judgingOpenDate:  string
  detailPageUrl:    string
}) {
  const { subject, html } = adminReminder7Day(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.adminEmail, subject, html })
}

export async function sendAdminReminder1Day(args: {
  adminEmail:       string
  adminFirstName:   string
  competitionName:  string
  judgingOpenDate:  string
  detailPageUrl:    string
}) {
  const { subject, html } = adminReminder1Day(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.adminEmail, subject, html })
}

export async function sendAdminReminderOnOpen(args: {
  adminEmail:       string
  adminFirstName:   string
  competitionName:  string
  detailPageUrl:    string
}) {
  const { subject, html } = adminReminderOnOpen(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.adminEmail, subject, html })
}

export async function sendAdminReminderFollowUp(args: {
  adminEmail:       string
  adminFirstName:   string
  competitionName:  string
  daysOnHold:       number
  detailPageUrl:    string
}) {
  const { subject, html } = adminReminderFollowUp(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.adminEmail, subject, html })
}

// ─── Judge emails ─────────────────────────────────────────────────────────────

export async function sendJudgeInvitation(args: {
  judgeEmail:       string
  judgeFirstName:   string
  competitionName:  string
  clubName:         string
  judgingOpenDate:  string
  judgingCloseDate: string
  judgingUrl:       string
}) {
  const { subject, html } = judgeInvitation(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.judgeEmail, subject, html })
}

export async function sendJudgeReminder1Day(args: {
  judgeEmail:       string
  judgeFirstName:   string
  competitionName:  string
  judgingCloseDate: string
  judgingUrl:       string
  clubName:         string
}) {
  const { subject, html } = judgeReminder1Day(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.judgeEmail, subject, html })
}

export async function sendJudgeReminderClosingDay(args: {
  judgeEmail:       string
  judgeFirstName:   string
  competitionName:  string
  judgingCloseDate: string
  judgingUrl:       string
  clubName:         string
}) {
  const { subject, html } = judgeReminderClosingDay(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.judgeEmail, subject, html })
}

export async function sendMemberCancellationNotification(args: {
  memberEmail:        string
  memberFirstName:    string
  competitionName:    string
  cancellationReason: string
  clubName:           string
}) {
  const { subject, html } = memberCancellationNotification(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.memberEmail, subject, html })
}

export async function sendJudgeCancellationNotification(args: {
  judgeEmail:      string
  judgeFirstName:  string
  competitionName: string
  clubName:        string
}) {
  const { subject, html } = judgeCancellationNotification(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.judgeEmail, subject, html })
}

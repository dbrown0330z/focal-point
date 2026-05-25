import { getResend, FROM_ADDRESS } from './client'
import {
  adminNewApplication,
  memberApproved,
  memberRejected,
  memberWelcome,
  adminNewActiveMember,
  memberStatusChanged,
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

// ─── Admin: new application notification ─────────────────────────────────────

export async function sendAdminNewApplication(args: {
  adminEmail:     string
  adminFirstName: string
  applicantName:  string
  appliedDate:    string
  clubName:       string
  reviewUrl:      string
}) {
  const { subject, html } = adminNewApplication(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.adminEmail, subject, html })
}

// ─── Member: approval notification ───────────────────────────────────────────

export async function sendMemberApproved(args: {
  memberEmail:   string
  firstName:     string
  clubName:      string
  onboardingUrl: string
  adminEmail?:   string
}) {
  const { subject, html } = memberApproved(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.memberEmail, subject, html })
}

// ─── Member: rejection notification ──────────────────────────────────────────

export async function sendMemberRejected(args: {
  memberEmail:  string
  firstName:    string
  clubName:     string
  reason:       string
  adminEmail?:  string
}) {
  const { subject, html } = memberRejected(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.memberEmail, subject, html })
}

// ─── Member: welcome (account activated) ─────────────────────────────────────

export async function sendMemberWelcome(args: {
  memberEmail:  string
  firstName:    string
  clubName:     string
  interests:    string[]
  clubUrl:      string
  adminEmail?:  string
}) {
  const { subject, html } = memberWelcome(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.memberEmail, subject, html })
}

// ─── Admin: new active member notification ────────────────────────────────────

export async function sendAdminNewActiveMember(args: {
  adminEmail:     string
  adminFirstName: string
  memberName:     string
  clubName:       string
  memberUrl:      string
}) {
  const { subject, html } = adminNewActiveMember(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.adminEmail, subject, html })
}

// ─── Member: status changed (suspend/ban) ────────────────────────────────────

export async function sendMemberStatusChanged(args: {
  memberEmail:  string
  firstName:    string
  clubName:     string
  action:       'suspended' | 'terminated'
  adminEmail?:  string
}) {
  const { subject, html } = memberStatusChanged(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.memberEmail, subject, html })
}

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

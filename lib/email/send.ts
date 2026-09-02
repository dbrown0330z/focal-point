import { getResend, FROM_ADDRESS } from './client'
import {
  adminNewApplication,
  adminNewActiveMember,
  adminPaymentLinkExpired,
  adminReminder7Day,
  adminReminder1Day,
  adminReminderOnOpen,
  adminReminderFollowUp,
  memberApproved,
  memberRejected,
  memberWelcome,
  memberSuspended,
  memberBanned,
  memberEmailChanged,
  memberCancellationNotification,
  judgeInvitation,
  judgeReminder1Day,
  judgeReminderClosingDay,
  judgeCancellationNotification,
} from './templates'

// ─── Admin ────────────────────────────────────────────────────────────────────

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

export async function sendAdminPaymentLinkExpired(args: {
  adminEmail:   string
  memberName:   string
  approvalDate: string
  memberUrl:    string
}) {
  const { subject, html } = adminPaymentLinkExpired(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.adminEmail, subject, html })
}

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

// ─── Member ───────────────────────────────────────────────────────────────────

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

export async function sendMemberWelcome(args: {
  memberEmail:     string
  firstName:       string
  clubName:        string
  interests:       string[]
  profileUrl:      string
  adminEmail?:     string
  presidentEmail?: string
}) {
  const { subject, html } = memberWelcome(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.memberEmail, subject, html })
}

export async function sendMemberSuspended(args: {
  memberEmail:  string
  firstName:    string
  clubName:     string
  adminEmail?:  string
}) {
  const { subject, html } = memberSuspended(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.memberEmail, subject, html })
}

export async function sendMemberBanned(args: {
  memberEmail:  string
  firstName:    string
  clubName:     string
  adminEmail?:  string
}) {
  const { subject, html } = memberBanned(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.memberEmail, subject, html })
}

export async function sendMemberEmailChanged(args: {
  oldEmail:    string
  newEmail:    string
  firstName:   string
  clubName:    string
  adminEmail?: string
}) {
  const { subject, html } = memberEmailChanged(args)
  // Notify both addresses — old gets the security alert, new gets confirmation
  await Promise.all([
    getResend().emails.send({ from: FROM_ADDRESS, to: args.oldEmail, subject, html }),
    getResend().emails.send({ from: FROM_ADDRESS, to: args.newEmail, subject, html }),
  ])
}

export async function sendMemberCancellationNotification(args: {
  memberEmail:        string
  memberFirstName:    string
  competitionName:    string
  cancellationReason: string
  clubName:           string
  adminEmail?:        string
}) {
  const { subject, html } = memberCancellationNotification(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.memberEmail, subject, html })
}

// ─── Judge ────────────────────────────────────────────────────────────────────

export async function sendJudgeInvitation(args: {
  judgeEmail:       string
  judgeFirstName:   string
  competitionName:  string
  clubName:         string
  judgingOpenDate:  string
  judgingCloseDate: string
  judgingUrl:       string
  adminEmail?:      string
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
  adminEmail?:      string
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
  adminEmail?:      string
}) {
  const { subject, html } = judgeReminderClosingDay(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.judgeEmail, subject, html })
}

export async function sendJudgeCancellationNotification(args: {
  judgeEmail:      string
  judgeFirstName:  string
  competitionName: string
  clubName:        string
  adminEmail?:     string
}) {
  const { subject, html } = judgeCancellationNotification(args)
  await getResend().emails.send({ from: FROM_ADDRESS, to: args.judgeEmail, subject, html })
}

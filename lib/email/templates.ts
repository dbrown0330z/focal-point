// ─── Email templates ──────────────────────────────────────────────────────────
// All templates return { subject, html } for use with Resend.
// Plain-text HTML — no external dependencies required.

// ─── Admin: new membership application ───────────────────────────────────────

export function adminNewApplication(args: {
  adminFirstName: string
  applicantName:  string
  appliedDate:    string
  clubName:       string
  reviewUrl:      string
}): { subject: string; html: string } {
  return {
    subject: `New membership application — ${args.applicantName}`,
    html: base(`
      <p>Hi ${args.adminFirstName},</p>
      <p>A new membership application has been submitted for <strong>${args.clubName}</strong>.</p>
      <table style="margin:18px 0;border-collapse:collapse;font-size:14px">
        <tr><td style="color:#737373;padding:3px 16px 3px 0">Applicant</td><td>${args.applicantName}</td></tr>
        <tr><td style="color:#737373;padding:3px 16px 3px 0">Applied</td><td>${args.appliedDate}</td></tr>
      </table>
      <a href="${args.reviewUrl}" class="btn">Review application →</a>
    `),
  }
}

// ─── Member: application approved ────────────────────────────────────────────

export function memberApproved(args: {
  firstName:   string
  clubName:    string
  onboardingUrl: string
  adminEmail?: string
}): { subject: string; html: string } {
  return {
    subject: `Your ${args.clubName} application has been approved`,
    html: base(`
      <p>Hi ${args.firstName},</p>
      <p>Your application to join <strong>${args.clubName}</strong> has been approved — welcome.</p>
      <p>To complete your membership, two quick steps:</p>
      <ol style="font-size:15px;line-height:1.8;color:#1A1A1A">
        <li>Finish setting up your profile</li>
        <li>Pay your annual membership dues</li>
      </ol>
      <a href="${args.onboardingUrl}" class="btn">Complete your membership →</a>
      ${args.adminEmail ? `<p style="font-size:13px;color:#737373">If you have any questions, contact us at <a href="mailto:${args.adminEmail}">${args.adminEmail}</a>.</p>` : ''}
      <p style="font-size:13px;color:#737373">— ${args.clubName}</p>
    `),
  }
}

// ─── Member: application rejected ────────────────────────────────────────────

export function memberRejected(args: {
  firstName:   string
  clubName:    string
  reason:      string
  adminEmail?: string
}): { subject: string; html: string } {
  return {
    subject: `Update on your ${args.clubName} application`,
    html: base(`
      <p>Hi ${args.firstName},</p>
      <p>Thank you for your interest in <strong>${args.clubName}</strong>.</p>
      <p>After reviewing your application, we are unable to approve your membership at this time.</p>
      <p style="padding:14px 18px;background:#F5F5F5;border-radius:7px;font-size:14px;color:#525252;font-style:italic">${args.reason}</p>
      ${args.adminEmail ? `<p>If you have questions, contact us at <a href="mailto:${args.adminEmail}">${args.adminEmail}</a>.</p>` : ''}
      <p style="font-size:13px;color:#737373">— ${args.clubName}</p>
    `),
  }
}

// ─── Member: welcome (payment confirmed / free club activated) ────────────────

export function memberWelcome(args: {
  firstName:      string
  clubName:       string
  interests:      string[]
  clubUrl:        string
  adminEmail?:    string
}): { subject: string; html: string } {
  const interestLine = args.interests.length > 0
    ? `<p>We've noted your interest in ${args.interests.slice(0, 2).join(' and ')}. Keep an eye on competitions — categories you'll enjoy come up regularly.</p>`
    : ''
  return {
    subject: `Welcome to ${args.clubName} — you're all set`,
    html: base(`
      <p>Hi ${args.firstName},</p>
      <p>Your membership is confirmed. Welcome to <strong>${args.clubName}</strong>.</p>
      ${interestLine}
      <p>Here's how to get started:</p>
      <ul style="font-size:15px;line-height:2;color:#1A1A1A">
        <li>Submit your first competition entry</li>
        <li>Check the calendar for upcoming meetings and events</li>
        <li>Browse the member directory to connect with other photographers</li>
      </ul>
      <a href="${args.clubUrl}" class="btn">Go to your profile →</a>
      <p style="font-size:13px;color:#737373">— ${args.clubName}</p>
    `),
  }
}

// ─── Admin: new active member ─────────────────────────────────────────────────

export function adminNewActiveMember(args: {
  adminFirstName:  string
  memberName:      string
  clubName:        string
  memberUrl:       string
}): { subject: string; html: string } {
  return {
    subject: `New active member — ${args.memberName}`,
    html: base(`
      <p>Hi ${args.adminFirstName},</p>
      <p><strong>${args.memberName}</strong> has completed payment and is now an active member of ${args.clubName}.</p>
      <a href="${args.memberUrl}" class="btn">View member profile →</a>
    `),
  }
}

// ─── Member: membership status changed (suspend / ban) ───────────────────────

export function memberStatusChanged(args: {
  firstName:  string
  clubName:   string
  action:     'suspended' | 'terminated'
  adminEmail?: string
}): { subject: string; html: string } {
  return {
    subject: `Your ${args.clubName} membership`,
    html: base(`
      <p>Hi ${args.firstName},</p>
      <p>Your <strong>${args.clubName}</strong> membership has been ${args.action}.</p>
      ${args.adminEmail ? `<p>If you believe this is an error, contact us at <a href="mailto:${args.adminEmail}">${args.adminEmail}</a>.</p>` : ''}
      <p style="font-size:13px;color:#737373">— ${args.clubName}</p>
    `),
  }
}

function base(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.65; color: #1A1A1A; background: #F5F5F5; margin: 0; padding: 0; }
    .wrap { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 10px; border: 1px solid #E0E0E0; overflow: hidden; }
    .body { padding: 36px 40px; }
    .footer { padding: 20px 40px; background: #F5F5F5; border-top: 1px solid #E8E8E8; font-size: 13px; color: #737373; }
    a { color: #1A6FC4; }
    .btn { display: inline-block; margin: 20px 0 8px; padding: 11px 22px; background: #1E4D8C; color: #fff !important; border-radius: 7px; font-weight: 600; font-size: 14px; text-decoration: none; }
    .warning { background: #FFFBE6; border: 1px solid #F0D060; border-radius: 7px; padding: 14px 18px; margin: 18px 0; font-size: 14px; color: #6B5000; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="body">${body}</div>
    <div class="footer">— The Focal Point team</div>
  </div>
</body>
</html>`
}

// ─── Admin: 7 days before judging window opens ────────────────────────────────

export function adminReminder7Day(args: {
  adminFirstName:   string
  competitionName:  string
  judgingOpenDate:  string
  detailPageUrl:    string
}): { subject: string; html: string } {
  return {
    subject: `Action needed: assign a judge for ${args.competitionName}`,
    html: base(`
      <p>Hi ${args.adminFirstName},</p>
      <p>The judging window for <strong>${args.competitionName}</strong> opens in 7 days, on ${args.judgingOpenDate}.</p>
      <p>No judge has been assigned yet. A judge must be in place before the judging window opens for scoring to begin.</p>
      <a href="${args.detailPageUrl}" class="btn">Assign judge →</a>
      <p style="font-size:13px;color:#737373">You can manage all competition settings from your admin area at any time.</p>
    `),
  }
}

// ─── Admin: 1 day before judging window opens ─────────────────────────────────

export function adminReminder1Day(args: {
  adminFirstName:   string
  competitionName:  string
  judgingOpenDate:  string
  detailPageUrl:    string
}): { subject: string; html: string } {
  return {
    subject: `Reminder: ${args.competitionName} judging opens tomorrow — no judge assigned`,
    html: base(`
      <p>Hi ${args.adminFirstName},</p>
      <p>This is a reminder that the judging window for <strong>${args.competitionName}</strong> opens tomorrow, ${args.judgingOpenDate}.</p>
      <div class="warning">⚠ A judge still hasn't been assigned. Without one, judging cannot begin and your competition will be put on hold.</div>
      <a href="${args.detailPageUrl}" class="btn">Assign judge today →</a>
    `),
  }
}

// ─── Admin: judging window opens, still no judge ──────────────────────────────

export function adminReminderOnOpen(args: {
  adminFirstName:   string
  competitionName:  string
  detailPageUrl:    string
}): { subject: string; html: string } {
  return {
    subject: `${args.competitionName} judging is on hold — judge required`,
    html: base(`
      <p>Hi ${args.adminFirstName},</p>
      <p>The judging window for <strong>${args.competitionName}</strong> opened today, but no judge has been assigned.</p>
      <div class="warning">⚠ Judging is currently on hold. Members are waiting for results — please assign a judge as soon as possible.</div>
      <a href="${args.detailPageUrl}" class="btn">Assign judge now →</a>
      <p>Once a judge is assigned they will automatically receive their judging invitation by email.</p>
    `),
  }
}

// ─── Admin: daily follow-up while judging is on hold ─────────────────────────

export function adminReminderFollowUp(args: {
  adminFirstName:   string
  competitionName:  string
  daysOnHold:       number
  detailPageUrl:    string
}): { subject: string; html: string } {
  return {
    subject: `${args.competitionName} is still on hold — judge not yet assigned`,
    html: base(`
      <p>Hi ${args.adminFirstName},</p>
      <p><strong>${args.competitionName}</strong> is still waiting for a judge to be assigned. The judging window has been open for ${args.daysOnHold} ${args.daysOnHold === 1 ? 'day' : 'days'} and members are expecting results.</p>
      <a href="${args.detailPageUrl}" class="btn">Assign judge now →</a>
    `),
  }
}

// ─── Judge: invitation ────────────────────────────────────────────────────────

export function judgeInvitation(args: {
  judgeFirstName:   string
  competitionName:  string
  clubName:         string
  judgingOpenDate:  string
  judgingCloseDate: string
  judgingUrl:       string
}): { subject: string; html: string } {
  return {
    subject: `You've been invited to judge ${args.competitionName}`,
    html: base(`
      <p>Hi ${args.judgeFirstName},</p>
      <p>You've been invited to judge <strong>${args.competitionName}</strong> for ${args.clubName}.</p>
      <table style="margin:18px 0;border-collapse:collapse;font-size:14px">
        <tr><td style="color:#737373;padding:3px 16px 3px 0">Judging window</td><td>${args.judgingOpenDate} – ${args.judgingCloseDate}</td></tr>
      </table>
      <a href="${args.judgingUrl}" class="btn">Access judging area →</a>
      <p style="font-size:13px;color:#737373">This link gives you access to this competition only. It will become active on ${args.judgingOpenDate} and will expire automatically when the judging window closes on ${args.judgingCloseDate}.</p>
      <p style="font-size:13px;color:#737373">You do not need to create an account. Your link is all you need.</p>
    `),
  }
}

// ─── Judge: reminder 1 day before close ──────────────────────────────────────

export function judgeReminder1Day(args: {
  judgeFirstName:   string
  competitionName:  string
  judgingCloseDate: string
  judgingUrl:       string
  clubName:         string
}): { subject: string; html: string } {
  return {
    subject: `Reminder: judging for ${args.competitionName} closes tomorrow`,
    html: base(`
      <p>Hi ${args.judgeFirstName},</p>
      <p>This is a reminder that your judging window for <strong>${args.competitionName}</strong> closes tomorrow, ${args.judgingCloseDate}.</p>
      <p>Please ensure all scores are submitted before the window closes. Your judging link will expire at midnight on ${args.judgingCloseDate}.</p>
      <a href="${args.judgingUrl}" class="btn">Return to judging →</a>
    `),
  }
}

// ─── Judge: reminder on closing day ──────────────────────────────────────────

export function judgeReminderClosingDay(args: {
  judgeFirstName:   string
  competitionName:  string
  judgingCloseDate: string
  judgingUrl:       string
  clubName:         string
}): { subject: string; html: string } {
  return {
    subject: `Today is the last day to submit your scores for ${args.competitionName}`,
    html: base(`
      <p>Hi ${args.judgeFirstName},</p>
      <p>Your judging window for <strong>${args.competitionName}</strong> closes tonight at midnight.</p>
      <div class="warning">⚠ Please submit all scores before your link expires.</div>
      <a href="${args.judgingUrl}" class="btn">Return to judging →</a>
    `),
  }
}

// ─── Member: competition cancelled ───────────────────────────────────────────

export function memberCancellationNotification(args: {
  memberFirstName:     string
  competitionName:     string
  cancellationReason:  string
  clubName:            string
}): { subject: string; html: string } {
  return {
    subject: `${args.competitionName} has been cancelled`,
    html: base(`
      <p>Hi ${args.memberFirstName},</p>
      <p><strong>${args.competitionName}</strong> has been cancelled by the club admin.</p>
      <p style="padding:14px 18px;background:#F5F5F5;border-radius:7px;font-size:14px;color:#525252;font-style:italic">${args.cancellationReason}</p>
      <p>Your submitted image(s) have been returned to your entry pool and can be submitted to future competitions.</p>
      <p>If you have any questions, please contact the club directly.</p>
      <p style="font-size:13px;color:#737373">— ${args.clubName}</p>
    `),
  }
}

// ─── Judge: competition cancelled ────────────────────────────────────────────

// ─── Member: login email changed by admin ────────────────────────────────────

export function memberEmailChanged(args: {
  firstName:  string
  oldEmail:   string
  newEmail:   string
  clubName:   string
}): { subject: string; html: string } {
  return {
    subject: `Your ${args.clubName} login email has been updated`,
    html: base(`
      <p>Hi ${args.firstName},</p>
      <p>An administrator has updated the email address associated with your <strong>${args.clubName}</strong> account.</p>
      <table style="margin:18px 0;border-collapse:collapse;font-size:14px">
        <tr><td style="color:#737373;padding:3px 16px 3px 0">Previous email</td><td>${args.oldEmail}</td></tr>
        <tr><td style="color:#737373;padding:3px 16px 3px 0">New email</td><td><strong>${args.newEmail}</strong></td></tr>
      </table>
      <p>You will need to use <strong>${args.newEmail}</strong> to sign in from now on.</p>
      <div class="warning">If you did not expect this change, please contact your club administrator immediately.</div>
      <p style="font-size:13px;color:#737373">— ${args.clubName}</p>
    `),
  }
}

// ─── Judge: cancellation notification ────────────────────────────────────────

export function judgeCancellationNotification(args: {
  judgeFirstName:   string
  competitionName:  string
  clubName:         string
}): { subject: string; html: string } {
  return {
    subject: `${args.competitionName} has been cancelled`,
    html: base(`
      <p>Hi ${args.judgeFirstName},</p>
      <p><strong>${args.competitionName}</strong> has been cancelled by the club admin. Your judging link has been deactivated.</p>
      <p>Thank you for your time.</p>
      <p style="font-size:13px;color:#737373">— ${args.clubName}</p>
    `),
  }
}

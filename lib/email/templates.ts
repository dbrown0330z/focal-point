// ─── Email templates ──────────────────────────────────────────────────────────
// All templates return { subject, html } for use with Resend.

// ─── Shared wrapper ───────────────────────────────────────────────────────────

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
    .footer { padding: 16px 40px; background: #F5F5F5; border-top: 1px solid #E8E8E8; font-size: 12px; color: #A0A0A0; }
    a { color: #1A6FC4; }
    .btn { display: inline-block; margin: 20px 0 8px; padding: 11px 22px; background: #1E4D8C; color: #fff !important; border-radius: 7px; font-weight: 600; font-size: 14px; text-decoration: none; }
    .warning { background: #FFFBE6; border: 1px solid #F0D060; border-radius: 7px; padding: 14px 18px; margin: 18px 0; font-size: 14px; color: #6B5000; }
    .reason { padding: 14px 18px; background: #F5F5F5; border-radius: 7px; font-size: 14px; color: #525252; font-style: italic; margin: 14px 0; }
    ul, ol { font-size: 15px; line-height: 2; color: #1A1A1A; }
    table.info { margin: 18px 0; border-collapse: collapse; font-size: 14px; }
    table.info td { padding: 3px 16px 3px 0; }
    table.info td:first-child { color: #737373; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="body">${body}</div>
    <div class="footer">Sent by Focal Point · You're receiving this because you're a member or applicant.</div>
  </div>
</body>
</html>`
}

// ─── Member: application approved ────────────────────────────────────────────

export function memberApproved(args: {
  firstName:     string
  clubName:      string
  onboardingUrl: string
  adminEmail?:   string
}): { subject: string; html: string } {
  return {
    subject: `You're approved — let's get you set up`,
    html: base(`
      <p>Hi ${args.firstName},</p>
      <p>Great news — your application to join <strong>${args.clubName}</strong> has been approved.</p>
      <p>You're just two steps away from full membership:</p>
      <ol>
        <li>Finish setting up your profile</li>
        <li>Pay your annual dues</li>
      </ol>
      <a href="${args.onboardingUrl}" class="btn">Complete your membership →</a>
      ${args.adminEmail ? `<p style="font-size:13px;color:#737373">Questions? Reach us at <a href="mailto:${args.adminEmail}">${args.adminEmail}</a>.</p>` : ''}
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
    subject: `Your ${args.clubName} application`,
    html: base(`
      <p>Hi ${args.firstName},</p>
      <p>Thank you for your interest in <strong>${args.clubName}</strong>. After reviewing your application, we aren't able to offer membership at this time.</p>
      <div class="reason">${args.reason}</div>
      ${args.adminEmail ? `<p>If you'd like to discuss this further, reach out at <a href="mailto:${args.adminEmail}">${args.adminEmail}</a>.</p>` : ''}
      <p style="font-size:13px;color:#737373">— ${args.clubName}</p>
    `),
  }
}

// ─── Member: welcome (payment confirmed / free club activated) ────────────────

export function memberWelcome(args: {
  firstName:       string
  clubName:        string
  interests:       string[]
  profileUrl:      string
  adminEmail?:     string
  presidentEmail?: string
}): { subject: string; html: string } {
  const interestLine = args.interests.length > 0
    ? `<p>We've noted your interest in ${args.interests.slice(0, 2).join(' and ')} — keep an eye on upcoming competitions.</p>`
    : ''
  const contactEmail = args.presidentEmail ?? args.adminEmail
  return {
    subject: `Welcome to ${args.clubName} — you're officially in`,
    html: base(`
      <p>Hi ${args.firstName},</p>
      <p>Your membership is confirmed. Welcome to <strong>${args.clubName}</strong> — we're glad you're here.</p>
      ${interestLine}
      <p>Here's what's waiting for you:</p>
      <ul>
        <li><strong>Calendar</strong> — check upcoming meetings, events, and field trips so you never miss what the club has going on</li>
        <li><strong>Competitions</strong> — see when the next competition opens for submissions and browse results from past competitions to get a feel for the standard</li>
        <li><strong>Image library</strong> — upload images any time so they're ready to submit when a competition opens</li>
        <li><strong>Member directory</strong> — meet your fellow members, see what cameras they shoot with, and find photographers with similar interests</li>
      </ul>
      <a href="${args.profileUrl}" class="btn">Go to your profile →</a>
      ${contactEmail ? `<p style="font-size:13px;color:#737373">Any questions? Reach out at <a href="mailto:${contactEmail}">${contactEmail}</a>.</p>` : ''}
      <p style="font-size:13px;color:#737373">Your friends at ${args.clubName}</p>
    `),
  }
}

// ─── Member: suspended ────────────────────────────────────────────────────────

export function memberSuspended(args: {
  firstName:   string
  clubName:    string
  adminEmail?: string
}): { subject: string; html: string } {
  return {
    subject: `Your ${args.clubName} membership has been suspended`,
    html: base(`
      <p>Hi ${args.firstName},</p>
      <p>Your <strong>${args.clubName}</strong> membership has been temporarily suspended. You won't be able to access the site while your account is on hold.</p>
      ${args.adminEmail ? `<p>If you think this is a mistake, please contact us at <a href="mailto:${args.adminEmail}">${args.adminEmail}</a>.</p>` : ''}
      <p style="font-size:13px;color:#737373">— ${args.clubName}</p>
    `),
  }
}

// ─── Member: banned / terminated ─────────────────────────────────────────────

export function memberBanned(args: {
  firstName:   string
  clubName:    string
  adminEmail?: string
}): { subject: string; html: string } {
  return {
    subject: `Your ${args.clubName} membership has been terminated`,
    html: base(`
      <p>Hi ${args.firstName},</p>
      <p>Your <strong>${args.clubName}</strong> membership has been terminated.</p>
      ${args.adminEmail ? `<p>If you believe this is an error, contact us at <a href="mailto:${args.adminEmail}">${args.adminEmail}</a>.</p>` : ''}
      <p style="font-size:13px;color:#737373">— ${args.clubName}</p>
    `),
  }
}

// ─── Member: login email changed by admin ────────────────────────────────────

export function memberEmailChanged(args: {
  firstName:   string
  oldEmail:    string
  newEmail:    string
  clubName:    string
  adminEmail?: string
}): { subject: string; html: string } {
  return {
    subject: `Your sign-in email has been updated`,
    html: base(`
      <p>Hi ${args.firstName},</p>
      <p>The email address on your <strong>${args.clubName}</strong> account has been changed by an administrator.</p>
      <table class="info">
        <tr><td>Previous email</td><td>${args.oldEmail}</td></tr>
        <tr><td>New email</td><td><strong>${args.newEmail}</strong></td></tr>
      </table>
      <p>Use <strong>${args.newEmail}</strong> to sign in from now on.</p>
      <div class="warning">Wasn't expecting this? Contact your club administrator right away${args.adminEmail ? ` at <a href="mailto:${args.adminEmail}">${args.adminEmail}</a>` : ''}.</div>
      <p style="font-size:13px;color:#737373">— ${args.clubName}</p>
    `),
  }
}

// ─── Member: competition cancelled ───────────────────────────────────────────

export function memberCancellationNotification(args: {
  memberFirstName:     string
  competitionName:     string
  cancellationReason:  string
  clubName:            string
  adminEmail?:         string
}): { subject: string; html: string } {
  return {
    subject: `${args.competitionName} has been cancelled`,
    html: base(`
      <p>Hi ${args.memberFirstName},</p>
      <p><strong>${args.competitionName}</strong> has been cancelled.</p>
      <div class="reason">${args.cancellationReason}</div>
      <p>Any images you submitted have been returned to your entry pool — you're free to enter them in future competitions.</p>
      ${args.adminEmail ? `<p>Questions? Contact the club at <a href="mailto:${args.adminEmail}">${args.adminEmail}</a>.</p>` : ''}
      <p style="font-size:13px;color:#737373">— ${args.clubName}</p>
    `),
  }
}

// ─── Admin: new membership application ───────────────────────────────────────

export function adminNewApplication(args: {
  adminEmail:     string
  adminFirstName: string
  applicantName:  string
  appliedDate:    string
  clubName:       string
  reviewUrl:      string
}): { subject: string; html: string } {
  return {
    subject: `New membership application — ${args.applicantName}`,
    html: base(`
      <p><strong>${args.applicantName}</strong> has submitted a membership application for <strong>${args.clubName}</strong>.</p>
      <table class="info">
        <tr><td>Applied</td><td>${args.appliedDate}</td></tr>
      </table>
      <a href="${args.reviewUrl}" class="btn">Review application →</a>
    `),
  }
}

// ─── Admin: new active member ─────────────────────────────────────────────────

export function adminNewActiveMember(args: {
  adminEmail:     string
  adminFirstName: string
  memberName:     string
  clubName:       string
  memberUrl:      string
}): { subject: string; html: string } {
  return {
    subject: `New active member — ${args.memberName}`,
    html: base(`
      <p><strong>${args.memberName}</strong> has completed their membership setup and is now active in <strong>${args.clubName}</strong>.</p>
      <a href="${args.memberUrl}" class="btn">View member profile →</a>
    `),
  }
}

// ─── Admin: payment link expired ─────────────────────────────────────────────

export function adminPaymentLinkExpired(args: {
  memberName:    string
  approvalDate:  string
  memberUrl:     string
}): { subject: string; html: string } {
  return {
    subject: `Membership payment not completed — ${args.memberName}`,
    html: base(`
      <p><strong>${args.memberName}</strong> was approved on ${args.approvalDate} but has not completed payment. Their payment link has expired.</p>
      <p>You can resend a new payment link from their profile.</p>
      <a href="${args.memberUrl}" class="btn">View member →</a>
    `),
  }
}

// ─── Admin: 7 days before judging window opens ────────────────────────────────

export function adminReminder7Day(args: {
  adminEmail:       string
  adminFirstName:   string
  competitionName:  string
  judgingOpenDate:  string
  detailPageUrl:    string
}): { subject: string; html: string } {
  return {
    subject: `Assign a judge — ${args.competitionName} opens in 7 days`,
    html: base(`
      <p>The judging window for <strong>${args.competitionName}</strong> opens on ${args.judgingOpenDate}. No judge has been assigned yet.</p>
      <p>A judge must be in place before the window opens or judging will be put on hold.</p>
      <a href="${args.detailPageUrl}" class="btn">Assign judge →</a>
    `),
  }
}

// ─── Admin: 1 day before judging window opens ─────────────────────────────────

export function adminReminder1Day(args: {
  adminEmail:       string
  adminFirstName:   string
  competitionName:  string
  judgingOpenDate:  string
  detailPageUrl:    string
}): { subject: string; html: string } {
  return {
    subject: `${args.competitionName} judging opens tomorrow — no judge assigned`,
    html: base(`
      <p>The judging window for <strong>${args.competitionName}</strong> opens tomorrow. No judge has been assigned.</p>
      <p>Without a judge in place, judging cannot begin and the competition will go on hold.</p>
      <a href="${args.detailPageUrl}" class="btn">Assign judge today →</a>
    `),
  }
}

// ─── Admin: judging window opens, still no judge ──────────────────────────────

export function adminReminderOnOpen(args: {
  adminEmail:       string
  adminFirstName:   string
  competitionName:  string
  detailPageUrl:    string
}): { subject: string; html: string } {
  return {
    subject: `${args.competitionName} is on hold — judge required`,
    html: base(`
      <p>The judging window for <strong>${args.competitionName}</strong> opened today but no judge has been assigned. The competition is currently on hold.</p>
      <p>Members are waiting for results. Please assign a judge as soon as possible — they'll receive their invitation automatically.</p>
      <a href="${args.detailPageUrl}" class="btn">Assign judge now →</a>
    `),
  }
}

// ─── Admin: daily follow-up while judging is on hold ─────────────────────────

export function adminReminderFollowUp(args: {
  adminEmail:       string
  adminFirstName:   string
  competitionName:  string
  daysOnHold:       number
  detailPageUrl:    string
}): { subject: string; html: string } {
  return {
    subject: `Still on hold — ${args.competitionName}`,
    html: base(`
      <p><strong>${args.competitionName}</strong> has been on hold for ${args.daysOnHold} ${args.daysOnHold === 1 ? 'day' : 'days'}. No judge has been assigned.</p>
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
  adminEmail?:      string
}): { subject: string; html: string } {
  return {
    subject: `Judging invitation — ${args.competitionName}`,
    html: base(`
      <p>Hi ${args.judgeFirstName},</p>
      <p>You've been invited to judge <strong>${args.competitionName}</strong> for ${args.clubName}. We appreciate you lending your eye.</p>
      <table class="info">
        <tr><td>Judging window</td><td>${args.judgingOpenDate} — ${args.judgingCloseDate}</td></tr>
      </table>
      <a href="${args.judgingUrl}" class="btn">Access judging area →</a>
      <p style="font-size:13px;color:#737373">Your link becomes active on ${args.judgingOpenDate} and expires automatically when the window closes. You don't need an account — the link is all you need.</p>
      ${args.adminEmail ? `<p style="font-size:13px;color:#737373">If you have any questions, contact the club at <a href="mailto:${args.adminEmail}">${args.adminEmail}</a>.</p>` : ''}
      <p style="font-size:13px;color:#737373">— ${args.clubName}</p>
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
  adminEmail?:      string
}): { subject: string; html: string } {
  return {
    subject: `Judging closes tomorrow — ${args.competitionName}`,
    html: base(`
      <p>Hi ${args.judgeFirstName},</p>
      <p>A reminder that your judging window for <strong>${args.competitionName}</strong> closes tomorrow, ${args.judgingCloseDate}.</p>
      <p>Please make sure all scores are submitted before midnight. Your access link will expire at that time.</p>
      <a href="${args.judgingUrl}" class="btn">Return to judging →</a>
      ${args.adminEmail ? `<p style="font-size:13px;color:#737373">Questions? Contact the club at <a href="mailto:${args.adminEmail}">${args.adminEmail}</a>.</p>` : ''}
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
  adminEmail?:      string
}): { subject: string; html: string } {
  return {
    subject: `Last day to submit scores — ${args.competitionName}`,
    html: base(`
      <p>Hi ${args.judgeFirstName},</p>
      <p>Your judging window for <strong>${args.competitionName}</strong> closes tonight at midnight. Please submit any remaining scores before your link expires.</p>
      <a href="${args.judgingUrl}" class="btn">Return to judging →</a>
      ${args.adminEmail ? `<p style="font-size:13px;color:#737373">Questions? Contact the club at <a href="mailto:${args.adminEmail}">${args.adminEmail}</a>.</p>` : ''}
    `),
  }
}

// ─── Judge: competition cancelled ────────────────────────────────────────────

export function judgeCancellationNotification(args: {
  judgeFirstName:   string
  competitionName:  string
  clubName:         string
  adminEmail?:      string
}): { subject: string; html: string } {
  return {
    subject: `${args.competitionName} has been cancelled`,
    html: base(`
      <p>Hi ${args.judgeFirstName},</p>
      <p><strong>${args.competitionName}</strong> has been cancelled by the club. Your judging link has been deactivated.</p>
      <p>Thank you for your time — we hope to work with you again soon.</p>
      ${args.adminEmail ? `<p style="font-size:13px;color:#737373">If you have any questions, contact the club at <a href="mailto:${args.adminEmail}">${args.adminEmail}</a>.</p>` : ''}
      <p style="font-size:13px;color:#737373">— ${args.clubName}</p>
    `),
  }
}

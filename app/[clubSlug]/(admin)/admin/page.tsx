import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug, requireClubId } from '@/lib/club-context'
import Link from 'next/link'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default async function AdminDashboardPage() {
  const clubSlug = await requireClubSlug()
  const clubId   = await requireClubId()
  const supabase = await createClient()
  const admin = createServiceClient()

  // Phase 1: counts, competitions, settings (all club-scoped)
  const [
    { count: pendingCount },
    { count: memberCount },
    { data: activeCompetitions },
    { data: recentCompetitions },
    { data: clubSettings },
    { data: clubRow },
    { data: recentMemberships },
  ] = await Promise.all([
    admin.from('club_memberships').select('id', { count: 'exact', head: true }).eq('club_id', clubId).in('membership_status', ['pending', 'approved']),
    admin.from('club_memberships').select('id', { count: 'exact', head: true }).eq('club_id', clubId).in('membership_status', ['active', 'complimentary']),
    admin.from('competitions').select('id, title, status, closes_at').eq('club_id', clubId).in('status', ['open', 'judging']).is('deleted_at', null).order('created_at', { ascending: false }),
    admin.from('competitions').select('id, title, created_at').eq('club_id', clubId).is('deleted_at', null).order('created_at', { ascending: false }).limit(3),
    admin.from('club_settings').select('membership_terms_reviewed').eq('club_id', clubId).single(),
    admin.from('clubs').select('verified_at').eq('id', clubId).single(),
    admin.from('club_memberships').select('user_id, created_at').eq('club_id', clubId).order('created_at', { ascending: false }).limit(3),
  ])

  // Phase 2: look up display names for recent memberships
  const recentMemberIds = (recentMemberships ?? []).map(m => m.user_id)
  const { data: recentProfiles } = recentMemberIds.length > 0
    ? await admin.from('profiles').select('id, display_name').in('id', recentMemberIds)
    : { data: [] }
  const profileNameById = Object.fromEntries((recentProfiles ?? []).map(p => [p.id, p.display_name]))

  // Phase 3: scope submissions to this club's competitions
  const allClubCompIds = (activeCompetitions ?? []).map(c => c.id)
    .concat((recentCompetitions ?? []).map(c => c.id))
  const uniqueCompIds = [...new Set(allClubCompIds)]
  const { data: recentSubmissions } = uniqueCompIds.length > 0
    ? await admin.from('submissions').select('id, submitted_at, images(title), profiles!member_id(display_name)').in('competition_id', uniqueCompIds).order('submitted_at', { ascending: false }).limit(4)
    : { data: [] }

  // Trial banner calculation
  const TRIAL_DAYS = 60
  let trialDaysLeft: number | null = null
  let trialEndDate: string | null = null
  if (clubRow?.verified_at) {
    const end = new Date(clubRow.verified_at).getTime() + TRIAL_DAYS * 86400000
    trialDaysLeft = Math.ceil((end - Date.now()) / 86400000)
    trialEndDate = new Date(end).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const termsReviewed = clubSettings?.membership_terms_reviewed ?? true

  // Build merged activity feed
  type ActivityItem = { time: string; label: string; detail: string; dot: string; href: string }
  const activity: ActivityItem[] = []

  for (const s of recentSubmissions ?? []) {
    const img = s.images as { title: string } | null
    const prof = s.profiles as { display_name: string } | null
    activity.push({
      time:   timeAgo(s.submitted_at),
      label:  'Image submitted',
      detail: [img?.title, prof?.display_name].filter(Boolean).join(' · '),
      dot:    'var(--action-primary)',
      href:   `/${clubSlug}/admin/competitions`,
    })
  }
  for (const m of recentMemberships ?? []) {
    const displayName = profileNameById[m.user_id] ?? 'Someone'
    activity.push({
      time:   timeAgo(m.created_at),
      label:  'Member registered',
      detail: `${displayName} joined`,
      dot:    'var(--status-success)',
      href:   `/${clubSlug}/admin/members`,
    })
  }
  for (const c of recentCompetitions ?? []) {
    activity.push({
      time:   timeAgo(c.created_at),
      label:  'Competition created',
      detail: c.title,
      dot:    'var(--text-tertiary)',
      href:   `/${clubSlug}/admin/competitions/${c.id}`,
    })
  }
  activity.sort((a, b) => {
    // rough ordering — items with "ago" first, then "Yesterday", then by date string
    return 0
  })
  const activityFeed = activity.slice(0, 8)

  const stats = [
    { label: 'Pending approvals', value: pendingCount ?? 0, href: `/${clubSlug}/admin/members`, urgent: (pendingCount ?? 0) > 0 },
    { label: 'Active members', value: memberCount ?? 0, href: `/${clubSlug}/admin/members`, urgent: false },
    { label: 'Active competitions', value: activeCompetitions?.length ?? 0, href: `/${clubSlug}/admin/competitions`, urgent: false },
  ]

  const quickActions = [
    { label: 'Add member',      icon: 'users',    href: `/${clubSlug}/admin/members` },
    { label: 'New competition', icon: 'trophy',   href: `/${clubSlug}/admin/competitions/new` },
    { label: 'New post',        icon: 'pages',    href: `/${clubSlug}/admin/posts/new` },
    { label: 'Club Basics',     icon: 'settings', href: `/${clubSlug}/admin/club-defaults` },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Dashboard</h1>
        <p className="mt-1 text-[13px] text-content-secondary">Club overview</p>
      </div>

      {/* Trial banner */}
      {trialDaysLeft !== null && trialDaysLeft > 0 && (
        <div className="flex items-start gap-3 rounded-[10px] border border-[--action-primary] bg-[--surface-2] px-5 py-4" style={{ borderColor: 'var(--action-primary)', background: 'rgba(26,111,196,0.06)' }}>
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: 'var(--action-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold" style={{ color: 'var(--action-primary)' }}>
              Free trial — {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} remaining
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Your trial ends on {trialEndDate}. All features are fully available during the trial with no limits.
            </p>
          </div>
          <Link
            href={`/${clubSlug}/admin/billing`}
            className="flex-shrink-0 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors"
            style={{ color: 'var(--action-primary)', border: '1px solid var(--action-primary)', background: 'transparent' }}
          >
            Upgrade
          </Link>
        </div>
      )}

      {trialDaysLeft !== null && trialDaysLeft <= 0 && (
        <div className="flex items-start gap-3 rounded-[10px] border px-5 py-4" style={{ borderColor: 'var(--status-error)', background: 'var(--status-error-bg)' }}>
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: 'var(--status-error)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold" style={{ color: 'var(--status-error-text)' }}>
              Your trial has ended
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: 'var(--status-error-text)' }}>
              Members can no longer access the club site. Upgrade to restore access.
            </p>
          </div>
          <Link
            href={`/${clubSlug}/admin/billing`}
            className="flex-shrink-0 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors"
            style={{ color: 'var(--status-error-text)', border: '1px solid var(--status-error)', background: 'transparent' }}
          >
            Upgrade now
          </Link>
        </div>
      )}

      {/* Membership terms reminder */}
      {!termsReviewed && (
        <div className="flex items-start gap-3 rounded-[10px] border border-status-warning bg-status-warning-bg px-5 py-4">
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-status-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-status-warning-text">Review your membership terms</p>
            <p className="mt-0.5 text-[12px] text-status-warning-text leading-relaxed">
              You&apos;re currently using the Focal Point default template. Review and update it before accepting member applications.
            </p>
          </div>
          <Link
            href={`/${clubSlug}/admin/club-defaults#membership-terms`}
            className="flex-shrink-0 rounded-md px-3 py-1.5 text-[12px] font-medium text-status-warning-text border border-status-warning hover:bg-status-warning hover:text-white transition-colors"
          >
            Review now →
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, href, urgent }) => (
          <Link
            key={label}
            href={href}
            className={`rounded-[10px] border p-5 transition-colors ${
              urgent
                ? 'border-status-warning bg-status-warning-bg hover:bg-[#FFF5CC]'
                : 'border-border-default bg-surface-2 hover:bg-surface-1'
            }`}
          >
            <p className={`text-[36px] font-bold leading-none mb-1.5 ${urgent ? 'text-status-warning-text' : 'text-content-primary'}`}>
              {value}
            </p>
            <p className={`text-[13px] ${urgent ? 'text-status-warning-text' : 'text-content-secondary'}`}>
              {label}
            </p>
          </Link>
        ))}
      </div>

      {/* Two-column: competitions+actions | activity */}
      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 300px' }}>

        {/* Left column */}
        <div className="space-y-6">

          {/* Active competitions */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.07em] text-content-tertiary">Active competitions</h2>
              <Link href={`/${clubSlug}/admin/competitions`} className="text-[13px] text-action-primary hover:underline transition-colors">
                View all →
              </Link>
            </div>

            {!activeCompetitions?.length ? (
              <div className="rounded-[10px] border border-border-default bg-surface-2 px-5 py-8 text-center">
                <p className="text-[13px] text-content-tertiary">No competitions currently open or in judging.</p>
                <Link href={`/${clubSlug}/admin/competitions/new`} className="mt-3 inline-block text-[13px] font-medium text-action-primary hover:underline">
                  Create one →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle rounded-[10px] border border-border-default bg-surface-2">
                {activeCompetitions.map(c => (
                  <Link
                    key={c.id}
                    href={`/${clubSlug}/admin/competitions/${c.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-1 transition-colors"
                  >
                    <p className="text-[14px] font-semibold text-content-primary">{c.title}</p>
                    <div className="flex items-center gap-3">
                      {c.closes_at && (
                        <span className="text-[12px] text-content-tertiary">Closes {new Date(c.closes_at).toLocaleDateString()}</span>
                      )}
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                        c.status === 'open'
                          ? 'bg-status-success-bg text-status-success-text'
                          : 'bg-status-warning-bg text-status-warning-text'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.07em] text-content-tertiary">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-2.5 rounded-[8px] border border-border-default bg-surface-2 px-4 py-2.5 text-[13px] text-content-primary hover:bg-surface-1 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Right column — Recent Activity */}
        <section>
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.07em] text-content-tertiary">Recent Activity</h2>
          <div className="rounded-[10px] border border-border-default bg-surface-2 overflow-hidden">
            {activityFeed.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13px] text-content-tertiary">No recent activity</p>
            ) : (
              activityFeed.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className={`flex gap-3 px-4 py-3 hover:bg-surface-1 transition-colors items-start ${i < activityFeed.length - 1 ? 'border-b border-border-subtle' : ''}`}
                >
                  <span
                    className="mt-[5px] h-[7px] w-[7px] flex-shrink-0 rounded-full"
                    style={{ background: item.dot }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-semibold leading-snug text-content-primary">{item.label}</span>
                    <span className="block text-[11px] text-content-secondary mt-0.5 truncate">{item.detail}</span>
                  </span>
                  <span className="flex-shrink-0 text-[11px] text-content-tertiary whitespace-nowrap">{item.time}</span>
                </Link>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  )
}

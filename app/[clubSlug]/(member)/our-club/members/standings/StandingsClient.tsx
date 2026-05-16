'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { skillLabel } from '@/lib/profile-options'
import type {
  PoyEntry,
  AwardLeaderboardEntry,
  RecentAward,
  SeasonOption,
  CurrentProfile,
} from './page'

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function Avatar({
  name,
  url,
  size = 32,
}: {
  name: string
  url:  string | null
  size?: number
}) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.36) }
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className="rounded-full object-cover border border-border-default flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      className="flex items-center justify-center rounded-full text-white font-semibold flex-shrink-0"
      style={{ ...style, background: 'var(--action-primary)' }}
    >
      {getInitials(name)}
    </span>
  )
}

function SkillBadge({ level }: { level: string | null }) {
  if (!level) return null
  const colours: Record<string, { bg: string; text: string }> = {
    beginner:     { bg: 'rgba(0,151,167,0.10)',  text: 'var(--spot-teal)' },
    intermediate: { bg: 'rgba(108,71,212,0.10)', text: 'var(--spot-purple)' },
    advanced:     { bg: 'rgba(46,125,50,0.12)',  text: 'var(--status-success-text)' },
  }
  const s = colours[level] ?? { bg: 'rgba(90,106,130,0.10)', text: 'var(--text-secondary)' }
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: s.bg, color: s.text }}
    >
      {skillLabel(level)}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-[0.07em] text-content-tertiary mb-3">
      {children}
    </h2>
  )
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-border-default bg-surface-2 px-5 py-8 text-center">
      <p className="text-[13px] text-content-tertiary">{children}</p>
    </div>
  )
}

function NotConfiguredCard({ feature }: { feature: string }) {
  return (
    <div className="rounded-[10px] border border-border-default bg-surface-2 px-6 py-10 text-center">
      <svg className="mx-auto mb-3 h-8 w-8 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
      <p className="text-[14px] font-semibold text-content-primary mb-1">{feature} not configured</p>
      <p className="text-[13px] text-content-tertiary">
        Club admins can set this up in Club Defaults.
      </p>
    </div>
  )
}

// ── Season selector ────────────────────────────────────────────────────────────

function SeasonSelector({
  options,
  current,
  tabParam,
}: {
  options:   SeasonOption[]
  current:   number
  tabParam?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(() => {
      const p = new URLSearchParams(searchParams.toString())
      p.set('season', e.target.value)
      if (tabParam) p.set('tab', tabParam)
      router.push(`?${p.toString()}`)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[13px] text-content-secondary">Season</span>
      <select
        value={current}
        onChange={handleChange}
        className="rounded-md border border-border-default bg-surface-2 px-2.5 py-1.5 text-[13px] text-content-primary focus:outline-none"
        style={{ borderColor: 'var(--border-default)' }}
      >
        {options.map(o => (
          <option key={o.year} value={o.year}>
            {o.label}{o.isCurrent ? ' (current)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

// ── Current-user highlight card ────────────────────────────────────────────────

function MyPoyCard({
  profile,
  entry,
}: {
  profile: CurrentProfile
  entry:   PoyEntry | null
}) {
  return (
    <div
      className="rounded-[10px] border px-5 py-4 mb-6"
      style={{
        borderColor:     'rgba(26,111,196,0.30)',
        backgroundColor: 'rgba(26,111,196,0.05)',
      }}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.07em] mb-3"
        style={{ color: 'var(--action-primary)' }}>
        Your standing
      </p>
      {entry ? (
        <div className="flex items-center gap-3">
          <Avatar name={profile.displayName} url={profile.avatarUrl} size={40} />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-content-primary">{profile.displayName}</p>
            <p className="text-[13px] text-content-secondary mt-0.5">
              {ordinalSuffix(entry.rank)} place
              {entry.tied ? '=' : ''}
              {' · '}
              {entry.score} pts
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <SkillBadge level={profile.skillLevel} />
              {profile.shootingInterests?.slice(0, 2).map(i => (
                <span key={i}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ background: 'rgba(90,106,130,0.10)', color: 'var(--text-secondary)' }}>
                  {i}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-content-secondary">
          You haven&apos;t entered a scored competition this season yet.{' '}
          <Link href="/competitions" className="text-action-primary hover:underline">
            Enter a competition
          </Link>{' '}
          to appear in the standings.
        </p>
      )}
    </div>
  )
}

function MyAwardsCard({
  profile,
  entry,
}: {
  profile: CurrentProfile
  entry:   AwardLeaderboardEntry | null
}) {
  return (
    <div
      className="rounded-[10px] border px-5 py-4 mb-6"
      style={{
        borderColor:     'rgba(26,111,196,0.30)',
        backgroundColor: 'rgba(26,111,196,0.05)',
      }}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.07em] mb-3"
        style={{ color: 'var(--action-primary)' }}>
        Your awards this season
      </p>
      {entry ? (
        <>
          <div className="space-y-1 mb-2">
            {Object.entries(entry.byType).map(([name, count]) => (
              <p key={name} className="text-[13px] text-content-primary">
                <span className="font-medium">{name}</span>
                <span className="text-content-secondary"> × {count}</span>
              </p>
            ))}
          </div>
          <p className="text-[12px] text-content-tertiary">
            Total: {entry.total} award{entry.total !== 1 ? 's' : ''}
          </p>
        </>
      ) : (
        <p className="text-[13px] text-content-secondary">
          No awards yet this season. Keep entering competitions.
        </p>
      )}
    </div>
  )
}

// ── POY leaderboard ────────────────────────────────────────────────────────────

const INITIAL_SHOW = 20

function PoyLeaderboard({
  entries,
  hasCompetitions,
}: {
  entries:         PoyEntry[]
  hasCompetitions: boolean
}) {
  const [showAll, setShowAll] = useState(false)

  if (!hasCompetitions) {
    return (
      <EmptyCard>
        No scored competitions this season yet.
        Standings will appear once competition results are published.
      </EmptyCard>
    )
  }

  if (entries.length === 0) {
    return (
      <EmptyCard>
        No scores recorded yet this season.
      </EmptyCard>
    )
  }

  const visible  = showAll ? entries : entries.slice(0, INITIAL_SHOW)
  const overflow = entries.length - INITIAL_SHOW

  return (
    <>
      <div className="rounded-[10px] border border-border-default bg-surface-2 overflow-hidden">
        {/* Header row */}
        <div className="grid gap-3 border-b border-border-subtle px-4 py-2.5"
          style={{ gridTemplateColumns: '2.5rem 1fr 5rem 7rem' }}>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-content-tertiary text-right">Rank</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-content-tertiary">Member</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-content-tertiary text-right">Score</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-content-tertiary text-right pr-1">Competitions</span>
        </div>

        {visible.map((entry, i) => (
          <div
            key={entry.memberId}
            className={`grid gap-3 px-4 py-3 items-center transition-colors hover:bg-surface-1 ${
              i < visible.length - 1 ? 'border-b border-border-subtle' : ''
            } ${entry.isCurrentUser ? 'bg-[rgba(26,111,196,0.04)]' : ''}`}
            style={{ gridTemplateColumns: '2.5rem 1fr 5rem 7rem' }}
          >
            {/* Rank */}
            <span className={`text-right text-[14px] font-semibold tabular-nums ${
              entry.rank <= 3 ? 'text-content-primary' : 'text-content-secondary'
            }`}>
              {entry.rank}{entry.tied ? '=' : ''}
              {entry.isCurrentUser && (
                <span className="ml-1 text-[10px]" style={{ color: 'var(--action-primary)' }}>★</span>
              )}
            </span>

            {/* Member */}
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={entry.displayName} url={entry.avatarUrl} size={28} />
              <div className="min-w-0">
                <Link
                  href={`/our-club/members`}
                  className="text-[13px] font-medium text-content-primary hover:text-action-primary truncate block leading-tight"
                >
                  {entry.displayName}
                </Link>
                {entry.skillLevel && (
                  <span className="text-[11px] text-content-tertiary">{skillLabel(entry.skillLevel)}</span>
                )}
              </div>
            </div>

            {/* Score */}
            <span className="text-right text-[14px] font-semibold tabular-nums text-content-primary">
              {entry.score.toFixed(1)}
            </span>

            {/* Competitions */}
            <span className="text-right text-[13px] text-content-secondary tabular-nums pr-1">
              {entry.competitionsEntered}
            </span>
          </div>
        ))}
      </div>

      {/* Show all / collapse */}
      {overflow > 0 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 w-full rounded-[8px] border border-border-default bg-surface-2 py-2 text-[13px] text-content-secondary hover:bg-surface-1 transition-colors"
        >
          Show all {entries.length} members
        </button>
      )}
      {showAll && entries.length > INITIAL_SHOW && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-3 w-full rounded-[8px] border border-border-default bg-surface-2 py-2 text-[13px] text-content-secondary hover:bg-surface-1 transition-colors"
        >
          Show fewer
        </button>
      )}
    </>
  )
}

// ── Award leaderboard ──────────────────────────────────────────────────────────

function AwardLeaderboard({
  entries,
}: {
  entries: AwardLeaderboardEntry[]
}) {
  const [showAll, setShowAll] = useState(false)

  if (entries.length === 0) {
    return <EmptyCard>No awards recorded this season yet.</EmptyCard>
  }

  // Collect all unique award type names across all entries
  const allTypes = [...new Set(entries.flatMap(e => Object.keys(e.byType)))]
  const visible  = showAll ? entries : entries.slice(0, INITIAL_SHOW)
  const overflow = entries.length - INITIAL_SHOW

  return (
    <>
      <div className="rounded-[10px] border border-border-default bg-surface-2 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-2.5">
          <span className="w-6 flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-content-tertiary">#</span>
          <span className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-content-tertiary">Member</span>
          {allTypes.map(t => (
            <span key={t} className="w-20 flex-shrink-0 text-right text-[11px] font-semibold uppercase tracking-wide text-content-tertiary truncate">
              {t}
            </span>
          ))}
          <span className="w-14 flex-shrink-0 text-right text-[11px] font-semibold uppercase tracking-wide text-content-tertiary">Total</span>
        </div>

        {visible.map((entry, i) => (
          <div
            key={entry.memberId}
            className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-1 ${
              i < visible.length - 1 ? 'border-b border-border-subtle' : ''
            } ${entry.isCurrentUser ? 'bg-[rgba(26,111,196,0.04)]' : ''}`}
          >
            <span className="w-6 flex-shrink-0 text-[13px] text-content-tertiary tabular-nums">{i + 1}</span>
            <div className="flex flex-1 items-center gap-2.5 min-w-0">
              <Avatar name={entry.displayName} url={entry.avatarUrl} size={28} />
              <span className="text-[13px] font-medium text-content-primary truncate">
                {entry.displayName}
                {entry.isCurrentUser && (
                  <span className="ml-1 text-[11px]" style={{ color: 'var(--action-primary)' }}>★</span>
                )}
              </span>
            </div>
            {allTypes.map(t => (
              <span key={t} className="w-20 flex-shrink-0 text-right text-[13px] tabular-nums text-content-secondary">
                {entry.byType[t] ?? '—'}
              </span>
            ))}
            <span className="w-14 flex-shrink-0 text-right text-[14px] font-semibold tabular-nums text-content-primary">
              {entry.total}
            </span>
          </div>
        ))}
      </div>

      {overflow > 0 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 w-full rounded-[8px] border border-border-default bg-surface-2 py-2 text-[13px] text-content-secondary hover:bg-surface-1 transition-colors"
        >
          Show all {entries.length} members
        </button>
      )}
      {showAll && entries.length > INITIAL_SHOW && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-3 w-full rounded-[8px] border border-border-default bg-surface-2 py-2 text-[13px] text-content-secondary hover:bg-surface-1 transition-colors"
        >
          Show fewer
        </button>
      )}
    </>
  )
}

// ── Recent awards feed ─────────────────────────────────────────────────────────

function RecentAwardsFeed({ awards }: { awards: RecentAward[] }) {
  const [showAll, setShowAll] = useState(false)

  if (awards.length === 0) return null

  const FEED_INITIAL = 10
  const visible  = showAll ? awards : awards.slice(0, FEED_INITIAL)
  const overflow = awards.length - FEED_INITIAL

  return (
    <section className="mt-8">
      <SectionLabel>Recent awards</SectionLabel>
      <div className="divide-y divide-border-subtle rounded-[10px] border border-border-default bg-surface-2 overflow-hidden">
        {visible.map((a, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-1 transition-colors">
            <Avatar name={a.memberName} url={a.memberAvatarUrl} size={32} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-content-primary">
                {a.memberName}
              </p>
              <p className="text-[12px] text-content-secondary mt-0.5">
                <span style={{ color: 'var(--spot-gold)' }}>{a.awardName}</span>
                {' · '}{a.competitionTitle}
              </p>
            </div>
            <span className="flex-shrink-0 text-[11px] text-content-tertiary whitespace-nowrap">
              {timeAgo(a.awardedAt)}
            </span>
          </div>
        ))}
      </div>
      {overflow > 0 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 w-full rounded-[8px] border border-border-default bg-surface-2 py-2 text-[13px] text-content-secondary hover:bg-surface-1 transition-colors"
        >
          Show {overflow} more
        </button>
      )}
    </section>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

type Tab = 'poy' | 'benchmark' | 'awards'

export default function StandingsClient({
  currentProfile,
  seasonYear,
  seasonLabel,
  seasonOptions,
  hasCompetitionsThisSeason,
  poyStandings,
  benchmarkConfigured,
  awardsConfigured,
  awardLeaderboard,
  recentAwards,
  initialTab,
}: {
  currentProfile:            CurrentProfile | null
  seasonYear:                number
  seasonLabel:               string
  seasonOptions:             SeasonOption[]
  hasCompetitionsThisSeason: boolean
  poyStandings:              PoyEntry[]
  benchmarkConfigured:       boolean
  awardsConfigured:          boolean
  awardLeaderboard:          AwardLeaderboardEntry[]
  recentAwards:              RecentAward[]
  initialTab:                Tab
}) {
  const [tab, setTab] = useState<Tab>(initialTab)

  const currentUserPoy    = poyStandings.find(e => e.isCurrentUser) ?? null
  const currentUserAwards = awardLeaderboard.find(e => e.isCurrentUser) ?? null

  const TABS: { key: Tab; label: string }[] = [
    { key: 'poy',       label: 'Photographer of the Year' },
    { key: 'benchmark', label: 'Benchmark' },
    { key: 'awards',    label: 'Awards' },
  ]

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Standings</h1>
        <p className="mt-1 text-[13px] text-content-secondary">
          Club-wide recognition and achievement — {seasonLabel} season
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border-subtle">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-px ${
              tab === key
                ? 'border-action-primary text-action-primary'
                : 'border-transparent text-content-secondary hover:text-content-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── POY tab ──────────────────────────────────────────────────── */}
      {tab === 'poy' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <SectionLabel>Photographer of the Year</SectionLabel>
            <SeasonSelector options={seasonOptions} current={seasonYear} tabParam="poy" />
          </div>

          {currentProfile && (
            <MyPoyCard profile={currentProfile} entry={currentUserPoy} />
          )}

          <PoyLeaderboard entries={poyStandings} hasCompetitions={hasCompetitionsThisSeason} />
        </div>
      )}

      {/* ── Benchmark tab ────────────────────────────────────────────── */}
      {tab === 'benchmark' && (
        <div className="space-y-6">
          <SectionLabel>Benchmark</SectionLabel>
          {benchmarkConfigured ? (
            // Future: show distribution bars + expandable bands
            <EmptyCard>Benchmark data coming soon.</EmptyCard>
          ) : (
            <NotConfiguredCard feature="Benchmark" />
          )}
        </div>
      )}

      {/* ── Awards tab ───────────────────────────────────────────────── */}
      {tab === 'awards' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <SectionLabel>Awards</SectionLabel>
            <SeasonSelector options={seasonOptions} current={seasonYear} tabParam="awards" />
          </div>

          {!awardsConfigured ? (
            <NotConfiguredCard feature="Awards" />
          ) : (
            <>
              {currentProfile && (
                <MyAwardsCard profile={currentProfile} entry={currentUserAwards} />
              )}
              <AwardLeaderboard entries={awardLeaderboard} />
              <RecentAwardsFeed awards={recentAwards} />
            </>
          )}
        </div>
      )}

    </div>
  )
}

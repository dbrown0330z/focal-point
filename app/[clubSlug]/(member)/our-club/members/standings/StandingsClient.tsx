'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

// ── Current-user standing line ─────────────────────────────────────────────────

function MyStandingLine({
  entry,
  totalMembers,
  clubSlug,
}: {
  entry:        PoyEntry | null
  totalMembers: number
  clubSlug:     string
}) {
  if (!entry) {
    return (
      <p className="text-[13px] mb-4" style={{ color: 'var(--text-secondary)' }}>
        You haven&apos;t entered a scored competition this season yet.{' '}
        <Link href={`/${clubSlug}/competitions`} className="hover:underline" style={{ color: 'var(--action-primary)' }}>
          Enter a competition
        </Link>{' '}
        to appear in the standings.
      </p>
    )
  }
  return (
    <p className="text-[13px] mb-4" style={{ color: 'var(--text-secondary)' }}>
      You are in{' '}
      <strong style={{ color: 'var(--text-primary)' }}>
        {ordinalSuffix(entry.rank)}{entry.tied ? '=' : ''} place
      </strong>
      {' '}out of{' '}
      <strong style={{ color: 'var(--text-primary)' }}>{totalMembers} member{totalMembers !== 1 ? 's' : ''}</strong>
      {' '}with{' '}
      <strong style={{ color: 'var(--text-primary)' }}>{entry.score.toFixed(1)} pts</strong>
    </p>
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

// Rank column is 44px wide; member column starts immediately after.
// Both are sticky so they stay visible when the score columns scroll.
const RANK_W   = 44   // px
const MEMBER_W = 160  // px

function PoyLeaderboard({
  entries,
  hasCompetitions,
  categoryNames,
  topPerCategory,
}: {
  entries:         PoyEntry[]
  hasCompetitions: boolean
  categoryNames:   string[]
  topPerCategory:  number
}) {
  const [showAll, setShowAll] = useState(false)
  const [view,    setView]    = useState<'compact' | 'detailed'>('compact')

  if (!hasCompetitions) {
    return (
      <EmptyCard>
        No scored competitions this season yet.
        Standings will appear once competition results are published.
      </EmptyCard>
    )
  }

  if (entries.length === 0) {
    return <EmptyCard>No scores recorded yet this season.</EmptyCard>
  }

  const visible  = showAll ? entries : entries.slice(0, INITIAL_SHOW)
  const overflow = entries.length - INITIAL_SHOW
  const slots    = Array.from({ length: topPerCategory }, (_, i) => i)

  const thBase = 'px-2 py-2 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap'
  const tdBase = 'px-2 py-3 text-[13px] tabular-nums'

  // Sticky-column helpers. Cells need an opaque background so scrolling
  // content doesn't show through. For highlighted rows we blend the blue
  // tint into the surface colour.
  function stickyBg(isCurrentUser: boolean) {
    // rgba(26,111,196,0.05) blended over #FFFFFF ≈ rgb(244,248,252)
    return isCurrentUser ? 'rgb(244,248,252)' : 'var(--surface-2)'
  }

  const stickyRankStyle = (isCurrentUser: boolean): React.CSSProperties => ({
    position:   'sticky',
    left:        0,
    zIndex:      1,
    background:  stickyBg(isCurrentUser),
    // hairline shadow to mark the boundary when scrolled
    boxShadow:  'none',
  })
  const stickyMemberStyle = (isCurrentUser: boolean): React.CSSProperties => ({
    position:   'sticky',
    left:        RANK_W,
    zIndex:      1,
    background:  stickyBg(isCurrentUser),
    boxShadow:   '2px 0 4px -2px rgba(0,0,0,0.08)',
    minWidth:    MEMBER_W,
  })

  return (
    <>
      {/* View toggle */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          {view === 'compact' ? 'Category totals' : `Top ${topPerCategory} scores per category`}
        </p>
        <div
          className="flex overflow-hidden rounded-md border text-[12px] font-medium"
          style={{ borderColor: 'var(--border-default)' }}
        >
          {(['compact', 'detailed'] as const).map((v, i) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1.5 transition-colors"
              style={{
                background:  view === v ? 'var(--surface-1)' : 'var(--surface-2)',
                color:       view === v ? 'var(--text-primary)' : 'var(--text-tertiary)',
                borderLeft:  i > 0 ? '1px solid var(--border-default)' : undefined,
              }}
            >
              {v === 'compact' ? 'Summary' : 'Detail'}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[10px] border border-border-default bg-surface-2 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            {view === 'compact' ? (
              // ── Compact: one column per category ──────────────────────────
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th
                  className={`${thBase} text-right`}
                  style={{ ...stickyRankStyle(false), color: 'var(--text-tertiary)', width: RANK_W }}
                >
                  Rank
                </th>
                <th
                  className={`${thBase} text-left pl-3`}
                  style={{ ...stickyMemberStyle(false), color: 'var(--text-tertiary)' }}
                >
                  Member
                </th>
                {categoryNames.map(cat => (
                  <th
                    key={cat}
                    className={`${thBase} text-right`}
                    style={{ color: 'var(--text-secondary)', borderLeft: '1px solid var(--border-subtle)', minWidth: '5rem' }}
                  >
                    {cat}
                  </th>
                ))}
                <th
                  className={`${thBase} text-right pr-3`}
                  style={{ color: 'var(--text-tertiary)', borderLeft: '1px solid var(--border-subtle)' }}
                >
                  Total
                </th>
              </tr>
            ) : (
              // ── Detailed: 4 slots per category, two-row header ────────────
              <>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <th
                    className={`${thBase} text-right`}
                    style={{ ...stickyRankStyle(false), color: 'var(--text-tertiary)', width: RANK_W }}
                    rowSpan={2}
                  >
                    Rank
                  </th>
                  <th
                    className={`${thBase} text-left pl-3`}
                    style={{ ...stickyMemberStyle(false), color: 'var(--text-tertiary)' }}
                    rowSpan={2}
                  >
                    Member
                  </th>
                  {categoryNames.map(cat => (
                    <th
                      key={cat}
                      colSpan={topPerCategory}
                      className={`${thBase} text-center`}
                      style={{ color: 'var(--text-secondary)', borderLeft: '1px solid var(--border-subtle)' }}
                    >
                      {cat}
                    </th>
                  ))}
                  <th
                    className={`${thBase} text-right pr-3`}
                    style={{ color: 'var(--text-tertiary)', borderLeft: '1px solid var(--border-subtle)' }}
                    rowSpan={2}
                  >
                    Total
                  </th>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {categoryNames.flatMap(cat =>
                    slots.map(i => (
                      <th
                        key={`${cat}-${i}`}
                        className="px-2 py-1 text-[10px] text-right w-12 whitespace-nowrap"
                        style={{
                          color:         'var(--text-tertiary)',
                          borderLeft:     i === 0 ? '1px solid var(--border-subtle)' : undefined,
                          fontWeight:     400,
                          letterSpacing:  0,
                          textTransform:  'none',
                        }}
                      >
                        {i + 1}
                      </th>
                    ))
                  )}
                </tr>
              </>
            )}
          </thead>

          <tbody>
            {visible.map((entry, i) => {
              const rowStyle: React.CSSProperties = {
                borderBottom: i < visible.length - 1 ? '1px solid var(--border-subtle)' : undefined,
                background:   entry.isCurrentUser ? 'rgba(26,111,196,0.05)' : undefined,
              }
              return (
                <tr
                  key={entry.memberId}
                  className="transition-colors hover:bg-surface-1"
                  style={rowStyle}
                >
                  {/* Rank — sticky */}
                  <td
                    className={`${tdBase} text-right font-semibold`}
                    style={{ ...stickyRankStyle(entry.isCurrentUser), color: entry.rank <= 3 ? 'var(--text-primary)' : 'var(--text-secondary)', width: RANK_W }}
                  >
                    {entry.rank}{entry.tied ? '=' : ''}
                    {entry.isCurrentUser && (
                      <span className="ml-0.5 text-[10px]" style={{ color: 'var(--action-primary)' }}>★</span>
                    )}
                  </td>

                  {/* Member — sticky */}
                  <td
                    className={`${tdBase} pl-3`}
                    style={stickyMemberStyle(entry.isCurrentUser)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={entry.displayName} url={entry.avatarUrl} size={24} />
                      <span
                        className="truncate text-[13px] font-medium"
                        style={{ color: entry.isCurrentUser ? 'var(--action-primary)' : 'var(--text-primary)' }}
                      >
                        {entry.displayName}
                      </span>
                    </div>
                  </td>

                  {/* Score cells */}
                  {view === 'compact'
                    ? categoryNames.map(cat => {
                        const scores = entry.byCategory[cat] ?? []
                        const total  = scores.reduce((a, b) => a + b, 0)
                        return (
                          <td
                            key={cat}
                            className={`${tdBase} text-right`}
                            style={{
                              color:      scores.length > 0 ? 'var(--text-primary)' : 'var(--text-disabled)',
                              borderLeft: '1px solid var(--border-subtle)',
                            }}
                          >
                            {scores.length > 0 ? total.toFixed(1) : '—'}
                          </td>
                        )
                      })
                    : categoryNames.flatMap(cat => {
                        const scores = entry.byCategory[cat] ?? []
                        return slots.map(i => (
                          <td
                            key={`${cat}-${i}`}
                            className={`${tdBase} text-right w-12`}
                            style={{
                              color:      scores[i] != null ? 'var(--text-primary)' : 'var(--text-disabled)',
                              borderLeft: i === 0 ? '1px solid var(--border-subtle)' : undefined,
                            }}
                          >
                            {scores[i] != null ? scores[i].toFixed(1) : '—'}
                          </td>
                        ))
                      })
                  }

                  {/* Total */}
                  <td
                    className={`${tdBase} text-right pr-3 font-semibold`}
                    style={{ color: 'var(--text-primary)', borderLeft: '1px solid var(--border-subtle)' }}
                  >
                    {entry.score.toFixed(1)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
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
  seasonOptions,
  hasCompetitionsThisSeason,
  poyStandings,
  categoryNames,
  topPerCategory,
  lastUpdatedAt,
  benchmarkConfigured,
  awardsConfigured,
  awardLeaderboard,
  recentAwards,
  initialTab,
  clubSlug,
}: {
  currentProfile:            CurrentProfile | null
  seasonYear:                number
  seasonOptions:             SeasonOption[]
  hasCompetitionsThisSeason: boolean
  poyStandings:              PoyEntry[]
  categoryNames:             string[]
  topPerCategory:            number
  lastUpdatedAt:             string | null
  benchmarkConfigured:       boolean
  awardsConfigured:          boolean
  awardLeaderboard:          AwardLeaderboardEntry[]
  recentAwards:              RecentAward[]
  initialTab:                Tab
  clubSlug:                  string
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

      {/* Page header — title + last updated + season selector */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Standings</h1>
          {lastUpdatedAt && (
            <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              Updated{' '}
              {new Date(lastUpdatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
        <SeasonSelector options={seasonOptions} current={seasonYear} tabParam={tab} />
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
        <div className="space-y-4">
          {currentProfile && (
            <MyStandingLine
              entry={currentUserPoy}
              totalMembers={poyStandings.length}
              clubSlug={clubSlug}
            />
          )}

          <PoyLeaderboard
            entries={poyStandings}
            hasCompetitions={hasCompetitionsThisSeason}
            categoryNames={categoryNames}
            topPerCategory={topPerCategory}
          />
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

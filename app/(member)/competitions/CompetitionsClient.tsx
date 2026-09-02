'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SubmitModal from './SubmitModal'
import { withdrawFromCompetition } from './actions'

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = { id: string; name: string }

type Submission = {
  id: string
  imageId: string
  categoryId: string
  categoryName: string
  imageTitle: string
  publicUrl: string
}

type CategoryStat = { name: string; count: number }

type ClubStats = {
  totalImages: number
  membersEntered: number
  byCat: CategoryStat[]
}

type Competition = {
  id: string
  title: string
  status: string
  closes_at: string | null
  submission_limit: number
  categories: Category[]
  judgeName: string | null
}

type PastCompetition = {
  id: string
  title: string
  status: string
  closes_at: string | null
  imageCount: number
  judgeName: string | null
}

type LibraryImage = {
  id: string
  title: string
  storage_path: string
  created_at: string
  publicUrl: string
}

type Props = {
  userId: string
  competition: Competition | null
  mySubmissions: Submission[]
  clubStats: ClubStats
  libraryImages: LibraryImage[]
  pastCompetitions: PastCompetition[]
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  )
}
function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
      <path d="M12 12v9"/>
      <path d="m16 16-4-4-4 4"/>
    </svg>
  )
}
function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  )
}
function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  )
}
function IconTrophy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  )
}

// ─── Phase logic ──────────────────────────────────────────────────────────────

type Phase = 'open' | 'warning' | 'judging'

function getPhase(closesAt: string | null, status: string): Phase {
  if (status !== 'open') return 'judging'
  if (!closesAt) return 'open'
  const diffMs = new Date(closesAt).getTime() - Date.now()
  const days = diffMs / (1000 * 60 * 60 * 24)
  if (days < 0) return 'judging'
  if (days <= 7) return 'warning'
  return 'open'
}

function phaseTint(phase: Phase, dark = false) {
  if (phase === 'open') return dark ? 'rgba(46,125,50,0.10)' : 'rgba(46,125,50,0.07)'
  if (phase === 'warning') return dark ? 'rgba(166,124,0,0.12)' : 'rgba(166,124,0,0.07)'
  return dark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)'
}
function phaseBorder(phase: Phase) {
  if (phase === 'open') return '#2E7D32'
  if (phase === 'warning') return '#A67C00'
  return 'transparent'
}

function formatDate(iso: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, opts ?? { month: 'long', day: 'numeric', year: 'numeric' })
}

function daysLeft(closesAt: string | null): number | null {
  if (!closesAt) return null
  return Math.ceil((new Date(closesAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

// ─── Status pill ─────────────────────────────────────────────────────────────

function PhasePill({ phase }: { phase: Phase }) {
  const configs = {
    open:    { label: 'Submissions open', bg: 'var(--status-success-bg)',  color: 'var(--status-success-text)' },
    warning: { label: 'Closing soon',     bg: 'var(--status-warning-bg)',  color: 'var(--status-warning-text)' },
    judging: { label: 'Judging in progress', bg: 'var(--status-warning-bg)', color: 'var(--status-warning-text)' },
  }
  const cfg = configs[phase]
  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-[0.03em]"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

// ─── Photo card ───────────────────────────────────────────────────────────────

function PhotoCard({
  submission,
  onWithdraw,
}: {
  submission: Submission
  onWithdraw: (id: string) => void
}) {
  const [withdrawing, setWithdrawing] = useState(false)

  async function handleWithdraw(e: React.MouseEvent) {
    e.stopPropagation()
    if (withdrawing) return
    setWithdrawing(true)
    await onWithdraw(submission.id)
    setWithdrawing(false)
  }

  return (
    <div
      className="group overflow-hidden rounded-[10px]"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className="relative" style={{ paddingTop: '68%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={submission.publicUrl}
          alt={submission.imageTitle}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Category badge */}
        <span
          className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
          style={{ background: 'rgba(0,0,0,0.65)' }}
        >
          {submission.categoryName}
        </span>
        {/* Withdraw on hover */}
        <button
          type="button"
          onClick={handleWithdraw}
          disabled={withdrawing}
          className="absolute inset-0 hidden items-center justify-center text-[12px] font-semibold text-white group-hover:flex"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          {withdrawing ? 'Withdrawing…' : 'Withdraw'}
        </button>
      </div>
      <div className="px-2.5 py-2">
        <p
          className="overflow-hidden text-[12px] font-semibold leading-snug"
          style={{
            color: 'var(--text-primary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '2.4em',
          }}
        >
          {submission.imageTitle}
        </p>
        <span
          className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.03em]"
          style={{ background: 'var(--status-success-bg)', color: 'var(--status-success-text)' }}
        >
          Submitted
        </span>
      </div>
    </div>
  )
}

// ─── Add Entry slot ───────────────────────────────────────────────────────────

function AddEntrySlot({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[155px] w-full flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed opacity-60 transition-opacity hover:opacity-90"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <div style={{ color: 'var(--text-tertiary)' }}><IconPlus /></div>
      <span className="text-[12px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>Add entry</span>
    </button>
  )
}

// ─── Current Competition Block ────────────────────────────────────────────────

function CurrentCompetitionBlock({
  competition,
  submissions,
  clubStats,
  onSubmitClick,
  onWithdraw,
}: {
  competition: Competition
  submissions: Submission[]
  clubStats: ClubStats
  onSubmitClick: () => void
  onWithdraw: (id: string) => void
}) {
  const phase = getPhase(competition.closes_at, competition.status)
  const days = daysLeft(competition.closes_at)
  const atLimit = submissions.length >= competition.submission_limit
  const canSubmit = phase !== 'judging' && !atLimit
  const maxBar = Math.max(...clubStats.byCat.map(c => c.count), 1)

  // Grid columns: submissions + optional add slot
  const total = submissions.length + (canSubmit ? 1 : 0)
  const cols = total <= 3 ? total : total <= 4 ? 2 : 3

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: 14,
        border: '1px solid var(--border-default)',
        background: 'var(--surface-1)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      }}
    >
      {/* Header strip */}
      <div
        className="flex flex-wrap items-start justify-between gap-4"
        style={{
          padding: '24px 28px 20px',
          borderBottom: '1px solid var(--border-default)',
          borderLeft: `3px solid ${phaseBorder(phase)}`,
          background: phaseTint(phase),
          transition: 'background 0.3s, border-color 0.3s',
        }}
      >
        {/* Left */}
        <div className="min-w-0">
          <p
            className="mb-1 text-[11px] font-bold uppercase tracking-[0.07em]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Current Competition
          </p>
          <h2
            className="text-[26px] font-bold tracking-[-0.02em] leading-tight"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
          >
            {competition.title}
          </h2>
          {/* Meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
            {competition.closes_at && (
              <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <IconClock />
                {phase === 'warning' && days !== null ? (
                  <span>
                    {formatDate(competition.closes_at, { month: 'long', day: 'numeric', year: 'numeric' })} ·{' '}
                    <span style={{ color: 'var(--status-warning-text)', fontWeight: 700 }}>{days} day{days !== 1 ? 's' : ''} left</span>
                  </span>
                ) : (
                  <span>
                    Submissions close{' '}
                    <strong>{formatDate(competition.closes_at, { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                  </span>
                )}
              </div>
            )}
            {competition.judgeName && (
              <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <IconUsers />
                Judge <strong>{competition.judgeName}</strong>
              </div>
            )}
          </div>
        </div>
        {/* Right */}
        <div className="flex flex-col items-end gap-2.5">
          <PhasePill phase={phase} />
          {canSubmit && (
            <button
              type="button"
              onClick={onSubmitClick}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors"
              style={{ background: 'var(--action-primary)' }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--action-primary-hover)')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--action-primary)')}
            >
              <IconUpload />
              Submit an image
            </button>
          )}
          {phase === 'judging' && (
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Judging in progress</p>
          )}
        </div>
      </div>

      {/* Two-column lower section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px' }}>
        {/* My Submissions */}
        <div style={{ padding: '22px 28px', borderRight: '1px solid var(--border-default)' }}>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--text-tertiary)' }}>
              My Submissions
            </p>
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {submissions.length} of {competition.submission_limit} max
            </p>
          </div>

          {total === 0 ? (
            <div className="py-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
              No submissions yet
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.max(cols, 1)}, 1fr)`,
                gap: 10,
              }}
            >
              {submissions.map(sub => (
                <PhotoCard key={sub.id} submission={sub} onWithdraw={onWithdraw} />
              ))}
              {canSubmit && <AddEntrySlot onClick={onSubmitClick} />}
            </div>
          )}
        </div>

        {/* Club Stats */}
        <div style={{ padding: '22px 24px' }}>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--text-tertiary)' }}>
            Club Stats
          </p>

          {/* Two big numbers */}
          <div
            className="mb-5 grid grid-cols-2"
            style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 20 }}
          >
            {[
              { value: clubStats.totalImages, label: 'total images' },
              { value: clubStats.membersEntered, label: 'members entered' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{ borderLeft: i > 0 ? '1px solid var(--border-subtle)' : undefined, paddingLeft: i > 0 ? 16 : 0 }}
              >
                <p
                  className="text-[38px] font-bold leading-none"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Bar chart by category */}
          {clubStats.byCat.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--text-tertiary)' }}>
                By category
              </p>
              <div className="space-y-2">
                {clubStats.byCat.map(cat => (
                  <div key={cat.name} className="grid items-center gap-2" style={{ gridTemplateColumns: '72px 1fr 38px' }}>
                    <p
                      className="truncate text-right text-[12px]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {cat.name}
                    </p>
                    <div className="h-3 overflow-hidden rounded-full" style={{ background: 'var(--surface-3, var(--surface-0))' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(cat.count / maxBar) * 100}%`,
                          background: 'var(--action-primary)',
                        }}
                      />
                    </div>
                    <p
                      className="text-center text-[13px] font-bold"
                      style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
                    >
                      {cat.count}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          {competition.closes_at && (
            <p className="mt-5 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              Submission deadline: {formatDate(competition.closes_at, { month: 'long', day: 'numeric', year: 'numeric' })}
              {daysLeft(competition.closes_at) !== null && daysLeft(competition.closes_at)! > 0 && (
                <> · {daysLeft(competition.closes_at)} days remaining</>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Previous Competitions Block ──────────────────────────────────────────────

function PreviousCompetitionsBlock({ competitions }: { competitions: PastCompetition[] }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-[18px] font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
        >
          Previous Competitions
        </h2>
      </div>

      <div
        className="overflow-hidden"
        style={{
          borderRadius: 14,
          border: '1px solid var(--border-default)',
          background: 'var(--surface-1)',
        }}
      >
        {/* Table header */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: '1fr 90px 120px 130px',
            padding: '10px 22px',
            borderBottom: '1px solid var(--border-default)',
            background: 'var(--surface-2)',
          }}
        >
          {['Competition', 'Images', 'Judge', ''].map(h => (
            <p
              key={h}
              className="text-[11px] font-bold uppercase tracking-[0.06em]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {h}
            </p>
          ))}
        </div>

        {competitions.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No past competitions yet.
          </div>
        ) : (
          competitions.map((comp, i) => (
            <div
              key={comp.id}
              className="grid items-center"
              style={{
                gridTemplateColumns: '1fr 90px 120px 130px',
                padding: '13px 22px',
                borderBottom: i < competitions.length - 1 ? '1px solid var(--border-subtle)' : undefined,
              }}
            >
              <div>
                <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>{comp.title}</p>
                {comp.closes_at && (
                  <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                    {formatDate(comp.closes_at, { month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
              <p
                className="text-[15px] font-bold"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
              >
                {comp.imageCount}
              </p>
              <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                {comp.judgeName ?? '—'}
              </p>
              <div>
                {comp.status === 'closed' && (
                  <Link
                    href={`/competitions/results/${comp.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition-colors"
                    style={{
                      borderColor: 'var(--border-default)',
                      color: 'var(--action-primary)',
                      background: 'transparent',
                    }}
                  >
                    Results
                    <IconChevronRight />
                  </Link>
                )}
                {comp.status === 'judging' && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase"
                    style={{ background: 'var(--status-warning-bg)', color: 'var(--status-warning-text)' }}
                  >
                    Judging
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── No Competition state ─────────────────────────────────────────────────────

function NoCompetition() {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center"
      style={{ color: 'var(--text-tertiary)' }}
    >
      <IconTrophy />
      <p className="mt-4 text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
        No competition open right now
      </p>
      <p className="mt-1 text-sm">Check back soon — competitions open monthly.</p>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function CompetitionsClient({
  userId, competition, mySubmissions, clubStats, libraryImages, pastCompetitions,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [submissions, setSubmissions] = useState(mySubmissions)
  const router = useRouter()

  function handleSuccess() {
    router.refresh()
  }

  async function handleWithdraw(submissionId: string) {
    const { error } = await withdrawFromCompetition(submissionId)
    if (!error) {
      setSubmissions(prev => prev.filter(s => s.id !== submissionId))
      router.refresh()
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 36px 48px' }}>
      {/* Page title */}
      <h1
        className="mb-6 text-[28px] font-bold tracking-[-0.02em]"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
      >
        Competitions
      </h1>

      <div className="space-y-8">
        {/* Current competition or empty state */}
        {competition ? (
          <CurrentCompetitionBlock
            competition={competition}
            submissions={submissions}
            clubStats={clubStats}
            onSubmitClick={() => setModalOpen(true)}
            onWithdraw={handleWithdraw}
          />
        ) : (
          <NoCompetition />
        )}

        {/* Past competitions */}
        {pastCompetitions.length > 0 && (
          <PreviousCompetitionsBlock competitions={pastCompetitions} />
        )}
      </div>

      {/* Submit modal */}
      {competition && (
        <SubmitModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={handleSuccess}
          userId={userId}
          competitionId={competition.id}
          competitionTitle={competition.title}
          categories={competition.categories}
          libraryImages={libraryImages}
        />
      )}
    </div>
  )
}

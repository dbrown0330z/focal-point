'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { publishCompetition, transitionStatus } from '../actions'
import { SPOT_COLORS } from './EntriesSection'

type CategorySlice = {
  id:    string
  name:  string
  count: number
}

type Props = {
  id:                 string
  status:             string
  opensAt:            string | null
  closesAt:           string | null
  judgingOpensAt:     string | null
  judgingClosesAt:    string | null
  cancelledAt:        string | null
  cancellationReason: string | null
  submissionCount:    number
  submitterCount:     number
  judgeName:          string | null
  categories:         CategorySlice[]
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function daysUntil(iso: string): number {
  const target = new Date(iso)
  target.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / 86_400_000)
}

function DonutChart({ categories, total, colors }: {
  categories: CategorySlice[]
  total:      number
  colors:     string[]
}) {
  const r  = 36
  const cx = 50
  const cy = 50
  const C  = 2 * Math.PI * r

  const segments: { dash: string; offset: number; color: string }[] = []
  let cumulative = 0

  categories.forEach((cat, i) => {
    if (cat.count === 0 || total === 0) return
    const arc = (cat.count / total) * C
    segments.push({ dash: `${arc} ${C - arc}`, offset: -cumulative, color: colors[i % colors.length] })
    cumulative += arc
  })

  return (
    <svg viewBox="0 0 100 100" width={160} height={160} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth={13} />
      {segments.map((s, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={13}
          strokeDasharray={s.dash}
          strokeDashoffset={s.offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
        />
      ))}
      <text x={cx} y={cy + 7} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--text-primary)">{total}</text>
    </svg>
  )
}

function EntriesBlock({
  id,
  submissionCount,
  submitterCount,
  categories,
}: {
  id:              string
  submissionCount: number
  submitterCount:  number
  categories:      CategorySlice[]
}) {
  if (categories.length === 0 && submissionCount === 0) return null
  const statCls  = "text-[3rem] font-bold leading-none text-content-primary"
  const labelCls = "text-[10px] font-medium uppercase tracking-widest text-content-tertiary mt-1.5"
  return (
    <div className="flex items-center py-4">

      {/* Submitters */}
      <div className="shrink-0 text-center min-w-[72px]">
        <p className={statCls}>{submitterCount}</p>
        <p className={labelCls}>submitters</p>
      </div>

      {/* Divider: submitters → entries */}
      <div className="w-px self-stretch bg-border-default mx-14" />

      {/* Entries count */}
      <div className="shrink-0 text-center min-w-[52px]">
        <p className={statCls}>{submissionCount}</p>
        <p className={labelCls}>entries</p>
      </div>

      {/* Divider: entries → donut */}
      <div className="w-px self-stretch bg-border-default mx-14" />

      {/* Donut + legend */}
      <div className="flex items-center gap-8 flex-1 min-w-0">
        <DonutChart categories={categories} total={submissionCount} colors={SPOT_COLORS} />

        {categories.length > 0 && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {categories.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2">
                <span
                  className="shrink-0 w-2.5 h-2.5 rounded-full"
                  style={{ background: c.count > 0 ? SPOT_COLORS[i % SPOT_COLORS.length] : 'var(--border-default)' }}
                />
                <span className="text-xs text-content-secondary">{c.name}</span>
                <span className="text-xs font-semibold text-content-primary ml-0.5">{c.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View all link */}
      <Link
        href={`/admin/competitions/${id}/entries`}
        className="shrink-0 self-center text-sm text-action-primary hover:underline pl-8"
      >
        View all entries →
      </Link>
    </div>
  )
}

export function StatusBanner({
  id, status, opensAt, closesAt, judgingOpensAt, judgingClosesAt,
  cancelledAt, cancellationReason, submissionCount, submitterCount, judgeName, categories,
}: Props) {
  const [isPending, startTransition] = useTransition()

  const btnPrimary = "inline-flex items-center rounded-lg bg-action-primary px-4 py-2 text-sm font-medium text-white hover:bg-action-primary-hover transition-colors disabled:opacity-60"

  if (status === 'draft') {
    return (
      <div className="rounded-xl border border-border-default bg-surface-1 px-5 py-4 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-content-primary">This competition is a draft and not yet visible to members.</p>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => publishCompetition(id))}
          className={btnPrimary}
        >
          {isPending ? 'Publishing…' : 'Publish competition →'}
        </button>
      </div>
    )
  }

  if (status === 'open') {
    const now = new Date()
    const subOpen      = opensAt ? new Date(opensAt) : null
    const isBeforeOpen = subOpen && now < subOpen

    if (isBeforeOpen) {
      const days = daysUntil(opensAt!)
      return (
        <div className="rounded-xl border border-border-default bg-surface-1 px-5 py-4">
          <p className="text-sm text-content-primary">
            Submissions open in <strong>{days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'}`}</strong>
            {opensAt && ` · ${fmtDate(opensAt)}`}
          </p>
        </div>
      )
    }

    const submissionsClosed = closesAt ? new Date(closesAt) < new Date() : false

    if (submissionsClosed) {
      return (
        <div className="rounded-xl border border-border-default bg-surface-1 px-8">
          <EntriesBlock id={id} submissionCount={submissionCount} submitterCount={submitterCount} categories={categories} />
        </div>
      )
    }

    // Active submissions — just show the entries block, no redundant status text
    return (
      <div className="rounded-xl border border-border-default bg-surface-1 px-8">
        <EntriesBlock id={id} submissionCount={submissionCount} submitterCount={submitterCount} categories={categories} />
      </div>
    )
  }

  if (status === 'judging') {
    return (
      <div className="rounded-xl border border-border-default bg-surface-1 px-8">
        <EntriesBlock id={id} submissionCount={submissionCount} submitterCount={submitterCount} categories={categories} />
      </div>
    )
  }

  if (status === 'judging_on_hold') {
    return (
      <div className="rounded-xl border border-status-warning bg-status-warning-bg px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-status-warning-text">⚠ Judging is on hold — no judge assigned</p>
            {judgingOpensAt && (
              <p className="text-sm text-status-warning-text mt-0.5 opacity-80">
                The judging window opened {fmtDate(judgingOpensAt)}. Members are waiting for results.
              </p>
            )}
          </div>
          <Link
            href="#judge"
            className="shrink-0 inline-flex items-center rounded-lg border border-status-warning px-4 py-2 text-sm font-medium text-status-warning-text hover:bg-status-warning-bg/50 transition-colors"
          >
            + Assign judge now
          </Link>
        </div>
        <div className="mt-4 pt-4 border-t border-status-warning/40">
          <EntriesBlock id={id} submissionCount={submissionCount} submitterCount={submitterCount} categories={categories} />
        </div>
      </div>
    )
  }

  if (status === 'results_pending') {
    return (
      <div className="rounded-xl border border-border-default bg-surface-1 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-content-primary">Judging complete · Ready to publish</p>
            <p className="text-sm text-content-secondary mt-0.5">Results will be visible to members as soon as you publish.</p>
          </div>
          <button
            disabled={isPending}
            onClick={() => startTransition(() => transitionStatus(id, 'results_published'))}
            className={`${btnPrimary} shrink-0`}
          >
            {isPending ? 'Publishing…' : 'Publish results →'}
          </button>
        </div>
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <EntriesBlock id={id} submissionCount={submissionCount} submitterCount={submitterCount} categories={categories} />
        </div>
      </div>
    )
  }

  if (status === 'results_published' || status === 'closed') {
    return (
      <div className="rounded-xl border border-border-default bg-surface-1 px-5 py-4">
        <p className="text-sm text-content-primary">Results published · Competition closed</p>
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <EntriesBlock id={id} submissionCount={submissionCount} submitterCount={submitterCount} categories={categories} />
        </div>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="rounded-xl border border-border-default bg-surface-1 px-5 py-4">
        <p className="text-sm font-medium text-content-primary">
          Competition cancelled{cancelledAt ? ` · ${fmtDate(cancelledAt)}` : ''}
        </p>
        {cancellationReason && (
          <p className="text-sm text-content-secondary mt-0.5">Reason: {cancellationReason}</p>
        )}
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <EntriesBlock id={id} submissionCount={submissionCount} submitterCount={submitterCount} categories={categories} />
        </div>
      </div>
    )
  }

  return null
}

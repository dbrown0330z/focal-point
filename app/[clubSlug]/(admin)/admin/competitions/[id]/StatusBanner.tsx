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
  const statCls = "text-[3rem] font-bold leading-none text-content-primary"
  const labelCls = "text-[10px] font-medium uppercase tracking-widest text-content-tertiary mt-1.5"
  return (
    <div className="flex items-center gap-0">

      {/* Submitters */}
      <div className="shrink-0 text-center min-w-[64px]">
        <p className={statCls}>{submitterCount}</p>
        <p className={labelCls}>submitters</p>
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-border-default mx-5" />

      {/* Entries number */}
      <div className="shrink-0 text-center min-w-[52px]">
        <p className={statCls}>{submissionCount}</p>
        <p className={labelCls}>entries</p>
      </div>

      {/* Stacked bar + legend */}
      <div className="flex-1 min-w-0 self-center space-y-2 mx-4 pr-4">
        {submissionCount > 0 ? (
          <div className="h-3 rounded-full overflow-hidden flex">
            {categories.map((c, i) => {
              if (c.count === 0) return null
              return (
                <div
                  key={c.id}
                  className="h-full"
                  style={{ flex: c.count, backgroundColor: SPOT_COLORS[i % SPOT_COLORS.length] }}
                />
              )
            })}
          </div>
        ) : (
          <div className="h-3 rounded-full bg-border-subtle" />
        )}

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {categories.map((c, i) => (
              <div key={c.id} className="flex items-center gap-1.5">
                <span
                  className={`shrink-0 h-2 w-2 rounded-sm ${c.count === 0 ? 'border border-border-strong' : ''}`}
                  style={{ backgroundColor: c.count > 0 ? SPOT_COLORS[i % SPOT_COLORS.length] : 'transparent' }}
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
        className="shrink-0 self-start text-sm text-action-primary hover:underline"
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
        <div className="rounded-xl border border-border-default bg-surface-1 px-5 py-4">
          <EntriesBlock id={id} submissionCount={submissionCount} submitterCount={submitterCount} categories={categories} />
        </div>
      )
    }

    // Active submissions — just show the entries block, no redundant status text
    return (
      <div className="rounded-xl border border-border-default bg-surface-1 px-5 py-4">
        <EntriesBlock id={id} submissionCount={submissionCount} submitterCount={submitterCount} categories={categories} />
      </div>
    )
  }

  if (status === 'judging') {
    return (
      <div className="rounded-xl border border-border-default bg-surface-1 px-5 py-4">
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

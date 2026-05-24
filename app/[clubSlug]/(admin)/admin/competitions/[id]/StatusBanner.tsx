'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { publishCompetition, transitionStatus } from '../actions'

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
  judgeName:          string | null
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function daysUntil(iso: string): number {
  const target = new Date(iso)
  target.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / 86_400_000)
}

export function StatusBanner({
  id, status, opensAt, closesAt, judgingOpensAt, judgingClosesAt,
  cancelledAt, cancellationReason, submissionCount, judgeName,
}: Props) {
  const [isPending, startTransition] = useTransition()

  const btnPrimary = "inline-flex items-center rounded-lg bg-action-primary px-4 py-2 text-sm font-medium text-white hover:bg-action-primary-hover transition-colors disabled:opacity-60"

  if (status === 'draft') {
    return (
      <div className="rounded-xl border border-border-default bg-surface-1 px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-content-primary">This competition is a draft and not yet visible to members.</p>
        </div>
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
    const subOpen  = opensAt  ? new Date(opensAt)  : null
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

    return (
      <div className="rounded-xl border border-border-default bg-surface-1 px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-content-primary">
            Submissions open · {submissionCount} {submissionCount === 1 ? 'entry' : 'entries'} received
          </p>
          {closesAt && (
            <p className="text-sm text-content-secondary mt-0.5">Closes {fmtDate(closesAt)}</p>
          )}
        </div>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => transitionStatus(id, 'judging'))}
          className={`shrink-0 ${btnPrimary}`}
        >
          {isPending ? 'Updating…' : 'Close submissions & begin judging →'}
        </button>
      </div>
    )
  }

  if (status === 'judging') {
    return (
      <div className="rounded-xl border border-border-default bg-surface-1 px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-content-primary">
            Judging in progress{judgeName ? ` · ${judgeName}` : ''}
          </p>
          {judgingClosesAt && (
            <p className="text-sm text-content-secondary mt-0.5">
              Window closes {fmtDate(judgingClosesAt)}
            </p>
          )}
        </div>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => transitionStatus(id, 'results_pending'))}
          className="shrink-0 inline-flex items-center rounded-lg border border-border-default bg-surface-2 px-4 py-2 text-sm font-medium text-content-secondary hover:bg-surface-1 transition-colors disabled:opacity-60"
        >
          {isPending ? 'Updating…' : 'Mark judging complete'}
        </button>
      </div>
    )
  }

  if (status === 'judging_on_hold') {
    return (
      <div className="rounded-xl border border-[#F0D060] bg-[#FFFBE6] px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#6B5000]">⚠ Judging is on hold — no judge assigned</p>
          {judgingOpensAt && (
            <p className="text-sm text-[#6B5000] mt-0.5">The judging window opened {fmtDate(judgingOpensAt)}. Members are waiting for results.</p>
          )}
        </div>
        <Link
          href={`#judge`}
          className="shrink-0 inline-flex items-center rounded-lg border border-[#A67C00] px-4 py-2 text-sm font-medium text-[#6B5000] hover:bg-[rgba(166,124,0,0.08)] transition-colors"
        >
          + Assign judge now
        </Link>
      </div>
    )
  }

  if (status === 'results_pending') {
    return (
      <div className="rounded-xl border border-border-default bg-surface-1 px-5 py-4 flex items-center justify-between gap-4">
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
    )
  }

  if (status === 'results_published' || status === 'closed') {
    return (
      <div className="rounded-xl border border-border-default bg-surface-1 px-5 py-4">
        <p className="text-sm text-content-primary">Results published · Competition closed</p>
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
      </div>
    )
  }

  return null
}

'use client'

import { transitionStatus } from '@/app/(admin)/admin/competitions/actions'
import type { Database } from '@/types/database'

type Status = Database['public']['Enums']['competition_status']

const transitions: Record<Status, { next: Status; label: string; style: string } | null> = {
  draft:   { next: 'open',    label: 'Open for submissions',         style: 'bg-status-success text-white hover:opacity-90' },
  open:    { next: 'judging', label: 'Close submissions → Judging',  style: 'bg-status-warning text-white hover:opacity-90' },
  judging: { next: 'closed',  label: 'Finalise & close competition', style: 'bg-action-primary text-white hover:bg-action-primary-hover' },
  closed:  null,
}

export default function StatusTransition({
  competitionId,
  currentStatus,
}: {
  competitionId: string
  currentStatus: Status
}) {
  const transition = transitions[currentStatus]
  if (!transition) return <p className="text-sm text-content-tertiary">Competition is closed.</p>

  return (
    <form action={transitionStatus.bind(null, competitionId, transition.next)}>
      <button
        type="submit"
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${transition.style}`}
      >
        {transition.label}
      </button>
    </form>
  )
}

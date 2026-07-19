'use client'

import { useState, useTransition } from 'react'
import { updateScheduleField } from '../actions'

type DateField = 'opens_at' | 'closes_at' | 'judging_opens_at' | 'judging_closes_at' | 'results_at'
type TextField = 'results_event_type'
type Field = DateField | TextField

type Props = {
  id:               string
  status:           string
  opensAt:          string | null
  closesAt:         string | null
  judgingOpensAt:   string | null
  judgingClosesAt:  string | null
  resultsAt:        string | null
  resultsEventType: string | null
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function toDateInput(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

export function ScheduleSection({
  id, status, opensAt, closesAt, judgingOpensAt, judgingClosesAt, resultsAt, resultsEventType,
}: Props) {
  const [editing,    setEditing]    = useState<Field | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [error,      setError]      = useState('')
  const [isPending,  startTransition] = useTransition()

  const now = new Date()
  const submissionsHaveOpened  = opensAt         ? new Date(opensAt)         <= now : false
  const submissionsHaveClosed  = closesAt        ? new Date(closesAt)        <= now : false
  const judgingWindowHasOpened = judgingOpensAt  ? new Date(judgingOpensAt)  <= now : false
  const judgingWindowHasClosed = judgingClosesAt ? new Date(judgingClosesAt) <= now : false
  const isTerminal = ['closed', 'cancelled', 'results_published'].includes(status)

  function startEdit(field: Field, currentValue: string | null) {
    if (isTerminal) return
    setEditing(field)
    setDraftValue(field !== 'results_event_type' ? toDateInput(currentValue) : (currentValue ?? ''))
    setError('')
  }

  function cancelEdit() { setEditing(null); setDraftValue(''); setError('') }

  function saveEdit(field: Field) {
    setError('')
    const value: string | null = field === 'results_event_type'
      ? (draftValue.trim() || null)
      : (draftValue ? `${draftValue}T00:00:00` : null)

    if (field === 'closes_at' && opensAt && draftValue && draftValue < toDateInput(opensAt)) {
      setError('Close date cannot be before the open date'); return
    }
    if (field === 'judging_closes_at' && judgingOpensAt && draftValue && draftValue < toDateInput(judgingOpensAt)) {
      setError('Judging close date cannot be before the open date'); return
    }

    startTransition(async () => {
      await updateScheduleField(id, field, value)
      setEditing(null)
    })
  }

  const inputCls = "w-full rounded-lg border border-border-default bg-surface-0 px-2.5 py-1.5 text-sm text-content-primary focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
  const saveBtnCls = "rounded-md bg-action-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-action-primary-hover disabled:opacity-60 transition-colors"
  const cancelBtnCls = "rounded-md border border-border-default px-2.5 py-1 text-xs font-medium text-content-primary hover:bg-surface-1 transition-colors"
  const editBtnCls = "text-xs text-action-primary hover:underline disabled:opacity-40 disabled:cursor-default disabled:no-underline"

  // ── Single date card ────────────────────────────────────────────────────────

  function DateCard({
    label, field, value, locked, lockedReason,
  }: {
    label:         string
    field:         DateField
    value:         string | null
    locked?:       boolean
    lockedReason?: string
  }) {
    const isEditing = editing === field
    return (
      <div className="flex-1 min-w-0 rounded-xl border border-border-default bg-surface-2 px-4 py-3 flex flex-col gap-2">
        {/* Label row */}
        <div className="flex items-center justify-between gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-content-tertiary leading-none">{label}</p>
          {locked && !isTerminal && (
            <span className="text-[10px] text-content-disabled leading-none">past</span>
          )}
        </div>

        {/* Value / edit form */}
        {isEditing ? (
          <div className="space-y-2 mt-1">
            <input
              type="date"
              value={draftValue}
              onChange={e => setDraftValue(e.target.value)}
              className={inputCls}
            />
            {error && <p className="text-[11px] text-status-error-text">⚠ {error}</p>}
            <div className="flex gap-1.5">
              <button onClick={() => saveEdit(field)} disabled={isPending} className={saveBtnCls}>
                {isPending ? '…' : 'Save'}
              </button>
              <button onClick={cancelEdit} className={cancelBtnCls}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-2 mt-auto">
            <p className="text-sm font-medium text-content-primary leading-snug">
              {value
                ? fmtDate(value)
                : <span className="font-normal text-[11px] italic text-content-tertiary">Not set</span>
              }
            </p>
            {!isTerminal && (
              locked
                ? <span className={`${editBtnCls} text-content-disabled cursor-default`} title={lockedReason}>Locked</span>
                : <button onClick={() => startEdit(field, value)} disabled={editing !== null} className={editBtnCls}>Edit</button>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Separator between groups ────────────────────────────────────────────────

  function Sep() {
    return (
      <div className="flex items-stretch py-1 px-0.5">
        <div className="w-px bg-border-default rounded-full" />
      </div>
    )
  }

  // ── Results card (date + type combined) ─────────────────────────────────────

  const isEditingDate = editing === 'results_at'
  const isEditingType = editing === 'results_event_type'

  return (
    <section id="schedule">
      <h2 className="mt-[15px] mb-3 text-sm font-medium uppercase tracking-wider text-content-tertiary">Schedule</h2>

      <div className="flex items-stretch gap-2">

        {/* ── Group 1: Submissions ─────────────────────────────────────────── */}
        <DateCard
          label="Submissions Open"
          field="opens_at"
          value={opensAt}
          locked={submissionsHaveOpened}
          lockedReason="The submission window has already opened and cannot be moved."
        />
        <DateCard
          label="Submissions Close"
          field="closes_at"
          value={closesAt}
          locked={submissionsHaveClosed}
          lockedReason="The submission window has already closed."
        />

        <Sep />

        {/* ── Group 2: Judging ─────────────────────────────────────────────── */}
        <DateCard
          label="Judging Opens"
          field="judging_opens_at"
          value={judgingOpensAt}
          locked={judgingWindowHasOpened}
          lockedReason="The judging window has already opened and cannot be moved."
        />
        <DateCard
          label="Judging Closes"
          field="judging_closes_at"
          value={judgingClosesAt}
          locked={judgingWindowHasClosed}
          lockedReason="The judging window has already closed."
        />

        <Sep />

        {/* ── Group 3: Results ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 rounded-xl border border-border-default bg-surface-2 px-4 py-3 flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-content-tertiary leading-none">Results</p>

          {/* Date sub-field */}
          <div>
            <p className="text-[10px] text-content-tertiary mb-1.5">Date</p>
            {isEditingDate ? (
              <div className="space-y-2">
                <input type="date" value={draftValue} onChange={e => setDraftValue(e.target.value)} className={inputCls} />
                <div className="flex gap-1.5">
                  <button onClick={() => saveEdit('results_at')} disabled={isPending} className={saveBtnCls}>{isPending ? '…' : 'Save'}</button>
                  <button onClick={cancelEdit} className={cancelBtnCls}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-content-primary">
                  {resultsAt
                    ? fmtDate(resultsAt)
                    : <span className="font-normal text-[11px] italic text-content-tertiary">Not set</span>
                  }
                </p>
                {!isTerminal && (
                  <button onClick={() => startEdit('results_at', resultsAt)} disabled={editing !== null} className={editBtnCls}>Edit</button>
                )}
              </div>
            )}
          </div>

          {/* Type sub-field */}
          <div className="border-t border-border-subtle pt-2.5">
            <p className="text-[10px] text-content-tertiary mb-1.5">Type</p>
            {isEditingType ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={draftValue}
                  onChange={e => setDraftValue(e.target.value)}
                  placeholder="e.g. Club night, Online presentation"
                  className={inputCls}
                />
                <div className="flex gap-1.5">
                  <button onClick={() => saveEdit('results_event_type')} disabled={isPending} className={saveBtnCls}>{isPending ? '…' : 'Save'}</button>
                  <button onClick={cancelEdit} className={cancelBtnCls}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-content-primary">
                  {resultsEventType
                    ? resultsEventType
                    : <span className="text-[11px] italic text-content-tertiary">Not set</span>
                  }
                </p>
                {!isTerminal && (
                  <button onClick={() => startEdit('results_event_type', resultsEventType)} disabled={editing !== null} className={editBtnCls}>Edit</button>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  )
}

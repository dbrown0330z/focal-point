'use client'

import { useState, useTransition } from 'react'
import { updateScheduleField, transitionStatus } from '../actions'

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
  const [savePending,   startSave]   = useTransition()
  const [actionPending, startAction] = useTransition()

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

    startSave(async () => {
      await updateScheduleField(id, field, value)
      setEditing(null)
    })
  }

  const inputCls     = "w-full rounded-lg border border-border-default bg-surface-0 px-2.5 py-1.5 text-sm text-content-primary focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
  const saveBtnCls   = "rounded-md bg-action-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-action-primary-hover disabled:opacity-60 transition-colors"
  const cancelBtnCls = "rounded-md border border-border-default px-2.5 py-1 text-xs font-medium text-content-primary hover:bg-surface-1 transition-colors"
  const editBtnCls   = "text-xs text-action-primary hover:underline disabled:opacity-40 disabled:cursor-default disabled:no-underline"

  // ── Single date row within a combined card ──────────────────────────────────

  function DateRow({
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
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-content-tertiary">{label}</p>
          {locked && !isTerminal && (
            <span className="text-[10px] text-content-disabled">· past</span>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <input
              type="date"
              value={draftValue}
              onChange={e => setDraftValue(e.target.value)}
              className={inputCls}
            />
            {error && <p className="text-[11px] text-status-error-text">⚠ {error}</p>}
            <div className="flex gap-1.5">
              <button onClick={() => saveEdit(field)} disabled={savePending} className={saveBtnCls}>
                {savePending ? '…' : 'Save'}
              </button>
              <button onClick={cancelEdit} className={cancelBtnCls}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-2">
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

  const isEditingDate = editing === 'results_at'
  const isEditingType = editing === 'results_event_type'

  const showSubmissionsAction = status === 'open'
  const showJudgingAction     = status === 'judging'

  return (
    <section id="schedule">
      <h2 className="mt-[15px] mb-3 text-sm font-medium uppercase tracking-wider text-content-tertiary">Schedule</h2>

      <div className="flex items-stretch gap-2">

        {/* ── Submission Dates ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 rounded-xl border border-border-default bg-surface-2 px-4 py-3 flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-content-tertiary leading-none">Submission Dates</p>

          <DateRow
            label="Opens"
            field="opens_at"
            value={opensAt}
            locked={submissionsHaveOpened}
            lockedReason="The submission window has already opened."
          />
          <div className="border-t border-border-subtle pt-2">
            <DateRow
              label="Closes"
              field="closes_at"
              value={closesAt}
              locked={submissionsHaveClosed}
              lockedReason="The submission window has already closed."
            />
          </div>

          {showSubmissionsAction && (
            <div className="mt-auto pt-2 border-t border-border-subtle">
              <button
                disabled={actionPending}
                onClick={() => startAction(() => transitionStatus(id, 'judging'))}
                className="inline-flex items-center rounded-lg bg-action-primary px-4 py-2 text-sm font-medium text-white hover:bg-action-primary-hover transition-colors disabled:opacity-60"
              >
                {actionPending ? 'Updating…' : submissionsHaveClosed ? 'Begin judging →' : 'Close submissions & begin judging →'}
              </button>
            </div>
          )}
        </div>

        <Sep />

        {/* ── Judging Dates ────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 rounded-xl border border-border-default bg-surface-2 px-4 py-3 flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-content-tertiary leading-none">Judging Dates</p>

          <DateRow
            label="Opens"
            field="judging_opens_at"
            value={judgingOpensAt}
            locked={judgingWindowHasOpened}
            lockedReason="The judging window has already opened."
          />
          <div className="border-t border-border-subtle pt-2">
            <DateRow
              label="Closes"
              field="judging_closes_at"
              value={judgingClosesAt}
              locked={judgingWindowHasClosed}
              lockedReason="The judging window has already closed."
            />
          </div>

          {showJudgingAction && (
            <div className="mt-auto pt-2 border-t border-border-subtle">
              <button
                disabled={actionPending}
                onClick={() => startAction(() => transitionStatus(id, 'results_pending'))}
                className="inline-flex items-center rounded-lg border border-border-default bg-surface-1 px-4 py-2 text-sm font-medium text-content-secondary hover:bg-surface-0 transition-colors disabled:opacity-60"
              >
                {actionPending ? 'Updating…' : 'Mark judging complete'}
              </button>
            </div>
          )}
        </div>

        <Sep />

        {/* ── Results ──────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 rounded-xl border border-border-default bg-surface-2 px-4 py-3 flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-content-tertiary leading-none">Results</p>

          <div>
            <p className="text-[10px] text-content-tertiary mb-1.5">Date</p>
            {isEditingDate ? (
              <div className="space-y-2">
                <input type="date" value={draftValue} onChange={e => setDraftValue(e.target.value)} className={inputCls} />
                <div className="flex gap-1.5">
                  <button onClick={() => saveEdit('results_at')} disabled={savePending} className={saveBtnCls}>{savePending ? '…' : 'Save'}</button>
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

          <div className="border-t border-border-subtle pt-2">
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
                  <button onClick={() => saveEdit('results_event_type')} disabled={savePending} className={saveBtnCls}>{savePending ? '…' : 'Save'}</button>
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

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
  const [editing,     setEditing]     = useState<Field | null>(null)
  const [draftValue,  setDraftValue]  = useState('')
  const [error,       setError]       = useState('')
  const [isPending,   startTransition] = useTransition()

  const now = new Date()
  const submissionsHaveOpened  = opensAt         ? new Date(opensAt)         <= now : false
  const submissionsHaveClosed  = closesAt        ? new Date(closesAt)        <= now : false
  const judgingWindowHasOpened = judgingOpensAt  ? new Date(judgingOpensAt)  <= now : false
  const judgingWindowHasClosed = judgingClosesAt ? new Date(judgingClosesAt) <= now : false

  const isTerminal = ['closed', 'cancelled', 'results_published'].includes(status)

  function startEdit(field: Field, currentValue: string | null) {
    if (isTerminal) return
    setEditing(field)
    const isDate = field !== 'results_event_type'
    setDraftValue(isDate ? toDateInput(currentValue) : (currentValue ?? ''))
    setError('')
  }

  function cancelEdit() {
    setEditing(null)
    setDraftValue('')
    setError('')
  }

  function saveEdit(field: Field) {
    setError('')

    let value: string | null
    if (field === 'results_event_type') {
      value = draftValue.trim() || null
    } else {
      value = draftValue ? `${draftValue}T00:00:00` : null
    }

    // Date validation
    if (field === 'closes_at' && opensAt && draftValue) {
      if (draftValue < toDateInput(opensAt)) {
        setError('Close date cannot be before the open date')
        return
      }
    }
    if (field === 'judging_closes_at' && judgingOpensAt && draftValue) {
      if (draftValue < toDateInput(judgingOpensAt)) {
        setError('Judging close date cannot be before the open date')
        return
      }
    }

    startTransition(async () => {
      await updateScheduleField(id, field, value)
      setEditing(null)
    })
  }

  const inputCls = "rounded-lg border border-border-default bg-surface-2 px-3 py-1.5 text-sm text-content-primary focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
  const editLinkCls = "text-xs text-action-primary hover:underline cursor-pointer"
  const lockedLinkCls = "text-xs text-content-disabled cursor-default"

  function FieldRow({
    label,
    field,
    value,
    locked,
    lockedReason,
    inputType = 'date',
    placeholder,
  }: {
    label:        string
    field:        Field
    value:        string | null
    locked?:      boolean
    lockedReason?: string
    inputType?:   'date' | 'text'
    placeholder?: string
  }) {
    const isEditing = editing === field

    return (
      <div className="flex items-start justify-between py-3 gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-content-tertiary uppercase tracking-wide mb-1">{label}</p>
          {isEditing ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  type={inputType}
                  value={draftValue}
                  onChange={e => setDraftValue(e.target.value)}
                  placeholder={placeholder}
                  className={`${inputCls} ${inputType === 'text' ? 'w-56' : ''}`}
                />
                <button
                  onClick={() => saveEdit(field)}
                  disabled={isPending}
                  className="rounded-lg bg-action-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-action-primary-hover transition-colors disabled:opacity-60"
                >
                  {isPending ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="rounded-lg border border-border-default px-3 py-1.5 text-xs font-medium text-content-primary hover:bg-surface-1 transition-colors"
                >
                  Cancel
                </button>
              </div>
              {error && <p className="text-xs text-status-error-text">⚠ {error}</p>}
            </div>
          ) : (
            <p className="text-sm text-content-primary">
              {inputType === 'date'
                ? (value ? fmtDate(value) : <span className="text-content-tertiary">Not set</span>)
                : (value ? value : <span className="text-content-tertiary">Not set</span>)
              }
              {locked && (
                <span className="ml-2 text-xs text-content-disabled">(locked)</span>
              )}
            </p>
          )}
        </div>
        {!isEditing && !isTerminal && (
          locked ? (
            <span className={lockedLinkCls} title={lockedReason}>Edit</span>
          ) : (
            <button
              onClick={() => startEdit(field, value)}
              disabled={editing !== null}
              className={`${editLinkCls} disabled:opacity-40 disabled:cursor-default disabled:no-underline`}
            >
              Edit
            </button>
          )
        )}
      </div>
    )
  }

  return (
    <section id="schedule">
      <h2 className="mt-[15px] mb-3 text-sm font-medium uppercase tracking-wider text-content-tertiary">Schedule</h2>
      <div className="rounded-xl border border-border-default bg-surface-2 divide-y divide-border-subtle px-5">
        <FieldRow
          label="Submissions open"
          field="opens_at"
          value={opensAt}
          locked={submissionsHaveOpened}
          lockedReason="The submission window has already opened and cannot be moved."
        />
        <FieldRow
          label="Submissions close"
          field="closes_at"
          value={closesAt}
          locked={submissionsHaveClosed}
          lockedReason="The submission window has already closed."
        />
        <FieldRow
          label="Judging opens"
          field="judging_opens_at"
          value={judgingOpensAt}
          locked={judgingWindowHasOpened}
          lockedReason="The judging window has already opened and cannot be moved."
        />
        <FieldRow
          label="Judging closes"
          field="judging_closes_at"
          value={judgingClosesAt}
          locked={judgingWindowHasClosed}
          lockedReason="The judging window has already closed."
        />
        <FieldRow
          label="Results event"
          field="results_at"
          value={resultsAt}
        />
        <FieldRow
          label="Results event type"
          field="results_event_type"
          value={resultsEventType}
          inputType="text"
          placeholder="e.g. Club night, Online presentation"
        />
      </div>
    </section>
  )
}

'use client'

import { useState, useTransition } from 'react'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select        from '@mui/material/Select'
import MenuItem      from '@mui/material/MenuItem'
import { updateScheduleField, transitionStatus, updateResultsEvent } from '../actions'

type DateField = 'opens_at' | 'closes_at' | 'judging_opens_at' | 'judging_closes_at'
type Field = DateField

type ResultsData = {
  resultsAt:           string | null
  resultsEventType:    string | null
  locationMode:        string | null
  locationVenue:       string | null
  publishVisibility:   string | null
}

type Props = {
  id:               string
  status:           string
  opensAt:          string | null
  closesAt:         string | null
  judgingOpensAt:   string | null
  judgingClosesAt:  string | null
  results:          ResultsData
  existingVenues:   string[]
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtTime(iso: string | null): string {
  if (!iso) return ''
  const t = iso.slice(11, 16) // "HH:MM"
  if (!t || t === '00:00') return ''
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`
}

function toDateInput(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function toTimeInput(iso: string | null): string {
  if (!iso) return ''
  const t = iso.slice(11, 16)
  return t && t !== '00:00' ? t : ''
}

const locationModeLabels: Record<string, string> = {
  'in-person':     'In person',
  'online':        'Online',
  'not-confirmed': 'Not yet confirmed',
}

const visibilityLabels: Record<string, string> = {
  'members-only':     'Members only',
  'members-first':    'Members first, then public',
  'public-same-time': 'Members and public at the same time',
}

// ── Results modal ──────────────────────────────────────────────────────────────

function ResultsModal({
  results,
  existingVenues,
  onSave,
  onClose,
}: {
  results:        ResultsData
  existingVenues: string[]
  onSave:         (data: {
    resultsDate:       string | null
    resultsTime:       string | null
    resultsEventType:  string | null
    locationMode:      string | null
    locationVenue:     string | null
    publishVisibility: string | null
  }) => void
  onClose: () => void
}) {
  const [date,        setDate]        = useState(toDateInput(results.resultsAt))
  const [time,        setTime]        = useState(toTimeInput(results.resultsAt))
  const [eventType,   setEventType]   = useState(results.resultsEventType ?? '')
  const [locMode,     setLocMode]     = useState(results.locationMode ?? 'not-confirmed')
  const [locVenue,    setLocVenue]    = useState(results.locationVenue ?? '')
  const [visibility,  setVisibility]  = useState(results.publishVisibility ?? 'members-only')
  const [isPending,   startTransition] = useTransition()

  const inputSx = { '& input': { fontSize: 14, fontFamily: 'inherit' }, '& .MuiOutlinedInput-notchedOutline': { borderRadius: '8px' } }

  function handleSave() {
    startTransition(async () => {
      await onSave({
        resultsDate:       date || null,
        resultsTime:       time || null,
        resultsEventType:  eventType.trim() || null,
        locationMode:      locMode,
        locationVenue:     locVenue.trim() || null,
        publishVisibility: visibility,
      })
    })
  }

  const labelCls   = "block text-[11px] font-semibold uppercase tracking-[0.05em] text-content-tertiary mb-1.5"
  const sectionCls = "space-y-4"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border border-border-default bg-surface-2 shadow-xl overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 border-b border-border-subtle">
          <h3 className="text-base font-semibold text-content-primary">Edit results event</h3>
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* Date + Time */}
          <div className={sectionCls}>
            <p className={labelCls}>Date &amp; time</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-xs text-content-secondary mb-1">Date</p>
                <OutlinedInput
                  size="small" type="date" fullWidth
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  sx={inputSx}
                />
              </div>
              <div className="w-36">
                <p className="text-xs text-content-secondary mb-1">Time</p>
                <OutlinedInput
                  size="small" type="time" fullWidth
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  sx={inputSx}
                />
              </div>
            </div>
          </div>

          {/* Event type */}
          <div className={sectionCls}>
            <p className={labelCls}>Event type</p>
            <OutlinedInput
              size="small" fullWidth
              placeholder="e.g. Club night, Online presentation"
              value={eventType}
              onChange={e => setEventType(e.target.value)}
              sx={inputSx}
            />
          </div>

          {/* Location */}
          <div className={sectionCls}>
            <p className={labelCls}>Location</p>
            <div className="flex rounded-lg border border-border-default overflow-hidden text-xs font-medium w-fit mb-3">
              {(['in-person', 'online', 'not-confirmed'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setLocMode(mode)}
                  className={`px-3 py-1.5 transition-colors ${locMode === mode ? 'bg-action-primary text-white' : 'bg-surface-1 text-content-secondary hover:bg-surface-0'}`}
                >
                  {locationModeLabels[mode]}
                </button>
              ))}
            </div>

            {locMode === 'in-person' && (
              <div>
                <p className="text-xs text-content-secondary mb-1">Venue</p>
                <OutlinedInput
                  size="small" fullWidth
                  placeholder="Type venue name or select existing…"
                  value={locVenue}
                  onChange={e => setLocVenue(e.target.value)}
                  inputProps={{ list: 'venue-suggestions' }}
                  sx={inputSx}
                />
                <datalist id="venue-suggestions">
                  {existingVenues.map(v => <option key={v} value={v} />)}
                </datalist>
              </div>
            )}
            {locMode === 'online' && (
              <div>
                <p className="text-xs text-content-secondary mb-1">Meeting link (optional)</p>
                <OutlinedInput
                  size="small" fullWidth
                  placeholder="https://…"
                  value={locVenue}
                  onChange={e => setLocVenue(e.target.value)}
                  sx={inputSx}
                />
              </div>
            )}
          </div>

          {/* Visibility */}
          <div className={sectionCls}>
            <p className={labelCls}>Results visibility on website</p>
            <Select
              size="small" fullWidth
              value={visibility}
              onChange={e => setVisibility(e.target.value)}
              sx={{ fontSize: 14, fontFamily: 'inherit', borderRadius: '8px' }}
            >
              <MenuItem value="members-only"     sx={{ fontSize: 14, fontFamily: 'inherit' }}>Members only</MenuItem>
              <MenuItem value="members-first"    sx={{ fontSize: 14, fontFamily: 'inherit' }}>Members first, then public</MenuItem>
              <MenuItem value="public-same-time" sx={{ fontSize: 14, fontFamily: 'inherit' }}>Members and public at the same time</MenuItem>
            </Select>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border-subtle flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-content-primary hover:bg-surface-1 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg bg-action-primary px-4 py-2 text-sm font-medium text-white hover:bg-action-primary-hover transition-colors disabled:opacity-60"
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ScheduleSection({
  id, status, opensAt, closesAt, judgingOpensAt, judgingClosesAt, results, existingVenues,
}: Props) {
  const [editing,    setEditing]    = useState<Field | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [error,      setError]      = useState('')
  const [savePending,   startSave]   = useTransition()
  const [actionPending, startAction] = useTransition()
  const [showResultsModal, setShowResultsModal] = useState(false)

  const now = new Date()
  const submissionsHaveOpened  = opensAt         ? new Date(opensAt)         <= now : false
  const submissionsHaveClosed  = closesAt        ? new Date(closesAt)        <= now : false
  const judgingWindowHasOpened = judgingOpensAt  ? new Date(judgingOpensAt)  <= now : false
  const judgingWindowHasClosed = judgingClosesAt ? new Date(judgingClosesAt) <= now : false
  const isTerminal = ['closed', 'cancelled', 'results_published'].includes(status)

  function startEdit(field: Field, currentValue: string | null) {
    if (isTerminal) return
    setEditing(field)
    setDraftValue(toDateInput(currentValue))
    setError('')
  }

  function cancelEdit() { setEditing(null); setDraftValue(''); setError('') }

  function saveEdit(field: Field) {
    setError('')
    const value: string | null = draftValue ? `${draftValue}T00:00:00` : null

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

  const saveBtnCls   = "rounded-md bg-action-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-action-primary-hover disabled:opacity-60 transition-colors"
  const cancelBtnCls = "rounded-md border border-border-default px-2.5 py-1 text-xs font-medium text-content-primary hover:bg-surface-1 transition-colors"
  const editBtnCls   = "text-xs text-action-primary hover:underline disabled:opacity-40 disabled:cursor-default disabled:no-underline"
  const inputSx      = { '& input': { fontSize: 14, fontFamily: 'inherit' }, '& .MuiOutlinedInput-notchedOutline': { borderRadius: '8px' } }

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
            <OutlinedInput
              size="small" type="date" fullWidth
              value={draftValue}
              onChange={e => setDraftValue(e.target.value)}
              sx={inputSx}
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

  const showSubmissionsAction = status === 'open'
  const showJudgingAction     = status === 'judging'

  // ── Results summary ─────────────────────────────────────────────────────────

  const hasResultsDate = !!results.resultsAt
  const resultDateStr  = hasResultsDate ? fmtDate(results.resultsAt) : null
  const resultTimeStr  = hasResultsDate ? fmtTime(results.resultsAt) : null

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
        <div className="flex-1 min-w-0 rounded-xl border border-border-default bg-surface-2 px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-content-tertiary leading-none">Results</p>
            {!isTerminal && (
              <button
                type="button"
                onClick={() => setShowResultsModal(true)}
                className={editBtnCls}
              >
                Edit
              </button>
            )}
          </div>

          {hasResultsDate ? (
            <div className="space-y-2 mt-0.5">
              <div>
                <p className="text-sm font-medium text-content-primary leading-snug">
                  {resultDateStr}
                  {resultTimeStr && <span className="ml-1.5 font-normal text-content-secondary">{resultTimeStr}</span>}
                </p>
                {results.resultsEventType && (
                  <p className="text-xs text-content-secondary mt-0.5">{results.resultsEventType}</p>
                )}
              </div>
              {(results.locationMode && results.locationMode !== 'not-confirmed') && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-content-tertiary mb-0.5">Location</p>
                  <p className="text-xs text-content-secondary">
                    {results.locationMode === 'online' ? 'Online' : results.locationVenue || 'In person'}
                  </p>
                  {results.locationMode === 'online' && results.locationVenue && (
                    <p className="text-xs text-content-tertiary truncate">{results.locationVenue}</p>
                  )}
                </div>
              )}
              {results.publishVisibility && results.publishVisibility !== 'members-only' && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-content-tertiary mb-0.5">Visibility</p>
                  <p className="text-xs text-content-secondary">{visibilityLabels[results.publishVisibility]}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[11px] italic text-content-tertiary mt-0.5">Not set</p>
          )}
        </div>

      </div>

      {showResultsModal && (
        <ResultsModal
          results={results}
          existingVenues={existingVenues}
          onClose={() => setShowResultsModal(false)}
          onSave={async (data) => {
            await updateResultsEvent(id, data)
            setShowResultsModal(false)
          }}
        />
      )}
    </section>
  )
}

'use client'

import { useState, useTransition } from 'react'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select        from '@mui/material/Select'
import MenuItem      from '@mui/material/MenuItem'
import Divider       from '@mui/material/Divider'
import Typography    from '@mui/material/Typography'
import { updateScheduleField, transitionStatus, updateResultsEvent } from '../actions'

type DateField = 'opens_at' | 'closes_at' | 'judging_opens_at' | 'judging_closes_at'

type ResultsData = {
  resultsAt:                  string | null
  resultsEventType:           string | null
  revealMode:                 string | null
  locationMode:               string | null
  locationVenue:              string | null
  publishTiming:              string | null
  publishSpecificAt:          string | null
  publishVisibility:          string | null
  publicVisibilityDelay:      number | null
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

// ── Formatting helpers ─────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtTime(iso: string | null): string {
  if (!iso) return ''
  const t = iso.slice(11, 16)
  if (!t || t === '00:00') return ''
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`
}

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : ''
}

function toTimeInput(iso: string | null): string {
  if (!iso) return ''
  const t = iso.slice(11, 16)
  return t && t !== '00:00' ? t : ''
}

const visibilityLabels: Record<string, string> = {
  'members-only':     'Members only',
  'members-first':    'Members first, then public',
  'public-same-time': 'Members and public at the same time',
}

// ── Shared sub-components (mirroring wizard style) ────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', mb: 0.75, fontFamily: 'inherit' }}>
      {children}
    </Typography>
  )
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', width: 16, height: 16, borderRadius: '50%',
      border: `2px solid ${selected ? 'var(--action-primary)' : 'var(--border-default)'}`,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {selected && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--action-primary)', display: 'block' }} />}
    </span>
  )
}

function RadioRow({ selected, onClick, label, sublabel }: {
  selected:  boolean
  onClick:   () => void
  label:     string
  sublabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-2.5 text-left bg-transparent border-0 cursor-pointer p-0 font-[inherit]"
    >
      <span className="mt-0.5"><RadioDot selected={selected} /></span>
      <span>
        <span className="block text-sm text-content-primary leading-snug">{label}</span>
        {sublabel && <span className="block text-xs text-content-secondary mt-0.5 leading-normal">{sublabel}</span>}
      </span>
    </button>
  )
}

function PathCard({ selected, onClick, title, description }: {
  selected:    boolean
  onClick:     () => void
  title:       string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 text-left p-4 rounded-lg border-2 cursor-pointer font-[inherit] transition-all"
      style={{
        background:   selected ? 'rgba(30,77,140,0.05)' : 'var(--surface-2)',
        borderColor:  selected ? 'var(--action-primary)' : 'var(--border-default)',
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <RadioDot selected={selected} />
        <span className="text-sm font-semibold" style={{ color: selected ? 'var(--action-primary)' : 'var(--text-primary)' }}>
          {title}
        </span>
      </div>
      <p className="text-xs text-content-secondary leading-relaxed pl-6">{description}</p>
    </button>
  )
}

const inputSx = {
  '& input': { fontSize: 14, fontFamily: 'inherit' },
  '& .MuiOutlinedInput-notchedOutline': { borderRadius: '8px' },
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-content-tertiary leading-none mb-0.5">{label}</p>
      <p className="text-xs text-content-primary leading-snug">{value}</p>
    </div>
  )
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
  onSave:         (data: Parameters<typeof updateResultsEvent>[1]) => Promise<void>
  onClose:        () => void
}) {
  const [revealMode,    setRevealMode]    = useState<'meeting' | 'auto-publish'>(
    (results.revealMode as 'meeting' | 'auto-publish') ?? 'meeting'
  )

  // Meeting path
  const [eventDate,     setEventDate]     = useState(toDateInput(results.resultsAt))
  const [eventTime,     setEventTime]     = useState(toTimeInput(results.resultsAt))
  const [eventType,     setEventType]     = useState(results.resultsEventType ?? '')
  const [locMode,       setLocMode]       = useState<'in-person' | 'online' | 'not-confirmed'>(
    (results.locationMode as 'in-person' | 'online' | 'not-confirmed') ?? 'not-confirmed'
  )
  const [locVenue,      setLocVenue]      = useState(results.locationVenue ?? '')
  const [customVenue,   setCustomVenue]   = useState(
    !!results.locationVenue && !existingVenues.includes(results.locationVenue)
  )
  const [publishTiming, setPublishTiming] = useState<'event-start' | 'specific-time' | 'manual'>(
    (results.publishTiming as 'event-start' | 'specific-time' | 'manual') ?? 'manual'
  )
  const [publishSpecificDate, setPublishSpecificDate] = useState(toDateInput(results.publishSpecificAt))
  const [publishSpecificTime, setPublishSpecificTime] = useState(toTimeInput(results.publishSpecificAt) || '20:00')

  // Auto-publish path (reuse results_at for publish datetime in auto mode)
  const autoAt = revealMode === 'auto-publish' ? results.resultsAt : null
  const [publishAutoDate, setPublishAutoDate] = useState(toDateInput(autoAt))
  const [publishAutoTime, setPublishAutoTime] = useState(toTimeInput(autoAt) || '20:00')

  // Shared
  const [visibility, setVisibility] = useState<'members-only' | 'members-first' | 'public-same-time'>(
    (results.publishVisibility as 'members-only' | 'members-first' | 'public-same-time') ?? 'members-only'
  )
  const [visDelay, setVisDelay] = useState(results.publicVisibilityDelay ?? 24)

  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await onSave({
        revealMode,
        eventDate:             revealMode === 'meeting' ? (eventDate || null) : null,
        eventTime:             revealMode === 'meeting' ? (eventTime || null) : null,
        resultsEventType:      revealMode === 'meeting' ? (eventType.trim() || null) : null,
        locationMode:          locMode,
        locationVenue:         locVenue.trim() || null,
        publishTiming,
        publishSpecificDate:   publishTiming === 'specific-time' ? (publishSpecificDate || null) : null,
        publishSpecificTime:   publishTiming === 'specific-time' ? (publishSpecificTime || null) : null,
        publishAutoDate:       revealMode === 'auto-publish' ? (publishAutoDate || null) : null,
        publishAutoTime:       revealMode === 'auto-publish' ? (publishAutoTime || null) : null,
        publicVisibility:      visibility,
        publicVisibilityDelay: visDelay,
      })
    })
  }

  const sectionDivider = <div className="border-t border-border-subtle" />

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border border-border-default bg-surface-2 shadow-xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 border-b border-border-subtle shrink-0">
          <h3 className="text-base font-semibold text-content-primary">Results event</h3>
        </div>

        <div className="px-6 py-5 space-y-6 overflow-y-auto">

          {/* ── How will results be revealed? ── */}
          <div>
            <p className="text-sm font-semibold text-content-primary mb-1">How will results be revealed?</p>
            <p className="text-xs text-content-secondary mb-3">Configure how and when results are announced.</p>
            <div className="flex gap-2.5">
              <PathCard
                selected={revealMode === 'meeting'}
                onClick={() => setRevealMode('meeting')}
                title="At a meeting or event"
                description="Results are announced at a specific time and place, then published to members."
              />
              <PathCard
                selected={revealMode === 'auto-publish'}
                onClick={() => setRevealMode('auto-publish')}
                title="Published automatically"
                description="Scores go live at a scheduled time with no event."
              />
            </div>
          </div>

          {sectionDivider}

          {/* ── Meeting path ── */}
          {revealMode === 'meeting' && (
            <>
              {/* Date + time */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-content-tertiary mb-3">Event date &amp; time</p>
                <div className="flex gap-3">
                  <div>
                    <FieldLabel>Date</FieldLabel>
                    <OutlinedInput size="small" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} sx={{ ...inputSx, width: 160 }} />
                  </div>
                  <div>
                    <FieldLabel>Time</FieldLabel>
                    <OutlinedInput size="small" type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} sx={{ ...inputSx, width: 120 }} />
                  </div>
                </div>
              </div>

              {/* Event type */}
              <div>
                <FieldLabel>Event type</FieldLabel>
                <OutlinedInput
                  size="small" fullWidth
                  placeholder="e.g. Club night, Online presentation"
                  value={eventType}
                  onChange={e => setEventType(e.target.value)}
                  sx={inputSx}
                />
              </div>

              {/* Location */}
              <div>
                <FieldLabel>Location</FieldLabel>
                <div className="flex gap-5 mb-3">
                  {(['in-person', 'online', 'not-confirmed'] as const).map(mode => (
                    <RadioRow
                      key={mode}
                      selected={locMode === mode}
                      onClick={() => setLocMode(mode)}
                      label={mode === 'in-person' ? 'In person' : mode === 'online' ? 'Online' : 'Not yet confirmed'}
                    />
                  ))}
                </div>
                {locMode === 'in-person' && (
                  customVenue ? (
                    <div className="flex gap-2">
                      <OutlinedInput
                        size="small" fullWidth autoFocus
                        value={locVenue}
                        onChange={e => setLocVenue(e.target.value)}
                        placeholder="Venue name or address…"
                        sx={inputSx}
                      />
                      {existingVenues.length > 0 && (
                        <button
                          type="button"
                          onClick={() => { setCustomVenue(false); setLocVenue('') }}
                          className="text-xs text-content-secondary hover:text-content-primary whitespace-nowrap px-2 border-0 bg-transparent cursor-pointer font-[inherit]"
                        >
                          ← Pick from list
                        </button>
                      )}
                    </div>
                  ) : (
                    <Select
                      size="small" fullWidth displayEmpty
                      value={locVenue}
                      onChange={e => {
                        if (e.target.value === '__custom__') {
                          setCustomVenue(true)
                          setLocVenue('')
                        } else {
                          setLocVenue(e.target.value as string)
                        }
                      }}
                      sx={{ fontFamily: 'inherit', fontSize: 14 }}
                      renderValue={val =>
                        val
                          ? <Typography sx={{ fontSize: 14, fontFamily: 'inherit' }}>{val}</Typography>
                          : <Typography sx={{ fontSize: 14, color: 'text.disabled', fontFamily: 'inherit' }}>Select a venue…</Typography>
                      }
                    >
                      {existingVenues.map(loc => (
                        <MenuItem key={loc} value={loc} sx={{ fontSize: 14, fontFamily: 'inherit' }}>{loc}</MenuItem>
                      ))}
                      {existingVenues.length > 0 && <Divider />}
                      <MenuItem value="__custom__" sx={{ fontSize: 14, fontFamily: 'inherit', color: 'primary.main' }}>
                        + Enter a different address…
                      </MenuItem>
                    </Select>
                  )
                )}
                {locMode === 'online' && (
                  <OutlinedInput
                    size="small" fullWidth
                    value={locVenue}
                    onChange={e => setLocVenue(e.target.value)}
                    placeholder="Meeting link or platform…"
                    sx={inputSx}
                  />
                )}
              </div>

              {sectionDivider}

              {/* Publish timing */}
              <div>
                <FieldLabel>When are results visible on club website?</FieldLabel>
                <Select
                  size="small"
                  value={publishTiming}
                  onChange={e => setPublishTiming(e.target.value as typeof publishTiming)}
                  sx={{ fontFamily: 'inherit', minWidth: 220 }}
                >
                  <MenuItem value="event-start"   sx={{ fontSize: 14, fontFamily: 'inherit' }}>At event end time</MenuItem>
                  <MenuItem value="specific-time" sx={{ fontSize: 14, fontFamily: 'inherit' }}>At a specific time…</MenuItem>
                  <MenuItem value="manual"        sx={{ fontSize: 14, fontFamily: 'inherit' }}>Manually by admin</MenuItem>
                </Select>
                {publishTiming === 'specific-time' && (
                  <div className="flex gap-3 mt-3">
                    <div>
                      <FieldLabel>Date</FieldLabel>
                      <OutlinedInput size="small" type="date" value={publishSpecificDate} onChange={e => setPublishSpecificDate(e.target.value)} sx={{ ...inputSx, width: 160 }} />
                    </div>
                    <div>
                      <FieldLabel>Time</FieldLabel>
                      <OutlinedInput size="small" type="time" value={publishSpecificTime} onChange={e => setPublishSpecificTime(e.target.value)} sx={{ ...inputSx, width: 120 }} />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Auto-publish path ── */}
          {revealMode === 'auto-publish' && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-content-tertiary mb-3">Publish date &amp; time</p>
              <div className="flex gap-3">
                <div>
                  <FieldLabel>Date</FieldLabel>
                  <OutlinedInput size="small" type="date" value={publishAutoDate} onChange={e => setPublishAutoDate(e.target.value)} sx={{ ...inputSx, width: 160 }} />
                </div>
                <div>
                  <FieldLabel>Time</FieldLabel>
                  <OutlinedInput size="small" type="time" value={publishAutoTime} onChange={e => setPublishAutoTime(e.target.value)} sx={{ ...inputSx, width: 120 }} />
                </div>
              </div>
            </div>
          )}

          {sectionDivider}

          {/* ── Public visibility (shared) ── */}
          <div>
            <FieldLabel>Who can see results on the club website?</FieldLabel>
            <Select
              size="small"
              value={visibility}
              onChange={e => setVisibility(e.target.value as typeof visibility)}
              sx={{ fontFamily: 'inherit', minWidth: 280 }}
            >
              <MenuItem value="members-only"     sx={{ fontSize: 14, fontFamily: 'inherit' }}>Members only</MenuItem>
              <MenuItem value="members-first"    sx={{ fontSize: 14, fontFamily: 'inherit' }}>Members first, then public after…</MenuItem>
              <MenuItem value="public-same-time" sx={{ fontSize: 14, fontFamily: 'inherit' }}>Members and public at the same time</MenuItem>
            </Select>
            {visibility === 'members-first' && (
              <div className="flex items-center gap-2 mt-3">
                <Select
                  size="small"
                  value={visDelay}
                  onChange={e => setVisDelay(Number(e.target.value))}
                  sx={{ fontFamily: 'inherit', minWidth: 120 }}
                >
                  {[1, 2, 4, 8, 12, 24, 48, 72].map(h => (
                    <MenuItem key={h} value={h} sx={{ fontSize: 14, fontFamily: 'inherit' }}>
                      {h === 1 ? '1 hour' : `${h} hours`}
                    </MenuItem>
                  ))}
                </Select>
                <span className="text-sm text-content-secondary">after member publish</span>
              </div>
            )}
          </div>

        </div>

        <div className="px-6 py-4 border-t border-border-subtle flex justify-end gap-2 shrink-0">
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
  const [editing,    setEditing]    = useState<DateField | null>(null)
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

  function startEdit(field: DateField, currentValue: string | null) {
    if (isTerminal) return
    setEditing(field)
    setDraftValue(toDateInput(currentValue))
    setError('')
  }

  function cancelEdit() { setEditing(null); setDraftValue(''); setError('') }

  function saveEdit(field: DateField) {
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
              sx={{ '& input': { fontSize: 14, fontFamily: 'inherit' }, '& .MuiOutlinedInput-notchedOutline': { borderRadius: '8px' } }}
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

  function Sep() {
    return (
      <div className="flex items-stretch py-1 px-0.5">
        <div className="w-px bg-border-default rounded-full" />
      </div>
    )
  }

  // "Begin judging" lives in Submission Dates card while judging hasn't opened yet
  const showSubmissionsAction   = status === 'open' && !judgingWindowHasOpened
  // Once the judging window opens (but admin hasn't clicked Begin Judging), prompt from Judging card
  const showJudgingBeginAction  = status === 'open' && judgingWindowHasOpened
  const showJudgingAction       = status === 'judging'

  // Results summary
  const hasResults    = !!results.resultsAt
  const isAutoPublish = results.revealMode === 'auto-publish'
  const resultDateStr = hasResults ? fmtDate(results.resultsAt) : null
  const resultTimeStr = hasResults ? fmtTime(results.resultsAt) : null

  return (
    <section id="schedule">
      <h2 className="mt-[15px] mb-3 text-sm font-medium uppercase tracking-wider text-content-tertiary">Schedule</h2>

      <div className="flex items-stretch gap-2">

        {/* ── Submission Dates ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 rounded-xl border border-border-default bg-surface-2 px-4 py-3 flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-content-tertiary leading-none">Submission Dates</p>

          <DateRow label="Opens"  field="opens_at"  value={opensAt}  locked={submissionsHaveOpened} lockedReason="The submission window has already opened." />
          <div className="border-t border-border-subtle pt-2">
            <DateRow label="Closes" field="closes_at" value={closesAt} locked={submissionsHaveClosed} lockedReason="The submission window has already closed." />
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

          <DateRow label="Opens"  field="judging_opens_at"  value={judgingOpensAt}  locked={judgingWindowHasOpened} lockedReason="The judging window has already opened." />
          <div className="border-t border-border-subtle pt-2">
            <DateRow label="Closes" field="judging_closes_at" value={judgingClosesAt} locked={judgingWindowHasClosed} lockedReason="The judging window has already closed." />
          </div>

          {showJudgingBeginAction && (
            <div className="mt-auto pt-2 border-t border-border-subtle">
              <button
                disabled={actionPending}
                onClick={() => startAction(() => transitionStatus(id, 'judging'))}
                className="inline-flex items-center rounded-lg bg-action-primary px-4 py-2 text-sm font-medium text-white hover:bg-action-primary-hover transition-colors disabled:opacity-60"
              >
                {actionPending ? 'Updating…' : 'Begin judging →'}
              </button>
            </div>
          )}
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
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-content-tertiary leading-none">Results</p>
            {!isTerminal && (
              <button type="button" onClick={() => setShowResultsModal(true)} className={editBtnCls}>Edit</button>
            )}
          </div>

          {hasResults ? (
            <>
              {/* Reveal mode — always shown */}
              <InfoRow
                label="Reveal"
                value={results.revealMode === 'auto-publish' ? 'Published automatically' : 'At a meeting or event'}
              />

              {/* Date & time */}
              {results.resultsAt && (
                <div className="border-t border-border-subtle pt-2">
                  <InfoRow
                    label={results.revealMode === 'auto-publish' ? 'Publishes' : 'Event date'}
                    value={`${resultDateStr}${resultTimeStr ? ` · ${resultTimeStr}` : ''}`}
                  />
                </div>
              )}

              {/* Event type — meeting only */}
              {results.revealMode !== 'auto-publish' && results.resultsEventType && (
                <div className="border-t border-border-subtle pt-2">
                  <InfoRow label="Type" value={results.resultsEventType} />
                </div>
              )}

              {/* Location — meeting only */}
              {results.revealMode !== 'auto-publish' && results.locationMode && (() => {
                const { locationMode, locationVenue } = results
                let value: string | null = null
                if (locationMode === 'not-confirmed') value = 'Not yet confirmed'
                else if (locationMode === 'online')   value = locationVenue ? `Online · ${locationVenue}` : 'Online'
                else if (locationMode === 'in-person') value = locationVenue || 'In person (venue TBC)'
                return value ? (
                  <div className="border-t border-border-subtle pt-2">
                    <InfoRow label="Location" value={value} />
                  </div>
                ) : null
              })()}

              {/* Publish timing — meeting only */}
              {results.revealMode !== 'auto-publish' && results.publishTiming && (() => {
                const { publishTiming, publishSpecificAt } = results
                let value: string | null = null
                if (publishTiming === 'event-start')   value = 'At event end time'
                else if (publishTiming === 'manual')   value = 'Manually by admin'
                else if (publishTiming === 'specific-time') {
                  value = publishSpecificAt
                    ? `${fmtDate(publishSpecificAt)}${fmtTime(publishSpecificAt) ? ` · ${fmtTime(publishSpecificAt)}` : ''}`
                    : 'Time not set'
                }
                return value ? (
                  <div className="border-t border-border-subtle pt-2">
                    <InfoRow label="Goes live" value={value} />
                  </div>
                ) : null
              })()}

              {/* Visibility */}
              {results.publishVisibility && (() => {
                const { publishVisibility, publicVisibilityDelay } = results
                let value = visibilityLabels[publishVisibility] ?? publishVisibility
                if (publishVisibility === 'members-first') {
                  value = `Members first, then public after ${publicVisibilityDelay ?? 24}h`
                }
                return (
                  <div className="border-t border-border-subtle pt-2">
                    <InfoRow label="Visible to" value={value} />
                  </div>
                )
              })()}
            </>
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

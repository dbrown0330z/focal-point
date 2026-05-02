'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  Collapse,
  Divider,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from '@mui/material'
import { AnimatedReveal, FormSection } from './shared'
import type { CompetitionSchedule, EventLocationMode, PublicVisibility } from '@/types/competition'

interface Props {
  schedule:         CompetitionSchedule
  onChange:         (s: Partial<CompetitionSchedule>) => void
  errors:           Record<string, string>
  members:          { id: string; name: string; email?: string }[]
  meetingLocations: string[]
  numberOfJudges?:  number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDaysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function addDays(date: string, n: number): string {
  if (!date) return ''
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })
}

function formatTime(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`
}

// ─── Primitive components ─────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', mb: 0.75 }}>
      {children}
    </Typography>
  )
}

function HintText({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.6, mt: 0.75 }}>
      {children}
    </Typography>
  )
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <Box sx={{
      width: 16, height: 16, borderRadius: '50%',
      border: '2px solid',
      borderColor: selected ? 'primary.main' : 'divider',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {selected && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />}
    </Box>
  )
}

function RadioRow({
  selected, onClick, label, sublabel,
}: {
  selected:  boolean
  onClick:   () => void
  label:     string
  sublabel?: string
}) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, border: 'none', bgcolor: 'transparent', cursor: 'pointer', fontFamily: 'inherit', p: 0, textAlign: 'left' }}
    >
      <Box sx={{ mt: '2px' }}><RadioDot selected={selected} /></Box>
      <Box>
        <Typography sx={{ fontSize: 14, color: 'text.primary', lineHeight: 1.4 }}>{label}</Typography>
        {sublabel && (
          <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5, mt: 0.25 }}>{sublabel}</Typography>
        )}
      </Box>
    </Box>
  )
}

function ResultsPathCard({ selected, onClick, title, description }: {
  selected:    boolean
  onClick:     () => void
  title:       string
  description: string
}) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        flex: 1, textAlign: 'left', p: 2.5, border: '2px solid', borderRadius: 2,
        fontFamily: 'inherit', cursor: 'pointer',
        bgcolor:     selected ? 'rgba(30,77,140,0.05)' : 'background.paper',
        borderColor: selected ? 'primary.main' : 'divider',
        transition: 'all 0.12s',
        '&:hover': { borderColor: 'primary.main', bgcolor: selected ? 'rgba(30,77,140,0.07)' : 'rgba(30,77,140,0.03)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
        <RadioDot selected={selected} />
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: selected ? 'primary.main' : 'text.primary' }}>
          {title}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5, pl: '28px' }}>
        {description}
      </Typography>
    </Box>
  )
}

// ─── Calendar confirmation panel ──────────────────────────────────────────────

function InfoPanel({ hasJudge }: { hasJudge: boolean }) {
  const dot = (
    <Box component="span" sx={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', bgcolor: '#0A5742', flexShrink: 0, mt: '6px', mr: 1.5 }} />
  )

  const calendarItems = [
    'Competition name, results date, and submission window will be visible to members',
    'Judging dates are internal and will not appear on the calendar',
  ]

  const judgeItems = [
    'The assigned judge will receive a private link to the judging area on the judging open date',
    hasJudge
      ? null
      : 'If no judge is assigned yet, the email sends automatically once one is added',
  ].filter(Boolean) as string[]

  return (
    <Box sx={{ border: '1px solid #9DD9C5', borderRadius: 2, p: 2.5, bgcolor: '#F0FAF7' }}>
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0A5742', mb: 2 }}>
        What happens when this is published?
      </Typography>

      <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#0A5742', mb: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Added to the club calendar
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2.5, pl: 2.5 }}>
        {calendarItems.map(item => (
          <Box key={item} sx={{ display: 'flex', alignItems: 'flex-start' }}>
            {dot}
            <Typography sx={{ fontSize: 13, color: '#0A5742', lineHeight: 1.55 }}>{item}</Typography>
          </Box>
        ))}
      </Box>

      <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#0A5742', mb: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Judge notification
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, pl: 2.5 }}>
        {judgeItems.map(item => (
          <Box key={item} sx={{ display: 'flex', alignItems: 'flex-start' }}>
            {dot}
            <Typography sx={{ fontSize: 13, color: '#0A5742', lineHeight: 1.55 }}>{item}</Typography>
          </Box>
        ))}
      </Box>

      <Typography sx={{ fontSize: 12, color: '#0A5742', mt: 2, pt: 2, borderTop: '1px solid #9DD9C5', lineHeight: 1.55 }}>
        You can edit dates, judge assignment, and event details at any time before the judging window opens.
      </Typography>
    </Box>
  )
}

// ─── Judge slot ───────────────────────────────────────────────────────────────

type OneOffJudge = NonNullable<CompetitionSchedule['judgeOneOff']>

function JudgeSlot({
  index,
  total,
  selectedId,
  oneOff,
  members,
  judgingOpenDate,
  onSelect,
  onOneOff,
}: {
  index:           number
  total:           number
  selectedId:      string
  oneOff:          OneOffJudge | null
  members:         { id: string; name: string; email?: string }[]
  judgingOpenDate: string
  onSelect:        (id: string) => void
  onOneOff:        (data: OneOffJudge | null) => void
}) {
  const isOneOff     = !!oneOff
  const oneOffName   = oneOff ? [oneOff.firstName, oneOff.lastName].filter(Boolean).join(' ') : ''

  const [formOpen,  setFormOpen]  = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [saveToDir, setSaveToDir] = useState(true)
  const [emailErr,  setEmailErr]  = useState('')

  const canAdd = firstName.trim().length > 0
    && lastName.trim().length > 0
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    && !emailErr

  const invitationLine = judgingOpenDate
    ? `Invitation will be sent on ${formatDate(judgingOpenDate)}`
    : 'Invitation will be sent when judging opens'

  function checkEmail(val: string) {
    setEmail(val)
    const trimmed = val.trim().toLowerCase()
    const duplicate = trimmed.length > 0 && members.some(m => m.email?.toLowerCase() === trimmed)
    setEmailErr(duplicate
      ? 'This email is already in your judges directory. Search above to find them.'
      : ''
    )
  }

  function handleCancel() {
    setFormOpen(false)
    setFirstName('')
    setLastName('')
    setEmail('')
    setEmailErr('')
    setSaveToDir(true)
  }

  function handleAdd() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailErr('Please enter a valid email address')
      return
    }
    onOneOff({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), saveToDirectory: saveToDir })
    onSelect('')
    handleCancel()
  }

  return (
    <Box>
      {total > 1 && (
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', mb: 0.75 }}>
          Judge {index + 1}
        </Typography>
      )}

      {/* ── Assigned one-off: show name + Change ── */}
      {isOneOff && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary' }}>{oneOffName}</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>{invitationLine}</Typography>
          </Box>
          <Box
            component="button"
            onClick={() => { onOneOff(null); onSelect(''); setFormOpen(false) }}
            sx={{ border: 'none', bgcolor: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: 'primary.main', p: 0, flexShrink: 0 }}
          >
            Change
          </Box>
        </Box>
      )}

      {/* ── Dropdown (shown when no one-off) ── */}
      {!isOneOff && (
        <Box>
          <Select
            size="small"
            fullWidth
            displayEmpty
            value={selectedId}
            onChange={e => {
              const val = e.target.value as string
              if (val === '__add_new__') {
                setFormOpen(true)
                // Don't set a selectedId — keep Select at its current value
              } else {
                onSelect(val)
                onOneOff(null)
                setFormOpen(false)
              }
            }}
            renderValue={val => {
              if (!val) return <Typography sx={{ fontSize: 14, color: 'text.disabled', fontFamily: 'inherit' }}>Select a judge…</Typography>
              const m = members.find(m => m.id === val)
              return <Typography sx={{ fontSize: 14, fontFamily: 'inherit' }}>{m?.name ?? val}</Typography>
            }}
            sx={{ fontFamily: 'inherit' }}
          >
            {members.map(m => (
              <MenuItem key={m.id} value={m.id} sx={{ fontSize: 14, fontFamily: 'inherit' }}>
                {m.name}
              </MenuItem>
            ))}
            <Divider />
            <MenuItem value="__add_new__" sx={{ fontSize: 14, fontFamily: 'inherit', color: 'primary.main' }}>
              + Add a new judge…
            </MenuItem>
          </Select>

          {selectedId && (
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>{invitationLine}</Typography>
          )}

          {/* ── Inline add form ── */}
          <Collapse in={formOpen}>
            <Box sx={{ mt: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', mb: 2 }}>
                Add a new judge
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <FieldLabel>First name</FieldLabel>
                  <OutlinedInput
                    fullWidth size="small"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    slotProps={{ input: { style: { fontSize: 14 } } }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FieldLabel>Last name</FieldLabel>
                  <OutlinedInput
                    fullWidth size="small"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    slotProps={{ input: { style: { fontSize: 14 } } }}
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <FieldLabel>Email</FieldLabel>
                <OutlinedInput
                  fullWidth size="small"
                  type="email"
                  value={email}
                  onChange={e => checkEmail(e.target.value)}
                  error={!!emailErr}
                  slotProps={{ input: { style: { fontSize: 14 } } }}
                />
                {emailErr && (
                  <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.5 }}>{emailErr}</Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
                {([
                  { val: true,  label: 'Add to judges directory for future use' },
                  { val: false, label: 'This competition only' },
                ] as const).map(opt => (
                  <Box
                    key={String(opt.val)}
                    component="button"
                    onClick={() => setSaveToDir(opt.val)}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.25, border: 'none', bgcolor: 'transparent', cursor: 'pointer', fontFamily: 'inherit', p: 0, textAlign: 'left' }}
                  >
                    <RadioDot selected={saveToDir === opt.val} />
                    <Typography sx={{ fontSize: 13, color: 'text.primary' }}>{opt.label}</Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                <Button variant="outlined" color="secondary" size="small" onClick={handleCancel}>Cancel</Button>
                <Button variant="contained" size="small" onClick={handleAdd} disabled={!canAdd}>Add judge</Button>
              </Box>
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  )
}

// ─── Shared publish + visibility fields (used in both meeting and auto-publish paths) ─

function PublishVisibilityFields({
  schedule,
  onChange,
}: {
  schedule: CompetitionSchedule
  onChange: (s: Partial<CompetitionSchedule>) => void
}) {
  const isMeeting = schedule.resultsRevealMode === 'meeting'

  return (
    <>
      {isMeeting && (
        <Box>
          <FieldLabel>When are results visible on club website?</FieldLabel>
          <Select
            size="small"
            value={schedule.publishTiming}
            onChange={e => onChange({ publishTiming: e.target.value as 'event-start' | 'specific-time' | 'manual' })}
            sx={{ fontFamily: 'inherit', minWidth: 220 }}
          >
            <MenuItem value="event-start"   sx={{ fontSize: 14, fontFamily: 'inherit' }}>At event end time</MenuItem>
            <MenuItem value="specific-time" sx={{ fontSize: 14, fontFamily: 'inherit' }}>At a specific time…</MenuItem>
            <MenuItem value="manual"        sx={{ fontSize: 14, fontFamily: 'inherit' }}>Manually by admin</MenuItem>
          </Select>
          <AnimatedReveal show={schedule.publishTiming === 'specific-time'}>
            <Box sx={{ mt: 1.5, display: 'flex', gap: 2 }}>
              <Box>
                <FieldLabel>Date</FieldLabel>
                <OutlinedInput
                  size="small" type="date"
                  value={schedule.publishSpecificDate}
                  onChange={e => onChange({ publishSpecificDate: e.target.value })}
                  slotProps={{ input: { style: { fontSize: 14 } } }}
                  sx={{ width: 160 }}
                />
              </Box>
              <Box>
                <FieldLabel>Time</FieldLabel>
                <OutlinedInput
                  size="small" type="time"
                  value={schedule.publishSpecificTime}
                  onChange={e => onChange({ publishSpecificTime: e.target.value })}
                  slotProps={{ input: { style: { fontSize: 14 } } }}
                  sx={{ width: 120 }}
                />
              </Box>
            </Box>
          </AnimatedReveal>
        </Box>
      )}

      <Box>
        <FieldLabel>Who can see results on the club website?</FieldLabel>
        <Select
          size="small"
          value={schedule.publicVisibility}
          onChange={e => onChange({ publicVisibility: e.target.value as 'members-only' | 'members-first' | 'public-same-time' })}
          sx={{ fontFamily: 'inherit', minWidth: 280 }}
        >
          <MenuItem value="members-only"     sx={{ fontSize: 14, fontFamily: 'inherit' }}>Members only</MenuItem>
          <MenuItem value="members-first"    sx={{ fontSize: 14, fontFamily: 'inherit' }}>Members first, then public after…</MenuItem>
          <MenuItem value="public-same-time" sx={{ fontSize: 14, fontFamily: 'inherit' }}>Members and public at the same time</MenuItem>
        </Select>
        <AnimatedReveal show={schedule.publicVisibility === 'members-first'}>
          <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Select
              size="small"
              value={schedule.publicVisibilityDelayHours}
              onChange={e => onChange({ publicVisibilityDelayHours: Number(e.target.value) })}
              sx={{ fontFamily: 'inherit', minWidth: 120 }}
            >
              {[1, 2, 4, 8, 12, 24, 48, 72].map(h => (
                <MenuItem key={h} value={h} sx={{ fontSize: 14, fontFamily: 'inherit' }}>
                  {h === 1 ? '1 hour' : `${h} hours`}
                </MenuItem>
              ))}
            </Select>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>after member publish</Typography>
          </Box>
        </AnimatedReveal>
      </Box>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StepSchedule({ schedule, onChange, errors, members, meetingLocations, numberOfJudges = 1 }: Props) {
  const judgeCount = Math.max(1, numberOfJudges)
  const judgeRef   = useRef<HTMLDivElement>(null)
  const hasJudge   = schedule.judgeIds.filter(Boolean).length > 0

  // Track whether the venue field is in custom-entry mode
  const [customLocation, setCustomLocation] = useState(
    !!schedule.eventLocationVenue && !meetingLocations.includes(schedule.eventLocationVenue)
  )

  // Calendar-only name toggle
  const [showCalendarTitle, setShowCalendarTitle] = useState(!!schedule.calendarTitle)

  // Auto-populate dates on first load if not yet set
  const didInitRef = useRef(false)
  useEffect(() => {
    if (didInitRef.current) return
    didInitRef.current = true
    if (schedule.eventDate || schedule.publishAutoDate) return
    const resultsDate = addDaysFromNow(30)
    onChange({
      eventDate:            resultsDate,
      publishAutoDate:      resultsDate,
      judgingCloseDate:     addDaysFromNow(28),
      judgingOpenDate:      addDaysFromNow(18),
      submissionsCloseDate: addDaysFromNow(16),
      submissionsOpenDate:  addDaysFromNow(2),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>

      {/* ── Competition name ── */}
      <FormSection title="Competition name">
        <Box>
          <OutlinedInput
            fullWidth
            size="small"
            value={schedule.instanceName}
            onChange={e => onChange({ instanceName: e.target.value })}
            placeholder="e.g. Monthly Salon — May 2026"
            error={!!errors.instanceName}
            slotProps={{ input: { style: { fontSize: 14 } } }}
          />
          {errors.instanceName && (
            <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.5 }}>{errors.instanceName}</Typography>
          )}
          <HintText>How it appears to admins and members in the competition list and on their dashboard.</HintText>

          {/* Calendar-only name toggle */}
          <Box
            component="button"
            onClick={() => {
              const next = !showCalendarTitle
              setShowCalendarTitle(next)
              if (!next) onChange({ calendarTitle: '' })
            }}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.25, border: 'none', bgcolor: 'transparent', cursor: 'pointer', fontFamily: 'inherit', p: 0 }}
          >
            <Typography sx={{ fontSize: 14, color: 'primary.main' }}>
              {showCalendarTitle ? 'Remove member-friendly name' : 'Create a member-friendly name for this competition'}
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'primary.main', lineHeight: 1 }}>
              {showCalendarTitle ? '▲' : '▼'}
            </Typography>
          </Box>
          <Collapse in={showCalendarTitle}>
            <Box sx={{ mt: 1.25 }}>
              <FieldLabel>Calendar name</FieldLabel>
              <OutlinedInput
                fullWidth
                size="small"
                value={schedule.calendarTitle}
                onChange={e => onChange({ calendarTitle: e.target.value })}
                placeholder={schedule.instanceName || 'e.g. May Salon — Results Evening'}
                slotProps={{ input: { style: { fontSize: 14 } } }}
              />
              <HintText>This will be used to reference this competition everywhere in the member and judging portals.</HintText>
            </Box>
          </Collapse>
        </Box>
      </FormSection>

      {/* ── Results & visibility ── */}
      <Box>
        <Typography sx={{ fontSize: 16, fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
          Results &amp; visibility
        </Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2.5 }}>
          Configure how and when results are announced.
        </Typography>

        {/* Layer 1 — Reveal event */}
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', mb: 1.25 }}>
          How will results be revealed?
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
          <ResultsPathCard
            selected={schedule.resultsRevealMode === 'meeting'}
            onClick={() => onChange({ resultsRevealMode: 'meeting' })}
            title="At a meeting or event"
            description="Results are announced at a specific time and place, then published to members."
          />
          <ResultsPathCard
            selected={schedule.resultsRevealMode === 'auto-publish'}
            onClick={() => onChange({ resultsRevealMode: 'auto-publish' })}
            title="Published automatically"
            description="Scores go live at a scheduled time with no event."
          />
        </Box>

        {/* Path A — Meeting */}
        <AnimatedReveal show={schedule.resultsRevealMode === 'meeting'}>
          <FormSection>
            {/* Date + time */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box>
                <FieldLabel>Date</FieldLabel>
                <OutlinedInput
                  size="small" type="date"
                  value={schedule.eventDate}
                  onChange={e => onChange({ eventDate: e.target.value })}
                  slotProps={{ input: { style: { fontSize: 14 } } }}
                  sx={{ width: 160 }}
                />
              </Box>
              <Box>
                <FieldLabel>Time</FieldLabel>
                <OutlinedInput
                  size="small" type="time"
                  value={schedule.eventTime}
                  onChange={e => onChange({ eventTime: e.target.value })}
                  slotProps={{ input: { style: { fontSize: 14 } } }}
                  sx={{ width: 120 }}
                />
              </Box>
            </Box>

            {/* Location */}
            <Box>
              <FieldLabel>Location</FieldLabel>
              <Box sx={{ display: 'flex', gap: 2.5, mb: 1.5 }}>
                {(['in-person', 'online', 'not-confirmed'] as EventLocationMode[]).map(mode => (
                  <Box
                    key={mode}
                    component="button"
                    onClick={() => onChange({ eventLocationMode: mode })}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, border: 'none', bgcolor: 'transparent', cursor: 'pointer', fontFamily: 'inherit', p: 0 }}
                  >
                    <RadioDot selected={schedule.eventLocationMode === mode} />
                    <Typography sx={{ fontSize: 14, color: 'text.primary' }}>
                      {mode === 'in-person' ? 'In person' : mode === 'online' ? 'Online' : 'Not yet confirmed'}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <AnimatedReveal show={schedule.eventLocationMode === 'in-person'}>
                {customLocation ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <OutlinedInput
                      fullWidth size="small"
                      value={schedule.eventLocationVenue}
                      onChange={e => onChange({ eventLocationVenue: e.target.value })}
                      placeholder="Venue name or address…"
                      slotProps={{ input: { style: { fontSize: 14 } } }}
                      autoFocus
                    />
                    <Box
                      component="button"
                      onClick={() => { setCustomLocation(false); onChange({ eventLocationVenue: '' }) }}
                      sx={{ border: 'none', bgcolor: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: 'text.secondary', whiteSpace: 'nowrap', px: 1, '&:hover': { color: 'text.primary' } }}
                    >
                      ← Pick from list
                    </Box>
                  </Box>
                ) : (
                  <Select
                    size="small" fullWidth displayEmpty
                    value={schedule.eventLocationVenue}
                    onChange={e => {
                      if (e.target.value === '__custom__') {
                        setCustomLocation(true)
                        onChange({ eventLocationVenue: '' })
                      } else {
                        onChange({ eventLocationVenue: e.target.value as string })
                      }
                    }}
                    sx={{ fontFamily: 'inherit' }}
                    renderValue={(val) => {
                      if (!val) return <Typography sx={{ fontSize: 14, color: 'text.disabled', fontFamily: 'inherit' }}>Select a venue…</Typography>
                      return <Typography sx={{ fontSize: 14, fontFamily: 'inherit' }}>{val}</Typography>
                    }}
                  >
                    {meetingLocations.map(loc => (
                      <MenuItem key={loc} value={loc} sx={{ fontSize: 14, fontFamily: 'inherit' }}>{loc}</MenuItem>
                    ))}
                    <MenuItem value="__custom__" sx={{ fontSize: 14, fontFamily: 'inherit', color: 'primary.main' }}>
                      + Enter a different address…
                    </MenuItem>
                  </Select>
                )}
              </AnimatedReveal>
              <AnimatedReveal show={schedule.eventLocationMode === 'online'}>
                <OutlinedInput
                  fullWidth size="small"
                  value={schedule.eventLocationVenue}
                  onChange={e => onChange({ eventLocationVenue: e.target.value })}
                  placeholder="Meeting link or platform…"
                  slotProps={{ input: { style: { fontSize: 14 } } }}
                />
              </AnimatedReveal>
            </Box>

            {/* Layer 2 + 3 — Results visibility */}
            <PublishVisibilityFields schedule={schedule} onChange={onChange} />

          </FormSection>
        </AnimatedReveal>

        {/* Path B — Auto-publish */}
        <AnimatedReveal show={schedule.resultsRevealMode === 'auto-publish'}>
          <FormSection>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box>
                <FieldLabel>Publish date</FieldLabel>
                <OutlinedInput
                  size="small" type="date"
                  value={schedule.publishAutoDate}
                  onChange={e => onChange({ publishAutoDate: e.target.value })}
                  slotProps={{ input: { style: { fontSize: 14 } } }}
                  sx={{ width: 160 }}
                />
              </Box>
              <Box>
                <FieldLabel>Publish time</FieldLabel>
                <OutlinedInput
                  size="small" type="time"
                  value={schedule.publishAutoTime}
                  onChange={e => onChange({ publishAutoTime: e.target.value })}
                  slotProps={{ input: { style: { fontSize: 14 } } }}
                  sx={{ width: 120 }}
                />
              </Box>
            </Box>
            <PublishVisibilityFields schedule={schedule} onChange={onChange} />
          </FormSection>
        </AnimatedReveal>
      </Box>

      {/* ── Submission window ── */}
      <FormSection title="Submission window">
        <Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box>
              <FieldLabel>Opens</FieldLabel>
              <OutlinedInput
                size="small"
                type="date"
                value={schedule.submissionsOpenDate}
                onChange={e => onChange({ submissionsOpenDate: e.target.value })}
                error={!!errors.submissionsOpenDate}
                slotProps={{ input: { style: { fontSize: 14 } } }}
                sx={{ width: 150 }}
              />
              {errors.submissionsOpenDate && (
                <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.5 }}>{errors.submissionsOpenDate}</Typography>
              )}
            </Box>
            <Box>
              <FieldLabel>Closes</FieldLabel>
              <OutlinedInput
                size="small"
                type="date"
                value={schedule.submissionsCloseDate}
                onChange={e => onChange({ submissionsCloseDate: e.target.value })}
                error={!!errors.submissionsCloseDate}
                slotProps={{ input: { style: { fontSize: 14 } } }}
                sx={{ width: 150 }}
              />
              {errors.submissionsCloseDate && (
                <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.5 }}>{errors.submissionsCloseDate}</Typography>
              )}
            </Box>
          </Box>
          <HintText>Displayed on the club calendar after publishing.</HintText>
        </Box>
      </FormSection>

      {/* ── Judge ── */}
      <FormSection title="Judge">
        <Box ref={judgeRef} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.from({ length: judgeCount }).map((_, i) => {
            const selectedId = schedule.judgeIds[i] ?? ''
            const oneOff     = i === 0 ? (schedule.judgeOneOff ?? null) : null

            const handleSelect = (id: string) => {
              const next = Array.from({ length: judgeCount }, (__, j) => schedule.judgeIds[j] ?? '')
              next[i] = id
              onChange({ judgeIds: next })
            }

            const handleOneOff = (data: OneOffJudge | null) => {
              if (i === 0) onChange({ judgeOneOff: data })
            }

            return (
              <JudgeSlot
                key={i}
                index={i}
                total={judgeCount}
                selectedId={selectedId}
                oneOff={oneOff}
                members={members}
                judgingOpenDate={schedule.judgingOpenDate}
                onSelect={handleSelect}
                onOneOff={handleOneOff}
              />
            )
          })}
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            Can be assigned later — required before the judging window opens.
          </Typography>
        </Box>
      </FormSection>

      {/* ── Judging window ── */}
      <FormSection title="Judging window">
        <Box>
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box>
              <FieldLabel>Opens</FieldLabel>
              <OutlinedInput
                size="small"
                type="date"
                value={schedule.judgingOpenDate}
                onChange={e => onChange({ judgingOpenDate: e.target.value })}
                slotProps={{ input: { style: { fontSize: 14 } } }}
                sx={{ width: 150 }}
              />
            </Box>
            <Box>
              <FieldLabel>Closes</FieldLabel>
              <OutlinedInput
                size="small"
                type="date"
                value={schedule.judgingCloseDate}
                onChange={e => onChange({ judgingCloseDate: e.target.value })}
                slotProps={{ input: { style: { fontSize: 14 } } }}
                sx={{ width: 150 }}
              />
            </Box>
          </Box>
          <HintText>Judging dates are internal and not shown to members.</HintText>
        </Box>
      </FormSection>

      {/* ── Publish info panel ── */}
      <InfoPanel hasJudge={hasJudge} />

    </Box>
  )
}

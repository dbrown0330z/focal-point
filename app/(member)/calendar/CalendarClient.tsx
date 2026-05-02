'use client'

import { useState, useTransition, useMemo } from 'react'
import { useTheme as useAppTheme } from '@/components/layout/ThemeProvider'
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import dayjs, { type Dayjs } from 'dayjs'
import { createEvent, type CalendarEvent, type CalendarEventType } from './actions'

// ─── Event type config ────────────────────────────────────────────────────────

export const EVENT_TYPES: {
  value: CalendarEventType
  label: string
  color: string        // chip background (light pastel for submission types)
  textColor: string    // text on chip bg
  lightBg: string      // subtle bg for hover / inactive button
  dotColor: string     // visible color dot in legend / list view
}[] = [
  { value: 'competition',      label: 'Competition',       color: '#1A6FC4',                      textColor: '#fff',    lightBg: 'rgba(26,111,196,0.12)',         dotColor: '#1A6FC4'                      },
  { value: 'regular_meeting',  label: 'Regular Meeting',   color: '#0097A7',                      textColor: '#fff',    lightBg: 'rgba(0,151,167,0.12)',          dotColor: '#0097A7'                      },
  { value: 'board_meeting',    label: 'Board Meeting',     color: '#6C47D4',                      textColor: '#fff',    lightBg: 'rgba(108,71,212,0.12)',         dotColor: '#6C47D4'                      },
  { value: 'field_trip',       label: 'Field Trip',        color: '#E65100',                      textColor: '#fff',    lightBg: 'rgba(230,81,0,0.12)',           dotColor: '#E65100'                      },
  { value: 'other',            label: 'Other',             color: '#5A7A96',                      textColor: '#fff',    lightBg: 'rgba(90,122,150,0.12)',         dotColor: '#5A7A96'                      },
  // Submission deadline types — light pastel bg with dark text
  { value: 'submission_open',  label: 'Submissions Open',  color: 'var(--status-success-bg)',     textColor: 'var(--status-success-text)', lightBg: 'rgba(46,125,50,0.12)',    dotColor: 'var(--status-success)' },
  { value: 'submission_closed',label: 'Submissions Closed',color: 'var(--status-error-bg)',       textColor: 'var(--status-error-text)',   lightBg: 'rgba(211,47,47,0.08)',    dotColor: 'var(--status-error)'   },
]

// Meeting types (excludes submission deadline types) for the type selector upper row
const MEETING_EVENT_TYPES = EVENT_TYPES.filter(t => t.value !== 'submission_open' && t.value !== 'submission_closed')


export function eventTypeConfig(type: CalendarEventType) {
  return EVENT_TYPES.find(t => t.value === type) ?? EVENT_TYPES[EVENT_TYPES.length - 1]
}

// ─── Theme factory — respects app dark/light mode ─────────────────────────────

function makeCalTheme(mode: 'light' | 'dark') {
  return createTheme({
    palette: {
      mode,
      primary:    { main: mode === 'dark' ? '#4A90D4' : '#1A6FC4' },
      secondary:  { main: mode === 'dark' ? '#6EA8D8' : '#5A7A96' },
      error:      { main: '#D32F2F' },
      background: {
        default: mode === 'dark' ? '#141414' : '#F5F5F5',
        paper:   mode === 'dark' ? '#1E1E1E' : '#FFFFFF',
      },
      text: {
        primary:   mode === 'dark' ? '#E8E8E8' : '#1A1A1A',
        secondary: mode === 'dark' ? '#9E9E9E' : '#696969',
      },
      divider: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.14)',
      action: {
        hover:    mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        selected: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      },
    },
    typography: {
      fontFamily: "var(--font-nunito, 'Nunito', system-ui, sans-serif)",
    },
    shape: { borderRadius: 8 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: '4px' },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { backgroundImage: 'none' },
        },
      },
    },
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function eventsForDay(events: CalendarEvent[], day: Date) {
  return events.filter(e => {
    const start = new Date(e.starts_at)
    return isSameDay(start, day)
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDateHeading(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}


// Upcoming events: today onwards, grouped by date
function groupUpcoming(events: CalendarEvent[]) {
  const today = startOfDay(new Date())
  const upcoming = events.filter(e => startOfDay(new Date(e.starts_at)) >= today)
  const groups: { date: Date; events: CalendarEvent[] }[] = []
  for (const ev of upcoming) {
    const d = startOfDay(new Date(ev.starts_at))
    const g = groups.find(g => isSameDay(g.date, d))
    if (g) g.events.push(ev)
    else groups.push({ date: d, events: [ev] })
  }
  return groups
}

// ─── Event chip / item ────────────────────────────────────────────────────────

// Dark-mode text/border for submission chips (light enough to read on dark surfaces)
const SUBMISSION_DARK: Record<string, { text: string; border: string }> = {
  submission_open:   { text: '#81C784', border: '#388E3C' },
  submission_closed: { text: '#E57373', border: '#C62828' },
}

function EventChip({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const conf = eventTypeConfig(event.event_type)
  const isSubmission = event.event_type === 'submission_open' || event.event_type === 'submission_closed'

  const darkConf = isSubmission ? SUBMISSION_DARK[event.event_type] : null
  const chipBg    = isDark && isSubmission ? 'transparent' : conf.color
  const chipColor = isDark && isSubmission ? darkConf!.text : conf.textColor
  const chipBorder = isSubmission
    ? `1px solid ${isDark ? darkConf!.border : conf.dotColor}60`
    : 'none'

  const timePrefix = event.all_day ? '' : `${formatTime(event.starts_at)} `
  const label = isSubmission && event.description ? (
    <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25 }}>
      <span>{timePrefix}{event.title}</span>
      <span style={{ fontSize: 10, opacity: 0.75 }}>{event.description}</span>
    </Box>
  ) : `${timePrefix}${event.title}`

  return (
    <Chip
      label={label}
      size="small"
      onClick={onClick}
      sx={{
        width: '100%',
        justifyContent: 'flex-start',
        fontSize: '12px',
        height: 'auto',
        mb: 0.25,
        cursor: 'pointer',
        bgcolor: chipBg,
        color: chipColor,
        border: chipBorder,
        '& .MuiChip-label': {
          px: 0.75,
          py: 0.25,
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          lineHeight: 1.3,
        },
      }}
    />
  )
}

// ─── Event detail dialog ──────────────────────────────────────────────────────

function GeoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, marginTop: 1 }}>
      <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.013 3.5-4.667 3.5-8.077A8.5 8.5 0 003.25 12.191c0 3.41 1.555 6.064 3.5 8.077a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.107.801zM12 13.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" clipRule="evenodd" />
    </svg>
  )
}

function EventDetailDialog({ event, onClose, locations }: { event: CalendarEvent; onClose: () => void; locations: LocationOption[] }) {
  const typeConf = eventTypeConfig(event.event_type)
  const locationMatch = event.location ? locations.find(l => l.name === event.location) : null
  const address = locationMatch?.address ?? null

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: typeConf.dotColor, flexShrink: 0 }} />
          {event.title}
        </Box>
        <Chip label={typeConf.label} size="small" sx={{ mt: 0.5, bgcolor: typeConf.color, color: typeConf.textColor, fontSize: 11, height: 20, borderRadius: '4px', border: `1px solid ${typeConf.dotColor}40` }} />
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {event.all_day
              ? new Date(event.starts_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              : `${formatTime(event.starts_at)}${event.ends_at ? ` – ${formatTime(event.ends_at)}` : ''}, ${new Date(event.starts_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`
            }
          </Typography>
          {event.location && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, color: 'text.secondary' }}>
              <GeoIcon />
              <Box>
                <Typography variant="body2" color="text.secondary">{event.location}</Typography>
                {address && (
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>{address}</Typography>
                )}
              </Box>
            </Box>
          )}
          {event.description && (
            <Typography variant="body2">{event.description}</Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" color="secondary" size="small">Close</Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Add event dialog ─────────────────────────────────────────────────────────
// Default: single day, timed (most common). Toggles for all-day and multi-day.

function TypeButton({ t, active, onClick }: {
  t: typeof EVENT_TYPES[number]
  active: boolean
  onClick: () => void
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        display: 'flex', alignItems: 'center', gap: 0.75,
        px: 1.5, py: 0.625,
        borderRadius: '6px',
        border: '1.5px solid',
        borderColor: active ? t.dotColor : 'divider',
        bgcolor: active ? t.color : 'transparent',
        color: active ? t.textColor : 'text.secondary',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        fontFamily: 'inherit',
        transition: 'all 0.15s',
        '&:hover': {
          borderColor: t.dotColor,
          bgcolor: active ? t.color : t.lightBg,
          color: active ? t.textColor : 'text.primary',
        },
      }}
    >
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: active ? t.textColor : t.dotColor, flexShrink: 0, opacity: active ? 0.85 : 1 }} />
      {t.label}
    </Box>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.75 }}>
      {children}
    </Typography>
  )
}

function AddEventDialog({ onClose, locations, timezone }: { onClose: () => void; locations: LocationOption[]; timezone: string }) {
  const [pending, startTransition] = useTransition()
  const [title, setTitle]         = useState('')
  const [description, setDesc]    = useState('')
  const [location, setLocation]   = useState<string | null>(null)
  const [allDay, setAllDay]       = useState(false)
  const [multiDay, setMultiDay]   = useState(false)
  const [eventType, setEventType] = useState<CalendarEventType>('regular_meeting')
  const [error, setError]         = useState<string | null>(null)

  const defaultStart = dayjs().hour(19).minute(0).second(0).millisecond(0)
  const [date,      setDate]      = useState<Dayjs | null>(dayjs())
  const [startTime, setStartTime] = useState<Dayjs | null>(defaultStart)
  const [endTime,   setEndTime]   = useState<Dayjs | null>(defaultStart.add(1, 'hour'))
  const [endDate,   setEndDate]   = useState<Dayjs | null>(dayjs())

  function handleAllDayChange(checked: boolean) {
    setAllDay(checked)
    if (!checked) setMultiDay(false)
  }

  function buildDateTime(d: Dayjs, t: Dayjs) {
    return d.hour(t.hour()).minute(t.minute()).second(0).millisecond(0)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !date) return

    let starts_at: string
    let ends_at: string

    if (allDay) {
      starts_at = date.startOf('day').toISOString()
      ends_at   = multiDay && endDate ? endDate.endOf('day').toISOString() : ''
    } else {
      starts_at = startTime ? buildDateTime(date, startTime).toISOString() : date.toISOString()
      ends_at   = endTime
        ? buildDateTime(multiDay && endDate ? endDate : date, endTime).toISOString()
        : ''
    }

    startTransition(async () => {
      const result = await createEvent({
        title, description, location: location ?? '', starts_at, ends_at, all_day: allDay, event_type: eventType,
      })
      if (result.error) setError(result.error)
      else onClose()
    })
  }

  const tfProps = { size: 'small' as const, fullWidth: true }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Add event</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1.5, pb: 2 }}>
          <Stack spacing={3}>

            {/* Title */}
            <Box>
              <FieldLabel>Event title</FieldLabel>
              <TextField
                value={title} onChange={e => setTitle(e.target.value)}
                required fullWidth size="small" autoFocus placeholder="e.g. Monthly Meeting"
              />
            </Box>

            {/* Event type */}
            <Box>
              <FieldLabel>Event type</FieldLabel>
              <Select
                size="small"
                fullWidth
                value={eventType}
                onChange={e => setEventType(e.target.value as CalendarEventType)}
              >
                {MEETING_EVENT_TYPES.map(t => (
                  <MenuItem key={t.value} value={t.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: t.dotColor, flexShrink: 0 }} />
                      {t.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {/* Date row */}
            <Box>
              <FieldLabel>{multiDay ? 'Start date' : 'Date'}</FieldLabel>
              <Stack direction="row" spacing={1.5}>
                <DatePicker
                  value={date}
                  onChange={setDate}
                  disablePast
                  slotProps={{ textField: tfProps }}
                />
                {multiDay && (
                  <DatePicker
                    label="End date"
                    value={endDate}
                    onChange={setEndDate}
                    disablePast
                    minDate={date ?? undefined}
                    slotProps={{ textField: tfProps }}
                  />
                )}
              </Stack>
            </Box>

            {/* Time row — hidden when all-day */}
            {!allDay && (
              <Box>
                <FieldLabel>Time</FieldLabel>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <TimePicker
                    value={startTime}
                    onChange={setStartTime}
                    slotProps={{ textField: tfProps }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>to</Typography>
                  <TimePicker
                    value={endTime}
                    onChange={setEndTime}
                    slotProps={{ textField: tfProps }}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                  {timezone}
                </Typography>
              </Box>
            )}

            {/* Options */}
            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={<Switch checked={allDay} onChange={e => handleAllDayChange(e.target.checked)} size="small" />}
                label={<Typography variant="body2">All day</Typography>}
              />
              <FormControlLabel
                control={<Switch checked={multiDay} onChange={e => setMultiDay(e.target.checked)} size="small" />}
                label={<Typography variant="body2">Multi-day</Typography>}
              />
            </Stack>

            {/* Location */}
            <Box>
              <FieldLabel>Location (optional)</FieldLabel>
              <Autocomplete
                freeSolo
                options={locations.map(l => l.name)}
                value={location}
                onChange={(_, val) => setLocation(val)}
                onInputChange={(_, val) => setLocation(val)}
                size="small"
                renderInput={params => (
                  <TextField {...params} fullWidth placeholder="Select or type a location" />
                )}
              />
            </Box>

            {/* Description */}
            <Box>
              <FieldLabel>Description (optional)</FieldLabel>
              <TextField
                value={description} onChange={e => setDesc(e.target.value)}
                fullWidth size="small" multiline rows={2}
                placeholder="Any additional details…"
              />
            </Box>

            {error && <Typography variant="body2" color="error">{error}</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} variant="outlined" color="secondary" size="small" disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" size="small" disabled={pending || !title.trim()}>
            {pending ? 'Saving…' : 'Save event'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

// ─── Event type legend ────────────────────────────────────────────────────────

function EventTypeLegend() {
  const meetingTypes    = EVENT_TYPES.filter(t => t.value !== 'submission_open' && t.value !== 'submission_closed')
  const submissionTypes = EVENT_TYPES.filter(t => t.value === 'submission_open' || t.value === 'submission_closed')
  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {meetingTypes.map(t => (
          <Box key={t.value} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: t.dotColor, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ fontSize: 12, color: 'text.secondary' }}>{t.label}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
        {submissionTypes.map(t => (
          <Box key={t.value} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: t.dotColor, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>{t.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

// ─── Month grid view ──────────────────────────────────────────────────────────

function MonthView({
  year,
  month,
  events,
  onEventClick,
}: {
  year: number
  month: number
  events: CalendarEvent[]
  onEventClick: (e: CalendarEvent) => void
}) {
  const today        = new Date()
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const startPad     = firstOfMonth.getDay() // 0=Sun

  const cells: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ]
  // Pad end to complete grid rows
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <Box>
      {/* Day headers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
        {DAYS.map(d => (
          <Typography key={d} variant="caption" sx={{ textAlign: 'center', fontWeight: 700, color: 'text.secondary', py: 0.5, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "var(--font-nunito, 'Nunito', system-ui, sans-serif)" }}>
            {d}
          </Typography>
        ))}
      </Box>

      {/* Day cells */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', bgcolor: 'divider', border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' }}>
        {cells.map((day, i) => {
          const isToday    = day ? isSameDay(day, today) : false
          const dayEvents  = day ? eventsForDay(events, day) : []

          return (
            <Box
              key={i}
              sx={{
                minHeight: 100,
                bgcolor: day ? 'background.paper' : 'background.default',
                p: 0.5,
              }}
            >
              {day && (
                <>
                  <Box sx={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 27, height: 27, borderRadius: '50%', mb: 0.25,
                    bgcolor: isToday ? 'primary.main' : 'transparent',
                  }}>
                    <Typography sx={{
                      fontSize: 12, fontWeight: isToday ? 700 : 400,
                      color: isToday ? '#fff' : 'text.primary',
                      lineHeight: 1,
                    }}>
                      {day.getDate()}
                    </Typography>
                  </Box>
                  {dayEvents.slice(0, 3).map(ev => (
                    <EventChip key={ev.id} event={ev} onClick={() => onEventClick(ev)} />
                  ))}
                  {dayEvents.length > 3 && (
                    <Typography sx={{ fontSize: 10, color: 'text.secondary', pl: 0.5 }}>
                      +{dayEvents.length - 3} more
                    </Typography>
                  )}
                </>
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({
  events,
  onEventClick,
}: {
  events: CalendarEvent[]
  onEventClick: (e: CalendarEvent) => void
}) {
  const groups = groupUpcoming(events)

  if (groups.length === 0) {
    return (
      <Paper variant="outlined" sx={{ py: 8, textAlign: 'center' }}>
        <Typography color="text.secondary">No upcoming events</Typography>
      </Paper>
    )
  }

  return (
    <Stack spacing={3}>
      {groups.map(({ date, events: dayEvents }) => (
        <Box key={date.toISOString()}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 11 }}>
            {formatDateHeading(date)}
          </Typography>
          <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
            {dayEvents.map((ev, i) => (
              <Box key={ev.id}>
                {i > 0 && <Divider />}
                <Box
                  onClick={() => onEventClick(ev)}
                  sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 2,
                    px: 2.5, py: 1.5, cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  {/* Time column */}
                  <Box sx={{ minWidth: 80, pt: 0.25 }}>
                    {ev.all_day ? (
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 600, fontSize: 12 }}>All day</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                        {formatTime(ev.starts_at)}
                        {ev.ends_at && <><br />{formatTime(ev.ends_at)}</>}
                      </Typography>
                    )}
                  </Box>

                  {/* Dot */}
                  <Box sx={{ mt: 0.75, width: 8, height: 8, borderRadius: '50%', bgcolor: eventTypeConfig(ev.event_type).dotColor, flexShrink: 0 }} />

                  {/* Content */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: 14 }}>{ev.title}</Typography>
                    {ev.location && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>📍 {ev.location}</Typography>
                    )}
                    {ev.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, mt: 0.25 }}>{ev.description}</Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </Paper>
        </Box>
      ))}
    </Stack>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type View = 'block' | 'list'

type LocationOption = { name: string; address: string | null }

export default function CalendarClient({
  events,
  isAdmin,
  locations,
  timezone,
}: {
  events: CalendarEvent[]
  isAdmin: boolean
  locations: LocationOption[]
  timezone: string
}) {
  const { theme: appTheme } = useAppTheme()
  const calTheme = useMemo(() => makeCalTheme(appTheme === 'dark' ? 'dark' : 'light'), [appTheme])

  const allEvents = useMemo(
    () => [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    [events]
  )

  const today = new Date()
  const [view, setView]               = useState<View>('block')
  const [year, setYear]               = useState(today.getFullYear())
  const [month, setMonth]             = useState(today.getMonth())
  const [addOpen, setAddOpen]         = useState(false)
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    <ThemeProvider theme={calTheme}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: 28, fontFamily: "var(--font-lora, 'Lora', Georgia, serif)", letterSpacing: '-0.02em' }}>
              Calendar
            </Typography>
            <Typography variant="body2" color="text.secondary">Club events and meetings</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* View toggle */}
            <Box sx={{ display: 'inline-flex' }}>
              {([
                { v: 'block', title: 'Month view', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/></svg> },
                { v: 'list',  title: 'List view',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg> },
              ] as const).map(({ v, title, icon }, i) => (
                <Tooltip key={v} title={title}>
                  <Box
                    component="button"
                    onClick={() => setView(v)}
                    aria-label={title}
                    sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      px: 1.25, py: 0.75,
                      background:   view === v ? 'var(--action-primary)' : 'transparent',
                      border:       `1px solid ${view === v ? 'var(--action-primary)' : 'var(--border-default)'}`,
                      borderRadius: i === 0 ? '7px 0 0 7px' : '0 7px 7px 0',
                      ml:           i > 0 ? '-1px' : 0,
                      cursor:       'pointer',
                      color:        view === v ? '#fff' : 'var(--text-tertiary)',
                      position:     'relative',
                      zIndex:       view === v ? 1 : 0,
                      transition:   'background 0.12s, color 0.12s',
                    }}
                  >
                    {icon}
                  </Box>
                </Tooltip>
              ))}
            </Box>

            {isAdmin && (
              <Button variant="contained" onClick={() => setAddOpen(true)}>
                + Add event
              </Button>
            )}
          </Box>
        </Box>

        {/* Month navigation (block view only) */}
        {view === 'block' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <IconButton
              size="small"
              onClick={prevMonth}
              aria-label="Previous month"
              sx={{ border: '1px solid', borderColor: 'divider', width: 34, height: 34, borderRadius: '8px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </IconButton>
            <Typography sx={{ fontWeight: 700, fontSize: 17, minWidth: 170, textAlign: 'center', fontFamily: "var(--font-lora, 'Lora', Georgia, serif)" }}>
              {MONTHS[month]} {year}
            </Typography>
            <IconButton
              size="small"
              onClick={nextMonth}
              aria-label="Next month"
              sx={{ border: '1px solid', borderColor: 'divider', width: 34, height: 34, borderRadius: '8px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </IconButton>
            <Button
              size="small" variant="outlined" color="secondary"
              onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()) }}
              sx={{ ml: 1, fontSize: 12 }}
            >
              Today
            </Button>
          </Box>
        )}

        {/* Calendar body */}
        {view === 'block'
          ? <><MonthView year={year} month={month} events={allEvents} onEventClick={setDetailEvent} /><EventTypeLegend /></>
          : <ListView events={allEvents} onEventClick={setDetailEvent} />
        }
      </Box>

      {/* Dialogs */}
      {addOpen    && <AddEventDialog onClose={() => setAddOpen(false)} locations={locations} timezone={timezone} />}
      {detailEvent && <EventDetailDialog event={detailEvent} onClose={() => setDetailEvent(null)} locations={locations} />}
    </ThemeProvider>
    </LocalizationProvider>
  )
}

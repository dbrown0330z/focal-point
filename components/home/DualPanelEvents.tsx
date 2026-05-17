'use client'

import { useState, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CEvent = {
  id: string; title: string; starts_at: string; ends_at: string | null
  all_day: boolean; event_type: string; location: string | null
}

// ─── Event type config — semi-transparent chips, full labels ─────────────────

const EVT: Record<string, { chipBg: string; chipText: string; label: string }> = {
  competition:       { chipBg: 'rgba(0,0,0,0.07)', chipText: 'var(--text-secondary)', label: 'Competition'       },
  regular_meeting:   { chipBg: 'rgba(0,0,0,0.07)', chipText: 'var(--text-secondary)', label: 'Meeting'           },
  board_meeting:     { chipBg: 'rgba(0,0,0,0.07)', chipText: 'var(--text-secondary)', label: 'Board meeting'     },
  field_trip:        { chipBg: 'rgba(0,0,0,0.07)', chipText: 'var(--text-secondary)', label: 'Field trip'        },
  other:             { chipBg: 'rgba(0,0,0,0.07)', chipText: 'var(--text-secondary)', label: 'Event'             },
  submission_open:   { chipBg: 'rgba(0,0,0,0.07)', chipText: 'var(--text-secondary)', label: 'Submission Open'   },
  submission_closed: { chipBg: 'rgba(0,0,0,0.07)', chipText: 'var(--text-secondary)', label: 'Submissions Close' },
}
const EVT_DEFAULT = { chipBg: 'rgba(0,0,0,0.07)', chipText: 'var(--text-secondary)', label: 'Event' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBadge(iso: string) {
  const d = new Date(iso)
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day:   d.getDate(),
  }
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function fmtFullDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

// ─── Event detail modal ───────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  )
}
function PinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z" /><circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

function EventModal({ event, onClose }: { event: CEvent; onClose: () => void }) {
  const cfg      = EVT[event.event_type] ?? EVT_DEFAULT
  const fullDate = fmtFullDate(event.starts_at)
  const startTime = event.all_day ? null : fmtTime(event.starts_at)
  const endTime   = (!event.all_day && event.ends_at) ? fmtTime(event.ends_at) : null

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:   'var(--surface-2)',
          borderRadius: 14,
          padding:      '24px 28px',
          maxWidth:     420,
          width:        '100%',
          boxShadow:    '0 24px 64px rgba(0,0,0,0.28), 0 8px 24px rgba(0,0,0,0.14)',
        }}
      >
        {/* Type chip */}
        <span style={{
          display:       'inline-block',
          fontSize:      11,
          fontWeight:    600,
          background:    cfg.chipBg,
          color:         cfg.chipText,
          borderRadius:  4,
          padding:       '3px 8px',
          marginBottom:  14,
          letterSpacing: '0.02em',
        }}>
          {cfg.label}
        </span>

        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
          <h3 style={{
            fontFamily: 'var(--font-lora, Georgia, serif)',
            fontSize:   20,
            fontWeight: 700,
            color:      'var(--text-primary)',
            lineHeight: 1.3,
          }}>
            {event.title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              flexShrink:  0,
              background:  'none',
              border:      'none',
              cursor:      'pointer',
              padding:     4,
              color:       'var(--text-tertiary)',
              fontSize:    18,
              lineHeight:  1,
              marginTop:   2,
            }}
          >
            ✕
          </button>
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarIcon />
            <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{fullDate}</span>
          </div>

          {event.all_day ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ClockIcon />
              <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic' }}>All day</span>
            </div>
          ) : startTime ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ClockIcon />
              <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                {startTime}{endTime ? ` – ${endTime}` : ''}
              </span>
            </div>
          ) : null}

          {event.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <PinIcon />
              <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{event.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function DualPanelEvents({ events }: { events: CEvent[] }) {
  const [selected,  setSelected]  = useState<CEvent | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (events.length === 0) {
    return <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No upcoming events scheduled.</p>
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {events.map((ev, i) => {
          const cfg            = EVT[ev.event_type] ?? EVT_DEFAULT
          const { month, day } = fmtBadge(ev.starts_at)
          const time           = ev.all_day ? null : fmtTime(ev.starts_at)
          const isHovered      = hoveredId === ev.id

          return (
            <div key={ev.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setSelected(ev)}
                onMouseEnter={() => setHoveredId(ev.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          10,
                  width:        '100%',
                  padding:      '9px 6px',
                  margin:       '0 -6px',
                  width:        'calc(100% + 12px)',
                  background:   isHovered ? 'var(--surface-1)' : 'none',
                  border:       'none',
                  borderRadius: 6,
                  cursor:       'pointer',
                  textAlign:    'left',
                  transition:   'background 0.12s ease',
                }}
              >
                {/* Date badge */}
                <div style={{
                  flexShrink:  0,
                  width:       42,
                  textAlign:   'center',
                  background:  'var(--surface-1)',
                  borderRadius: 6,
                  padding:     '5px 0 6px',
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--action-primary)', textTransform: 'uppercase' }}>
                    {month}
                  </div>
                  <div style={{ fontFamily: 'var(--font-lora, Georgia, serif)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                    {day}
                  </div>
                </div>

                {/* Event info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ev.title}
                  </p>
                  {(time || ev.location) && (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {time ?? ''}
                      {time && ev.location ? ' · ' : ''}
                      {ev.location ?? ''}
                    </p>
                  )}
                </div>

                {/* Type chip */}
                <span style={{
                  flexShrink:    0,
                  fontSize:      11,
                  fontWeight:    600,
                  background:    cfg.chipBg,
                  color:         cfg.chipText,
                  borderRadius:  4,
                  padding:       '3px 8px',
                  letterSpacing: '0.02em',
                }}>
                  {cfg.label}
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {selected && <EventModal event={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

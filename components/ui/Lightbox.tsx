'use client'

import { useState, useEffect, useCallback } from 'react'
import { buildExifRows } from '@/lib/exif'

// ─── Types ────────────────────────────────────────────────────────────────────

export type LightboxSubmission =
  | { status: 'available'; onSubmit: () => void }
  | { status: 'submitted'; competitionName: string; categoryName: string; closesAt: string; onWithdraw: () => void }
  | { status: 'judging';   competitionName: string; categoryName: string }
  | { status: 'judged';    competitionName: string; categoryName: string; score: number }

export type LightboxImage = {
  src:          string
  title?:       string
  subtitle?:    string
  exifData?:    Record<string, unknown> | null
  submission?:  LightboxSubmission
}

// ─── Panel heading ─────────────────────────────────────────────────────────────

function PanelHeading({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize:        10,
      fontWeight:      700,
      letterSpacing:   '0.08em',
      textTransform:   'uppercase',
      color:           'rgba(255,255,255,0.40)',
      marginBottom:    12,
      margin:          0,
      paddingBottom:   12,
    }}>
      {children}
    </p>
  )
}

// ─── Submission box ────────────────────────────────────────────────────────────

function SubmissionBox({ sub }: { sub: LightboxSubmission }) {
  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (sub.status === 'available') {
    return (
      <div style={{
        background:   'rgba(255,255,255,0.05)',
        border:       '1px solid rgba(255,255,255,0.10)',
        borderRadius: 10,
        padding:      '14px 16px',
      }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 12, lineHeight: 1.5 }}>
          This image is available to enter in the current competition.
        </p>
        <button
          onClick={sub.onSubmit}
          style={{
            width:        '100%',
            background:   'var(--action-primary, #1A6FC4)',
            border:       'none',
            borderRadius: 8,
            padding:      '9px 0',
            fontSize:     13,
            fontWeight:   700,
            color:        '#fff',
            cursor:       'pointer',
          }}
          onMouseEnter={e => ((e.target as HTMLElement).style.background = 'var(--action-primary-hover, #155AA3)')}
          onMouseLeave={e => ((e.target as HTMLElement).style.background = 'var(--action-primary, #1A6FC4)')}
        >
          Submit to competition →
        </button>
      </div>
    )
  }

  // Shared: competition + category rows
  const metaRows = (
    <dl style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
      <div>
        <dt style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Competition</dt>
        <dd style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.4 }}>{sub.competitionName}</dd>
      </div>
      <div>
        <dt style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Category</dt>
        <dd style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.4 }}>{sub.categoryName}</dd>
      </div>
    </dl>
  )

  if (sub.status === 'submitted') {
    return (
      <div style={{
        background:   'rgba(255,255,255,0.04)',
        border:       '1px solid rgba(255,255,255,0.09)',
        borderRadius: 10,
        padding:      '14px 16px',
      }}>
        <PanelHeading>Submitted</PanelHeading>
        {metaRows}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Closes {fmtDate(sub.closesAt)}
          </p>
          <button
            onClick={sub.onWithdraw}
            style={{ fontSize: 12, fontWeight: 600, color: 'rgba(220,80,80,0.85)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
            onMouseEnter={e => ((e.target as HTMLElement).style.color = 'rgba(220,80,80,1)')}
            onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(220,80,80,0.85)')}
          >
            Withdraw
          </button>
        </div>
      </div>
    )
  }

  if (sub.status === 'judging') {
    return (
      <div style={{
        background:   'rgba(255,255,255,0.04)',
        border:       '1px solid rgba(255,255,255,0.09)',
        borderRadius: 10,
        padding:      '14px 16px',
      }}>
        <PanelHeading>Submitted</PanelHeading>
        {metaRows}
        <div style={{ marginTop: 14, borderRadius: 7, padding: '8px 12px', background: 'rgba(166,124,0,0.18)', border: '1px solid rgba(166,124,0,0.35)' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(250,216,74,0.90)', margin: 0 }}>
            Judging in progress
          </p>
        </div>
      </div>
    )
  }

  // judged
  return (
    <div style={{
      background:   'rgba(255,255,255,0.04)',
      border:       '1px solid rgba(255,255,255,0.09)',
      borderRadius: 10,
      padding:      '14px 16px',
    }}>
      <PanelHeading>Submitted</PanelHeading>
      {metaRows}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Score</p>
        <p style={{ fontSize: 40, fontWeight: 700, color: 'rgba(255,255,255,0.95)', lineHeight: 1, margin: 0, fontFamily: 'var(--font-lora, Georgia, serif)' }}>
          {sub.score.toFixed(1)}
        </p>
      </div>
    </div>
  )
}

// ─── EXIF box ─────────────────────────────────────────────────────────────────

function ExifBox({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div style={{
      background:   'rgba(255,255,255,0.04)',
      border:       '1px solid rgba(255,255,255,0.09)',
      borderRadius: 10,
      padding:      '14px 16px',
    }}>
      <PanelHeading>EXIF Data</PanelHeading>
      <dl style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map(({ label, value }) => (
          <div key={label}>
            <dt style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>
              {label}
            </dt>
            <dd style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', margin: 0, lineHeight: 1.4 }}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// ─── Main Lightbox ─────────────────────────────────────────────────────────────

export function Lightbox({
  images,
  startIndex = 0,
  onClose,
  contextTitle,
}: {
  images:        LightboxImage[]
  startIndex?:   number
  onClose:       () => void
  contextTitle?: string
}) {
  const [index, setIndex] = useState(startIndex)
  const current = images[index]
  const multi   = images.length > 1

  const prev = useCallback(() => setIndex(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIndex(i => (i + 1) % images.length),                 [images.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, prev, next])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!current) return null

  const exifRows = current.exifData ? buildExifRows(current.exifData) : []
  const hasPanel = Boolean(current.submission) || exifRows.length > 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         2000,
        background:     'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(4px)',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
      }}
    >
      {/* ── Top bar ── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position:       'absolute',
          top:            0,
          left:           0,
          right:          0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '14px 20px',
          zIndex:         10,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.65)' }}>
          {contextTitle ?? ''}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)' }}>
            ESC
          </span>
          <button
            onClick={onClose}
            aria-label="Close lightbox"
            style={{
              background:   'none',
              border:       'none',
              cursor:       'pointer',
              color:        'rgba(255,255,255,0.80)',
              fontSize:     22,
              lineHeight:   1,
              padding:      4,
              borderRadius: 4,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display:       'flex',
          flexDirection: 'row',
          alignItems:    'flex-start',
          gap:           0,
          maxWidth:      '95vw',
          maxHeight:     '85vh',
          borderRadius:  12,
          overflow:      'hidden',
        }}
      >
        {/* ── Image column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.src}
              alt={current.title ?? ''}
              style={{
                maxHeight:    '80vh',
                maxWidth:     hasPanel ? '65vw' : '90vw',
                objectFit:    'contain',
                borderRadius: hasPanel ? '12px 0 0 12px' : 12,
                display:      'block',
              }}
            />

            {multi && index > 0 && (
              <button
                aria-label="Previous image"
                onClick={e => { e.stopPropagation(); prev() }}
                style={{
                  position:     'absolute',
                  left:         12,
                  top:          '50%',
                  transform:    'translateY(-50%)',
                  background:   'rgba(0,0,0,0.55)',
                  border:       '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 8,
                  color:        'rgba(255,255,255,0.90)',
                  cursor:       'pointer',
                  padding:      '10px 14px',
                  fontSize:     20,
                  lineHeight:   1,
                  zIndex:       10,
                }}
              >
                ‹
              </button>
            )}

            {multi && index < images.length - 1 && (
              <button
                aria-label="Next image"
                onClick={e => { e.stopPropagation(); next() }}
                style={{
                  position:     'absolute',
                  right:        12,
                  top:          '50%',
                  transform:    'translateY(-50%)',
                  background:   'rgba(0,0,0,0.55)',
                  border:       '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 8,
                  color:        'rgba(255,255,255,0.90)',
                  cursor:       'pointer',
                  padding:      '10px 14px',
                  fontSize:     20,
                  lineHeight:   1,
                  zIndex:       10,
                }}
              >
                ›
              </button>
            )}
          </div>

          {/* Caption */}
          {(current.title || current.subtitle) && (
            <div style={{ textAlign: 'center', maxWidth: 600, lineHeight: 1.4 }}>
              {current.title && (
                <p style={{ fontSize: 17, fontWeight: 600, color: 'rgba(255,255,255,0.95)', margin: 0 }}>
                  {current.title}
                </p>
              )}
              {current.subtitle && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.60)', marginTop: 4, marginBottom: 0 }}>
                  {current.subtitle}
                </p>
              )}
            </div>
          )}

          {/* Dots */}
          {multi && (
            <div style={{ display: 'flex', gap: 6 }}>
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setIndex(i) }}
                  aria-label={`Go to image ${i + 1}`}
                  style={{
                    height:       8,
                    width:        i === index ? 20 : 8,
                    borderRadius: 9999,
                    background:   i === index ? 'white' : 'rgba(255,255,255,0.35)',
                    border:       'none',
                    cursor:       'pointer',
                    padding:      0,
                    transition:   'width 0.15s, background 0.15s',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        {hasPanel && (
          <div
            style={{
              width:        270,
              maxHeight:    '80vh',
              overflowY:    'auto',
              background:   'rgba(18,18,18,0.97)',
              borderLeft:   '1px solid rgba(255,255,255,0.08)',
              borderRadius: '0 12px 12px 0',
              padding:      '18px 16px',
              flexShrink:   0,
              display:      'flex',
              flexDirection:'column',
              gap:          12,
            }}
          >
            {current.submission && (
              <SubmissionBox sub={current.submission} />
            )}
            {exifRows.length > 0 && (
              <ExifBox rows={exifRows} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

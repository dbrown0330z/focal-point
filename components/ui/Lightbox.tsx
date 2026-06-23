'use client'

import { useState, useEffect, useCallback } from 'react'
import { buildExifRows } from '@/lib/exif'

export type LightboxImage = {
  src:              string
  title?:           string
  subtitle?:        string   // maker name, category, or omit for own-image galleries
  score?:           number | null
  exifData?:        Record<string, unknown> | null
  competitionDate?: string | null
  categoryName?:    string | null
}

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

  const exifRows  = current.exifData ? buildExifRows(current.exifData) : []
  const hasCompMeta = Boolean(current.competitionDate || current.categoryName)
  const hasPanel  = hasCompMeta || current.score != null || exifRows.length > 0

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
                  position:   'absolute',
                  left:       12,
                  top:        '50%',
                  transform:  'translateY(-50%)',
                  background: 'rgba(0,0,0,0.55)',
                  border:     '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 8,
                  color:      'rgba(255,255,255,0.90)',
                  cursor:     'pointer',
                  padding:    '10px 14px',
                  fontSize:   20,
                  lineHeight: 1,
                  zIndex:     10,
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
                  position:   'absolute',
                  right:      12,
                  top:        '50%',
                  transform:  'translateY(-50%)',
                  background: 'rgba(0,0,0,0.55)',
                  border:     '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 8,
                  color:      'rgba(255,255,255,0.90)',
                  cursor:     'pointer',
                  padding:    '10px 14px',
                  fontSize:   20,
                  lineHeight: 1,
                  zIndex:     10,
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

        {/* ── Right panel: score + EXIF ── */}
        {hasPanel && (
          <div
            style={{
              width:        260,
              maxHeight:    '80vh',
              overflowY:    'auto',
              background:   'rgba(18,18,18,0.97)',
              borderLeft:   '1px solid rgba(255,255,255,0.08)',
              borderRadius: '0 12px 12px 0',
              padding:      '20px 18px',
              flexShrink:   0,
            }}
          >
            {/* Competition metadata */}
            {hasCompMeta && (
              <div style={{ marginBottom: 20 }}>
                {current.competitionDate && (
                  <div style={{ marginBottom: current.categoryName ? 12 : 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>
                      Competition
                    </p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', margin: 0 }}>
                      {current.competitionDate}
                    </p>
                  </div>
                )}
                {current.categoryName && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>
                      Category
                    </p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', margin: 0 }}>
                      {current.categoryName}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Divider after comp metadata */}
            {hasCompMeta && (current.score != null || exifRows.length > 0) && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 }} />
            )}

            {/* Score */}
            {current.score != null && (
              <div style={{ marginBottom: exifRows.length > 0 ? 20 : 0 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
                  Score
                </p>
                <p style={{ fontSize: 36, fontWeight: 700, color: 'rgba(255,255,255,0.95)', lineHeight: 1, fontFamily: 'var(--font-lora, Georgia, serif)' }}>
                  {current.score.toFixed(1)}
                </p>
              </div>
            )}

            {/* Divider between score and EXIF */}
            {current.score != null && exifRows.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 }} />
            )}

            {/* EXIF */}
            {exifRows.length > 0 && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>
                  EXIF Data
                </p>
                <dl style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {exifRows.map(({ label, value }) => (
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
            )}
          </div>
        )}
      </div>
    </div>
  )
}

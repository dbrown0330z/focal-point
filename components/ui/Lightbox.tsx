'use client'

import { useState, useEffect, useCallback } from 'react'

export type LightboxImage = {
  src:       string
  title?:    string
  subtitle?: string   // maker name, category, or omit for own-image galleries
}

// ─── Shared Lightbox ──────────────────────────────────────────────────────────
//
// Usage:
//   import { Lightbox, type LightboxImage } from '@/components/ui/Lightbox'
//
//   <Lightbox
//     images={[{ src, title, subtitle }]}
//     startIndex={idx}
//     onClose={() => setIdx(null)}
//     contextTitle="Gallery Snapshot · Recent uploads"
//   />
//
// contextTitle  → shown top-left (e.g. "My Submissions · May 2026 Salon")
// subtitle      → second caption line; omit entirely for own-image galleries

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

      {/* ── Image + caption + dots ── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            12,
          padding:        '0 56px',
          maxWidth:       '100%',
        }}
      >
        {/* Image with inset prev/next */}
        <div style={{ position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.src}
            alt={current.title ?? ''}
            style={{
              maxHeight:   '80vh',
              maxWidth:    '90vw',
              objectFit:   'contain',
              borderRadius: 12,
              display:     'block',
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
                transition: 'background 0.15s',
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
                transition: 'background 0.15s',
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
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

export type GalleryImage = { id: string; publicUrl: string; title: string }

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images:     GalleryImage[]
  startIndex: number
  onClose:    () => void
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

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const btnBase: React.CSSProperties = {
    position:   'absolute',
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
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position:        'fixed',
        inset:           0,
        zIndex:          2000,
        background:      'rgba(0,0,0,0.92)',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
      }}
    >
      {/* Top bar: counter + close */}
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
        {multi ? (
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
            {index + 1} / {images.length}
          </span>
        ) : <span />}
        <button
          onClick={onClose}
          aria-label="Close"
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

      {/* Image + caption */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '0 56px' }}
      >
        <div style={{ position: 'relative', width: '90vw', maxWidth: 1100, height: '75vh' }}>
          <Image
            key={current.publicUrl}
            src={current.publicUrl}
            alt={current.title}
            fill
            style={{ objectFit: 'contain' }}
            sizes="(max-width: 1200px) 90vw, 1100px"
            priority
          />
        </div>
        {current.title && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center', maxWidth: 600, lineHeight: 1.4 }}>
            {current.title}
          </p>
        )}
      </div>

      {/* Prev / Next */}
      {multi && (
        <>
          <button
            aria-label="Previous image"
            onClick={e => { e.stopPropagation(); prev() }}
            style={{ ...btnBase, left: 16 }}
          >
            ‹
          </button>
          <button
            aria-label="Next image"
            onClick={e => { e.stopPropagation(); next() }}
            style={{ ...btnBase, right: 16 }}
          >
            ›
          </button>
        </>
      )}
    </div>
  )
}

// ─── Grid 8 ───────────────────────────────────────────────────────────────────

export function Grid8Gallery({
  images,
  galleryName,
  galleryHref,
}: {
  images:       GalleryImage[]
  galleryName?: string
  galleryHref?: string
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const shown = images.slice(0, 8)

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {shown.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setLightboxIndex(i)}
            className="aspect-square rounded-lg overflow-hidden block"
            style={{ background: 'var(--surface-1)', cursor: 'zoom-in', padding: 0, border: 'none' }}
            aria-label={`View ${img.title}`}
          >
            <Image
              src={img.publicUrl}
              alt={img.title}
              width={400}
              height={400}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Gallery attribution */}
      {galleryName && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            From <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{galleryName}</span>
            {' · '}{shown.length} image{shown.length !== 1 ? 's' : ''}
          </p>
          {galleryHref && (
            <a
              href={galleryHref}
              style={{ fontSize: 12, fontWeight: 500, color: 'var(--action-primary)', textDecoration: 'none', flexShrink: 0 }}
            >
              View full gallery →
            </a>
          )}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={shown}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}

// ─── Strip 8 ─────────────────────────────────────────────────────────────────

export function Strip8Gallery({ images }: { images: GalleryImage[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const shown = images.slice(0, 8)

  return (
    <>
      <div
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {shown.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setLightboxIndex(i)}
            className="flex-shrink-0 rounded-lg overflow-hidden block"
            style={{ width: 140, height: 140, background: 'var(--surface-1)', cursor: 'zoom-in', padding: 0, border: 'none' }}
            aria-label={`View ${img.title}`}
          >
            <Image
              src={img.publicUrl}
              alt={img.title}
              width={280}
              height={280}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={shown}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}

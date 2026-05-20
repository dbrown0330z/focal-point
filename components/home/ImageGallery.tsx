'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Lightbox, type LightboxImage } from '@/components/ui/Lightbox'

export type GalleryImage = {
  id:        string
  publicUrl: string
  title:     string
  maker?:    string
  date?:     string       // e.g. "March 2025"
  category?: string
  score?:    number
}

// ─── Grid 8 ───────────────────────────────────────────────────────────────────

export function Grid8Gallery({
  images,
  galleryName,
  galleryHref,
  totalImages,
}: {
  images:        GalleryImage[]
  galleryName?:  string
  galleryHref?:  string
  totalImages?:  number
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const shown = images.slice(0, 6)
  const total = totalImages ?? shown.length

  return (
    <>
      {/* Sub-header: source label + link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        {galleryName && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
            {galleryName} · {total} image{total !== 1 ? 's' : ''}
          </p>
        )}
        {galleryHref && (
          <a href={galleryHref} style={{ fontSize: 13, fontWeight: 500, color: 'var(--action-primary)', textDecoration: 'none', flexShrink: 0 }}>
            View full gallery →
          </a>
        )}
      </div>

      {/* 3×2 dark card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {shown.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setLightboxIndex(i)}
            aria-label={`View ${img.title}`}
            style={{
              position:    'relative',
              display:     'flex',
              flexDirection: 'column',
              background:  '#111',
              borderRadius: 12,
              overflow:    'hidden',
              cursor:      'zoom-in',
              padding:     0,
              border:      '1px solid rgba(255,255,255,0.07)',
              textAlign:   'left',
            }}
          >
            {/* Image */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', flexShrink: 0 }}>
              <Image
                src={img.publicUrl}
                alt={img.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                style={{ objectFit: 'cover', transition: 'transform 0.3s ease' }}
                className="gallery-card-img"
              />
            </div>

            {/* Info bar */}
            <div style={{
              padding:    '10px 12px',
              display:    'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap:        8,
              flex:       1,
            }}>
              {/* Left: title + byline */}
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontSize:    13,
                  fontWeight:  600,
                  color:       'rgba(255,255,255,0.92)',
                  lineHeight:  1.3,
                  margin:      0,
                  overflow:    'hidden',
                  textOverflow:'ellipsis',
                  whiteSpace:  'nowrap',
                }}>
                  {img.title}
                </p>
                {(img.maker || img.date) && (
                  <p style={{
                    fontSize:  11,
                    color:     'rgba(255,255,255,0.42)',
                    margin:    '3px 0 0',
                    lineHeight: 1.2,
                    overflow:   'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {[img.maker, img.date].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>

              {/* Right: category + score */}
              {(img.category || img.score != null) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  {img.category && (
                    <span style={{
                      fontSize:     11,
                      fontWeight:   500,
                      color:        'rgba(255,255,255,0.65)',
                      border:       '1px solid rgba(255,255,255,0.18)',
                      borderRadius: 9999,
                      padding:      '2px 8px',
                      whiteSpace:   'nowrap',
                    }}>
                      {img.category}
                    </span>
                  )}
                  {img.score != null && (
                    <span style={{
                      fontSize:     12,
                      fontWeight:   600,
                      color:        'color-mix(in srgb, var(--action-primary) 85%, white)',
                      background:   'color-mix(in srgb, var(--action-primary) 22%, transparent)',
                      border:       '1px solid color-mix(in srgb, var(--action-primary) 50%, transparent)',
                      borderRadius: 9999,
                      padding:      '2px 8px',
                      whiteSpace:   'nowrap',
                    }}>
                      {img.score % 1 === 0 ? img.score : img.score.toFixed(1)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <style>{`
        .gallery-card-img { transition: transform 0.3s ease; }
        button:hover .gallery-card-img { transform: scale(1.04); }
      `}</style>

      {lightboxIndex !== null && (
        <Lightbox
          images={shown.map((img): LightboxImage => ({ src: img.publicUrl, title: img.title, subtitle: img.maker }))}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          contextTitle={galleryName ? `Gallery Snapshot · ${galleryName}` : 'Gallery Snapshot'}
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
            className="img-card flex-shrink-0 rounded-lg block"
            style={{ width: 140, height: 140, background: 'var(--surface-1)', cursor: 'zoom-in', padding: 0, border: 'none' }}
            aria-label={`View ${img.title}`}
          >
            <Image
              src={img.publicUrl}
              alt={img.title}
              width={280}
              height={280}
              className="img-card-img w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={shown.map((img): LightboxImage => ({ src: img.publicUrl, title: img.title, subtitle: img.maker }))}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          contextTitle="Member Photos"
        />
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Lightbox, type LightboxImage } from '@/components/ui/Lightbox'

export type GalleryImage = { id: string; publicUrl: string; title: string; maker?: string }

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
  const shown = images.slice(0, 8)
  const total = totalImages ?? shown.length

  return (
    <>
      {/* Header: title + "View full gallery →" */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-lora, Georgia, serif)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)', lineHeight: 1.3, margin: 0 }}>
            Gallery Snapshot
          </h2>
          {galleryName && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
              {galleryName} · {total} image{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {galleryHref && (
          <a
            href={galleryHref}
            style={{ fontSize: 13, fontWeight: 500, color: 'var(--action-primary)', textDecoration: 'none', flexShrink: 0, marginTop: 2 }}
          >
            View full gallery →
          </a>
        )}
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {shown.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setLightboxIndex(i)}
            className="img-card relative aspect-square rounded-lg block"
            style={{ background: 'var(--surface-1)', cursor: 'zoom-in', padding: 0, border: 'none' }}
            aria-label={`View ${img.title}`}
          >
            <Image
              src={img.publicUrl}
              alt={img.title}
              width={400}
              height={400}
              className="img-card-img w-full h-full object-cover"
            />
            {/* Hover overlay: title + maker */}
            <div
              className="img-card-overlay absolute inset-0 flex flex-col justify-end p-2.5"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)' }}
            >
              <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.95)', lineHeight: 1.3, textAlign: 'left' }}>
                {img.title}
              </p>
              {img.maker && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2, textAlign: 'left', lineHeight: 1.2 }}>
                  {img.maker}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

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

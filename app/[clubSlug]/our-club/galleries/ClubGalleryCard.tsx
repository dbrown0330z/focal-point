'use client'

import { useState } from 'react'

type Filters = {
  memberIds?:  'all' | string[]
  scoreMin?:   number
  categories?: string[]
  timeframe?:  'all_years' | 'this_year'
} | null

function formatFilters(filters: Filters): string | null {
  if (!filters) return null
  const parts: string[] = []
  if (filters.scoreMin != null && filters.scoreMin > 0) {
    parts.push(`Score ≥ ${filters.scoreMin}`)
  }
  if (filters.categories && filters.categories.length > 0) {
    parts.push(filters.categories.join(', '))
  } else {
    parts.push('All categories')
  }
  if (filters.timeframe === 'this_year') {
    parts.push('This year')
  } else {
    parts.push('All years')
  }
  if (filters.memberIds === 'all' || !filters.memberIds) {
    parts.push('All members')
  } else if (Array.isArray(filters.memberIds)) {
    parts.push(`${filters.memberIds.length} member${filters.memberIds.length !== 1 ? 's' : ''}`)
  }
  return parts.join(' · ')
}

export default function ClubGalleryCard({
  gallery,
  clubSlug,
}: {
  gallery: {
    id:        string
    name:      string
    slug:      string
    imageCount: number
    coverUrl:  string | null
    filters:   Filters
  }
  clubSlug: string
}) {
  const [hovered, setHovered] = useState(false)
  const [tipVisible, setTipVisible] = useState(false)
  const configText = formatFilters(gallery.filters)
  const href = `/${clubSlug}/gallery/${gallery.slug}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderRadius:  14,
          overflow:      'hidden',
          border:        '1px solid var(--border-default)',
          background:    'var(--surface-1)',
          cursor:        'pointer',
          transition:    'box-shadow 0.15s',
          boxShadow:     hovered ? '0 4px 16px rgba(0,0,0,0.12)' : 'none',
        }}
      >
        {/* Cover */}
        <div style={{ aspectRatio: '3/2', background: 'var(--surface-0)', position: 'relative', overflow: 'hidden' }}>
          {gallery.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gallery.coverUrl}
              alt={gallery.name}
              style={{
                width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                transition: 'transform 0.25s ease',
                transform: hovered ? 'scale(1.03)' : 'scale(1)',
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>No cover</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '14px 16px' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px', lineHeight: 1.2 }}>
            {gallery.name}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: 0 }}>
              {gallery.imageCount} photo{gallery.imageCount !== 1 ? 's' : ''}
            </p>

            {configText && (
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span
                  onMouseEnter={() => setTipVisible(true)}
                  onMouseLeave={() => setTipVisible(false)}
                  style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
                    textTransform: 'uppercase', color: 'var(--action-primary)',
                    cursor: 'default', borderBottom: '1px dashed var(--action-primary)',
                    paddingBottom: 1,
                  }}
                >
                  Configuration
                </span>
                {tipVisible && (
                  <span style={{
                    position:     'absolute',
                    bottom:       'calc(100% + 8px)',
                    left:         '50%',
                    transform:    'translateX(-50%)',
                    background:   '#1E1E1E',
                    color:        '#fff',
                    fontSize:     12,
                    lineHeight:   1.5,
                    padding:      '7px 12px',
                    borderRadius: 8,
                    whiteSpace:   'nowrap',
                    pointerEvents:'none',
                    zIndex:       50,
                    boxShadow:    '0 4px 16px rgba(0,0,0,0.4)',
                  }}>
                    {configText}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  )
}

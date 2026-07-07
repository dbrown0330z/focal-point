'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Lightbox, type LightboxImage } from '@/components/ui/Lightbox'
import { updateDisplaySettings } from '@/app/[clubSlug]/(member)/library/galleries/actions'
import type { DisplaySettings } from '@/app/[clubSlug]/(member)/library/galleries/actions'

// ─── Types ────────────────────────────────────────────────────────────────────

type GalleryImage = {
  id:       string
  title:    string
  publicUrl: string
  score:    number | null
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

const COLUMN_COUNT: Record<DisplaySettings['density'], number> = {
  compact:  5,
  default:  4,
  spacious: 3,
}

const GAP_PX: Record<DisplaySettings['spacing'], number> = {
  none:     0,
  small:    6,
  standard: 14,
}

const CORNER_RADIUS: Record<DisplaySettings['corners'], number> = {
  rounded: 12,
  square:  0,
}

// ─── Display panel ────────────────────────────────────────────────────────────

const LABEL_STYLE: React.CSSProperties = {
  fontSize:      10,
  fontWeight:    700,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color:         'rgba(255,255,255,0.38)',
  margin:        '0 0 7px',
  whiteSpace:    'nowrap',
}

/** Connected button group — conveys mutual exclusivity */
function ButtonGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value:    T
  options:  { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div style={{ display: 'flex' }}>
      {options.map((opt, i) => {
        const active = opt.value === value
        const first  = i === 0
        const last   = i === options.length - 1
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              padding:      '6px 13px',
              fontSize:     13,
              fontWeight:   600,
              border:       `1px solid ${active ? 'var(--toggle-selected)' : 'rgba(255,255,255,0.18)'}`,
              borderRadius: first ? '6px 0 0 6px' : last ? '0 6px 6px 0' : '0',
              marginLeft:   first ? 0 : -1,
              background:   active ? 'var(--toggle-selected)' : 'transparent',
              color:        active ? '#fff' : 'rgba(255,255,255,0.55)',
              cursor:       'pointer',
              position:     'relative',
              zIndex:       active ? 1 : 0,
              transition:   'background 0.12s, color 0.12s',
              whiteSpace:   'nowrap',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/** Independent toggle — for Display options (not mutually exclusive) */
function IndependentToggle({
  active,
  label,
  onClick,
}: {
  active:  boolean
  label:   string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding:    '6px 13px',
        borderRadius: 6,
        fontSize:   13,
        fontWeight: 600,
        border:     `1px solid ${active ? 'var(--toggle-selected)' : 'rgba(255,255,255,0.18)'}`,
        background: active ? 'var(--toggle-selected)' : 'transparent',
        color:      active ? '#fff' : 'rgba(255,255,255,0.55)',
        cursor:     'pointer',
        transition: 'background 0.12s, color 0.12s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function VDivider() {
  return (
    <div style={{
      width:      1,
      alignSelf:  'stretch',
      background: 'rgba(255,255,255,0.10)',
      flexShrink: 0,
      margin:     '0 4px',
    }} />
  )
}

function DisplayPanel({
  settings,
  onChange,
  onClose,
  panelRef,
}: {
  settings:  DisplaySettings
  onChange:  (s: DisplaySettings) => void
  onClose:   () => void
  panelRef:  React.RefObject<HTMLDivElement | null>
}) {
  function set<K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div
      ref={panelRef}
      style={{
        position:     'fixed',
        top:          64,
        right:        24,
        zIndex:       200,
        width:        300,
        borderRadius: 16,
        background:   '#1E1E1E',
        border:       '1px solid rgba(255,255,255,0.12)',
        padding:      '20px 20px 18px',
        boxShadow:    '0 8px 32px rgba(0,0,0,0.60)',
      }}
    >
      {/* Header */}
      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
        Customize Gallery Display
      </p>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', margin: '0 0 20px', lineHeight: 1.5 }}>
        Only you have access to these controls, which will affect how all viewers see this gallery.
      </p>

      {/* Layout */}
      <div style={{ marginBottom: 16 }}>
        <p style={LABEL_STYLE}>Layout</p>
        <ButtonGroup
          value={settings.layout}
          options={[{ value: 'grid', label: 'Grid' }, { value: 'masonry', label: 'Masonry' }]}
          onChange={v => set('layout', v)}
        />
      </div>

      {/* Density */}
      <div style={{ marginBottom: 16 }}>
        <p style={LABEL_STYLE}>Density</p>
        <ButtonGroup
          value={settings.density}
          options={[{ value: 'compact', label: 'Compact' }, { value: 'default', label: 'Default' }, { value: 'spacious', label: 'Spacious' }]}
          onChange={v => set('density', v)}
        />
      </div>

      {/* Spacing */}
      <div style={{ marginBottom: 16 }}>
        <p style={LABEL_STYLE}>Spacing</p>
        <ButtonGroup
          value={settings.spacing}
          options={[{ value: 'none', label: 'None' }, { value: 'small', label: 'Small' }, { value: 'standard', label: 'Standard' }]}
          onChange={v => set('spacing', v)}
        />
      </div>

      {/* Corners */}
      <div style={{ marginBottom: 16 }}>
        <p style={LABEL_STYLE}>Corners</p>
        <ButtonGroup
          value={settings.corners ?? 'rounded'}
          options={[{ value: 'rounded', label: 'Rounded' }, { value: 'square', label: 'Square' }]}
          onChange={v => set('corners', v)}
        />
      </div>

      {/* Display — independent toggles */}
      <div style={{ marginBottom: 20 }}>
        <p style={LABEL_STYLE}>Display</p>
        <div style={{ display: 'flex', gap: 6 }}>
          <IndependentToggle active={settings.showTitle} label="Title" onClick={() => set('showTitle', !settings.showTitle)} />
          <IndependentToggle active={settings.showScore} label="Score" onClick={() => set('showScore', !settings.showScore)} />
        </div>
      </div>

      {/* Done */}
      <div style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.10)' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            width:        '100%',
            padding:      '9px 0',
            borderRadius: 8,
            fontSize:     13,
            fontWeight:   700,
            background:   'var(--action-primary)',
            color:        '#fff',
            border:       'none',
            cursor:       'pointer',
          }}
        >
          Done
        </button>
      </div>
    </div>
  )
}

// ─── Image tile ───────────────────────────────────────────────────────────────

function ImageTile({
  img,
  layout,
  showTitle,
  showScore,
  corners,
  onClick,
}: {
  img:       GalleryImage
  layout:    'grid' | 'masonry'
  showTitle: boolean
  showScore: boolean
  corners:   'rounded' | 'square'
  onClick:   () => void
}) {
  const [hovered, setHovered] = useState(false)
  const radius = CORNER_RADIUS[corners]

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:     'relative',
        borderRadius: radius,
        overflow:     'hidden',
        cursor:       'pointer',
        aspectRatio:  layout === 'grid' ? '1' : undefined,
        display:      layout === 'grid' ? 'block' : undefined,
        breakInside:  'avoid',
        marginBottom: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.publicUrl}
        alt={img.title}
        style={{
          width:      '100%',
          display:    'block',
          height:     layout === 'grid' ? '100%' : undefined,
          objectFit:  layout === 'grid' ? 'cover' : undefined,
          transition: 'transform 0.25s ease',
          transform:  hovered ? 'scale(1.03)' : 'scale(1)',
        }}
      />

      {/* Score badge — top-right */}
      {showScore && img.score !== null && (
        <div style={{
          position:       'absolute',
          top:            10,
          right:          10,
          background:     'rgba(0,0,0,0.62)',
          backdropFilter: 'blur(6px)',
          borderRadius:   6,
          padding:        '3px 8px',
          fontSize:       12,
          fontWeight:     700,
          color:          '#fff',
        }}>
          {img.score}
        </div>
      )}

      {/* Title overlay — bottom gradient */}
      {showTitle && (
        <div style={{
          position:   'absolute',
          bottom:     0,
          left:       0,
          right:      0,
          padding:    '28px 12px 10px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
          opacity:    hovered ? 1 : 0.85,
          transition: 'opacity 0.2s',
        }}>
          <p style={{
            fontSize:     13,
            fontWeight:   600,
            color:        '#fff',
            margin:       0,
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            {img.title}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Gear icon ────────────────────────────────────────────────────────────────

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

// ─── Main viewer ──────────────────────────────────────────────────────────────

export default function GalleryViewer({
  galleryId,
  galleryName,
  clubSlug,
  ownerName,
  images,
  isOwner,
  initialDisplaySettings,
}: {
  galleryId:              string
  galleryName:            string
  clubSlug:               string
  ownerName:              string
  images:                 GalleryImage[]
  isOwner:                boolean
  initialDisplaySettings: DisplaySettings
}) {
  const [settings,      setSettings]      = useState<DisplaySettings>(initialDisplaySettings)
  const [panelOpen,     setPanelOpen]     = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [, startTransition]               = useTransition()

  const panelRef  = useRef<HTMLDivElement>(null)
  const btnRef    = useRef<HTMLButtonElement>(null)

  // Close panel on outside click
  useEffect(() => {
    if (!panelOpen) return
    function handler(e: MouseEvent) {
      if (
        panelRef.current  && !panelRef.current.contains(e.target as Node) &&
        btnRef.current    && !btnRef.current.contains(e.target as Node)
      ) {
        setPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [panelOpen])

  function handleSettingsChange(next: DisplaySettings) {
    setSettings(next)
    startTransition(() => {
      updateDisplaySettings(galleryId, next).catch(console.error)
    })
  }

  const cols   = COLUMN_COUNT[settings.density]
  const gap    = GAP_PX[settings.spacing]
  const void_  = clubSlug // suppress unused warning

  void void_

  const lightboxImages: LightboxImage[] = images.map(img => ({
    src:   img.publicUrl,
    title: img.title,
  }))

  return (
    <div style={{
      minHeight:  '100vh',
      background: '#161616',
      color:      '#fff',
    }}>
      {/* ── Top bar ── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '20px 32px 0',
        position:       'relative',
        zIndex:         100,
      }}>
        {/* Title block */}
        <div>
          <h1 style={{
            fontFamily:    'var(--font-lora, Georgia, serif)',
            fontSize:      'clamp(28px, 4vw, 52px)',
            fontWeight:    700,
            letterSpacing: '-0.025em',
            lineHeight:    1.1,
            color:         '#fff',
            margin:        0,
          }}>
            {galleryName}
          </h1>
          <p style={{
            fontSize:   14,
            color:      'rgba(255,255,255,0.45)',
            margin:     '6px 0 0',
            fontWeight: 400,
          }}>
            by {ownerName}&nbsp;·&nbsp;{images.length} photo{images.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Display button — owner only */}
        {isOwner && (
          <button
            ref={btnRef}
            type="button"
            onClick={() => setPanelOpen(v => !v)}
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            7,
              padding:        '9px 18px',
              borderRadius:   9999,
              fontSize:       13,
              fontWeight:     600,
              background:     panelOpen ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)',
              border:         '1px solid rgba(255,255,255,0.18)',
              color:          '#fff',
              cursor:         'pointer',
              transition:     'background 0.12s',
              flexShrink:     0,
            }}
          >
            <GearIcon />
            Display
          </button>
        )}
      </div>

      {/* ── Gallery grid ── */}
      <div style={{ padding: `24px 32px 48px` }}>
        {images.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
              This gallery has no images yet.
            </p>
          </div>
        ) : settings.layout === 'masonry' ? (
          <div style={{
            columns: cols,
            gap:     `${gap}px`,
          }}>
            {images.map((img, i) => (
              <div key={img.id} style={{ marginBottom: `${gap}px` }}>
                <ImageTile
                  img={img}
                  layout="masonry"
                  showTitle={settings.showTitle}
                  showScore={settings.showScore}
                  corners={settings.corners ?? 'rounded'}
                  onClick={() => setLightboxIndex(i)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            display:             'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap:                 `${gap}px`,
          }}>
            {images.map((img, i) => (
              <ImageTile
                key={img.id}
                img={img}
                layout="grid"
                showTitle={settings.showTitle}
                showScore={settings.showScore}
                corners={settings.corners ?? 'rounded'}
                onClick={() => setLightboxIndex(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Display panel ── */}
      {isOwner && panelOpen && (
        <DisplayPanel
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setPanelOpen(false)}
          panelRef={panelRef}
        />
      )}

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && (
        <Lightbox
          images={lightboxImages}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          contextTitle={galleryName}
        />
      )}
    </div>
  )
}

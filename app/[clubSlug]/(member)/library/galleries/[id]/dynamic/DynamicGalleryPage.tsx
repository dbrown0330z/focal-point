'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { useRouter }  from 'next/navigation'
import Link           from 'next/link'
import Slider         from '@mui/material/Slider'
import { updateDynamicFilters, updateGalleryMeta } from '../../actions'
import type { DynamicFilters }  from '../../actions'
import type { ScoredImage, DynamicGalleryRecord } from './page'

// ─── Club-year date range (Sep – Aug) ────────────────────────────────────────

function clubYearRange(): { from: string; to: string } {
  const now   = new Date()
  const month = now.getMonth() + 1          // 1-based
  const year  = now.getFullYear()
  const start = month >= 9 ? year : year - 1
  return { from: `${start}-09-01`, to: `${start + 1}-08-31` }
}

// ─── Visibility chip ─────────────────────────────────────────────────────────

const VISIBILITY_CHIP_LABEL: Record<string, string> = {
  public:       'Public',
  members_only: 'Members only',
  private:      'Private',
}

function VisibilityChip({ value }: { value: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 11px', borderRadius: 9999,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
      background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(6px)',
      border: '1px solid var(--border-default)', color: 'var(--text-secondary)', whiteSpace: 'nowrap',
    }}>
      {VISIBILITY_CHIP_LABEL[value] ?? value}
    </span>
  )
}

// ─── Share modal ──────────────────────────────────────────────────────────────

const SHARE_OPTIONS: Array<{
  value: 'private' | 'members_only' | 'public'
  label: string
  subFn: (clubName: string) => string
}> = [
  { value: 'private',      label: 'Private',  subFn: ()       => 'Only you can see this gallery' },
  { value: 'members_only', label: 'Club Only', subFn: cn       => `Visible to ${cn} members` },
  { value: 'public',       label: 'Public',   subFn: ()       => 'Anyone with the link can view' },
]

function ShareModal({
  open, onClose, galleryName, clubName, currentVisibility, galleryUrl, onSave,
}: {
  open: boolean; onClose: () => void; galleryName: string; clubName: string
  currentVisibility: 'public' | 'members_only' | 'private'
  galleryUrl: string; onSave: (v: 'public' | 'members_only' | 'private') => void
}) {
  const [selected, setSelected] = useState(currentVisibility)
  const [copied,   setCopied]   = useState(false)
  const prevOpen = useRef(false)
  if (open  && !prevOpen.current) { setSelected(currentVisibility); prevOpen.current = true }
  if (!open) prevOpen.current = false

  function handleCopy() {
    navigator.clipboard.writeText(galleryUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, borderRadius: 20, background: 'var(--surface-1)', border: '1px solid var(--border-default)', padding: '28px 28px 24px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Share &ldquo;{galleryName}&rdquo;</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 20px' }}>Choose who can view this gallery</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {SHARE_OPTIONS.map(opt => {
            const active = selected === opt.value
            return (
              <button key={opt.value} type="button" onClick={() => setSelected(opt.value)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 12, border: `1.5px solid ${active ? 'var(--action-primary)' : 'var(--border-default)'}`, background: active ? 'rgba(26,111,196,0.08)' : 'var(--surface-2)', cursor: 'pointer', textAlign: 'left' }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{opt.label}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{opt.subFn(clubName)}</p>
                </div>
                {active && <svg viewBox="0 0 24 24" fill="none" stroke="var(--action-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={18} height={18} style={{ flexShrink: 0 }}><path d="M20 6L9 17l-5-5"/></svg>}
              </button>
            )
          })}
        </div>
        {selected !== 'private' && (
          <div style={{ display: 'flex', marginBottom: 20, background: 'var(--surface-2)', border: '1.5px solid var(--border-default)', borderRadius: 10, overflow: 'hidden' }}>
            <input readOnly value={galleryUrl} style={{ flex: 1, padding: '10px 14px', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-code)' }} />
            <button type="button" onClick={handleCopy} style={{ padding: '10px 18px', background: 'var(--surface-1)', border: 'none', borderLeft: '1.5px solid var(--border-default)', fontSize: 13, fontWeight: 700, color: copied ? 'var(--status-success)' : 'var(--text-primary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
        <button type="button" onClick={() => { onSave(selected); onClose() }} style={{ width: '100%', padding: '13px 0', borderRadius: 10, fontSize: 15, fontWeight: 700, background: 'var(--action-primary)', color: '#fff', border: 'none', cursor: 'pointer' }}>Done</button>
      </div>
    </div>
  )
}

// ─── Filter logic ─────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: DynamicFilters = {
  scoreMin:   0,
  scoreMax:   10,
  categories: [],
  timeframe:  'all_years',
}

function applyFilters(images: ScoredImage[], f: DynamicFilters): ScoredImage[] {
  const cy = f.timeframe === 'this_year' ? clubYearRange() : null
  return images.filter(img => {
    if (img.score !== null) {
      if (img.score < f.scoreMin || img.score > f.scoreMax) return false
    } else {
      if (f.scoreMin > 0) return false
    }
    if (f.categories.length > 0 && !f.categories.includes(img.categoryName ?? '')) return false
    if (cy) {
      const d = img.createdAt.slice(0, 10)
      if (d < cy.from || d > cy.to) return false
    }
    return true
  })
}

function scoreLabel(v: number) { return v === 10 ? '10' : v.toFixed(1) }

// ─── Remove button ────────────────────────────────────────────────────────────

function IconX({ size = 10 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DynamicGalleryPage({
  clubSlug,
  gallery,
  images,
}: {
  clubSlug: string
  gallery:  DynamicGalleryRecord
  images:   ScoredImage[]
}) {
  const router = useRouter()
  const saved  = gallery.filters ?? DEFAULT_FILTERS

  // Pending filter state (not yet applied)
  const [scoreRange,  setScoreRange]  = useState<[number, number]>([saved.scoreMin, saved.scoreMax])
  const [categories,  setCategories]  = useState<string[]>(saved.categories)
  const [timeframe,   setTimeframe]   = useState<'this_year' | 'all_years'>(saved.timeframe)

  // Applied (drives the preview)
  const [applied,    setApplied]    = useState<DynamicFilters>(saved)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  const [visibility,  setVisibility]  = useState(gallery.visibility)
  const [shareOpen,   setShareOpen]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const galleryUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${clubSlug}/gallery/${gallery.id}/${gallery.slug}`
    : `/${clubSlug}/gallery/${gallery.id}/${gallery.slug}`

  async function handleVisibilitySave(v: 'public' | 'members_only' | 'private') {
    setVisibility(v)
    await updateGalleryMeta(gallery.id, { name: gallery.name, visibility: v })
  }

  const availableCategories = useMemo(
    () => [...new Set(images.filter(i => i.categoryName).map(i => i.categoryName!))].sort(),
    [images],
  )

  const preview = useMemo(
    () => applyFilters(images, applied).filter(i => !removedIds.has(i.id)),
    [images, applied, removedIds],
  )

  function handleApply() {
    setRemovedIds(new Set())
    setApplied({ scoreMin: scoreRange[0], scoreMax: scoreRange[1], categories, timeframe })
  }

  const toggleCategory = useCallback((cat: string) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }, [])

  function removeFromPreview(id: string) {
    setRemovedIds(prev => new Set([...prev, id]))
  }

  async function handleDone() {
    setSaving(true); setError(null)
    const res = await updateDynamicFilters(gallery.id, applied, preview.map(i => i.id))
    setSaving(false)
    if (res.error) { setError(res.error); return }
    router.push(`/${clubSlug}/library/galleries`)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <Link
          href={`/${clubSlug}/library/galleries`}
          style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }}
        >
          ← Back to Galleries
        </Link>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          style={{
            padding: '6px 16px', borderRadius: 9999, fontSize: 13, fontWeight: 600,
            background: 'var(--surface-2)', border: '1.5px solid var(--border-default)',
            color: 'var(--text-primary)', cursor: 'pointer',
          }}
        >
          Share
        </button>
        <button
          type="button"
          onClick={handleDone}
          disabled={saving}
          style={{
            padding: '7px 22px', borderRadius: 9999, fontSize: 13, fontWeight: 700,
            background: saving ? 'var(--border-default)' : 'var(--action-primary)',
            color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Done'}
        </button>
      </div>

      {/* ── Title ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
        <h1 style={{
          fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-lora)',
          letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0,
        }}>
          {gallery.name}
        </h1>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '3px 11px', borderRadius: 9999,
          fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
          background: 'rgba(108,71,212,0.12)', border: '1px solid rgba(108,71,212,0.30)',
          color: 'var(--spot-purple)',
        }}>
          Dynamic
        </span>
        <VisibilityChip value={visibility} />
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 24px' }}>
        Adjust filters and click Apply — click Done to save.
      </p>

      {/* ── Filter bar ── */}
      <div style={{
        display:      'flex',
        flexWrap:     'wrap',
        alignItems:   'center',
        gap:          '10px 20px',
        background:   'var(--surface-1)',
        border:       '1px solid var(--border-default)',
        borderRadius: 12,
        padding:      '14px 20px',
        marginBottom: 28,
      }}>

        {/* Score slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            Score
          </span>
          <div style={{ width: 180, paddingInline: 4 }}>
            <Slider
              value={scoreRange}
              onChange={(_, v) => setScoreRange(v as [number, number])}
              min={0} max={10} step={0.5}
              valueLabelDisplay="auto"
              valueLabelFormat={scoreLabel}
              sx={{
                color: 'var(--action-primary)',
                padding: '10px 0',
                '& .MuiSlider-thumb': { width: 16, height: 16 },
                '& .MuiSlider-valueLabel': { fontSize: 11 },
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', minWidth: 60 }}>
            {scoreLabel(scoreRange[0])}–{scoreLabel(scoreRange[1])}
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: 'var(--border-default)', flexShrink: 0 }} />

        {/* Timeframe radios */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          {([
            { value: 'this_year', label: 'This club year' },
            { value: 'all_years', label: 'All years' },
          ] as const).map(opt => (
            <label
              key={opt.value}
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}
            >
              <input
                type="radio"
                name="timeframe"
                value={opt.value}
                checked={timeframe === opt.value}
                onChange={() => setTimeframe(opt.value)}
                style={{ width: 15, height: 15, accentColor: 'var(--action-primary)', cursor: 'pointer', flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>

        {/* Divider — only if there are categories */}
        {availableCategories.length > 0 && (
          <div style={{ width: 1, height: 22, background: 'var(--border-default)', flexShrink: 0 }} />
        )}

        {/* Category chips */}
        {availableCategories.map(cat => {
          const active = categories.includes(cat)
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              style={{
                padding: '5px 13px', borderRadius: 9999,
                fontSize: 13, fontWeight: 600,
                background: active ? 'var(--action-primary)' : 'var(--surface-2)',
                color:      active ? '#fff' : 'var(--text-secondary)',
                border:     `1.5px solid ${active ? 'var(--action-primary)' : 'var(--border-default)'}`,
                cursor: 'pointer', flexShrink: 0,
                transition: 'background 0.12s, color 0.12s, border-color 0.12s',
              }}
            >
              {cat}
            </button>
          )
        })}

        {/* Spacer + Apply */}
        <div style={{ flex: 1, minWidth: 12 }} />
        <button
          type="button"
          onClick={handleApply}
          style={{
            padding: '8px 22px', borderRadius: 9999, flexShrink: 0,
            fontSize: 13, fontWeight: 700,
            background: 'var(--action-primary)', color: '#fff',
            border: 'none', cursor: 'pointer',
          }}
        >
          Apply
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          marginBottom: 20, padding: '10px 16px', borderRadius: 8,
          background: 'var(--status-error-bg)', border: '1px solid var(--status-error)',
          color: 'var(--status-error-text)', fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {/* ── Preview header ── */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Preview
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          {preview.length} photo{preview.length !== 1 ? 's' : ''}
          {removedIds.size > 0 && (
            <span style={{ color: 'var(--text-tertiary)' }}>
              {' '}· {removedIds.size} removed — click Apply to reset
            </span>
          )}
        </p>
      </div>

      {/* ── Preview grid ── */}
      {images.length === 0 ? (
        <div style={{
          padding: '60px 24px', borderRadius: 14,
          background: 'var(--surface-1)', border: '1px solid var(--border-default)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
            No competition submissions yet
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
            Dynamic galleries are populated from your scored competition entries.
          </p>
        </div>
      ) : preview.length === 0 ? (
        <div style={{
          padding: '60px 24px', borderRadius: 14,
          background: 'var(--surface-1)', border: '1px solid var(--border-default)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
            No photos match your current filters
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
            Try adjusting the score range, category, or timeframe.
          </p>
        </div>
      ) : (
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap:                 12,
        }}>
          {preview.map(img => (
            <div
              key={img.id}
              style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: '2px solid var(--border-default)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.publicUrl}
                alt={img.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />

              {/* Score badge */}
              {img.score !== null && (
                <div style={{
                  position: 'absolute', top: 6, left: 6,
                  borderRadius: 6, padding: '2px 7px',
                  fontSize: 11, fontWeight: 700,
                  background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(4px)',
                  color: '#fff',
                }}>
                  {img.score}
                </div>
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeFromPreview(img.id)}
                title="Remove from gallery"
                style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 24, height: 24, borderRadius: 6,
                  background: 'rgba(211,47,47,0.85)', backdropFilter: 'blur(4px)',
                  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', cursor: 'pointer',
                }}
              >
                <IconX size={10} />
              </button>

              {/* Title + category */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '20px 8px 7px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.72))',
                pointerEvents: 'none',
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {img.title}
                </p>
                {img.categoryName && (
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {img.categoryName}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Share modal ── */}
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        galleryName={gallery.name}
        clubName={gallery.clubName}
        currentVisibility={visibility}
        galleryUrl={galleryUrl}
        onSave={handleVisibilitySave}
      />
    </div>
  )
}

'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter }  from 'next/navigation'
import Link           from 'next/link'
import Slider         from '@mui/material/Slider'
import { updateDynamicFilters } from '../../actions'
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

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

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
    </div>
  )
}

'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter }   from 'next/navigation'
import Link            from 'next/link'
import Slider          from '@mui/material/Slider'
import Tooltip         from '@mui/material/Tooltip'
import { updateDynamicFilters } from '../../actions'
import type { DynamicFilters }  from '../../actions'
import type { ScoredImage, DynamicGalleryRecord } from './page'

// ─── Score label ──────────────────────────────────────────────────────────────

function scoreLabel(v: number) { return v === 10 ? '10' : v.toFixed(1) }

// ─── Default filters ──────────────────────────────────────────────────────────

const DEFAULT_FILTERS: DynamicFilters = {
  scoreMin:   0,
  scoreMax:   10,
  categories: [],
  dateFrom:   null,
  dateTo:     null,
}

// ─── Apply filters to image list ──────────────────────────────────────────────

function applyFilters(images: ScoredImage[], f: DynamicFilters): ScoredImage[] {
  return images.filter(img => {
    // Score range — images without a score are excluded when min > 0
    if (img.score !== null) {
      if (img.score < f.scoreMin || img.score > f.scoreMax) return false
    } else {
      if (f.scoreMin > 0) return false
    }
    // Categories
    if (f.categories.length > 0 && !f.categories.includes(img.categoryName ?? '')) return false
    // Date range (compare ISO date strings — first 10 chars = YYYY-MM-DD)
    if (f.dateFrom && img.createdAt.slice(0, 10) < f.dateFrom) return false
    if (f.dateTo   && img.createdAt.slice(0, 10) > f.dateTo)   return false
    return true
  })
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

  const savedFilters = gallery.filters ?? DEFAULT_FILTERS

  // Pending (not-yet-applied) filter state
  const [scoreRange,  setScoreRange]  = useState<[number, number]>([savedFilters.scoreMin, savedFilters.scoreMax])
  const [categories,  setCategories]  = useState<string[]>(savedFilters.categories)
  const [dateFrom,    setDateFrom]    = useState<string>(savedFilters.dateFrom ?? '')
  const [dateTo,      setDateTo]      = useState<string>(savedFilters.dateTo ?? '')

  // Applied (preview-driving) filters
  const [applied, setApplied] = useState<DynamicFilters>(savedFilters)

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const availableCategories = useMemo(
    () => [...new Set(images.filter(i => i.categoryName).map(i => i.categoryName!))].sort(),
    [images],
  )

  const preview = useMemo(() => applyFilters(images, applied), [images, applied])

  function handleApply() {
    setApplied({
      scoreMin:   scoreRange[0],
      scoreMax:   scoreRange[1],
      categories,
      dateFrom:   dateFrom || null,
      dateTo:     dateTo   || null,
    })
  }

  const toggleCategory = useCallback((cat: string) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }, [])

  async function handleDone() {
    setSaving(true); setError(null)
    const res = await updateDynamicFilters(
      gallery.id,
      applied,
      preview.map(i => i.id),
    )
    setSaving(false)
    if (res.error) { setError(res.error); return }
    router.push(`/${clubSlug}/library/galleries`)
    router.refresh()
  }

  const hasUnread = images.length === 0

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <Link
          href={`/${clubSlug}/library/galleries`}
          style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ← Back to Galleries
        </Link>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={handleDone}
          disabled={saving}
          style={{
            padding: '7px 22px', borderRadius: 9999,
            fontSize: 13, fontWeight: 700,
            background: saving ? 'var(--border-default)' : 'var(--action-primary)',
            color: '#fff', border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Done'}
        </button>
      </div>

      {/* ── Title ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
        <h1 style={{
          fontSize: 32, fontWeight: 700,
          fontFamily: 'var(--font-lora)', letterSpacing: '-0.02em',
          color: 'var(--text-primary)', margin: 0,
        }}>
          {gallery.name}
        </h1>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '3px 11px', borderRadius: 9999,
          fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
          textTransform: 'uppercase',
          background: 'rgba(108,71,212,0.12)',
          border: '1px solid rgba(108,71,212,0.30)',
          color: 'var(--spot-purple)',
        }}>
          Dynamic
        </span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 32px' }}>
        Set your filters and click Apply to preview the gallery. Click Done to save.
      </p>

      {/* ── Filter panel ── */}
      <div style={{
        background:   'var(--surface-1)',
        border:       '1px solid var(--border-default)',
        borderRadius: 14,
        padding:      '24px 28px',
        marginBottom: 32,
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 20px' }}>
          Filters
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 40px', alignItems: 'start' }}>

          {/* Score range */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              Score range
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              {scoreLabel(scoreRange[0])} – {scoreLabel(scoreRange[1])} out of 10
            </p>
            <div style={{ paddingInline: 8 }}>
              <Slider
                value={scoreRange}
                onChange={(_, v) => setScoreRange(v as [number, number])}
                min={0}
                max={10}
                step={0.5}
                valueLabelDisplay="auto"
                valueLabelFormat={scoreLabel}
                sx={{
                  color: 'var(--action-primary)',
                  '& .MuiSlider-thumb': { width: 18, height: 18 },
                  '& .MuiSlider-valueLabel': { fontSize: 11 },
                }}
              />
            </div>
          </div>

          {/* Date range */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 14px' }}>
              Date range (photo upload date)
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: '1.5px solid var(--border-default)',
                    background: 'var(--surface-2)', color: 'var(--text-primary)',
                    fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)', flexShrink: 0, paddingTop: 20 }}>—</span>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: '1.5px solid var(--border-default)',
                    background: 'var(--surface-2)', color: 'var(--text-primary)',
                    fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          {availableCategories.length > 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px' }}>
                Categories
                {categories.length > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>
                    (leave all unselected to include every category)
                  </span>
                )}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {availableCategories.map(cat => {
                  const active = categories.includes(cat)
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      style={{
                        padding:      '6px 14px',
                        borderRadius: 9999,
                        fontSize:     13,
                        fontWeight:   600,
                        background:   active ? 'var(--action-primary)' : 'var(--surface-2)',
                        color:        active ? '#fff' : 'var(--text-secondary)',
                        border:       `1.5px solid ${active ? 'var(--action-primary)' : 'var(--border-default)'}`,
                        cursor:       'pointer',
                        transition:   'background 0.12s, color 0.12s, border-color 0.12s',
                      }}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Apply button */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleApply}
            style={{
              padding:      '9px 28px',
              borderRadius: 9999,
              fontSize:     14,
              fontWeight:   700,
              background:   'var(--action-primary)',
              color:        '#fff',
              border:       'none',
              cursor:       'pointer',
            }}
          >
            Apply filters
          </button>
        </div>
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

      {/* ── Preview ── */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Preview
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          {preview.length} photo{preview.length !== 1 ? 's' : ''} match your filters
        </p>
      </div>

      {hasUnread ? (
        <div style={{
          padding: '60px 24px', borderRadius: 14,
          background: 'var(--surface-1)', border: '1px solid var(--border-default)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
            No competition submissions yet
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
            Dynamic galleries are populated from your scored competition entries. Submit to a competition to get started.
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
            Try adjusting the score range, categories, or date range.
          </p>
        </div>
      ) : (
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap:                 12,
        }}>
          {preview.map(img => (
            <div key={img.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: '2px solid var(--border-default)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.publicUrl}
                alt={img.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {/* Score badge */}
              {img.score !== null && (
                <Tooltip title={`Score: ${img.score}`} placement="top">
                  <div style={{
                    position:  'absolute', top: 6, right: 6,
                    borderRadius: 6, padding: '2px 7px',
                    fontSize: 11, fontWeight: 700,
                    background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(4px)',
                    color: '#fff', cursor: 'default',
                  }}>
                    {img.score}
                  </div>
                </Tooltip>
              )}
              {/* Title */}
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

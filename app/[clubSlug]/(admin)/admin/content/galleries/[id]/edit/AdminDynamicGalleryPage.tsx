'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Slider from '@mui/material/Slider'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, CircularProgress,
} from '@mui/material'
import { updateAdminGalleryFilters, updateAdminGalleryMeta } from '../../actions'
import type { AdminGalleryFilters } from '../../actions'
import type { AdminScoredImage, AdminGalleryRecord } from './page'

// ─── Club-year date range (Sep – Aug) ────────────────────────────────────────

function clubYearRange(): { from: string; to: string } {
  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()
  const start = month >= 9 ? year : year - 1
  return { from: `${start}-09-01`, to: `${start + 1}-08-31` }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconX({ size = 10 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  )
}

// ─── Visibility chip ──────────────────────────────────────────────────────────

const VISIBILITY_CHIP_LABEL: Record<string, string> = {
  public:       'Public',
  members_only: 'Members only',
  draft:        'Draft',
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

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onChange, id }: { on: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={on}
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: on ? 'var(--action-primary)' : 'var(--border-strong)',
        border: 'none', padding: 0, cursor: 'pointer',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: on ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

// ─── Admin Share Modal ────────────────────────────────────────────────────────

function getAdminStatusText(members: boolean, pub: boolean): string {
  if (members && pub) return 'Visible to members and anyone with the link'
  if (members)        return 'Visible to club members'
  if (pub)            return 'Anyone with the link can view this'
  return 'Draft — not published'
}

function AdminShareModal({
  open, onClose, galleryName, galleryUrl, currentVisibility, onSave,
}: {
  open: boolean; onClose: () => void; galleryName: string; galleryUrl: string
  currentVisibility: 'draft' | 'members_only' | 'public'
  onSave: (v: 'draft' | 'members_only' | 'public') => void
}) {
  const [membersOn, setMembersOn] = useState(currentVisibility !== 'draft')
  const [publicOn,  setPublicOn]  = useState(currentVisibility === 'public')
  const [copied,    setCopied]    = useState(false)
  const prevOpen = useRef(false)
  if (open && !prevOpen.current) {
    setMembersOn(currentVisibility !== 'draft')
    setPublicOn(currentVisibility === 'public')
    prevOpen.current = true
  }
  if (!open) prevOpen.current = false

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const [statusOpacity,   setStatusOpacity]   = useState(1)
  const [displayedStatus, setDisplayedStatus] = useState(() => getAdminStatusText(membersOn, publicOn))

  useEffect(() => {
    setStatusOpacity(0)
    const t = setTimeout(() => {
      setDisplayedStatus(getAdminStatusText(membersOn, publicOn))
      setStatusOpacity(1)
    }, 120)
    return () => clearTimeout(t)
  }, [membersOn, publicOn])

  function handleCopy() {
    navigator.clipboard.writeText(galleryUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  function deriveV(): 'draft' | 'members_only' | 'public' {
    if (publicOn || membersOn) return publicOn ? 'public' : 'members_only'
    return 'draft'
  }

  if (!open) return null
  const isDraft = !membersOn && !publicOn

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1300,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : 24,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : 480,
          borderRadius: isMobile ? '20px 20px 0 0' : 20,
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          padding: '28px 24px 24px',
          paddingBottom: isMobile ? 'max(24px, env(safe-area-inset-bottom, 16px))' : 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', margin: 0 }}>
            Share &ldquo;{galleryName}&rdquo;
          </h2>
          <button type="button" onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: 'none', flexShrink: 0, background: 'var(--surface-2)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          ><IconX size={14} /></button>
        </div>

        <p aria-live="polite" style={{
          fontSize: 14, color: isDraft ? 'var(--action-primary)' : 'var(--text-secondary)',
          fontWeight: isDraft ? 600 : 400, margin: '12px 0 20px', lineHeight: 1.4,
          transition: 'opacity 0.15s ease, color 0.2s ease', opacity: statusOpacity,
        }}>
          {displayedStatus}
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0 }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 0' }}>
          <label htmlFor="s-toggle-members" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
            Share with members
          </label>
          <Toggle id="s-toggle-members" on={membersOn} onChange={setMembersOn} />
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
          Visible on the Club Galleries page and available for homepage blocks.
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0 }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 0' }}>
          <label htmlFor="s-toggle-public" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
            Share with a public link
          </label>
          <Toggle id="s-toggle-public" on={publicOn} onChange={setPublicOn} />
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
          Anyone with the link can view this gallery — no login required.
        </p>

        <div style={{ overflow: 'hidden', maxHeight: publicOn ? 72 : 0, opacity: publicOn ? 1 : 0, transition: 'max-height 0.25s ease, opacity 0.2s ease' }}>
          <div style={{ display: 'flex', background: 'var(--surface-2)', border: '1.5px solid var(--border-default)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
            <input readOnly value={galleryUrl}
              style={{ flex: 1, padding: '10px 12px', background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-code)' }}
            />
            <button type="button" onClick={handleCopy}
              style={{ padding: '10px 16px', background: 'var(--surface-1)', border: 'none', borderLeft: '1.5px solid var(--border-default)', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', color: copied ? 'var(--status-success)' : 'var(--text-primary)', cursor: 'pointer' }}
            >{copied ? '✓ Copied' : 'Copy link'}</button>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0 }} />

        <button type="button" onClick={() => { onSave(deriveV()); onClose() }}
          style={{ width: '100%', padding: '13px 0', borderRadius: 10, fontSize: 15, fontWeight: 700, background: 'var(--action-primary)', color: '#fff', border: 'none', cursor: 'pointer', marginTop: 20 }}
        >Done</button>
      </div>
    </div>
  )
}

// ─── Member Picker Modal ──────────────────────────────────────────────────────

function MemberPickerModal({
  open,
  onClose,
  members,
  selected,
  onConfirm,
}: {
  open:      boolean
  onClose:   () => void
  members:   { id: string; displayName: string }[]
  selected:  string[]
  onConfirm: (ids: string[]) => void
}) {
  const [local, setLocal] = useState<string[]>(selected)

  // Sync when opened
  const prevOpen = useRef(false)
  if (open && !prevOpen.current) { setLocal(selected); prevOpen.current = true }
  if (!open) prevOpen.current = false

  function toggle(id: string) {
    setLocal(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  if (!open) return null

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth sx={{ '& .MuiPaper-root': { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>Select members</DialogTitle>
      <DialogContent sx={{ pt: '8px !important', pb: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 340, overflowY: 'auto' }}>
          {members.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '8px 0' }}>No active members found.</p>
          ) : (
            members.map(m => (
              <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', cursor: 'pointer', borderRadius: 6 }}>
                <input
                  type="checkbox"
                  checked={local.includes(m.id)}
                  onChange={() => toggle(m.id)}
                  style={{ width: 16, height: 16, accentColor: 'var(--action-primary)', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{m.displayName}</span>
              </label>
            ))
          )}
        </div>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button variant="outlined" color="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => { onConfirm(local); onClose() }}>
          {local.length === 0 ? 'All members' : `${local.length} member${local.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Default filters ──────────────────────────────────────────────────────────

const DEFAULT_FILTERS: AdminGalleryFilters = {
  memberIds:  'all',
  scoreMin:   0,
  categories: [],
  timeframe:  'all_years',
}

// ─── Apply filters ────────────────────────────────────────────────────────────

function applyFilters(images: AdminScoredImage[], f: AdminGalleryFilters): AdminScoredImage[] {
  const cy = f.timeframe === 'this_year' ? clubYearRange() : null
  return images.filter(img => {
    // Member filter
    if (f.memberIds !== 'all' && !f.memberIds.includes(img.memberId)) return false
    // Score filter
    if (img.score !== null) {
      if (img.score < f.scoreMin) return false
    } else {
      if (f.scoreMin > 0) return false
    }
    // Category filter
    if (f.categories.length > 0 && !f.categories.includes(img.categoryName ?? '')) return false
    // Timeframe filter
    if (cy) {
      const d = img.createdAt.slice(0, 10)
      if (d < cy.from || d > cy.to) return false
    }
    return true
  })
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminDynamicGalleryPage({
  clubSlug,
  gallery,
  images,
  members,
}: {
  clubSlug: string
  gallery:  AdminGalleryRecord
  images:   AdminScoredImage[]
  members:  { id: string; displayName: string }[]
}) {
  const router = useRouter()
  const saved  = gallery.filters ?? DEFAULT_FILTERS

  const [memberIds,   setMemberIds]   = useState<'all' | string[]>(saved.memberIds)
  const [scoreMin,    setScoreMin]    = useState(saved.scoreMin)
  const [categories,  setCategories]  = useState<string[]>(saved.categories)
  const [timeframe,   setTimeframe]   = useState<'this_year' | 'all_years'>(saved.timeframe)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  const [visibility,       setVisibility]       = useState(gallery.visibility)
  const [shareOpen,        setShareOpen]        = useState(false)
  const [memberPickerOpen, setMemberPickerOpen] = useState(false)
  const [saving,           setSaving]           = useState(false)
  const [error,            setError]            = useState<string | null>(null)

  const editUrl    = `/${clubSlug}/admin/content/galleries/${gallery.id}/edit`
  const galleryUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${clubSlug}/gallery/${gallery.slug}?exitUrl=${encodeURIComponent(editUrl)}`
    : `/${clubSlug}/gallery/${gallery.slug}?exitUrl=${encodeURIComponent(editUrl)}`

  const availableCategories = useMemo(
    () => [...new Set(images.filter(i => i.categoryName).map(i => i.categoryName!))].sort(),
    [images],
  )

  const preview = useMemo(
    () => applyFilters(images, { memberIds, scoreMin, categories, timeframe }).filter(i => !removedIds.has(i.id)),
    [images, memberIds, scoreMin, categories, timeframe, removedIds],
  )

  const toggleCategory = useCallback((cat: string) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }, [])

  function removeFromPreview(id: string) {
    setRemovedIds(prev => new Set([...prev, id]))
  }

  async function handleVisibilitySave(v: 'draft' | 'members_only' | 'public') {
    setVisibility(v)
    await updateAdminGalleryMeta(gallery.id, { name: gallery.name, visibility: v })
  }

  async function handleDone() {
    setSaving(true); setError(null)
    const filters: AdminGalleryFilters = { memberIds, scoreMin, categories, timeframe }
    const res = await updateAdminGalleryFilters(gallery.id, {
      filters,
      imageIds: preview.map(i => i.id),
      coverId:  preview[0]?.id ?? null,
    })
    setSaving(false)
    if (res.error) { setError(res.error); return }
    router.push(`/${clubSlug}/admin/content/navigation?tab=galleries`)
    router.refresh()
  }

  const membersLabel = memberIds === 'all'
    ? 'All members'
    : `${memberIds.length} member${memberIds.length !== 1 ? 's' : ''}`

  const membersActive = memberIds !== 'all'

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <Link
          href={`/${clubSlug}/admin/content/navigation?tab=galleries`}
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
        <a
          href={visibility !== 'draft' ? galleryUrl : undefined}
          title={visibility === 'draft' ? 'Publish gallery to preview it' : 'Preview gallery'}
          style={{
            padding: '6px 16px', borderRadius: 9999, fontSize: 13, fontWeight: 600,
            background: 'var(--surface-2)', border: '1.5px solid var(--border-default)',
            color: visibility === 'draft' ? 'var(--text-disabled)' : 'var(--text-primary)',
            cursor: visibility === 'draft' ? 'not-allowed' : 'pointer',
            textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            pointerEvents: visibility === 'draft' ? 'none' : 'auto',
          }}
        >
          Preview
        </a>
        <button
          type="button"
          onClick={handleDone}
          disabled={saving}
          style={{
            padding: '7px 22px', borderRadius: 9999, fontSize: 13, fontWeight: 700,
            background: saving ? 'var(--border-default)' : 'var(--action-primary)',
            color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {saving && <CircularProgress size={13} color="inherit" />}
          {saving ? 'Saving…' : 'Done'}
        </button>
      </div>

      {/* ── Title ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
        <h1 style={{
          fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-primary)',
          letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0,
        }}>
          {gallery.name}
        </h1>
        <VisibilityChip value={visibility} />
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 24px' }}>
        Curate images from competition submissions across all members. Adjust filters to update the preview — click Done to save.
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

        {/* Members filter */}
        <button
          type="button"
          onClick={() => setMemberPickerOpen(true)}
          style={{
            padding: '5px 13px', borderRadius: 9999,
            fontSize: 13, fontWeight: 600, flexShrink: 0,
            background: membersActive ? 'var(--action-primary)' : 'var(--surface-2)',
            color:      membersActive ? '#fff' : 'var(--text-secondary)',
            border:     `1.5px solid ${membersActive ? 'var(--action-primary)' : 'var(--border-default)'}`,
            cursor: 'pointer',
            transition: 'background 0.12s, color 0.12s, border-color 0.12s',
          }}
        >
          {membersLabel}
        </button>

        <div style={{ width: 1, height: 22, background: 'var(--border-default)', flexShrink: 0 }} />

        {/* Score slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            Min score: {scoreMin > 0 ? scoreMin : 'any'}
          </span>
          <div style={{ width: 120, paddingInline: 4 }}>
            <Slider
              value={scoreMin}
              onChange={(_, v) => setScoreMin(v as number)}
              min={0} max={10} step={1}
              size="small"
              sx={{
                color: 'var(--action-primary)',
                padding: '10px 0',
                '& .MuiSlider-thumb': { width: 16, height: 16 },
              }}
            />
          </div>
          {scoreMin > 0 && (
            <button type="button" onClick={() => setScoreMin(0)}
              style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
            >Clear</button>
          )}
        </div>

        <div style={{ width: 1, height: 22, background: 'var(--border-default)', flexShrink: 0 }} />

        {/* Timeframe radios */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          {([
            { value: 'this_year', label: 'This club year' },
            { value: 'all_years', label: 'All years' },
          ] as const).map(opt => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="radio"
                name="admin-timeframe"
                value={opt.value}
                checked={timeframe === opt.value}
                onChange={() => setTimeframe(opt.value)}
                style={{ width: 15, height: 15, accentColor: 'var(--action-primary)', cursor: 'pointer', flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{opt.label}</span>
            </label>
          ))}
        </div>

        {/* Category chips */}
        {availableCategories.length > 0 && (
          <>
            <div style={{ width: 1, height: 22, background: 'var(--border-default)', flexShrink: 0 }} />
            {availableCategories.map(cat => {
              const active = categories.includes(cat)
              return (
                <button key={cat} type="button" onClick={() => toggleCategory(cat)}
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
          </>
        )}

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
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Preview</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          {preview.length} photo{preview.length !== 1 ? 's' : ''}
          {removedIds.size > 0 && (
            <span style={{ color: 'var(--text-tertiary)' }}>
              {' '}· {removedIds.size} manually removed
            </span>
          )}
        </p>
      </div>

      {/* ── Preview grid ── */}
      {images.length === 0 ? (
        <div style={{ padding: '60px 24px', borderRadius: 14, background: 'var(--surface-1)', border: '1px solid var(--border-default)', textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
            No competition submissions yet
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
            Club galleries are populated from scored competition entries.
          </p>
        </div>
      ) : preview.length === 0 ? (
        <div style={{ padding: '60px 24px', borderRadius: 14, background: 'var(--surface-1)', border: '1px solid var(--border-default)', textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
            No photos match your current filters
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
            Try adjusting the score, member, category, or timeframe filters.
          </p>
        </div>
      ) : (
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap:                 12,
        }}>
          {preview.map(img => (
            <div key={img.id}
              style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: '2px solid var(--border-default)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.publicUrl} alt={img.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />

              {/* Score badge */}
              {img.score !== null && (
                <div style={{
                  position: 'absolute', top: 6, left: 6,
                  borderRadius: 6, padding: '2px 7px',
                  fontSize: 11, fontWeight: 700,
                  background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(4px)', color: '#fff',
                }}>
                  {img.score}
                </div>
              )}

              {/* Remove button */}
              <button type="button" onClick={() => removeFromPreview(img.id)} title="Remove from gallery"
                style={{
                  position: 'absolute', bottom: 6, right: 6,
                  width: 26, height: 26, borderRadius: 6,
                  background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
                  border: '1.5px solid rgba(255,255,255,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#ff6b6b', cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(211,47,47,0.75)'; e.currentTarget.style.borderColor = 'rgba(255,120,120,0.8)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }}
              >
                <IconX size={14} />
              </button>

              {/* Title + member */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '20px 8px 7px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.72))',
                pointerEvents: 'none',
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {img.title}
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {img.memberName}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Share modal ── */}
      <AdminShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        galleryName={gallery.name}
        galleryUrl={galleryUrl}
        currentVisibility={visibility}
        onSave={handleVisibilitySave}
      />

      {/* ── Member picker ── */}
      <MemberPickerModal
        open={memberPickerOpen}
        onClose={() => setMemberPickerOpen(false)}
        members={members}
        selected={memberIds === 'all' ? [] : memberIds}
        onConfirm={ids => setMemberIds(ids.length === 0 ? 'all' : ids)}
      />
    </div>
  )
}

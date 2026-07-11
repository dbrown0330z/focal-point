'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CircularProgress } from '@mui/material'
import { updateAdminGalleryFilters, updateAdminGalleryMeta } from '../../actions'
import type { AdminGalleryFilters } from '../../actions'
import type { AdminScoredImage, AdminGalleryRecord } from './page'
import { DynamicFilterBar, generateClubYears, currentClubYear } from '@/components/ui/DynamicFilterBar'

// ─── Club-year date range (Sep – Aug) ────────────────────────────────────────

function yearToRange(label: string): { from: string; to: string } {
  const start = parseInt(label.split('/')[0])
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

// ─── Default filters ──────────────────────────────────────────────────────────

const ALL_YEARS = generateClubYears()

const DEFAULT_FILTERS: AdminGalleryFilters = {
  memberIds:  'all',
  scoreMin:   0,
  categories: [],
  years:      [],
}

// ─── Apply filters ────────────────────────────────────────────────────────────

function applyFilters(images: AdminScoredImage[], f: AdminGalleryFilters): AdminScoredImage[] {
  return images.filter(img => {
    if (f.memberIds !== 'all' && !f.memberIds.includes(img.memberId)) return false
    if (img.score !== null) {
      if (img.score < f.scoreMin) return false
    } else {
      if (f.scoreMin > 0) return false
    }
    if (f.categories.length > 0 && !f.categories.includes(img.categoryName ?? '')) return false
    if (f.years.length > 0) {
      const d = img.createdAt.slice(0, 10)
      const inYear = f.years.some(y => {
        const r = yearToRange(y)
        return d >= r.from && d <= r.to
      })
      if (!inYear) return false
    }
    return true
  })
}

// ─── Migrate saved filters (backward compat with old timeframe field) ─────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateFilters(raw: any): AdminGalleryFilters {
  if (!raw) return DEFAULT_FILTERS
  const years: string[] = Array.isArray(raw.years)
    ? raw.years
    : raw.timeframe === 'this_year' ? [currentClubYear()] : []
  return {
    memberIds:  raw.memberIds  ?? 'all',
    scoreMin:   raw.scoreMin   ?? 0,
    categories: raw.categories ?? [],
    years,
  }
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
  const saved  = migrateFilters(gallery.filters)

  // Filter state — selectedMemberIds: empty = all members
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    saved.memberIds === 'all' ? [] : (saved.memberIds as string[])
  )
  const [scoreMin,    setScoreMin]    = useState(saved.scoreMin)
  const [categories,  setCategories]  = useState<string[]>(saved.categories)
  const [years,       setYears]       = useState<string[]>(saved.years)
  const [removedIds,  setRemovedIds]  = useState<Set<string>>(new Set())

  const [visibility,  setVisibility]  = useState(gallery.visibility)
  const [shareOpen,   setShareOpen]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const editUrl    = `/${clubSlug}/admin/content/galleries/${gallery.id}/edit`
  const galleryUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${clubSlug}/gallery/${gallery.slug}?exitUrl=${encodeURIComponent(editUrl)}`
    : `/${clubSlug}/gallery/${gallery.slug}?exitUrl=${encodeURIComponent(editUrl)}`

  const availableCategories = useMemo(
    () => [...new Set(images.filter(i => i.categoryName).map(i => i.categoryName!))].sort(),
    [images],
  )

  // Build filter object for applyFilters (convert empty selectedMemberIds back to 'all')
  const filterObj = useMemo<AdminGalleryFilters>(() => ({
    memberIds:  selectedMemberIds.length === 0 ? 'all' : selectedMemberIds,
    scoreMin,
    categories,
    years,
  }), [selectedMemberIds, scoreMin, categories, years])

  const preview = useMemo(
    () => applyFilters(images, filterObj).filter(i => !removedIds.has(i.id)),
    [images, filterObj, removedIds],
  )

  function removeFromPreview(id: string) {
    setRemovedIds(prev => new Set([...prev, id]))
  }

  async function handleVisibilitySave(v: 'draft' | 'members_only' | 'public') {
    setVisibility(v)
    await updateAdminGalleryMeta(gallery.id, { name: gallery.name, visibility: v })
  }

  async function handleDone() {
    setSaving(true); setError(null)
    const filters: AdminGalleryFilters = {
      memberIds:  selectedMemberIds.length === 0 ? 'all' : selectedMemberIds,
      scoreMin,
      categories,
      years,
    }
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
      <DynamicFilterBar
        scoreMin={scoreMin}
        onScoreMin={setScoreMin}
        selectedYears={years}
        availableYears={ALL_YEARS}
        onYears={setYears}
        selectedCategories={categories}
        availableCategories={availableCategories}
        onCategories={setCategories}
        selectedMemberIds={selectedMemberIds}
        members={members}
        onMemberIds={setSelectedMemberIds}
      />

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
            Try adjusting the score, member, category, or year filters.
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
    </div>
  )
}

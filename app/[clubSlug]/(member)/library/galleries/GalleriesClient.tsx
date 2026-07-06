'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip, CircularProgress, Alert,
} from '@mui/material'
import AddIcon          from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import PublicIcon       from '@mui/icons-material/Public'
import PeopleIcon       from '@mui/icons-material/People'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import type { GalleryData, GalleryImage, CompImage } from './page'
import {
  createGallery,
  updateGalleryFull,
  deleteGallery,
} from './actions'

const GALLERY_LIMIT = 3

// ─── Score options ────────────────────────────────────────────────────────────

const SCORE_OPTIONS = [5, 6, 7, 8, 9, 10]

// ─── Merged image type ────────────────────────────────────────────────────────

type MergedImage = {
  id:              string
  title:           string
  publicUrl:       string
  submitted:       boolean
  score:           number | null
  categoryName:    string | null
  competitionName: string | null
}

function buildMergedImages(libraryImages: GalleryImage[], compImages: CompImage[]): MergedImage[] {
  const submittedMap = new Map(compImages.map(c => [c.imageId, c]))
  return libraryImages.map(img => {
    const sub = submittedMap.get(img.id)
    return {
      id:              img.id,
      title:           img.title,
      publicUrl:       img.publicUrl,
      submitted:       Boolean(sub),
      score:           sub?.score ?? null,
      categoryName:    sub?.categoryName ?? null,
      competitionName: sub?.competitionName ?? null,
    }
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function VisibilityIcon({ v }: { v: string }) {
  if (v === 'public')       return <PublicIcon sx={{ fontSize: 14 }} />
  if (v === 'members_only') return <PeopleIcon sx={{ fontSize: 14 }} />
  return <LockOutlinedIcon sx={{ fontSize: 14 }} />
}

function visibilityLabel(v: string) {
  if (v === 'public')       return 'Public'
  if (v === 'members_only') return 'Members only'
  return 'Private'
}

// ─── Mini icon: checkmark ─────────────────────────────────────────────────────

function IconCheck({ size = 13 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  )
}

// ─── Custom stepper (matches SubmitModal style) ───────────────────────────────

function WizardStepper({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex justify-center py-4">
      <div className="flex items-center" style={{ width: '55%', minWidth: 280 }}>
        {labels.map((label, i) => {
          const done   = i < step
          const active = i === step
          return (
            <div key={i} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors"
                  style={{
                    background:  done || active ? 'var(--action-primary)' : 'transparent',
                    borderColor: done || active ? 'var(--action-primary)' : 'var(--border-default)',
                    color:       done || active ? '#fff' : 'var(--text-tertiary)',
                  }}
                >
                  {done ? <IconCheck size={13} /> : i + 1}
                </div>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: active ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                >
                  {label}
                </span>
              </div>
              {i < labels.length - 1 && (
                <div
                  className="mx-2 mb-4 h-0.5 flex-1 transition-colors"
                  style={{ background: i < step ? 'var(--action-primary)' : 'var(--border-default)' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Label + native input helpers ────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
      {children}
      {required && <span style={{ color: 'var(--status-error)', marginLeft: 3 }}>*</span>}
    </label>
  )
}

function NativeInput({
  value, onChange, placeholder, maxLength, autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  autoFocus?: boolean
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      autoFocus={autoFocus}
      className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
      style={{ border: '1.5px solid var(--border-default)', background: 'var(--surface-2)', color: 'var(--text-primary)' }}
      onFocus={e => (e.target.style.borderColor = 'var(--action-primary)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border-default)')}
    />
  )
}

function NativeSelect({
  value, onChange, children,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
      style={{ border: '1.5px solid var(--border-default)', background: 'var(--surface-2)', color: 'var(--text-primary)' }}
      onFocus={e => (e.target.style.borderColor = 'var(--action-primary)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border-default)')}
    >
      {children}
    </select>
  )
}

// ─── Image picker grid ────────────────────────────────────────────────────────

function PickerGrid({
  items,
  selectedIds,
  onToggle,
}: {
  items:       { id: string; title: string; publicUrl: string; badge?: string; inGallery?: boolean }[]
  selectedIds: Set<string>
  onToggle:    (id: string) => void
}) {
  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
        No images match the current filters.
      </div>
    )
  }
  return (
    <div className="grid grid-cols-6 gap-2">
      {items.map(item => {
        const selected = selectedIds.has(item.id)
        return (
          <div
            key={item.id}
            onClick={() => onToggle(item.id)}
            className="relative cursor-pointer overflow-hidden rounded-lg transition-all"
            style={{
              aspectRatio: '1',
              border:      selected ? '2px solid var(--action-primary)' : '2px solid var(--border-default)',
              boxShadow:   selected ? '0 0 0 3px rgba(26,111,196,0.22)' : 'none',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.publicUrl}
              alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              position:   'absolute',
              inset:      0,
              background: selected ? 'rgba(26,111,196,0.18)' : 'transparent',
              transition: 'background 0.1s',
            }} />
            {selected && (
              <div
                className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full"
                style={{ background: 'var(--action-primary)', color: '#fff' }}
              >
                <IconCheck size={11} />
              </div>
            )}
            {item.inGallery && selectedIds.has(item.id) && (
              <div className="absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                style={{ background: 'rgba(0,0,0,0.60)', color: 'rgba(255,255,255,0.85)' }}>
                In gallery
              </div>
            )}
            {item.badge && (
              <div
                className="absolute bottom-0 left-0 right-0 px-1.5 py-1"
                style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.70))' }}
              >
                <p className="truncate text-[10px] font-semibold" style={{ color: '#fff' }}>{item.badge}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Filter-based image picker (Step 1 + Edit dialog) ────────────────────────

type StatusFilter  = 'all' | 'submitted' | 'not_submitted'
type GalleryFilter = 'all' | 'in_gallery' | 'not_in_gallery'

function ImageFilterPicker({
  allImages,
  selectedIds,
  onToggle,
  galleryIds,
}: {
  allImages:   MergedImage[]
  selectedIds: Set<string>
  onToggle:    (id: string) => void
  galleryIds?: Set<string>   // when editing: IDs already in the gallery
}) {
  const [status,        setStatus]        = useState<StatusFilter>('all')
  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>('all')
  const [minScore,      setMinScore]      = useState<string>('')
  const [cats,          setCats]          = useState<Set<string>>(new Set())

  const availableCategories = useMemo(
    () => [...new Set(allImages.filter(i => i.categoryName).map(i => i.categoryName!))].sort(),
    [allImages],
  )

  const hasSubmitted = allImages.some(i => i.submitted && i.score !== null)

  function toggleCat(cat: string) {
    setCats(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat); else next.add(cat)
      return next
    })
  }

  const filtered = useMemo(() => {
    const minS = minScore ? Number(minScore) : null
    return allImages.filter(img => {
      if (status === 'submitted'            && !img.submitted)          return false
      if (status === 'not_submitted'        &&  img.submitted)          return false
      if (galleryFilter === 'in_gallery'    && !galleryIds?.has(img.id)) return false
      if (galleryFilter === 'not_in_gallery' && galleryIds?.has(img.id)) return false
      if (minS !== null && (img.score === null || img.score < minS))     return false
      if (cats.size > 0 && !cats.has(img.categoryName ?? ''))            return false
      return true
    })
  }, [allImages, status, galleryFilter, galleryIds, minScore, cats])

  const items = filtered.map(img => ({
    id:        img.id,
    title:     img.title,
    publicUrl: img.publicUrl,
    inGallery: galleryIds?.has(img.id) ?? false,
    badge:     img.title,
  }))

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {/* Gallery filter — only shown in edit mode */}
        {galleryIds && (
          <div style={{ display: 'inline-flex', borderRadius: 7, border: '1px solid var(--border-default)', overflow: 'hidden' }}>
            {([
              { key: 'all',           label: 'All' },
              { key: 'in_gallery',    label: 'In gallery' },
              { key: 'not_in_gallery', label: 'Not in gallery' },
            ] as { key: GalleryFilter; label: string }[]).map((opt, i, arr) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setGalleryFilter(opt.key)}
                className="px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  background:  galleryFilter === opt.key ? 'var(--action-primary)' : 'var(--surface-2)',
                  color:       galleryFilter === opt.key ? '#fff' : 'var(--text-secondary)',
                  border:      'none',
                  cursor:      'pointer',
                  borderRight: i < arr.length - 1 ? '1px solid var(--border-default)' : 'none',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Status */}
        <div style={{ display: 'inline-flex', borderRadius: 7, border: '1px solid var(--border-default)', overflow: 'hidden' }}>
          {(['all', 'submitted', 'not_submitted'] as StatusFilter[]).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className="px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background:  status === s ? 'var(--action-primary)' : 'var(--surface-2)',
                color:       status === s ? '#fff' : 'var(--text-secondary)',
                border:      'none',
                cursor:      'pointer',
                borderRight: s !== 'not_submitted' ? '1px solid var(--border-default)' : 'none',
              }}
            >
              {s === 'all' ? 'All' : s === 'submitted' ? 'Submitted' : 'Not submitted'}
            </button>
          ))}
        </div>

        {/* Min score */}
        {hasSubmitted && (
          <select
            value={minScore}
            onChange={e => setMinScore(e.target.value)}
            className="rounded-lg px-2 py-1.5 text-xs outline-none"
            style={{ border: '1px solid var(--border-default)', background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
          >
            <option value="">Any score</option>
            {SCORE_OPTIONS.map(s => (
              <option key={s} value={s}>{s}+</option>
            ))}
          </select>
        )}

        {/* Category chips */}
        {availableCategories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => toggleCat(cat)}
            className="rounded-full px-2.5 py-1 text-xs font-semibold transition-all"
            style={{
              background:   cats.has(cat) ? 'var(--action-primary)' : 'var(--surface-1)',
              color:        cats.has(cat) ? '#fff' : 'var(--text-secondary)',
              border:       `1px solid ${cats.has(cat) ? 'var(--action-primary)' : 'var(--border-default)'}`,
              cursor:       'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Heading + count */}
      <div className="mb-2.5 flex items-baseline gap-2">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Images</p>
        {selectedIds.size > 0 && (
          <span className="text-xs font-semibold" style={{ color: 'var(--action-primary)' }}>
            {selectedIds.size} selected
          </span>
        )}
        <span className="ml-auto text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {filtered.length} shown
        </span>
      </div>

      {/* Grid — scrollable, shows ~4 rows */}
      <div style={{ maxHeight: 520, overflowY: 'auto', scrollbarWidth: 'thin' }}>
        <PickerGrid items={items} selectedIds={selectedIds} onToggle={onToggle} />
      </div>
    </div>
  )
}

// ─── Cover picker ─────────────────────────────────────────────────────────────

function CoverPicker({
  imageIds,
  imageMap,
  coverId,
  onSelect,
}: {
  imageIds: string[]
  imageMap: Map<string, { title: string; publicUrl: string }>
  coverId:  string | null
  onSelect: (id: string) => void
}) {
  const items = imageIds
    .map(id => { const img = imageMap.get(id); return img ? { id, ...img } : null })
    .filter(Boolean) as { id: string; title: string; publicUrl: string }[]

  if (items.length === 0) return null

  return (
    <div className="grid grid-cols-6 gap-2">
      {items.map(item => {
        const selected = coverId === item.id
        return (
          <div
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="relative cursor-pointer overflow-hidden rounded-lg"
            style={{
              aspectRatio: '1',
              border:      selected ? '2px solid var(--action-primary)' : '2px solid var(--border-default)',
              boxShadow:   selected ? '0 0 0 3px rgba(26,111,196,0.22)' : 'none',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.publicUrl} alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {selected && (
              <div className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full"
                style={{ background: 'var(--action-primary)', color: '#fff' }}>
                <IconCheck size={11} />
              </div>
            )}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
              padding: '4px 6px 5px',
            }}>
              <p className="truncate text-[10px] font-semibold" style={{ color: '#fff' }}>{item.title}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Modal shell (shared by wizard + edit) ────────────────────────────────────

function ModalShell({
  open, onClose, title, subtitle, maxWidth = 1040, bodyHeight = 620, children,
}: {
  open:        boolean
  onClose:     () => void
  title:       string
  subtitle?:   string
  maxWidth?:   number
  bodyHeight?: number
  children:    React.ReactNode
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        className="flex w-full flex-col overflow-hidden"
        style={{
          maxWidth,
          borderRadius:  18,
          height:        `${bodyHeight + 160}px`,
          maxHeight:     'calc(100vh - 48px)',
          background:    'var(--surface-1)',
          border:        '1px solid var(--border-default)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '22px 28px 0', borderBottom: '1px solid var(--border-default)', flexShrink: 0 }}>
          <div className="flex items-start justify-between pb-4">
            <div>
              <h2 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {title}
              </h2>
              {subtitle && (
                <p className="mt-0.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-lg transition-colors"
              style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-0)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}

// ─── Create wizard ────────────────────────────────────────────────────────────

const STEP_LABELS = ['Name & privacy', 'Select images', 'Cover image']

function CreateWizard({
  open,
  onClose,
  libraryImages,
  compImages,
}: {
  open:          boolean
  onClose:       () => void
  libraryImages: GalleryImage[]
  compImages:    CompImage[]
}) {
  const router = useRouter()

  const [step,        setStep]       = useState(0)
  const [name,        setName]       = useState('')
  const [visibility,  setVisibility] = useState<'public' | 'members_only' | 'private'>('private')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [coverId,     setCoverId]    = useState<string | null>(null)
  const [saving,      setSaving]     = useState(false)
  const [error,       setError]      = useState<string | null>(null)

  const allImages = useMemo(() => buildMergedImages(libraryImages, compImages), [libraryImages, compImages])
  const imageMap  = useMemo(() => new Map(allImages.map(i => [i.id, { title: i.title, publicUrl: i.publicUrl }])), [allImages])

  function reset() {
    setStep(0); setName(''); setVisibility('private')
    setSelectedIds(new Set()); setCoverId(null); setError(null)
  }

  function handleClose() { reset(); onClose() }

  const toggleId = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id); if (coverId === id) setCoverId(null) }
      else next.add(id)
      return next
    })
  }, [coverId])

  async function handleCreate() {
    setSaving(true); setError(null)
    const ids = [...selectedIds]
    const res = await createGallery({
      name,
      visibility,
      imageIds: ids,
      coverId:  coverId ?? ids[0] ?? null,
    })
    setSaving(false)
    if (res.error) { setError(res.error); return }
    reset(); onClose(); router.refresh()
  }

  const canAdvance0 = name.trim().length > 0
  const canAdvance1 = selectedIds.size > 0
  const orderedIds  = [...selectedIds]
  const defaultCover = coverId ?? orderedIds[0] ?? null

  return (
    <ModalShell open={open} onClose={handleClose} title="Create gallery">
      {/* Stepper */}
      <div style={{ padding: '0 28px', flexShrink: 0 }}>
        <WizardStepper step={step} labels={STEP_LABELS} />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 28px 4px' }}>
        {error && (
          <div className="mb-4 rounded-lg px-4 py-3 text-sm"
            style={{ background: 'var(--status-error-bg)', border: '1px solid var(--status-error)', color: 'var(--status-error-text)' }}>
            {error}
          </div>
        )}

        {/* Step 0: Name & visibility */}
        {step === 0 && (
          <div className="flex flex-col gap-6" style={{ maxWidth: 520 }}>
            <div>
              <FieldLabel required>Gallery name</FieldLabel>
              <NativeInput value={name} onChange={setName} placeholder="e.g. Spring landscapes" maxLength={80} autoFocus />
              <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{name.length}/80</p>
            </div>
            <div>
              <FieldLabel>Visibility</FieldLabel>
              <div className="flex flex-col gap-2.5 pt-0.5">
                {([
                  { value: 'public',       icon: <PublicIcon sx={{ fontSize: 18 }} />,       label: 'Public',       sub: 'Anyone with a link' },
                  { value: 'members_only', icon: <PeopleIcon sx={{ fontSize: 18 }} />,       label: 'Members only', sub: 'Signed-in club members' },
                  { value: 'private',      icon: <LockOutlinedIcon sx={{ fontSize: 18 }} />, label: 'Private',      sub: 'Only you' },
                ] as const).map(opt => {
                  const active = visibility === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVisibility(opt.value)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all"
                      style={{
                        border:      active ? '2px solid var(--action-primary)' : '1.5px solid var(--border-default)',
                        background:  active ? 'rgba(26,111,196,0.06)' : 'var(--surface-2)',
                        cursor:      'pointer',
                        boxShadow:   active ? '0 0 0 3px rgba(26,111,196,0.12)' : 'none',
                      }}
                    >
                      <span style={{ color: active ? 'var(--action-primary)' : 'var(--text-tertiary)', flexShrink: 0 }}>
                        {opt.icon}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{opt.label}</span>
                        <span className="block text-xs" style={{ color: 'var(--text-secondary)' }}>{opt.sub}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Pick images */}
        {step === 1 && (
          <ImageFilterPicker
            allImages={allImages}
            selectedIds={selectedIds}
            onToggle={toggleId}
          />
        )}

        {/* Step 2: Cover */}
        {step === 2 && (
          <div>
            <p className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Choose a cover image. The first selected image is used by default.
            </p>
            <CoverPicker
              imageIds={orderedIds}
              imageMap={imageMap}
              coverId={defaultCover}
              onSelect={setCoverId}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 28px 22px', borderTop: '1px solid var(--border-default)', flexShrink: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleClose}
          disabled={saving}
          className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
          style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-0)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}
        >
          Cancel
        </button>
        <div style={{ flex: 1 }} />
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
            style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-0)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}
          >
            Back
          </button>
        )}
        {step < 2 && (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            disabled={(step === 0 && !canAdvance0) || (step === 1 && !canAdvance1)}
            className="rounded-lg px-5 py-2 text-sm font-bold text-white transition-colors"
            style={{ background: 'var(--action-primary)', border: 'none', cursor: (step === 0 && !canAdvance0) || (step === 1 && !canAdvance1) ? 'not-allowed' : 'pointer', opacity: (step === 0 && !canAdvance0) || (step === 1 && !canAdvance1) ? 0.5 : 1 }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--action-primary-hover)' }}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--action-primary)')}
          >
            Next
          </button>
        )}
        {step === 2 && (
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold text-white transition-colors"
            style={{ background: 'var(--action-primary)', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--action-primary-hover)' }}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--action-primary)')}
          >
            {saving && <CircularProgress size={14} color="inherit" />}
            {saving ? 'Creating…' : 'Create gallery'}
          </button>
        )}
      </div>
    </ModalShell>
  )
}

// ─── Edit gallery dialog ──────────────────────────────────────────────────────

function EditGalleryDialog({
  gallery,
  libraryImages,
  compImages,
  onClose,
}: {
  gallery:       GalleryData | null
  libraryImages: GalleryImage[]
  compImages:    CompImage[]
  onClose:       () => void
}) {
  const router = useRouter()

  const allImages = useMemo(() => buildMergedImages(libraryImages, compImages), [libraryImages, compImages])
  const imageMap  = useMemo(() => new Map(allImages.map(i => [i.id, { title: i.title, publicUrl: i.publicUrl }])), [allImages])

  const [name,        setName]        = useState(gallery?.name ?? '')
  const [visibility,  setVisibility]  = useState<'public' | 'members_only' | 'private'>(gallery?.visibility ?? 'private')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(gallery?.image_ids ?? []))
  const [coverId,        setCoverId]        = useState<string | null>(gallery?.cover_image_id ?? null)
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState<string | null>(null)
  const [editingDetails, setEditingDetails] = useState(false)

  // Re-sync when a different gallery is opened
  useEffect(() => {
    if (gallery) {
      setName(gallery.name)
      setVisibility(gallery.visibility)
      setSelectedIds(new Set(gallery.image_ids))
      setCoverId(gallery.cover_image_id)
      setError(null)
      setEditingDetails(false)
    }
  }, [gallery?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!gallery) return null

  const originalIds = new Set(gallery.image_ids)

  const toggleId = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        if (coverId === id) setCoverId([...next][0] ?? null)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleSave() {
    if (!gallery) return
    setSaving(true); setError(null)
    const ids    = [...selectedIds]
    const cover  = coverId && ids.includes(coverId) ? coverId : ids[0] ?? null
    const res = await updateGalleryFull(gallery.id, { name, visibility, imageIds: ids, coverId: cover })
    setSaving(false)
    if (res.error) { setError(res.error); return }
    onClose(); router.refresh()
  }

  return (
    <ModalShell open onClose={onClose} title="Edit gallery" maxWidth={1040}>
      <div className="flex-1 overflow-y-auto" style={{ padding: '22px 28px' }}>
        {error && (
          <div className="mb-4 rounded-lg px-4 py-3 text-sm"
            style={{ background: 'var(--status-error-bg)', border: '1px solid var(--status-error)', color: 'var(--status-error-text)' }}>
            {error}
          </div>
        )}

        {/* Details — read-only with pencil toggle */}
        <div className="mb-5">
          {!editingDetails ? (
            <div
              className="group flex items-center justify-between"
              style={{ minHeight: 36 }}
            >
              <div className="flex items-center gap-3">
                <p className="text-[17px] font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>{name}</p>
                <span style={{ color: 'var(--border-strong)', userSelect: 'none' }}>|</span>
                <p className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <VisibilityIcon v={visibility} />{visibilityLabel(visibility)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingDetails(true)}
                title="Edit name and visibility"
                className="invisible rounded-md p-1.5 group-hover:visible"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-0)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <EditOutlinedIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <FieldLabel required>Gallery name</FieldLabel>
                  <NativeInput value={name} onChange={setName} maxLength={80} autoFocus />
                </div>
                <div>
                  <FieldLabel>Visibility</FieldLabel>
                  <NativeSelect value={visibility} onChange={v => setVisibility(v as typeof visibility)}>
                    <option value="public">Public</option>
                    <option value="members_only">Members only</option>
                    <option value="private">Private</option>
                  </NativeSelect>
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setEditingDetails(false)}
                  className="text-xs font-semibold"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--action-primary)', padding: 0 }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Image picker */}
        <div>
          {allImages.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No images in your library yet.</p>
          ) : (
            <ImageFilterPicker
              allImages={allImages}
              selectedIds={selectedIds}
              onToggle={toggleId}
              galleryIds={originalIds}
            />
          )}
        </div>

        {/* Cover image picker — shown when at least one image is selected */}
        {selectedIds.size > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Cover image</p>
            <CoverPicker
              imageIds={[...selectedIds]}
              imageMap={imageMap}
              coverId={coverId ?? [...selectedIds][0] ?? null}
              onSelect={setCoverId}
            />
          </div>
        )}
      </div>

      <div style={{ padding: '16px 28px 22px', borderTop: '1px solid var(--border-default)', flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
          style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-0)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold text-white transition-colors"
          style={{ background: 'var(--action-primary)', border: 'none', cursor: (!name.trim() || saving) ? 'not-allowed' : 'pointer', opacity: (!name.trim() || saving) ? 0.5 : 1 }}
          onMouseEnter={e => { if (name.trim() && !saving) e.currentTarget.style.background = 'var(--action-primary-hover)' }}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--action-primary)')}
        >
          {saving && <CircularProgress size={14} color="inherit" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </ModalShell>
  )
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteDialog({
  gallery,
  onClose,
}: {
  gallery: GalleryData | null
  onClose: () => void
}) {
  const router  = useRouter()
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  if (!gallery) return null

  async function handleDelete() {
    if (!gallery) return
    setSaving(true); setError(null)
    const res = await deleteGallery(gallery.id)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    onClose(); router.refresh()
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth sx={{ '& .MuiPaper-root': { borderRadius: 3 } }}>
      <DialogTitle>Delete gallery?</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2" color="text.secondary">
          <strong>&ldquo;{gallery.name}&rdquo;</strong> will be permanently deleted. The images themselves will not be deleted.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" color="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {saving ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Share dialog ─────────────────────────────────────────────────────────────

function ShareDialog({
  gallery,
  clubSlug,
  userId,
  onClose,
}: {
  gallery:  GalleryData | null
  clubSlug: string
  userId:   string
  onClose:  () => void
}) {
  const [copied, setCopied] = useState(false)
  if (!gallery) return null

  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/${clubSlug}/gallery/${userId}/${gallery.slug}`

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth sx={{ '& .MuiPaper-root': { borderRadius: 3 } }}>
      <DialogTitle>Share gallery</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {gallery.visibility === 'public'
            ? 'Anyone with this link can view your gallery.'
            : 'Club members with this link can view your gallery.'}
        </Typography>
        <Box sx={{
          display:    'flex',
          gap:        1,
          bgcolor:    'var(--surface-1)',
          borderRadius: 2,
          p:          1.5,
          alignItems: 'center',
        }}>
          <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 12 }}>
            {url}
          </Typography>
          <Button variant="contained" size="small" onClick={handleCopy} sx={{ flexShrink: 0 }}>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" color="secondary" onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Gallery card ─────────────────────────────────────────────────────────────

function visibilityBadgeStyle(v: string): React.CSSProperties {
  if (v === 'public')       return { background: 'rgba(26,111,196,0.82)', color: '#fff' }
  if (v === 'members_only') return { background: 'rgba(0,0,0,0.55)',      color: '#fff' }
  return                           { background: 'rgba(0,0,0,0.55)',      color: 'rgba(255,255,255,0.75)' }
}

function GalleryCard({
  gallery,
  clubSlug,
  userId,
  displayName,
  onEdit,
  onDelete,
  onShare,
}: {
  gallery:     GalleryData
  clubSlug:    string
  userId:      string
  displayName: string
  onEdit:      (g: GalleryData) => void
  onDelete:    (g: GalleryData) => void
  onShare:     (g: GalleryData) => void
}) {
  const galleryUrl = `/${clubSlug}/gallery/${userId}/${gallery.slug}`

  return (
    <div
      style={{
        borderRadius: 14,
        overflow:     'hidden',
        background:   'var(--surface-1)',
        border:       '1px solid var(--border-default)',
        display:      'flex',
        flexDirection:'column',
      }}
    >
      {/* Cover image — clickable, opens gallery in new tab */}
      <a
        href={galleryUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', position: 'relative', aspectRatio: '4/3', overflow: 'hidden', flexShrink: 0 }}
      >
        {gallery.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gallery.coverImageUrl}
            alt={gallery.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.25s ease' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-0)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>No cover image</span>
          </div>
        )}
        {/* Visibility badge */}
        <div
          style={{
            position:     'absolute',
            top:          12,
            left:         12,
            borderRadius: 9999,
            padding:      '3px 10px',
            fontSize:     11,
            fontWeight:   700,
            letterSpacing:'0.05em',
            textTransform:'uppercase',
            backdropFilter: 'blur(4px)',
            ...visibilityBadgeStyle(gallery.visibility),
          }}
        >
          {visibilityLabel(gallery.visibility)}
        </div>
      </a>

      {/* Info + actions */}
      <div style={{ padding: '14px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {/* Name + meta */}
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, margin: 0 }}>
            {gallery.name}
          </p>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: 5 }}>
            {displayName}&nbsp;·&nbsp;{gallery.imageCount} photo{gallery.imageCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 'auto' }}>
          <button
            type="button"
            onClick={() => onEdit(gallery)}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'transparent', border: '1.5px solid var(--border-default)',
              color: 'var(--text-primary)', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--surface-2)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'transparent' }}
          >
            Edit
          </button>
          {gallery.visibility !== 'private' && (
            <button
              type="button"
              onClick={() => onShare(gallery)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'transparent', border: '1.5px solid var(--border-default)',
                color: 'var(--text-primary)', cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--surface-2)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'transparent' }}
            >
              Share
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(gallery)}
            title="Delete gallery"
            style={{
              width: 34, height: 34, borderRadius: 8, fontSize: 13,
              background: 'transparent', border: '1.5px solid var(--border-default)',
              color: 'var(--status-error)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--status-error-bg)'; e.currentTarget.style.borderColor = 'var(--status-error)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-default)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function GalleriesClient({
  clubSlug,
  userId,
  displayName,
  galleries,
  libraryImages,
  compImages,
}: {
  clubSlug:      string
  userId:        string
  displayName:   string
  galleries:     GalleryData[]
  libraryImages: GalleryImage[]
  compImages:    CompImage[]
}) {
  const [createOpen,   setCreateOpen]   = useState(false)
  const [editGallery,  setEditGallery]  = useState<GalleryData | null>(null)
  const [delGallery,   setDelGallery]   = useState<GalleryData | null>(null)
  const [shareGallery, setShareGallery] = useState<GalleryData | null>(null)

  const atLimit   = galleries.length >= GALLERY_LIMIT
  const hasImages = libraryImages.length > 0

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <h1 className="font-[family-name:var(--font-lora)] text-[28px] font-bold leading-tight tracking-[-0.02em] text-content-primary">
          My galleries
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {galleries.length} of {GALLERY_LIMIT} created
        </p>
      </Box>

      {/* Empty state — no galleries yet */}
      {galleries.length === 0 && (
        <div className="flex flex-col items-center justify-center pb-16 pt-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/no-images-library.svg" alt="" width={510} className="-mb-4 opacity-70 dark:invert" />
          <p className="text-[22px] font-bold tracking-[-0.01em]" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-secondary)' }}>
            Every photographer has a story to tell
          </p>
          <p className="mt-2 text-[15px]" style={{ color: 'var(--text-secondary)' }}>
            Your gallery is where you tell yours — curate your best work and share it with the world.
          </p>
          <Tooltip title={!hasImages ? "You can create a gallery once you've uploaded your first image" : ''}>
            <span>
              <Button
                variant="contained"
                onClick={() => setCreateOpen(true)}
                disabled={!hasImages}
                sx={{ mt: 4 }}
              >
                + Create your first gallery
              </Button>
            </span>
          </Tooltip>
        </div>
      )}

      {/* Gallery grid + New Gallery card */}
      {(galleries.length > 0) && (
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap:                 24,
        }}>
          {galleries.map(g => (
            <GalleryCard
              key={g.id}
              gallery={g}
              clubSlug={clubSlug}
              userId={userId}
              displayName={displayName}
              onEdit={setEditGallery}
              onDelete={setDelGallery}
              onShare={setShareGallery}
            />
          ))}

          {/* New Gallery placeholder card */}
          {!atLimit && (
            <Tooltip title={!hasImages ? "Upload images to your library first" : ''}>
              <button
                type="button"
                onClick={() => { if (hasImages) setCreateOpen(true) }}
                disabled={!hasImages}
                style={{
                  borderRadius:   14,
                  border:         '2px dashed var(--border-default)',
                  background:     'transparent',
                  cursor:         hasImages ? 'pointer' : 'not-allowed',
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            10,
                  minHeight:      260,
                  opacity:        hasImages ? 1 : 0.5,
                  transition:     'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { if (hasImages) { e.currentTarget.style.borderColor = 'var(--action-primary)'; e.currentTarget.style.background = 'rgba(26,111,196,0.04)' } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  border: '1.5px dashed var(--border-strong)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-tertiary)',
                }}>
                  <AddIcon sx={{ fontSize: 22 }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>New Gallery</span>
              </button>
            </Tooltip>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateWizard
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        libraryImages={libraryImages}
        compImages={compImages}
      />
      <EditGalleryDialog
        gallery={editGallery}
        libraryImages={libraryImages}
        compImages={compImages}
        onClose={() => setEditGallery(null)}
      />
      <DeleteDialog
        gallery={delGallery}
        onClose={() => setDelGallery(null)}
      />
      <ShareDialog
        gallery={shareGallery}
        clubSlug={clubSlug}
        userId={userId}
        onClose={() => setShareGallery(null)}
      />
    </Box>
  )
}

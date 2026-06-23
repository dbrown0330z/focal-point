'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { deleteImage } from '@/app/[clubSlug]/(member)/library/actions'
import { submitFromLibrary } from '@/app/[clubSlug]/(member)/competitions/actions'
import { Lightbox, type LightboxImage } from '@/components/ui/Lightbox'
import UploadModal, { type OpenCompetition } from '@/components/library/UploadModal'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

type Image = {
  id: string
  title: string
  description: string | null
  storage_path: string
  created_at: string
  publicUrl: string
  isSubmitted: boolean
  exifData: Record<string, unknown> | null
  competitionTitle: string | null
  competitionDate: string | null
  categoryName: string | null
  score: number | null
}

type View         = 'gallery' | 'list'
type GallerySort  = 'date_desc' | 'title_asc' | 'title_desc'
type StatusFilter = 'all' | 'submitted' | 'available'
type SortKey      = 'title' | 'created_at'
type SortDir      = 'asc' | 'desc'

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconGrid() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z" />
    </svg>
  )
}

function IconList() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
    </svg>
  )
}

function IconChevronUp() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 15l-6-6-6 6" />
    </svg>
  )
}

function IconChevronDown() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  )
}

function IconInfo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4M12 8h.01" />
    </svg>
  )
}

// ─── Status badges ────────────────────────────────────────────────────────────

function SubmittedBadge() {
  return (
    <span className="text-xs font-medium" style={{ background: 'var(--badge-available-bg)', border: '1px solid var(--badge-available-border)', color: 'var(--badge-available-text)', borderRadius: 4, padding: '2px 7px' }}>
      Submitted
    </span>
  )
}

// ─── Quick submit modal ───────────────────────────────────────────────────────

function IconClose() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  )
}

function QuickSubmitModal({
  open,
  onClose,
  image,
  competition,
}: {
  open:        boolean
  onClose:     () => void
  image:       Image
  competition: OpenCompetition
}) {
  const router = useRouter()
  const [categoryId, setCategoryId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    if (open) { setCategoryId(''); setError(null) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow     = 'hidden'
    document.body.style.paddingRight = `${scrollbarWidth}px`
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow     = ''
      document.body.style.paddingRight = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const atLimit = competition.submissionLimit !== null &&
    competition.mySubmissionCount >= competition.submissionLimit

  async function handleSubmit() {
    if (!categoryId || atLimit) return
    setSubmitting(true)
    setError(null)
    const { error: err } = await submitFromLibrary(image.id, competition.id, categoryId)
    if (err) { setError(err); setSubmitting(false); return }
    setSubmitting(false)
    router.refresh()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="flex flex-col rounded-2xl shadow-2xl w-full"
        style={{ maxWidth: 420, background: 'var(--surface-1)', border: '1px solid var(--border-default)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0"
          style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
              Submit to competition
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {competition.title}
            </p>
          </div>
          <button onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ color: 'var(--text-tertiary)', background: 'var(--surface-2)' }}>
            <IconClose />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px' }}>
          {/* Image row */}
          <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.publicUrl} alt={image.title}
              className="rounded-lg flex-shrink-0"
              style={{ width: 56, height: 42, objectFit: 'cover' }} />
            <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {image.title}
            </p>
          </div>

          {atLimit ? (
            <div className="rounded-lg px-3 py-2.5 text-[12px]"
              style={{ background: 'var(--status-warning-bg)', color: 'var(--status-warning-text)', border: '1px solid rgba(166,124,0,0.25)' }}>
              You&apos;ve used all {competition.submissionLimit} submissions for this competition.
            </div>
          ) : (
            <>
              <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Select a category
              </p>
              <div className="flex flex-wrap gap-2">
                {competition.categories.map(cat => {
                  const isFull     = cat.limit !== null && cat.count >= cat.limit
                  const isSelected = categoryId === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      disabled={isFull}
                      onClick={() => !isFull && setCategoryId(cat.id)}
                      className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all"
                      style={{
                        background: isSelected ? 'var(--action-primary)' : isFull ? 'var(--surface-0)' : 'var(--surface-2)',
                        border:     `1px solid ${isSelected ? 'var(--action-primary)' : 'var(--border-default)'}`,
                        color:      isSelected ? '#fff' : isFull ? 'var(--text-disabled)' : 'var(--text-secondary)',
                        cursor:     isFull ? 'not-allowed' : 'pointer',
                        opacity:    isFull ? 0.6 : 1,
                      }}
                    >
                      {cat.name}
                      {cat.limit !== null && (
                        <span style={{ marginLeft: 4, opacity: 0.7 }}>({cat.count}/{cat.limit})</span>
                      )}
                    </button>
                  )
                })}
              </div>
              {competition.submissionLimit !== null && (
                <p className="mt-3 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                  {competition.mySubmissionCount} of {competition.submissionLimit} submissions used
                </p>
              )}
            </>
          )}

          {error && (
            <div className="mt-3 rounded-lg px-3 py-2.5 text-[12px]"
              style={{ background: 'var(--status-error-bg)', color: 'var(--status-error-text)', border: '1px solid rgba(211,47,47,0.25)' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 flex-shrink-0"
          style={{ padding: '12px 20px', borderTop: '1px solid var(--border-default)' }}>
          <button type="button" onClick={onClose}
            className="rounded-lg border px-4 py-1.5 text-[13px] font-semibold"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)', background: 'transparent' }}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit}
            disabled={!categoryId || submitting || atLimit}
            className="rounded-lg px-5 py-1.5 text-[13px] font-bold text-white"
            style={{
              background: 'var(--action-primary)',
              opacity:    (!categoryId || submitting || atLimit) ? 0.5 : 1,
              cursor:     (!categoryId || submitting || atLimit) ? 'not-allowed' : 'pointer',
            }}>
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete button ────────────────────────────────────────────────────────────

function DeleteImageButtonIcon({ imageId, storagePath }: { imageId: string; storagePath: string }) {
  const [error, setError]           = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    const result = await deleteImage(imageId, storagePath)
    if (result?.error) { setError(result.error); setConfirming(false) }
  }

  if (error) return <span className="text-xs text-status-error-text">{error}</span>

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button onClick={handleDelete} className="text-xs font-medium text-status-error-text hover:underline">Confirm</button>
        <button onClick={() => setConfirming(false)} className="text-xs text-content-tertiary hover:underline">Cancel</button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-content-tertiary hover:text-status-error-text transition-colors" aria-label="Delete">
      <IconTrash />
    </button>
  )
}

// ─── Sort header cell ─────────────────────────────────────────────────────────

function SortTh({ label, sortKey, current, dir, onSort, className }: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir
  onSort: (k: SortKey) => void; className?: string
}) {
  const active = current === sortKey
  return (
    <th className={`px-4 py-2.5 text-left ${className ?? ''}`}>
      <button
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-content-secondary hover:text-content-primary transition-colors"
      >
        {label}
        <span className={active ? 'text-action-primary' : 'text-content-tertiary'}>
          {active && dir === 'asc' ? <IconChevronUp /> : <IconChevronDown />}
        </span>
      </button>
    </th>
  )
}

// ─── EXIF formatting ──────────────────────────────────────────────────────────

function fNum(v: unknown): number | null {
  const n = Number(v)
  return isFinite(n) ? n : null
}

function fmtShutter(v: unknown): string | null {
  const n = fNum(v)
  if (n === null) return null
  if (n >= 1) return `${n} s`
  const denom = Math.round(1 / n)
  return `1/${denom} s`
}

function fmtAperture(v: unknown): string | null {
  const n = fNum(v)
  if (n === null) return null
  return `f/${n % 1 === 0 ? n : n.toFixed(1)}`
}

function fmtFocal(v: unknown): string | null {
  const n = fNum(v)
  return n !== null ? `${Math.round(n)} mm` : null
}

function fmtDate(v: unknown): string | null {
  if (!v) return null
  const d = new Date(v as string)
  if (isNaN(d.getTime())) return null
  const date = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const time = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${date} · ${time}`
}

function fmtColorSpace(v: unknown): string | null {
  if (v === 1 || v === '1') return 'sRGB'
  if (v === 65535 || v === '65535') return 'Uncalibrated'
  return v ? String(v) : null
}

function fmtDimensions(exif: Record<string, unknown>): string | null {
  const w = fNum(exif.ExifImageWidth ?? exif.PixelXDimension ?? exif.ImageWidth)
  const h = fNum(exif.ExifImageHeight ?? exif.PixelYDimension ?? exif.ImageHeight)
  if (!w || !h) return null
  return `${w.toLocaleString()} × ${h.toLocaleString()}`
}

function fmtCamera(exif: Record<string, unknown>): string | null {
  const make  = (exif.Make  as string | undefined)?.trim() ?? ''
  const model = (exif.Model as string | undefined)?.trim() ?? ''
  if (!make && !model) return null
  // Avoid "Sony Sony ILCE-7M4" if model already starts with make
  if (model.toLowerCase().startsWith(make.toLowerCase())) return model
  return [make, model].filter(Boolean).join(' ')
}

function fmtLens(exif: Record<string, unknown>): string | null {
  const make  = (exif.LensMake  as string | undefined)?.trim() ?? ''
  const model = (exif.LensModel as string | undefined)?.trim() ?? ''
  if (!make && !model) return null
  if (model.toLowerCase().startsWith(make.toLowerCase())) return model
  return [make, model].filter(Boolean).join(' ')
}

function buildExifRows(exif: Record<string, unknown>): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = []
  const add = (label: string, value: string | null) => { if (value) rows.push({ label, value }) }

  add('Captured',     fmtDate(exif.DateTimeOriginal))
  add('Dimensions',   fmtDimensions(exif))
  add('Color space',  fmtColorSpace(exif.ColorSpace))
  add('Camera',       fmtCamera(exif))
  add('Lens',         fmtLens(exif))
  add('Focal length', fmtFocal(exif.FocalLength))
  add('Aperture',     fmtAperture(exif.FNumber))
  add('Shutter speed',fmtShutter(exif.ExposureTime))
  add('ISO',          (exif.ISO ?? exif.ISOSpeedRatings) ? String(exif.ISO ?? exif.ISOSpeedRatings) : null)

  return rows
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

// Inline panel — renders as a flex sibling to the table, no overlay
function DetailPanel({ image, onClose }: { image: Image; onClose: () => void }) {
  const exifRows = image.exifData ? buildExifRows(image.exifData) : []

  return (
    <div className="flex w-72 flex-shrink-0 flex-col overflow-y-auto rounded-xl border border-border-default bg-surface-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <h2 className="truncate pr-2 text-sm font-semibold text-content-primary">{image.title}</h2>
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-md p-1 text-content-tertiary hover:bg-surface-1 hover:text-content-primary transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Thumbnail */}
      <div className="p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.publicUrl}
          alt={image.title}
          className="w-full rounded-lg object-cover shadow-sm"
          style={{ maxHeight: '200px', objectFit: 'cover' }}
        />
      </div>

      {/* Submission info — only shown when submitted */}
      {image.isSubmitted && (
        <div className="px-4 pb-2">
          <SubmittedBadge />
          {/* Score — large and prominent */}
          {image.score !== null && (
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-content-secondary">Score</span>
              <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{image.score}</span>
            </div>
          )}
          {(image.competitionDate || image.categoryName) && (
            <dl className="mt-2 space-y-1">
              {image.competitionDate && (
                <div className="flex justify-between gap-2 text-xs">
                  <dt className="text-content-secondary">Competition</dt>
                  <dd className="font-medium text-content-primary">
                    {new Date(image.competitionDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </dd>
                </div>
              )}
              {image.categoryName && (
                <div className="flex justify-between gap-2 text-xs">
                  <dt className="text-content-secondary">Category</dt>
                  <dd className="font-medium text-content-primary">{image.categoryName}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      )}

      <div className="mx-4 mt-3 border-t border-border-subtle" />

      {/* EXIF */}
      <div className="px-4 py-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-secondary">EXIF data</p>
        {exifRows.length === 0 ? (
          <p className="text-xs text-content-tertiary">No EXIF data available</p>
        ) : (
          <dl className="space-y-1.5">
            {exifRows.map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-xs text-content-secondary">{label}</dt>
                <dd className="text-right text-xs font-medium text-content-primary">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {image.description && (
        <>
          <div className="mx-4 border-t border-border-subtle" />
          <div className="px-4 py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-content-secondary">Description</p>
            <p className="text-xs text-content-primary">{image.description}</p>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'submitted', label: 'Submitted' },
  { key: 'available', label: 'Available' },
]

export default function LibraryClient({
  images,
  clubSlug,
  userId,
  openCompetition,
}: {
  images:          Image[]
  clubSlug:        string
  userId:          string
  openCompetition: OpenCompetition | null
}) {
  const [view, setView]                       = useState<View>('gallery')
  const [lightboxIndex, setLightboxIndex]     = useState<number | null>(null)
  const [detailImage, setDetailImage]         = useState<Image | null>(null)
  const [uploadOpen, setUploadOpen]           = useState(false)
  const [quickSubmitImage, setQuickSubmitImage] = useState<Image | null>(null)
  // Gallery controls
  const [gallerySort, setGallerySort]     = useState<GallerySort>('date_desc')
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>('all')
  // List sort
  const [sortKey, setSortKey]             = useState<SortKey>('created_at')
  const [sortDir, setSortDir]             = useState<SortDir>('desc')

  // Gallery: sort + filter
  const gallerySorted = [...images].sort((a, b) => {
    if (gallerySort === 'title_asc')  return a.title.localeCompare(b.title)
    if (gallerySort === 'title_desc') return b.title.localeCompare(a.title)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
  const galleryFiltered = gallerySorted.filter(img => {
    if (statusFilter === 'submitted') return img.isSubmitted
    if (statusFilter === 'available') return !img.isSubmitted
    return true
  })

  // List sort + filter
  const listSorted = [...images].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'title')      return mul * a.title.localeCompare(b.title)
    if (sortKey === 'created_at') return mul * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    return 0
  })
  const listFiltered = listSorted.filter(img => {
    if (statusFilter === 'submitted') return img.isSubmitted
    if (statusFilter === 'available') return !img.isSubmitted
    return true
  })

  function handleListSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const lightboxImages = view === 'list' ? listFiltered : galleryFiltered
  const openLightbox   = (i: number) => setLightboxIndex(i)

  // Arrow-key navigation through rows when detail panel is open
  useEffect(() => {
    if (!detailImage) return
    function handleKey(e: KeyboardEvent) {
      const idx = listFiltered.findIndex(img => img.id === detailImage!.id)
      if (e.key === 'ArrowDown' && idx < listFiltered.length - 1) {
        e.preventDefault()
        setDetailImage(listFiltered[idx + 1])
      } else if (e.key === 'ArrowUp' && idx > 0) {
        e.preventDefault()
        setDetailImage(listFiltered[idx - 1])
      } else if (e.key === 'Escape') {
        setDetailImage(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [detailImage, listSorted])

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-lora)] text-[28px] font-bold leading-tight tracking-[-0.02em] text-content-primary">My Images</h1>
        </div>
        <div className="flex items-center gap-4">
          {images.length > 0 && (
            <div style={{ display: 'inline-flex' }}>
              {([['gallery', <IconGrid key="g" />], ['list', <IconList key="l" />]] as const).map(([v, icon], i) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  aria-label={v}
                  className="toggle-btn"
                  data-active={view === v ? 'true' : undefined}
                  style={{
                    background:   view === v ? 'var(--toggle-selected)' : 'transparent',
                    border:       `1px solid ${view === v ? 'var(--toggle-selected)' : 'var(--border-default)'}`,
                    borderRadius: i === 0 ? '7px 0 0 7px' : '0 7px 7px 0',
                    marginLeft:   i > 0 ? -1 : 0,
                    padding:      '5px 9px',
                    cursor:       'pointer',
                    color:        view === v ? '#fff' : 'var(--text-tertiary)',
                    display:      'flex',
                    alignItems:   'center',
                    position:     'relative',
                    zIndex:       view === v ? 1 : 0,
                    transition:   'background 0.12s, color 0.12s',
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          )}
          {images.length > 0 && (
            <Button variant="contained" onClick={() => setUploadOpen(true)}>
              + Add image
            </Button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {images.length === 0 && (
        <div className="flex flex-col items-center justify-center pb-16 pt-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/no-images-library.svg"
            alt=""
            width={510}
            className="-mb-4 opacity-70 dark:invert"
          />
          <p className="text-[22px] font-bold tracking-[-0.01em]" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-secondary)' }}>
            Every great library starts with one photo
          </p>
          <p className="mt-2 text-[15px]" style={{ color: 'var(--text-secondary)' }}>
            You haven&apos;t added anything yet — upload your first image to get started.
          </p>
          <Button variant="contained" onClick={() => setUploadOpen(true)} sx={{ mt: 4 }}>
            + Add image
          </Button>
        </div>
      )}

      {/* ── Gallery ── */}
      {images.length > 0 && view === 'gallery' && (
        <>
          {/* Gallery toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {/* Status filter — connected toggle (judge portal style) */}
            <div style={{ display: 'inline-flex' }}>
              {STATUS_FILTERS.map((f, i) => {
                const active = statusFilter === f.key
                return (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className="toggle-btn"
                    data-active={active ? 'true' : undefined}
                    style={{
                      padding:      '5px 18px',
                      background:   active ? 'var(--toggle-selected)' : 'transparent',
                      border:       `1px solid ${active ? 'var(--toggle-selected)' : 'var(--border-default)'}`,
                      borderRadius: i === 0 ? '7px 0 0 7px' : i === STATUS_FILTERS.length - 1 ? '0 7px 7px 0' : 0,
                      marginLeft:   i > 0 ? -1 : 0,
                      cursor:       'pointer',
                      color:        active ? '#fff' : 'var(--text-secondary)',
                      fontSize:     13,
                      fontWeight:   active ? 700 : 500,
                      fontFamily:   'inherit',
                      position:     'relative',
                      zIndex:       active ? 1 : 0,
                      transition:   'background 0.12s, color 0.12s',
                    }}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>

            {/* Sort by */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'inherit' }}>Sort by:</span>
              <Select
                value={gallerySort}
                onChange={e => setGallerySort(e.target.value as GallerySort)}
                size="small"
                sx={{ fontSize: 14, fontFamily: 'inherit', minWidth: 140 }}
              >
                <MenuItem value="date_desc" sx={{ fontSize: 14, fontFamily: 'inherit' }}>Date added</MenuItem>
                <MenuItem value="title_asc"  sx={{ fontSize: 14, fontFamily: 'inherit' }}>Name (A–Z)</MenuItem>
                <MenuItem value="title_desc" sx={{ fontSize: 14, fontFamily: 'inherit' }}>Name (Z–A)</MenuItem>
              </Select>
            </div>

            {/* Live count */}
            <span className="ml-auto text-sm" style={{ color: 'var(--text-secondary)' }}>
              {galleryFiltered.length} {galleryFiltered.length === 1 ? 'photo' : 'photos'}
              {statusFilter !== 'all' && images.length !== galleryFiltered.length && (
                <span style={{ color: 'var(--text-tertiary)' }}> of {images.length}</span>
              )}
            </span>
          </div>

          {galleryFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-default py-16 text-center">
              <p className="text-sm font-medium text-content-secondary">No photos match this filter</p>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              {/* Grid — shrinks when panel is open */}
              <div className="min-w-0 flex-1">
                <div className="transition-all duration-200" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: 18 }}>
                  {galleryFiltered.map((image, i) => {
                    const isActive = detailImage?.id === image.id
                    return (
                      <div key={image.id} className="group">
                        <button
                          onClick={() => openLightbox(i)}
                          className={`relative block w-full overflow-hidden rounded-lg bg-surface-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-primary transition-all ${isActive ? 'ring-2 ring-action-primary' : ''}`}
                          style={{ paddingTop: '72%' }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image.publicUrl} alt={image.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </button>
                        <div className="mt-2 flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-content-primary" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>{image.title}</p>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              {image.isSubmitted ? (
                                <>
                                  <SubmittedBadge />
                                  {image.score !== null && (
                                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{image.score}</span>
                                  )}
                                </>
                              ) : openCompetition ? (
                                <button
                                  onClick={e => { e.stopPropagation(); setQuickSubmitImage(image) }}
                                  className="text-[12px] font-semibold transition-colors hover:underline"
                                  style={{ color: 'var(--action-primary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                >
                                  Submit →
                                </button>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-1">
                            <button
                              onClick={() => setDetailImage(isActive ? null : image)}
                              className={`transition-colors ${isActive ? 'text-action-primary' : 'text-content-tertiary hover:text-action-primary'}`}
                              aria-label="Details"
                            >
                              <IconInfo />
                            </button>
                            {!image.isSubmitted && <DeleteImageButtonIcon imageId={image.id} storagePath={image.storage_path} />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Detail panel */}
              <div className={`transition-all duration-200 ${detailImage ? 'w-72 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
                {detailImage && (
                  <DetailPanel image={detailImage} onClose={() => setDetailImage(null)} />
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── List ── */}
      {images.length > 0 && view === 'list' && (
        <>
          {/* List toolbar */}
          <div className="mb-4 flex items-center">
            <div style={{ display: 'inline-flex' }}>
              {STATUS_FILTERS.map((f, i) => {
                const active = statusFilter === f.key
                return (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className="toggle-btn"
                    data-active={active ? 'true' : undefined}
                    style={{
                      padding:      '5px 18px',
                      background:   active ? 'var(--toggle-selected)' : 'transparent',
                      border:       `1px solid ${active ? 'var(--toggle-selected)' : 'var(--border-default)'}`,
                      borderRadius: i === 0 ? '7px 0 0 7px' : i === STATUS_FILTERS.length - 1 ? '0 7px 7px 0' : 0,
                      marginLeft:   i > 0 ? -1 : 0,
                      cursor:       'pointer',
                      color:        active ? '#fff' : 'var(--text-secondary)',
                      fontSize:     13,
                      fontWeight:   active ? 700 : 500,
                      fontFamily:   'inherit',
                      position:     'relative',
                      zIndex:       active ? 1 : 0,
                      transition:   'background 0.12s, color 0.12s',
                    }}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>

            {/* Live count */}
            <span className="ml-auto text-sm" style={{ color: 'var(--text-secondary)' }}>
              {listFiltered.length} {listFiltered.length === 1 ? 'photo' : 'photos'}
              {statusFilter !== 'all' && images.length !== listFiltered.length && (
                <span style={{ color: 'var(--text-tertiary)' }}> of {images.length}</span>
              )}
            </span>
          </div>

        {listFiltered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-default py-16 text-center">
            <p className="text-sm font-medium text-content-secondary">No photos match this filter</p>
          </div>
        ) : (
        <div className="flex items-start gap-3">
          {/* Table — shrinks when panel is open */}
          <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-border-default transition-all duration-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default bg-surface-1">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-content-secondary w-16">Photo</th>
                  <SortTh label="Name"       sortKey="title"      current={sortKey} dir={sortDir} onSort={handleListSort} />
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-content-secondary whitespace-nowrap">Status</th>
                  <SortTh label="Date Added" sortKey="created_at" current={sortKey} dir={sortDir} onSort={handleListSort} className="hidden sm:table-cell" />
                  <th className={`hidden px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-content-secondary whitespace-nowrap ${detailImage ? 'xl:table-cell' : 'lg:table-cell'}`}>Competition date</th>
                  <th className={`hidden px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-content-secondary ${detailImage ? 'xl:table-cell' : 'lg:table-cell'}`}>Category</th>
                  <th className={`hidden px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-content-secondary ${detailImage ? 'xl:table-cell' : 'lg:table-cell'}`}>Score</th>
                  <th className="px-4 py-2.5 w-10" />
                  <th className="px-4 py-2.5 w-16" />
                </tr>
              </thead>
              <tbody>
                {listFiltered.map((image, i) => {
                  const isActive = detailImage?.id === image.id
                  return (
                    <tr
                      key={image.id}
                      className={`border-b border-border-default last:border-0 transition-colors ${
                        isActive
                          ? 'bg-action-primary/8 ring-1 ring-inset ring-action-primary/20'
                          : 'hover:bg-surface-1'
                      }`}
                    >
                      {/* Thumbnail */}
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => openLightbox(i)}
                          className="block overflow-hidden rounded-md bg-surface-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-primary flex-shrink-0"
                          style={{ width: 52, height: 38 }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image.publicUrl} alt={image.title} className="h-full w-full object-cover" />
                        </button>
                      </td>
                      {/* Name */}
                      <td className="px-4 py-2.5 font-medium text-content-primary">{image.title}</td>
                      {/* Status */}
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {image.isSubmitted ? (
                          !(image.score !== null || image.competitionDate) && <SubmittedBadge />
                        ) : openCompetition ? (
                          <button
                            onClick={() => setQuickSubmitImage(image)}
                            className="text-[12px] font-semibold transition-colors hover:underline"
                            style={{ color: 'var(--action-primary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                          >
                            Submit →
                          </button>
                        ) : null}
                      </td>
                      {/* Date added */}
                      <td className="hidden px-4 py-2.5 text-content-secondary whitespace-nowrap sm:table-cell">
                        {new Date(image.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      {/* Competition date */}
                      <td className={`hidden px-4 py-2.5 text-content-secondary whitespace-nowrap ${detailImage ? 'xl:table-cell' : 'lg:table-cell'}`}>
                        {image.competitionDate
                          ? new Date(image.competitionDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          : <span className="text-content-tertiary">—</span>}
                      </td>
                      {/* Category */}
                      <td className={`hidden px-4 py-2.5 text-content-secondary ${detailImage ? 'xl:table-cell' : 'lg:table-cell'}`}>
                        {image.categoryName ?? <span className="text-content-tertiary">—</span>}
                      </td>
                      {/* Score */}
                      <td className={`hidden px-4 py-2.5 text-content-secondary ${detailImage ? 'xl:table-cell' : 'lg:table-cell'}`}>
                        {image.score !== null ? image.score : <span className="text-content-tertiary">—</span>}
                      </td>
                      {/* Delete — hidden when submitted */}
                      <td className="px-4 py-2.5 text-right">
                        {!image.isSubmitted && <DeleteImageButtonIcon imageId={image.id} storagePath={image.storage_path} />}
                      </td>
                      {/* Details */}
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => setDetailImage(isActive ? null : image)}
                          className={`text-xs font-medium whitespace-nowrap transition-colors ${isActive ? 'text-content-tertiary hover:text-content-secondary' : 'text-action-primary hover:underline'}`}
                        >
                          {isActive ? 'Close' : 'Details'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Detail panel — slides in as flex sibling */}
          <div className={`transition-all duration-200 ${detailImage ? 'w-72 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
            {detailImage && (
              <DetailPanel image={detailImage} onClose={() => setDetailImage(null)} />
            )}
          </div>
        </div>
        )}
        </>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={lightboxImages.map((img): LightboxImage => ({ src: img.publicUrl, title: img.title }))}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          contextTitle="My Image Gallery"
        />
      )}

      {/* Quick submit modal */}
      {quickSubmitImage && openCompetition && (
        <QuickSubmitModal
          open={quickSubmitImage !== null}
          onClose={() => setQuickSubmitImage(null)}
          image={quickSubmitImage}
          competition={openCompetition}
        />
      )}

      {/* Upload modal */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        userId={userId}
        openCompetition={openCompetition}
      />

    </>
  )
}

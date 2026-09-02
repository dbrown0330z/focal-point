'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@mui/material'
import { deleteImage } from '@/app/(member)/library/actions'

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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
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

// ─── Submission badge ─────────────────────────────────────────────────────────

function SubmissionBadge({ submitted }: { submitted: boolean }) {
  return submitted
    ? <span className="text-xs font-medium text-status-error-text">Submitted</span>
    : <span className="text-xs font-medium text-status-success-text">Available</span>
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

      {/* Status + competition */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2">
          <SubmissionBadge submitted={image.isSubmitted} />
          {image.competitionTitle && (
            <span className="truncate text-xs text-content-tertiary">· {image.competitionTitle}</span>
          )}
        </div>
        {(image.categoryName || image.score !== null || image.competitionDate) && (
          <dl className="mt-2 space-y-1">
            {image.categoryName && (
              <div className="flex justify-between gap-2 text-xs">
                <dt className="text-content-secondary">Category</dt>
                <dd className="font-medium text-content-primary">{image.categoryName}</dd>
              </div>
            )}
            {image.score !== null && (
              <div className="flex justify-between gap-2 text-xs">
                <dt className="text-content-secondary">Score</dt>
                <dd className="font-medium text-content-primary">{image.score}</dd>
              </div>
            )}
            {image.competitionDate && (
              <div className="flex justify-between gap-2 text-xs">
                <dt className="text-content-secondary">Competition</dt>
                <dd className="font-medium text-content-primary">
                  {new Date(image.competitionDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>

      <div className="mx-4 border-t border-border-subtle" />

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

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ images, index, onClose, onPrev, onNext }: {
  images: Image[]; index: number
  onClose: () => void; onPrev: () => void; onNext: () => void
}) {
  const image = images[index]

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  onPrev()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onPrev, onNext, onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90" onClick={onClose}>
      <button onClick={onClose} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors" aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <button onClick={e => { e.stopPropagation(); onPrev() }} disabled={images.length <= 1} className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-20" aria-label="Previous">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="flex max-h-[80vh] max-w-[85vw] flex-col items-center" onClick={e => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.publicUrl} alt={image.title} className="max-h-[75vh] max-w-[85vw] rounded-lg object-contain shadow-2xl" />
        <div className="mt-3 flex flex-col items-center gap-0.5">
          {image.title && <p className="text-sm font-medium text-white">{image.title}</p>}
          <p className="text-xs text-white/50">{index + 1} of {images.length}</p>
        </div>
      </div>
      <button onClick={e => { e.stopPropagation(); onNext() }} disabled={images.length <= 1} className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-20" aria-label="Next">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'submitted', label: 'Submitted' },
  { key: 'available', label: 'Available' },
]

export default function LibraryClient({ images }: { images: Image[] }) {
  const [view, setView]                   = useState<View>('gallery')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [detailImage, setDetailImage]     = useState<Image | null>(null)
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

  // List sort
  const listSorted = [...images].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'title')      return mul * a.title.localeCompare(b.title)
    if (sortKey === 'created_at') return mul * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    return 0
  })

  function handleListSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const lightboxImages = view === 'list' ? listSorted : galleryFiltered
  const openLightbox   = (i: number) => setLightboxIndex(i)
  const closeLightbox  = useCallback(() => setLightboxIndex(null), [])
  const goPrev = useCallback(() =>
    setLightboxIndex(i => i === null ? null : (i - 1 + lightboxImages.length) % lightboxImages.length),
    [lightboxImages.length])
  const goNext = useCallback(() =>
    setLightboxIndex(i => i === null ? null : (i + 1) % lightboxImages.length),
    [lightboxImages.length])

  // Arrow-key navigation through rows when detail panel is open
  useEffect(() => {
    if (!detailImage) return
    function handleKey(e: KeyboardEvent) {
      const idx = listSorted.findIndex(img => img.id === detailImage!.id)
      if (e.key === 'ArrowDown' && idx < listSorted.length - 1) {
        e.preventDefault()
        setDetailImage(listSorted[idx + 1])
      } else if (e.key === 'ArrowUp' && idx > 0) {
        e.preventDefault()
        setDetailImage(listSorted[idx - 1])
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
          <h1 className="text-xl font-semibold text-content-primary">My Images</h1>
          <p className="mt-0.5 text-sm text-content-secondary">
            {images.length} {images.length === 1 ? 'photo' : 'photos'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {images.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('gallery')}
                className={`flex items-center gap-1.5 text-sm transition-colors ${view === 'gallery' ? 'text-action-primary font-medium' : 'text-content-tertiary hover:text-content-secondary'}`}
              >
                <IconGrid /> Gallery
              </button>
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 text-sm transition-colors ${view === 'list' ? 'text-action-primary font-medium' : 'text-content-tertiary hover:text-content-secondary'}`}
              >
                <IconList /> List
              </button>
            </div>
          )}
          <Button variant="contained" component={Link} href="/library/upload">
            + Add image
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {images.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-default py-20 text-center">
          <p className="text-sm font-medium text-content-secondary">No images yet</p>
          <p className="mt-1 text-xs text-content-tertiary">Add your first image to get started</p>
          <Button variant="contained" component={Link} href="/library/upload" sx={{ mt: 2 }}>
            + Add image
          </Button>
        </div>
      )}

      {/* ── Gallery ── */}
      {images.length > 0 && view === 'gallery' && (
        <>
          {/* Gallery toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <select
              value={gallerySort}
              onChange={e => setGallerySort(e.target.value as GallerySort)}
              className="rounded-lg border border-border-default bg-surface-2 px-3 py-1.5 text-sm text-content-primary focus:border-action-primary focus:outline-none focus:ring-1 focus:ring-action-primary"
            >
              <option value="date_desc">Date added</option>
              <option value="title_asc">Name (A–Z)</option>
              <option value="title_desc">Name (Z–A)</option>
            </select>
            <div className="flex overflow-hidden rounded-lg border border-border-default">
              {STATUS_FILTERS.map((f, i) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-1.5 text-sm transition-colors ${i > 0 ? 'border-l border-border-default' : ''} ${statusFilter === f.key ? 'bg-action-primary font-medium text-white' : 'text-content-secondary hover:bg-surface-1'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {galleryFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-default py-16 text-center">
              <p className="text-sm font-medium text-content-secondary">No photos match this filter</p>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              {/* Grid — shrinks when panel is open */}
              <div className="min-w-0 flex-1">
                <div className={`grid gap-4 ${detailImage ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'} transition-all duration-200`}>
                  {galleryFiltered.map((image, i) => {
                    const isActive = detailImage?.id === image.id
                    return (
                      <div key={image.id} className="group">
                        <button
                          onClick={() => openLightbox(i)}
                          className={`relative block w-full aspect-square overflow-hidden rounded-lg bg-surface-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-primary transition-all ${isActive ? 'ring-2 ring-action-primary' : ''}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image.publicUrl} alt={image.title} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </button>
                        <div className="mt-1.5 flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-content-primary">{image.title}</p>
                            <SubmissionBadge submitted={image.isSubmitted} />
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-1">
                            <button
                              onClick={() => setDetailImage(isActive ? null : image)}
                              className={`transition-colors ${isActive ? 'text-action-primary' : 'text-content-tertiary hover:text-action-primary'}`}
                              aria-label="Details"
                            >
                              <IconInfo />
                            </button>
                            <DeleteImageButtonIcon imageId={image.id} storagePath={image.storage_path} />
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
                {listSorted.map((image, i) => {
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
                          className="block h-12 w-12 overflow-hidden rounded-md bg-surface-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-primary"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image.publicUrl} alt={image.title} className="h-full w-full object-cover" />
                        </button>
                      </td>
                      {/* Name */}
                      <td className="px-4 py-2.5 font-medium text-content-primary">{image.title}</td>
                      {/* Status */}
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <SubmissionBadge submitted={image.isSubmitted} />
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
                      {/* Delete */}
                      <td className="px-4 py-2.5 text-right">
                        <DeleteImageButtonIcon imageId={image.id} storagePath={image.storage_path} />
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

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox images={lightboxImages} index={lightboxIndex} onClose={closeLightbox} onPrev={goPrev} onNext={goNext} />
      )}

    </>
  )
}

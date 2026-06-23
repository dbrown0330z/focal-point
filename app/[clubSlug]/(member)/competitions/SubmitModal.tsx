'use client'

import { useState, useRef, useEffect, useCallback, Fragment } from 'react'
import { createClient } from '@/lib/supabase/client'
import { submitFromLibrary, submitUploadedImage, editImageTitleAction } from './actions'
import * as exifr from 'exifr'

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = { id: string; name: string; count?: number }

type LibraryImage = {
  id: string
  title: string
  storage_path: string
  created_at: string
  publicUrl: string
}

type SubmitModalProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
  competitionId: string
  competitionTitle: string
  categories: Category[]
  /** Optional pre-fetched library images. If omitted, SubmitModal fetches internally. */
  libraryImages?: LibraryImage[]
  fullCategoryIds?: string[]
  /** When provided, skips source-selection step and goes straight to a 2-step library-detail flow. */
  preselectedImage?: { id: string; title: string; publicUrl: string }
}

type Source = 'upload' | 'library'
type Step = 0 | 1 | 2  // 0=source, 1=upload/library/detail, 2=confirm

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  )
}
function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  )
}
function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  )
}
function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  )
}
function IconUploadCloud() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
      <path d="M12 12v9"/>
      <path d="m16 16-4-4-4 4"/>
    </svg>
  )
}
function IconImage() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <circle cx="9" cy="9" r="2"/>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
  )
}
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.3-4.3"/>
    </svg>
  )
}
function IconZoomIn() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.3-4.3"/>
      <path d="M11 8v6M8 11h6"/>
    </svg>
  )
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ image, onClose }: { image: LibraryImage; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white"
        >
          <IconClose />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.publicUrl} alt={image.title} className="max-h-[400px] w-full object-cover" />
        <div className="bg-[var(--surface-1)] px-4 py-3">
          <p className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>{image.title}</p>
          <p className="mt-0.5 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            {new Date(image.created_at).toLocaleDateString()} · Press Esc to close
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({ stepIndex, labels }: { stepIndex: number; labels: string[] }) {
  return (
    <div className="flex justify-center py-4">
      <div className="flex items-center gap-0" style={{ width: '60%', minWidth: 240 }}>
        {labels.map((label, i) => {
          const done   = i < stepIndex
          const active = i === stepIndex
          return (
            <div key={i} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors"
                  style={{
                    background:  done || active ? 'var(--action-primary)' : 'var(--surface-3, #333)',
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
                  style={{ background: i < stepIndex ? 'var(--action-primary)' : 'var(--border-default)' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Category Buttons ─────────────────────────────────────────────────────────

function CategoryButtons({
  categories, selected, onSelect, fullCategoryIds = [],
}: {
  categories: Category[]
  selected: string
  onSelect: (id: string) => void
  fullCategoryIds?: string[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(cat => {
        const isFull = fullCategoryIds.includes(cat.id) && cat.id !== selected
        return (
          <button
            key={cat.id}
            type="button"
            disabled={isFull}
            onClick={() => !isFull && onSelect(cat.id)}
            className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--action-primary)]/40"
            style={{
              background:  selected === cat.id ? 'var(--action-primary)' : isFull ? 'var(--surface-0)' : 'var(--surface-2)',
              borderColor: selected === cat.id ? 'var(--action-primary)' : isFull ? 'var(--border-subtle)' : 'var(--border-default)',
              color:       selected === cat.id ? '#fff' : isFull ? 'var(--text-disabled)' : 'var(--text-secondary)',
              cursor:      isFull ? 'not-allowed' : 'pointer',
              opacity:     isFull ? 0.6 : 1,
            }}
          >
            {cat.name}
            {isFull
              ? <span style={{ marginLeft: 5, opacity: 0.8 }}>· Full</span>
              : cat.count !== undefined && cat.count > 0
                ? <span style={{ marginLeft: 5, opacity: 0.55, fontSize: 11 }}>{cat.count}</span>
                : null}
          </button>
        )
      })}
    </div>
  )
}

// ─── Step 0: Choose Source ────────────────────────────────────────────────────

function SourceStep({ onSelect }: { onSelect: (src: Source) => void }) {
  return (
    <div className="fade-up space-y-3">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Choose how to add your image to this competition.
      </p>
      {(['upload', 'library'] as Source[]).map(src => (
        <button
          key={src}
          type="button"
          onClick={() => onSelect(src)}
          className="group flex w-full items-center gap-4 rounded-xl border-2 px-5 py-5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-[var(--action-primary)]/40 hover:border-[var(--action-primary)]"
          style={{ borderColor: 'var(--border-default)', background: 'transparent' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(26,111,196,0.04)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'var(--surface-3, var(--surface-1))', color: 'var(--text-secondary)' }}
          >
            {src === 'upload' ? <IconUploadCloud /> : <IconImage />}
          </div>
          <div className="flex-1">
            <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {src === 'upload' ? 'Upload a new photo' : 'Choose from my library'}
            </p>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {src === 'upload'
                ? 'Upload a JPEG, PNG or WebP file directly from your device'
                : 'Select a photo you have already added to your library'}
            </p>
          </div>
          <IconChevronRight />
        </button>
      ))}
    </div>
  )
}

// ─── Step 1a: Upload ──────────────────────────────────────────────────────────

type UploadStepProps = {
  categories: Category[]
  categoryId: string
  onCategorySelect: (id: string) => void
  file: File | null
  preview: string | null
  title: string
  onFileChange: (file: File, preview: string) => void
  onTitleChange: (t: string) => void
  fullCategoryIds?: string[]
}

function UploadStep({ categories, categoryId, onCategorySelect, file, preview, title, onFileChange, onTitleChange, fullCategoryIds }: UploadStepProps) {
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    const f = files?.[0]
    if (!f) return
    onFileChange(f, URL.createObjectURL(f))
  }

  return (
    <div className="fade-up space-y-5">
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files) }}
        className="relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-colors"
        style={{ borderColor: drag ? 'var(--action-primary)' : 'var(--border-default)', background: drag ? 'rgba(26,111,196,0.05)' : 'transparent' }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="max-h-[260px] w-full rounded-xl object-contain" style={{ background: 'var(--surface-0)' }} />
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center" style={{ color: 'var(--text-tertiary)' }}>
            <IconUploadCloud />
            <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Click or drag &amp; drop to upload</p>
            <p className="mt-1 text-xs">JPEG, PNG, WebP · max 20 MB</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>
      {preview && (
        <div className="flex justify-end -mt-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="text-[13px] font-medium underline-offset-2 hover:underline" style={{ color: 'var(--action-primary)' }}>
            Select a different image
          </button>
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Image title <span style={{ color: 'var(--status-error)' }}>*</span>
        </label>
        <input
          type="text" value={title} onChange={e => onTitleChange(e.target.value)}
          placeholder="e.g. Golden Hour at the Pier" maxLength={120}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
          style={{ border: '1.5px solid var(--border-default)', background: 'var(--surface-2)', color: 'var(--text-primary)' }}
          onFocus={e => (e.target.style.borderColor = 'var(--action-primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border-default)')}
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Category</p>
        <CategoryButtons categories={categories} selected={categoryId} onSelect={onCategorySelect} fullCategoryIds={fullCategoryIds} />
      </div>
    </div>
  )
}

// ─── Step 1b: Library (3-step mode) ──────────────────────────────────────────

type LibraryStepProps = {
  images: LibraryImage[]
  loading: boolean
  selectedId: string
  categoryId: string
  categories: Category[]
  onSelect: (id: string) => void
  onCategorySelect: (id: string) => void
  fullCategoryIds?: string[]
}

function LibraryStep({ images, loading, selectedId, categoryId, categories, onSelect, onCategorySelect, fullCategoryIds }: LibraryStepProps) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'date_desc' | 'title_asc'>('date_desc')
  const [lightbox, setLightbox] = useState<LibraryImage | null>(null)

  const filtered = images
    .filter(img => img.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'date_desc'
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : a.title.localeCompare(b.title))

  return (
    <div className="fade-up space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }}><IconSearch /></div>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search your library…"
            className="w-full rounded-lg py-2 pl-9 pr-3 text-sm outline-none"
            style={{ border: '1.5px solid var(--border-default)', background: 'var(--surface-2)', color: 'var(--text-primary)' }}
            onFocus={e => (e.target.style.borderColor = 'var(--action-primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border-default)')}
          />
        </div>
        <select
          value={sort} onChange={e => setSort(e.target.value as typeof sort)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ border: '1.5px solid var(--border-default)', background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
        >
          <option value="date_desc">Newest first</option>
          <option value="title_asc">Title A–Z</option>
        </select>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading your library…</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {images.length === 0 ? 'No available images in your library.' : 'No images match your search.'}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2.5 max-h-[340px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
          {filtered.map(img => {
            const selected = img.id === selectedId
            return (
              <div
                key={img.id}
                onClick={() => onSelect(img.id)}
                className="group relative cursor-pointer overflow-hidden rounded-[9px] transition-all"
                style={{
                  border:     selected ? '2px solid var(--action-primary)' : '2px solid var(--border-default)',
                  boxShadow:  selected ? '0 0 0 3px rgba(26,111,196,0.22)' : 'none',
                }}
              >
                <div className="relative" style={{ paddingTop: '70%' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.publicUrl} alt={img.title} className="absolute inset-0 h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setLightbox(img) }}
                    className="absolute right-1.5 top-1.5 hidden h-6 w-6 items-center justify-center rounded-full text-white group-hover:flex"
                    style={{ background: 'rgba(0,0,0,0.60)' }}
                  >
                    <IconZoomIn />
                  </button>
                  {selected && (
                    <div className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full" style={{ background: 'var(--action-primary)', color: '#fff' }}>
                      <IconCheck size={11} />
                    </div>
                  )}
                </div>
                <div className="px-2 py-1.5" style={{ background: 'var(--surface-2)' }}>
                  <p
                    className="overflow-hidden text-[11px] font-semibold leading-snug"
                    style={{ color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '2.3em' }}
                  >
                    {img.title}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedId && (
        <div className="fade-up space-y-3">
          <div className="flex justify-end">
            <button type="button" onClick={() => onSelect('')} className="text-[13px] font-medium underline-offset-2 hover:underline" style={{ color: 'var(--action-primary)' }}>
              Select a different image
            </button>
          </div>
          <hr style={{ borderColor: 'var(--border-subtle)' }} />
          <div>
            <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Choose a category</p>
            <CategoryButtons categories={categories} selected={categoryId} onSelect={onCategorySelect} fullCategoryIds={fullCategoryIds} />
          </div>
        </div>
      )}

      {lightbox && <Lightbox image={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}

// ─── Step 1: Library Detail (2-step / library-entry mode) ─────────────────────

function LibraryDetailStep({
  image, title, onTitleChange, categories, categoryId, onCategorySelect, fullCategoryIds,
}: {
  image:            { id: string; title: string; publicUrl: string }
  title:            string
  onTitleChange:    (t: string) => void
  categories:       Category[]
  categoryId:       string
  onCategorySelect: (id: string) => void
  fullCategoryIds?: string[]
}) {
  return (
    <div className="fade-up space-y-5">
      {/* Fixed image preview */}
      <div className="w-full overflow-hidden rounded-xl" style={{ background: 'var(--surface-0)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.publicUrl} alt={image.title} className="max-h-[260px] w-full object-contain" />
      </div>

      {/* Editable title */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Image title <span style={{ color: 'var(--status-error)' }}>*</span>
        </label>
        <input
          type="text" value={title} onChange={e => onTitleChange(e.target.value)}
          maxLength={120}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
          style={{ border: '1.5px solid var(--border-default)', background: 'var(--surface-2)', color: 'var(--text-primary)' }}
          onFocus={e => (e.target.style.borderColor = 'var(--action-primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border-default)')}
        />
      </div>

      {/* Category */}
      <div>
        <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Category</p>
        <CategoryButtons categories={categories} selected={categoryId} onSelect={onCategorySelect} fullCategoryIds={fullCategoryIds} />
      </div>
    </div>
  )
}

// ─── Step 2: Confirm ──────────────────────────────────────────────────────────

function ConfirmStep({
  source, imageTitle, previewUrl, categoryName, competitionTitle, hideSource,
}: {
  source:           Source
  imageTitle:       string
  previewUrl:       string | null
  categoryName:     string
  competitionTitle: string
  hideSource?:      boolean
}) {
  const rows = [
    ['Image',       imageTitle],
    ['Category',    categoryName],
    ['Competition', competitionTitle],
    ...(!hideSource ? [['Source', source === 'upload' ? 'New upload' : 'From library']] : []),
  ]

  return (
    <div className="fade-up space-y-5">
      {previewUrl && (
        <div className="w-full overflow-hidden rounded-xl" style={{ background: 'var(--surface-0)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={imageTitle} className="max-h-[300px] w-full object-contain" />
        </div>
      )}
      <div className="grid gap-y-2" style={{ gridTemplateColumns: '130px 1fr' }}>
        {rows.map(([label, value]) => (
          <Fragment key={label}>
            <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
          </Fragment>
        ))}
      </div>
      <div
        className="rounded-xl px-4 py-3 text-sm"
        style={{ background: 'rgba(26,111,196,0.07)', border: '1px solid rgba(26,111,196,0.20)', color: 'var(--text-secondary)' }}
      >
        Once submitted, this image will be reserved for this competition. You can withdraw it from the competitions page if needed.
      </div>
    </div>
  )
}

// ─── Success overlay ──────────────────────────────────────────────────────────

function SuccessOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 p-4" style={{ backdropFilter: 'blur(3px)' }}>
      <div className="scale-in w-full max-w-sm rounded-2xl p-8 text-center" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)' }}>
        <div className="success-pop mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full" style={{ background: 'var(--status-success-bg)', color: 'var(--status-success)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-9 w-9">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <h2 className="mb-2 text-[22px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Image submitted!</h2>
        <p className="mb-6 text-[15px]" style={{ color: 'var(--text-secondary)' }}>Your entry has been added to the competition. Good luck!</p>
        <button
          type="button" onClick={onClose}
          className="w-full rounded-lg py-2.5 text-[15px] font-bold text-white transition-colors"
          style={{ background: 'var(--action-primary)' }}
          onMouseEnter={e => ((e.target as HTMLButtonElement).style.background = 'var(--action-primary-hover)')}
          onMouseLeave={e => ((e.target as HTMLButtonElement).style.background = 'var(--action-primary)')}
        >
          Done
        </button>
      </div>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function SubmitModal({
  open, onClose, onSuccess,
  userId, competitionId, competitionTitle,
  categories, libraryImages: libraryImagesProp, fullCategoryIds = [],
  preselectedImage,
}: SubmitModalProps) {
  const isLibraryEntry = Boolean(preselectedImage)

  const initialStep: Step  = isLibraryEntry ? 1 : 0
  const initialSource: Source | null = isLibraryEntry ? 'library' : null

  const [step, setStep]             = useState<Step>(initialStep)
  const [source, setSource]         = useState<Source | null>(initialSource)
  const [file, setFile]             = useState<File | null>(null)
  const [preview, setPreview]       = useState<string | null>(null)
  const [title, setTitle]           = useState(preselectedImage?.title ?? '')
  const [selectedImageId, setSelectedImageId] = useState(preselectedImage?.id ?? '')
  const [categoryId, setCategoryId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState(false)

  // Internal library image fetch (for 3-step flow when prop images not provided)
  const [fetchedImages, setFetchedImages]   = useState<LibraryImage[]>([])
  const [fetchingImages, setFetchingImages] = useState(false)
  const hasFetchedRef = useRef(false)

  const effectiveLibraryImages = (libraryImagesProp?.length ?? 0) > 0 ? (libraryImagesProp ?? []) : fetchedImages

  const fetchLibraryImages = useCallback(async () => {
    if (hasFetchedRef.current || fetchingImages) return
    hasFetchedRef.current = true
    setFetchingImages(true)
    try {
      const supabase = createClient()
      const { data: imgs } = await supabase
        .from('images')
        .select('id, title, storage_path, created_at, submissions!submissions_image_id_fkey(status)')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      const available = (imgs ?? []).filter((img: { submissions: { status: string }[] }) => {
        const subs = Array.isArray(img.submissions) ? img.submissions : []
        return !subs.some((s: { status: string }) => s.status === 'submitted')
      })

      setFetchedImages(available.map((img: { id: string; title: string; storage_path: string; created_at: string }) => ({
        id:           img.id,
        title:        img.title,
        storage_path: img.storage_path,
        created_at:   img.created_at,
        publicUrl:    supabase.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl,
      })))
    } catch {
      setFetchedImages([])
    }
    setFetchingImages(false)
  }, [userId, fetchingImages])

  const selectedLibraryImage = effectiveLibraryImages.find(img => img.id === selectedImageId) ?? null
  const selectedCategory     = categories.find(c => c.id === categoryId) ?? null

  // Stepper config
  const stepLabels  = isLibraryEntry ? ['Details', 'Confirm'] : ['Source', 'Image', 'Confirm']
  const stepperIndex = isLibraryEntry ? step - 1 : step  // map internal step to stepper position

  function reset() {
    setStep(initialStep)
    setSource(initialSource)
    setFile(null)
    setPreview(null)
    setTitle(preselectedImage?.title ?? '')
    setSelectedImageId(preselectedImage?.id ?? '')
    setCategoryId('')
    setError(null)
    setSuccess(false)
  }

  function handleClose() { reset(); onClose() }

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = '' }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleSourceSelect(src: Source) {
    setSource(src)
    setStep(1)
    if (src === 'library' && (libraryImagesProp?.length ?? 0) === 0) {
      fetchLibraryImages()
    }
  }

  async function handleFileChange(f: File, p: string) {
    setFile(f); setPreview(p)
    try {
      const parsed = await exifr.parse(f, { pick: ['Make','Model','FNumber','ExposureTime','ISO','FocalLength','DateTimeOriginal'] })
      ;(f as File & { _exif?: unknown })._exif = parsed ?? null
    } catch { /* ignore */ }
  }

  function canContinue() {
    if (step === 0) return source !== null
    if (step === 1) {
      if (source === 'upload')  return file !== null && title.trim().length > 0 && categoryId !== ''
      if (isLibraryEntry)       return title.trim().length > 0 && categoryId !== ''
      return selectedImageId !== '' && categoryId !== ''
    }
    return true
  }

  async function handleSubmit() {
    if (!canContinue() || submitting) return
    if (step < 2) { setStep((s => (s + 1) as Step)(step)); return }

    setSubmitting(true); setError(null)

    if (isLibraryEntry && preselectedImage) {
      // Update title if changed
      if (title.trim() !== preselectedImage.title) {
        const { error: titleErr } = await editImageTitleAction(preselectedImage.id, title.trim())
        if (titleErr) { setError(titleErr); setSubmitting(false); return }
      }
      const { error } = await submitFromLibrary(preselectedImage.id, competitionId, categoryId)
      if (error) { setError(error); setSubmitting(false); return }
    } else if (source === 'library') {
      const { error } = await submitFromLibrary(selectedImageId, competitionId, categoryId)
      if (error) { setError(error); setSubmitting(false); return }
    } else {
      const supabase = createClient()
      const ext = file!.name.split('.').pop()
      const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('images').upload(storagePath, file!, { upsert: false })
      if (uploadErr) { setError(uploadErr.message); setSubmitting(false); return }

      const exifData = (file as File & { _exif?: unknown })._exif as Record<string, unknown> | null
      const { error } = await submitUploadedImage({ storagePath, title: title.trim(), exifData: exifData ?? null, competitionId, categoryId })
      if (error) {
        await supabase.storage.from('images').remove([storagePath])
        setError(error); setSubmitting(false); return
      }
    }

    setSuccess(true); setSubmitting(false)
    onSuccess()
  }

  if (!open) return null

  const previewUrl    = isLibraryEntry ? preselectedImage!.publicUrl : source === 'library' ? selectedLibraryImage?.publicUrl ?? null : preview
  const displayTitle  = isLibraryEntry ? title : source === 'library' ? (selectedLibraryImage?.title ?? '') : title

  return (
    <>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
        style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(3px)' }}
        onClick={handleClose}
      >
        <div
          className="scale-in flex w-full flex-col overflow-hidden"
          style={{ maxWidth: 720, borderRadius: 18, maxHeight: 'calc(100vh - 48px)', background: 'var(--surface-1)', border: '1px solid var(--border-default)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ padding: '22px 28px 0', borderBottom: '1px solid var(--border-default)', flexShrink: 0 }}>
            <div className="flex items-start justify-between pb-0">
              <div>
                <h2 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Submit an image
                </h2>
                <p className="mt-0.5 text-[14px] font-semibold" style={{ color: 'var(--action-primary)' }}>
                  {competitionTitle}
                </p>
              </div>
              <button
                type="button" onClick={handleClose}
                className="flex h-[34px] w-[34px] items-center justify-center rounded-lg transition-colors"
                style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-0)')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)')}
              >
                <IconClose />
              </button>
            </div>
            {/* Stepper — always shown */}
            <Stepper stepIndex={stepperIndex} labels={stepLabels} />
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '22px 28px' }}>
            {error && (
              <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--status-error-bg)', border: '1px solid var(--status-error)', color: 'var(--status-error-text)' }}>
                {error}
              </div>
            )}

            {step === 0 && <SourceStep onSelect={handleSourceSelect} />}

            {step === 1 && isLibraryEntry && (
              <LibraryDetailStep
                image={preselectedImage!}
                title={title}
                onTitleChange={setTitle}
                categories={categories}
                categoryId={categoryId}
                onCategorySelect={setCategoryId}
                fullCategoryIds={fullCategoryIds}
              />
            )}

            {step === 1 && !isLibraryEntry && source === 'upload' && (
              <UploadStep
                categories={categories} categoryId={categoryId} onCategorySelect={setCategoryId}
                file={file} preview={preview} title={title}
                onFileChange={handleFileChange} onTitleChange={setTitle}
                fullCategoryIds={fullCategoryIds}
              />
            )}

            {step === 1 && !isLibraryEntry && source === 'library' && (
              <LibraryStep
                images={effectiveLibraryImages}
                loading={fetchingImages}
                selectedId={selectedImageId}
                categoryId={categoryId}
                categories={categories}
                onSelect={setSelectedImageId}
                onCategorySelect={setCategoryId}
                fullCategoryIds={fullCategoryIds}
              />
            )}

            {step === 2 && (
              <ConfirmStep
                source={source ?? 'library'}
                imageTitle={displayTitle}
                previewUrl={previewUrl}
                categoryName={selectedCategory?.name ?? ''}
                competitionTitle={competitionTitle}
                hideSource={isLibraryEntry}
              />
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between"
            style={{ padding: '14px 28px', borderTop: '1px solid var(--border-default)', flexShrink: 0 }}
          >
            {/* Back — at step 1 in library-entry mode, back closes the modal */}
            {step > 0 ? (
              <button
                type="button"
                onClick={() => isLibraryEntry && step === 1 ? handleClose() : setStep((s => (s - 1) as Step)(step))}
                className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-[15px] font-medium transition-colors"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)', background: 'transparent' }}
              >
                <IconChevronLeft />
                {isLibraryEntry && step === 1 ? 'Cancel' : 'Back'}
              </button>
            ) : (
              <div />
            )}
            <button
              type="button" onClick={handleSubmit}
              disabled={!canContinue() || submitting}
              className="rounded-lg px-6 py-2 text-[15px] font-bold text-white transition-all"
              style={{
                background:  canContinue() && !submitting ? 'var(--action-primary)' : 'var(--text-disabled)',
                cursor:      canContinue() && !submitting ? 'pointer' : 'default',
                boxShadow:   canContinue() && !submitting ? '0 2px 6px rgba(26,111,196,0.35)' : 'none',
              }}
            >
              {submitting ? 'Submitting…' : step === 2 ? 'Submit entry' : 'Continue'}
            </button>
          </div>
        </div>
      </div>

      {success && <SuccessOverlay onClose={handleClose} />}
    </>
  )
}

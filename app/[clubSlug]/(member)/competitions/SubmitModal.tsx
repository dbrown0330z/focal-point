'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { submitFromLibrary, submitUploadedImage, editImageTitleAction } from './actions'
import * as exifr from 'exifr'
import { EXIF_TAGS, buildExifRows } from '@/lib/exif'

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
  libraryImages?: LibraryImage[]
  fullCategoryIds?: string[]
  preselectedImage?: { id: string; title: string; publicUrl: string }
}

type Source = 'upload' | 'library'
type Step   = 0 | 1 | 2

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  )
}
function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
      <path d="M9 18l6-6-6-6"/>
    </svg>
  )
}
function IconUploadCloud() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
      <path d="M12 12v9"/><path d="m16 16-4-4-4 4"/>
    </svg>
  )
}
function IconImage() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <circle cx="9" cy="9" r="2"/>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
  )
}
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  )
}
function IconZoomIn() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6M8 11h6"/>
    </svg>
  )
}

// ─── Shared atoms ─────────────────────────────────────────────────────────────

const MODAL_W = 'min(900px, calc(100vw - 48px))'
const MODAL_H = 'min(640px, calc(100vh - 48px))'

function TitleField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
        Image title <span style={{ color: 'var(--status-error)' }}>*</span>
      </label>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)} maxLength={120}
        placeholder="e.g. Golden Hour at the Pier"
        style={{
          width: '100%', boxSizing: 'border-box',
          border: '1.5px solid var(--border-default)', borderRadius: 8,
          background: 'var(--surface-2)', color: 'var(--text-primary)',
          padding: '8px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--action-primary)')}
        onBlur={e  => (e.target.style.borderColor = 'var(--border-default)')}
      />
    </div>
  )
}

function CategoryPicker({
  categories, selected, onSelect, fullCategoryIds = [],
}: {
  categories: Category[]; selected: string; onSelect: (id: string) => void; fullCategoryIds?: string[]
}) {
  return (
    <div>
      <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
        Category <span style={{ color: 'var(--status-error)' }}>*</span>
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {categories.map(cat => {
          const isFull = fullCategoryIds.includes(cat.id) && cat.id !== selected
          const isSel  = selected === cat.id
          return (
            <button
              key={cat.id} type="button" disabled={isFull}
              onClick={() => !isFull && onSelect(cat.id)}
              style={{
                borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 600,
                border: `1.5px solid ${isSel ? 'var(--action-primary)' : 'var(--border-default)'}`,
                background: isSel ? 'var(--action-primary)' : isFull ? 'var(--surface-0)' : 'transparent',
                color: isSel ? '#fff' : isFull ? 'var(--text-disabled)' : 'var(--text-secondary)',
                cursor: isFull ? 'not-allowed' : 'pointer', opacity: isFull ? 0.6 : 1,
                fontFamily: 'inherit',
              }}
            >
              {cat.name}
              {isFull && <span style={{ marginLeft: 4, opacity: 0.7, fontSize: 11 }}>· Full</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ImagePreviewColumn({ src, alt }: { src: string; alt: string }) {
  return (
    <div style={{
      flex: '0 0 57%', background: 'var(--surface-0)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
    </div>
  )
}

function FormColumn({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '24px 22px',
      borderLeft: '1px solid var(--border-subtle)',
      background: 'var(--surface-2)',
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      {children}
    </div>
  )
}

function SubmissionNote() {
  return (
    <div style={{
      borderRadius: 8, padding: '10px 14px', fontSize: 12.5,
      background: 'rgba(26,111,196,0.07)', border: '1px solid rgba(26,111,196,0.20)',
      color: 'var(--text-secondary)',
    }}>
      Once submitted, this image will be reserved for this competition. You can withdraw it from the competitions page if needed.
    </div>
  )
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ image, onClose }: { image: LibraryImage; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white">
          <IconClose />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.publicUrl} alt={image.title} className="max-h-[400px] w-full object-cover" />
        <div style={{ background: 'var(--surface-1)', padding: '12px 16px' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{image.title}</p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
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
    <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '60%', minWidth: 240 }}>
        {labels.map((label, i) => {
          const done   = i < stepIndex
          const active = i === stepIndex
          return (
            <div key={i} style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', border: '2px solid',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  background:  done || active ? 'var(--action-primary)' : 'var(--surface-2)',
                  borderColor: done || active ? 'var(--action-primary)' : 'var(--border-default)',
                  color:       done || active ? '#fff' : 'var(--text-tertiary)',
                }}>
                  {done ? <IconCheck size={13} /> : i + 1}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
                }}>
                  {label}
                </span>
              </div>
              {i < labels.length - 1 && (
                <div style={{
                  height: 2, flex: 1, margin: '0 8px', marginBottom: 18,
                  background: i < stepIndex ? 'var(--action-primary)' : 'var(--border-default)',
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Modal shell ─────────────────────────────────────────────────────────────

function ModalShell({
  header, stepper, body, footer, onClose, twoColumn,
}: {
  header:     React.ReactNode
  stepper?:   React.ReactNode
  body:       React.ReactNode
  footer:     React.ReactNode
  onClose:    () => void
  twoColumn?: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: MODAL_W, height: MODAL_H,
          display: 'flex', flexDirection: 'column',
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: 18, overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: stepper ? '18px 24px 0' : '18px 24px',
          borderBottom: stepper ? 'none' : '1px solid var(--border-default)',
          flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>{header}</div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none', flexShrink: 0, marginLeft: 12,
              background: 'var(--surface-2)', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-0)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}
          >
            <IconClose />
          </button>
        </div>

        {/* Stepper strip */}
        {stepper && (
          <div style={{ flexShrink: 0, borderBottom: '1px solid var(--border-default)' }}>
            {stepper}
          </div>
        )}

        {/* Body */}
        {twoColumn ? (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {body}
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px', background: 'var(--surface-2)' }}>
            {body}
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid var(--border-default)',
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {footer}
        </div>
      </div>
    </div>
  )
}

// ─── SuccessOverlay ───────────────────────────────────────────────────────────

function SuccessOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 p-4" style={{ backdropFilter: 'blur(3px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-8 text-center" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
          background: 'var(--status-success-bg)', color: 'var(--status-success)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={36} height={36}>
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Image submitted!</h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>Your entry has been added to the competition. Good luck!</p>
        <button
          type="button" onClick={onClose}
          style={{
            width: '100%', borderRadius: 10, padding: '11px 0', fontSize: 15, fontWeight: 700,
            background: 'var(--action-primary)', color: '#fff', border: 'none', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--action-primary-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--action-primary)')}
        >
          Done
        </button>
      </div>
    </div>
  )
}

// ─── Buttons ──────────────────────────────────────────────────────────────────

function BtnSecondary({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        borderRadius: 8, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  )
}

function BtnPrimary({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      style={{
        borderRadius: 8, padding: '8px 24px', fontSize: 14, fontWeight: 700,
        background: disabled ? 'var(--text-disabled)' : 'var(--action-primary)',
        color: '#fff', border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 2px 6px rgba(26,111,196,0.35)',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  )
}

// ─── Step 0: Source choice ─────────────────────────────────────────────────

function SourceStep({
  onSelectLibrary, onFileSelect,
}: {
  onSelectLibrary: () => void
  onFileSelect:    (f: File) => void
}) {
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    const f = files?.[0]; if (!f) return
    onFileSelect(f)
  }

  return (
    <div style={{ display: 'flex', flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ width: '100%', maxWidth: 720, display: 'flex', gap: 16, height: 280 }}>

        {/* Left: actual drop / click target */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files) }}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 14,
            borderRadius: 14, border: `2px dashed ${drag ? 'var(--action-primary)' : 'var(--border-default)'}`,
            background: drag ? 'rgba(26,111,196,0.04)' : 'transparent',
            cursor: 'pointer', transition: 'border-color .15s, background .15s',
          }}
        >
          <div style={{ color: drag ? 'var(--action-primary)' : 'var(--text-tertiary)', transition: 'color .15s' }}>
            <IconUploadCloud />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Upload a new photo</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
              Drop a file here, or click to browse
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>JPEG · PNG · WebP — max 20 MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={e => handleFiles(e.target.files)} />
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 1, flex: 1, background: 'var(--border-default)' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>OR</span>
          <div style={{ width: 1, flex: 1, background: 'var(--border-default)' }} />
        </div>

        {/* Right: library card */}
        <button
          type="button" onClick={onSelectLibrary}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 14,
            borderRadius: 14, border: '2px solid var(--border-default)',
            background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'border-color .15s, background .15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--action-primary)'
            e.currentTarget.style.background  = 'rgba(26,111,196,0.04)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-default)'
            e.currentTarget.style.background  = 'transparent'
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: 'var(--surface-2)', color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconImage />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Choose from my library</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
              Select a photo you’ve already uploaded
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}

// ─── Step 1a: Upload ──────────────────────────────────────────────────────────

function UploadBody({
  file, preview, title, categories, categoryId, fullCategoryIds,
  exifRows, onTitleChange, onCategorySelect, onFileChange,
}: {
  file:             File | null
  preview:          string | null
  title:            string
  categories:       Category[]
  categoryId:       string
  fullCategoryIds:  string[]
  exifRows:         { label: string; value: string }[]
  onTitleChange:    (v: string) => void
  onCategorySelect: (id: string) => void
  onFileChange:     (f: File, p: string) => void
}) {
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  function handleFiles(files: FileList | null) {
    const f = files?.[0]; if (!f) return
    onFileChange(f, URL.createObjectURL(f))
  }

  if (!preview) {
    return (
      <div style={{ display: 'flex', flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', padding: 40, background: 'var(--surface-2)' }}>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => {
            e.preventDefault()
            setDrag(true)
            ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--action-primary)'
            ;(e.currentTarget as HTMLDivElement).style.background  = 'rgba(26,111,196,0.04)'
          }}
          onDragLeave={e => {
            setDrag(false)
            ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-default)'
            ;(e.currentTarget as HTMLDivElement).style.background  = 'transparent'
          }}
          onDrop={e => {
            e.preventDefault(); setDrag(false)
            ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-default)'
            ;(e.currentTarget as HTMLDivElement).style.background  = 'transparent'
            handleFiles(e.dataTransfer.files)
          }}
          style={{
            width: '100%', maxWidth: 480, border: '2px dashed var(--border-default)',
            borderRadius: 14, padding: '60px 40px', cursor: 'pointer', textAlign: 'center',
            background: 'transparent', transition: 'border-color .15s, background .15s',
          }}
        >
          <div style={{ color: 'var(--text-tertiary)', marginBottom: 14, display: 'flex', justifyContent: 'center' }}>
            <IconUploadCloud />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
            Click or drag a photo here
          </p>
          <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 6 }}>
            JPEG · PNG · WebP — max 20 MB
          </p>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => handleFiles(e.target.files)} />
        </div>
        {/* drag state tracked in element styles above — variable unused but keep for drop handler */}
        {drag && null}
      </div>
    )
  }

  // Two-column when we have a preview
  return (
    <>
      <div
        onClick={() => fileRef.current?.click()}
        title="Click to choose a different photo"
        style={{
          flex: '0 0 57%', background: 'var(--surface-0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', cursor: 'pointer', position: 'relative',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
        <div style={{
          position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11.5, fontWeight: 500,
          padding: '4px 10px', borderRadius: 20, pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          Click to change photo
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>
      <FormColumn>
        {exifRows.length > 0 && (
          <dl style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 0, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
            {exifRows.map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <dt style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{label === 'Captured' ? 'Date' : label}</dt>
                <dd style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{value}</dd>
              </div>
            ))}
          </dl>
        )}
        <TitleField value={title} onChange={onTitleChange} />
        <CategoryPicker categories={categories} selected={categoryId} onSelect={onCategorySelect} fullCategoryIds={fullCategoryIds} />
      </FormColumn>
    </>
  )
}

// ─── Step 1b: Library grid ─────────────────────────────────────────────────

function LibraryBody({
  images, loading, selectedId, categoryId, categories, fullCategoryIds,
  onSelect, onCategorySelect,
}: {
  images:           LibraryImage[]
  loading:          boolean
  selectedId:       string
  categoryId:       string
  categories:       Category[]
  fullCategoryIds:  string[]
  onSelect:         (id: string) => void
  onCategorySelect: (id: string) => void
}) {
  const [search, setSearch]   = useState('')
  const [sort, setSort]       = useState<'date_desc' | 'title_asc'>('date_desc')
  const [lightbox, setLightbox] = useState<LibraryImage | null>(null)

  const filtered = images
    .filter(img => img.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'date_desc'
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : a.title.localeCompare(b.title))

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--surface-2)' }}>
      {/* Search + sort */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
            <IconSearch />
          </div>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search your library…"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '8px 12px 8px 34px', fontSize: 13,
              border: '1.5px solid var(--border-default)', borderRadius: 8,
              background: 'var(--surface-2)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--action-primary)')}
            onBlur={e  => (e.target.style.borderColor = 'var(--border-default)')}
          />
        </div>
        <select
          value={sort} onChange={e => setSort(e.target.value as typeof sort)}
          style={{
            padding: '8px 12px', fontSize: 13, border: '1.5px solid var(--border-default)',
            borderRadius: 8, background: 'var(--surface-2)', color: 'var(--text-secondary)',
            outline: 'none', fontFamily: 'inherit',
          }}
        >
          <option value="date_desc">Newest first</option>
          <option value="title_asc">Title A–Z</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--text-tertiary)' }}>
          Loading your library…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--text-tertiary)' }}>
          {images.length === 0 ? 'No available images in your library.' : 'No images match your search.'}
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
          overflowY: 'auto', flexShrink: 0,
        }}>
          {filtered.map(img => {
            const sel = img.id === selectedId
            return (
              <div
                key={img.id}
                onClick={() => onSelect(img.id)}
                className="group"
                style={{
                  borderRadius: 9, overflow: 'hidden', cursor: 'pointer',
                  border: `2px solid ${sel ? 'var(--action-primary)' : 'var(--border-default)'}`,
                  boxShadow: sel ? '0 0 0 3px rgba(26,111,196,0.22)' : 'none',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'relative', paddingTop: '70%' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.publicUrl} alt={img.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setLightbox(img) }}
                    className="absolute right-1.5 top-1.5 hidden h-6 w-6 items-center justify-center rounded-full text-white group-hover:flex"
                    style={{ background: 'rgba(0,0,0,0.60)' }}
                  >
                    <IconZoomIn />
                  </button>
                  {sel && (
                    <div style={{
                      position: 'absolute', left: 6, top: 6, width: 20, height: 20,
                      borderRadius: '50%', background: 'var(--action-primary)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <IconCheck size={11} />
                    </div>
                  )}
                </div>
                <div style={{ padding: '6px 8px', background: 'var(--surface-2)' }}>
                  <p style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--text-primary)',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', minHeight: '2.4em',
                  }}>
                    {img.title}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Category picker when image selected */}
      {selectedId && (
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
          <CategoryPicker categories={categories} selected={categoryId} onSelect={onCategorySelect} fullCategoryIds={fullCategoryIds} />
        </div>
      )}

      {lightbox && <Lightbox image={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}

// ─── Step 2: Confirm (two-column) ─────────────────────────────────────────────

function ConfirmBody({
  previewUrl, imageTitle, categoryName, competitionTitle,
}: {
  previewUrl:       string | null
  imageTitle:       string
  categoryName:     string
  competitionTitle: string
}) {
  return (
    <>
      {previewUrl
        ? <ImagePreviewColumn src={previewUrl} alt={imageTitle} />
        : <div style={{ flex: '0 0 57%', background: 'var(--surface-0)' }} />
      }
      <FormColumn>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 14 }}>
            Submission details
          </p>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {([['Image', imageTitle], ['Category', categoryName], ['Competition', competitionTitle]] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <dt style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>{label}</dt>
                <dd style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <SubmissionNote />
      </FormColumn>
    </>
  )
}

// ─── Direct confirm (preselected image path) ──────────────────────────────────

function DirectConfirmBody({
  image, title, categories, categoryId, fullCategoryIds, error,
  onTitleChange, onCategorySelect,
}: {
  image:            { id: string; title: string; publicUrl: string }
  title:            string
  categories:       Category[]
  categoryId:       string
  fullCategoryIds:  string[]
  error:            string | null
  onTitleChange:    (v: string) => void
  onCategorySelect: (id: string) => void
}) {
  return (
    <>
      <ImagePreviewColumn src={image.publicUrl} alt={image.title} />
      <FormColumn>
        <TitleField value={title} onChange={onTitleChange} />
        <CategoryPicker categories={categories} selected={categoryId} onSelect={onCategorySelect} fullCategoryIds={fullCategoryIds} />
        <SubmissionNote />
        {error && (
          <div style={{
            borderRadius: 8, padding: '10px 14px', fontSize: 13,
            background: 'var(--status-error-bg)', color: 'var(--status-error-text)',
            border: '1px solid rgba(211,47,47,0.3)',
          }}>
            {error}
          </div>
        )}
      </FormColumn>
    </>
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

  const [step,            setStep]            = useState<Step>(initialStep)
  const [source,          setSource]          = useState<Source | null>(initialSource)
  const [file,            setFile]            = useState<File | null>(null)
  const [preview,         setPreview]         = useState<string | null>(null)
  const [title,           setTitle]           = useState(preselectedImage?.title ?? '')
  const [selectedImageId, setSelectedImageId] = useState(preselectedImage?.id ?? '')
  const [categoryId,      setCategoryId]      = useState('')
  const [fileExif,        setFileExif]        = useState<Record<string, unknown> | null>(null)
  const [fileDimensions,  setFileDimensions]  = useState<string | null>(null)
  const [submitting,      setSubmitting]      = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [success,         setSuccess]         = useState(false)

  const [fetchedImages,   setFetchedImages]   = useState<LibraryImage[]>([])
  const [fetchingImages,  setFetchingImages]  = useState(false)
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
        id: img.id, title: img.title, storage_path: img.storage_path, created_at: img.created_at,
        publicUrl: supabase.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl,
      })))
    } catch { setFetchedImages([]) }
    setFetchingImages(false)
  }, [userId, fetchingImages])

  const selectedLibraryImage = effectiveLibraryImages.find(img => img.id === selectedImageId) ?? null
  const selectedCategory     = categories.find(c => c.id === categoryId) ?? null

  function reset() {
    setStep(initialStep); setSource(initialSource)
    setFile(null); setPreview(null); setFileDimensions(null)
    setTitle(preselectedImage?.title ?? ''); setSelectedImageId(preselectedImage?.id ?? '')
    setCategoryId(''); setError(null); setSuccess(false)
  }
  function handleClose() { reset(); onClose() }

  useEffect(() => {
    if (!open) return
    const w = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${w}px`
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', h)
    return () => {
      document.removeEventListener('keydown', h)
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleSourceSelect(src: Source) {
    setSource(src); setStep(1)
    if (src === 'library' && (libraryImagesProp?.length ?? 0) === 0) fetchLibraryImages()
  }

  async function handleSourceFileSelect(f: File) {
    setSource('upload')
    await handleFileChange(f, URL.createObjectURL(f))
    setStep(1)
  }

  async function handleFileChange(f: File, p: string) {
    setFile(f); setPreview(p)
    // Derive dimensions from the actual image element — works on every format
    const img = new window.Image()
    img.onload = () => setFileDimensions(
      `${img.naturalWidth.toLocaleString()} × ${img.naturalHeight.toLocaleString()} px`
    )
    img.src = p
    try {
      const parsed = (await exifr.parse(f, { pick: EXIF_TAGS })) ?? null
      setFileExif(parsed)
      ;(f as File & { _exif?: unknown })._exif = parsed
    } catch { setFileExif(null) }
  }

  function canContinue(): boolean {
    if (isLibraryEntry)    return title.trim().length > 0 && categoryId !== ''
    if (step === 0)        return source !== null
    if (step === 1 && source === 'upload')  return file !== null && title.trim().length > 0 && categoryId !== ''
    if (step === 1 && source === 'library') return selectedImageId !== ''
    return true
  }

  async function handleSubmit() {
    if (!canContinue() || submitting) return

    // Multi-step normal flow: advance until step 2
    if (!isLibraryEntry && step < 2) { setStep((s => (s + 1) as Step)(step)); return }

    setSubmitting(true); setError(null)

    if (isLibraryEntry && preselectedImage) {
      if (title.trim() !== preselectedImage.title) {
        const { error: titleErr } = await editImageTitleAction(preselectedImage.id, title.trim())
        if (titleErr) { setError(titleErr); setSubmitting(false); return }
      }
      const { error: err } = await submitFromLibrary(preselectedImage.id, competitionId, categoryId)
      if (err) { setError(err); setSubmitting(false); return }
    } else if (source === 'library') {
      const { error: err } = await submitFromLibrary(selectedImageId, competitionId, categoryId)
      if (err) { setError(err); setSubmitting(false); return }
    } else {
      const supabase = createClient()
      const ext = file!.name.split('.').pop()
      const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('images').upload(storagePath, file!, { upsert: false })
      if (uploadErr) { setError(uploadErr.message); setSubmitting(false); return }

      const exifData = (file as File & { _exif?: unknown })._exif as Record<string, unknown> | null
      const { error: err } = await submitUploadedImage({ storagePath, title: title.trim(), exifData: exifData ?? null, competitionId, categoryId })
      if (err) {
        await supabase.storage.from('images').remove([storagePath])
        setError(err); setSubmitting(false); return
      }
    }

    setSubmitting(false); setSuccess(true); onSuccess()
  }

  if (!open) return null

  const previewUrl   = isLibraryEntry ? preselectedImage!.publicUrl : source === 'library' ? selectedLibraryImage?.publicUrl ?? null : preview
  const displayTitle = isLibraryEntry ? title : source === 'library' ? (selectedLibraryImage?.title ?? '') : title

  const headerNode = (
    <>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
        Submit an image
      </h2>
      {competitionTitle && (
        <p style={{ fontSize: 13, marginTop: 4 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Salon name: </span>
          <span style={{ color: 'var(--action-primary)', fontWeight: 700 }}>{competitionTitle}</span>
        </p>
      )}
    </>
  )

  // ── preselected: single direct-confirm screen ────────────────────────────
  if (isLibraryEntry) {
    return (
      <>
        <ModalShell
          header={headerNode}
          twoColumn
          body={
            <DirectConfirmBody
              image={preselectedImage!}
              title={title}
              categories={categories}
              categoryId={categoryId}
              fullCategoryIds={fullCategoryIds}
              error={error}
              onTitleChange={setTitle}
              onCategorySelect={setCategoryId}
            />
          }
          footer={
            <>
              <BtnSecondary onClick={handleClose}>Cancel</BtnSecondary>
              <BtnPrimary onClick={handleSubmit} disabled={!canContinue() || submitting}>
                {submitting ? 'Submitting…' : 'Submit entry'}
              </BtnPrimary>
            </>
          }
          onClose={handleClose}
        />
        {success && <SuccessOverlay onClose={handleClose} />}
      </>
    )
  }

  // ── normal multi-step flow ─────────────────────────────────────────────────
  const twoColumn     = (step === 1 && source === 'upload') || step === 2

  const bodyNode = (() => {
    if (step === 0) return <SourceStep onSelectLibrary={() => handleSourceSelect('library')} onFileSelect={handleSourceFileSelect} />
    if (step === 1 && source === 'upload') {
      return (
        <UploadBody
          file={file} preview={preview} title={title}
          categories={categories} categoryId={categoryId} fullCategoryIds={fullCategoryIds}
          exifRows={(() => {
            const rows: { label: string; value: string }[] = []
            if (fileDimensions) rows.push({ label: 'Dimensions', value: fileDimensions })
            const captured = fileExif ? buildExifRows(fileExif).find(r => r.label === 'Captured') : null
            if (captured) rows.push({ label: 'Date', value: captured.value })
            return rows
          })()}
          onTitleChange={setTitle} onCategorySelect={setCategoryId} onFileChange={handleFileChange}
        />
      )
    }
    if (step === 1 && source === 'library') {
      return (
        <LibraryBody
          images={effectiveLibraryImages} loading={fetchingImages}
          selectedId={selectedImageId} categoryId={categoryId}
          categories={categories} fullCategoryIds={fullCategoryIds}
          onSelect={setSelectedImageId} onCategorySelect={setCategoryId}
        />
      )
    }
    return (
      <ConfirmBody
        previewUrl={previewUrl} imageTitle={displayTitle}
        categoryName={selectedCategory?.name ?? ''} competitionTitle={competitionTitle}
      />
    )
  })()

  // For steps that need a full-height container without the standard padding
  const needsRawContainer = (step === 1 && source === 'library') || twoColumn

  return (
    <>
      <ModalShell
        header={headerNode}
        twoColumn={needsRawContainer}
        body={needsRawContainer ? bodyNode : (
          <div>
            {error && (
              <div style={{
                marginBottom: 16, borderRadius: 8, padding: '10px 14px', fontSize: 13,
                background: 'var(--status-error-bg)', color: 'var(--status-error-text)',
                border: '1px solid rgba(211,47,47,0.3)',
              }}>
                {error}
              </div>
            )}
            {bodyNode}
          </div>
        )}
        footer={
          <>
            {step > 0 ? (
              <BtnSecondary onClick={() => setStep((s => (s - 1) as Step)(step))}>
                <IconChevronLeft /> Back
              </BtnSecondary>
            ) : <div />}
            <BtnPrimary onClick={handleSubmit} disabled={!canContinue() || submitting}>
              {submitting ? 'Submitting…' : step === 2 ? 'Submit entry' : 'Continue'}
            </BtnPrimary>
          </>
        }
        onClose={handleClose}
      />
      {success && <SuccessOverlay onClose={handleClose} />}
    </>
  )
}

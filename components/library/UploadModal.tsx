'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import * as exifr from 'exifr'
import { uploadImageToLibrary } from '@/app/[clubSlug]/(member)/library/actions'
import { submitUploadedImage } from '@/app/[clubSlug]/(member)/competitions/actions'
import { EXIF_TAGS, buildExifRows } from '@/lib/exif'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CompetitionCategory = {
  id:    string
  name:  string
  count: number       // club-wide entries in this category
  limit: number | null // per-category cap; null = no cap
}

export type OpenCompetition = {
  id:                string
  title:             string
  submissionLimit:   number | null
  mySubmissionCount: number
  categories:        CompetitionCategory[]
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function IconClose() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  )
}

function IconUpload() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function UploadModal({
  open,
  onClose,
  userId,
  openCompetition,
}: {
  open:             boolean
  onClose:          () => void
  userId:           string
  openCompetition:  OpenCompetition | null
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [file,          setFile]          = useState<File | null>(null)
  const [preview,       setPreview]       = useState<string | null>(null)
  const [exifData,      setExifData]      = useState<Record<string, unknown> | null>(null)
  const [title,         setTitle]         = useState('')
  const [description,   setDescription]   = useState('')
  const [submitToComp,  setSubmitToComp]  = useState(false)
  const [categoryId,    setCategoryId]    = useState('')
  const [uploading,     setUploading]     = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  // Body scroll lock + Escape key
  useEffect(() => {
    if (!open) return
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow      = 'hidden'
    document.body.style.paddingRight  = `${scrollbarWidth}px`
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow     = ''
      document.body.style.paddingRight = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setFile(null); setPreview(null); setExifData(null)
      setTitle(''); setDescription('')
      setSubmitToComp(false); setCategoryId('')
      setError(null)
    }
  }, [open])

  if (!open) return null

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setError(null)
    try {
      const parsed = await exifr.parse(selected, { pick: EXIF_TAGS })
      setExifData(parsed ?? null)
    } catch {
      setExifData(null)
    }
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const selected = e.dataTransfer.files?.[0]
    if (!selected || !selected.type.startsWith('image/')) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setError(null)
    try {
      const parsed = await exifr.parse(selected, { pick: EXIF_TAGS })
      setExifData(parsed ?? null)
    } catch {
      setExifData(null)
    }
  }

  async function handleSubmit() {
    if (!file || !title.trim()) return
    setUploading(true)
    setError(null)

    // Upload file to storage
    const ext = file.name.split('.').pop() ?? 'jpg'
    const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`
    const supabase = createClient()
    const { error: storageErr } = await supabase.storage
      .from('images')
      .upload(storagePath, file, { upsert: false })

    if (storageErr) {
      setError(storageErr.message)
      setUploading(false)
      return
    }

    // Create image + optional submission
    if (submitToComp && openCompetition && categoryId) {
      const { error: err } = await submitUploadedImage({
        storagePath,
        title:          title.trim(),
        description:    description.trim(),
        exifData,
        competitionId:  openCompetition.id,
        categoryId,
      })
      if (err) {
        await supabase.storage.from('images').remove([storagePath])
        setError(err)
        setUploading(false)
        return
      }
    } else {
      const { error: err } = await uploadImageToLibrary({
        title:        title.trim(),
        description:  description.trim(),
        storage_path: storagePath,
        exif_data:    exifData,
      })
      if (err) {
        await supabase.storage.from('images').remove([storagePath])
        setError(err)
        setUploading(false)
        return
      }
    }

    setUploading(false)
    router.refresh()
    onClose()
  }

  const exifRows = exifData ? buildExifRows(exifData) : []
  const hasExif  = exifRows.length > 0
  const canSave  = !!file && !!title.trim() && (!submitToComp || !!categoryId)

  const btnLabel = uploading
    ? 'Uploading…'
    : submitToComp && categoryId
      ? 'Upload & submit'
      : 'Add to library'

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="flex flex-col rounded-2xl shadow-2xl w-full"
        style={{
          maxWidth:   hasExif ? 860 : 540,
          maxHeight:  '90vh',
          background: 'var(--surface-1)',
          border:     '1px solid var(--border-default)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-default)' }}
        >
          <h2 className="text-[17px] font-bold" style={{ color: 'var(--text-primary)' }}>
            Add image
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-tertiary)', background: 'var(--surface-2)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
          >
            <IconClose />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left: form */}
          <div className="flex flex-col flex-1 min-w-0 overflow-y-auto" style={{ padding: '24px' }}>

            {/* Drop zone */}
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors flex-shrink-0"
              style={{
                height:      file ? 180 : 148,
                borderColor: 'var(--border-default)',
                background:  'var(--surface-0)',
              }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--action-primary)' }}
              onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
              onDrop={handleDrop}
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview" className="h-full w-full rounded-xl object-contain p-2" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-center px-4">
                  <span style={{ color: 'var(--text-tertiary)' }}><IconUpload /></span>
                  <p className="text-[14px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Click or drag a photo here
                  </p>
                  <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                    JPEG · PNG · WebP — max 20 MB
                  </p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* EXIF quick summary (single-col mode: no right panel) */}
            {!hasExif && exifData && (
              <p className="mt-3 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                <span style={{ color: 'var(--status-success)' }}>✓</span>{' '}
                EXIF detected — camera data saved with your image
              </p>
            )}

            {/* Title */}
            <div style={{ marginTop: 20 }}>
              <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                Title <span style={{ color: 'var(--status-error)' }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Golden Hour at the Pier"
                className="w-full rounded-lg px-3 py-2 text-[14px] outline-none transition-colors"
                style={{ border: '1px solid var(--border-default)', background: 'var(--surface-2)', color: 'var(--text-primary)' }}
                onFocus={e  => (e.target.style.borderColor = 'var(--action-primary)')}
                onBlur={e   => (e.target.style.borderColor = 'var(--border-default)')}
              />
            </div>

            {/* Description */}
            <div style={{ marginTop: 14 }}>
              <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                Description{' '}
                <span className="font-normal text-[12px]" style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Camera settings, story behind the shot…"
                className="w-full rounded-lg px-3 py-2 text-[14px] outline-none resize-none transition-colors"
                style={{ border: '1px solid var(--border-default)', background: 'var(--surface-2)', color: 'var(--text-primary)' }}
                onFocus={e  => (e.target.style.borderColor = 'var(--action-primary)')}
                onBlur={e   => (e.target.style.borderColor = 'var(--border-default)')}
              />
            </div>

            {/* Competition submission block */}
            {openCompetition && openCompetition.submissionLimit !== null && openCompetition.mySubmissionCount >= openCompetition.submissionLimit && (
              <div className="rounded-lg px-3 py-2.5 text-[12px] flex-shrink-0" style={{ marginTop: 18, background: 'var(--status-warning-bg)', color: 'var(--status-warning-text)', border: '1px solid rgba(166,124,0,0.25)' }}>
                You&apos;ve used all {openCompetition.submissionLimit} submissions for this competition.
              </div>
            )}
            {openCompetition && !(openCompetition.submissionLimit !== null && openCompetition.mySubmissionCount >= openCompetition.submissionLimit) && (
              <div
                className="rounded-xl flex-shrink-0"
                style={{
                  marginTop:  18,
                  padding:    '14px 16px',
                  background: 'var(--surface-2)',
                  border:     '1px solid var(--border-subtle)',
                }}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={submitToComp}
                    onChange={e => {
                      setSubmitToComp(e.target.checked)
                      if (!e.target.checked) setCategoryId('')
                    }}
                    className="mt-0.5 h-4 w-4 flex-shrink-0"
                    style={{ accentColor: 'var(--action-primary)' }}
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                      Submit to open competition
                    </p>
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {openCompetition.title}
                    </p>
                  </div>
                </label>

                {submitToComp && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                    <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Select a category
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {openCompetition.categories.map(cat => {
                        const isFull     = cat.limit !== null && cat.count >= cat.limit
                        const isSelected = categoryId === cat.id
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            disabled={isFull}
                            onClick={() => !isFull && setCategoryId(cat.id)}
                            className="rounded-full px-3 py-1 text-[12px] font-semibold transition-all"
                            style={{
                              background: isSelected ? 'var(--action-primary)' : isFull ? 'var(--surface-0)' : 'var(--surface-1)',
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
                    {!categoryId && (
                      <p className="mt-2 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        Choose a category to enable submission
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="rounded-lg px-4 py-3 text-[13px] flex-shrink-0"
                style={{
                  marginTop:  14,
                  background: 'var(--status-error-bg)',
                  color:      'var(--status-error-text)',
                  border:     '1px solid rgba(211,47,47,0.3)',
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Right: EXIF panel — only when EXIF is available */}
          {hasExif && (
            <div
              className="flex-shrink-0 overflow-y-auto"
              style={{
                width:       240,
                padding:     '24px 20px',
                borderLeft:  '1px solid var(--border-subtle)',
                background:  'var(--surface-0)',
              }}
            >
              <p
                className="text-[11px] font-bold uppercase tracking-[0.07em] mb-4"
                style={{ color: 'var(--text-tertiary)' }}
              >
                EXIF Data
              </p>
              <dl className="space-y-3">
                {exifRows.map(({ label, value }) => (
                  <div key={label}>
                    <dt
                      className="text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {label}
                    </dt>
                    <dd
                      className="text-[12px] font-medium mt-0.5 leading-snug"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-end gap-3 flex-shrink-0"
          style={{ padding: '16px 24px', borderTop: '1px solid var(--border-default)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-[14px] font-semibold transition-colors"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)', background: 'transparent' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading || !canSave}
            className="rounded-lg px-5 py-2 text-[14px] font-bold text-white transition-opacity"
            style={{
              background: 'var(--action-primary)',
              opacity:    uploading || !canSave ? 0.5 : 1,
              cursor:     uploading || !canSave ? 'not-allowed' : 'pointer',
            }}
          >
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

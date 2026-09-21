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
  count: number
  limit: number | null
}

export type OpenCompetition = {
  id:                string
  title:             string
  submissionLimit:   number | null
  mySubmissionCount: number
  categories:        CompetitionCategory[]
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  )
}

function IconUpload() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={36} height={36}>
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
      <path d="M12 12v9"/><path d="m16 16-4-4-4 4"/>
    </svg>
  )
}

// ─── Shared atoms ─────────────────────────────────────────────────────────────

function ExifPanel({ rows }: { rows: { label: string; value: string }[] }) {
  if (rows.length === 0) return null
  return (
    <dl style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 0, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
      {rows.map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <dt style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</dt>
          <dd style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function TitleField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
        Image name <span style={{ color: 'var(--status-error)' }}>*</span>
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function UploadModal({
  open, onClose, userId, openCompetition,
}: {
  open:            boolean
  onClose:         () => void
  userId:          string
  openCompetition: OpenCompetition | null
}) {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [file,         setFile]         = useState<File | null>(null)
  const [preview,      setPreview]      = useState<string | null>(null)
  const [exifData,     setExifData]     = useState<Record<string, unknown> | null>(null)
  const [imageDims,    setImageDims]    = useState<string | null>(null)
  const [title,        setTitle]        = useState('')
  const [submitToComp, setSubmitToComp] = useState(false)
  const [categoryId,   setCategoryId]   = useState('')
  const [uploading,    setUploading]    = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  // Scroll lock + Escape
  useEffect(() => {
    if (!open) return
    const w = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow     = 'hidden'
    document.body.style.paddingRight = `${w}px`
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow     = ''
      document.body.style.paddingRight = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  // Reset on open
  useEffect(() => {
    if (open) {
      setFile(null); setPreview(null); setExifData(null); setImageDims(null)
      setTitle(''); setSubmitToComp(false); setCategoryId(''); setError(null)
    }
  }, [open])

  if (!open) return null

  async function pickFile(selected: File) {
    const url = URL.createObjectURL(selected)
    setFile(selected)
    setPreview(url)
    setError(null)
    // Derive dimensions from the actual image — works on every format, no EXIF needed
    const img = new window.Image()
    img.onload = () => setImageDims(
      `${img.naturalWidth.toLocaleString()} × ${img.naturalHeight.toLocaleString()} px`
    )
    img.src = url
    // Parse EXIF only for the capture date
    try {
      const parsed = await exifr.parse(selected, { pick: EXIF_TAGS })
      setExifData(parsed ?? null)
    } catch { setExifData(null) }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) pickFile(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f && f.type.startsWith('image/')) pickFile(f)
  }

  async function handleUpload() {
    if (!file || !title.trim()) return
    setUploading(true); setError(null)

    const ext         = file.name.split('.').pop() ?? 'jpg'
    const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`
    const supabase    = createClient()
    const { error: storageErr } = await supabase.storage.from('images').upload(storagePath, file, { upsert: false })
    if (storageErr) { setError(storageErr.message); setUploading(false); return }

    if (submitToComp && openCompetition && categoryId) {
      const { error: err } = await submitUploadedImage({
        storagePath, title: title.trim(), description: '', exifData, competitionId: openCompetition.id, categoryId,
      })
      if (err) { await supabase.storage.from('images').remove([storagePath]); setError(err); setUploading(false); return }
    } else {
      const { error: err } = await uploadImageToLibrary({ title: title.trim(), description: '', storage_path: storagePath, exif_data: exifData })
      if (err) { await supabase.storage.from('images').remove([storagePath]); setError(err); setUploading(false); return }
    }

    setUploading(false); router.refresh(); onClose()
  }

  const displayRows: { label: string; value: string }[] = []
  if (imageDims) displayRows.push({ label: 'Dimensions', value: imageDims })
  const capturedRow = exifData ? buildExifRows(exifData).find(r => r.label === 'Captured') : null
  if (capturedRow) displayRows.push({ label: 'Date', value: capturedRow.value })
  const atLimit  = openCompetition?.submissionLimit !== null && (openCompetition?.mySubmissionCount ?? 0) >= (openCompetition?.submissionLimit ?? 0)
  const canSave  = !!file && !!title.trim() && (!submitToComp || !!categoryId)
  const btnLabel = uploading ? 'Uploading…' : submitToComp && categoryId ? 'Upload & submit' : 'Add to library'

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(900px, calc(100vw - 48px))',
          height: 'min(640px, calc(100vh - 48px))',
          display: 'flex', flexDirection: 'column',
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: 18, overflow: 'hidden',
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--border-default)',
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {file ? 'Upload an image' : 'Upload an image'}
            </h2>
            {file && (
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
                Name your image{openCompetition && !atLimit ? ' and optionally submit it to a competition' : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none', flexShrink: 0,
              background: 'var(--surface-2)', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-0)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}
          >
            <IconClose />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        {!file ? (
          /* Step A: drop zone */
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--action-primary)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(26,111,196,0.04)' }}
              onDragLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              onDrop={e => { handleDrop(e); (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              style={{
                width: '100%', maxWidth: 480, border: '2px dashed var(--border-default)',
                borderRadius: 14, padding: '60px 40px', cursor: 'pointer', textAlign: 'center',
                background: 'transparent', transition: 'border-color .15s, background .15s',
              }}
            >
              <div style={{ color: 'var(--text-tertiary)', marginBottom: 14, display: 'flex', justifyContent: 'center' }}>
                <IconUpload />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                Click or drag a photo here
              </p>
              <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 6 }}>
                JPEG &middot; PNG &middot; WebP &mdash; max 20 MB
              </p>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleInputChange} />
          </div>
        ) : (
          /* Step B: two-column */
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Left: preview */}
            <div
              title="Click to choose a different photo"
              onClick={() => fileRef.current?.click()}
              style={{
                flex: '0 0 57%', background: 'var(--surface-0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', cursor: 'pointer', position: 'relative',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview!} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
              <div style={{
                position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11.5, fontWeight: 500,
                padding: '4px 10px', borderRadius: 20, pointerEvents: 'none', whiteSpace: 'nowrap',
              }}>
                Click to change photo
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleInputChange} />
            </div>

            {/* Right: form */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '22px 22px',
              borderLeft: '1px solid var(--border-subtle)',
              background: 'var(--surface-2)',
              display: 'flex', flexDirection: 'column', gap: 18,
            }}>

              {/* EXIF */}
              <ExifPanel rows={displayRows} />
              {displayRows.length > 0 && <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0 }} />}

              {/* Title */}
              <TitleField value={title} onChange={setTitle} />

              {/* Competition block */}
              {openCompetition && atLimit && (
                <div style={{ borderRadius: 8, padding: '10px 14px', fontSize: 12.5, background: 'var(--status-warning-bg)', color: 'var(--status-warning-text)', border: '1px solid rgba(166,124,0,0.25)' }}>
                  You&apos;ve used all {openCompetition.submissionLimit} submissions for this competition.
                </div>
              )}
              {openCompetition && !atLimit && (
                <div style={{ borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', padding: '12px 14px' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox" checked={submitToComp}
                      onChange={e => { setSubmitToComp(e.target.checked); if (!e.target.checked) setCategoryId('') }}
                      style={{ marginTop: 2, accentColor: 'var(--action-primary)', flexShrink: 0 }}
                    />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Also submit to open competition</p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{openCompetition.title}</p>
                    </div>
                  </label>
                  {submitToComp && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Select a category</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {openCompetition.categories.map(cat => {
                          const isFull     = cat.limit !== null && cat.count >= cat.limit
                          const isSelected = categoryId === cat.id
                          return (
                            <button
                              key={cat.id} type="button" disabled={isFull}
                              onClick={() => !isFull && setCategoryId(cat.id)}
                              style={{
                                borderRadius: 20, padding: '5px 12px', fontSize: 12.5, fontWeight: 600,
                                border: `1px solid ${isSelected ? 'var(--action-primary)' : 'var(--border-default)'}`,
                                background: isSelected ? 'var(--action-primary)' : isFull ? 'var(--surface-0)' : 'transparent',
                                color: isSelected ? '#fff' : isFull ? 'var(--text-disabled)' : 'var(--text-secondary)',
                                cursor: isFull ? 'not-allowed' : 'pointer', opacity: isFull ? 0.6 : 1,
                                fontFamily: 'inherit',
                              }}
                            >
                              {cat.name}
                              {cat.limit !== null && <span style={{ marginLeft: 4, opacity: 0.7 }}>({cat.count}/{cat.limit})</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ borderRadius: 8, padding: '10px 14px', fontSize: 13, background: 'var(--status-error-bg)', color: 'var(--status-error-text)', border: '1px solid rgba(211,47,47,0.3)' }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid var(--border-default)',
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            {file && (
              <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', margin: 0 }}>
                {file.name}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button" onClick={onClose}
              style={{
                borderRadius: 8, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)',
                fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
            <button
              type="button" onClick={handleUpload}
              disabled={uploading || !canSave}
              style={{
                borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 700, cursor: uploading || !canSave ? 'not-allowed' : 'pointer',
                background: 'var(--action-primary)', color: '#fff', border: 'none',
                opacity: uploading || !canSave ? 0.45 : 1, fontFamily: 'inherit',
              }}
            >
              {btnLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

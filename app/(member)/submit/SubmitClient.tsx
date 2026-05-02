'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import * as exifr from 'exifr'
import { finalizeSubmission, type SubmitInput, type SubmitResult } from './actions'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CompetitionForSubmit = {
  id:                      string
  title:                   string
  closesAt:                string | null
  submissionLimit:         number
  maxEntriesPerCategory:   number | null
  imageReuseRule:          string
  requireCaptureDate:      boolean
  captureDateWindowMonths: number | null
  allowNotesToJudge:       boolean
  maxLongEdge:             number
  withdrawalFreesSlot:     boolean
  categories:              { id: string; name: string }[]
  entriesUsed:             number
  entriesByCategory:       Record<string, number>
}

export type LibraryImageForSubmit = {
  id:           string
  title:        string
  publicUrl:    string
  createdAt:    string
  fileSize:     number | null
  widthPx:      number | null
  heightPx:     number | null
  exifUniqueId: string | null
  captureDate:  string | null
  activeSubmission: {
    competitionId:    string
    competitionTitle: string
    categoryName:     string
  } | null
}

type DupWarning = {
  layer:         1 | 2
  matchedId:     string
  matchedTitle:  string
  matchedThumb?: string
}

type Confirmed = {
  submissionId:     string
  entryNum:         number
  entriesRemaining: number
  competitionTitle: string
  categoryName:     string
  imageTitle:       string
  previewUrl:       string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024  // 5 MB

const EXIF_TAGS = [
  'Make', 'Model', 'LensMake', 'LensModel',
  'FNumber', 'ExposureTime', 'ISO',
  'FocalLength', 'FocalLengthIn35mmFormat',
  'DateTimeOriginal', 'ColorSpace',
  'ExifImageWidth', 'ExifImageHeight',
  'PixelXDimension', 'PixelYDimension',
  'ImageWidth', 'ImageHeight',
  'ImageUniqueID',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBytes(bytes: number) {
  return bytes >= 1_000_000
    ? `${(bytes / 1_000_000).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

async function getImageDimensions(file: File): Promise<{ w: number; h: number }> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload  = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url) }
    img.onerror = () => { resolve({ w: 0, h: 0 }); URL.revokeObjectURL(url) }
    img.src = url
  })
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

const btn = {
  primary:   'rounded-lg bg-action-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-action-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
  secondary: 'rounded-lg border border-border-default px-5 py-2.5 text-sm font-medium text-content-secondary hover:bg-surface-1 transition-colors',
  ghost:     'text-sm font-medium text-action-primary hover:underline',
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-lg border border-status-error bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
      ⚠ {msg}
    </div>
  )
}

function InfoBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-lg border border-border-default bg-surface-1 px-4 py-3 text-sm text-content-secondary">
      ℹ {msg}
    </div>
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2 rounded-full transition-all ${
            i + 1 === step ? 'w-6 bg-action-primary' :
            i + 1 < step  ? 'w-2 bg-action-primary/40' :
                            'w-2 bg-border-default'
          }`}
        />
      ))}
    </div>
  )
}

// ─── Duplicate warning banner ─────────────────────────────────────────────────

function DupWarningCard({
  warn, onProceed, onCancel,
}: {
  warn:      DupWarning
  onProceed: () => void
  onCancel:  () => void
}) {
  return (
    <div className="rounded-xl border border-status-warning bg-status-warning-bg p-4 space-y-3">
      <p className="text-sm font-semibold text-status-warning-text">
        {warn.layer === 1
          ? 'This image may have been submitted before.'
          : 'This image looks similar to one you\'ve previously submitted.'}
      </p>
      {warn.matchedThumb && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={warn.matchedThumb} alt={warn.matchedTitle} className="h-14 w-14 rounded-md object-cover flex-shrink-0" />
          <p className="text-sm text-content-secondary">{warn.matchedTitle}</p>
        </div>
      )}
      <p className="text-xs text-content-tertiary">
        {warn.layer === 1
          ? 'Your club\'s reuse policy may apply.'
          : 'If this is the same image, your club\'s reuse policy may apply. False positives are possible.'}
      </p>
      <div className="flex gap-3">
        <button onClick={onProceed} className={btn.primary}>
          {warn.layer === 1 ? 'Yes, use this image anyway' : 'It\'s a different image — continue'}
        </button>
        <button onClick={onCancel} className={btn.secondary}>Choose a different image</button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SubmitClient({
  competitions,
  libraryImages,
  userId,
  initialCompetitionId,
  initialCategoryId,
}: {
  competitions:         CompetitionForSubmit[]
  libraryImages:        LibraryImageForSubmit[]
  userId:               string
  initialCompetitionId: string | null
  initialCategoryId:    string | null
}) {
  const router = useRouter()

  // Determine starting step
  const validInitialComp = initialCompetitionId
    ? competitions.find(c => c.id === initialCompetitionId)
    : null
  const validInitialCat = validInitialComp && initialCategoryId
    ? validInitialComp.categories.find(c => c.id === initialCategoryId)
    : null
  const initialAutoCategory = validInitialComp?.categories.length === 1
    ? validInitialComp.categories[0]
    : null
  // Skip Step 1 only when the category is already resolved
  const startStep = validInitialComp && (validInitialCat || initialAutoCategory) ? 2 : 1

  // ── Navigation state ───────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(startStep as 1 | 2 | 3 | 4 | 5)

  // ── Step 1: Competition + Category ────────────────────────────────────────
  const [compId, setCompId] = useState(initialCompetitionId ?? '')
  const [catId,  setCatId]  = useState(
    validInitialCat?.id ?? initialAutoCategory?.id ?? initialCategoryId ?? ''
  )

  // ── Step 2: Image source ──────────────────────────────────────────────────
  const [tab, setTab] = useState<'upload' | 'library'>('upload')

  // Upload sub-state
  const fileInputRef            = useRef<HTMLInputElement>(null)
  const [file,          setFile]          = useState<File | null>(null)
  const [previewUrl,    setPreviewUrl]    = useState('')
  const [fileError,     setFileError]     = useState('')
  const [dims,          setDims]          = useState<{ w: number; h: number } | null>(null)
  const [rawExif,       setRawExif]       = useState<Record<string, unknown> | null>(null)
  const [exifUniqueId,  setExifUniqueId]  = useState<string | null>(null)
  const [captureDate,   setCaptureDate]   = useState<Date | null>(null)
  const [colorWarn,     setColorWarn]     = useState(false)
  const [captureInfo,   setCaptureInfo]   = useState('')
  const [uploading,     setUploading]     = useState(false)
  const [uploadedPath,  setUploadedPath]  = useState('')
  const [uploadError,   setUploadError]   = useState('')
  const [analyzing,     setAnalyzing]     = useState(false)
  const [pHash,         setPHash]         = useState<string | null>(null)

  // Library sub-state
  const [selectedLibId, setSelectedLibId] = useState('')
  const [libFilter,     setLibFilter]     = useState<'all' | 'available' | 'entered'>('all')

  // Duplicate warning (shared)
  const [dupWarn,    setDupWarn]    = useState<DupWarning | null>(null)
  const [dupOverride, setDupOverride] = useState(false)

  // ── Step 3: Details ───────────────────────────────────────────────────────
  const [imageTitle, setImageTitle] = useState('')
  const [imageNotes, setImageNotes] = useState('')

  // ── Submit ────────────────────────────────────────────────────────────────
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [confirmed,   setConfirmed]   = useState<Confirmed | null>(null)

  // ── Derived ───────────────────────────────────────────────────────────────
  const competition     = competitions.find(c => c.id === compId) ?? null
  const autoCategory    = competition?.categories.length === 1 ? competition.categories[0] : null
  const category        = competition?.categories.find(c => c.id === catId) ?? autoCategory ?? null
  const selectedLibImg  = libraryImages.find(i => i.id === selectedLibId) ?? null
  const step2UploadReady = !!(uploadedPath && !uploading && !analyzing && (!dupWarn || dupOverride))
  const step2LibReady    = !!(selectedLibId && !selectedLibImg?.activeSubmission && (!dupWarn || dupOverride))

  // ── File selection & upload ───────────────────────────────────────────────

  async function handleFileSelect(f: File) {
    setFile(f)
    setFileError('')
    setUploadedPath('')
    setPHash(null)
    setDupWarn(null)
    setDupOverride(false)
    setCaptureInfo('')
    setColorWarn(false)
    setRawExif(null)

    const objectUrl = URL.createObjectURL(f)
    setPreviewUrl(objectUrl)

    // Type check
    if (!f.type.includes('jpeg') && !f.name.toLowerCase().endsWith('.jpg') && !f.name.toLowerCase().endsWith('.jpeg')) {
      setFileError('Only JPEG images are accepted. Please export your image as a JPEG and try again.')
      return
    }

    // Size check
    if (f.size > MAX_FILE_SIZE) {
      setFileError(`This file is ${fmtBytes(f.size)}. Maximum file size is 5 MB. Please export a smaller version and try again.`)
      return
    }

    // Dimensions
    const dimensions = await getImageDimensions(f)
    setDims(dimensions)
    const longEdge = Math.max(dimensions.w, dimensions.h)
    if (competition && longEdge > competition.maxLongEdge) {
      setFileError(`This image's long edge is ${longEdge}px. Maximum is ${competition.maxLongEdge}px. Please resize and try again.`)
      return
    }

    // EXIF
    let localUniqueId: string | null = null
    let localCapture:  Date | null   = null
    try {
      const parsed = await exifr.parse(f, { pick: EXIF_TAGS })
      if (parsed) {
        setRawExif(parsed)
        localUniqueId = (parsed.ImageUniqueID as string | undefined) ?? null
        setExifUniqueId(localUniqueId)
        if (parsed.DateTimeOriginal) {
          localCapture = parsed.DateTimeOriginal instanceof Date
            ? parsed.DateTimeOriginal
            : new Date(parsed.DateTimeOriginal as string)
          setCaptureDate(localCapture)
        }
        // sRGB warning (ColorSpace 2 = Adobe RGB)
        if (parsed.ColorSpace === 2) setColorWarn(true)
      }
    } catch { /* non-fatal */ }

    // Capture date restriction
    if (competition?.requireCaptureDate) {
      if (!localCapture) {
        setCaptureInfo('No capture date found in this image\'s metadata. This entry will be flagged for manual review. You can still submit.')
      } else if (competition.captureDateWindowMonths) {
        const cutoff = new Date()
        cutoff.setMonth(cutoff.getMonth() - competition.captureDateWindowMonths)
        if (localCapture < cutoff) {
          setFileError(
            `This image was captured on ${localCapture.toLocaleDateString()}, which is outside the eligible date range. ` +
            `Images must have been captured within the last ${competition.captureDateWindowMonths} months.`
          )
          return
        }
      }
    }

    // Layer 1: EXIF unique ID check
    if (localUniqueId) {
      const match = libraryImages.find(img => img.exifUniqueId === localUniqueId)
      if (match) {
        setDupWarn({ layer: 1, matchedId: match.id, matchedTitle: match.title, matchedThumb: match.publicUrl })
        return  // wait for user response before uploading
      }
    }

    await doUpload(f)
  }

  async function doUpload(f: File) {
    setUploading(true)
    setUploadError('')

    const supabase = createClient()
    const storagePath = `${userId}/${crypto.randomUUID()}.jpg`

    const { error: upErr } = await supabase.storage
      .from('images')
      .upload(storagePath, f, { upsert: false, contentType: 'image/jpeg' })

    if (upErr) {
      setUploadError('Upload failed. Please check your connection and try again.')
      setUploading(false)
      return
    }

    setUploadedPath(storagePath)
    setUploading(false)

    // Layer 2: pHash analysis
    setAnalyzing(true)
    try {
      const res  = await fetch('/api/images/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ storagePath }),
      })
      const data = await res.json() as { hash: string | null; matches: { imageId: string; title: string; thumbUrl: string }[] }
      if (data.hash) setPHash(data.hash)
      if (data.matches?.length > 0 && !dupOverride) {
        const m = data.matches[0]
        setDupWarn({ layer: 2, matchedId: m.imageId, matchedTitle: m.title, matchedThumb: m.thumbUrl })
      }
    } catch { /* non-fatal */ }
    setAnalyzing(false)
  }

  function handleDupProceed() {
    setDupOverride(true)
    setDupWarn(null)
    // If Layer 1 was triggered before upload, start upload now
    if (file && !uploadedPath) {
      doUpload(file)
    }
  }

  function handleDupCancel() {
    setDupWarn(null)
    setFile(null)
    setPreviewUrl('')
    setUploadedPath('')
    setDims(null)
    setPHash(null)
    setDupOverride(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Pre-fill title from library image or filename when advancing to step 3
  function advanceToDetails() {
    if (autoCategory && !catId) setCatId(autoCategory.id)
    if (tab === 'upload' && file) {
      if (!imageTitle) setImageTitle(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
    } else if (tab === 'library' && selectedLibImg) {
      if (!imageTitle) setImageTitle(selectedLibImg.title)
    }
    setStep(3)
  }

  // ── Final submission ──────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!competition || !category) return
    setSubmitting(true)
    setSubmitError('')

    const input: SubmitInput = {
      competitionId:            competition.id,
      categoryId:               category.id,
      imageSource:              tab === 'upload' ? 'upload' : 'library',
      title:                    imageTitle.trim(),
      notes:                    imageNotes.trim() || undefined,
      duplicateWarningShown:    !!dupWarn || dupOverride,
      duplicateWarningOverride: dupOverride,
      ...(tab === 'upload'
        ? {
            storagePath:  uploadedPath,
            fileSize:     file?.size,
            widthPx:      dims?.w,
            heightPx:     dims?.h,
            exifData:     rawExif,
            exifUniqueId: exifUniqueId,
            pHash:        pHash,
          }
        : { libraryImageId: selectedLibId }),
    }

    const result: SubmitResult = await finalizeSubmission(input)
    setSubmitting(false)

    if (!result.ok) {
      setSubmitError(result.error)
      return
    }

    setConfirmed({
      submissionId:     result.submissionId,
      entryNum:         result.entryNum,
      entriesRemaining: result.entriesRemaining,
      competitionTitle: competition.title,
      categoryName:     category.name,
      imageTitle:       imageTitle.trim(),
      previewUrl:       tab === 'upload' ? previewUrl : (selectedLibImg?.publicUrl ?? ''),
    })
    setStep(5)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[680px] py-8 px-4">

      {/* ── Step 1: Competition + Category ─────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-content-primary">Submit an entry</h1>
            <p className="mt-1 text-sm text-content-tertiary">Choose a competition and category</p>
          </div>
          <StepDots step={1} total={4} />

          {competitions.length === 0 ? (
            <div className="rounded-xl border border-border-default bg-surface-2 px-6 py-10 text-center">
              <p className="text-sm text-content-tertiary">No competitions are open for submissions right now.</p>
              <Link href="/competitions" className="mt-3 inline-block text-sm text-action-primary hover:underline">
                View all competitions →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {competitions.map(c => {
                const remaining = c.submissionLimit - c.entriesUsed
                const selected  = compId === c.id
                return (
                  <div
                    key={c.id}
                    role="radio"
                    aria-checked={selected}
                    tabIndex={0}
                    onClick={() => { setCompId(c.id); setCatId('') }}
                    onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setCompId(c.id); setCatId('') } }}
                    className={`w-full rounded-xl border px-5 py-4 text-left cursor-pointer transition-colors ${
                      selected
                        ? 'border-action-primary bg-[rgba(26,111,196,0.06)]'
                        : 'border-border-default bg-surface-2 hover:bg-surface-1'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-content-primary">{c.title}</p>
                        <p className="mt-0.5 text-xs text-content-tertiary">
                          {c.closesAt && `Closes ${fmtDate(c.closesAt)} · `}
                          {remaining > 0
                            ? `${remaining} of ${c.submissionLimit} ${remaining === 1 ? 'entry' : 'entries'} remaining`
                            : 'Entry limit reached'}
                        </p>
                      </div>
                      <span className={`mt-0.5 flex-shrink-0 h-4 w-4 rounded-full border-2 ${
                        selected ? 'border-action-primary bg-action-primary' : 'border-border-strong'
                      }`} />
                    </div>

                    {/* Category picker — shown inline after competition selected */}
                    {selected && c.categories.length > 1 && (
                      <div
                        className="mt-4 pt-4 border-t border-border-subtle space-y-2"
                        onClick={e => e.stopPropagation()}
                      >
                        <p className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">Category</p>
                        {c.categories.map(cat => {
                          const catRemaining = c.maxEntriesPerCategory
                            ? c.maxEntriesPerCategory - (c.entriesByCategory[cat.id] ?? 0)
                            : null
                          const catFull = catRemaining !== null && catRemaining <= 0
                          return (
                            <button
                              key={cat.id}
                              onClick={e => { e.stopPropagation(); setCatId(cat.id) }}
                              disabled={catFull}
                              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                catId === cat.id ? 'bg-[rgba(26,111,196,0.08)] text-action-primary' : 'hover:bg-surface-0 text-content-primary'
                              }`}
                            >
                              <span className={`h-3.5 w-3.5 rounded-full border-2 flex-shrink-0 ${
                                catId === cat.id ? 'border-action-primary bg-action-primary' : 'border-border-strong'
                              }`} />
                              {cat.name}
                              {catFull && <span className="ml-auto text-xs text-content-tertiary">Full</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/competitions" className={btn.secondary}>Cancel</Link>
            <button
              disabled={!compId || (!catId && (competition?.categories.length ?? 0) > 1)}
              onClick={() => {
                if (autoCategory && !catId) setCatId(autoCategory.id)
                setStep(2)
              }}
              className={btn.primary}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Choose image ────────────────────────────────────────────── */}
      {step === 2 && competition && (
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
              {competition.title} · {category?.name ?? (autoCategory?.name ?? '')}
            </p>
            <h1 className="mt-1 text-xl font-semibold text-content-primary">Choose your image</h1>
          </div>
          <StepDots step={2} total={4} />

          {/* Tab switcher */}
          <div className="flex rounded-lg border border-border-default bg-surface-1 p-1 gap-1">
            {(['upload', 'library'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setDupWarn(null); setDupOverride(false) }}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                  tab === t ? 'bg-surface-2 text-content-primary shadow-sm' : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                {t === 'upload' ? 'Upload new' : 'From my library'}
              </button>
            ))}
          </div>

          {/* ── Upload tab ── */}
          {tab === 'upload' && (
            <div className="space-y-4">
              {/* Drop zone */}
              {!file && !fileError && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-52 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-default bg-surface-1 transition-colors hover:border-action-primary hover:bg-[rgba(26,111,196,0.03)]"
                >
                  <svg className="h-8 w-8 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm font-medium text-content-secondary">Drag and drop your image here</p>
                    <p className="mt-0.5 text-xs text-content-tertiary">or click to browse</p>
                  </div>
                  <p className="text-xs text-content-tertiary">
                    JPEG · Max 5 MB · Long edge max {competition.maxLongEdge}px
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,.jpg,.jpeg"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
              />

              {fileError && (
                <>
                  <ErrorBox msg={fileError} />
                  <button onClick={() => { setFile(null); setFileError(''); setPreviewUrl(''); if (fileInputRef.current) fileInputRef.current.value = '' }} className={btn.secondary}>
                    Choose a different image
                  </button>
                </>
              )}

              {/* Duplicate warning */}
              {dupWarn && !fileError && (
                <DupWarningCard warn={dupWarn} onProceed={handleDupProceed} onCancel={handleDupCancel} />
              )}

              {/* Preview (shown when file selected and not in error state) */}
              {file && !fileError && !dupWarn && (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-xl border border-border-default bg-surface-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview" className="max-h-72 w-full object-contain" />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-content-secondary">{file.name}</span>
                    {dims && <span className="text-content-tertiary">· {dims.w} × {dims.h}px</span>}
                    <span className="text-content-tertiary">· {fmtBytes(file.size)}</span>
                    {uploadedPath && !uploading && !analyzing && (
                      <span className="ml-auto text-status-success-text font-medium">✓</span>
                    )}
                    {(uploading || analyzing) && (
                      <span className="ml-auto text-xs text-content-tertiary animate-pulse">
                        {uploading ? 'Uploading…' : 'Checking…'}
                      </span>
                    )}
                  </div>

                  {colorWarn && (
                    <InfoBox msg="This image appears to use Adobe RGB colour space. Colours may appear less saturated than expected. Consider exporting in sRGB for best results." />
                  )}
                  {captureInfo && <InfoBox msg={captureInfo} />}
                  {uploadError && <ErrorBox msg={uploadError} />}

                  <button
                    onClick={() => { setFile(null); setPreviewUrl(''); setFileError(''); setUploadedPath(''); setPHash(null); setDims(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className={btn.ghost}
                  >
                    Choose a different image
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Library tab ── */}
          {tab === 'library' && (
            <div className="space-y-4">
              {libraryImages.length === 0 ? (
                <div className="rounded-xl border border-border-default bg-surface-2 px-6 py-10 text-center space-y-3">
                  <p className="text-sm text-content-tertiary">Your image library is empty.</p>
                  <p className="text-xs text-content-tertiary">Images you upload to competitions are saved here for future use.</p>
                  <button onClick={() => setTab('upload')} className={btn.primary}>Upload a new image instead</button>
                </div>
              ) : (
                <>
                  {/* Filter */}
                  <div className="flex gap-2">
                    {(['all', 'available', 'entered'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setLibFilter(f)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          libFilter === f ? 'bg-action-primary text-white' : 'border border-border-default text-content-secondary hover:bg-surface-1'
                        }`}
                      >
                        {f === 'all' ? 'All' : f === 'available' ? 'Not yet entered' : 'Previously entered'}
                      </button>
                    ))}
                  </div>

                  {/* Dup warning for library selection */}
                  {dupWarn && (
                    <DupWarningCard warn={dupWarn} onProceed={() => { setDupOverride(true); setDupWarn(null) }} onCancel={() => { setDupWarn(null); setSelectedLibId('') }} />
                  )}

                  {/* Image grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {libraryImages
                      .filter(img => {
                        if (libFilter === 'available') return !img.activeSubmission
                        if (libFilter === 'entered')   return !!img.activeSubmission
                        return true
                      })
                      .map(img => {
                        const blocked  = !!img.activeSubmission
                        const selected = selectedLibId === img.id
                        return (
                          <button
                            key={img.id}
                            disabled={blocked}
                            onClick={() => {
                              setSelectedLibId(img.id)
                              setDupWarn(null)
                            }}
                            title={blocked ? `Currently entered in ${img.activeSubmission!.competitionTitle}` : undefined}
                            className={`relative rounded-xl border-2 overflow-hidden text-left transition-all ${
                              selected ? 'border-action-primary shadow-md' :
                              blocked  ? 'border-border-subtle opacity-50 cursor-not-allowed' :
                                        'border-transparent hover:border-border-strong'
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.publicUrl}
                              alt={img.title}
                              className="h-28 w-full object-cover"
                            />
                            {selected && (
                              <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-action-primary">
                                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                            <div className="px-2 py-1.5">
                              <p className="truncate text-xs font-medium text-content-primary">{img.title}</p>
                              <p className="text-[10px] text-content-tertiary">
                                {blocked ? `Entered in ${img.activeSubmission!.competitionTitle}` : fmtDate(img.createdAt)}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex justify-between gap-3 pt-2 border-t border-border-subtle">
            <button onClick={() => { if (startStep === 2) router.back(); else setStep(1) }} className={btn.secondary}>
              ← Back
            </button>
            <button
              disabled={tab === 'upload' ? !step2UploadReady : !step2LibReady}
              onClick={advanceToDetails}
              className={btn.primary}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Image details ───────────────────────────────────────────── */}
      {step === 3 && competition && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-content-primary">Image details</h1>
            <p className="mt-1 text-sm text-content-tertiary">This information is shown in results and to the judge.</p>
          </div>
          <StepDots step={3} total={4} />

          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-content-primary">
                Title <span className="text-status-error">*</span>
              </label>
              <input
                type="text"
                maxLength={120}
                value={imageTitle}
                onChange={e => setImageTitle(e.target.value)}
                placeholder="Give your image a title"
                className="w-full rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-sm text-content-primary placeholder-content-muted focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
              />
              <p className="mt-1 text-xs text-content-tertiary">Shown in results and on your profile.</p>
            </div>

            {competition.allowNotesToJudge && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-content-primary">
                  Notes to the judge{' '}
                  <span className="font-normal text-content-tertiary">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={imageNotes}
                  onChange={e => setImageNotes(e.target.value)}
                  placeholder="Any context you'd like the judge to consider…"
                  className="w-full resize-none rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-sm text-content-primary placeholder-content-muted focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
                />
                <p className="mt-1 text-xs text-content-tertiary">Visible to the judge only. Never shown publicly.</p>
              </div>
            )}
          </div>

          <div className="flex justify-between gap-3 pt-2 border-t border-border-subtle">
            <button onClick={() => setStep(2)} className={btn.secondary}>← Back</button>
            <button
              disabled={!imageTitle.trim()}
              onClick={() => setStep(4)}
              className={btn.primary}
            >
              Review entry →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Review ──────────────────────────────────────────────────── */}
      {step === 4 && competition && category && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-content-primary">Review your entry</h1>
          </div>
          <StepDots step={4} total={4} />

          <div className="rounded-xl border border-border-default bg-surface-2 overflow-hidden">
            {/* Image preview */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tab === 'upload' ? previewUrl : (selectedLibImg?.publicUrl ?? '')}
              alt={imageTitle}
              className="w-full max-h-80 object-contain bg-surface-1"
            />

            {/* Details */}
            <div className="divide-y divide-border-subtle">
              {[
                ['Competition', competition.title],
                ['Category',   category.name],
                ['Title',      imageTitle],
                ...(tab === 'upload' && file
                  ? [['File', `${file.name} · ${dims ? `${dims.w} × ${dims.h}px` : ''} · ${fmtBytes(file.size)}`]]
                  : selectedLibImg?.widthPx
                    ? [['File', `${selectedLibImg.widthPx} × ${selectedLibImg.heightPx}px${selectedLibImg.fileSize ? ` · ${fmtBytes(selectedLibImg.fileSize)}` : ''}`]]
                    : []),
                ...(captureDate || selectedLibImg?.captureDate
                  ? [['Captured', fmtDate(captureDate?.toISOString() ?? selectedLibImg!.captureDate!)]]
                  : []),
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4 px-5 py-3">
                  <span className="w-28 flex-shrink-0 text-sm text-content-tertiary">{label}</span>
                  <span className="text-sm text-content-primary">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Edit links */}
          <div className="flex gap-4 text-sm">
            <button onClick={() => setStep(3)} className={btn.ghost}>Edit details</button>
            <button onClick={() => setStep(2)} className={btn.ghost}>Change image</button>
          </div>

          {/* Declaration */}
          <p className="text-xs text-content-tertiary border border-border-subtle rounded-lg px-4 py-3 bg-surface-1">
            By submitting you confirm this is your own original work and has not been submitted to another competition in violation of your club's image reuse policy.
          </p>

          {submitError && <ErrorBox msg={submitError} />}

          <button
            disabled={submitting}
            onClick={handleSubmit}
            className={`w-full ${btn.primary} py-3`}
          >
            {submitting ? 'Submitting…' : 'Submit entry'}
          </button>
        </div>
      )}

      {/* ── Step 5: Confirmation ─────────────────────────────────────────────── */}
      {step === 5 && confirmed && (
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-status-success-bg">
              <svg className="h-7 w-7 text-status-success-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>

          <div>
            <h1 className="text-xl font-semibold text-content-primary">Entry submitted</h1>
            <p className="mt-1 text-sm text-content-secondary">
              Your image has been entered into{' '}
              <span className="font-medium">{confirmed.competitionTitle}</span>
              {' — '}
              <span className="font-medium">{confirmed.categoryName}</span>
            </p>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={confirmed.previewUrl}
            alt={confirmed.imageTitle}
            className="mx-auto h-40 w-full max-w-xs rounded-xl object-contain bg-surface-1"
          />

          <div>
            <p className="font-medium text-content-primary">{confirmed.imageTitle}</p>
            <p className="mt-0.5 text-sm text-content-tertiary">Entry #{confirmed.entryNum}</p>
            {confirmed.entriesRemaining > 0 && (
              <p className="mt-1 text-sm text-content-secondary">
                You have{' '}
                <span className="font-medium">{confirmed.entriesRemaining}</span>
                {' '}{confirmed.entriesRemaining === 1 ? 'entry' : 'entries'} remaining for this competition.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            {confirmed.entriesRemaining > 0 && (
              <Link
                href={`/submit?competition=${compId}`}
                onClick={() => { setStep(2); setFile(null); setPreviewUrl(''); setUploadedPath(''); setSelectedLibId(''); setImageTitle(''); setImageNotes(''); setDupWarn(null); setDupOverride(false) }}
                className={`${btn.primary} text-center`}
              >
                Submit another entry
              </Link>
            )}
            <Link href="/competitions" className={`${btn.secondary} text-center`}>
              Back to competitions
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

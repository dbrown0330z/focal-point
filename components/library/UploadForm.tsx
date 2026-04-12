'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createImageRecord } from '@/app/(member)/library/actions'
import * as exifr from 'exifr'

const inputCls = "w-full rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-sm text-content-primary placeholder-content-muted focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
const labelCls = "mb-1.5 block text-sm font-medium text-content-primary"

const EXIF_TAGS = [
  'Make', 'Model',
  'LensMake', 'LensModel',
  'FNumber', 'ExposureTime', 'ISO', 'ISOSpeedRatings',
  'FocalLength', 'FocalLengthIn35mmFormat',
  'DateTimeOriginal',
  'ColorSpace',
  'ExifImageWidth', 'ExifImageHeight',
  'PixelXDimension', 'PixelYDimension',
  'ImageWidth', 'ImageHeight',
  'Flash', 'WhiteBalance', 'MeteringMode',
  'GPSLatitude', 'GPSLongitude',
]

export default function UploadForm({ userId }: { userId: string }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [exifData, setExifData] = useState<Record<string, unknown> | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) return

    const form = e.currentTarget
    const title       = (form.elements.namedItem('title') as HTMLInputElement).value
    const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value

    setUploading(true)
    setError(null)

    const ext = file.name.split('.').pop()
    const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`

    const supabase = createClient()
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(storagePath, file, { upsert: false })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    await createImageRecord({ title, description, storage_path: storagePath, exif_data: exifData })
    setUploading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div
        onClick={() => fileRef.current?.click()}
        className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-default bg-surface-1 transition-colors hover:border-border-strong hover:bg-surface-0"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="h-full w-full rounded-xl object-contain p-2" />
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium text-content-secondary">Click to choose a photo</p>
            <p className="mt-1 text-xs text-content-tertiary">JPEG, PNG, WebP — max 20 MB</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} required />
      </div>

      <div>
        <label htmlFor="title" className={labelCls}>
          Title <span className="text-status-error">*</span>
        </label>
        <input id="title" name="title" type="text" required maxLength={120} placeholder="Golden Hour at the Pier" className={inputCls} />
      </div>

      <div>
        <label htmlFor="description" className={labelCls}>
          Description <span className="font-normal text-content-muted">(optional)</span>
        </label>
        <textarea id="description" name="description" rows={3} maxLength={500} placeholder="Camera, settings, story behind the shot…" className={`${inputCls} resize-none`} />
      </div>

      {/* EXIF preview */}
      {exifData && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            {/* Green check */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-status-success flex-shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
            </svg>
            <span className="text-sm text-content-secondary">Exif data detected</span>
          </div>
          <p className="pl-5.5 text-xs text-content-tertiary">
            {[
              exifData.Make && exifData.Model && `${exifData.Make} ${exifData.Model}`,
              exifData.LensModel,
              exifData.FocalLength && `${exifData.FocalLength}mm`,
              exifData.FNumber && `f/${exifData.FNumber}`,
              exifData.ExposureTime && `1/${Math.round(1 / Number(exifData.ExposureTime))}s`,
              (exifData.ISO ?? exifData.ISOSpeedRatings) && `ISO ${exifData.ISO ?? exifData.ISOSpeedRatings}`,
            ].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-status-error bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={uploading || !file} className="rounded-lg bg-action-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-action-primary-hover disabled:cursor-not-allowed disabled:opacity-50 transition-colors">
          {uploading ? 'Uploading…' : 'Add to library'}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-border-default px-5 py-2.5 text-sm font-medium text-content-secondary hover:bg-surface-1 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}

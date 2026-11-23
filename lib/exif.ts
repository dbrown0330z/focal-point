// Shared EXIF parsing tags and formatting utilities.

export const EXIF_TAGS = [
  'Make', 'Model',
  'LensMake', 'LensModel',
  'FNumber', 'ExposureTime', 'ISO', 'ISOSpeedRatings',
  'FocalLength',
  'DateTimeOriginal',
  'ColorSpace',
  'ExifImageWidth', 'ExifImageHeight',
  'PixelXDimension', 'PixelYDimension',
  'ImageWidth', 'ImageHeight',
]

function fNum(v: unknown): number | null {
  const n = Number(v)
  return isFinite(n) ? n : null
}

function fmtCamera(exif: Record<string, unknown>): string | null {
  const make  = (exif.Make  as string | undefined)?.trim() ?? ''
  const model = (exif.Model as string | undefined)?.trim() ?? ''
  if (!make && !model) return null
  return model.toLowerCase().startsWith(make.toLowerCase()) ? model : [make, model].filter(Boolean).join(' ')
}

function fmtLens(exif: Record<string, unknown>): string | null {
  const make  = (exif.LensMake  as string | undefined)?.trim() ?? ''
  const model = (exif.LensModel as string | undefined)?.trim() ?? ''
  if (!make && !model) return null
  return model.toLowerCase().startsWith(make.toLowerCase()) ? model : [make, model].filter(Boolean).join(' ')
}

function fmtDimensions(exif: Record<string, unknown>): string | null {
  const w = fNum(exif.ExifImageWidth ?? exif.PixelXDimension ?? exif.ImageWidth)
  const h = fNum(exif.ExifImageHeight ?? exif.PixelYDimension ?? exif.ImageHeight)
  return w && h ? `${w.toLocaleString()} × ${h.toLocaleString()} px` : null
}

export function buildExifRows(exif: Record<string, unknown>): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = []
  const add = (label: string, value: string | null) => { if (value) rows.push({ label, value }) }

  if (exif.DateTimeOriginal) {
    const d = new Date(exif.DateTimeOriginal as string)
    if (!isNaN(d.getTime())) {
      const date = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
      const time = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
      add('Captured', `${date} · ${time}`)
    }
  }

  add('Dimensions',    fmtDimensions(exif))

  const cs = exif.ColorSpace
  add('Color space',   cs === 1 || cs === '1' ? 'sRGB' : cs === 65535 || cs === '65535' ? 'Uncalibrated' : cs ? String(cs) : null)

  add('Camera',        fmtCamera(exif))
  add('Lens',          fmtLens(exif))

  const fl = fNum(exif.FocalLength)
  if (fl !== null) add('Focal length', `${Math.round(fl)} mm`)

  const fn = fNum(exif.FNumber)
  if (fn !== null) add('Aperture', `f/${fn % 1 === 0 ? fn : fn.toFixed(1)}`)

  const et = fNum(exif.ExposureTime)
  if (et !== null) add('Shutter speed', et >= 1 ? `${et} s` : `1/${Math.round(1 / et)} s`)

  const iso = exif.ISO ?? exif.ISOSpeedRatings
  if (iso) add('ISO', String(iso))

  return rows
}

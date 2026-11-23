'use client'

import React, { useCallback, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import { importMembers } from './actions'

// ── Types ────────────────────────────────────────────────────────────────────

type ParsedRow = Record<string, string>
type MappedRow = { email: string; firstName: string; lastName: string }

interface Props {
  clubSlug: string
  onClose: () => void
}

// ── CSV parser (handles quoted fields) ──────────────────────────────────────

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = splitCsvRow(lines[0])
  return lines.slice(1).map(line => {
    const cells = splitCsvRow(line)
    const row: ParsedRow = {}
    headers.forEach((h, i) => { row[h] = cells[i] ?? '' })
    return row
  })
}

function splitCsvRow(row: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < row.length; i++) {
    const ch = row[i]
    if (ch === '"') {
      if (inQuote && row[i + 1] === '"') { cur += '"'; i++ }
      else { inQuote = !inQuote }
    } else if (ch === ',' && !inQuote) {
      result.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur.trim())
  return result
}

// ── Minimal XLSX parser (shared strings + cells, no deps) ───────────────────

async function parseXlsx(file: File): Promise<ParsedRow[]> {
  const buf = await file.arrayBuffer()

  async function readEntry(name: string): Promise<string | null> {
    // Use the DecompressionStream API (modern browsers + Node 18+)
    const view = new Uint8Array(buf)
    // Find the local file header for the entry
    const enc = new TextEncoder()
    const nameBytes = enc.encode(name)
    for (let i = 0; i < view.length - nameBytes.length - 30; i++) {
      if (view[i] === 0x50 && view[i+1] === 0x4b && view[i+2] === 0x03 && view[i+3] === 0x04) {
        const fnLen  = view[i+26] | (view[i+27] << 8)
        const extLen = view[i+28] | (view[i+29] << 8)
        const fnStart = i + 30
        const match = nameBytes.every((b, j) => view[fnStart + j] === b)
        if (match && fnLen === nameBytes.length) {
          const method       = view[i+8] | (view[i+9] << 8)
          const compSize     = view[i+18] | (view[i+19] << 8) | (view[i+20] << 16) | (view[i+21] << 24)
          const dataStart    = fnStart + fnLen + extLen
          const compData     = view.slice(dataStart, dataStart + compSize)
          if (method === 0) return new TextDecoder().decode(compData)
          // deflate
          const ds = new DecompressionStream('deflate-raw')
          const writer = ds.writable.getWriter()
          writer.write(compData)
          writer.close()
          const chunks: Uint8Array[] = []
          const reader = ds.readable.getReader()
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            chunks.push(value)
          }
          const total = chunks.reduce((n, c) => n + c.length, 0)
          const out = new Uint8Array(total)
          let offset = 0
          for (const c of chunks) { out.set(c, offset); offset += c.length }
          return new TextDecoder().decode(out)
        }
      }
    }
    return null
  }

  const nsUri = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'

  const [stringsXml, sheetXml] = await Promise.all([
    readEntry('xl/sharedStrings.xml'),
    readEntry('xl/worksheets/sheet1.xml'),
  ])

  if (!sheetXml) return []

  const parser = new DOMParser()

  const strings: string[] = []
  if (stringsXml) {
    const sdoc = parser.parseFromString(stringsXml, 'text/xml')
    for (const si of Array.from(sdoc.getElementsByTagNameNS(nsUri, 'si'))) {
      const t = si.getElementsByTagNameNS(nsUri, 't')
      strings.push(Array.from(t).map(n => n.textContent ?? '').join(''))
    }
  }

  const sdoc  = parser.parseFromString(sheetXml, 'text/xml')
  const rows  = Array.from(sdoc.getElementsByTagNameNS(nsUri, 'row'))
  if (rows.length < 2) return []

  function cellVal(cell: Element): string {
    const t = cell.getAttribute('t')
    const v = cell.getElementsByTagNameNS(nsUri, 'v')[0]?.textContent ?? ''
    if (t === 's') return strings[parseInt(v)] ?? ''
    return v
  }

  const headers = Array.from(rows[0].getElementsByTagNameNS(nsUri, 'c')).map(cellVal)
  return rows.slice(1).map(row => {
    const cells = Array.from(row.getElementsByTagNameNS(nsUri, 'c')).map(cellVal)
    const obj: ParsedRow = {}
    headers.forEach((h, i) => { obj[h] = cells[i] ?? '' })
    return obj
  })
}

// ── Best-guess column matching ───────────────────────────────────────────────

function guessColumn(headers: string[], keywords: string[]): string {
  for (const kw of keywords) {
    const hit = headers.find(h => h.toLowerCase().includes(kw.toLowerCase()))
    if (hit) return hit
  }
  return ''
}

// ── Step components ──────────────────────────────────────────────────────────

function DropZone({ onFile }: { onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handle = useCallback((f: File | undefined) => {
    if (!f) return
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (ext === 'csv' || ext === 'xlsx') onFile(f)
  }, [onFile])

  return (
    <Box
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]) }}
      onClick={() => ref.current?.click()}
      sx={{
        border: '2px dashed',
        borderColor: dragging ? 'primary.main' : 'divider',
        borderRadius: 2,
        py: 6, px: 4,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        '&:hover': { borderColor: 'primary.main' },
        bgcolor: dragging ? 'rgba(30,77,140,0.04)' : 'transparent',
      }}
    >
      <input ref={ref} type="file" accept=".csv,.xlsx" hidden onChange={e => handle(e.target.files?.[0])} />
      <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#7E8EA3', margin: '0 auto 12px' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>
        Drop a file here, or click to browse
      </Typography>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
        Accepts .xlsx (Excel) or .csv
      </Typography>
    </Box>
  )
}

// ── Main modal ───────────────────────────────────────────────────────────────

export default function ImportMembersModal({ clubSlug, onClose }: Props) {
  const [step, setStep] = useState<'upload' | 'map' | 'confirm' | 'done'>('upload')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [rows, setRows]         = useState<ParsedRow[]>([])
  const [headers, setHeaders]   = useState<string[]>([])
  const [emailCol, setEmailCol] = useState('')
  const [firstCol, setFirstCol] = useState('')
  const [lastCol, setLastCol]   = useState('')

  const [result, setResult]     = useState<{ invited: number; skipped: number; errors: string[] } | null>(null)

  async function handleFile(file: File) {
    setLoading(true)
    setError(null)
    try {
      const parsed = file.name.endsWith('.csv')
        ? parseCsv(await file.text())
        : await parseXlsx(file)

      if (!parsed.length) { setError('No data rows found in this file.'); setLoading(false); return }

      const hdrs = Object.keys(parsed[0])
      setRows(parsed)
      setHeaders(hdrs)
      setEmailCol(guessColumn(hdrs, ['email', 'e-mail']))
      setFirstCol(guessColumn(hdrs, ['first name', 'firstname', 'first']))
      setLastCol(guessColumn(hdrs, ['last name', 'lastname', 'last', 'surname']))
      setStep('map')
    } catch {
      setError('Could not read the file. Please try a .csv or .xlsx export.')
    }
    setLoading(false)
  }

  function mapped(): MappedRow[] {
    return rows
      .map(r => ({
        email:     (emailCol ? r[emailCol] : '').trim(),
        firstName: (firstCol ? r[firstCol] : '').trim(),
        lastName:  (lastCol  ? r[lastCol]  : '').trim(),
      }))
      .filter(r => r.email.includes('@'))
  }

  async function handleImport() {
    setLoading(true)
    setError(null)
    const res = await importMembers(mapped())
    setLoading(false)
    if ('error' in res && res.error) { setError(String(res.error)); return }
    setResult(res)
    setStep('done')
  }

  const preview = mapped().slice(0, 4)
  const total   = mapped().length

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth
      sx={{ '& .MuiPaper-root': { borderRadius: 2.5 } }}>
      <DialogTitle sx={{ fontSize: 17, fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Import members
        <IconButton size="small" onClick={onClose}>
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>

        {/* Step dots */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 3 }}>
          {(['upload', 'map', 'confirm'] as const).map((s, i) => (
            <React.Fragment key={s}>
              <Box sx={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: step === s || (step === 'done' && i < 3) ? 'primary.main' : 'divider',
              }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: step === s || step === 'done' ? 'white' : 'text.secondary' }}>{i + 1}</Typography>
              </Box>
              {i < 2 && <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />}
            </React.Fragment>
          ))}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

        {/* ── Step 1: Upload ── */}
        {step === 'upload' && (
          <Box>
            {loading
              ? <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>
              : <DropZone onFile={handleFile} />
            }
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 2 }}>
              Export your current member list from Visual Pursuits (or any other system) as .xlsx or .csv, then upload it here.
            </Typography>
          </Box>
        )}

        {/* ── Step 2: Map columns ── */}
        {step === 'map' && (
          <Box>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 2.5 }}>
              {rows.length} rows detected. Map the columns below.
            </Typography>
            <Stack spacing={2}>
              {([
                { label: 'Email *',     value: emailCol, set: setEmailCol, required: true },
                { label: 'First name',  value: firstCol, set: setFirstCol, required: false },
                { label: 'Last name',   value: lastCol,  set: setLastCol,  required: false },
              ] as const).map(({ label, value, set }) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', width: 100, flexShrink: 0 }}>{label}</Typography>
                  <Select
                    size="small"
                    value={value}
                    onChange={e => (set as (v: string) => void)(e.target.value)}
                    displayEmpty
                    sx={{ flex: 1, fontSize: 13, fontFamily: 'inherit' }}
                  >
                    <MenuItem value="" sx={{ fontSize: 13, color: 'text.secondary', fontStyle: 'italic' }}>— not mapped —</MenuItem>
                    {headers.map(h => (
                      <MenuItem key={h} value={h} sx={{ fontSize: 13 }}>{h}</MenuItem>
                    ))}
                  </Select>
                </Box>
              ))}
            </Stack>

            {/* Preview */}
            {preview.length > 0 && (
              <Box sx={{ mt: 3, p: '12px 14px', bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1.5 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 1 }}>Preview</Typography>
                {preview.map((r, i) => (
                  <Typography key={i} sx={{ fontSize: 12, color: 'text.primary', lineHeight: 1.8 }}>
                    {[r.firstName, r.lastName].filter(Boolean).join(' ') || '—'} · {r.email || '—'}
                  </Typography>
                ))}
                {total > 4 && <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>…and {total - 4} more</Typography>}
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
              <Button variant="outlined" color="secondary" size="small" onClick={() => setStep('upload')}>Back</Button>
              <Button variant="contained" size="small" disabled={!emailCol || total === 0}
                onClick={() => setStep('confirm')}>
                Continue
              </Button>
            </Box>
          </Box>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === 'confirm' && (
          <Box>
            <Box sx={{ p: '16px 18px', bgcolor: 'rgba(30,77,140,0.05)', border: '1px solid rgba(30,77,140,0.15)', borderRadius: 2, mb: 2.5 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'primary.main', mb: 0.5 }}>
                An invite email will be sent to {total} {total === 1 ? 'person' : 'people'}
              </Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                Each person will receive a welcome email inviting them to join {clubSlug && <strong>your club</strong>} on Focal Point. They'll click a link to confirm their account and set a password.
              </Typography>
            </Box>

            <Typography sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 1 }}>
              Inviting
            </Typography>
            <Stack spacing={0.5} sx={{ mb: 3 }}>
              {preview.map((r, i) => (
                <Typography key={i} sx={{ fontSize: 13, color: 'text.primary' }}>
                  {[r.firstName, r.lastName].filter(Boolean).join(' ') || r.email} <span style={{ color: '#7E8EA3' }}>— {r.email}</span>
                </Typography>
              ))}
              {total > 4 && <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>…and {total - 4} more</Typography>}
            </Stack>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button variant="outlined" color="secondary" size="small" onClick={() => setStep('map')} disabled={loading}>Back</Button>
              <Button variant="contained" size="small" disabled={loading} onClick={handleImport}
                startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}>
                {loading ? 'Sending invites…' : `Send ${total} invite${total !== 1 ? 's' : ''}`}
              </Button>
            </Box>
          </Box>
        )}

        {/* ── Done ── */}
        {step === 'done' && result && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(46,125,50,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
              <svg width="24" height="24" fill="none" stroke="#2E7D32" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: 'text.primary', mb: 0.75 }}>
              Invites sent
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2 }}>
              {result.invited} invite{result.invited !== 1 ? 's' : ''} sent successfully
              {result.skipped > 0 ? `, ${result.skipped} already had an account` : ''}.
            </Typography>
            {result.errors.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2, fontSize: 12, textAlign: 'left' }}>
                {result.errors.length} failed: {result.errors.slice(0, 3).join('; ')}
              </Alert>
            )}
            <Button variant="contained" onClick={onClose}>Done</Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

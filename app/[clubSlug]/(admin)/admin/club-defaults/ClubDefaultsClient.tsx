'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormHelperText,
  FormLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import WarningAmberIcon    from '@mui/icons-material/WarningAmber'
import CheckCircleIcon     from '@mui/icons-material/CheckCircle'
import FileUploadIcon      from '@mui/icons-material/FileUpload'
import OpenInNewIcon       from '@mui/icons-material/OpenInNew'
import EditIcon            from '@mui/icons-material/Edit'
import DeleteOutlineIcon   from '@mui/icons-material/DeleteForever'
import FormatBoldIcon         from '@mui/icons-material/FormatBold'
import FormatItalicIcon       from '@mui/icons-material/FormatItalic'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import HorizontalRuleIcon     from '@mui/icons-material/HorizontalRule'
import { TrashBtn } from '@/components/ui/TrashBtn'
import { useUnsavedChanges } from '@/components/admin/UnsavedChangesProvider'
import { createClient } from '@/lib/supabase/client'
import {
  saveClubSettings,
  addMeetingLocation,
  updateMeetingLocation,
  deleteMeetingLocation,
  acceptDefaultTerms,
  saveTermsContent,
  uploadTermsFile,
  removeTermsFile,
} from './actions'

// ─── Types ────────────────────────────────────────────────────────────────────

type Settings = {
  club_name: string
  club_short_name: string
  club_location: string
  contact_email: string
  from_email: string
  timezone: string
  logo_path: string | null
  season_start_month: number
  season_end_month: number
  member_directory_visibility: string
  membership_terms_source: 'default' | 'custom'
  membership_terms_reviewed: boolean
  membership_terms_updated_at: string | null
  membership_terms_content: string | null
  membership_terms_file_path: string | null
  membership_terms_file_name: string | null
}

type Location = { id: string; name: string; address: string | null }

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const TIMEZONES = [
  'America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
  'America/Anchorage','Pacific/Honolulu','America/Halifax','America/Sao_Paulo',
  'Atlantic/Azores','Europe/London','Europe/Dublin','Europe/Lisbon',
  'Europe/Paris','Europe/Berlin','Europe/Rome','Europe/Amsterdam',
  'Europe/Madrid','Europe/Brussels','Europe/Zurich','Europe/Stockholm',
  'Europe/Oslo','Europe/Helsinki','Europe/Athens','Europe/Bucharest',
  'Europe/Istanbul','Africa/Cairo','Africa/Johannesburg','Asia/Dubai',
  'Asia/Karachi','Asia/Kolkata','Asia/Bangkok','Asia/Singapore',
  'Asia/Hong_Kong','Asia/Tokyo','Asia/Seoul','Australia/Perth',
  'Australia/Adelaide','Australia/Sydney','Pacific/Auckland',
]

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 17, fontWeight: 600, color: 'text.primary', mb: 1.5, mt: '20px' }}>
      {children}
    </Typography>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Box sx={{ width: 480, flexShrink: 0 }}>
        <FormLabel sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', display: 'block', mb: 0.75 }}>{label}</FormLabel>
        {children}
      </Box>
      {hint && (
        <FormHelperText sx={{ flex: 1, mx: 0, lineHeight: 1.5, color: 'text.disabled', maxWidth: 380 }}>
          {hint}
        </FormHelperText>
      )}
    </Box>
  )
}



// ─── Membership Terms section ─────────────────────────────────────────────────

function MembershipTermsSection({ settings, onUpdate }: {
  settings: Pick<Settings,
    'membership_terms_source' | 'membership_terms_reviewed' |
    'membership_terms_updated_at' | 'membership_terms_content' |
    'membership_terms_file_path' | 'membership_terms_file_name'>
  onUpdate: (patch: Partial<Settings>) => void
}) {
  const [pending, startTransition] = useTransition()
  const [err, setErr]     = useState<string | null>(null)
  const [msg, setMsg]     = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState(false)
  const uploadRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // ── Set editor content when dialog opens ──────────────────────────────────
  useEffect(() => {
    if (editOpen && editorRef.current) {
      editorRef.current.innerHTML = settings.membership_terms_content ?? ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOpen])

  function flash(message: string) {
    setMsg(message)
    setTimeout(() => setMsg(null), 3000)
  }

  // ── Accept default template ───────────────────────────────────────────────
  function handleAccept() {
    setErr(null)
    startTransition(async () => {
      const r = await acceptDefaultTerms()
      if (r.error) { setErr(r.error); return }
      onUpdate({ membership_terms_reviewed: true, membership_terms_updated_at: new Date().toISOString() })
      flash('Default template accepted.')
    })
  }

  // ── Save edited template ──────────────────────────────────────────────────
  function handleSaveEdit() {
    const html = editorRef.current?.innerHTML ?? ''
    setErr(null)
    startTransition(async () => {
      const r = await saveTermsContent(html)
      if (r.error) { setErr(r.error); return }
      onUpdate({
        membership_terms_content:    html,
        membership_terms_reviewed:   true,
        membership_terms_updated_at: new Date().toISOString(),
      })
      setEditOpen(false)
      flash('Template saved.')
    })
  }

  // ── Upload custom file ────────────────────────────────────────────────────
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErr(null)
    const fd = new FormData()
    fd.set('file', file)
    startTransition(async () => {
      const r = await uploadTermsFile(fd)
      if (r.error) { setErr(r.error); return }
      onUpdate({
        membership_terms_source:     'custom',
        membership_terms_file_path:  r.filePath ?? null,
        membership_terms_file_name:  r.fileName ?? null,
        membership_terms_reviewed:   true,
        membership_terms_updated_at: new Date().toISOString(),
      })
      flash('Custom terms uploaded.')
    })
    e.target.value = ''
  }

  // ── Remove custom file ────────────────────────────────────────────────────
  function handleRemove() {
    setErr(null)
    startTransition(async () => {
      const r = await removeTermsFile()
      if (r.error) { setErr(r.error); return }
      onUpdate({
        membership_terms_source:    'default',
        membership_terms_file_path: null,
        membership_terms_file_name: null,
        membership_terms_reviewed:  false,
        membership_terms_updated_at: new Date().toISOString(),
      })
      setRemoveConfirm(false)
      flash('Custom document removed. Default template is now active.')
    })
  }

  // ── Mini editor toolbar ──────────────────────────────────────────────────
  function execEdit(cmd: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value ?? undefined)
  }

  const { membership_terms_source: src, membership_terms_reviewed: reviewed,
          membership_terms_updated_at: updatedAt,
          membership_terms_file_name: fileName } = settings

  const lastUpdated = updatedAt
    ? new Date(updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const miniToolbarBtnSx = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: '4px', border: 'none',
    bgcolor: 'transparent', cursor: 'pointer', color: 'text.secondary', flexShrink: 0,
    '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
  } as const

  return (
    <>
      <Paper variant="outlined" sx={{ mb: 6, px: 3, py: '20px' }}>

        {/* State 1 — Default template, not yet reviewed */}
        {src === 'default' && !reviewed && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{
              display: 'flex', gap: 1.5, p: 2,
              bgcolor: 'warning.light', border: '1px solid',
              borderColor: 'warning.main', borderRadius: 1,
              alignItems: 'flex-start',
            }}>
              <WarningAmberIcon sx={{ fontSize: 18, color: 'warning.dark', mt: '1px', flexShrink: 0 }} />
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'warning.dark', lineHeight: 1.4 }}>
                  You are using the Focal Point default template
                </Typography>
                <Typography sx={{ fontSize: 13, color: 'warning.dark', mt: 0.5, lineHeight: 1.5 }}>
                  Review and update these terms before accepting member applications to ensure they reflect your club&apos;s specific rules.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Button
                variant="outlined" color="secondary" size="small"
                startIcon={<OpenInNewIcon sx={{ fontSize: '14px !important' }} />}
                href="/terms" target="_blank" rel="noopener"
                component="a"
              >
                View default template
              </Button>
              <Button
                variant="outlined" color="secondary" size="small"
                startIcon={<EditIcon sx={{ fontSize: '14px !important' }} />}
                onClick={() => setEditOpen(true)}
              >
                Edit template
              </Button>
              <Tooltip title="Upload PDF or DOCX to replace the default template">
                <Button
                  variant="outlined" color="secondary" size="small"
                  startIcon={<FileUploadIcon sx={{ fontSize: '14px !important' }} />}
                  onClick={() => uploadRef.current?.click()}
                  disabled={pending}
                >
                  Replace with my own
                </Button>
              </Tooltip>
              <Button
                variant="text" color="secondary" size="small"
                onClick={handleAccept}
                disabled={pending}
              >
                Accept default as-is
              </Button>
            </Box>
          </Box>
        )}

        {/* State 2 — Default template, reviewed/accepted */}
        {src === 'default' && reviewed && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary' }}>
                Focal Point default template
                {lastUpdated && (
                  <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary', ml: 1 }}>
                    · Last updated {lastUpdated}
                  </Typography>
                )}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Button
                variant="outlined" color="secondary" size="small"
                startIcon={<OpenInNewIcon sx={{ fontSize: '14px !important' }} />}
                href="/terms" target="_blank" rel="noopener"
                component="a"
              >
                View
              </Button>
              <Button
                variant="outlined" color="secondary" size="small"
                startIcon={<EditIcon sx={{ fontSize: '14px !important' }} />}
                onClick={() => setEditOpen(true)}
              >
                Edit
              </Button>
              <Tooltip title="Upload PDF or DOCX to replace the default template">
                <Button
                  variant="outlined" color="secondary" size="small"
                  startIcon={<FileUploadIcon sx={{ fontSize: '14px !important' }} />}
                  onClick={() => uploadRef.current?.click()}
                  disabled={pending}
                >
                  Replace with my own
                </Button>
              </Tooltip>
            </Box>
          </Box>
        )}

        {/* State 3 — Custom document uploaded */}
        {src === 'custom' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                label={fileName ?? 'Custom document'}
                size="small"
                sx={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
              />
              {lastUpdated && (
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  Uploaded {lastUpdated}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {settings.membership_terms_file_path && (
                <Button
                  variant="outlined" color="secondary" size="small"
                  startIcon={<OpenInNewIcon sx={{ fontSize: '14px !important' }} />}
                  href={settings.membership_terms_file_path} target="_blank" rel="noopener"
                  component="a"
                >
                  View
                </Button>
              )}
              <Tooltip title="Upload a new PDF or DOCX to replace the current document">
                <Button
                  variant="outlined" color="secondary" size="small"
                  startIcon={<FileUploadIcon sx={{ fontSize: '14px !important' }} />}
                  onClick={() => uploadRef.current?.click()}
                  disabled={pending}
                >
                  Replace
                </Button>
              </Tooltip>
              <Button
                variant="outlined" color="error" size="small"
                startIcon={<DeleteOutlineIcon sx={{ fontSize: '14px !important' }} />}
                onClick={() => setRemoveConfirm(true)}
                disabled={pending}
              >
                Remove
              </Button>
            </Box>
          </Box>
        )}

        {/* Feedback */}
        {err && <Alert severity="error" sx={{ mt: 2, py: 0.5 }}>{err}</Alert>}
        {msg && <Alert severity="success" sx={{ mt: 2, py: 0.5 }}>{msg}</Alert>}

      </Paper>

      {/* Hidden file input */}
      <input
        ref={uploadRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style={{ display: 'none' }}
        onChange={handleUpload}
      />

      {/* Edit template dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>
          Edit membership terms template
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important', pb: 1 }}>

          {/* Mini toolbar */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0.25, flexWrap: 'wrap',
            mb: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider',
          }}>
            {[
              { title: 'Bold',      cmd: 'bold',            icon: <FormatBoldIcon sx={{ fontSize: 16 }} /> },
              { title: 'Italic',    cmd: 'italic',          icon: <FormatItalicIcon sx={{ fontSize: 16 }} /> },
              { title: 'Heading 2', cmd: 'formatBlock', val: 'h2', icon: <Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1 }}>H2</Typography> },
              { title: 'Heading 3', cmd: 'formatBlock', val: 'h3', icon: <Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1 }}>H3</Typography> },
              { title: 'Paragraph', cmd: 'formatBlock', val: 'p',  icon: <Typography sx={{ fontSize: 12, lineHeight: 1 }}>¶</Typography> },
              { title: 'Bullet list', cmd: 'insertUnorderedList', icon: <FormatListBulletedIcon sx={{ fontSize: 16 }} /> },
              { title: 'Horizontal rule', cmd: 'insertHTML', val: '<hr/>', icon: <HorizontalRuleIcon sx={{ fontSize: 16 }} /> },
            ].map(({ title, cmd, val, icon }) => (
              <Tooltip key={title} title={title} placement="top">
                <Box
                  component="button"
                  onMouseDown={e => { e.preventDefault(); execEdit(cmd, val) }}
                  sx={miniToolbarBtnSx}
                >
                  {icon}
                </Box>
              </Tooltip>
            ))}
          </Box>

          {/* Content editable area */}
          <Box
            ref={editorRef}
            component="div"
            contentEditable
            suppressContentEditableWarning
            sx={{
              minHeight: 420,
              maxHeight: 520,
              overflow: 'auto',
              outline: 'none',
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              fontSize: 14,
              lineHeight: 1.7,
              fontFamily: 'inherit',
              '& h2': { fontSize: 18, fontWeight: 600, mt: '1em', mb: '0.4em' },
              '& h3': { fontSize: 15, fontWeight: 600, mt: '1em', mb: '0.3em' },
              '& p':  { mb: '0.75em' },
              '& ul': { pl: '1.5em', mb: '0.75em', listStyleType: 'disc' },
              '& li': { mb: '0.25em' },
              '& hr': { border: 'none', borderTop: '1px solid', borderColor: 'divider', my: 2 },
            }}
          />

          <Typography sx={{ mt: 1, fontSize: 12, color: 'text.secondary' }}>
            Tokens replaced at render time: <code>{'[[Club Name]]'}</code>{', '}
            <code>{'[[Club Location]]'}</code>{', '}
            <code>{'[[Club Contact Email]]'}</code>{', '}
            <code>{'[[Current Year]]'}'</code>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" color="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={pending} onClick={handleSaveEdit}>
            {pending ? 'Saving…' : 'Save template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove confirmation dialog */}
      <Dialog open={removeConfirm} onClose={() => setRemoveConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>Remove custom document?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
            Your uploaded document will be removed and the Focal Point default template will become active again. You will be prompted to review it.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" color="secondary" onClick={() => setRemoveConfirm(false)}>Cancel</Button>
          <Button variant="contained" color="error" disabled={pending} onClick={handleRemove}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// ─── Logo upload ──────────────────────────────────────────────────────────────

function LogoUpload({ current, onUploaded }: { current: string | null; onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const ref = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setErr(null)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `logo/club-logo.${ext}`
    const { error: upErr } = await supabase.storage.from('club-assets').upload(path, file, { upsert: true })
    if (upErr) { setErr(upErr.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('club-assets').getPublicUrl(path)
    await supabase.from('club_settings').update({ logo_path: publicUrl })
      .neq('id', '00000000-0000-0000-0000-000000000000')
    onUploaded(publicUrl)
    setUploading(false)
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {current && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current} alt="Club logo" style={{ height: 44, objectFit: 'contain', borderRadius: 4, border: '1px solid var(--border-default)' }} />
      )}
      <Button variant="outlined" color="secondary" size="small" disabled={uploading} onClick={() => ref.current?.click()}>
        {uploading ? 'Uploading…' : current ? 'Replace logo' : 'Upload logo'}
      </Button>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={handleFile} />
      {err && <Typography variant="caption" color="error">{err}</Typography>}
    </Box>
  )
}

// ─── Address autocomplete + map ──────────────────────────────────────────────

type PhotonFeature = {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string; street?: string; housenumber?: string
    city?: string; state?: string; country?: string
  }
}

function photonLabel(f: PhotonFeature): string {
  const p = f.properties
  const line1 = p.housenumber && p.street
    ? `${p.housenumber} ${p.street}`
    : (p.street ?? p.name)
  return [line1, p.city, p.state, p.country].filter(Boolean).join(', ')
}

type AddressOption = { label: string; lat: number; lon: number }

function AddressField({
  value, onChange, onSelect, disabled,
}: {
  value: string
  onChange: (v: string) => void
  onSelect: (address: string, lat: number, lon: number) => void
  disabled?: boolean
}) {
  const [options, setOptions] = useState<AddressOption[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (value.length < 3) { setOptions([]); return }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&limit=6&lang=en`,
        )
        const json = await res.json()
        const features: PhotonFeature[] = json.features ?? []
        setOptions(features.map(f => ({
          label: photonLabel(f),
          lon:   f.geometry.coordinates[0],
          lat:   f.geometry.coordinates[1],
        })))
      } catch { setOptions([]) }
      finally  { setLoading(false) }
    }, 380)
    return () => clearTimeout(timerRef.current)
  }, [value])

  return (
    <Autocomplete
      freeSolo
      options={options}
      filterOptions={x => x}
      inputValue={value}
      onInputChange={(_e, v, reason) => { if (reason !== 'reset') onChange(v) }}
      onChange={(_e, val) => {
        if (val && typeof val !== 'string') onSelect(val.label, val.lat, val.lon)
      }}
      loading={loading}
      disabled={disabled}
      size="small"
      fullWidth
      renderInput={params => (
        <TextField {...params} placeholder="Address (optional)" />
      )}
    />
  )
}

function MapEmbed({ lat, lon }: { lat: number; lon: number }) {
  const d    = 0.008
  const bbox = `${lon - d},${lat - d},${lon + d},${lat + d}`
  const src  = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`
  return (
    <Box sx={{ mt: 1.5, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', lineHeight: 0 }}>
      <iframe src={src} width="100%" height="200" style={{ display: 'block', border: 'none' }} title="Map preview" loading="lazy" />
    </Box>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ClubDefaultsClient({
  settings: initial,
  locations: initialLocations,
}: {
  settings: Settings
  locations: Location[]
}) {
  // ── Club settings form ───────────────────────────────────────────────────
  const [s, setS] = useState(initial)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [savePending, startSave] = useTransition()
  const { isDirty, markDirty, markClean, registerSave } = useUnsavedChanges()

  // Keep a current ref so the modal's save callback never goes stale
  const handleSaveRef = useRef<() => void>(() => {})

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS(prev => ({ ...prev, [key]: value }))
    setSaveStatus('idle')
    markDirty()
  }

  function handleSave() {
    startSave(async () => {
      const result = await saveClubSettings({
        club_name:                   s.club_name,
        club_short_name:             s.club_short_name,
        club_location:               s.club_location,
        contact_email:               s.contact_email,
        from_email:                  s.from_email,
        timezone:                    s.timezone,
        season_start_month:          s.season_start_month,
        season_end_month:            s.season_end_month,
        member_directory_visibility: s.member_directory_visibility,
      })
      setSaveStatus(result.error ? 'error' : 'saved')
      if (!result.error) markClean()
    })
  }

  // Update ref every render so modal always calls the latest handleSave
  handleSaveRef.current = handleSave
  useEffect(() => { registerSave(() => handleSaveRef.current()) }, [registerSave])

  // ── Membership terms local state (updated by MembershipTermsSection) ────
  const [termsState, setTermsState] = useState({
    membership_terms_source:     initial.membership_terms_source,
    membership_terms_reviewed:   initial.membership_terms_reviewed,
    membership_terms_updated_at: initial.membership_terms_updated_at,
    membership_terms_content:    initial.membership_terms_content,
    membership_terms_file_path:  initial.membership_terms_file_path,
    membership_terms_file_name:  initial.membership_terms_file_name,
  })

  // ── Meeting locations ────────────────────────────────────────────────────
  const [locations, setLocations] = useState(initialLocations)
  const [locAdding, setLocAdding] = useState(false)
  const [newLocName, setNewLocName] = useState('')
  const [newLocAddress, setNewLocAddress] = useState('')
  const [newLocCoords, setNewLocCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editCoords, setEditCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [locPending, startLoc] = useTransition()

  function handleAddLocation() {
    const name = newLocName.trim()
    if (!name) return
    const address = newLocAddress.trim() || null
    startLoc(async () => {
      const r = await addMeetingLocation(name, address)
      if (!r.error && r.id) {
        setLocations(p => [...p, { id: r.id!, name, address }])
        setNewLocName('')
        setNewLocAddress('')
        setNewLocCoords(null)
        setLocAdding(false)
      }
    })
  }

  function handleCancelAddLocation() {
    setNewLocName('')
    setNewLocAddress('')
    setNewLocCoords(null)
    setLocAdding(false)
  }

  function handleStartEdit(loc: { id: string; name: string; address: string | null }) {
    setEditingId(loc.id)
    setEditName(loc.name)
    setEditAddress(loc.address ?? '')
    setEditCoords(null)
  }

  function handleCancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditAddress('')
    setEditCoords(null)
  }

  function handleSaveEdit(id: string) {
    const name = editName.trim()
    if (!name) return
    const address = editAddress.trim() || null
    startLoc(async () => {
      const r = await updateMeetingLocation(id, name, address)
      if (!r.error) {
        setLocations(p => p.map(l => l.id === id ? { ...l, name, address } : l))
        handleCancelEdit()
      }
    })
  }

  function handleDeleteLocation(id: string) {
    startLoc(async () => {
      await deleteMeetingLocation(id)
      setLocations(p => p.filter(l => l.id !== id))
    })
  }

  const tf = { size: 'small' as const, fullWidth: true }

  return (
    <Box sx={{ pb: '80px' }}>

      {/* ── Club Identity ────────────────────────────────────────────────── */}
      <SectionTitle>Club identity</SectionTitle>
      <Paper variant="outlined" sx={{ mb: 6, px: 3, py: '20px' }}>

        <Field label="Club name" hint="The full official name of your club.">
          <TextField {...tf} value={s.club_name} onChange={e => set('club_name', e.target.value)} placeholder="My Photo Club" />
        </Field>
        <Divider sx={{ my: '20px' }} />

        <Field label="Club short name" hint="An abbreviation or acronym used in compact displays.">
          <TextField {...tf} value={s.club_short_name} onChange={e => set('club_short_name', e.target.value)} placeholder="MPC" />
        </Field>
        <Divider sx={{ my: '20px' }} />

        <Field label="Club location" hint="Optional. City or region your club is based in.">
          <TextField {...tf} value={s.club_location} onChange={e => set('club_location', e.target.value)} placeholder="City, State" />
        </Field>
        <Divider sx={{ my: '20px' }} />

        <Field label="Contact email" hint="Public contact address used in membership terms and member communications.">
          <TextField {...tf} type="email" value={s.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="info@yourclub.org" />
        </Field>
        <Divider sx={{ my: '20px' }} />

        <Field label="Notifications from address" hint="The From: address used when sending bulk emails and judge invitations.">
          <TextField
            {...tf}
            value={s.from_email?.includes('@') ? s.from_email.split('@')[0] : (s.from_email ?? '')}
            onChange={e => set('from_email', e.target.value ? `${e.target.value}@${process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'focalpointhq.com'}` : '')}
            placeholder="hello"
            slotProps={{ input: { endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: 13, color: 'text.disabled', userSelect: 'none' }}>@{process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'focalpointhq.com'}</Typography></InputAdornment> } }}
          />
        </Field>
        <Divider sx={{ my: '20px' }} />

        <Field label="Timezone" hint="Used for competition deadlines and scheduling.">
          <Select {...tf} value={s.timezone} onChange={e => set('timezone', e.target.value)} sx={{ fontSize: 14 }}>
            {TIMEZONES.map(tz => <MenuItem key={tz} value={tz} sx={{ fontSize: 14 }}>{tz}</MenuItem>)}
          </Select>
        </Field>
        <Divider sx={{ my: '20px' }} />

        <Field label="Club logo" hint="Displayed on the member site and in communications.">
          <LogoUpload current={s.logo_path} onUploaded={url => set('logo_path', url)} />
        </Field>
        <Divider sx={{ my: '20px' }} />

        <Field label="Competition season" hint={`Season runs ${MONTHS[s.season_start_month - 1]} through ${MONTHS[s.season_end_month - 1]}.`}>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.5 }}>Start month</Typography>
              <Select size="small" fullWidth value={s.season_start_month} onChange={e => set('season_start_month', Number(e.target.value))} sx={{ fontSize: 14 }}>
                {MONTHS.map((m, i) => <MenuItem key={i} value={i + 1} sx={{ fontSize: 14 }}>{m}</MenuItem>)}
              </Select>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.5 }}>End month</Typography>
              <Select size="small" fullWidth value={s.season_end_month} onChange={e => set('season_end_month', Number(e.target.value))} sx={{ fontSize: 14 }}>
                {MONTHS.map((m, i) => <MenuItem key={i} value={i + 1} sx={{ fontSize: 14 }}>{m}</MenuItem>)}
              </Select>
            </Box>
          </Stack>
        </Field>

      </Paper>

      {/* ── Meeting Locations ─────────────────────────────────────────────── */}
      <SectionTitle>Meeting locations</SectionTitle>
      <Paper variant="outlined" sx={{ mb: 6, px: 3, py: 2.5 }}>

        <FormHelperText sx={{ mx: 0, mb: 2, lineHeight: 1.5, color: 'text.disabled' }}>
          Define the venues where your club meets. These can be referenced when scheduling events and competitions.
        </FormHelperText>

        {locations.length > 0 && (
          <Box>
            {locations.map((loc, i) => (
              <Box key={loc.id}>
                {i > 0 && <Divider sx={{ my: '20px' }} />}
                {editingId === loc.id ? (
                  /* ── Inline edit mode ── */
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 480 }}>
                    <TextField
                      size="small" fullWidth placeholder="Location name" autoFocus
                      value={editName} onChange={e => setEditName(e.target.value)}
                      disabled={locPending}
                    />
                    <AddressField
                      value={editAddress}
                      onChange={v => { setEditAddress(v); setEditCoords(null) }}
                      onSelect={(addr, lat, lon) => { setEditAddress(addr); setEditCoords({ lat, lon }) }}
                      disabled={locPending}
                    />
                    {editCoords && <MapEmbed lat={editCoords.lat} lon={editCoords.lon} />}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="contained" size="small"
                        disabled={!editName.trim() || locPending} onClick={() => handleSaveEdit(loc.id)}>
                        Save
                      </Button>
                      <Button variant="outlined" color="secondary" size="small"
                        disabled={locPending} onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  /* ── Display mode ── */
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{loc.name}</Typography>
                      {loc.address && (
                        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.25 }}>
                          {loc.address}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit">
                        <Box component="span">
                          <Button
                            size="small" variant="text" color="secondary"
                            onClick={() => handleStartEdit(loc)}
                            disabled={locPending || editingId !== null}
                            sx={{ minWidth: 0, p: 0.75 }}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </Button>
                        </Box>
                      </Tooltip>
                      <TrashBtn onClick={() => handleDeleteLocation(loc.id)} disabled={locPending || editingId !== null} />
                    </Box>
                  </Box>
                )}
              </Box>
            ))}
            <Divider sx={{ my: '20px' }} />
          </Box>
        )}

        {locAdding ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 480 }}>
            <TextField
              size="small" fullWidth placeholder="Location name" autoFocus
              value={newLocName} onChange={e => setNewLocName(e.target.value)}
              disabled={locPending}
            />
            <AddressField
              value={newLocAddress}
              onChange={v => { setNewLocAddress(v); setNewLocCoords(null) }}
              onSelect={(addr, lat, lon) => { setNewLocAddress(addr); setNewLocCoords({ lat, lon }) }}
              disabled={locPending}
            />
            {newLocCoords && <MapEmbed lat={newLocCoords.lat} lon={newLocCoords.lon} />}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" size="small"
                disabled={!newLocName.trim() || locPending} onClick={handleAddLocation}>
                Save
              </Button>
              <Button variant="outlined" color="secondary" size="small"
                disabled={locPending} onClick={handleCancelAddLocation}>
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Button variant="outlined" color="secondary" size="small"
            onClick={() => setLocAdding(true)} disabled={editingId !== null}>
            Add location
          </Button>
        )}

      </Paper>

      {/* ── Our Club ─────────────────────────────────────────────────────── */}
      <SectionTitle>Our Club</SectionTitle>
      <Paper variant="outlined" sx={{ mb: 6, px: 3, py: '20px' }}>

        <Field
          label="Member directory visibility"
          hint="Controls who can see the Members page under Our Club."
        >
          <Select
            {...tf}
            value={s.member_directory_visibility}
            onChange={e => set('member_directory_visibility', e.target.value)}
            sx={{ fontSize: 14 }}
          >
            <MenuItem value="members" sx={{ fontSize: 14 }}>Visible to all active members</MenuItem>
            <MenuItem value="admin_only" sx={{ fontSize: 14 }}>Hidden (admin only)</MenuItem>
          </Select>
        </Field>

      </Paper>

      {/* ── Membership Terms ─────────────────────────────────────────────── */}
      <SectionTitle>Membership terms &amp; conditions</SectionTitle>
      <MembershipTermsSection
        settings={termsState}
        onUpdate={patch => setTermsState(prev => ({ ...prev, ...patch }))}
      />

      {/* ── Save ─────────────────────────────────────────────────────────── */}
      <Box sx={{
        position: 'fixed',
        bottom: 0,
        left: 224,
        right: 0,
        px: 8,
        py: 2,
        bgcolor: 'background.default',
        borderTop: '1px solid',
        borderColor: 'divider',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}>
        <Box sx={{ mx: 'auto', width: '100%', maxWidth: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Button variant="contained" size="small" disabled={savePending || !isDirty} onClick={handleSave} sx={{ fontSize: '18px' }}>
            {savePending ? 'Saving…' : 'Save changes'}
          </Button>
          {saveStatus === 'saved' && <Alert severity="success" sx={{ py: 0, px: 1.5 }}>Settings saved</Alert>}
          {saveStatus === 'error'  && <Alert severity="error"   sx={{ py: 0, px: 1.5 }}>Save failed — please try again</Alert>}
        </Box>
      </Box>

    </Box>
  )
}

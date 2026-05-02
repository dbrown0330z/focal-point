'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import {
  Alert,
  Box,
  Button,
  Divider,
  FormHelperText,
  FormLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { TrashBtn } from '@/components/ui/TrashBtn'
import { useUnsavedChanges } from '@/components/admin/UnsavedChangesProvider'
import { createClient } from '@/lib/supabase/client'
import {
  saveClubSettings,
  addMeetingLocation,
  deleteMeetingLocation,
} from './actions'

// ─── Types ────────────────────────────────────────────────────────────────────

type Settings = {
  club_name: string
  club_short_name: string
  club_location: string
  timezone: string
  logo_path: string | null
  season_start_month: number
  season_end_month: number
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
    <Typography sx={{ fontSize: 17, fontWeight: 600, color: 'text.primary', mb: 1.5, mt: '15px' }}>
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
        club_name:          s.club_name,
        club_short_name:    s.club_short_name,
        club_location:      s.club_location,
        timezone:           s.timezone,
        season_start_month: s.season_start_month,
        season_end_month:   s.season_end_month,
      })
      setSaveStatus(result.error ? 'error' : 'saved')
      if (!result.error) markClean()
    })
  }

  // Update ref every render so modal always calls the latest handleSave
  handleSaveRef.current = handleSave
  useEffect(() => { registerSave(() => handleSaveRef.current()) }, [registerSave])

  // ── Meeting locations ────────────────────────────────────────────────────
  const [locations, setLocations] = useState(initialLocations)
  const [locAdding, setLocAdding] = useState(false)
  const [newLocName, setNewLocName] = useState('')
  const [newLocAddress, setNewLocAddress] = useState('')
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
        setLocAdding(false)
      }
    })
  }

  function handleCancelAddLocation() {
    setNewLocName('')
    setNewLocAddress('')
    setLocAdding(false)
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
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{loc.name}</Typography>
                    {loc.address && (
                      <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.25 }}>
                        {loc.address}
                      </Typography>
                    )}
                  </Box>
                  <TrashBtn onClick={() => handleDeleteLocation(loc.id)} disabled={locPending} />
                </Box>
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
            <TextField
              size="small" fullWidth placeholder="Address (optional)"
              value={newLocAddress} onChange={e => setNewLocAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
              disabled={locPending}
            />
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
          <Button variant="outlined" color="secondary" size="small" onClick={() => setLocAdding(true)}>
            Add location
          </Button>
        )}

      </Paper>

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

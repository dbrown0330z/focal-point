'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Drawer from '@mui/material/Drawer'
import Dialog from '@mui/material/Dialog'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Switch from '@mui/material/Switch'
import Slider from '@mui/material/Slider'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import type { ProfileData, HistoryEntry } from './page'
import { updateProfile, updatePassword, updateAvatarUrl } from './actions'
import { createClient } from '@/lib/supabase/client'
import { SHOOTING_INTERESTS, CAMERA_BRANDS, EXPERIENCE_LEVELS, skillLabel, skillFull } from '@/lib/profile-options'
import { formatPhone } from '@/lib/format-phone'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtSince(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

// ─── Initials avatar helpers ──────────────────────────────────────────────────

// Uses design token CSS variables — resolves to spot/action colors at render time
const AVATAR_PALETTE = [
  'var(--action-primary)',
  'var(--spot-teal)',
  'var(--spot-purple)',
  'var(--spot-green)',
  'var(--spot-pink)',
  'var(--spot-orange)',
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function getAvatarBg(name: string): string {
  let hash = 0
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

function AvatarOrInitials({
  avatarUrl, name, size, fontSize,
}: { avatarUrl: string | null; name: string; size: number; fontSize: number }) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-default)', display: 'block' }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: getAvatarBg(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '2px solid var(--border-default)',
      flexShrink: 0,
      userSelect: 'none',
    }}>
      <span style={{ fontSize, fontWeight: 600, color: 'white', lineHeight: 1, letterSpacing: '0.02em' }}>
        {getInitials(name)}
      </span>
    </div>
  )
}

// ─── Award tag styles — uses design tokens ────────────────────────────────────

function getAwardStyle(label: string | null): { bg: string; color: string } | null {
  if (!label) return null
  const l = label.toLowerCase()
  if (l.includes('first') || l.includes('gold') || l.includes('1st') || l.includes('best'))
    return {
      bg:    'color-mix(in srgb, var(--spot-gold) 18%, transparent)',
      color: 'var(--spot-gold)',
    }
  if (l.includes('second') || l.includes('silver') || l.includes('2nd'))
    return {
      bg:    'color-mix(in srgb, var(--text-secondary) 15%, transparent)',
      color: 'var(--text-secondary)',
    }
  if (l.includes('third') || l.includes('bronze') || l.includes('3rd') || l.includes('highly'))
    return {
      bg:    'color-mix(in srgb, var(--spot-teal) 14%, transparent)',
      color: 'var(--spot-teal)',
    }
  return {
    bg:    'color-mix(in srgb, var(--spot-green) 14%, transparent)',
    color: 'var(--spot-green)',
  }
}

const ENTRIES_PER_PAGE = 15

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProfileClient({
  profile: initialProfile,
  historyEntries,
  userEmail,
  userId,
}: {
  profile:        ProfileData
  historyEntries: HistoryEntry[]
  userEmail:      string
  userId:         string
}) {
  const router = useRouter()

  // ── profile state (editable) ───────────────────────────────────────────────
  const [profile,     setProfile]     = useState(initialProfile)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [editOpen,    setEditOpen]    = useState(false)
  const [lightbox,    setLightbox]    = useState<HistoryEntry | null>(null)

  // ── history UI state ───────────────────────────────────────────────────────
  const seasons = [...new Set(historyEntries.map(e => e.seasonYear))].sort((a, b) => b - a)
  const [activeSeason,  setActiveSeason]  = useState<number>(seasons[0] ?? new Date().getFullYear())
  const [filterCat,     setFilterCat]     = useState('')
  const [minScore,      setMinScore]      = useState(0)
  const [historyPage,   setHistoryPage]   = useState(1)

  // ── highlights toggle ──────────────────────────────────────────────────────
  const [hlSeason, setHlSeason] = useState<'this' | 'all'>('all')

  // ── settings state ─────────────────────────────────────────────────────────
  const [email,            setEmail]            = useState(userEmail)
  const [notifComp,        setNotifComp]        = useState(true)
  const [notifResults,     setNotifResults]     = useState(true)
  const [notifNewsletter,  setNotifNewsletter]  = useState(false)
  const [profilePublic,    setProfilePublic]    = useState(true)
  const [showScores,       setShowScores]       = useState(true)

  // ── toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; severity?: 'success' | 'error' } | null>(null)
  const showToast = useCallback((msg: string, severity: 'success' | 'error' = 'success') => {
    setToast({ msg, severity })
  }, [])

  // ── avatar upload ──────────────────────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarUploading(true)
    try {
      const supabase = createClient()
      const ext  = file.name.split('.').pop() || 'jpg'
      const path = `${userId}/avatar.${ext}`

      const { error: upErr } = await supabase.storage
        .from('images')
        .upload(path, file, { upsert: true })

      if (upErr) { showToast('Upload failed: ' + upErr.message, 'error'); return }

      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)

      // Append a timestamp so the browser always fetches the new file even
      // when the storage path is identical to the previous upload.
      const versionedUrl = `${publicUrl}?v=${Date.now()}`

      const { error: saveErr } = await updateAvatarUrl(versionedUrl)
      if (saveErr) { showToast('Could not save photo', 'error'); return }

      // Update local state immediately — nav refreshes via router
      setProfile(prev => ({ ...prev, avatar_url: versionedUrl }))
      router.refresh()
      showToast('Photo updated')
    } finally {
      setAvatarUploading(false)
      // Reset input so the same file can be re-selected
      e.target.value = ''
    }
  }

  // ── drawer form state ──────────────────────────────────────────────────────
  const [draftName,      setDraftName]      = useState(profile.display_name)
  const [draftBio,       setDraftBio]       = useState(profile.bio ?? '')
  const [draftExp,       setDraftExp]       = useState(profile.experience_level ?? '')
  const [draftInterests, setDraftInterests] = useState<string[]>(profile.shooting_interests)
  const [draftCameras,   setDraftCameras]   = useState<string[]>(profile.camera_brands)
  const [draftLocation,  setDraftLocation]  = useState(profile.location ?? '')
  const [draftPhone,     setDraftPhone]     = useState(formatPhone(profile.phone ?? ''))
  const [saving,         setSaving]         = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // ── password change ────────────────────────────────────────────────────────
  const [pwOpen,     setPwOpen]     = useState(false)
  const [currentPw,  setCurrentPw]  = useState('')
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [pwSaving,   setPwSaving]   = useState(false)
  const [pwError,    setPwError]    = useState<string | null>(null)

  // ── inline edit state ──────────────────────────────────────────────────────
  const [inlineBio,     setInlineBio]     = useState<string | null>(null)  // null = view mode
  const [inlineExp,     setInlineExp]     = useState<string | null>(null)
  const inlineBioOrigRef = useRef(profile.bio ?? '')
  const inlineExpOrigRef = useRef(profile.experience_level ?? '')

  // ── open drawer (sync draft) ───────────────────────────────────────────────
  function openDrawer() {
    setDraftName(profile.display_name)
    setDraftBio(profile.bio ?? '')
    setDraftExp(profile.experience_level ?? '')
    setDraftInterests([...profile.shooting_interests])
    setDraftCameras([...profile.camera_brands])
    setDraftLocation(profile.location ?? '')
    setDraftPhone(formatPhone(profile.phone ?? ''))
    setEditOpen(true)
  }

  // ── save from drawer ───────────────────────────────────────────────────────
  async function handleSave() {
    if (!draftName.trim()) return
    setSaving(true)
    const { error } = await updateProfile({
      first_name:         profile.first_name ?? '',
      last_name:          profile.last_name ?? '',
      display_name:       draftName.trim(),
      bio:                draftBio.trim(),
      experience_level:   draftExp,
      shooting_interests: draftInterests,
      camera_brands:      draftCameras,
      location:           draftLocation.trim(),
      phone:              draftPhone.trim(),
    })
    setSaving(false)
    if (error) {
      showToast(error, 'error')
    } else {
      setProfile(prev => ({
        ...prev,
        display_name:       draftName.trim(),
        bio:                draftBio.trim() || null,
        experience_level:   draftExp || null,
        shooting_interests: draftInterests,
        camera_brands:      draftCameras,
        location:           draftLocation.trim() || null,
        phone:              draftPhone.trim() || null,
      }))
      setEditOpen(false)
      showToast('Profile saved')
    }
  }

  // ── inline bio save ────────────────────────────────────────────────────────
  async function commitInlineBio() {
    if (inlineBio === null) return
    const trimmed = inlineBio.trim()
    await updateProfile({
      first_name: profile.first_name ?? '', last_name: profile.last_name ?? '',
      display_name: profile.display_name, bio: trimmed,
      experience_level: profile.experience_level ?? '',
      shooting_interests: profile.shooting_interests, camera_brands: profile.camera_brands,
      location: profile.location ?? '', phone: profile.phone ?? '',
    })
    setProfile(prev => ({ ...prev, bio: trimmed || null }))
    setInlineBio(null)
    showToast('Bio saved')
  }

  async function commitInlineExp() {
    if (inlineExp === null) return
    const trimmed = inlineExp.trim()
    await updateProfile({
      first_name: profile.first_name ?? '', last_name: profile.last_name ?? '',
      display_name: profile.display_name, bio: profile.bio ?? '',
      experience_level: trimmed,
      shooting_interests: profile.shooting_interests, camera_brands: profile.camera_brands,
      location: profile.location ?? '', phone: profile.phone ?? '',
    })
    setProfile(prev => ({ ...prev, experience_level: trimmed || null }))
    setInlineExp(null)
    showToast('Experience saved')
  }

  // ── password change save ───────────────────────────────────────────────────
  async function handlePasswordSave() {
    if (!currentPw || !newPw) return
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return }
    if (newPw.length < 8)    { setPwError('Must be at least 8 characters'); return }
    setPwSaving(true); setPwError(null)
    const { error } = await updatePassword(currentPw, newPw)
    setPwSaving(false)
    if (error) { setPwError(error) } else {
      setPwOpen(false); setCurrentPw(''); setNewPw(''); setConfirmPw('')
      showToast('Password updated')
    }
  }

  // ── chip toggle helpers ────────────────────────────────────────────────────
  function toggleChip(list: string[], setList: (v: string[]) => void, val: string) {
    setList(list.includes(val) ? list.filter(x => x !== val) : [...list, val])
  }

  // ── computed data ──────────────────────────────────────────────────────────
  const scoredEntries  = historyEntries.filter(e => e.score !== null)
  const thisYear       = new Date().getFullYear()
  const hlEntries      = hlSeason === 'this'
    ? scoredEntries.filter(e => e.seasonYear === thisYear)
    : scoredEntries
  const highlights     = [...hlEntries].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 9)

  const stats = {
    entered:     new Set(historyEntries.map(e => e.competitionId)).size,
    submitted:   historyEntries.length,
    awards:      historyEntries.filter(e => e.awardId).length,
    bestScore:   scoredEntries.length ? Math.max(...scoredEntries.map(e => e.score ?? 0)) : null,
  }

  const seasonEntries  = historyEntries.filter(e => e.seasonYear === activeSeason)
  const allCategories  = [...new Set(historyEntries.map(e => e.categoryName).filter(Boolean))]
  const filtered       = seasonEntries.filter(e =>
    (!filterCat  || e.categoryName === filterCat) &&
    (!minScore   || (e.score ?? 0) >= minScore)
  )
  const totalPages     = Math.max(1, Math.ceil(filtered.length / ENTRIES_PER_PAGE))
  const pageEntries    = filtered.slice((historyPage - 1) * ENTRIES_PER_PAGE, historyPage * ENTRIES_PER_PAGE)

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const serifFont    = 'var(--font-heading)'
  const accentColor  = 'var(--action-primary)'
  const surfaceColor = 'var(--surface-1)'
  const borderColor  = 'var(--border-default)'

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', paddingBottom: 96 }}>

      {/* ── Hidden file input — lives outside the Drawer so it's always mounted ── */}
      <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />

      {/* ── Toast ── */}
      <Snackbar
        open={!!toast}
        autoHideDuration={2500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast?.severity ?? 'success'} variant="filled" onClose={() => setToast(null)}>
          {toast?.msg}
        </Alert>
      </Snackbar>

      {/* ── Lightbox ── */}
      <Dialog
        open={!!lightbox}
        onClose={() => setLightbox(null)}
        maxWidth="lg"
        fullWidth
        slotProps={{ paper: { sx: { background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 2, overflow: 'hidden' } } }}
      >
        {lightbox && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px' }}>
            <div style={{ background: 'black', display: 'flex', alignItems: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightbox.imageUrl}
                alt={lightbox.imageTitle}
                style={{ width: '100%', maxHeight: 580, objectFit: 'contain', display: 'block' }}
              />
            </div>
            <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton size="small" onClick={() => setLightbox(null)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
              <div>
                <p style={{ fontFamily: serifFont, fontSize: 22, fontWeight: 400, lineHeight: 1.2, color: 'var(--text-primary)' }}>
                  {lightbox.imageTitle}
                </p>
              </div>
              {lightbox.score !== null && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Score</p>
                  <p style={{ fontFamily: serifFont, fontSize: 56, fontWeight: 300, color: accentColor, lineHeight: 1 }}>
                    {lightbox.score}
                  </p>
                </div>
              )}
              {lightbox.awardLabel && (() => {
                const s = getAwardStyle(lightbox.awardLabel)
                return s ? (
                  <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 4, background: s.bg, color: s.color, fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
                    {lightbox.awardLabel}
                  </span>
                ) : null
              })()}
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Competition</p>
                <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>{lightbox.competitionTitle}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Category</p>
                <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>{lightbox.categoryName}</p>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* ── Edit Profile Drawer ── */}
      <Drawer
        anchor="right"
        open={editOpen}
        onClose={() => setEditOpen(false)}
        slotProps={{ paper: { sx: { width: { xs: '100vw', sm: 480 }, background: 'var(--surface-1)', borderLeft: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column' } } }}
      >
        {/* Drawer header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px 20px', borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
          <p style={{ fontFamily: serifFont, fontSize: 22, fontWeight: 400, color: 'var(--text-primary)' }}>Edit profile</p>
          <IconButton size="small" onClick={() => setEditOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        {/* Drawer body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Avatar upload */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, background: 'var(--surface-2)', border: `1px dashed ${borderColor}`, borderRadius: 10, cursor: 'pointer' }}
            onClick={() => avatarInputRef.current?.click()}
          >
            <AvatarOrInitials avatarUrl={profile.avatar_url} name={profile.display_name} size={64} fontSize={22} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Change photo</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Click to upload a new profile photo</p>
            </div>
          </div>

          {/* Basic info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 6 }}>Display name</p>
            <TextField
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              size="small"
              fullWidth
              placeholder="Your name"
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'var(--surface-2)' } }}
            />
          </div>

          {/* Location */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 6 }}>Location</p>
            <TextField
              value={draftLocation}
              onChange={e => setDraftLocation(e.target.value)}
              size="small"
              fullWidth
              placeholder="e.g. Toronto, ON"
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'var(--surface-2)' } }}
            />
          </div>

          {/* Phone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 6 }}>Phone number</p>
            <TextField
              value={draftPhone}
              onChange={e => setDraftPhone(e.target.value)}
              onBlur={e => setDraftPhone(formatPhone(e.target.value))}
              size="small"
              fullWidth
              placeholder="e.g. +1 416 555 0100"
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'var(--surface-2)' } }}
            />
          </div>

          {/* Bio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 6 }}>Bio</p>
            <TextField
              value={draftBio}
              onChange={e => setDraftBio(e.target.value)}
              size="small"
              fullWidth
              multiline
              minRows={3}
              placeholder="A few words about your photography..."
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'var(--surface-2)' } }}
            />
          </div>

          {/* Experience */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 6 }}>Skill level</p>
            <FormControl fullWidth size="small">
              <Select
                value={draftExp}
                onChange={e => setDraftExp(e.target.value)}
                displayEmpty
                sx={{ bgcolor: 'var(--surface-2)' }}
              >
                <MenuItem value=""><em>Select level</em></MenuItem>
                {EXPERIENCE_LEVELS.map(l => (
                  <MenuItem key={l.value} value={l.value}>{l.label} — {l.description}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          {/* Interests */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 10 }}>Shooting interests</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SHOOTING_INTERESTS.map(opt => {
                const on = draftInterests.includes(opt)
                return (
                  <Chip
                    key={opt}
                    label={opt}
                    size="small"
                    onClick={() => toggleChip(draftInterests, setDraftInterests, opt)}
                    sx={{
                      bgcolor: on ? 'color-mix(in srgb, var(--action-primary) 12%, transparent)' : 'var(--surface-2)',
                      border: `1px solid ${on ? 'color-mix(in srgb, var(--action-primary) 35%, transparent)' : borderColor}`,
                      color: on ? accentColor : 'var(--text-secondary)',
                      fontWeight: on ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  />
                )
              })}
            </div>
          </div>

          {/* Camera brands */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 10 }}>Camera brands</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CAMERA_BRANDS.map(opt => {
                const on = draftCameras.includes(opt)
                return (
                  <Chip
                    key={opt}
                    label={opt}
                    size="small"
                    onClick={() => toggleChip(draftCameras, setDraftCameras, opt)}
                    sx={{
                      bgcolor: on ? 'color-mix(in srgb, var(--action-primary) 12%, transparent)' : 'var(--surface-2)',
                      border: `1px solid ${on ? 'color-mix(in srgb, var(--action-primary) 35%, transparent)' : borderColor}`,
                      color: on ? accentColor : 'var(--text-secondary)',
                      fontWeight: on ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Drawer footer */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 32px', borderTop: `1px solid ${borderColor}`, flexShrink: 0 }}>
          <Button variant="outlined" color="secondary" onClick={() => setEditOpen(false)} fullWidth>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !draftName.trim()} fullWidth>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Drawer>

      {/* ── Password change dialog ── */}
      <Dialog
        open={pwOpen}
        onClose={() => { setPwOpen(false); setPwError(null) }}
        slotProps={{ paper: { sx: { background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 2, p: 3, minWidth: 360 } } }}
      >
        <p style={{ fontFamily: serifFont, fontSize: 20, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 20 }}>Change password</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <TextField label="Current password" type="password" size="small" fullWidth value={currentPw} onChange={e => setCurrentPw(e.target.value)} />
          <TextField label="New password" type="password" size="small" fullWidth value={newPw} onChange={e => setNewPw(e.target.value)} />
          <TextField label="Confirm new password" type="password" size="small" fullWidth value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
          {pwError && <p style={{ fontSize: 13, color: 'var(--status-error)' }}>{pwError}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Button variant="outlined" color="secondary" onClick={() => { setPwOpen(false); setPwError(null) }} fullWidth>Cancel</Button>
          <Button variant="contained" onClick={handlePasswordSave} disabled={pwSaving || !currentPw || !newPw || !confirmPw} fullWidth>
            {pwSaving ? 'Updating…' : 'Update'}
          </Button>
        </div>
      </Dialog>

      {/* ════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'clamp(80px,120px,120px) 1fr auto',
        gap: 32,
        alignItems: 'start',
        paddingBottom: 40,
        marginBottom: 36,
        borderBottom: `1px solid ${borderColor}`,
      }}>
        {/* Avatar */}
        <div style={{ position: 'relative', width: 120, height: 120 }}>
          <AvatarOrInitials avatarUrl={profile.avatar_url} name={profile.display_name} size={120} fontSize={40} />
          <button
            onClick={() => !avatarUploading && avatarInputRef.current?.click()}
            disabled={avatarUploading}
            style={{
              position: 'absolute', bottom: 4, right: 4,
              width: 28, height: 28, borderRadius: '50%',
              background: accentColor, border: 'none',
              cursor: avatarUploading ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              opacity: avatarUploading ? 0.7 : 1,
            }}
            title={avatarUploading ? 'Uploading…' : 'Change photo'}
          >
            {avatarUploading ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" style={{ animation: 'spin 0.8s linear infinite', transformOrigin: '50% 50%' }}/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            )}
          </button>
        </div>

        {/* Identity */}
        <div style={{ paddingTop: 4 }}>
          <h1 style={{ fontFamily: serifFont, fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: 8 }}>
            {profile.display_name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Member since {fmtSince(profile.created_at)}</span>
            {skillLabel(profile.experience_level) && (
              <span style={{
                fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '3px 10px', borderRadius: 20,
                background: 'color-mix(in srgb, var(--action-primary) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--action-primary) 30%, transparent)',
                color: accentColor,
              }}>
                {skillLabel(profile.experience_level)}
              </span>
            )}
          </div>
          {profile.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{profile.location}</span>
            </div>
          )}
          {profile.membership_class && (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{profile.membership_class}</p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, paddingTop: 4 }}>
          <Button variant="outlined" color="secondary" size="small" onClick={openDrawer} startIcon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          }>
            Edit profile
          </Button>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          ABOUT CARD
      ════════════════════════════════════════════ */}
      <div style={{
        background: surfaceColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: 32,
        marginBottom: 48,
      }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: serifFont, fontSize: 22, fontWeight: 400, color: 'var(--text-primary)' }}>About</h2>
        </div>

        {/* Bio row */}
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px 24px', padding: '12px 0', borderBottom: `1px solid ${borderColor}`, alignItems: 'start' }}>
          <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', paddingTop: 2 }}>Bio</span>
          <div>
            {inlineBio !== null ? (
              <textarea
                autoFocus
                value={inlineBio}
                onChange={e => setInlineBio(e.target.value)}
                onBlur={commitInlineBio}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitInlineBio() }
                  if (e.key === 'Escape') { setInlineBio(null) }
                }}
                style={{
                  width: '100%', background: 'var(--surface-2)', border: `1px solid ${accentColor}`,
                  borderRadius: 4, color: 'var(--text-primary)', fontFamily: 'inherit',
                  fontSize: 14, lineHeight: 1.6, padding: '4px 8px', resize: 'vertical', minHeight: 60, outline: 'none',
                }}
              />
            ) : (
              <p
                onClick={() => { inlineBioOrigRef.current = profile.bio ?? ''; setInlineBio(profile.bio ?? '') }}
                style={{
                  fontSize: 14, color: profile.bio ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  lineHeight: 1.6, cursor: 'pointer', borderRadius: 4, padding: '2px 6px', margin: '-2px -6px',
                }}
                title="Click to edit"
              >
                {profile.bio || 'Click to add a bio…'}
              </p>
            )}
          </div>
        </div>

        {/* Experience row */}
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px 24px', padding: '12px 0', borderBottom: `1px solid ${borderColor}`, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>Experience</span>
          <div>
            {inlineExp !== null ? (
              <input
                autoFocus
                value={inlineExp}
                onChange={e => setInlineExp(e.target.value)}
                onBlur={commitInlineExp}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); commitInlineExp() }
                  if (e.key === 'Escape') { setInlineExp(null) }
                }}
                style={{
                  background: 'var(--surface-2)', border: `1px solid ${accentColor}`,
                  borderRadius: 4, color: 'var(--text-primary)', fontFamily: 'inherit',
                  fontSize: 14, padding: '4px 8px', outline: 'none', width: '100%',
                }}
              />
            ) : (
              <p
                onClick={() => { inlineExpOrigRef.current = profile.experience_level ?? ''; setInlineExp(profile.experience_level ?? '') }}
                style={{
                  fontSize: 14, color: profile.experience_level ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  cursor: 'pointer', borderRadius: 4, padding: '2px 6px', margin: '-2px -6px',
                }}
                title="Click to edit"
              >
                {skillFull(profile.experience_level) || 'Click to add…'}
              </p>
            )}
          </div>
        </div>

        {/* Interests row */}
        {profile.shooting_interests.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px 24px', padding: '12px 0', borderBottom: `1px solid ${borderColor}`, alignItems: 'start' }}>
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', paddingTop: 4 }}>Interests</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {profile.shooting_interests.map(i => (
                <span key={i} style={{ fontSize: 13, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: 'color-mix(in srgb, var(--action-primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--action-primary) 25%, transparent)', color: accentColor }}>
                  {i}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Cameras row */}
        {profile.camera_brands.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px 24px', padding: '12px 0', alignItems: 'start' }}>
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', paddingTop: 4 }}>Cameras</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {profile.camera_brands.map(c => (
                <span key={c} style={{ fontSize: 13, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: 'var(--surface-2)', border: `1px solid ${borderColor}`, color: 'var(--text-secondary)' }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════
          HIGHLIGHTS GALLERY
      ════════════════════════════════════════════ */}
      {scoredEntries.length > 0 && (
        <div style={{
          background: 'var(--surface-0)',
          margin: '0 -32px 48px',
          padding: '48px 32px',
          borderTop: `1px solid ${borderColor}`,
          borderBottom: `1px solid ${borderColor}`,
        }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: serifFont, fontSize: 28, fontWeight: 400, color: accentColor }}>
              Your Highlights
            </h2>
            {/* Season toggle */}
            <div style={{ display: 'flex', background: surfaceColor, border: `1px solid ${borderColor}`, borderRadius: 6, overflow: 'hidden' }}>
              {(['all', 'this'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setHlSeason(s)}
                  style={{
                    padding: '6px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    border: 'none', fontFamily: 'inherit',
                    background: hlSeason === s ? accentColor : 'transparent',
                    color: hlSeason === s ? 'white' : 'var(--text-secondary)',
                    transition: 'all 0.2s',
                  }}
                >
                  {s === 'all' ? 'All time' : 'This season'}
                </button>
              ))}
            </div>
          </div>

          {highlights.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>
              No scored images for this season yet.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {highlights.map(entry => (
                <HighlightThumb key={entry.submissionId} entry={entry} onClick={() => setLightbox(entry)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
          STATS ROW
      ════════════════════════════════════════════ */}
      {historyEntries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 48 }}>
          {[
            { label: 'Competitions entered', value: stats.entered },
            { label: 'Images submitted',     value: stats.submitted },
            { label: 'Awards won',           value: stats.awards },
            { label: 'Best score',           value: stats.bestScore ?? '—' },
            { label: 'POY standing',         value: '—' },
          ].map(s => (
            <div key={s.label} style={{
              background: surfaceColor, border: `1px solid ${borderColor}`,
              borderRadius: 10, padding: '22px 16px', textAlign: 'center',
            }}>
              <p style={{ fontFamily: serifFont, fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 300, color: accentColor, lineHeight: 1, marginBottom: 8 }}>
                {s.value}
              </p>
              <p style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════
          COMPETITION HISTORY
      ════════════════════════════════════════════ */}
      {seasons.length > 0 && (
        <div style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: serifFont, fontSize: 28, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 20 }}>
            Competition History
          </h2>

          {/* Season tabs */}
          <Tabs
            value={activeSeason}
            onChange={(_, v) => { setActiveSeason(v); setHistoryPage(1); setFilterCat(''); setMinScore(0) }}
            sx={{ borderBottom: `1px solid ${borderColor}`, mb: 3, '& .MuiTabs-indicator': { background: accentColor } }}
          >
            {seasons.map(yr => {
              const count = historyEntries.filter(e => e.seasonYear === yr).length
              return (
                <Tab
                  key={yr}
                  value={yr}
                  label={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {yr}
                      <span style={{ fontSize: 11, background: 'var(--surface-2)', border: `1px solid ${borderColor}`, borderRadius: 10, padding: '1px 6px', color: 'var(--text-secondary)' }}>
                        {count}
                      </span>
                    </span>
                  }
                  sx={{ fontSize: 14, fontFamily: 'inherit', textTransform: 'none', color: 'var(--text-secondary)', '&.Mui-selected': { color: accentColor } }}
                />
              )
            })}
          </Tabs>

          {/* Filter bar */}
          {allCategories.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select
                  value={filterCat}
                  onChange={e => { setFilterCat(e.target.value); setHistoryPage(1) }}
                  displayEmpty
                  sx={{ fontSize: 14, bgcolor: surfaceColor }}
                >
                  <MenuItem value="">All categories</MenuItem>
                  {allCategories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>

              {scoredEntries.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 220 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Min score: {minScore || 'any'}</span>
                  <Slider
                    value={minScore}
                    onChange={(_, v) => { setMinScore(v as number); setHistoryPage(1) }}
                    min={0} max={10} step={1}
                    size="small"
                    sx={{ color: accentColor, width: 120 }}
                  />
                </div>
              )}

              {(filterCat || minScore > 0) && (
                <button
                  onClick={() => { setFilterCat(''); setMinScore(0); setHistoryPage(1) }}
                  style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Clear
                </button>
              )}

              <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-secondary)' }}>
                {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
          )}

          {/* Entry rows */}
          {pageEntries.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', padding: '32px 0', textAlign: 'center' }}>
              No entries match your filters.
            </p>
          ) : (
            <div>
              {/* Header row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '56px 1fr 1fr 80px 150px',
                gap: 16, padding: '8px 0', marginBottom: 4,
              }}>
                <div />
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)' }}>Image</span>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)' }}>Competition</span>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', textAlign: 'right' }}>Score</span>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', textAlign: 'right' }}>Award</span>
              </div>

              {pageEntries.map(entry => (
                <div
                  key={entry.submissionId}
                  style={{
                    display: 'grid', gridTemplateColumns: '56px 1fr 1fr 80px 150px',
                    gap: 16, alignItems: 'center', padding: '12px 0',
                    borderTop: `1px solid ${borderColor}`,
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => setLightbox(entry)}
                    style={{ width: 56, height: 40, borderRadius: 4, overflow: 'hidden', background: 'var(--surface-2)', cursor: 'pointer', flexShrink: 0 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={entry.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>

                  {/* Title */}
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.imageTitle}
                  </p>

                  {/* Competition + category */}
                  <div>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.competitionTitle}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{entry.categoryName}</p>
                  </div>

                  {/* Score */}
                  <p style={{ fontFamily: serifFont, fontSize: 24, fontWeight: 400, color: 'var(--text-primary)', textAlign: 'right' }}>
                    {entry.score ?? '—'}
                  </p>

                  {/* Award */}
                  <div style={{ textAlign: 'right' }}>
                    {entry.awardLabel && (() => {
                      const s = getAwardStyle(entry.awardLabel)
                      return s ? (
                        <span style={{ display: 'inline-block', fontSize: 12, padding: '2px 8px', borderRadius: 3, background: s.bg, color: s.color, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          {entry.awardLabel}
                        </span>
                      ) : null
                    })()}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24 }}>
                  <Button variant="outlined" color="secondary" size="small" disabled={historyPage <= 1} onClick={() => setHistoryPage(p => p - 1)}>
                    ← Prev
                  </Button>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    Page {historyPage} of {totalPages}
                  </span>
                  <Button variant="outlined" color="secondary" size="small" disabled={historyPage >= totalPages} onClick={() => setHistoryPage(p => p + 1)}>
                    Next →
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
          ACCOUNT SETTINGS
      ════════════════════════════════════════════ */}
      <hr style={{ border: 'none', borderTop: `1px solid ${borderColor}`, margin: '0 0 40px' }} />

      <div style={{ marginBottom: 64 }}>
        <h2 style={{ fontFamily: serifFont, fontSize: 26, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 24 }}>
          Account Settings
        </h2>

        {/* Account group */}
        <div style={{ background: surfaceColor, border: `1px solid ${borderColor}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
          {/* Email */}
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${borderColor}` }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>Email address</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{userEmail}</p>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 3 }}>To change your email address, contact your club administrator.</p>
          </div>
          {/* Phone */}
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${borderColor}` }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>Phone number</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {profile.phone ? formatPhone(profile.phone) : <span style={{ color: 'var(--text-tertiary)' }}>Not set — edit your profile to add one</span>}
            </p>
          </div>
          {/* Password */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', gap: 16 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>Password</p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Change your login password</p>
            </div>
            <Button variant="outlined" color="secondary" size="small" onClick={() => setPwOpen(true)}>
              Change password
            </Button>
          </div>
        </div>

        {/* Notifications group */}
        <div style={{ background: surfaceColor, border: `1px solid ${borderColor}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
          {[
            { label: 'Competition reminders', sub: 'Reminded before submission deadlines', value: notifComp, set: setNotifComp },
            { label: 'Results notifications', sub: 'Notified when competition results are published', value: notifResults, set: setNotifResults },
            { label: 'Club newsletter',       sub: 'Monthly digest and club news', value: notifNewsletter, set: setNotifNewsletter },
          ].map((row, i, arr) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: i < arr.length - 1 ? `1px solid ${borderColor}` : 'none', gap: 16 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{row.label}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.sub}</p>
              </div>
              <Switch
                checked={row.value}
                onChange={e => { row.set(e.target.checked); showToast(`${row.label} ${e.target.checked ? 'enabled' : 'disabled'}`) }}
                size="small"
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: accentColor }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: accentColor } }}
              />
            </div>
          ))}
        </div>

        {/* Visibility group */}
        <div style={{ background: surfaceColor, border: `1px solid ${borderColor}`, borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
          {[
            { label: 'Public profile',      sub: 'Let other members view your profile', value: profilePublic, set: setProfilePublic },
            { label: 'Show scores publicly', sub: 'Display your competition scores on your profile', value: showScores, set: setShowScores },
          ].map((row, i, arr) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: i < arr.length - 1 ? `1px solid ${borderColor}` : 'none', gap: 16 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{row.label}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.sub}</p>
              </div>
              <Switch
                checked={row.value}
                onChange={e => { row.set(e.target.checked); showToast(`${row.label} ${e.target.checked ? 'enabled' : 'disabled'}`) }}
                size="small"
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: accentColor }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: accentColor } }}
              />
            </div>
          ))}
        </div>

        {/* Danger zone */}
        <div style={{
          background: 'var(--status-error-bg)',
          border: '1px solid color-mix(in srgb, var(--status-error) 20%, transparent)',
          borderRadius: 10,
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
        }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--status-error)', marginBottom: 4 }}>Delete account</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>To delete your account, please contact your club administrator.</p>
          </div>
          <Button
            variant="outlined"
            size="small"
            sx={{
              borderColor: 'color-mix(in srgb, var(--status-error) 40%, transparent)',
              color: 'var(--status-error)',
              '&:hover': { borderColor: 'var(--status-error)', bgcolor: 'color-mix(in srgb, var(--status-error) 8%, transparent)' },
              flexShrink: 0,
            }}
          >
            Delete account
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Highlight thumbnail sub-component ───────────────────────────────────────

function HighlightThumb({ entry, onClick }: { entry: HistoryEntry; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        aspectRatio: '4/3',
        cursor: 'pointer',
        background: 'var(--surface-1)',
      }}
      className="highlight-thumb-wrap"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={entry.imageUrl}
        alt={entry.imageTitle}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
        className="highlight-thumb-img"
      />
      <div
        className="highlight-overlay"
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 55%)',
          opacity: 0, transition: 'opacity 0.3s',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: 14,
        }}
      >
        {entry.score !== null && (
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 500, color: 'white', lineHeight: 1 }}>
            {entry.score}
          </p>
        )}
        {entry.awardLabel && (
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--action-primary)', marginTop: 2 }}>
            {entry.awardLabel}
          </p>
        )}
      </div>
    </div>
  )
}

// Inline SVG close icon used in Dialogs
function CloseIcon({ fontSize }: { fontSize?: string }) {
  const size = fontSize === 'small' ? 18 : 22
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

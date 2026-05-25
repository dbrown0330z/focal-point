'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto'
import { createClient } from '@/lib/supabase/client'
import { completeProfile } from '../actions'
import { logout } from '@/app/(auth)/actions'
import { SHOOTING_INTERESTS, CAMERA_BRANDS, EXPERIENCE_LEVELS } from '@/lib/profile-options'
import { formatPhone } from '@/lib/format-phone'

const TOKEN = { primary: 'var(--text-primary)', secondary: 'var(--text-secondary)', tertiary: 'var(--text-tertiary)' }

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <Typography
      component="label"
      sx={{ display: 'block', fontSize: 14, fontWeight: 500, mb: 1, color: TOKEN.primary }}
    >
      {children}
      {hint && (
        <Typography component="span" sx={{ fontSize: 13, fontWeight: 400, color: TOKEN.secondary, ml: 0.5 }}>
          {hint}
        </Typography>
      )}
    </Typography>
  )
}

export default function OnboardingProfilePage() {
  const [firstName, setFirstName]             = useState('')
  const [initials, setInitials]               = useState('')
  const [avatarFile, setAvatarFile]           = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview]     = useState<string>('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [interests, setInterests]             = useState<string[]>([])
  const [brands, setBrands]                   = useState<string[]>([])
  const [location, setLocation]               = useState('')
  const [phone, setPhone]                     = useState('')
  const [bio, setBio]                         = useState('')
  const [submitting, setSubmitting]           = useState(false)
  const [cancelWarning, setCancelWarning]     = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pre-fill all fields from data saved at signup
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, experience_level, shooting_interests, camera_brands, bio, avatar_url')
        .eq('id', user.id)
        .single()
      if (data) {
        setFirstName(data.first_name ?? '')
        setInitials(
          [(data.first_name?.[0] ?? ''), (data.last_name?.[0] ?? '')].join('').toUpperCase()
        )
        setExperienceLevel(data.experience_level ?? '')
        setInterests((data.shooting_interests as string[]) ?? [])
        setBrands((data.camera_brands as string[]) ?? [])
        setBio(data.bio ?? '')
        if (data.avatar_url) setAvatarPreview(data.avatar_url)
      }
    })
  }, [])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function toggleChip(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    let avatarUrl: string | undefined
    if (avatarFile) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const ext = avatarFile.name.split('.').pop() || 'jpg'
        const path = `${user.id}/avatar.${ext}`
        await supabase.storage.from('images').upload(path, avatarFile, { upsert: true })
        const { data } = supabase.storage.from('images').getPublicUrl(path)
        avatarUrl = data.publicUrl
      }
    }

    const formData = new FormData()
    formData.set('experienceLevel', experienceLevel)
    formData.set('bio', bio)
    formData.set('location', location)
    formData.set('phone', phone)
    interests.forEach(i => formData.append('shootingInterests', i))
    brands.forEach(b => formData.append('cameraBrands', b))
    if (avatarUrl) formData.set('avatarUrl', avatarUrl)

    await completeProfile(formData)
  }

  const chipSx = (active: boolean) => ({
    cursor: 'pointer',
    height: 32,
    fontSize: '13px',
    fontFamily: 'inherit',
    fontWeight: 400,
    textTransform: 'none' as const,
    letterSpacing: 'normal',
    borderRadius: '9999px',
    ...(!active && {
      backgroundColor: 'transparent',
      borderColor: 'var(--border-default)',
      color: TOKEN.secondary,
      '&:hover': { borderColor: 'var(--border-strong)', color: TOKEN.primary },
    }),
  })

  return (
    <Box sx={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>

      {/* Left: Welcome panel */}
      <Box sx={{ width: 460, flexShrink: 0, pt: 1 }}>
        <Typography
          sx={{
            fontFamily: 'var(--font-lora)',
            fontSize: '44px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            color: TOKEN.primary,
            mb: 3,
          }}
        >
          {firstName
            ? <>{`Welcome aboard, ${firstName} `}<span style={{ color: TOKEN.secondary }}>— happy to have you in the club!</span></>
            : <>{'Welcome aboard '}<span style={{ color: TOKEN.secondary }}>— happy to have you in the club!</span></>
          }
        </Typography>
        <Typography sx={{ fontSize: 20, lineHeight: 1.7, color: TOKEN.secondary }}>
          We're looking forward to seeing your work. Set up your profile, complete your membership, and you'll be ready to enter your first competition before you know it.
        </Typography>
        <Box sx={{ mt: 5 }}>
          <img src="/onboarding-approved.svg" alt="" width={510} height={357} />
        </Box>
      </Box>

      {/* Right: Step indicator + form */}
      <Box sx={{ flex: 1, minWidth: 0 }}>

      {/* Step indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 24, height: 24, borderRadius: '50%',
            bgcolor: 'primary.main',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1 }}>1</Typography>
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: TOKEN.primary }}>Complete your profile</Typography>
        </Box>
        <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 24, height: 24, borderRadius: '50%',
            border: '1.5px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: TOKEN.secondary, lineHeight: 1 }}>2</Typography>
          </Box>
          <Typography sx={{ fontSize: 14, color: TOKEN.secondary }}>Pay membership fee</Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit}>
        <Stack spacing={8}>

          {/* Avatar */}
          <Box>
            <FieldLabel hint="(optional)">Profile photo</FieldLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={avatarPreview || undefined}
                  sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: 24, fontWeight: 600 }}
                >
                  {!avatarPreview && initials}
                </Avatar>
                {avatarPreview && (
                  <IconButton
                    onClick={() => fileInputRef.current?.click()}
                    size="small"
                    sx={{
                      position: 'absolute', bottom: -4, right: -4,
                      bgcolor: 'primary.main', color: '#fff', width: 26, height: 26,
                      '&:hover': { bgcolor: 'primary.dark' },
                      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    <AddAPhotoIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
              </Box>
              <Box>
                <Typography
                  component="span"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    fontSize: 14, color: 'primary.main', cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {avatarPreview ? 'Change photo' : 'Upload a photo'}
                </Typography>
                <Typography sx={{ fontSize: 13, color: TOKEN.secondary, mt: 0.5 }}>
                  JPEG or PNG · Max 5 MB
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Experience level */}
          <Box>
            <FieldLabel>Experience level</FieldLabel>
            <Select
              displayEmpty
              fullWidth
              value={experienceLevel}
              onChange={e => setExperienceLevel(e.target.value)}
              input={<OutlinedInput />}
              renderValue={val => {
                const lvl = EXPERIENCE_LEVELS.find(l => l.value === val)
                return lvl
                  ? `${lvl.label} — ${lvl.description}`
                  : <Typography component="span" sx={{ color: TOKEN.tertiary, fontSize: 14 }}>Select one…</Typography>
              }}
            >
              {EXPERIENCE_LEVELS.map(l => (
                <MenuItem key={l.value} value={l.value}>{l.label} — {l.description}</MenuItem>
              ))}
            </Select>
          </Box>

          {/* Shooting interests */}
          <Box>
            <FieldLabel hint="(choose all that apply)">Shooting interests</FieldLabel>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {SHOOTING_INTERESTS.map(interest => {
                const active = interests.includes(interest)
                return (
                  <Chip
                    key={interest}
                    label={interest}
                    onClick={() => toggleChip(interests, setInterests, interest)}
                    variant={active ? 'filled' : 'outlined'}
                    color={active ? 'primary' : 'default'}
                    sx={chipSx(active)}
                  />
                )
              })}
            </Box>
          </Box>

          {/* Camera brands */}
          <Box>
            <FieldLabel hint="(choose all that apply)">Camera brand</FieldLabel>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {CAMERA_BRANDS.map(brand => {
                const active = brands.includes(brand)
                return (
                  <Chip
                    key={brand}
                    label={brand}
                    onClick={() => toggleChip(brands, setBrands, brand)}
                    variant={active ? 'filled' : 'outlined'}
                    color={active ? 'primary' : 'default'}
                    sx={chipSx(active)}
                  />
                )
              })}
            </Box>
          </Box>

          {/* Location + Phone — two-column row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <Box>
              <FieldLabel hint="(optional)">Location</FieldLabel>
              <OutlinedInput
                fullWidth
                placeholder="e.g. Toronto, ON"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </Box>
            <Box>
              <FieldLabel hint="(optional)">Phone number</FieldLabel>
              <OutlinedInput
                fullWidth
                placeholder="e.g. +1 416 555 0100"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onBlur={e => setPhone(formatPhone(e.target.value))}
              />
            </Box>
          </Box>

          {/* Bio */}
          <Box>
            <FieldLabel hint="(optional)">Bio</FieldLabel>
            <OutlinedInput
              multiline
              rows={3}
              fullWidth
              placeholder="A little about you, your gear, or what drew you to photography…"
              value={bio}
              onChange={e => setBio(e.target.value)}
            />
            <Typography sx={{ fontSize: 13, color: TOKEN.secondary, mt: 0.75 }}>
              Visible to other club members.
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, pt: 1 }}>
            <Button variant="outlined" color="secondary" fullWidth onClick={() => setCancelWarning(true)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" fullWidth disabled={submitting}>
              {submitting ? 'Saving…' : 'Continue to payment'}
            </Button>
          </Box>

        </Stack>
      </form>

      {/* Cancel / sign-out warning dialog */}
      <Dialog
        open={cancelWarning}
        onClose={() => setCancelWarning(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Leave without saving?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            Your profile changes will not be saved and you will be signed out.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" color="secondary" onClick={() => setCancelWarning(false)}>
            Stay
          </Button>
          <Button variant="contained" color="error" onClick={() => logout()}>
            Sign out
          </Button>
        </DialogActions>
      </Dialog>

      </Box>{/* end right column */}
    </Box>
  )
}

'use client'

import { useState, useRef } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
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

const SHOOTING_INTERESTS = [
  'Landscape', 'Portrait', 'Wildlife', 'Street', 'Macro',
  'Architectural', 'Abstract', 'Black & white', 'Astrophotography',
]

const CAMERA_BRANDS = [
  'Canon', 'Nikon', 'Sony', 'Fujifilm', 'Olympus',
  'Panasonic', 'Leica', 'Pentax / Ricoh',
  'iPhone', 'Android', 'Film — other',
]

const EXPERIENCE_LEVELS = [
  { value: 'beginner',     label: 'Beginner — just getting started' },
  { value: 'intermediate', label: 'Intermediate — shooting regularly' },
  { value: 'advanced',     label: 'Advanced — experienced photographer' },
]

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <Typography variant="body1" fontWeight={500} sx={{ mb: 1 }}>
      {children}
      {hint && (
        <Typography component="span" variant="body1" color="text.secondary" fontWeight={400}>
          {' '}{hint}
        </Typography>
      )}
    </Typography>
  )
}

export default function OnboardingProfilePage() {
  const [avatarFile, setAvatarFile]       = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [interests, setInterests]         = useState<string[]>([])
  const [brands, setBrands]               = useState<string[]>([])
  const [bio, setBio]                     = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    interests.forEach(i => formData.append('shootingInterests', i))
    brands.forEach(b => formData.append('cameraBrands', b))
    if (avatarUrl) formData.set('avatarUrl', avatarUrl)

    await completeProfile(formData)
  }

  const chipSx = (active: boolean) => ({
    cursor: 'pointer',
    fontFamily: 'inherit',
    height: 32,
    fontSize: '13px',
    ...(!active && {
      borderColor: 'rgba(0,0,0,0.18)',
      color: 'text.secondary',
      '&:hover': { borderColor: 'rgba(0,0,0,0.32)', color: 'text.primary' },
    }),
  })

  return (
    <>
      {/* Step indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>1</Typography>
          </Box>
          <Typography variant="body1" fontWeight={600}>Complete your profile</Typography>
        </Box>
        <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary' }}>2</Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">Pay membership fee</Typography>
        </Box>
      </Box>

      <Typography variant="h2" sx={{ mb: 0.5 }}>About you</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 5, lineHeight: 1.7 }}>
        Tell us a bit about yourself. This helps other members get to know you.
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={5}>

          {/* Avatar */}
          <Box>
            <FieldLabel hint="(optional)">Profile photo</FieldLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar src={avatarPreview || undefined} sx={{ width: 80, height: 80, bgcolor: 'action.selected', fontSize: 32 }} />
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  size="small"
                  sx={{
                    position: 'absolute', bottom: -4, right: -4,
                    bgcolor: 'primary.main', color: '#fff', width: 28, height: 28,
                    '&:hover': { bgcolor: 'primary.dark' },
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  <AddAPhotoIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </Box>
              <Box>
                <Button variant="outlined" size="small" color="secondary" onClick={() => fileInputRef.current?.click()}>
                  {avatarPreview ? 'Change photo' : 'Upload photo'}
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  JPG, PNG or WEBP. Max 5 MB.
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
              renderValue={val => val
                ? EXPERIENCE_LEVELS.find(l => l.value === val)?.label
                : <Typography component="span" sx={{ color: 'text.disabled', fontSize: '14px' }}>Select one…</Typography>
              }
            >
              {EXPERIENCE_LEVELS.map(l => (
                <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
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
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              This will be visible to other club members.
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, pt: 1 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              sx={{ py: 1.5 }}
            >
              {submitting ? 'Saving…' : 'Continue to payment'}
            </Button>
            <form action={logout} style={{ width: '100%' }}>
              <Button
                type="submit"
                variant="outlined"
                color="secondary"
                fullWidth
                sx={{ py: 1.5 }}
              >
                Cancel
              </Button>
            </form>
          </Box>

        </Stack>
      </form>
    </>
  )
}

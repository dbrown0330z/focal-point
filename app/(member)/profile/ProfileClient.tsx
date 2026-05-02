'use client'

import { useState } from 'react'
import { updateProfile, updatePassword, type ProfileUpdateData } from './actions'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

type Profile = {
  first_name: string | null
  last_name: string | null
  display_name: string
  bio: string | null
  experience_level: string | null
  shooting_interests: string[]
  camera_brands: string[]
  member_number: number
  membership_class: string | null
  membership_status: string
  role: string | null
}

const EXPERIENCE_OPTIONS = [
  'Beginner',
  'Enthusiast',
  'Advanced',
  'Semi-professional',
  'Professional',
]

export default function ProfileClient({ profile }: { profile: Profile }) {
  const [profileSaving, setProfileSaving]   = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError]     = useState<string | null>(null)

  const [pwSaving, setPwSaving]   = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError]     = useState<string | null>(null)

  // Profile form state
  const [firstName,    setFirstName]    = useState(profile.first_name    ?? '')
  const [lastName,     setLastName]     = useState(profile.last_name     ?? '')
  const [displayName,  setDisplayName]  = useState(profile.display_name)
  const [bio,          setBio]          = useState(profile.bio           ?? '')
  const [experience,   setExperience]   = useState(profile.experience_level ?? '')
  const [interestsRaw, setInterestsRaw] = useState(profile.shooting_interests.join(', '))
  const [camerasRaw,   setCamerasRaw]   = useState(profile.camera_brands.join(', '))

  // Password form state
  const [currentPw, setCurrentPw] = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) return

    setProfileSaving(true)
    setProfileError(null)
    setProfileSuccess(false)

    const data: ProfileUpdateData = {
      first_name:         firstName.trim(),
      last_name:          lastName.trim(),
      display_name:       displayName.trim(),
      bio:                bio.trim(),
      experience_level:   experience,
      shooting_interests: interestsRaw.split(',').map(s => s.trim()).filter(Boolean),
      camera_brands:      camerasRaw.split(',').map(s => s.trim()).filter(Boolean),
    }

    const { error } = await updateProfile(data)
    setProfileSaving(false)
    if (error) {
      setProfileError(error)
    } else {
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPw || !newPw) return
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match')
      return
    }
    if (newPw.length < 8) {
      setPwError('Password must be at least 8 characters')
      return
    }

    setPwSaving(true)
    setPwError(null)
    setPwSuccess(false)

    const { error } = await updatePassword(currentPw, newPw)
    setPwSaving(false)
    if (error) {
      setPwError(error)
    } else {
      setPwSuccess(true)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      setTimeout(() => setPwSuccess(false), 3000)
    }
  }

  const membershipStatusLabel: Record<string, string> = {
    pending:        'Pending',
    approved:       'Approved',
    active:         'Active',
    expired:        'Expired',
    paused:         'Paused',
    complimentary:  'Complimentary',
    banned:         'Banned',
    cancelled:      'Cancelled',
  }

  const statusColor: Record<string, string> = {
    active:        'bg-status-success-bg text-status-success-text',
    approved:      'bg-status-success-bg text-status-success-text',
    pending:       'bg-status-warning-bg text-status-warning-text',
    expired:       'bg-surface-1 text-content-tertiary',
    paused:        'bg-surface-1 text-content-tertiary',
    complimentary: 'bg-surface-1 text-content-secondary',
    banned:        'bg-status-error-bg text-status-error-text',
    cancelled:     'bg-surface-1 text-content-tertiary',
  }

  return (
    <div className="max-w-xl space-y-10">

      {/* Membership info (read-only) */}
      <section className="rounded-xl border border-border-default bg-surface-2 p-6">
        <h2 className="mb-4 text-base font-semibold text-content-primary">Membership</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-content-tertiary">Member #</dt>
            <dd className="mt-0.5 font-medium text-content-primary">
              {profile.member_number ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-content-tertiary">Status</dt>
            <dd className="mt-0.5">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor[profile.membership_status] ?? 'text-content-secondary'}`}>
                {membershipStatusLabel[profile.membership_status] ?? profile.membership_status}
              </span>
            </dd>
          </div>
          {profile.membership_class && (
            <div>
              <dt className="text-content-tertiary">Class</dt>
              <dd className="mt-0.5 capitalize text-content-primary">{profile.membership_class}</dd>
            </div>
          )}
          {profile.role === 'admin' && (
            <div>
              <dt className="text-content-tertiary">Role</dt>
              <dd className="mt-0.5 text-content-primary">Administrator</dd>
            </div>
          )}
        </dl>
      </section>

      {/* Profile form */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-content-primary">Personal info</h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-content-secondary mb-1.5">
                First name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-border-default bg-surface-1 px-3 py-2 text-sm text-content-primary placeholder-text-hint outline-none focus:border-action-primary focus:ring-0"
                placeholder="Jane"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-content-secondary mb-1.5">
                Last name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full rounded-lg border border-border-default bg-surface-1 px-3 py-2 text-sm text-content-primary placeholder-text-hint outline-none focus:border-action-primary focus:ring-0"
                placeholder="Smith"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-content-secondary mb-1.5">
              Display name <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              className="w-full rounded-lg border border-border-default bg-surface-1 px-3 py-2 text-sm text-content-primary placeholder-text-hint outline-none focus:border-action-primary focus:ring-0"
              placeholder="Jane Smith"
            />
            <p className="mt-1 text-xs text-content-tertiary">Shown to other members</p>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-content-secondary mb-1.5">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border-default bg-surface-1 px-3 py-2 text-sm text-content-primary placeholder-text-hint outline-none focus:border-action-primary focus:ring-0 resize-none"
              placeholder="A few words about your photography..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-content-secondary mb-1.5">
              Experience level
            </label>
            <FormControl fullWidth size="small">
              <Select
                value={experience}
                onChange={e => setExperience(e.target.value)}
                displayEmpty
              >
                <MenuItem value=""><em>Select level</em></MenuItem>
                {EXPERIENCE_OPTIONS.map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-content-secondary mb-1.5">
              Shooting interests
            </label>
            <input
              type="text"
              value={interestsRaw}
              onChange={e => setInterestsRaw(e.target.value)}
              className="w-full rounded-lg border border-border-default bg-surface-1 px-3 py-2 text-sm text-content-primary placeholder-text-hint outline-none focus:border-action-primary focus:ring-0"
              placeholder="Landscape, Portrait, Street..."
            />
            <p className="mt-1 text-xs text-content-tertiary">Comma-separated</p>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-content-secondary mb-1.5">
              Camera brands
            </label>
            <input
              type="text"
              value={camerasRaw}
              onChange={e => setCamerasRaw(e.target.value)}
              className="w-full rounded-lg border border-border-default bg-surface-1 px-3 py-2 text-sm text-content-primary placeholder-text-hint outline-none focus:border-action-primary focus:ring-0"
              placeholder="Canon, Sony..."
            />
            <p className="mt-1 text-xs text-content-tertiary">Comma-separated</p>
          </div>

          {profileError && (
            <p className="rounded-lg border border-status-error bg-status-error-bg px-4 py-2.5 text-sm text-status-error-text">
              {profileError}
            </p>
          )}
          {profileSuccess && (
            <p className="rounded-lg border border-status-success bg-status-success-bg px-4 py-2.5 text-sm text-status-success-text">
              Profile saved.
            </p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={profileSaving || !displayName.trim()}
              className="rounded-lg bg-action-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-action-primary-hover disabled:opacity-50"
            >
              {profileSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>

      {/* Password */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-content-primary">Change password</h2>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-content-secondary mb-1.5">
              Current password
            </label>
            <input
              type="password"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-border-default bg-surface-1 px-3 py-2 text-sm text-content-primary outline-none focus:border-action-primary focus:ring-0"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-content-secondary mb-1.5">
              New password
            </label>
            <input
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-lg border border-border-default bg-surface-1 px-3 py-2 text-sm text-content-primary outline-none focus:border-action-primary focus:ring-0"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-content-secondary mb-1.5">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-lg border border-border-default bg-surface-1 px-3 py-2 text-sm text-content-primary outline-none focus:border-action-primary focus:ring-0"
            />
          </div>

          {pwError && (
            <p className="rounded-lg border border-status-error bg-status-error-bg px-4 py-2.5 text-sm text-status-error-text">
              {pwError}
            </p>
          )}
          {pwSuccess && (
            <p className="rounded-lg border border-status-success bg-status-success-bg px-4 py-2.5 text-sm text-status-success-text">
              Password updated.
            </p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={pwSaving || !currentPw || !newPw || !confirmPw}
              className="rounded-lg bg-action-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-action-primary-hover disabled:opacity-50"
            >
              {pwSaving ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </section>

    </div>
  )
}

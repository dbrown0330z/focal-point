'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import type { Database } from '@/types/database'
import { TrashBtn } from '@/components/ui/TrashBtn'
import { setMemberStatus, approveMember, rejectMember, suspendMember, banMember, resignMember, makeAdmin, updateMemberName, deleteMember, setMemberSkillLevel, setMemberClassesEnabled, addMemberClass, renameMemberClass, deleteMemberClass } from './actions'

type MembershipStatus = Database['public']['Enums']['membership_status']
type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  display_name: string
  member_number: number
  membership_status: MembershipStatus
  membership_class: string | null
  role: Database['public']['Enums']['user_role'] | null
  created_at: string
  submission_count: number
  email: string | null
  bio: string | null
  camera_brands: string[]
  shooting_interests: string[]
  experience_level: string | null
  avatar_url: string | null
}

type Filter = 'all' | 'active' | 'pending' | 'expired'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<MembershipStatus, string> = {
  pending:       'Pending',
  approved:      'Awaiting payment',
  active:        'Active',
  expired:       'Expired',
  paused:        'Suspended',
  complimentary: 'Complimentary',
  banned:        'Banned',
  cancelled:     'Resigned',
}

const STATUS_STYLE: Record<MembershipStatus, { bgcolor: string; color: string }> = {
  active:        { bgcolor: 'success.light',       color: 'success.contrastText' },
  complimentary: { bgcolor: 'success.light',       color: 'success.contrastText' },
  pending:       { bgcolor: 'warning.light',       color: 'warning.contrastText' },
  approved:      { bgcolor: 'warning.light',       color: 'warning.contrastText' },
  banned:        { bgcolor: 'error.light',         color: 'error.contrastText'   },
  cancelled:     { bgcolor: 'background.default',  color: 'text.secondary'       },
  expired:       { bgcolor: 'background.default',  color: 'text.secondary'       },
  paused:        { bgcolor: 'background.default',  color: 'text.secondary'       },
}

const ACTIVE_STATUSES:  MembershipStatus[] = ['active', 'complimentary']
const PENDING_STATUSES: MembershipStatus[] = ['pending', 'approved']
const INACTIVE_STATUSES: MembershipStatus[] = ['expired', 'cancelled', 'paused', 'banned']

// ─── Class row ────────────────────────────────────────────────────────────────

function ClassRow({ cls, onRename, onDelete, disabled }: {
  cls:      { id: string; name: string }
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  disabled: boolean
}) {
  const [name, setName] = useState(cls.name)

  function handleBlur() {
    const trimmed = name.trim()
    if (!trimmed) { setName(cls.name); return }
    if (trimmed !== cls.name) onRename(cls.id, trimmed)
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <TextField
        size="small"
        value={name}
        onChange={e => setName(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={e => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
        disabled={disabled}
        sx={{ width: 220, '& .MuiInputBase-input': { fontSize: 13 } }}
      />
      <TrashBtn onClick={() => onDelete(cls.id)} disabled={disabled} />
    </Box>
  )
}

// ─── Member detail panel ──────────────────────────────────────────────────────

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
      <Typography sx={{ fontSize: 13, color: 'text.secondary', flexShrink: 0 }}>{label}</Typography>
      <Box sx={{ textAlign: 'right' }}>{children}</Box>
    </Box>
  )
}

function MemberPanel({
  member,
  onClose,
  onChangeStatus,
  onDelete,
  memberClasses,
  memberClassesEnabled,
}: {
  member: Profile
  onClose: () => void
  onChangeStatus: () => void
  onDelete: (name: string) => void
  memberClasses: { id: string; name: string }[]
  memberClassesEnabled: boolean
}) {
  const router = useRouter()
  const [editing, setEditing]           = useState(false)
  const [firstName, setFirstName]       = useState(member.first_name ?? '')
  const [lastName, setLastName]         = useState(member.last_name ?? '')
  const [saving, setSaving]             = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [skillLevel, setSkillLevel]     = useState(member.membership_class ?? '')
  const [savingLevel, setSavingLevel]   = useState(false)

  const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ') || '—'

  const hasProfileData = member.experience_level || member.camera_brands.length > 0 || member.shooting_interests.length > 0 || member.bio

  async function handleSaveName() {
    setSaving(true)
    await updateMemberName(member.id, firstName, lastName)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  function handleCancelEdit() {
    setFirstName(member.first_name ?? '')
    setLastName(member.last_name ?? '')
    setEditing(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteMember(member.id)
    setDeleting(false)
    setConfirmDelete(false)
    onDelete(fullName)
  }

  async function handleSkillLevelChange(value: string) {
    setSkillLevel(value)
    setSavingLevel(true)
    await setMemberSkillLevel(member.id, value || null)
    setSavingLevel(false)
    router.refresh()
  }

  return (
    <Box
      sx={{
        width: 288,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
          Member
        </Typography>
        <Button
          size="small"
          onClick={onClose}
          sx={{ minWidth: 0, p: 0.5, color: 'text.secondary' }}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        {/* Name + status */}
        {editing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <OutlinedInput
              size="small"
              fullWidth
              placeholder="First name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              autoFocus
            />
            <OutlinedInput
              size="small"
              fullWidth
              placeholder="Last name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSaveName()}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" size="small" onClick={handleSaveName} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="outlined" color="secondary" size="small" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1 }}>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                {fullName}
              </Typography>
              <Button
                size="small"
                onClick={() => setEditing(true)}
                sx={{ minWidth: 0, fontSize: 12, color: 'primary.main', p: 0, flexShrink: 0, mt: 0.25 }}
              >
                Edit
              </Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={STATUS_LABEL[member.membership_status]}
                size="small"
                sx={{ fontFamily: 'inherit', fontSize: 12, height: 24, ...STATUS_STYLE[member.membership_status] }}
              />
              <Button
                size="small"
                onClick={onChangeStatus}
                sx={{ minWidth: 0, fontSize: 12, color: 'primary.main', p: 0 }}
              >
                Change
              </Button>
            </Box>
          </Box>
        )}

        <Divider />

        {/* Core details */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <DetailRow label="Member ID">
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
              #{String(member.member_number).padStart(4, '0')}
            </Typography>
          </DetailRow>
          <DetailRow label="Date joined">
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary' }}>
              {new Date(member.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </Typography>
          </DetailRow>
          <DetailRow label="Submissions">
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary' }}>
              {member.submission_count}
            </Typography>
          </DetailRow>
          {memberClassesEnabled && (
            <DetailRow label="Skill level">
              <Select
                size="small"
                displayEmpty
                value={skillLevel}
                onChange={e => handleSkillLevelChange(e.target.value)}
                disabled={savingLevel}
                sx={{ fontSize: 13, minWidth: 120, height: 28, '.MuiSelect-select': { py: '4px' } }}
              >
                <MenuItem value="" sx={{ fontSize: 13 }}>
                  <Typography component="span" sx={{ fontSize: 13, color: 'text.disabled' }}>None</Typography>
                </MenuItem>
                {memberClasses.map(cls => (
                  <MenuItem key={cls.id} value={cls.name} sx={{ fontSize: 13 }}>{cls.name}</MenuItem>
                ))}
              </Select>
            </DetailRow>
          )}
        </Box>

        {/* Profile details — only when data exists */}
        {hasProfileData && (
          <>
            <Divider />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {member.experience_level && (
                <DetailRow label="Experience">
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', textTransform: 'capitalize' }}>
                    {member.experience_level}
                  </Typography>
                </DetailRow>
              )}
              {member.camera_brands.length > 0 && (
                <DetailRow label="Camera">
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary' }}>
                    {member.camera_brands.join(', ')}
                  </Typography>
                </DetailRow>
              )}
              {member.shooting_interests.length > 0 && (
                <DetailRow label="Interests">
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary' }}>
                    {member.shooting_interests.join(', ')}
                  </Typography>
                </DetailRow>
              )}
              {member.bio && (
                <Box>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 0.5 }}>Bio</Typography>
                  <Typography sx={{ fontSize: 13, color: 'text.primary', lineHeight: 1.6 }}>
                    {member.bio}
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}

        {/* Email button */}
        {member.email && (
          <>
            <Divider />
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              fullWidth
              href={`mailto:${member.email}`}
              component="a"
              startIcon={
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            >
              Email this member
            </Button>
          </>
        )}

        {/* Delete */}
        <Divider />
        <Button
          variant="outlined"
          size="small"
          fullWidth
          onClick={() => setConfirmDelete(true)}
          sx={{
            bgcolor: '#FDEEEE',
            color: '#7A1515',
            borderColor: 'rgba(211,47,47,0.3)',
            '&:hover': { bgcolor: '#F9D0D0', borderColor: 'rgba(211,47,47,0.5)' },
          }}
        >
          Delete member
        </Button>

      </Box>

      {/* Delete confirmation dialog */}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        <DialogTitle sx={{ pb: 0.5 }}>Delete member?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            <strong>{fullName}</strong>'s account, personal details, and any images not linked to a competition will be permanently deleted.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>
            Images submitted to competitions are retained and displayed as "Deleted member" to preserve the club's competition history. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setConfirmDelete(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={handleDelete}
            disabled={deleting}
            sx={{
              bgcolor: '#FDEEEE',
              color: '#7A1515',
              borderColor: 'rgba(211,47,47,0.3)',
              '&:hover': { bgcolor: '#F9D0D0', borderColor: 'rgba(211,47,47,0.5)' },
            }}
          >
            {deleting ? 'Deleting…' : 'Delete member'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MembersClient({
  profiles,
  memberClassesEnabled,
  memberClasses,
}: {
  profiles: Profile[]
  memberClassesEnabled: boolean
  memberClasses: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [filter, setFilter]               = useState<Filter>('all')
  const [search, setSearch]               = useState('')
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [manageMember, setManageMember]   = useState<Profile | null>(null)
  const [loading, setLoading]             = useState<string | null>(null)
  const [deleteToast, setDeleteToast]     = useState<string | null>(null)

  // ── Action dialogs ───────────────────────────────────────────────────────
  // Reject
  const [rejectTarget, setRejectTarget]   = useState<Profile | null>(null)
  const [rejectReason, setRejectReason]   = useState('')
  const [rejecting, setRejecting]         = useState(false)
  // Suspend
  const [suspendTarget, setSuspendTarget] = useState<Profile | null>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [suspending, setSuspending]       = useState(false)
  // Ban — two-step
  const [banTarget, setBanTarget]         = useState<Profile | null>(null)
  const [banStep, setBanStep]             = useState<1 | 2>(1)
  const [banConfirm, setBanConfirm]       = useState('')
  const [banning, setBanning]             = useState(false)
  // Resign
  const [resignTarget, setResignTarget]   = useState<Profile | null>(null)
  const [resigning, setResigning]         = useState(false)

  // ── Member classifications ───────────────────────────────────────────────
  const [classesEnabled, setClassesEnabled] = useState(memberClassesEnabled)
  const [classes, setClasses]               = useState(memberClasses)
  const [classAdding, setClassAdding]       = useState(false)
  const [newClassName, setNewClassName]     = useState('')
  const [classPending, startClass]          = useTransition()

  function handleToggleClasses(enabled: boolean) {
    setClassesEnabled(enabled)
    startClass(async () => { await setMemberClassesEnabled(enabled) })
  }

  function handleAddClass() {
    const name = newClassName.trim()
    if (!name) return
    startClass(async () => {
      const { id, error } = await addMemberClass(name)
      if (!error && id) {
        setClasses(prev => [...prev, { id, name }])
        setNewClassName('')
        setClassAdding(false)
      }
    })
  }

  function handleRenameClass(id: string, name: string) {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, name } : c))
    startClass(async () => { await renameMemberClass(id, name) })
  }

  function handleDeleteClass(id: string) {
    startClass(async () => {
      const { error } = await deleteMemberClass(id)
      if (!error) setClasses(prev => prev.filter(c => c.id !== id))
    })
  }

  const selectedMember = profiles.find(p => p.id === selectedMemberId) ?? null

  // Summary counts
  const totalCount   = profiles.length
  const pendingCount = profiles.filter(p => PENDING_STATUSES.includes(p.membership_status)).length
  const activeCount  = profiles.filter(p => ACTIVE_STATUSES.includes(p.membership_status)).length

  // Filtered rows
  const filtered = profiles
    .filter(p => {
      if (filter === 'active')  return ACTIVE_STATUSES.includes(p.membership_status)
      if (filter === 'pending') return PENDING_STATUSES.includes(p.membership_status)
      if (filter === 'expired') return INACTIVE_STATUSES.includes(p.membership_status)
      return true
    })
    .filter(p => {
      if (!search.trim()) return true
      const q = search.trim().toLowerCase()
      return (
        p.first_name?.toLowerCase().includes(q) ||
        p.last_name?.toLowerCase().includes(q)
      )
    })

  async function handleReject() {
    if (!rejectTarget || !rejectReason.trim()) return
    setRejecting(true)
    await rejectMember(rejectTarget.id, rejectReason.trim())
    setRejectTarget(null); setRejectReason(''); setRejecting(false)
    setSelectedMemberId(null)
    router.refresh()
  }

  async function handleSuspend() {
    if (!suspendTarget || !suspendReason.trim()) return
    setSuspending(true)
    await suspendMember(suspendTarget.id, suspendReason.trim())
    setSuspendTarget(null); setSuspendReason(''); setSuspending(false)
    setManageMember(null)
    router.refresh()
  }

  async function handleBan() {
    if (!banTarget || banConfirm.trim().toUpperCase() !== 'BAN') return
    setBanning(true)
    await banMember(banTarget.id)
    setBanTarget(null); setBanConfirm(''); setBanning(false); setBanStep(1)
    setManageMember(null)
    router.refresh()
  }

  async function handleResign() {
    if (!resignTarget) return
    setResigning(true)
    await resignMember(resignTarget.id)
    setResignTarget(null); setResigning(false)
    setManageMember(null)
    router.refresh()
  }

  function handleExport() {
    const headers = ['Status', 'First name', 'Last name', 'Member ID', 'Date joined', 'Class', 'Submissions']
    const rows = filtered.map(p => [
      STATUS_LABEL[p.membership_status],
      p.first_name ?? '',
      p.last_name ?? '',
      `#${String(p.member_number).padStart(4, '0')}`,
      new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      p.membership_class ?? '',
      String(p.submission_count),
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'members.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleSetStatus(memberId: string, status: MembershipStatus) {
    setLoading(memberId)
    await setMemberStatus(memberId, status)
    setManageMember(null)
    setLoading(null)
    router.refresh()
  }

  async function handleApprove(memberId: string) {
    setLoading(memberId)
    await approveMember(memberId)
    setManageMember(null)
    setLoading(null)
    router.refresh()
  }

  async function handleMakeAdmin(memberId: string) {
    setLoading(memberId)
    await makeAdmin(memberId)
    setManageMember(null)
    setLoading(null)
    router.refresh()
  }

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: 'all',     label: 'All',     count: totalCount   },
    { key: 'active',  label: 'Active',  count: activeCount  },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'expired', label: 'Expired', count: profiles.filter(p => INACTIVE_STATUSES.includes(p.membership_status)).length },
  ]

  const tableHeaders = [
    'Status', 'First name', 'Last name', 'Role',
    ...(classesEnabled ? ['Level'] : []),
    'Submissions', 'Date joined', '',
  ]

  return (
    <>
      {/* Page heading */}
      <Box sx={{ mb: 4 }}>
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Members</h1>
        <p className="mt-1 text-sm text-content-secondary">Manage membership applications and statuses.</p>
      </Box>

      {/* Summary cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 4 }}>
        {[
          { label: 'Total members',  value: totalCount,   color: 'text.primary'  },
          { label: 'Pending',        value: pendingCount, color: 'warning.main'  },
          { label: 'Active members', value: activeCount,  color: 'success.main'  },
        ].map(card => (
          <Card key={card.label} variant="outlined">
            <CardContent sx={{ p: '20px !important' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{card.label}</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: card.color }}>{card.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Filters + search */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Select
          size="small"
          value={filter}
          onChange={e => setFilter(e.target.value as Filter)}
          sx={{ fontSize: 13, minWidth: 180, fontFamily: 'inherit' }}
        >
          {FILTERS.map(f => (
            <MenuItem key={f.key} value={f.key} sx={{ fontSize: 13, fontFamily: 'inherit' }}>
              {f.label} ({f.count})
            </MenuItem>
          ))}
        </Select>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <OutlinedInput
            size="small"
            placeholder="Search by name"
            value={search}
            onChange={e => setSearch(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#7E8EA3' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
              </InputAdornment>
            }
            sx={{ width: 220 }}
          />
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            onClick={handleExport}
            startIcon={
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            }
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Table + side panel */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', flex: 1, minWidth: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {tableHeaders.map(h => (
                  <TableCell key={h} sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={tableHeaders.length} sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    No members found.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(profile => (
                <TableRow
                  key={profile.id}
                  hover
                  selected={profile.id === selectedMemberId}
                  sx={{ '&:last-child td': { borderBottom: 0 }, cursor: 'default' }}
                >
                  <TableCell sx={{ py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider', fontFamily: 'inherit' }}>
                    <Chip
                      label={STATUS_LABEL[profile.membership_status]}
                      size="small"
                      sx={{ fontFamily: 'inherit', fontSize: 11, height: 22, ...STATUS_STYLE[profile.membership_status] }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider', fontSize: 14, fontFamily: 'inherit' }}>{profile.first_name || '—'}</TableCell>
                  <TableCell sx={{ py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider', fontSize: 14, fontFamily: 'inherit' }}>{profile.last_name || '—'}</TableCell>
                  <TableCell sx={{ py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider', fontFamily: 'inherit' }}>
                    {profile.role === 'admin' ? (
                      <Chip
                        label="Admin"
                        size="small"
                        sx={{ fontFamily: 'inherit', fontSize: 11, height: 22, bgcolor: 'primary.light', color: 'primary.contrastText', fontWeight: 600 }}
                      />
                    ) : profile.role === 'member' ? (
                      <Typography sx={{ fontSize: 14, color: 'text.secondary', fontFamily: 'inherit' }}>Member</Typography>
                    ) : (
                      <Typography sx={{ fontSize: 14, color: 'text.disabled', fontFamily: 'inherit' }}>—</Typography>
                    )}
                  </TableCell>
                  {classesEnabled && (
                    <TableCell sx={{ py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider', fontSize: 14, fontFamily: 'inherit', color: 'text.secondary' }}>
                      {profile.membership_class || '—'}
                    </TableCell>
                  )}
                  <TableCell sx={{ py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider', fontSize: 14, fontFamily: 'inherit', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                    {profile.submission_count}
                  </TableCell>
                  <TableCell sx={{ py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider', fontSize: 14, fontFamily: 'inherit', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                    {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </TableCell>
                  <TableCell sx={{ py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider', fontFamily: 'inherit' }} align="right">
                    <Typography
                      component="button"
                      onClick={() => setSelectedMemberId(profile.id === selectedMemberId ? null : profile.id)}
                      sx={{ fontSize: 14, fontFamily: 'inherit', color: 'primary.main', background: 'none', border: 'none', cursor: 'pointer', p: 0, '&:hover': { textDecoration: 'underline' } }}
                    >
                      Manage
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {selectedMember && (
          <MemberPanel
            member={selectedMember}
            onClose={() => setSelectedMemberId(null)}
            onChangeStatus={() => setManageMember(selectedMember)}
            onDelete={(name) => {
              setSelectedMemberId(null)
              setDeleteToast(name)
              router.refresh()
            }}
            memberClasses={classes}
            memberClassesEnabled={classesEnabled}
          />
        )}
      </Box>

      {/* ── Manage member modal ──────────────────────────────────────────── */}
      <Dialog
        open={!!manageMember}
        onClose={() => setManageMember(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        {manageMember && (
          <>
            <DialogTitle component="div" sx={{ pb: 0.5 }}>
              <Typography variant="h3">
                {manageMember.first_name} {manageMember.last_name}
              </Typography>
              <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  #{String(manageMember.member_number).padStart(4, '0')}
                </Typography>
                <Chip
                  label={STATUS_LABEL[manageMember.membership_status]}
                  size="small"
                  sx={{ fontFamily: 'inherit', fontSize: 11, height: 20, ...STATUS_STYLE[manageMember.membership_status] }}
                />
              </Box>
            </DialogTitle>

            <DialogContent sx={{ pt: '16px !important' }}>
              {/* Pending: approve */}
              {PENDING_STATUSES.includes(manageMember.membership_status) && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 11 }}>
                    Approve
                  </Typography>
                  <Button fullWidth variant="contained" color="success" disabled={loading === manageMember.id}
                    onClick={() => handleApprove(manageMember.id)}
                    sx={{ mb: 1, justifyContent: 'flex-start', px: 2 }}>
                    Approve application
                  </Button>
                  <Button fullWidth variant="outlined" disabled={loading === manageMember.id}
                    onClick={() => { setRejectTarget(manageMember); setManageMember(null) }}
                    sx={{ mb: 2, justifyContent: 'flex-start', px: 2, color: 'error.main', borderColor: 'error.light', '&:hover': { borderColor: 'error.main', bgcolor: 'error.light' } }}>
                    Reject application
                  </Button>
                  <Divider sx={{ mb: 2 }} />
                </>
              )}

              {/* Inactive: reinstate */}
              {INACTIVE_STATUSES.includes(manageMember.membership_status) && manageMember.membership_status !== 'banned' && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 11 }}>
                    Reinstate
                  </Typography>
                  <Button fullWidth variant="contained" color="success" disabled={loading === manageMember.id}
                    onClick={() => handleSetStatus(manageMember.id, 'active')}
                    sx={{ mb: 2, justifyContent: 'flex-start', px: 2 }}>
                    Reinstate membership
                  </Button>
                  <Divider sx={{ mb: 2 }} />
                </>
              )}

              {/* Active: make admin + complimentary */}
              {manageMember.role !== 'admin' && ACTIVE_STATUSES.includes(manageMember.membership_status) && (
                <>
                  <Button fullWidth variant="outlined" color="secondary" disabled={loading === manageMember.id}
                    onClick={() => handleMakeAdmin(manageMember.id)}
                    sx={{ mb: 1, justifyContent: 'flex-start', px: 2 }}>
                    Make admin
                  </Button>
                  {manageMember.membership_status !== 'complimentary' && (
                    <Button fullWidth variant="outlined" color="secondary" disabled={loading === manageMember.id}
                      onClick={() => handleSetStatus(manageMember.id, 'complimentary')}
                      sx={{ mb: 2, justifyContent: 'flex-start', px: 2 }}>
                      Grant complimentary membership
                    </Button>
                  )}
                  <Divider sx={{ mb: 2 }} />
                </>
              )}

              {/* Status actions for active members */}
              {(ACTIVE_STATUSES.includes(manageMember.membership_status) || manageMember.membership_status === 'paused') && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 11 }}>
                    Restrict access
                  </Typography>
                  <Stack spacing={1}>
                    {manageMember.membership_status !== 'paused' && (
                      <Button fullWidth variant="outlined" disabled={loading === manageMember.id}
                        onClick={() => { setSuspendTarget(manageMember); setManageMember(null) }}
                        sx={{ justifyContent: 'flex-start', px: 2, color: 'warning.dark', borderColor: 'warning.light', '&:hover': { borderColor: 'warning.main', bgcolor: 'warning.light' } }}>
                        Suspend member
                      </Button>
                    )}
                    <Button fullWidth variant="outlined" disabled={loading === manageMember.id}
                      onClick={() => { setResignTarget(manageMember); setManageMember(null) }}
                      sx={{ justifyContent: 'flex-start', px: 2, color: 'text.secondary', borderColor: 'divider' }}>
                      Mark as resigned
                    </Button>
                    <Button fullWidth variant="outlined" disabled={loading === manageMember.id}
                      onClick={() => { setBanTarget(manageMember); setBanStep(1); setManageMember(null) }}
                      sx={{ justifyContent: 'flex-start', px: 2, color: 'error.main', borderColor: 'error.light', '&:hover': { borderColor: 'error.main', bgcolor: 'error.light' } }}>
                      Ban member
                    </Button>
                  </Stack>
                </>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setManageMember(null)} color="secondary" variant="outlined">Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Reject application dialog ─────────────────────────────────────── */}
      <Dialog open={!!rejectTarget} onClose={() => { setRejectTarget(null); setRejectReason('') }}
        maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        {rejectTarget && (
          <>
            <DialogTitle sx={{ pb: 0.5 }}>Reject application?</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                Rejecting will remove <strong>{[rejectTarget.first_name, rejectTarget.last_name].filter(Boolean).join(' ')}</strong>'s application and send them a notification email with your reason.
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 500 }}>
                Reason <Typography component="span" variant="body2" color="text.secondary">(required — included in email to applicant)</Typography>
              </Typography>
              <OutlinedInput
                fullWidth multiline rows={3} autoFocus
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. We are not accepting new members at this time."
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button variant="outlined" color="secondary" onClick={() => { setRejectTarget(null); setRejectReason('') }} disabled={rejecting}>
                Cancel
              </Button>
              <Button variant="outlined" onClick={handleReject} disabled={!rejectReason.trim() || rejecting}
                sx={{ color: 'error.main', borderColor: 'error.light', '&:hover': { borderColor: 'error.main', bgcolor: 'error.light' }, '&.Mui-disabled': { color: 'text.disabled', borderColor: 'divider' } }}>
                {rejecting ? 'Rejecting…' : 'Reject application'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Suspend member dialog ─────────────────────────────────────────── */}
      <Dialog open={!!suspendTarget} onClose={() => { setSuspendTarget(null); setSuspendReason('') }}
        maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        {suspendTarget && (
          <>
            <DialogTitle sx={{ pb: 0.5 }}>
              Suspend {suspendTarget.first_name}?
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                This will immediately revoke their access. You can reinstate them at any time.
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 500 }}>
                Reason <Typography component="span" variant="body2" color="text.secondary">(required — stored on record, not sent to member)</Typography>
              </Typography>
              <OutlinedInput
                fullWidth multiline rows={3} autoFocus
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                placeholder="Internal reason for suspension…"
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button variant="outlined" color="secondary" onClick={() => { setSuspendTarget(null); setSuspendReason('') }} disabled={suspending}>
                Cancel
              </Button>
              <Button variant="outlined" onClick={handleSuspend} disabled={!suspendReason.trim() || suspending}
                sx={{ color: 'warning.dark', borderColor: 'warning.light', '&:hover': { borderColor: 'warning.main', bgcolor: 'warning.light' }, '&.Mui-disabled': { color: 'text.disabled', borderColor: 'divider' } }}>
                {suspending ? 'Suspending…' : 'Suspend member'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Ban member dialog (two-step) ──────────────────────────────────── */}
      <Dialog open={!!banTarget} onClose={() => { setBanTarget(null); setBanConfirm(''); setBanStep(1) }}
        maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        {banTarget && banStep === 1 && (
          <>
            <DialogTitle sx={{ pb: 0.5 }}>Ban {banTarget.first_name}?</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Banning is permanent. They will lose access immediately and cannot reapply.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button variant="outlined" color="secondary" onClick={() => { setBanTarget(null); setBanStep(1) }}>Cancel</Button>
              <Button variant="outlined" onClick={() => setBanStep(2)}
                sx={{ color: 'error.main', borderColor: 'error.light', '&:hover': { borderColor: 'error.main', bgcolor: 'error.light' } }}>
                Continue →
              </Button>
            </DialogActions>
          </>
        )}
        {banTarget && banStep === 2 && (
          <>
            <DialogTitle sx={{ pb: 0.5 }}>Are you sure you want to ban {banTarget.first_name}?</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                This cannot be undone.
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 500 }}>
                Type <strong>BAN</strong> to confirm:
              </Typography>
              <OutlinedInput
                fullWidth autoFocus
                value={banConfirm}
                onChange={e => setBanConfirm(e.target.value)}
                placeholder="BAN"
                inputProps={{ style: { letterSpacing: '0.1em', fontWeight: 700 } }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button variant="outlined" color="secondary" onClick={() => { setBanTarget(null); setBanConfirm(''); setBanStep(1) }} disabled={banning}>
                Cancel
              </Button>
              <Button variant="contained" color="error" onClick={handleBan}
                disabled={banConfirm.trim().toUpperCase() !== 'BAN' || banning}>
                {banning ? 'Banning…' : 'Permanently ban'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Mark as resigned dialog ───────────────────────────────────────── */}
      <Dialog open={!!resignTarget} onClose={() => setResignTarget(null)}
        maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        {resignTarget && (
          <>
            <DialogTitle sx={{ pb: 0.5 }}>Mark as resigned?</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                <strong>{[resignTarget.first_name, resignTarget.last_name].filter(Boolean).join(' ')}</strong>'s membership will be marked as resigned and their access removed.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button variant="outlined" color="secondary" onClick={() => setResignTarget(null)} disabled={resigning}>
                Cancel
              </Button>
              <Button variant="outlined" onClick={handleResign} disabled={resigning}
                sx={{ color: 'text.secondary', borderColor: 'divider' }}>
                {resigning ? 'Saving…' : 'Mark as resigned'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Member classifications ──────────────────────────────────────── */}
      <Box sx={{ mt: 6 }}>
        <Typography sx={{ fontSize: 17, fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
          Member classifications
        </Typography>
        <FormHelperText sx={{ mx: 0, mb: 2, lineHeight: 1.5, color: 'text.disabled', maxWidth: 600 }}>
          Skill levels let you track member progression. When enabled, a level column appears in
          the member table and admins can assign a level from each member&apos;s profile panel.
        </FormHelperText>
        <Paper variant="outlined" sx={{ px: 3, py: '20px', maxWidth: 700 }}>

          {/* Enable toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: classesEnabled ? 2.5 : 0 }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
                Enable skill level classifications
              </Typography>
              {!classesEnabled && (
                <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>
                  Off — no levels shown on member profiles or table.
                </Typography>
              )}
            </Box>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={classesEnabled}
                  onChange={e => handleToggleClasses(e.target.checked)}
                  disabled={classPending}
                />
              }
              label=""
              sx={{ m: 0 }}
            />
          </Box>

          {classesEnabled && (
            <>
              <Divider sx={{ mb: 2.5 }} />

              {/* Class list */}
              {classes.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Stack spacing={1.5}>
                    {classes.map(cls => (
                      <ClassRow
                        key={cls.id}
                        cls={cls}
                        onRename={handleRenameClass}
                        onDelete={handleDeleteClass}
                        disabled={classPending || classes.length <= 1}
                      />
                    ))}
                  </Stack>
                  <Divider sx={{ mt: 2 }} />
                </Box>
              )}

              {/* Add class form */}
              {classAdding ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 360, mt: 1.5 }}>
                  <TextField
                    size="small" fullWidth autoFocus
                    placeholder="Class name e.g. Class A"
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddClass())}
                    disabled={classPending}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained" size="small"
                      disabled={!newClassName.trim() || classPending}
                      onClick={handleAddClass}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined" color="secondary" size="small"
                      disabled={classPending}
                      onClick={() => { setNewClassName(''); setClassAdding(false) }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Button
                  variant="outlined" color="secondary" size="small"
                  sx={{ mt: 1.5 }}
                  onClick={() => setClassAdding(true)}
                >
                  + Add class
                </Button>
              )}
            </>
          )}
        </Paper>
      </Box>

      {/* Delete toast */}
      <Snackbar
        open={!!deleteToast}
        autoHideDuration={4000}
        onClose={() => setDeleteToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setDeleteToast(null)} sx={{ fontFamily: 'inherit' }}>
          {deleteToast} has been deleted.
        </Alert>
      </Snackbar>
    </>
  )
}

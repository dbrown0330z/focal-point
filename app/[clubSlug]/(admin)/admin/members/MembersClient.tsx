'use client'

import React, { useState, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  SelectChangeEvent,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import type { Database } from '@/types/database'
import { TrashBtn } from '@/components/ui/TrashBtn'
import { skillLabel } from '@/lib/profile-options'
import {
  setMemberStatus,
  approveMember,
  rejectMember,
  suspendMember,
  banMember,
  resignMember,
  makeAdmin,
  updateMemberName,
  deleteMember,
  setMemberSkillLevel,
  setMemberClassesEnabled,
  addMemberClass,
  renameMemberClass,
  deleteMemberClass,
  setMemberPermission,
  removeAdminRole,
  sendPasswordReset,
  updateMemberEmail,
} from './actions'

type MembershipStatus = Database['public']['Enums']['membership_status']
type PermissionKey = 'perm_competition_manager' | 'perm_event_manager' | 'perm_comms_manager'

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
  location: string | null
  phone: string | null
  perm_competition_manager: boolean
  perm_event_manager: boolean
  perm_comms_manager: boolean
  pref_competition_reminders: boolean
  pref_results_notifications: boolean
  pref_club_newsletter: boolean
  pref_public_profile: boolean
  pref_show_scores_publicly: boolean
  pref_show_in_directory: boolean
  submission_count_this_year: number
  competitions_this_year: number
  submission_categories: Record<string, number>
  avg_score: number | null
  highest_score: number | null
  lowest_score: number | null
  last_login: string | null
}

type Filter  = 'all' | 'active' | 'pending' | 'expired'
type SortKey = 'status' | 'first_name' | 'last_name' | 'role' | 'level' | 'engagement' | 'last_login'

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
  active:        { bgcolor: 'success.light', color: 'success.contrastText' },
  complimentary: { bgcolor: '#D8DDE7',       color: '#3E5066' },
  pending:       { bgcolor: '#D8DDE7',       color: '#3E5066' },
  approved:      { bgcolor: '#D8DDE7',       color: '#3E5066' },
  banned:        { bgcolor: '#D8DDE7',       color: '#3E5066' },
  cancelled:     { bgcolor: '#D8DDE7',       color: '#3E5066' },
  expired:       { bgcolor: '#D8DDE7',       color: '#3E5066' },
  paused:        { bgcolor: '#D8DDE7',       color: '#3E5066' },
}

const ACTIVE_STATUSES:   MembershipStatus[] = ['active', 'complimentary']
const PENDING_STATUSES:  MembershipStatus[] = ['pending', 'approved']
const INACTIVE_STATUSES: MembershipStatus[] = ['expired', 'cancelled', 'paused', 'banned']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(first: string | null, last: string | null): string {
  return [(first ?? '').charAt(0), (last ?? '').charAt(0)].filter(Boolean).join('').toUpperCase() || '?'
}

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatLastLogin(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  )
}

// ─── StatusSelect ─────────────────────────────────────────────────────────────

type StatusAction =
  | { kind: 'approve' }
  | { kind: 'reject' }
  | { kind: 'suspend' }
  | { kind: 'ban' }
  | { kind: 'resign' }
  | { kind: 'setStatus'; status: MembershipStatus }

interface StatusOption {
  value: string
  label: string
  action: StatusAction
  disabled?: boolean
}

function getStatusOptions(status: MembershipStatus): StatusOption[] {
  if (PENDING_STATUSES.includes(status)) {
    return [
      { value: '__current__', label: STATUS_LABEL[status], action: { kind: 'setStatus', status }, disabled: true },
      { value: '__approve__', label: 'Approve',  action: { kind: 'approve' } },
      { value: '__reject__',  label: 'Reject',   action: { kind: 'reject'  } },
    ]
  }
  if (ACTIVE_STATUSES.includes(status)) {
    return [
      { value: '__current__', label: STATUS_LABEL[status],        action: { kind: 'setStatus', status }, disabled: true },
      { value: '__suspend__', label: 'Suspend…',                   action: { kind: 'suspend' } },
      { value: '__resign__',  label: 'Mark as resigned…',          action: { kind: 'resign'  } },
      { value: '__ban__',     label: 'Ban…',                       action: { kind: 'ban'     } },
      { value: '__expired__', label: 'Set as expired',             action: { kind: 'setStatus', status: 'expired' } },
    ]
  }
  if (status === 'paused') {
    return [
      { value: '__current__',   label: 'Suspended',               action: { kind: 'setStatus', status }, disabled: true },
      { value: '__reinstate__', label: 'Reinstate',               action: { kind: 'setStatus', status: 'active' } },
      { value: '__resign__',    label: 'Mark as resigned…',       action: { kind: 'resign'  } },
      { value: '__ban__',       label: 'Ban…',                    action: { kind: 'ban'     } },
    ]
  }
  // inactive
  const opts: StatusOption[] = [
    { value: '__current__', label: STATUS_LABEL[status], action: { kind: 'setStatus', status }, disabled: true },
  ]
  if (status !== 'banned') {
    opts.push({ value: '__reinstate__', label: 'Reinstate', action: { kind: 'setStatus', status: 'active' } })
  }
  return opts
}

// ─── ClassRow ─────────────────────────────────────────────────────────────────

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

// ─── Layout / content helpers ─────────────────────────────────────────────────

// Section panel — white background tile, large heading, no border outline
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: '20px 22px' }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
        <Typography sx={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: 'text.primary', lineHeight: 1.2 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>{subtitle}</Typography>
        )}
      </Box>
      {children}
    </Box>
  )
}

// Bold sub-section label used inside Section (Personal Info, Communications, etc.)
function SubHead({ title }: { title: string }) {
  return (
    <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mt: 0.5, mb: 0.875 }}>
      {title}
    </Typography>
  )
}

// Single preference line rendered as "Label — Yes / No"
function PrefLine({ label, value }: { label: string; value: boolean }) {
  return (
    <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.7 }}>
      {label}
      <Typography component="span" sx={{ fontWeight: 600, color: value ? 'success.main' : 'text.disabled', ml: 0.5 }}>
        — {value ? 'Yes' : 'No'}
      </Typography>
    </Typography>
  )
}

// Radio circle used in the Admin / Member role selector
function RadioCircle({ selected }: { selected: boolean }) {
  return (
    <Box sx={{
      width: 22, height: 22, borderRadius: '50%', flexShrink: 0, mt: 0.3,
      border: '2.5px solid', borderColor: selected ? 'primary.main' : '#B0BACA',
      bgcolor: selected ? 'primary.main' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {selected && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#fff' }} />}
    </Box>
  )
}

// ─── Engagement level ─────────────────────────────────────────────────────────

function getEngagement(competitionsThisYear: number) {
  if (competitionsThisYear >= 3) return { label: 'High',   bgcolor: 'success.light', color: 'success.contrastText', dot: 'success.main' } as const
  if (competitionsThisYear >= 1) return { label: 'Medium', bgcolor: 'warning.light', color: 'warning.contrastText', dot: 'warning.main' } as const
  return                                { label: 'Low',    bgcolor: 'error.light',   color: 'error.contrastText',   dot: 'error.main'   } as const
}


// ─── Submission donut chart ───────────────────────────────────────────────────

const DONUT_COLORS = ['#1E4D8C', '#0097A7', '#6C47D4', '#E65100', '#00796B', '#AD1457', '#7B6B38']

function SubmissionDonut({ categories }: { categories: Record<string, number> }) {
  const entries = Object.entries(categories).filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)

  if (entries.length === 0) {
    return <Typography sx={{ fontSize: 24, fontWeight: 700, color: 'text.disabled', lineHeight: 1, mt: 0.5 }}>—</Typography>
  }

  const total = entries.reduce((sum, [, v]) => sum + v, 0)
  const cx = 34, cy = 34, r = 25, sw = 9

  let cumAngle = -Math.PI / 2
  const segments = entries.map(([name, count], i) => {
    const slice = (count / total) * 2 * Math.PI
    if (entries.length === 1) return { name, count, color: DONUT_COLORS[i % DONUT_COLORS.length], path: null }
    const x1 = cx + r * Math.cos(cumAngle)
    const y1 = cy + r * Math.sin(cumAngle)
    cumAngle += slice
    const x2 = cx + r * Math.cos(cumAngle)
    const y2 = cy + r * Math.sin(cumAngle)
    return {
      name, count, color: DONUT_COLORS[i % DONUT_COLORS.length],
      path: `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${slice > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    }
  })

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.75 }}>
      <Box sx={{ flexShrink: 0 }}>
        <svg width="68" height="68" viewBox="0 0 68 68">
          {entries.length === 1 ? (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={DONUT_COLORS[0]} strokeWidth={sw} />
          ) : (
            segments.map((s, i) => s.path && (
              <path key={i} d={s.path} fill="none" stroke={s.color} strokeWidth={sw} />
            ))
          )}
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
            fontSize="12" fontWeight="700" fill="currentColor">{total}</text>
        </svg>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
        {segments.map((s, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.625, mb: 0.375 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 11, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
              {s.name}
              <Typography component="span" sx={{ fontSize: 11, fontWeight: 700, color: 'text.primary', ml: 0.5 }}>{s.count}</Typography>
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

// ─── Membership donut chart (page-level) ─────────────────────────────────────

// Statuses grouped into the "Other" bucket
const OTHER_STATUSES: MembershipStatus[] = ['complimentary', 'paused', 'banned', 'cancelled']

interface SliceDef { key: string; label: string; color: string; statuses: MembershipStatus[] }
const SLICE_DEFS: SliceDef[] = [
  { key: 'active',   label: 'Active',          color: '#2E7D32', statuses: ['active'] },
  { key: 'pending',  label: 'Pending',          color: '#A67C00', statuses: ['pending'] },
  { key: 'approved', label: 'Awaiting payment', color: '#7B6B38', statuses: ['approved'] },
  { key: 'expired',  label: 'Expired',          color: '#7E8EA3', statuses: ['expired'] },
  { key: 'other',    label: 'Other',            color: '#5A6C82', statuses: OTHER_STATUSES },
]

// Breakdown list used in the "Other" tooltip
function OtherBreakdown({ profiles }: { profiles: Profile[] }) {
  const items = OTHER_STATUSES
    .map(s => ({ label: STATUS_LABEL[s], count: profiles.filter(p => p.membership_status === s).length }))
    .filter(x => x.count > 0)
  if (items.length === 0) return <Typography sx={{ fontSize: 12 }}>None</Typography>
  return (
    <Box sx={{ minWidth: 140 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.75, opacity: 0.75 }}>Other includes:</Typography>
      {items.map(({ label, count }) => (
        <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography sx={{ fontSize: 12 }}>{label}</Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{count}</Typography>
        </Box>
      ))}
    </Box>
  )
}

function MembershipDonut({ profiles }: { profiles: Profile[] }) {
  const slices = SLICE_DEFS.map(def => ({
    ...def,
    count: def.statuses.reduce((sum, s) => sum + profiles.filter(p => p.membership_status === s).length, 0),
  }))

  const total    = profiles.length
  const nonEmpty = slices.filter(s => s.count > 0)
  const cx = 74, cy = 74, r = 56, sw = 16, size = 148

  let cumAngle = -Math.PI / 2
  const segments = nonEmpty.map(s => {
    const slice = (s.count / Math.max(total, 1)) * 2 * Math.PI
    if (nonEmpty.length === 1) return { ...s, path: null }
    const gap = 0.020
    const x1 = cx + r * Math.cos(cumAngle + gap)
    const y1 = cy + r * Math.sin(cumAngle + gap)
    cumAngle += slice
    const x2 = cx + r * Math.cos(cumAngle - gap)
    const y2 = cy + r * Math.sin(cumAngle - gap)
    return {
      ...s,
      path: `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${slice > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    }
  })

  // Shared tooltip style — light card appearance so text is readable
  const ttSx = {
    bgcolor: 'background.paper',
    color: 'text.primary',
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: 4,
    p: 1.5,
    borderRadius: 1.5,
  }

  // Legend columns: col1 = Active/Pending/Expired, col2 = Awaiting payment/Other
  const col1Keys = ['active', 'pending', 'expired']
  const col2Keys = ['approved', 'other']
  const col1 = slices.filter(s => col1Keys.includes(s.key))
  const col2 = slices.filter(s => col2Keys.includes(s.key))

  function LegendItem({ s }: { s: typeof slices[number] }) {
    const isOther = s.key === 'other'
    const row = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875, cursor: isOther ? 'help' : 'default' }}>
        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: s.color, flexShrink: 0, opacity: s.count === 0 ? 0.22 : 1 }} />
        <Typography sx={{ fontSize: 13, color: s.count === 0 ? 'text.disabled' : 'text.secondary', lineHeight: 1.3 }}>
          {s.label}{' '}
          <Typography component="span" sx={{ fontWeight: 700, color: s.count === 0 ? 'text.disabled' : 'text.primary' }}>
            {s.count}
          </Typography>
        </Typography>
      </Box>
    )
    return isOther ? (
      <Tooltip
        title={<OtherBreakdown profiles={profiles} />}
        placement="right"
        arrow
        slotProps={{ tooltip: { sx: ttSx }, arrow: { sx: { color: 'background.paper' } } }}
      >
        {row}
      </Tooltip>
    ) : row
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>

      {/* Donut SVG */}
      <Box sx={{ flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {nonEmpty.length === 0 ? (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#D8DDE7" strokeWidth={sw} />
          ) : nonEmpty.length === 1 ? (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={nonEmpty[0].color} strokeWidth={sw} />
          ) : (
            segments.map((s, i) => {
              if (!s.path) return null
              const isOther = s.key === 'other'
              const arc = (
                <g key={i} style={{ cursor: isOther ? 'help' : 'default' }}>
                  <path d={s.path} fill="none" stroke={s.color} strokeWidth={sw} />
                  <path d={s.path} fill="none" stroke="transparent" strokeWidth={sw * 3} />
                </g>
              )
              return isOther ? (
                <Tooltip
                  key={i}
                  title={<OtherBreakdown profiles={profiles} />}
                  placement="right"
                  arrow
                  slotProps={{ tooltip: { sx: ttSx }, arrow: { sx: { color: 'background.paper' } } }}
                >
                  {arc}
                </Tooltip>
              ) : arc
            })
          )}
          <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="middle"
            fontSize="32" fontWeight="700" fill="currentColor">{total}</text>
          <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle"
            fontSize="11" fill="#7E8EA3">members</text>
        </svg>
      </Box>

      {/* Legend — 2 columns */}
      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'start', gap: 0 }}>
        {/* Column 1: Active, Pending, Expired */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {col1.map(s => <LegendItem key={s.key} s={s} />)}
        </Box>
        {/* Column 2: Awaiting payment, Other */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {col2.map(s => <LegendItem key={s.key} s={s} />)}
        </Box>
      </Box>

    </Box>
  )
}

// ─── Member modal ─────────────────────────────────────────────────────────────

interface MemberModalProps {
  member: Profile
  open: boolean
  onClose: () => void
  memberClasses: { id: string; name: string }[]
  memberClassesEnabled: boolean
  totalCompetitionsThisYear: number
  totalPossibleImagesThisYear: number
  clubSlug: string
  // Status action callbacks — close modal first, then trigger dialog
  onStatusAction: (action: StatusAction, member: Profile) => void
  // Delete callback
  onDeleteSuccess: (name: string) => void
}

function MemberModal({
  member,
  open,
  onClose,
  memberClasses,
  memberClassesEnabled,
  totalCompetitionsThisYear,
  totalPossibleImagesThisYear,
  clubSlug,
  onStatusAction,
  onDeleteSuccess,
}: MemberModalProps) {
  const router = useRouter()

  // Edit name (inline in header)
  const [editing, setEditing]     = useState(false)
  const [firstName, setFirstName] = useState(member.first_name ?? '')
  const [lastName, setLastName]   = useState(member.last_name ?? '')
  const [saving, setSaving]       = useState(false)

  // Edit email
  const [editingEmail, setEditingEmail] = useState(false)
  const [newEmail, setNewEmail]         = useState(member.email ?? '')
  const [emailSaving, setEmailSaving]   = useState(false)
  const [emailError, setEmailError]     = useState<string | null>(null)

  // Skill level
  const [skillLevel, setSkillLevel]   = useState(member.membership_class ?? '')
  const [savingLevel, setSavingLevel] = useState(false)

  // Delete
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]           = useState(false)

  // Permissions + status — staged locally, only written on "Save changes"
  // If the member already has role='admin', treat all three perm bits as ON
  // regardless of what's stored — admins predating the perm columns won't
  // have those bits set but the toggle should still reflect their access level.
  const isAdminRole = member.role === 'admin'
  const initPerm = (bit: boolean) => bit || isAdminRole

  const [permCompetition, setPermCompetition] = useState(() => initPerm(member.perm_competition_manager))
  const [permEvent, setPermEvent]             = useState(() => initPerm(member.perm_event_manager))
  const [permComms, setPermComms]             = useState(() => initPerm(member.perm_comms_manager))
  const [pendingStatus, setPendingStatus]     = useState<MembershipStatus | null>(null)
  const [pendingRole, setPendingRole]         = useState<'admin' | 'member' | null>(null)
  const [resetSending, setResetSending]       = useState(false)
  const [resetSent, setResetSent]             = useState(false)

  const effectiveStatus = pendingStatus ?? member.membership_status
  const savedRole: 'admin' | 'member' = member.role === 'admin' ? 'admin' : 'member'
  const effectiveRole: 'admin' | 'member' = pendingRole ?? savedRole
  // Use the same "effective original" values so opening an admin member doesn't
  // immediately show the unsaved indicator
  const origCompetition = initPerm(member.perm_competition_manager)
  const origEvent       = initPerm(member.perm_event_manager)
  const origComms       = initPerm(member.perm_comms_manager)
  const permsChanged    = effectiveRole === 'member' && (
                            permCompetition !== origCompetition ||
                            permEvent       !== origEvent       ||
                            permComms       !== origComms)
  const hasUnsaved      = editing || permsChanged || pendingStatus !== null || pendingRole !== null
  const fullName        = [member.first_name, member.last_name].filter(Boolean).join(' ') || '—'
  const memberNum       = `#${String(member.member_number).padStart(4, '0')}`
  const showPermissions = member.role === 'member' || member.role === 'admin'

  // Reset all staged state when a DIFFERENT member is opened.
  // Keying on member.id (not the object reference) prevents the implicit
  // router.refresh() after a server action from clearing in-flight UI state
  // (e.g. resetSent) when the same member's data object is replaced by a new
  // reference in the refreshed profiles array.
  React.useEffect(() => {
    setEditing(false)
    setFirstName(member.first_name ?? '')
    setLastName(member.last_name ?? '')
    setSkillLevel(member.membership_class ?? '')
    setPermCompetition(initPerm(member.perm_competition_manager))
    setPermEvent(initPerm(member.perm_event_manager))
    setPermComms(initPerm(member.perm_comms_manager))
    setPendingStatus(null)
    setPendingRole(null)
    setResetSent(false)
    setEditingEmail(false)
    setNewEmail(member.email ?? '')
    setEmailError(null)
  }, [member.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleEmailSave() {
    const trimmed = newEmail.trim().toLowerCase()
    if (!trimmed || trimmed === member.email) { setEditingEmail(false); return }
    setEmailSaving(true)
    setEmailError(null)
    const { error } = await updateMemberEmail(member.id, trimmed)
    setEmailSaving(false)
    if (error) { setEmailError(error); return }
    setEditingEmail(false)
    router.refresh()
  }

  async function handleSaveName() {
    setSaving(true)
    await updateMemberName(member.id, firstName, lastName)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  async function handleSkillLevelChange(value: string) {
    setSkillLevel(value)
    setSavingLevel(true)
    await setMemberSkillLevel(member.id, value || null)
    setSavingLevel(false)
    router.refresh()
  }

  // Permission toggles are local-only — changes are staged and only written on Save
  function handlePermissionToggle(key: PermissionKey, value: boolean) {
    if (key === 'perm_competition_manager') setPermCompetition(value)
    if (key === 'perm_event_manager')       setPermEvent(value)
    if (key === 'perm_comms_manager')       setPermComms(value)
  }

  function handleRoleSelect(role: 'admin' | 'member') {
    setPendingRole(role === savedRole ? null : role)
  }

  async function handleSendPasswordReset() {
    setResetSending(true)
    await sendPasswordReset(member.id)
    setResetSending(false)
    setResetSent(true)
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteMember(member.id)
    setDeleting(false)
    setConfirmDelete(false)
    onDeleteSuccess(fullName)
    onClose()
  }

  function handleStatusChange(e: SelectChangeEvent<string>) {
    const chosen = getStatusOptions(member.membership_status).find(o => o.value === e.target.value)
    if (!chosen || chosen.disabled) return
    // Simple status change → stage it; dialog-based actions fire immediately (they have their own confirmation)
    if (chosen.action.kind === 'setStatus') {
      setPendingStatus(chosen.action.status === member.membership_status ? null : chosen.action.status)
    } else {
      onStatusAction(chosen.action, member)
    }
  }

  async function handleFooterSave() {
    setSaving(true)
    const saves: Promise<unknown>[] = []

    // Flush name edit
    if (editing) saves.push(updateMemberName(member.id, firstName, lastName))

    // Flush in-progress email edit (user may not have clicked the inline Save)
    if (editingEmail) {
      const trimmed = newEmail.trim().toLowerCase()
      if (trimmed && trimmed !== member.email) {
        saves.push(updateMemberEmail(member.id, trimmed))
      }
    }

    // Flush staged status change
    if (pendingStatus) saves.push(setMemberStatus(member.id, pendingStatus))

    // Flush role change (Admin ↔ Member segmented control)
    if (pendingRole !== null) {
      if (pendingRole === 'admin' && !isAdminRole) saves.push(makeAdmin(member.id))
      if (pendingRole === 'member' && isAdminRole) saves.push(removeAdminRole(member.id))
    }

    // Flush individual permission changes (only relevant when role stays as member)
    if (permsChanged && effectiveRole === 'member') {
      if (permCompetition !== member.perm_competition_manager)
        saves.push(setMemberPermission(member.id, 'perm_competition_manager', permCompetition))
      if (permEvent !== member.perm_event_manager)
        saves.push(setMemberPermission(member.id, 'perm_event_manager', permEvent))
      if (permComms !== member.perm_comms_manager)
        saves.push(setMemberPermission(member.id, 'perm_comms_manager', permComms))
    }

    if (saves.length) {
      await Promise.all(saves)
      router.refresh()
    }

    setSaving(false)
    setEditing(false)
    setEditingEmail(false)
    onClose()
  }

  function handleFooterCancel() {
    // Revert any staged changes
    setFirstName(member.first_name ?? '')
    setLastName(member.last_name ?? '')
    setEditing(false)
    setPermCompetition(initPerm(member.perm_competition_manager))
    setPermEvent(initPerm(member.perm_event_manager))
    setPermComms(initPerm(member.perm_comms_manager))
    setPendingStatus(null)
    setPendingRole(null)
    onClose()
  }

  const statusOptions = getStatusOptions(member.membership_status)
  const hasProfile    = !!(member.experience_level || member.camera_brands.length ||
    member.shooting_interests.length || member.location || member.bio)

  const PERM_ROWS = [
    { key: 'perm_event_manager'       as PermissionKey, label: 'Event Manager',        desc: 'Create and edit events from the calendar page', value: permEvent,
      icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M2 6h12M5.5 1.5v3M10.5 1.5v3" strokeLinecap="round"/></svg> },
    { key: 'perm_competition_manager' as PermissionKey, label: 'Competition Manager', desc: 'Create, edit and manage competitions from the admin area', value: permCompetition,
      icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M8 2l1.5 3.5L13 6l-2.5 2.5.5 3.5L8 10.5 5 12l.5-3.5L3 6l3.5-.5L8 2z" strokeLinejoin="round"/></svg> },
    { key: 'perm_comms_manager'       as PermissionKey, label: 'Communication Manager', desc: 'Send messages to club members from the admin area', value: permComms,
      icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M14 2H2v9h5l1 3 1-3h5V2z" strokeLinejoin="round"/></svg> },
  ] as const

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 2, overflow: 'hidden' } } }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <DialogTitle
        component="div"
        sx={{ px: '30px', pt: '24px', pb: '20px', borderBottom: '2px solid', borderColor: 'divider', bgcolor: 'background.default' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>

          {/* Avatar + status dot */}
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              src={member.avatar_url ?? undefined}
              sx={{ width: 72, height: 72, fontSize: 26, fontWeight: 700, bgcolor: 'primary.light', color: 'primary.contrastText' }}
            >
              {!member.avatar_url && getInitials(member.first_name, member.last_name)}
            </Avatar>
            {ACTIVE_STATUSES.includes(member.membership_status) && (
              <Box sx={{
                position: 'absolute', bottom: 2, right: 2,
                width: 14, height: 14, borderRadius: '50%',
                bgcolor: '#22c55e',
                border: '2.5px solid #fff',
                boxShadow: '0 0 0 1px rgba(34,197,94,0.35)',
              }} />
            )}
          </Box>

          {/* Identity */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Name row */}
            {editing ? (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.75, flexWrap: 'wrap' }}>
                <OutlinedInput size="small" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} autoFocus
                  sx={{ width: 136, '& .MuiInputBase-input': { fontSize: 14 } }} />
                <OutlinedInput size="small" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') handleFooterSave() }}
                  sx={{ width: 136, '& .MuiInputBase-input': { fontSize: 14 } }} />
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontStyle: 'italic' }}>Click Save to confirm</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, '&:hover .edit-name-btn': { opacity: 1 } }}>
                  <Typography sx={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'text.primary', lineHeight: 1.15 }}>
                    {fullName}
                  </Typography>
                  <Tooltip title="Edit name">
                    <IconButton className="edit-name-btn" size="small" onClick={() => setEditing(true)}
                      sx={{ opacity: 0, transition: 'opacity 0.15s', p: 0.5, color: 'text.secondary' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </IconButton>
                  </Tooltip>
                </Box>
                {/* Status select — inline with name */}
                <Select size="small" value="__current__" onChange={handleStatusChange}
                  renderValue={() => (
                    <Chip label={STATUS_LABEL[effectiveStatus]} size="small"
                      sx={{ fontFamily: 'inherit', fontSize: 16, fontWeight: 600, height: 26, cursor: 'pointer', ...STATUS_STYLE[effectiveStatus] }} />
                  )}
                  sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, '& .MuiSelect-select': { p: '2px 24px 2px 0 !important' }, minWidth: 0, height: 28 }}
                >
                  {statusOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value} disabled={opt.disabled} sx={{ fontSize: 13 }}>
                      {opt.disabled ? <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>{opt.label} (current)</Typography> : opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            )}

            {/* Meta row: joined · id · class · view profile */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 0' }}>
              {[
                <Typography key="since" sx={{ fontSize: 13, color: 'text.secondary' }}>Member since {formatMemberSince(member.created_at)}</Typography>,
                <Typography key="sep1" sx={{ fontSize: 13, color: 'text.disabled', mx: 1.25 }}>|</Typography>,
                <Typography key="num" sx={{ fontSize: 13, color: 'text.secondary', fontFamily: 'var(--font-code, monospace)' }}>{memberNum}</Typography>,
                member.membership_class ? (
                  <React.Fragment key="class">
                    <Typography sx={{ fontSize: 13, color: 'text.disabled', mx: 1.25 }}>|</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>{member.membership_class}</Typography>
                  </React.Fragment>
                ) : null,
                <React.Fragment key="profile-link">
                  <Typography sx={{ fontSize: 13, color: 'text.disabled', mx: 1.25 }}>|</Typography>
                  <Typography component="a"
                    href={`/${clubSlug}/our-club/members`}
                    target="_blank" rel="noopener noreferrer"
                    sx={{ fontSize: 13, fontWeight: 600, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    View member profile
                  </Typography>
                </React.Fragment>,
              ]}
            </Box>
          </Box>

          {/* Close */}
          <Tooltip title="Close">
            <IconButton onClick={onClose} size="small" sx={{ mt: 0.25, bgcolor: 'rgba(0,0,0,0.03)', border: '1px solid', borderColor: 'divider', borderRadius: 1.25 }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 14, height: 14 }}>
                <path strokeLinecap="round" d="M3.5 3.5l9 9M12.5 3.5l-9 9"/>
              </svg>
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <DialogContent sx={{ p: '0 !important', bgcolor: 'background.default' }}>

        {/* Activity strip — bordered box with year label */}
        {(() => {
          const eng = getEngagement(member.competitions_this_year)
          const now = new Date()
          const baseYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
          const clubYearLabel = `${baseYear}/${String(baseYear + 1).slice(2)} Club Year`
          return (
            <Box sx={{ mx: '22px', mt: '20px', mb: 0 }}>
              {/* Year header */}
              <Box sx={{ py: 0.875, textAlign: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Activity · {clubYearLabel}
                </Typography>
              </Box>
              {/* Three cells */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr' }}>

                {/* Cell 1: Engagement */}
                <Box sx={{ px: '20px', py: '16px', borderRight: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.875 }}>
                    Engagement
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Typography sx={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: eng.dot, letterSpacing: '-0.02em' }}>
                      {eng.label}
                    </Typography>
                    <Box>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                        <Typography component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{member.competitions_this_year}</Typography>
                        {totalCompetitionsThisYear > 0 && <Typography component="span"> of {totalCompetitionsThisYear}</Typography>}
                        {' '}competitions
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                        <Typography component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{member.submission_count_this_year}</Typography>
                        {totalPossibleImagesThisYear > 0 && <Typography component="span"> of {totalPossibleImagesThisYear}</Typography>}
                        {' '}images
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Cell 2: Avg Score */}
                <Box sx={{ px: '20px', py: '16px', borderRight: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.875 }}>
                    Avg Score
                  </Typography>
                  {member.avg_score !== null ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Typography sx={{ fontSize: 32, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', color: 'text.primary' }}>
                        {member.avg_score}
                      </Typography>
                      <Box>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                          <Typography component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{member.highest_score}</Typography> highest
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                          <Typography component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{member.lowest_score}</Typography> lowest
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Typography sx={{ fontSize: 13, color: 'text.disabled', fontStyle: 'italic', mt: 0.5 }}>No scores yet</Typography>
                  )}
                </Box>

                {/* Cell 3: Submissions by category */}
                <Box sx={{ px: '20px', py: '16px' }}>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.875 }}>
                    Submissions by category
                  </Typography>
                  <SubmissionDonut categories={member.submission_categories} />
                </Box>

              </Box>
            </Box>
          )
        })()}

        {/* Two-column content area */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', p: '20px 22px', gap: '24px', minHeight: 0 }}>

          {/* ── Left column ──────────────────────────────────────────────── */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Login Credentials */}
            <Section title="Login Credentials">
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                {/* Email column */}
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Username/Email:</Typography>
                  {editingEmail ? (
                    <Box>
                      {/* Warning — shown whenever the email edit field is open */}
                      <Box sx={{
                        mb: 1, px: 1.5, py: 1.25, borderRadius: 1.25,
                        bgcolor: 'warning.light', border: '1px solid', borderColor: 'warning.main',
                      }}>
                        <Typography sx={{ fontSize: 12, color: 'warning.contrastText', lineHeight: 1.55 }}>
                          <strong>This changes the member's login credential.</strong> They must use the new address to sign in immediately after saving. Both addresses will be notified by email.
                        </Typography>
                      </Box>
                      <TextField
                        size="small" autoFocus fullWidth
                        value={newEmail}
                        onChange={e => { setNewEmail(e.target.value); setEmailError(null) }}
                        onKeyDown={e => { if (e.key === 'Enter') handleEmailSave(); if (e.key === 'Escape') { setEditingEmail(false); setNewEmail(member.email ?? '') } }}
                        placeholder="new@email.com"
                        error={!!emailError}
                        sx={{ mb: 0.75, '& .MuiInputBase-input': { fontSize: 13, fontFamily: 'var(--font-code, monospace)' } }}
                      />
                      {emailError && <Typography sx={{ fontSize: 11.5, color: 'error.main', mb: 0.75 }}>{emailError}</Typography>}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Typography component="button" onClick={handleEmailSave} disabled={emailSaving}
                          sx={{ fontSize: 13, fontWeight: 600, color: 'primary.main', background: 'none', border: 'none', cursor: 'pointer', p: 0, '&:hover': { textDecoration: 'underline' } }}>
                          {emailSaving ? 'Saving…' : 'Save'}
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>|</Typography>
                        <Typography component="button" onClick={() => { setEditingEmail(false); setNewEmail(member.email ?? ''); setEmailError(null) }}
                          sx={{ fontSize: 13, color: 'text.secondary', background: 'none', border: 'none', cursor: 'pointer', p: 0, '&:hover': { textDecoration: 'underline' } }}>
                          Cancel
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <Typography sx={{ fontSize: 13, color: 'text.primary', fontFamily: 'var(--font-code, monospace)', wordBreak: 'break-all', mb: 0.75 }}>
                        {member.email ?? <Typography component="span" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>Not on file</Typography>}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                        {member.email && (
                          <>
                            <Typography component="a"
                              href={`/${clubSlug}/admin/notifications/compose?to=${member.id}`}
                              target="_blank" rel="noopener noreferrer"
                              sx={{ fontSize: 13, fontWeight: 600, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                              Send message
                            </Typography>
                            <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>|</Typography>
                          </>
                        )}
                        <Typography component="button" onClick={() => { setEditingEmail(true); setNewEmail(member.email ?? '') }}
                          sx={{ fontSize: 13, fontWeight: 600, color: 'primary.main', background: 'none', border: 'none', cursor: 'pointer', p: 0, '&:hover': { textDecoration: 'underline' } }}>
                          Edit address
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
                {/* Password column */}
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Password:</Typography>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary', letterSpacing: '0.05em', mb: 0.75 }}>
                    {'••••••••••••'}
                  </Typography>
                  {resetSent ? (
                    <Alert severity="success" sx={{ py: 0.5, px: 1.25, fontSize: 12, '& .MuiAlert-message': { py: 0.25 } }}>
                      Reset email sent to {member.email}
                    </Alert>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography component="button" onClick={handleSendPasswordReset} disabled={resetSending || !member.email}
                        sx={{ fontSize: 13, fontWeight: 600, color: 'primary.main', background: 'none', border: 'none', cursor: 'pointer', p: 0, '&:hover': { textDecoration: 'underline' }, '&:disabled': { color: 'text.disabled', cursor: 'default' } }}>
                        Send reset email
                      </Typography>
                      {resetSending && <CircularProgress size={12} thickness={5} />}
                    </Box>
                  )}
                </Box>
              </Box>
            </Section>

            {/* User Permissions */}
            {showPermissions && (
              <Section title="Permissions">
                <Stack spacing={1.25}>

                  {/* Admin option */}
                  <Box onClick={() => handleRoleSelect('admin')} sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 1.5, p: '14px 16px',
                    bgcolor: effectiveRole === 'admin' ? 'rgba(30,77,140,0.05)' : 'rgba(0,0,0,0.03)',
                    borderRadius: 1.5, cursor: 'pointer', transition: 'background 0.15s',
                    '&:hover': { bgcolor: effectiveRole === 'admin' ? 'rgba(30,77,140,0.08)' : 'rgba(0,0,0,0.05)' },
                  }}>
                    <RadioCircle selected={effectiveRole === 'admin'} />
                    <Box>
                      <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>Admin</Typography>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.25 }}>Full member portal and admin access</Typography>
                    </Box>
                  </Box>

                  {/* Member option — expands to show permission rows */}
                  <Box sx={{ bgcolor: effectiveRole === 'member' ? 'rgba(30,77,140,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: 1.5, overflow: 'hidden' }}>
                    <Box onClick={() => handleRoleSelect('member')} sx={{
                      display: 'flex', alignItems: 'flex-start', gap: 1.5, p: '14px 16px',
                      cursor: 'pointer', transition: 'background 0.15s',
                      '&:hover': { bgcolor: effectiveRole === 'member' ? 'rgba(30,77,140,0.08)' : 'rgba(0,0,0,0.05)' },
                    }}>
                      <RadioCircle selected={effectiveRole === 'member'} />
                      <Box>
                        <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>Member</Typography>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.25 }}>Full member portal access (optional admin access).</Typography>
                      </Box>
                    </Box>
                    {/* Sub-permissions — only visible when Member is selected */}
                    {effectiveRole === 'member' && (
                      <Box sx={{ pl: '50px', pr: 2, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        {PERM_ROWS.map(perm => (
                          <Box key={perm.key}
                            onClick={() => handlePermissionToggle(perm.key, !perm.value)}
                            sx={{
                              display: 'flex', alignItems: 'center', gap: 1.25, px: 1.5, py: 1,
                              bgcolor: 'background.paper', borderRadius: 1.25, cursor: 'pointer',
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                            }}>
                            <Switch size="small" checked={perm.value}
                              onChange={e => { e.stopPropagation(); handlePermissionToggle(perm.key, e.target.checked) }}
                              onClick={e => e.stopPropagation()} />
                            <Box sx={{ flex: 1, opacity: perm.value ? 1 : 0.45, transition: 'opacity 0.15s' }}>
                              <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'text.primary' }}>{perm.label}</Typography>
                              <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.125 }}>{perm.desc}</Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>

                </Stack>
              </Section>
            )}

          </Box>

          {/* ── Right column ─────────────────────────────────────────────── */}
          <Box>
            <Section title="Profile" subtitle="Managed by user on My Profile page">

              {/* Personal info */}
              <SubHead title="Personal Info" />
              <Box sx={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '5px 14px', alignItems: 'start', mb: 1.75 }}>
                {member.location && (
                  <>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Location</Typography>
                    <Typography sx={{ fontSize: 13, color: 'text.primary' }}>{member.location}</Typography>
                  </>
                )}
                {member.phone && (
                  <>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Phone</Typography>
                    <Typography sx={{ fontSize: 13, color: 'text.primary' }}>{member.phone}</Typography>
                  </>
                )}
                {member.experience_level && (
                  <>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Experience</Typography>
                    <Typography sx={{ fontSize: 13, color: 'text.primary' }}>{skillLabel(member.experience_level) ?? member.experience_level}</Typography>
                  </>
                )}
                {member.camera_brands.length > 0 && (
                  <>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Camera</Typography>
                    <Typography sx={{ fontSize: 13, color: 'text.primary' }}>{member.camera_brands.join(', ')}</Typography>
                  </>
                )}
                {member.shooting_interests.length > 0 && (
                  <>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary', alignSelf: 'start' }}>Interests</Typography>
                    <Typography sx={{ fontSize: 13, color: 'text.primary' }}>{member.shooting_interests.join(', ')}</Typography>
                  </>
                )}
                {member.bio && (
                  <>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary', alignSelf: 'start' }}>Bio</Typography>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.55 }}>{member.bio}</Typography>
                  </>
                )}
                {!member.location && !member.phone && !member.experience_level && !member.camera_brands.length && !member.shooting_interests.length && !member.bio && (
                  <Typography sx={{ fontSize: 13, color: 'text.disabled', fontStyle: 'italic', gridColumn: '1 / -1' }}>No profile info provided.</Typography>
                )}
              </Box>

              {/* Skill level — admin-controlled */}
              {memberClassesEnabled && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.75 }}>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary', flexShrink: 0 }}>Skill level</Typography>
                  <Select size="small" displayEmpty value={skillLevel} onChange={e => handleSkillLevelChange(e.target.value)} disabled={savingLevel}
                    sx={{ fontSize: 13, minWidth: 130, height: 30, '.MuiSelect-select': { py: '4px' } }}>
                    <MenuItem value="" sx={{ fontSize: 13 }}>
                      <Typography component="span" sx={{ fontSize: 13, color: 'text.disabled' }}>None</Typography>
                    </MenuItem>
                    {memberClasses.map(cls => (
                      <MenuItem key={cls.id} value={cls.name} sx={{ fontSize: 13 }}>{cls.name}</MenuItem>
                    ))}
                  </Select>
                </Box>
              )}

              <Divider sx={{ mb: 1.75 }} />

              {/* Communications */}
              <SubHead title="Communications" />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mb: 1.75 }}>
                <PrefLine label="Send competition reminders" value={member.pref_competition_reminders} />
                <PrefLine label="Club newsletter"            value={member.pref_club_newsletter} />
                <PrefLine label="Send result notifications"  value={member.pref_results_notifications} />
              </Box>

              <Divider sx={{ mb: 1.75 }} />

              {/* Privacy */}
              <SubHead title="Privacy" />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <PrefLine label="Show my profile in the directory" value={member.pref_show_in_directory} />
                <PrefLine label="Show my scores publicly"          value={member.pref_show_scores_publicly} />
                <PrefLine label="Public profile"                   value={member.pref_public_profile} />
              </Box>

            </Section>
          </Box>
        </Box>
      </DialogContent>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <DialogActions sx={{ px: '30px', py: '20px', borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between', bgcolor: 'background.default' }}>
        <Button
          onClick={() => setConfirmDelete(true)}
          sx={{
            fontSize: 13.5, fontWeight: 600, px: 2, py: 1.125,
            bgcolor: 'rgba(244,63,94,0.07)', color: '#9B1B30',
            border: '1px solid rgba(244,63,94,0.25)', borderRadius: 1.25,
            '&:hover': { bgcolor: 'rgba(244,63,94,0.12)', borderColor: 'rgba(244,63,94,0.4)' },
          }}
          startIcon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><path strokeLinecap="round" d="M3 4h10M6 4V2.5h4V4M5 4l.5 9.5h5L11 4M6.5 6.5v5M9.5 6.5v5"/></svg>}
        >
          Delete member
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          {hasUnsaved && (
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, mr: 0.5 }}>
              <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#D4A800' }} />
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Unsaved changes</Typography>
            </Box>
          )}
          <Button variant="outlined" color="secondary" onClick={handleFooterCancel}
            sx={{ fontSize: 13.5, fontWeight: 600, px: 2, py: 1.125, borderRadius: 1.25 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleFooterSave} disabled={saving}
            sx={{ fontSize: 13.5, fontWeight: 600, px: 2, py: 1.125, borderRadius: 1.25,
              boxShadow: '0 3px 10px rgba(30,77,140,0.3)' }}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </Box>
      </DialogActions>

      {/* ── Delete confirmation ───────────────────────────────────────────── */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ pb: 0.5 }}>Delete member?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            <strong>{fullName}</strong>'s account, personal details, and any images not linked to a competition will be permanently deleted.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>
            Images submitted to competitions are retained as "Deleted member" to preserve competition history. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" color="secondary" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</Button>
          <Button variant="outlined" onClick={handleDelete} disabled={deleting}
            sx={{ bgcolor: '#FDEEEE', color: '#7A1515', borderColor: 'rgba(211,47,47,0.3)', '&:hover': { bgcolor: '#F9D0D0', borderColor: 'rgba(211,47,47,0.5)' } }}>
            {deleting ? 'Deleting…' : 'Delete member'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MembersClient({
  profiles,
  memberClassesEnabled,
  memberClasses,
  totalCompetitionsThisYear,
  totalPossibleImagesThisYear,
}: {
  profiles: Profile[]
  memberClassesEnabled: boolean
  memberClasses: { id: string; name: string }[]
  totalCompetitionsThisYear: number
  totalPossibleImagesThisYear: number
}) {
  const router = useRouter()
  const params = useParams()
  const clubSlug = params.clubSlug as string
  const [filter, setFilter]           = useState<Filter>('all')
  const [search, setSearch]           = useState('')
  const [sortKey,  setSortKey]  = useState<SortKey>('last_name')
  const [sortDir,  setSortDir]  = useState<'asc' | 'desc'>('asc')
  const [manageMember, setManageMember] = useState<Profile | null>(null)
  const [loading, setLoading]         = useState<string | null>(null)
  const [deleteToast, setDeleteToast] = useState<string | null>(null)

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
    .sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'status':
          cmp = a.membership_status.localeCompare(b.membership_status); break
        case 'first_name':
          cmp = (a.first_name ?? '').localeCompare(b.first_name ?? ''); break
        case 'last_name':
          cmp = (a.last_name ?? '').localeCompare(b.last_name ?? ''); break
        case 'role':
          cmp = (a.role ?? '').localeCompare(b.role ?? ''); break
        case 'level':
          cmp = (a.membership_class ?? '').localeCompare(b.membership_class ?? ''); break
        case 'engagement': {
          const order = { High: 0, Medium: 1, Low: 2 } as Record<string, number>
          cmp = (order[getEngagement(a.competitions_this_year).label] ?? 3) -
                (order[getEngagement(b.competitions_this_year).label] ?? 3)
          break
        }
        case 'last_login': {
          const at = a.last_login ? new Date(a.last_login).getTime() : 0
          const bt = b.last_login ? new Date(b.last_login).getTime() : 0
          cmp = at - bt; break
        }
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

  async function handleReject() {
    if (!rejectTarget || !rejectReason.trim()) return
    setRejecting(true)
    await rejectMember(rejectTarget.id, rejectReason.trim())
    setRejectTarget(null); setRejectReason(''); setRejecting(false)
    router.refresh()
  }

  async function handleSuspend() {
    if (!suspendTarget || !suspendReason.trim()) return
    setSuspending(true)
    await suspendMember(suspendTarget.id, suspendReason.trim())
    setSuspendTarget(null); setSuspendReason(''); setSuspending(false)
    router.refresh()
  }

  async function handleBan() {
    if (!banTarget || banConfirm.trim().toUpperCase() !== 'BAN') return
    setBanning(true)
    await banMember(banTarget.id)
    setBanTarget(null); setBanConfirm(''); setBanning(false); setBanStep(1)
    router.refresh()
  }

  async function handleResign() {
    if (!resignTarget) return
    setResigning(true)
    await resignMember(resignTarget.id)
    setResignTarget(null); setResigning(false)
    router.refresh()
  }

  async function handleSetStatus(memberId: string, status: MembershipStatus) {
    setLoading(memberId)
    await setMemberStatus(memberId, status)
    setLoading(null)
    router.refresh()
  }

  async function handleApprove(memberId: string) {
    setLoading(memberId)
    await approveMember(memberId)
    setLoading(null)
    router.refresh()
  }

  // Called from the MemberModal's status select — do NOT close modal here;
  // the secondary dialog renders on top and the modal stays open behind it.
  function handleStatusAction(action: StatusAction, member: Profile) {
    switch (action.kind) {
      case 'approve':
        handleApprove(member.id)
        break
      case 'reject':
        setRejectTarget(member)
        break
      case 'suspend':
        setSuspendTarget(member)
        break
      case 'ban':
        setBanTarget(member); setBanStep(1)
        break
      case 'resign':
        setResignTarget(member)
        break
      case 'setStatus':
        handleSetStatus(member.id, action.status)
        break
    }
  }

  function handleExport() {
    const headers = ['Status', 'First name', 'Last name', 'Member ID', 'Class', 'Engagement']
    const rows = filtered.map(p => [
      STATUS_LABEL[p.membership_status],
      p.first_name ?? '',
      p.last_name ?? '',
      `#${String(p.member_number).padStart(4, '0')}`,
      p.membership_class ?? '',
      getEngagement(p.competitions_this_year).label,
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

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: 'all',     label: 'All',     count: totalCount   },
    { key: 'active',  label: 'Active',  count: activeCount  },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'expired', label: 'Expired', count: profiles.filter(p => INACTIVE_STATUSES.includes(p.membership_status)).length },
  ]

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const tableColumns: { label: string; key: SortKey | null }[] = [
    { label: 'Status',      key: 'status'     },
    { label: 'First name',  key: 'first_name' },
    { label: 'Last name',   key: 'last_name'  },
    { label: 'Role',        key: 'role'       },
    ...(classesEnabled ? [{ label: 'Level',      key: 'level'      as SortKey | null }] : []),
    { label: 'Engagement',  key: 'engagement' },
    { label: 'Last login',  key: 'last_login' },
    { label: '',            key: null         },
  ]

  return (
    <>
      {/* Page heading */}
      <Box sx={{ mb: 4 }}>
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Members</h1>
        <p className="mt-1 text-sm text-content-secondary">Manage membership applications and statuses.</p>
      </Box>

      {/* Above-table panel: membership donut (left) + classification toggle (right) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5, mb: 3, alignItems: 'start' }}>

        {/* Left — membership breakdown donut (no box, free layout) */}
        <Box sx={{ py: '20px', px: 1 }}>
          <MembershipDonut profiles={profiles} />
        </Box>

        {/* Right — member classifications */}
        <Paper variant="outlined" sx={{ px: 3, py: '20px' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
            Member classifications
          </Typography>

          {/* Enable toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: classesEnabled ? 2 : 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
              Enable skill levels
            </Typography>
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
              <Divider sx={{ mb: 2 }} />
              {classes.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Stack spacing={1.25}>
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
              {classAdding ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, maxWidth: 320, mt: 1.5 }}>
                  <TextField
                    size="small" fullWidth autoFocus
                    placeholder="Class name e.g. Class A"
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddClass())}
                    disabled={classPending}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" size="small"
                      disabled={!newClassName.trim() || classPending} onClick={handleAddClass}>
                      Save
                    </Button>
                    <Button variant="outlined" color="secondary" size="small"
                      disabled={classPending} onClick={() => { setNewClassName(''); setClassAdding(false) }}>
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Button variant="outlined" color="secondary" size="small" sx={{ mt: 1.25 }}
                  onClick={() => setClassAdding(true)}>
                  + Add class
                </Button>
              )}
            </>
          )}
        </Paper>

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

      {/* Table */}
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {tableColumns.map(col => {
                const active = col.key && col.key === sortKey
                return (
                  <TableCell
                    key={col.label}
                    onClick={col.key ? () => handleSort(col.key!) : undefined}
                    sx={{
                      fontSize: 11, fontWeight: 600, color: active ? 'text.primary' : 'text.secondary',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider',
                      bgcolor: 'background.default', fontFamily: 'inherit', whiteSpace: 'nowrap',
                      cursor: col.key ? 'pointer' : 'default',
                      userSelect: 'none',
                      '&:hover': col.key ? { color: 'text.primary' } : {},
                    }}
                  >
                    {col.label ? (
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        {col.label}
                        {col.key && (
                          <Box component="span" sx={{ display: 'inline-flex', opacity: active ? 1 : 0.35 }}>
                            {active && sortDir === 'desc' ? (
                              // Active descending — solid down
                              <svg width="8" height="8" viewBox="0 0 8 8"><path d="M4 7L0.5 1.5h7z" fill="currentColor"/></svg>
                            ) : (
                              // Active ascending or inactive — up arrow (inactive is just dimmed)
                              <svg width="8" height="8" viewBox="0 0 8 8"><path d="M4 1l3.5 5.5H.5z" fill="currentColor"/></svg>
                            )}
                          </Box>
                        )}
                      </Box>
                    ) : null}
                  </TableCell>
                )
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={tableColumns.length} sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  No members found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(profile => {
              // Permission count + labels for the +X tooltip
              const permLabels = [
                profile.perm_competition_manager ? 'Competition Manager' : null,
                profile.perm_event_manager       ? 'Event Manager'       : null,
                profile.perm_comms_manager       ? 'Comms Manager'       : null,
              ].filter(Boolean) as string[]
              const permCount = permLabels.length
              const eng = getEngagement(profile.competitions_this_year)
              const cellSx = { py: 2.75, px: 2, borderBottom: '1px solid', borderColor: 'divider', fontFamily: 'inherit' } as const
              return (
                <TableRow
                  key={profile.id}
                  hover
                  sx={{ '&:last-child td': { borderBottom: 0 }, cursor: 'default' }}
                >
                  {/* Status */}
                  <TableCell sx={cellSx}>
                    <Chip
                      label={STATUS_LABEL[profile.membership_status]}
                      size="small"
                      sx={{ fontFamily: 'inherit', fontSize: 11, height: 22, ...STATUS_STYLE[profile.membership_status] }}
                    />
                  </TableCell>

                  {/* Name */}
                  <TableCell sx={{ ...cellSx, fontSize: 14 }}>{profile.first_name || '—'}</TableCell>
                  <TableCell sx={{ ...cellSx, fontSize: 14 }}>{profile.last_name  || '—'}</TableCell>

                  {/* Role */}
                  <TableCell sx={cellSx}>
                    {profile.role === 'admin' ? (
                      <Typography sx={{ fontSize: 14, color: 'text.primary', fontFamily: 'inherit', fontWeight: 600 }}>Admin</Typography>
                    ) : profile.role === 'member' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Typography sx={{ fontSize: 14, color: 'text.secondary', fontFamily: 'inherit' }}>Member</Typography>
                        {permCount > 0 && (
                          <Tooltip
                            title={permLabels.join(', ')}
                            arrow
                            slotProps={{ tooltip: { sx: { fontSize: 12 } } }}
                          >
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'primary.main', cursor: 'default', lineHeight: 1 }}>
                              +{permCount}
                            </Typography>
                          </Tooltip>
                        )}
                      </Box>
                    ) : (
                      <Typography sx={{ fontSize: 14, color: 'text.disabled', fontFamily: 'inherit' }}>—</Typography>
                    )}
                  </TableCell>

                  {/* Level (optional) */}
                  {classesEnabled && (
                    <TableCell sx={{ ...cellSx, fontSize: 14, color: 'text.secondary' }}>
                      {profile.membership_class || '—'}
                    </TableCell>
                  )}

                  {/* Engagement */}
                  <TableCell sx={cellSx}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: eng.dot, fontFamily: 'inherit' }}>
                      {eng.label}
                    </Typography>
                  </TableCell>

                  {/* Last login */}
                  <TableCell sx={{ ...cellSx, fontSize: 13, color: profile.last_login ? 'text.secondary' : 'text.disabled', whiteSpace: 'nowrap' }}>
                    {formatLastLogin(profile.last_login)}
                  </TableCell>

                  {/* Manage */}
                  <TableCell sx={cellSx} align="right">
                    <Typography
                      component="button"
                      onClick={() => setManageMember(profile)}
                      sx={{ fontSize: 14, fontFamily: 'inherit', color: 'primary.main', background: 'none', border: 'none', cursor: 'pointer', p: 0, '&:hover': { textDecoration: 'underline' } }}
                    >
                      Manage
                    </Typography>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Box>

      {/* ── Member modal ─────────────────────────────────────────────────── */}
      {manageMember && (
        <MemberModal
          member={manageMember}
          open={!!manageMember}
          onClose={() => setManageMember(null)}
          memberClasses={classes}
          memberClassesEnabled={classesEnabled}
          totalCompetitionsThisYear={totalCompetitionsThisYear}
          totalPossibleImagesThisYear={totalPossibleImagesThisYear}
          clubSlug={clubSlug}
          onStatusAction={handleStatusAction}
          onDeleteSuccess={(name) => {
            setDeleteToast(name)
            router.refresh()
          }}
        />
      )}

      {/* ── Reject application dialog ─────────────────────────────────────── */}
      <Dialog
        open={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectReason('') }}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        {rejectTarget && (
          <>
            <DialogTitle sx={{ pb: 0.5 }}>Reject application?</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7 }}>
                Rejecting will remove <strong>{[rejectTarget.first_name, rejectTarget.last_name].filter(Boolean).join(' ')}</strong>'s application and send them a notification email with your reason.
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.7, color: 'error.dark', fontStyle: 'italic' }}>
                This permanently removes their account. They can reapply with a new account if they wish.
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
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => { setRejectTarget(null); setRejectReason('') }}
                disabled={rejecting}
              >
                Cancel
              </Button>
              <Button
                variant="outlined"
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejecting}
                sx={{
                  color: 'error.main', borderColor: 'error.light',
                  '&:hover': { borderColor: 'error.main', bgcolor: 'error.light' },
                  '&.Mui-disabled': { color: 'text.disabled', borderColor: 'divider' },
                }}
              >
                {rejecting ? 'Rejecting…' : 'Reject application'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Suspend member dialog ─────────────────────────────────────────── */}
      <Dialog
        open={!!suspendTarget}
        onClose={() => { setSuspendTarget(null); setSuspendReason('') }}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        {suspendTarget && (
          <>
            <DialogTitle sx={{ pb: 0.5 }}>
              Suspend {suspendTarget.first_name}?
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7 }}>
                This will immediately revoke their access to the club platform.
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.7, color: 'success.contrastText', fontStyle: 'italic' }}>
                This can be reversed — you can reinstate them at any time from the status dropdown.
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
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => { setSuspendTarget(null); setSuspendReason('') }}
                disabled={suspending}
              >
                Cancel
              </Button>
              <Button
                variant="outlined"
                onClick={handleSuspend}
                disabled={!suspendReason.trim() || suspending}
                sx={{
                  color: 'warning.contrastText', borderColor: 'warning.main',
                  '&:hover': { borderColor: 'warning.main', bgcolor: 'warning.light' },
                  '&.Mui-disabled': { color: 'text.disabled', borderColor: 'divider' },
                }}
              >
                {suspending ? 'Suspending…' : 'Suspend member'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Ban member dialog (two-step) ──────────────────────────────────── */}
      <Dialog
        open={!!banTarget}
        onClose={() => { setBanTarget(null); setBanConfirm(''); setBanStep(1) }}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        {banTarget && banStep === 1 && (
          <>
            <DialogTitle sx={{ pb: 0.5 }}>Ban {banTarget.first_name}?</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7 }}>
                Banning immediately revokes their access. They will not be able to reapply.
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'error.contrastText', fontStyle: 'italic' }}>
                This action is permanent and cannot be reversed.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button variant="outlined" color="secondary" onClick={() => { setBanTarget(null); setBanStep(1) }}>Cancel</Button>
              <Button
                variant="outlined"
                onClick={() => setBanStep(2)}
                sx={{ color: 'error.contrastText', borderColor: 'error.main', '&:hover': { borderColor: 'error.main', bgcolor: 'error.light' } }}
              >
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
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => { setBanTarget(null); setBanConfirm(''); setBanStep(1) }}
                disabled={banning}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleBan}
                disabled={banConfirm.trim().toUpperCase() !== 'BAN' || banning}
              >
                {banning ? 'Banning…' : 'Permanently ban'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Mark as resigned dialog ───────────────────────────────────────── */}
      <Dialog
        open={!!resignTarget}
        onClose={() => setResignTarget(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        {resignTarget && (
          <>
            <DialogTitle sx={{ pb: 0.5 }}>Mark as resigned?</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7 }}>
                <strong>{[resignTarget.first_name, resignTarget.last_name].filter(Boolean).join(' ')}</strong>'s membership will be marked as resigned and their access removed.
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'success.contrastText', fontStyle: 'italic' }}>
                This can be reversed — reinstate their membership at any time from the status dropdown.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button variant="outlined" color="secondary" onClick={() => setResignTarget(null)} disabled={resigning}>
                Cancel
              </Button>
              <Button
                variant="outlined"
                onClick={handleResign}
                disabled={resigning}
                sx={{ color: 'text.secondary', borderColor: 'divider' }}
              >
                {resigning ? 'Saving…' : 'Mark as resigned'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

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

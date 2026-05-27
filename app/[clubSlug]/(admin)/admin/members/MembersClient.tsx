'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Avatar,
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
  active:        { bgcolor: 'success.light',      color: 'success.contrastText' },
  complimentary: { bgcolor: 'success.light',      color: 'success.contrastText' },
  pending:       { bgcolor: 'warning.light',      color: 'warning.contrastText' },
  approved:      { bgcolor: 'warning.light',      color: 'warning.contrastText' },
  banned:        { bgcolor: 'error.light',        color: 'error.contrastText'   },
  cancelled:     { bgcolor: 'background.default', color: 'text.secondary'       },
  expired:       { bgcolor: 'background.default', color: 'text.secondary'       },
  paused:        { bgcolor: 'background.default', color: 'text.secondary'       },
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

// ─── Detail row helpers ───────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 0.5 }}>
      <Typography sx={{ fontSize: 13, color: 'text.secondary', flexShrink: 0, minWidth: 100 }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, color: 'text.primary', wordBreak: 'break-word' }}>{value}</Typography>
    </Box>
  )
}

// Section card — visually groups a major modal section with a labelled header bar
function SectionCard({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
      <Box sx={{
        px: 2, py: 1.25,
        bgcolor: 'rgba(0,0,0,0.025)',
        borderBottom: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'text.primary' }}>
          {title}
        </Typography>
        {hint && <Typography sx={{ fontSize: 11, color: 'text.secondary', fontStyle: 'italic' }}>{hint}</Typography>}
      </Box>
      <Box sx={{ p: 2 }}>
        {children}
      </Box>
    </Box>
  )
}

// Sub-section head used inside SectionCard
function SubHead({ title, note }: { title: string; note?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
      <Typography sx={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'text.secondary' }}>
        {title}
      </Typography>
      {note && <Typography sx={{ fontSize: 11, color: 'text.disabled', fontStyle: 'italic' }}>{note}</Typography>}
    </Box>
  )
}

// advanced text uses a MUI token via sx — see ExperienceBadge
const SKILL_COLOURS: Record<string, { bg: string; text: string; muiColor?: string }> = {
  beginner:     { bg: 'rgba(0,151,167,0.10)',  text: '#0097A7' },
  intermediate: { bg: 'rgba(108,71,212,0.10)', text: '#6C47D4' },
  advanced:     { bg: 'rgba(46,125,50,0.12)',  text: '', muiColor: 'success.contrastText' },
}

function ExperienceBadge({ level }: { level: string }) {
  const style = SKILL_COLOURS[level.toLowerCase()] ?? { bg: 'rgba(90,106,130,0.10)', text: '#5A6C82' }
  return (
    <Box component="span" sx={{
      display: 'inline-flex', alignItems: 'center', justifySelf: 'start',
      borderRadius: 9999, px: 1.25, py: 0.375,
      bgcolor: style.bg,
      color: style.muiColor ?? style.text,
      fontSize: 12, fontWeight: 500, lineHeight: 1.5,
    }}>
      {skillLabel(level) ?? level}
    </Box>
  )
}

// Icon-tile helper for contact / permission rows
function IconTile({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <Box sx={{
      width: 34, height: 34, borderRadius: 1.25, flexShrink: 0,
      bgcolor: active ? 'rgba(30,77,140,0.10)' : 'rgba(0,0,0,0.04)',
      color:   active ? '#1E4D8C' : '#7E8EA3',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </Box>
  )
}

// ─── Engagement level ─────────────────────────────────────────────────────────

function getEngagement(competitionsThisYear: number) {
  if (competitionsThisYear >= 3) return { label: 'High',   bgcolor: 'success.light', color: 'success.contrastText', dot: 'success.main' } as const
  if (competitionsThisYear >= 1) return { label: 'Medium', bgcolor: 'warning.light', color: 'warning.contrastText', dot: 'warning.main' } as const
  return                                { label: 'Low',    bgcolor: 'error.light',   color: 'error.contrastText',   dot: 'error.main'   } as const
}

// ─── PrefGrid — read-only preference row list ─────────────────────────────────

function PrefGrid({ prefs }: { prefs: { key: string; label: string; value: boolean }[] }) {
  return (
    <Stack spacing={0.75}>
      {prefs.map(pref => (
        <Box key={pref.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.25, bgcolor: 'rgba(0,0,0,0.01)' }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{pref.label}</Typography>
          <Box component="span" sx={{
            display: 'inline-flex', alignItems: 'center', flexShrink: 0,
            borderRadius: 9999, px: 1.25, py: 0.375,
            bgcolor: pref.value ? 'success.light' : 'rgba(0,0,0,0.04)',
            color:   pref.value ? 'success.contrastText' : 'text.secondary',
            fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.03em',
          }}>
            {pref.value ? 'On' : 'Off'}
          </Box>
        </Box>
      ))}
    </Stack>
  )
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
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
        {segments.map((s, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</Typography>
            <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: 'text.primary', ml: 0.5, flexShrink: 0 }}>{s.count}</Typography>
          </Box>
        ))}
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
  onStatusAction,
  onDeleteSuccess,
}: MemberModalProps) {
  const router = useRouter()

  // Edit name (inline in header)
  const [editing, setEditing]     = useState(false)
  const [firstName, setFirstName] = useState(member.first_name ?? '')
  const [lastName, setLastName]   = useState(member.last_name ?? '')
  const [saving, setSaving]       = useState(false)

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

  // Reset all staged state when a different member is opened
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
  }, [member]) // eslint-disable-line react-hooks/exhaustive-deps

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
        sx={{ px: '30px', pt: '24px', pb: '20px', borderBottom: '1px solid', borderColor: 'divider' }}
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

            {/* Meta row: joined · id · location */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px' }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                Member since {formatMemberSince(member.created_at)}
              </Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', fontFamily: 'var(--font-code, monospace)' }}>
                {memberNum}
              </Typography>
              {member.location && (
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{member.location}</Typography>
              )}
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

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      {(() => {
        const eng = getEngagement(member.competitions_this_year)
        return (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1.1fr 0.65fr 1.55fr', borderBottom: '1px solid', borderColor: 'divider' }}>

            {/* Cell 1: Engagement + this-year counts */}
            <Box sx={{ px: '24px', py: '16px', borderRight: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                Engagement
              </Typography>
              <Box component="span" sx={{
                display: 'inline-flex', alignItems: 'center', gap: 0.75,
                px: 1.25, py: 0.5, borderRadius: 9999, mb: 1.5,
                bgcolor: eng.bgcolor, color: eng.color,
                fontSize: 12, fontWeight: 700,
              }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: eng.dot, flexShrink: 0 }} />
                {eng.label}
              </Box>
              <Box sx={{ display: 'flex', gap: 2.5 }}>
                <Box>
                  <Typography sx={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>{member.competitions_this_year}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.4 }}>competitions</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>{member.submission_count_this_year}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.4 }}>submissions</Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em', mt: 0.75 }}>This year</Typography>
            </Box>

            {/* Cell 2: All-time */}
            <Box sx={{ px: '24px', py: '16px', borderRight: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                All time
              </Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
                {member.submission_count}
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>submissions</Typography>
            </Box>

            {/* Cell 3: Submissions by category donut */}
            <Box sx={{ px: '24px', py: '16px' }}>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                Submissions by category
              </Typography>
              <SubmissionDonut categories={member.submission_categories} />
            </Box>

          </Box>
        )
      })()}

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <DialogContent sx={{ p: '0 !important' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0 }}>

          {/* ── Left column ──────────────────────────────────────────────── */}
          <Box sx={{ pl: '30px', pr: '40px', py: '30px', borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            {/* Login */}
            <SectionCard title="Login">
              <Stack spacing={1}>
                {/* Email row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.25, bgcolor: 'rgba(0,0,0,0.01)' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Username / Email</Typography>
                    {member.email ? (
                      <Typography sx={{ fontSize: 13, color: 'text.primary', fontFamily: 'var(--font-code, monospace)', wordBreak: 'break-all', mt: 0.25 }}>{member.email}</Typography>
                    ) : (
                      <Typography sx={{ fontSize: 13, color: 'text.secondary', fontStyle: 'italic', mt: 0.25 }}>Not on file</Typography>
                    )}
                  </Box>
                  {member.email && (
                    <Button variant="outlined" color="secondary" size="small" component="a" href={`mailto:${member.email}`} sx={{ flexShrink: 0, fontSize: 12 }}
                      startIcon={<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M2 4l6 4 6-4M2 4v8h12V4H2z"/></svg>}>
                      Send email
                    </Button>
                  )}
                </Box>
                {/* Password row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.25, bgcolor: 'rgba(0,0,0,0.01)' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Password</Typography>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.25 }}>
                      {resetSent ? 'Reset email sent ✓' : '••••••••••••'}
                    </Typography>
                  </Box>
                  <Button variant="outlined" color="secondary" size="small"
                    onClick={handleSendPasswordReset}
                    disabled={resetSending || resetSent || !member.email}
                    sx={{ flexShrink: 0, fontSize: 12 }}>
                    {resetSending ? 'Sending…' : resetSent ? 'Sent' : 'Send reset email'}
                  </Button>
                </Box>
              </Stack>
            </SectionCard>

            {/* User Permissions */}
            {showPermissions && (
              <SectionCard title="User Permissions">
                {/* Member / Admin segmented control — Member is default/first */}
                <Box sx={{ display: 'inline-flex', border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 1.5 }}>
                  {(['member', 'admin'] as const).map(role => (
                    <Box
                      key={role}
                      component="button"
                      onClick={() => handleRoleSelect(role)}
                      sx={{
                        px: 2.5, py: 0.875, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        border: 'none', fontFamily: 'inherit',
                        bgcolor: effectiveRole === role ? 'primary.main' : 'transparent',
                        color: effectiveRole === role ? 'primary.contrastText' : 'text.secondary',
                        transition: 'all 0.15s',
                        '&:hover': effectiveRole !== role ? { bgcolor: 'rgba(0,0,0,0.04)' } : {},
                      }}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Box>
                  ))}
                </Box>

                {effectiveRole === 'admin' ? (
                  <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'rgba(166,124,0,0.35)', borderRadius: 1.25, bgcolor: 'rgba(166,124,0,0.04)' }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'text.primary', mb: 0.25 }}>Full admin access</Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      User has full access to all admin features. No additional permissions required.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 0.25 }}>
                      User has access to the member portal. Select optional admin permissions:
                    </Typography>
                    {PERM_ROWS.map(perm => (
                      <Box
                        key={perm.key}
                        onClick={() => handlePermissionToggle(perm.key, !perm.value)}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25,
                          border: '1px solid',
                          borderColor: perm.value ? 'rgba(30,77,140,0.22)' : 'divider',
                          borderRadius: 1.25,
                          bgcolor: perm.value ? 'rgba(30,77,140,0.04)' : 'rgba(0,0,0,0.01)',
                          cursor: 'pointer', transition: 'all 0.2s',
                          '&:hover': { borderColor: perm.value ? 'rgba(30,77,140,0.35)' : '#B0BACA', bgcolor: perm.value ? 'rgba(30,77,140,0.07)' : 'rgba(0,0,0,0.025)' },
                        }}
                      >
                        <IconTile active={perm.value}>{perm.icon}</IconTile>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'text.primary' }}>{perm.label}</Typography>
                          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>{perm.desc}</Typography>
                        </Box>
                        <Switch size="small" checked={perm.value}
                          onChange={e => { e.stopPropagation(); handlePermissionToggle(perm.key, e.target.checked) }}
                          onClick={e => e.stopPropagation()}
                        />
                      </Box>
                    ))}
                  </Stack>
                )}
              </SectionCard>
            )}

          </Box>

          {/* ── Right column ─────────────────────────────────────────────── */}
          <Box sx={{ pl: '40px', pr: '30px', py: '30px', display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            <SectionCard title="Profile" hint="Specified by member">

              {/* Personal info */}
              <SubHead title="Personal info" />
              {hasProfile ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '10px 14px', alignItems: 'center', mb: memberClassesEnabled ? 0 : 0 }}>
                  {member.experience_level && (
                    <>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Experience</Typography>
                      <ExperienceBadge level={member.experience_level} />
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
                      <Typography sx={{ fontSize: 13, color: 'text.secondary', alignSelf: 'start', pt: 0.5 }}>Interests</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {member.shooting_interests.map(t => (
                          <Box key={t} sx={{ px: 1.25, py: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 9999, fontSize: 12, fontWeight: 500, color: 'text.secondary', bgcolor: 'rgba(0,0,0,0.02)' }}>
                            {t}
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}
                  {member.bio && (
                    <>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary', alignSelf: 'start', pt: 0.25 }}>Bio</Typography>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.55 }}>{member.bio}</Typography>
                    </>
                  )}
                </Box>
              ) : (
                <Typography sx={{ fontSize: 13, color: 'text.disabled', fontStyle: 'italic', mb: memberClassesEnabled ? 1 : 0 }}>
                  No profile information provided.
                </Typography>
              )}

              {/* Skill level — admin-controlled, shown inline */}
              {memberClassesEnabled && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: hasProfile ? 1.5 : 0 }}>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Skill level</Typography>
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

              <Divider sx={{ my: 1.75 }} />

              {/* Communications */}
              <SubHead title="Communications" />
              <PrefGrid prefs={[
                { key: 'pref_competition_reminders', label: 'Competition reminders', value: member.pref_competition_reminders },
                { key: 'pref_club_newsletter',       label: 'Club newsletter',       value: member.pref_club_newsletter       },
                { key: 'pref_results_notifications', label: 'Results notifications', value: member.pref_results_notifications },
              ]} />

              <Divider sx={{ my: 1.75 }} />

              {/* Privacy */}
              <SubHead title="Privacy" />
              <PrefGrid prefs={[
                { key: 'pref_show_scores_publicly', label: 'Show scores publicly', value: member.pref_show_scores_publicly },
                { key: 'pref_public_profile',       label: 'Public profile',       value: member.pref_public_profile       },
                { key: 'pref_show_in_directory',    label: 'Show in directory',    value: member.pref_show_in_directory    },
              ]} />

            </SectionCard>

          </Box>
        </Box>
      </DialogContent>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <DialogActions sx={{ px: '30px', py: '20px', borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between', bgcolor: 'rgba(0,0,0,0.015)' }}>
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
}: {
  profiles: Profile[]
  memberClassesEnabled: boolean
  memberClasses: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [filter, setFilter]           = useState<Filter>('all')
  const [search, setSearch]           = useState('')
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

      {/* Table */}
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {tableHeaders.map(h => (
                <TableCell
                  key={h}
                  sx={{
                    fontSize: 11, fontWeight: 600, color: 'text.secondary',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider',
                    bgcolor: 'background.default', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  }}
                >
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
                    onClick={() => setManageMember(profile)}
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

      {/* ── Member modal ─────────────────────────────────────────────────── */}
      {manageMember && (
        <MemberModal
          member={manageMember}
          open={!!manageMember}
          onClose={() => setManageMember(null)}
          memberClasses={classes}
          memberClassesEnabled={classesEnabled}
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
                      variant="contained"
                      size="small"
                      disabled={!newClassName.trim() || classPending}
                      onClick={handleAddClass}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      disabled={classPending}
                      onClick={() => { setNewClassName(''); setClassAdding(false) }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
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

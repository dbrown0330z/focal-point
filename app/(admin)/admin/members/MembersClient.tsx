'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import type { Database } from '@/types/database'
import { setMemberStatus, approveMember, makeAdmin } from './actions'

type MembershipStatus = Database['public']['Enums']['membership_status']
type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  member_number: number
  membership_status: MembershipStatus
  membership_class: string | null
  role: Database['public']['Enums']['user_role'] | null
  created_at: string
}

type Filter = 'all' | 'active' | 'pending' | 'expired'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<MembershipStatus, string> = {
  pending:       'Pending',
  approved:      'Awaiting onboarding',
  active:        'Active',
  expired:       'Expired',
  paused:        'Paused',
  complimentary: 'Complimentary',
  banned:        'Banned',
  cancelled:     'Cancelled',
}

const STATUS_STYLE: Record<MembershipStatus, { bgcolor: string; color: string }> = {
  active:        { bgcolor: '#EDFAF0', color: '#174A1A' },
  complimentary: { bgcolor: '#EDFAF0', color: '#174A1A' },
  pending:       { bgcolor: '#FFFBE6', color: '#6B5000' },
  approved:      { bgcolor: '#FFFBE6', color: '#6B5000' },
  banned:        { bgcolor: '#FDEEEE', color: '#7A1515' },
  cancelled:     { bgcolor: '#FDEEEE', color: '#7A1515' },
  expired:       { bgcolor: '#EDF0F5', color: '#3E5066' },
  paused:        { bgcolor: '#EDF0F5', color: '#3E5066' },
}

const ACTIVE_STATUSES:  MembershipStatus[] = ['active', 'complimentary']
const PENDING_STATUSES: MembershipStatus[] = ['pending', 'approved']
const EXPIRED_STATUSES: MembershipStatus[] = ['expired', 'cancelled', 'paused', 'banned']

// ─── Manage modal actions ─────────────────────────────────────────────────────

type ModalAction = {
  label: string
  status: MembershipStatus
  color: 'error' | 'warning' | 'success' | 'secondary'
  description: string
}

const MANAGE_ACTIONS: ModalAction[] = [
  {
    label: 'Complimentary',
    status: 'complimentary',
    color: 'success',
    description: 'Grant free membership access.',
  },
  {
    label: 'Pause',
    status: 'paused',
    color: 'warning',
    description: 'Temporarily suspend access.',
  },
  {
    label: 'Cancel',
    status: 'cancelled',
    color: 'secondary',
    description: 'Cancel membership.',
  },
  {
    label: 'Ban',
    status: 'banned',
    color: 'error',
    description: 'Permanently ban this member.',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function MembersClient({ profiles }: { profiles: Profile[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [manageMember, setManageMember] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<string | null>(null) // memberId being actioned

  // Summary counts
  const totalCount        = profiles.length
  const pendingCount      = profiles.filter(p => PENDING_STATUSES.includes(p.membership_status)).length
  const activeCount       = profiles.filter(p => ACTIVE_STATUSES.includes(p.membership_status)).length

  // Filtered rows
  const filtered = profiles.filter(p => {
    if (filter === 'active')  return ACTIVE_STATUSES.includes(p.membership_status)
    if (filter === 'pending') return PENDING_STATUSES.includes(p.membership_status)
    if (filter === 'expired') return EXPIRED_STATUSES.includes(p.membership_status)
    return true
  })

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
    { key: 'expired', label: 'Expired', count: profiles.filter(p => EXPIRED_STATUSES.includes(p.membership_status)).length },
  ]

  return (
    <>
      {/* Page heading */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" sx={{ mb: 0.5, color: 'text.primary' }}>Members</Typography>
        <Typography variant="body1" color="text.secondary">
          Manage membership applications and statuses.
        </Typography>
      </Box>

      {/* Summary cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 4 }}>
        {[
          { label: 'Total members',   value: totalCount,   color: 'text.primary' },
          { label: 'Pending',         value: pendingCount, color: 'warning.main' },
          { label: 'Active members',  value: activeCount,  color: 'success.main' },
        ].map(card => (
          <Card key={card.label} variant="outlined">
            <CardContent sx={{ p: '20px !important' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {card.label}
              </Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: card.color }}>
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Filters */}
      <Box sx={{
        display: 'inline-flex',
        mb: 2,
        border: '1.5px solid',
        borderColor: 'divider',
        borderRadius: '6px',
        overflow: 'hidden',
      }}>
        {FILTERS.map((f, i) => (
          <Button
            key={f.key}
            size="small"
            onClick={() => setFilter(f.key)}
            disableElevation
            sx={{
              borderRadius: 0,
              borderRight: i < FILTERS.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
              px: 2,
              minWidth: 0,
              fontWeight: filter === f.key ? 600 : 400,
              bgcolor: filter === f.key ? '#1E4D8C' : 'transparent',
              color: filter === f.key ? '#fff' : 'text.secondary',
              '&:hover': {
                bgcolor: filter === f.key ? '#163A6B' : 'action.hover',
              },
            }}
          >
            {f.label}
            <Box component="span" sx={{
              ml: 1, px: 0.75, py: 0.1,
              borderRadius: '10px',
              bgcolor: filter === f.key ? 'rgba(255,255,255,0.20)' : '#EDF0F5',
              color: filter === f.key ? '#fff' : '#5A6C82',
              fontSize: 11, fontWeight: 600,
            }}>
              {f.count}
            </Box>
          </Button>
        ))}
      </Box>

      {/* Table */}
      <Card variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              {['Status', 'First name', 'Last name', 'Member ID', 'Date joined', 'Class', ''].map(h => (
                <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, py: 1.5, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  No members found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(profile => (
              <TableRow key={profile.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                <TableCell sx={{ py: 1.5 }}>
                  <Chip
                    label={STATUS_LABEL[profile.membership_status]}
                    size="small"
                    sx={{ fontFamily: 'inherit', fontSize: 11, height: 22, ...STATUS_STYLE[profile.membership_status] }}
                  />
                </TableCell>
                <TableCell sx={{ py: 1.5, fontSize: 13 }}>{profile.first_name || '—'}</TableCell>
                <TableCell sx={{ py: 1.5, fontSize: 13 }}>{profile.last_name || '—'}</TableCell>
                <TableCell sx={{ py: 1.5, fontSize: 13, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                  #{String(profile.member_number).padStart(4, '0')}
                </TableCell>
                <TableCell sx={{ py: 1.5, fontSize: 13, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </TableCell>
                <TableCell sx={{ py: 1.5, fontSize: 13, color: 'text.secondary' }}>
                  {profile.membership_class || '—'}
                </TableCell>
                <TableCell sx={{ py: 1.5 }} align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    onClick={() => setManageMember(profile)}
                    sx={{ fontSize: 12, py: 0.5, px: 1.5, minWidth: 0 }}
                  >
                    Manage
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Manage modal */}
      <Dialog
        open={!!manageMember}
        onClose={() => setManageMember(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        {manageMember && (
          <>
            <DialogTitle sx={{ pb: 0.5 }}>
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
              {/* Context actions */}
              {PENDING_STATUSES.includes(manageMember.membership_status) && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 11 }}>
                    Approve
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    disabled={loading === manageMember.id}
                    onClick={() => handleApprove(manageMember.id)}
                    sx={{ mb: 2, justifyContent: 'flex-start', px: 2 }}
                  >
                    Approve application
                  </Button>
                  <Divider sx={{ mb: 2 }} />
                </>
              )}

              {EXPIRED_STATUSES.includes(manageMember.membership_status) && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 11 }}>
                    Reactivate
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    disabled={loading === manageMember.id}
                    onClick={() => handleSetStatus(manageMember.id, 'active')}
                    sx={{ mb: 2, justifyContent: 'flex-start', px: 2 }}
                  >
                    Reactivate membership
                  </Button>
                  <Divider sx={{ mb: 2 }} />
                </>
              )}

              {manageMember.role !== 'admin' && ACTIVE_STATUSES.includes(manageMember.membership_status) && (
                <>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    disabled={loading === manageMember.id}
                    onClick={() => handleMakeAdmin(manageMember.id)}
                    sx={{ mb: 2, justifyContent: 'flex-start', px: 2 }}
                  >
                    Make admin
                  </Button>
                  <Divider sx={{ mb: 2 }} />
                </>
              )}

              {/* Status change actions */}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 11 }}>
                Change status
              </Typography>
              <Stack spacing={1}>
                {MANAGE_ACTIONS.filter(a => a.status !== manageMember.membership_status).map(action => (
                  <Box key={action.status}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color={action.color}
                      disabled={loading === manageMember.id}
                      onClick={() => handleSetStatus(manageMember.id, action.status)}
                      sx={{ justifyContent: 'space-between', px: 2, textAlign: 'left' }}
                    >
                      <span>{action.label}</span>
                      <Typography component="span" variant="body2" sx={{ opacity: 0.7, fontWeight: 400, fontSize: 11 }}>
                        {action.description}
                      </Typography>
                    </Button>
                  </Box>
                ))}
              </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setManageMember(null)} color="secondary" variant="outlined">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  )
}

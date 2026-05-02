'use client'

import { useState, useTransition } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import GavelIcon from '@mui/icons-material/Gavel'
import { TrashBtn } from '@/components/ui/TrashBtn'

type Judge = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  website: string | null
  competitionsJudged: number
  lastJudgeDate: string | null
}

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 0.75 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.primary' }}>{children}</Typography>
      {optional && (
        <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>optional</Typography>
      )}
    </Box>
  )
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function JudgeModal({ open, onClose, onSave, editJudge }: {
  open: boolean
  onClose: () => void
  onSave: (judge: Judge) => void
  editJudge?: Judge | null
}) {
  const isEdit = !!editJudge

  const [firstName, setFirstName] = useState(editJudge?.firstName ?? '')
  const [lastName,  setLastName]  = useState(editJudge?.lastName  ?? '')
  const [email,     setEmail]     = useState(editJudge?.email     ?? '')
  const [phone,     setPhone]     = useState(editJudge?.phone     ?? '')
  const [website,   setWebsite]   = useState(editJudge?.website   ?? '')
  const [submitted, setSubmitted] = useState(false)
  const [pending,   start]        = useTransition()

  // Sync fields when editJudge changes (modal re-opens for a different judge)
  const [lastEditId, setLastEditId] = useState(editJudge?.id)
  if (editJudge?.id !== lastEditId) {
    setLastEditId(editJudge?.id)
    setFirstName(editJudge?.firstName ?? '')
    setLastName(editJudge?.lastName   ?? '')
    setEmail(editJudge?.email         ?? '')
    setPhone(editJudge?.phone         ?? '')
    setWebsite(editJudge?.website     ?? '')
    setSubmitted(false)
  }

  function validate() {
    return {
      firstName: !firstName.trim() ? 'First name is required' : null,
      lastName:  !lastName.trim()  ? 'Last name is required'  : null,
      email:     !email.trim()
        ? 'Email is required'
        : !EMAIL_RE.test(email)
          ? 'Enter a valid email address'
          : null,
    }
  }

  function handleClose() {
    setFirstName(''); setLastName(''); setEmail('')
    setPhone(''); setWebsite(''); setSubmitted(false)
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    const errs = validate()
    if (errs.firstName || errs.lastName || errs.email) return
    start(async () => {
      // replace with server action once judges table exists
      onSave({
        id:                 editJudge?.id ?? crypto.randomUUID(),
        firstName:          firstName.trim(),
        lastName:           lastName.trim(),
        email:              email.trim(),
        phone:              phone.trim() || null,
        website:            website.trim() || null,
        competitionsJudged: editJudge?.competitionsJudged ?? 0,
        lastJudgeDate:      editJudge?.lastJudgeDate      ?? null,
      })
      handleClose()
    })
  }

  const errs = validate()
  const show  = submitted

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{isEdit ? 'Edit judge' : 'New judge'}</DialogTitle>
      <form onSubmit={handleSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>

            <Stack direction="row" spacing={1.5}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>First name</FieldLabel>
                <TextField
                  size="small" fullWidth autoFocus placeholder="Jane"
                  value={firstName} onChange={e => setFirstName(e.target.value)}
                  error={show && !!errs.firstName}
                  helperText={show ? errs.firstName : undefined}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>Last name</FieldLabel>
                <TextField
                  size="small" fullWidth placeholder="Smith"
                  value={lastName} onChange={e => setLastName(e.target.value)}
                  error={show && !!errs.lastName}
                  helperText={show ? errs.lastName : undefined}
                />
              </Box>
            </Stack>

            <Box>
              <FieldLabel>Email</FieldLabel>
              <TextField
                size="small" fullWidth type="email" placeholder="jane@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                error={show && !!errs.email}
                helperText={show && errs.email
                  ? errs.email
                  : <Typography component="span" sx={{ fontSize: 11, color: 'text.disabled', lineHeight: 1.5 }}>
                      A magic-link will be sent here when the judge is assigned to a competition.
                    </Typography>
                }
              />
            </Box>

            <Box>
              <FieldLabel optional>Phone</FieldLabel>
              <TextField
                size="small" fullWidth type="tel" placeholder="+1 555 000 0000"
                value={phone} onChange={e => setPhone(e.target.value)}
              />
            </Box>

            <Box>
              <FieldLabel optional>Personal website</FieldLabel>
              <TextField
                size="small" fullWidth type="url" placeholder="https://..."
                value={website} onChange={e => setWebsite(e.target.value)}
              />
            </Box>

          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClose} variant="outlined" color="secondary" size="small" disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" size="small" disabled={pending}>
            {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Judge'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

function DeleteConfirmDialog({ open, onClose, onConfirm }: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete judge?</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.7 }}>
          Are you sure you want to delete this judge? Voting history will be lost and cannot be recovered.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} variant="outlined" color="secondary" size="small">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error" size="small">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function JudgesClient({ judges: initial }: { judges: Judge[] }) {
  const [judges,      setJudges]      = useState<Judge[]>(initial)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editJudge,   setEditJudge]   = useState<Judge | null>(null)
  const [deleteId,    setDeleteId]    = useState<string | null>(null)

  function handleSave(judge: Judge) {
    setJudges(prev => {
      const exists = prev.some(j => j.id === judge.id)
      return exists ? prev.map(j => j.id === judge.id ? judge : j) : [...prev, judge]
    })
  }

  function handleDelete() {
    if (!deleteId) return
    setJudges(prev => prev.filter(j => j.id !== deleteId))
    setDeleteId(null)
  }

  function openEdit(judge: Judge) {
    setEditJudge(judge)
    setModalOpen(true)
  }

  function openNew() {
    setEditJudge(null)
    setModalOpen(true)
  }

  return (
    <>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Judges</h1>
          <p className="mt-1 text-sm text-content-secondary">Manage judges available for competition assignments.</p>
        </Box>
        {judges.length > 0 && (
          <Button variant="contained" size="small" onClick={openNew}>
            Add Judge
          </Button>
        )}
      </Box>

{judges.length === 0 ? (
        <Paper variant="outlined" sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <GavelIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
            No judges added yet
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Add judges here to assign them to competitions.
          </Typography>
          <Button variant="contained" sx={{ mt: 0.5 }} onClick={openNew}>
            Add judge
          </Button>
        </Paper>
      ) : (
        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['First name', 'Last name', 'Email', 'Phone', 'Tot Judged', 'Last judged', '', '', ''].map((h, i) => (
                  <TableCell key={i} sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', py: 1.25, whiteSpace: 'nowrap', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {judges.map(judge => (
                <TableRow key={judge.id} hover>
                  <TableCell sx={{ fontSize: 14, py: 1.25, fontFamily: 'inherit' }}>{judge.firstName}</TableCell>
                  <TableCell sx={{ fontSize: 14, py: 1.25, fontFamily: 'inherit' }}>{judge.lastName}</TableCell>
                  <TableCell sx={{ fontSize: 14, py: 1.25, fontFamily: 'inherit' }}>{judge.email}</TableCell>
                  <TableCell sx={{ fontSize: 14, py: 1.25, fontFamily: 'inherit', color: judge.phone ? 'text.primary' : 'text.disabled' }}>
                    {judge.phone ?? '—'}
                  </TableCell>
                  <TableCell sx={{ fontSize: 14, py: 1.25, fontFamily: 'inherit', textAlign: 'center' }}>{judge.competitionsJudged}</TableCell>
                  <TableCell sx={{ fontSize: 14, py: 1.25, fontFamily: 'inherit', color: judge.lastJudgeDate ? 'text.primary' : 'text.disabled', whiteSpace: 'nowrap' }}>
                    {judge.lastJudgeDate
                      ? new Date(judge.lastJudgeDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                      : '—'}
                  </TableCell>
                  <TableCell sx={{ py: 1.25, fontFamily: 'inherit' }}>
                    <Link
                      component="button"
                      underline="hover"
                      onClick={() => openEdit(judge)}
                      sx={{ fontSize: 14, fontFamily: 'inherit', color: '#1A6FC4', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Edit
                    </Link>
                  </TableCell>
                  <TableCell sx={{ py: 1.25, fontFamily: 'inherit' }}>
                    <Link href={`/admin/judges/${judge.id}`} underline="hover" sx={{ fontSize: 14, fontFamily: 'inherit', color: '#1A6FC4', whiteSpace: 'nowrap' }}>
                      Stats
                    </Link>
                  </TableCell>
                  <TableCell sx={{ py: 1.25, fontFamily: 'inherit' }}>
                    <Tooltip title="Delete judge">
                      <span>
                        <TrashBtn onClick={() => setDeleteId(judge.id)} />
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <JudgeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editJudge={editJudge}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </>
  )
}

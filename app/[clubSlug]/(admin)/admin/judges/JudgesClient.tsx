'use client'

import { useState, useTransition } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import GavelIcon from '@mui/icons-material/Gavel'
import { TrashBtn } from '@/components/ui/TrashBtn'
import { saveJudge, deleteJudge } from './actions'
import type { JudgeWithCount } from './page'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const COL_HEAD = {
  fontSize: 11, fontWeight: 600, color: 'text.secondary',
  textTransform: 'uppercase' as const, letterSpacing: '0.05em',
  py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider',
  bgcolor: 'background.default', fontFamily: 'inherit',
}

const COL_CELL = {
  fontSize: 14, py: 1.25, px: 2,
  borderBottom: '1px solid', borderColor: 'divider',
  fontFamily: 'inherit',
}

// ─── Judge modal (add / edit) ─────────────────────────────────────────────────

function JudgeModal({ open, onClose, onSaved, editJudge }: {
  open:       boolean
  onClose:    () => void
  onSaved:    (judge: JudgeWithCount) => void
  editJudge?: JudgeWithCount | null
}) {
  const isEdit = !!editJudge

  const [firstName, setFirstName] = useState(editJudge?.first_name ?? '')
  const [lastName,  setLastName]  = useState(editJudge?.last_name  ?? '')
  const [email,     setEmail]     = useState(editJudge?.email      ?? '')
  const [phone,     setPhone]     = useState(editJudge?.phone      ?? '')
  const [website,   setWebsite]   = useState(editJudge?.website    ?? '')
  const [submitted, setSubmitted] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [pending,   start]        = useTransition()

  // Sync fields when editJudge changes
  const [lastEditId, setLastEditId] = useState(editJudge?.id)
  if (editJudge?.id !== lastEditId) {
    setLastEditId(editJudge?.id)
    setFirstName(editJudge?.first_name ?? '')
    setLastName(editJudge?.last_name   ?? '')
    setEmail(editJudge?.email          ?? '')
    setPhone(editJudge?.phone          ?? '')
    setWebsite(editJudge?.website      ?? '')
    setSubmitted(false)
    setError(null)
  }

  function validate() {
    return {
      firstName: !firstName.trim() ? 'First name is required' : null,
      lastName:  !lastName.trim()  ? 'Last name is required'  : null,
      email:     !email.trim()
        ? 'Email is required'
        : !EMAIL_RE.test(email.trim())
          ? 'Enter a valid email address'
          : null,
    }
  }

  function handleClose() {
    setFirstName(''); setLastName(''); setEmail('')
    setPhone(''); setWebsite(''); setSubmitted(false); setError(null)
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setError(null)
    const errs = validate()
    if (errs.firstName || errs.lastName || errs.email) return
    start(async () => {
      try {
        const saved = await saveJudge({
          id:         editJudge?.id,
          first_name: firstName.trim(),
          last_name:  lastName.trim(),
          email:      email.trim(),
          phone:      phone.trim() || null,
          website:    website.trim() || null,
        })
        onSaved({ ...saved, competitionCount: editJudge?.competitionCount ?? 0 })
        handleClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed')
      }
    })
  }

  const errs = validate()
  const show = submitted

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{isEdit ? 'Edit judge' : 'Add judge'}</DialogTitle>
      <form onSubmit={handleSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>

            <Stack direction="row" spacing={1.5}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.75 }}>First name</Typography>
                <TextField
                  size="small" fullWidth autoFocus placeholder="Jane"
                  value={firstName} onChange={e => setFirstName(e.target.value)}
                  error={show && !!errs.firstName}
                  helperText={show ? errs.firstName : undefined}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.75 }}>Last name</Typography>
                <TextField
                  size="small" fullWidth placeholder="Smith"
                  value={lastName} onChange={e => setLastName(e.target.value)}
                  error={show && !!errs.lastName}
                  helperText={show ? errs.lastName : undefined}
                />
              </Box>
            </Stack>

            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.75 }}>Email</Typography>
              <TextField
                size="small" fullWidth type="email" placeholder="jane@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                error={show && !!errs.email}
                helperText={show && errs.email
                  ? errs.email
                  : <Typography component="span" sx={{ fontSize: 11, color: 'text.disabled', lineHeight: 1.5 }}>
                      A magic-link will be sent here when assigned to a competition.
                    </Typography>
                }
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 0.75 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Phone</Typography>
                <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>optional</Typography>
              </Box>
              <TextField
                size="small" fullWidth type="tel" placeholder="+1 555 000 0000"
                value={phone} onChange={e => setPhone(e.target.value)}
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 0.75 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Website</Typography>
                <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>optional</Typography>
              </Box>
              <TextField
                size="small" fullWidth type="url" placeholder="https://..."
                value={website} onChange={e => setWebsite(e.target.value)}
              />
            </Box>

            {error && (
              <Typography sx={{ fontSize: 13, color: 'error.main' }}>⚠ {error}</Typography>
            )}

          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClose} variant="outlined" color="secondary" size="small" disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" size="small" disabled={pending}>
            {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Add judge'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirmDialog({ open, onClose, onConfirm }: {
  open:      boolean
  onClose:   () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Remove judge?</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.7 }}>
          This removes the judge from your directory. Any competitions they&apos;ve already been assigned to are not affected.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} variant="outlined" color="secondary" size="small">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error" size="small">
          Remove
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Details modal ────────────────────────────────────────────────────────────

function JudgeDetailsModal({ judge, onClose, onEdit }: {
  judge:   JudgeWithCount
  onClose: () => void
  onEdit:  () => void
}) {
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {judge.first_name} {judge.last_name}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Email</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 500 }}>
                {judge.email}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Phone</Typography>
              <Typography sx={{ fontSize: 13, color: judge.phone ? 'text.primary' : 'text.disabled', fontWeight: judge.phone ? 500 : 400 }}>
                {judge.phone ?? '—'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Website</Typography>
              {judge.website ? (
                <Typography
                  component="a"
                  href={judge.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ fontSize: 13, color: 'primary.main', fontWeight: 500, wordBreak: 'break-all', textAlign: 'right' }}
                >
                  {judge.website.replace(/^https?:\/\//, '')}
                </Typography>
              ) : (
                <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>—</Typography>
              )}
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Competitions judged</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 500 }}>
                {judge.competitionCount}
              </Typography>
            </Box>
          </Box>

        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onEdit} variant="outlined" color="secondary" size="small">
          Edit
        </Button>
        <Button onClick={onClose} variant="contained" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function JudgesClient({ judges: initial }: { judges: JudgeWithCount[] }) {
  const [judges,      setJudges]      = useState<JudgeWithCount[]>(initial)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editJudge,   setEditJudge]   = useState<JudgeWithCount | null>(null)
  const [detailJudge, setDetailJudge] = useState<JudgeWithCount | null>(null)
  const [deleteId,    setDeleteId]    = useState<string | null>(null)
  const [pending,     start]          = useTransition()

  function handleSaved(judge: JudgeWithCount) {
    setJudges(prev => {
      const exists = prev.some(j => j.id === judge.id)
      return exists
        ? prev.map(j => j.id === judge.id ? judge : j)
        : [...prev, judge].sort((a, b) =>
            (a.last_name ?? '').localeCompare(b.last_name ?? '') ||
            (a.first_name ?? '').localeCompare(b.first_name ?? ''))
    })
  }

  function handleDelete() {
    if (!deleteId) return
    const id = deleteId
    setDeleteId(null)
    start(async () => {
      await deleteJudge(id)
      setJudges(prev => prev.filter(j => j.id !== id))
    })
  }

  function openEdit(judge: JudgeWithCount) {
    setEditJudge(judge)
    setDetailJudge(null)
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
            Add judge
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
            Add judges here to quickly assign them to competitions.
          </Typography>
          <Button variant="contained" sx={{ mt: 0.5 }} onClick={openNew}>
            Add judge
          </Button>
        </Paper>
      ) : (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Name', 'Email', 'Phone', 'Competitions judged', '', ''].map((h, i) => (
                  <TableCell key={i} sx={COL_HEAD}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {judges.map(judge => (
                <TableRow key={judge.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ ...COL_CELL, fontWeight: 500 }}>
                    {judge.first_name} {judge.last_name}
                  </TableCell>
                  <TableCell sx={{ ...COL_CELL, color: 'text.secondary' }}>
                    {judge.email}
                  </TableCell>
                  <TableCell sx={{ ...COL_CELL, color: judge.phone ? 'text.primary' : 'text.disabled' }}>
                    {judge.phone ?? '—'}
                  </TableCell>
                  <TableCell sx={{ ...COL_CELL, color: 'text.secondary' }}>
                    {judge.competitionCount > 0 ? judge.competitionCount : '—'}
                  </TableCell>
                  <TableCell sx={{ ...COL_CELL, width: 70 }}>
                    <Typography
                      component="button"
                      onClick={() => setDetailJudge(judge)}
                      sx={{ fontSize: 14, fontFamily: 'inherit', color: 'primary.main', background: 'none', border: 'none', cursor: 'pointer', p: 0, '&:hover': { textDecoration: 'underline' } }}
                    >
                      Details
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ ...COL_CELL, width: 40 }}>
                    <Tooltip title="Remove judge">
                      <span>
                        <TrashBtn onClick={() => setDeleteId(judge.id)} disabled={pending} />
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      <JudgeModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditJudge(null) }}
        onSaved={handleSaved}
        editJudge={editJudge}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />

      {detailJudge && (
        <JudgeDetailsModal
          judge={detailJudge}
          onClose={() => setDetailJudge(null)}
          onEdit={() => openEdit(detailJudge)}
        />
      )}
    </>
  )
}

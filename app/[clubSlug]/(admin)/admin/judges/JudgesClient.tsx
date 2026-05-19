'use client'

import { useState, useTransition } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { saveJudge, deleteJudge } from './actions'
import type { JudgeRow } from './actions'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function JudgeModal({ open, onClose, onSaved, editJudge }: {
  open:       boolean
  onClose:    () => void
  onSaved:    (judge: JudgeRow) => void
  editJudge?: JudgeRow | null
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
        onSaved(saved)
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

export default function JudgesClient({ judges: initial }: { judges: JudgeRow[] }) {
  const [judges,    setJudges]    = useState<JudgeRow[]>(initial)
  const [modalOpen, setModalOpen] = useState(false)
  const [editJudge, setEditJudge] = useState<JudgeRow | null>(null)
  const [deleteId,  setDeleteId]  = useState<string | null>(null)
  const [pending,   start]        = useTransition()

  function handleSaved(judge: JudgeRow) {
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

  function openEdit(judge: JudgeRow) {
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
        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['First name', 'Last name', 'Email', 'Phone', 'Website', '', ''].map((h, i) => (
                  <TableCell key={i} sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', py: 1.25, fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {judges.map(judge => (
                <TableRow key={judge.id} hover>
                  <TableCell sx={{ fontSize: 14, py: 1.25, fontFamily: 'inherit' }}>{judge.first_name}</TableCell>
                  <TableCell sx={{ fontSize: 14, py: 1.25, fontFamily: 'inherit', fontWeight: 500 }}>{judge.last_name}</TableCell>
                  <TableCell sx={{ fontSize: 14, py: 1.25, fontFamily: 'inherit', color: 'text.secondary' }}>{judge.email}</TableCell>
                  <TableCell sx={{ fontSize: 14, py: 1.25, fontFamily: 'inherit', color: judge.phone ? 'text.primary' : 'text.disabled' }}>
                    {judge.phone ?? '—'}
                  </TableCell>
                  <TableCell sx={{ fontSize: 14, py: 1.25, fontFamily: 'inherit', color: 'text.secondary', maxWidth: 160 }}>
                    {judge.website
                      ? <a href={judge.website} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{judge.website.replace(/^https?:\/\//, '')}</a>
                      : <span style={{ color: '#aaa' }}>—</span>
                    }
                  </TableCell>
                  <TableCell sx={{ py: 1.25, width: 60 }}>
                    <Button
                      size="small" variant="text"
                      onClick={() => openEdit(judge)}
                      disabled={pending}
                      sx={{ fontSize: 13, fontFamily: 'inherit', minWidth: 0, p: '2px 8px' }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                  <TableCell sx={{ py: 1.25, width: 40 }}>
                    <Tooltip title="Remove judge">
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
        onClose={() => { setModalOpen(false); setEditJudge(null) }}
        onSaved={handleSaved}
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

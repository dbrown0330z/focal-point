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

type Judge = {
  id:    string
  name:  string
  email: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function JudgeModal({ open, onClose, editJudge }: {
  open:       boolean
  onClose:    () => void
  editJudge?: Judge | null
}) {
  const isEdit = !!editJudge

  const [name,      setName]      = useState(editJudge?.name  ?? '')
  const [email,     setEmail]     = useState(editJudge?.email ?? '')
  const [submitted, setSubmitted] = useState(false)
  const [pending,   start]        = useTransition()

  // Sync fields when editJudge changes
  const [lastEditId, setLastEditId] = useState(editJudge?.id)
  if (editJudge?.id !== lastEditId) {
    setLastEditId(editJudge?.id)
    setName(editJudge?.name   ?? '')
    setEmail(editJudge?.email ?? '')
    setSubmitted(false)
  }

  function validate() {
    return {
      name:  !name.trim()  ? 'Name is required' : null,
      email: !email.trim()
        ? 'Email is required'
        : !EMAIL_RE.test(email)
          ? 'Enter a valid email address'
          : null,
    }
  }

  function handleClose() {
    setName(''); setEmail(''); setSubmitted(false)
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    const errs = validate()
    if (errs.name || errs.email) return
    start(async () => {
      await saveJudge({ id: editJudge?.id, name: name.trim(), email: email.trim() })
      handleClose()
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
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.75 }}>Name</Typography>
              <TextField
                size="small" fullWidth autoFocus placeholder="Jane Smith"
                value={name} onChange={e => setName(e.target.value)}
                error={show && !!errs.name}
                helperText={show ? errs.name : undefined}
              />
            </Box>
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

export default function JudgesClient({ judges: initial }: { judges: Judge[] }) {
  const [judges,    setJudges]    = useState<Judge[]>(initial)
  const [modalOpen, setModalOpen] = useState(false)
  const [editJudge, setEditJudge] = useState<Judge | null>(null)
  const [deleteId,  setDeleteId]  = useState<string | null>(null)
  const [pending,   start]        = useTransition()

  function openEdit(judge: Judge) {
    setEditJudge(judge)
    setModalOpen(true)
  }

  function openNew() {
    setEditJudge(null)
    setModalOpen(true)
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
                {['Name', 'Email', '', ''].map((h, i) => (
                  <TableCell key={i} sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', py: 1.25, fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {judges.map(judge => (
                <TableRow key={judge.id} hover>
                  <TableCell sx={{ fontSize: 14, py: 1.25, fontFamily: 'inherit', fontWeight: 500 }}>{judge.name}</TableCell>
                  <TableCell sx={{ fontSize: 14, py: 1.25, fontFamily: 'inherit', color: 'text.secondary' }}>{judge.email}</TableCell>
                  <TableCell sx={{ py: 1.25, fontFamily: 'inherit', width: 60 }}>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => openEdit(judge)}
                      disabled={pending}
                      sx={{ fontSize: 13, fontFamily: 'inherit', minWidth: 0, p: '2px 8px' }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                  <TableCell sx={{ py: 1.25, fontFamily: 'inherit', width: 40 }}>
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

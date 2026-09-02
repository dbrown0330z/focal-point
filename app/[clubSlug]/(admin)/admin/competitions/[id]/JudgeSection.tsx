'use client'

import { useState, useTransition } from 'react'
import { addJudge, addJudgeFromMember, removeJudge, adminGrantJudgeAccess } from '../actions'
import { saveJudge } from '../../judges/actions'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

type JudgeToken = {
  id:                  string
  judge_name:          string
  judge_email:         string
  token:               string
  access_code:         string | null
  invitation_sent_at?: string | null
}

type Member = {
  id:   string
  name: string
}

type Props = {
  competitionId:     string
  competitionStatus: string
  judgeTokens:       JudgeToken[]
  judgingOpensAt:    string | null
  judgingClosesAt:   string | null
  origin:            string
  members:           Member[]
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function deriveState(
  tokens: JudgeToken[],
  judgingOpensAt: string | null,
  judgingClosesAt: string | null,
  status: string,
): 'no-judge' | 'pre-window' | 'window-open' | 'complete' {
  if (tokens.length === 0) return 'no-judge'
  if (status === 'closed') return 'complete'
  const now = new Date()
  if (judgingClosesAt && now > new Date(judgingClosesAt)) return 'complete'
  // Competition status 'judging' means the admin has explicitly opened the judging
  // window — show the link and PIN immediately regardless of the scheduled date.
  if (status === 'judging') return 'window-open'
  if (judgingOpensAt  && now >= new Date(judgingOpensAt))  return 'window-open'
  return 'pre-window'
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ─── Add-new-judge modal (same fields as the Judges page) ─────────────────────

function AddJudgeModal({
  open,
  onClose,
  onSaved,
}: {
  open:    boolean
  onClose: () => void
  onSaved: (name: string, email: string) => void
}) {
  const [firstName,  setFirstName]  = useState('')
  const [lastName,   setLastName]   = useState('')
  const [email,      setEmail]      = useState('')
  const [phone,      setPhone]      = useState('')
  const [website,    setWebsite]    = useState('')
  const [submitted,  setSubmitted]  = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [pending,    start]         = useTransition()

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
        await saveJudge({
          first_name: firstName.trim(),
          last_name:  lastName.trim(),
          email:      email.trim(),
          phone:      phone.trim() || null,
          website:    website.trim() || null,
        })
        const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
        onSaved(fullName, email.trim())
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
      <DialogTitle>Add judge</DialogTitle>
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
            {pending ? 'Saving…' : 'Add judge'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

// ─── Assign-judge panel ───────────────────────────────────────────────────────

function AssignJudgePanel({
  competitionId,
  members,
  onCancel,
}: {
  competitionId: string
  members:       Member[]
  onCancel?:     () => void
}) {
  const [selectedId,   setSelectedId]   = useState('')
  const [modalOpen,    setModalOpen]    = useState(false)
  const [isPending,    startTransition] = useTransition()
  const [error,        setError]        = useState('')

  function handleAssign() {
    setError('')
    if (!selectedId) { setError('Please select a judge.'); return }
    startTransition(async () => {
      try {
        await addJudgeFromMember(competitionId, selectedId)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to assign judge')
      }
    })
  }

  async function handleNewJudgeSaved(name: string, email: string) {
    // Assign the newly-added judge to this competition directly
    const fd = new FormData()
    fd.set('judge_name',  name)
    fd.set('judge_email', email)
    await addJudge(competitionId, fd)
  }

  return (
    <div className="space-y-3 px-4 py-3">
      {/* Select from existing judge list */}
      <FormControl fullWidth size="small">
        <Select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          displayEmpty
        >
          <MenuItem value=""><em>Select a judge…</em></MenuItem>
          {members.map(m => (
            <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {error && <p className="text-xs text-status-error-text">⚠ {error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleAssign}
          disabled={isPending || !selectedId}
          className="rounded-lg bg-action-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-action-primary-hover transition-colors disabled:opacity-60"
        >
          {isPending ? 'Assigning…' : 'Assign judge'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border-default px-3 py-1.5 text-sm font-medium text-content-primary hover:bg-surface-1 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 border-t border-border-subtle" />
        <span className="text-xs text-content-tertiary">or</span>
        <div className="flex-1 border-t border-border-subtle" />
      </div>

      {/* Add new judge */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-action-primary hover:underline transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add new judge
      </button>

      <AddJudgeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleNewJudgeSaved}
      />
    </div>
  )
}

export function JudgeSection({
  competitionId,
  competitionStatus,
  judgeTokens,
  judgingOpensAt,
  judgingClosesAt,
  origin,
  members,
}: Props) {
  const state = deriveState(judgeTokens, judgingOpensAt, judgingClosesAt, competitionStatus)
  const judge = judgeTokens[0] ?? null
  const judgingUrl = judge ? `${origin}/judge/${judge.token}` : ''

  const [copied,        setCopied]        = useState(false)
  const [codeCopied,    setCodeCopied]    = useState(false)
  const [showConfirm,   setShowConfirm]   = useState(false)
  const [showAddForm,   setShowAddForm]   = useState(false)
  const [removePending, setRemovePending] = useState(false)
  const [portalPending, startPortal]      = useTransition()

  const handleCopy = () => {
    navigator.clipboard.writeText(judgingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRemoveAndReplace = async () => {
    setRemovePending(true)
    setShowConfirm(false)
    await removeJudge(judge!.id, competitionId)
    setShowAddForm(true)
    setRemovePending(false)
  }

  // ── State: no judge ──────────────────────────────────────────────────────────

  if (state === 'no-judge' || showAddForm) {
    const daysUntilOpen = judgingOpensAt
      ? Math.round((new Date(judgingOpensAt).getTime() - Date.now()) / 86_400_000)
      : null
    const showWarning = daysUntilOpen !== null && daysUntilOpen >= 0 && daysUntilOpen <= 7

    return (
      <div className="rounded-xl border border-border-default bg-surface-2 divide-y divide-border-subtle">
        {showWarning && (
          <div className="px-4 py-3 bg-status-warning-bg border-b border-status-warning rounded-t-xl">
            <p className="text-sm font-medium text-status-warning-text">
              ⚠ Judging window opens {daysUntilOpen === 0 ? 'today' : `in ${daysUntilOpen} day${daysUntilOpen === 1 ? '' : 's'}`}
            </p>
            <p className="text-xs text-status-warning-text mt-0.5">
              Assign a judge before the window opens so they can begin scoring.
            </p>
          </div>
        )}
        {!showWarning && (
          <p className="px-4 py-3 text-sm text-content-tertiary">No judge assigned yet.</p>
        )}
        <AssignJudgePanel
          competitionId={competitionId}
          members={members}
          onCancel={showAddForm ? () => setShowAddForm(false) : undefined}
        />
      </div>
    )
  }

  // ── State: complete ──────────────────────────────────────────────────────────

  if (state === 'complete') {
    return (
      <div className="rounded-xl border border-border-default bg-surface-2">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-content-primary">{judge.judge_name}</p>
              <p className="text-xs text-content-tertiary">{judge.judge_email}</p>
            </div>
            <span className="text-xs text-content-tertiary">Judging complete</span>
          </div>
          {judgingUrl && (
            <>
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-surface-1 px-3 py-2">
                <span className="flex-1 truncate font-mono text-xs text-content-secondary">
                  {judgingUrl}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(judgingUrl)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="shrink-0 text-xs text-content-tertiary hover:text-content-primary transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              {judge.access_code && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs text-content-tertiary">Access code:</span>
                  <span className="font-mono text-sm font-semibold tracking-widest text-content-primary">
                    {judge.access_code}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(judge.access_code!)
                      setCodeCopied(true)
                      setTimeout(() => setCodeCopied(false), 2000)
                    }}
                    className="text-xs text-content-tertiary hover:text-content-primary transition-colors"
                  >
                    {codeCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}
              <div className="mt-2">
                <button
                  type="button"
                  disabled={portalPending}
                  onClick={() => startPortal(async () => {
                    await adminGrantJudgeAccess(judge.token)
                    window.open(`/judge/${judge.token}/landing`, '_blank')
                  })}
                  className="text-xs font-medium text-action-primary hover:underline disabled:opacity-60 transition-colors"
                >
                  {portalPending ? 'Opening…' : 'Open judging portal →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── State: pre-window or window-open ─────────────────────────────────────────

  const isWindowOpen = state === 'window-open'

  return (
    <>
      <div className="rounded-xl border border-border-default bg-surface-2 divide-y divide-border-subtle">
        {isWindowOpen && (
          <div className="px-4 py-2.5 bg-status-warning-bg rounded-t-xl">
            <p className="text-xs font-medium text-status-warning-text">
              Judging window is open
              {judgingClosesAt && ` · Closes ${fmtDate(judgingClosesAt)}`}
            </p>
          </div>
        )}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-content-primary">{judge.judge_name}</p>
              <p className="text-xs text-content-tertiary">{judge.judge_email}</p>
              {isWindowOpen && judge.invitation_sent_at && (
                <p className="text-xs text-content-tertiary mt-0.5">
                  Invitation sent {fmtDate(judge.invitation_sent_at)}
                </p>
              )}
              {isWindowOpen && !judge.invitation_sent_at && (
                <p className="text-xs text-[#A67C00] mt-0.5">Invitation not yet sent</p>
              )}
            </div>
            <button
              type="button"
              disabled={removePending}
              onClick={() => setShowConfirm(true)}
              className="text-xs text-action-primary hover:underline transition-colors disabled:opacity-40"
            >
              {removePending ? 'Removing…' : 'Change judge'}
            </button>
          </div>
          {/* Magic link — only shown once judging window is open */}
          {isWindowOpen && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-surface-1 px-3 py-2">
              <span className="flex-1 truncate font-mono text-xs text-content-secondary">
                {judgingUrl}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 text-xs text-content-tertiary hover:text-content-primary transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}

          {/* Access code — only shown once judging window is open */}
          {isWindowOpen && judge.access_code && (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-xs text-content-tertiary">Access code:</span>
              <span className="font-mono text-sm font-semibold tracking-widest text-content-primary">
                {judge.access_code}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(judge.access_code!)
                  setCodeCopied(true)
                  setTimeout(() => setCodeCopied(false), 2000)
                }}
                className="text-xs text-content-tertiary hover:text-content-primary transition-colors"
              >
                {codeCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}

          {/* Admin portal access */}
          {isWindowOpen && (
            <div className="mt-2.5">
              <button
                type="button"
                disabled={portalPending}
                onClick={() => startPortal(async () => {
                    await adminGrantJudgeAccess(judge.token)
                    window.open(`/judge/${judge.token}/landing`, '_blank')
                  })}
                className="text-xs font-medium text-action-primary hover:underline disabled:opacity-60 transition-colors"
              >
                {portalPending ? 'Opening…' : 'Open judging portal →'}
              </button>
            </div>
          )}

          {/* Pre-window message: link not yet available */}
          {!isWindowOpen && (
            <div className="mt-2 rounded-lg border border-status-warning bg-status-warning-bg px-3 py-2">
              <p className="text-xs text-status-warning-text">
                The judging link will be available once submissions close
                {judgingOpensAt
                  ? ` — on ${fmtDate(judgingOpensAt)}, or sooner using the Submission Dates section below.`
                  : ' — use the Submission Dates section below to close submissions when ready.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Change judge confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl border border-border-default bg-surface-2 p-6 shadow-xl">
            <h3 className="text-base font-semibold text-content-primary mb-2">Change judge?</h3>
            <p className="text-sm text-content-secondary mb-1">
              This will remove <strong>{judge.judge_name}</strong> and let you assign a new judge.
            </p>
            {isWindowOpen && (
              <p className="text-sm text-[#A67C00] mb-4">
                ⚠ The judging window is currently open. The existing judge's link will stop working immediately.
              </p>
            )}
            {!isWindowOpen && <div className="mb-4" />}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-content-primary hover:bg-surface-1 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveAndReplace}
                className="rounded-lg bg-action-primary px-4 py-2 text-sm font-medium text-white hover:bg-action-primary-hover transition-colors"
              >
                Remove &amp; reassign
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

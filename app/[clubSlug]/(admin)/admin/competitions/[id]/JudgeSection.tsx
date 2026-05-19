'use client'

import { useState, useTransition } from 'react'
import { addJudge, addJudgeFromMember, removeJudge } from '../actions'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

type JudgeToken = {
  id:                  string
  judge_name:          string
  judge_email:         string
  token:               string
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
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
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
  if (judgingOpensAt  && now >= new Date(judgingOpensAt))  return 'window-open'
  return 'pre-window'
}

const inputCls = "w-full rounded-lg border border-border-default bg-surface-0 px-3 py-1.5 text-sm text-content-primary placeholder-content-muted focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"

function AddJudgeForm({
  competitionId,
  members,
  onCancel,
}: {
  competitionId: string
  members:       Member[]
  onCancel?:     () => void
}) {
  const [mode,          setMode]          = useState<'member' | 'manual'>(members.length > 0 ? 'member' : 'manual')
  const [selectedId,    setSelectedId]    = useState('')
  const [manualName,    setManualName]    = useState('')
  const [manualEmail,   setManualEmail]   = useState('')
  const [isPending,     startTransition]  = useTransition()
  const [error,         setError]         = useState('')

  function handleSubmit() {
    setError('')
    if (mode === 'member') {
      if (!selectedId) { setError('Please select a member.'); return }
      startTransition(async () => {
        try {
          await addJudgeFromMember(competitionId, selectedId)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to assign judge')
        }
      })
    } else {
      if (!manualName.trim() || !manualEmail.trim()) { setError('Name and email are required.'); return }
      const fd = new FormData()
      fd.set('judge_name',  manualName.trim())
      fd.set('judge_email', manualEmail.trim())
      startTransition(async () => {
        await addJudge(competitionId, fd)
      })
    }
  }

  return (
    <div className="space-y-3 px-4 py-3">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-border-default overflow-hidden text-xs font-medium w-fit">
        <button
          type="button"
          onClick={() => setMode('member')}
          className={`px-3 py-1.5 transition-colors ${mode === 'member' ? 'bg-action-primary text-white' : 'bg-surface-1 text-content-secondary hover:bg-surface-0'}`}
        >
          Select from list
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`px-3 py-1.5 transition-colors ${mode === 'manual' ? 'bg-action-primary text-white' : 'bg-surface-1 text-content-secondary hover:bg-surface-0'}`}
        >
          Enter manually
        </button>
      </div>

      {mode === 'member' ? (
        <FormControl fullWidth size="small">
          <Select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            displayEmpty
          >
            <MenuItem value=""><em>Select a judge or member…</em></MenuItem>
            {members.map(m => (
              <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={manualName}
            onChange={e => setManualName(e.target.value)}
            placeholder="Judge name"
            className={inputCls}
          />
          <input
            type="email"
            value={manualEmail}
            onChange={e => setManualEmail(e.target.value)}
            placeholder="judge@example.com"
            className={inputCls}
          />
        </div>
      )}

      {error && <p className="text-xs text-status-error-text">⚠ {error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
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
  const [showConfirm,   setShowConfirm]   = useState(false)
  const [showAddForm,   setShowAddForm]   = useState(false)
  const [removePending, setRemovePending] = useState(false)

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
          <div className="px-4 py-3 bg-[#FFFBE6] border-b border-[#F0D060] rounded-t-xl">
            <p className="text-sm font-medium text-[#6B5000]">
              ⚠ Judging window opens {daysUntilOpen === 0 ? 'today' : `in ${daysUntilOpen} day${daysUntilOpen === 1 ? '' : 's'}`}
            </p>
            <p className="text-xs text-[#6B5000] mt-0.5">
              Assign a judge before the window opens so they can begin scoring.
            </p>
          </div>
        )}
        {!showWarning && (
          <p className="px-4 py-3 text-sm text-content-tertiary">No judge assigned yet.</p>
        )}
        <AddJudgeForm
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
          <div className="px-4 py-2.5 bg-[#EDFAF0] rounded-t-xl">
            <p className="text-xs font-medium text-[#174A1A]">
              ✓ Judging window is open
              {judgingClosesAt && ` · Closes ${fmtDate(judgingClosesAt)}`}
            </p>
          </div>
        )}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-content-primary">{judge.judge_name}</p>
              <p className="text-xs text-content-tertiary">{judge.judge_email}</p>
              {judge.invitation_sent_at && (
                <p className="text-xs text-content-tertiary mt-0.5">
                  Invitation sent {fmtDate(judge.invitation_sent_at)}
                </p>
              )}
              {!judge.invitation_sent_at && (
                <p className="text-xs text-[#A67C00] mt-0.5">Invitation not yet sent</p>
              )}
            </div>
            <button
              type="button"
              disabled={removePending}
              onClick={() => setShowConfirm(true)}
              className="text-xs text-content-tertiary hover:text-action-primary transition-colors disabled:opacity-50"
            >
              {removePending ? 'Removing…' : 'Change judge'}
            </button>
          </div>
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
          {!isWindowOpen && judgingOpensAt && (
            <p className="mt-1.5 text-xs text-content-tertiary">
              Judging link becomes active on {fmtDate(judgingOpensAt)}
            </p>
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

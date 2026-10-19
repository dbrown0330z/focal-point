'use client'

import { useState, useTransition } from 'react'
import { publishSite, saveDuesMode } from '@/app/[clubSlug]/(admin)/admin/draft/actions'

// ── Types ─────────────────────────────────────────────────────────────────────

type DuesMode = 'stripe' | 'paypal' | 'offline'

export type DraftChecklist = {
  clubBasicsOk: boolean   // club_settings has name + description
  duesModeOk:   boolean   // clubs.dues_mode is non-null
  currentDuesMode: DuesMode | null
  clubSlug: string
}

// ── Small icons ───────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function CircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ── Dues mode picker (inline, three buttons) ──────────────────────────────────

const DUES_OPTIONS: { value: DuesMode; label: string; sub: string }[] = [
  { value: 'stripe',  label: 'Online — card',    sub: 'Stripe (credit / debit)' },
  { value: 'paypal',  label: 'Online — PayPal',  sub: 'PayPal checkout' },
  { value: 'offline', label: 'Cash or cheque',   sub: 'No online payment needed' },
]

function DuesPicker({
  current,
  onSaved,
}: {
  current: DuesMode | null
  onSaved: (mode: DuesMode) => void
}) {
  const [selected, setSelected] = useState<DuesMode | null>(current)
  const [pending,  start]       = useTransition()
  const [error,    setError]    = useState<string | null>(null)

  async function handleSave() {
    if (!selected) return
    setError(null)
    start(async () => {
      const result = await saveDuesMode(selected)
      if (result.error) { setError(result.error); return }
      onSaved(selected)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {DUES_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSelected(opt.value)}
            style={{
              flex: '1 1 140px',
              border: `1.5px solid ${selected === opt.value ? 'var(--action-primary)' : 'var(--border-default)'}`,
              borderRadius: 8,
              background: selected === opt.value ? 'rgba(26,111,196,0.06)' : 'transparent',
              padding: '10px 12px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{opt.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{opt.sub}</div>
          </button>
        ))}
      </div>

      {error && <p style={{ margin: 0, fontSize: 12, color: 'var(--status-error)' }}>⚠ {error}</p>}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={!selected || pending}
          style={{
            padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
            background: selected ? 'var(--action-primary)' : 'var(--border-default)',
            color: 'white', border: 'none', cursor: selected ? 'pointer' : 'default',
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ── Main banner ───────────────────────────────────────────────────────────────

export default function DraftBanner({
  checklist: initial,
}: {
  checklist: DraftChecklist
}) {
  const [checklist, setChecklist] = useState(initial)
  const [expanded,  setExpanded]  = useState(!initial.clubBasicsOk || !initial.duesModeOk)
  const [publishing, start]       = useTransition()
  const [publishError, setPublishError] = useState<string | null>(null)

  const allDone    = checklist.clubBasicsOk && checklist.duesModeOk
  const remaining  = [!checklist.clubBasicsOk, !checklist.duesModeOk].filter(Boolean).length

  function handleDuesSaved(mode: DuesMode) {
    setChecklist(prev => ({ ...prev, duesModeOk: true, currentDuesMode: mode }))
  }

  async function handlePublish() {
    setPublishError(null)
    start(async () => {
      const result = await publishSite()
      if (result.error) setPublishError(result.error)
      // On success the layout re-renders (revalidatePath) and banner disappears
    })
  }

  return (
    <div style={{
      background: allDone ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
      borderBottom: `1px solid ${allDone ? 'rgba(46,125,50,0.20)' : 'rgba(166,124,0,0.20)'}`,
      fontFamily: 'var(--font-primary)',
    }}>
      {/* ── Summary bar ────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '10px 24px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {/* Status dot */}
        <span style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: allDone ? 'var(--status-success)' : 'var(--status-warning)',
        }} />

        {/* Text */}
        <span style={{ fontSize: 13, color: allDone ? 'var(--status-success-text)' : 'var(--status-warning-text)', flex: 1 }}>
          {allDone
            ? 'Your site is ready to go live — members can\'t access it yet.'
            : `Your site is in draft mode — ${remaining} item${remaining !== 1 ? 's' : ''} to complete before publishing.`}
        </span>

        {/* Expand toggle (when not all done) */}
        {!allDone && (
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              color: 'var(--status-warning-text)', padding: '2px 4px',
            }}
          >
            What&rsquo;s needed <ChevronDown open={expanded} />
          </button>
        )}

        {/* Publish button */}
        <button
          type="button"
          onClick={handlePublish}
          disabled={!allDone || publishing}
          style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600,
            background: allDone ? 'var(--status-success)' : 'var(--border-default)',
            color: allDone ? 'white' : 'var(--text-disabled)',
            border: 'none', cursor: allDone ? 'pointer' : 'default',
            opacity: publishing ? 0.7 : 1, flexShrink: 0,
          }}
        >
          {publishing ? 'Publishing…' : 'Publish site →'}
        </button>
      </div>

      {/* ── Expanded checklist ──────────────────────────────────────────────── */}
      {expanded && (
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '0 24px 16px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', marginBottom: 4 }} />

          {/* Item 1: Club basics */}
          <ChecklistItem
            done={checklist.clubBasicsOk}
            label="Club name & description"
            sub="Add your club's name and a short description so members know they're in the right place."
            action={!checklist.clubBasicsOk ? (
              <a
                href={`/${checklist.clubSlug}/admin/club-defaults`}
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--action-primary)', textDecoration: 'none' }}
              >
                Set up Club Basics →
              </a>
            ) : null}
          />

          {/* Item 2: Dues */}
          <ChecklistItem
            done={checklist.duesModeOk}
            label="How you collect dues"
            sub="Members need to know how to pay before they join. You can change this any time."
            action={!checklist.duesModeOk ? (
              <DuesPicker current={checklist.currentDuesMode} onSaved={handleDuesSaved} />
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {DUES_OPTIONS.find(o => o.value === checklist.currentDuesMode)?.label}
              </span>
            )}
          />

          {publishError && (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--status-error)' }}>⚠ {publishError}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Checklist item ────────────────────────────────────────────────────────────

function ChecklistItem({
  done, label, sub, action,
}: {
  done:    boolean
  label:   string
  sub:     string
  action?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {/* Icon */}
      <span style={{
        marginTop: 1, flexShrink: 0,
        color: done ? 'var(--status-success)' : 'var(--text-disabled)',
      }}>
        {done ? <CheckIcon /> : <CircleIcon />}
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: done ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: done ? 'line-through' : 'none' }}>
            {label}
          </span>
        </div>
        {!done && <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{sub}</p>}
        {action}
      </div>
    </div>
  )
}

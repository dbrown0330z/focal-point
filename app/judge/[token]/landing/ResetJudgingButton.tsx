'use client'

import { useState, useTransition } from 'react'
import { resetJudging } from './actions'

export default function ResetJudgingButton({ token }: { token: string }) {
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition]  = useTransition()

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        style={{
          fontSize:     12,
          fontWeight:   500,
          padding:      '5px 12px',
          borderRadius: 6,
          border:       '1px solid var(--border-default)',
          background:   'transparent',
          color:        'var(--text-tertiary)',
          cursor:       'pointer',
          letterSpacing: '0.01em',
          transition:   'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--status-error)'
          ;(e.currentTarget as HTMLButtonElement).style.color        = 'var(--status-error-text)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)'
          ;(e.currentTarget as HTMLButtonElement).style.color        = 'var(--text-tertiary)'
        }}
      >
        Reset judging
      </button>
    )
  }

  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          8,
      background:   'var(--status-error-bg)',
      border:       '1px solid var(--status-error)',
      borderRadius: 8,
      padding:      '6px 10px',
    }}>
      <span style={{ fontSize: 12, color: 'var(--status-error-text)', fontWeight: 500 }}>
        Wipe all scores?
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          // Clear all bucket triage state from localStorage before server reset
          try {
            const keysToRemove = Object.keys(localStorage).filter(k =>
              k.startsWith(`judge_buckets_${token}_`) ||
              k.startsWith(`judge_rank_${token}_`) ||
              k.startsWith(`judge_scroll_${token}_`)
            )
            keysToRemove.forEach(k => localStorage.removeItem(k))
          } catch {
            // localStorage may be unavailable in some contexts — safe to skip
          }
          startTransition(() => resetJudging(token))
        }}
        style={{
          fontSize:     12,
          fontWeight:   600,
          padding:      '3px 10px',
          borderRadius: 5,
          border:       'none',
          background:   'var(--status-error)',
          color:        '#fff',
          cursor:       pending ? 'wait' : 'pointer',
          opacity:      pending ? 0.7 : 1,
        }}
      >
        {pending ? 'Resetting…' : 'Yes, reset'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        style={{
          fontSize:     12,
          fontWeight:   400,
          padding:      '3px 8px',
          borderRadius: 5,
          border:       '1px solid var(--border-default)',
          background:   'transparent',
          color:        'var(--text-secondary)',
          cursor:       'pointer',
        }}
      >
        Cancel
      </button>
    </div>
  )
}

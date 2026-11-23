'use client'

import { useState } from 'react'
import { submitScores } from './actions'

export default function SubmitButton({
  token,
  judgeName,
  competitionTitle,
  awardsEnabled,
  isAwardsOnly,
}: {
  token:            string
  judgeName:        string
  competitionTitle: string
  awardsEnabled:    boolean
  isAwardsOnly:     boolean
}) {
  const [open,       setOpen]       = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const label = isAwardsOnly
    ? 'Submit awards'
    : awardsEnabled
      ? 'Submit scores and awards'
      : 'Submit all scores'

  async function handleSubmit() {
    setSubmitting(true)
    await submitScores(token)
    // page will revalidate via server action redirect
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          width:        '100%',
          background:   'var(--action-primary)',
          color:        '#fff',
          border:       'none',
          borderRadius: 10,
          padding:      '15px 20px',
          fontSize:     16,
          fontWeight:   700,
          cursor:       'pointer',
          boxShadow:    '0 4px 16px rgba(30,77,140,0.45)',
        }}
      >
        {label} →
      </button>

      {/* Confirmation modal */}
      {open && (
        <div style={{
          position:        'fixed',
          inset:           0,
          background:      'rgba(0,0,0,0.6)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          zIndex:          200,
          padding:         24,
        }}>
          <div style={{
            background:   'var(--surface-2)',
            border:       '1px solid var(--border-default)',
            borderRadius: 14,
            padding:      '28px 28px 24px',
            maxWidth:     420,
            width:        '100%',
          }}>
            <h2 style={{
              fontFamily:    'var(--font-heading)',
              fontSize:      20,
              fontWeight:    700,
              color:         'var(--text-primary)',
              margin:        '0 0 12px',
              letterSpacing: '-0.01em',
            }}>
              {isAwardsOnly ? 'Submit your awards?' : awardsEnabled ? 'Submit scores and awards?' : 'Submit your scores?'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px' }}>
              {isAwardsOnly
                ? `Once submitted your award decisions are final and will be sent to the club admin. You will not be able to make changes after submitting.`
                : awardsEnabled
                  ? `Once submitted your scores and award decisions are final and will be sent to the club admin for results processing. You will not be able to make changes after submitting.`
                  : `Once submitted your scores are final and will be sent to the club admin for results processing. You will not be able to make changes after submitting.`}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setOpen(false)}
                disabled={submitting}
                style={{
                  background:   'none',
                  border:       '1px solid var(--border-default)',
                  borderRadius: 8,
                  padding:      '9px 20px',
                  fontSize:     14,
                  color:        'var(--text-secondary)',
                  cursor:       'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  background:   'var(--action-primary)',
                  color:        '#fff',
                  border:       'none',
                  borderRadius: 8,
                  padding:      '9px 20px',
                  fontSize:     14,
                  fontWeight:   600,
                  cursor:       submitting ? 'wait' : 'pointer',
                  opacity:      submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Submitting…' : `${label} →`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

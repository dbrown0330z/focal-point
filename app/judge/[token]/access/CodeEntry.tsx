'use client'

import { useRef, useState, useCallback } from 'react'
import { verifyCode } from './actions'

const MAX_ATTEMPTS = 3

export default function CodeEntry({ token }: { token: string }) {
  const [digits, setDigits]     = useState(['', '', '', ''])
  const [error, setError]       = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Four individual refs for the digit inputs
  const ref0 = useRef<HTMLInputElement>(null)
  const ref1 = useRef<HTMLInputElement>(null)
  const ref2 = useRef<HTMLInputElement>(null)
  const ref3 = useRef<HTMLInputElement>(null)
  const refs = [ref0, ref1, ref2, ref3]

  const lockedOut = attempts >= MAX_ATTEMPTS

  const submit = useCallback(
    async (code: string) => {
      if (submitting || lockedOut) return
      setSubmitting(true)
      setError(null)

      const result = await verifyCode(token, code)

      // If verifyCode redirects on success, this code won't run
      if (result?.error) {
        const next = attempts + 1
        setAttempts(next)
        if (next >= MAX_ATTEMPTS) {
          setError('Too many incorrect attempts. Please contact the club admin.')
        } else {
          const remaining = MAX_ATTEMPTS - next
          setError(`Incorrect code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`)
        }
        setDigits(['', '', '', ''])
        setTimeout(() => refs[0].current?.focus(), 0)
      }

      setSubmitting(false)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, attempts, submitting, lockedOut],
  )

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const updated = [...digits]
    updated[index] = digit
    setDigits(updated)

    if (digit && index < 3) {
      refs[index + 1].current?.focus()
    }
    if (updated.every(d => d !== '')) {
      submit(updated.join(''))
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const updated = [...digits]
      updated[index - 1] = ''
      setDigits(updated)
      refs[index - 1].current?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) refs[index - 1].current?.focus()
    if (e.key === 'ArrowRight' && index < 3) refs[index + 1].current?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (!pasted) return
    const updated: string[] = ['', '', '', '']
    for (let i = 0; i < pasted.length; i++) updated[i] = pasted[i]
    setDigits(updated)
    const nextEmpty = updated.findIndex(d => !d)
    refs[nextEmpty === -1 ? 3 : nextEmpty].current?.focus()
    if (updated.every(d => d !== '')) submit(updated.join(''))
  }

  const baseInputStyle: React.CSSProperties = {
    width: 60,
    height: 68,
    fontSize: 30,
    fontWeight: 700,
    textAlign: 'center',
    background: 'var(--surface-1)',
    border: '2px solid var(--border-default)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    outline: 'none',
    caretColor: 'transparent',
    fontFamily: 'var(--font-inter, monospace)',
    transition: 'border-color 0.15s',
  }

  return (
    <div>
      {/* Digit inputs */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={d}
            disabled={lockedOut || submitting}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            autoFocus={i === 0}
            autoComplete="one-time-code"
            style={{
              ...baseInputStyle,
              borderColor: lockedOut
                ? 'var(--border-default)'
                : error
                  ? 'var(--status-error)'
                  : d
                    ? 'var(--action-primary)'
                    : 'var(--border-default)',
              opacity: lockedOut || submitting ? 0.5 : 1,
              cursor: lockedOut ? 'not-allowed' : 'text',
            }}
          />
        ))}
      </div>

      {/* Status */}
      <div style={{ minHeight: 20, textAlign: 'center' }}>
        {submitting && (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>Verifying…</p>
        )}
        {error && !submitting && (
          <p style={{ fontSize: 14, color: 'var(--status-error)', margin: 0 }}>{error}</p>
        )}
        {!error && !submitting && !lockedOut && (
          <p style={{ fontSize: 14, color: 'var(--text-hint)', margin: 0 }}>
            Enter the 4-digit code from your invitation email
          </p>
        )}
      </div>
    </div>
  )
}

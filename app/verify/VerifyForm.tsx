'use client'

import { useState, useRef } from 'react'

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  background: '#F9F6F0',
  border: '1px solid rgba(22,20,18,0.18)',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 16,
  color: '#161412',
  height: 44,
  outline: 'none',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 15,
  fontWeight: 600,
  marginBottom: 7,
  color: '#2C2620',
}

export default function VerifyForm({
  token,
  email,
  serverError,
}: {
  token:        string
  email:        string
  serverError?: string
}) {
  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [error,      setError]      = useState<string | null>(serverError ?? null)
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError("Passwords don't match."); return }
    setSubmitting(true)
    formRef.current?.submit()
  }

  return (
    <>
      {/* Hidden form that POSTs to the activation API route — reliably sets session cookies */}
      <form ref={formRef} action="/api/clubs/activate" method="POST" style={{ display: 'none' }}>
        <input type="hidden" name="token"    value={token} />
        <input type="hidden" name="password" value={password} />
        {/* Hidden username for password manager association */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly />
      </form>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
        {/* Visible username field for password managers (hidden visually) */}
        <input
          type="email"
          name="username"
          autoComplete="username"
          value={email}
          readOnly
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
          aria-hidden="true"
        />

        <div>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Confirm password</label>
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="Same again"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            style={inputStyle}
          />
        </div>

        {error && (
          <p role="alert" style={{
            borderRadius: 8, padding: '10px 14px', fontSize: 14, margin: 0,
            background: '#FDEEEE', color: '#7A1515',
            border: '1px solid rgba(211,47,47,0.18)',
          }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            background: submitting ? 'rgba(232,177,74,0.60)' : '#E8B14A',
            color: '#161412',
            border: 'none',
            borderRadius: 8,
            padding: '13px 20px',
            fontSize: 17,
            fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer',
            letterSpacing: '-0.01em',
            marginTop: 4,
          }}
        >
          {submitting ? 'Creating your account…' : 'Create my account →'}
        </button>
      </form>
    </>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { setInitialPassword } from './actions'

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
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 15,
  fontWeight: 600,
  marginBottom: 7,
  color: '#2C2620',
}

export default function CreatePasswordForm({
  clubSlug,
  uid,
  firstName,
}: {
  clubSlug: string
  uid: string
  firstName: string
}) {
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [error,     setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords don\'t match.')
      return
    }
    startTransition(async () => {
      const result = await setInitialPassword(clubSlug, uid, password)
      if (result?.error) setError(result.error)
      // On success, the server action redirects — no client action needed
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FBF6EC',
      fontFamily: 'var(--font-lora, Georgia, serif)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
    }}>
      <div style={{
        background: '#FFFFFF',
        border: '1px solid rgba(22,20,18,0.10)',
        borderRadius: 16,
        padding: 'clamp(32px, 5vw, 52px)',
        boxShadow: '0 2px 16px rgba(22,20,18,0.07)',
        maxWidth: 420,
        width: '100%',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(26,105,72,0.10)',
            marginBottom: 16,
          }}>
            <svg width="22" height="22" fill="none" stroke="#1A6948" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#161412', marginBottom: 8, letterSpacing: '-0.01em' }}>
            {firstName ? `Welcome, ${firstName}!` : 'Email confirmed!'}
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: '#4A4037' }}>
            One last step — create a password to finish setting up your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
          <div>
            <label style={labelStyle}>
              Password
            </label>
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
            <label style={labelStyle}>
              Confirm password
            </label>
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
              borderRadius: 8, padding: '10px 14px', fontSize: 14,
              background: '#FDEEEE', color: '#7A1515',
              border: '1px solid rgba(211,47,47,0.18)',
              margin: 0,
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            style={{
              width: '100%',
              background: isPending ? 'rgba(232,177,74,0.60)' : '#E8B14A',
              color: '#161412',
              border: 'none',
              borderRadius: 8,
              padding: '13px 20px',
              fontSize: 17,
              fontWeight: 700,
              cursor: isPending ? 'not-allowed' : 'pointer',
              letterSpacing: '-0.01em',
              marginTop: 4,
            }}
          >
            {isPending ? 'Setting up your club…' : 'Create account and get started →'}
          </button>
        </form>
      </div>
    </div>
  )
}

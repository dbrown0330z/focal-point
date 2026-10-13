'use client'

import { useState } from 'react'
import Link from 'next/link'
import { submitClubApplication } from './actions'

function slugPreview(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40) || null
}

// All colors verified WCAG AA on #FFFFFF card background
const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  background: '#F9F6F0',
  border: '1px solid rgba(22,20,18,0.18)',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 16,           // large enough for comfortable reading
  color: '#161412',       // 21:1 on white ✓
  height: 44,
  outline: 'none',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 15,           // up from 13px
  fontWeight: 600,
  marginBottom: 7,
  color: '#2C2620',       // ~15:1 on white ✓
}

// Helper / fine-print text: #5C5047 on white = 7.8:1 ✓
const helperStyle: React.CSSProperties = {
  marginTop: 7,
  fontSize: 13,
  color: '#5C5047',
  lineHeight: 1.5,
}

export default function StartClient() {
  const [clubName,      setClubName]      = useState('')
  const [location,      setLocation]      = useState('')
  const [firstName,     setFirstName]     = useState('')
  const [lastName,      setLastName]      = useState('')
  const [email,         setEmail]         = useState('')
  const [submitting,    setSubmitting]    = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [done,          setDone]          = useState(false)
  const [alreadyActive, setAlreadyActive] = useState(false)
  const [honeypot,      setHoneypot]      = useState('')

  const preview = slugPreview(clubName)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const fd = new FormData()
    fd.set('website',      honeypot)
    fd.set('clubName',     clubName)
    fd.set('location',     location)
    fd.set('firstName',    firstName)
    fd.set('lastName',     lastName)
    fd.set('contactEmail', email)
    const res = await submitClubApplication(fd)
    setSubmitting(false)
    if (res.error) { setError(res.error); return }
    if (res.alreadyActive) { setAlreadyActive(true); return }
    setDone(true)
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 60, height: 60, borderRadius: '50%',
          background: 'rgba(26,105,72,0.10)',
          marginBottom: 20,
        }}>
          <svg width="26" height="26" fill="none" stroke="#1A6948" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#161412', marginBottom: 12 }}>
          You&apos;re on your way, {firstName}!
        </h3>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: '#4A4037', maxWidth: '32ch', margin: '0 auto 28px' }}>
          Check <strong style={{ color: '#161412' }}>{email}</strong> for your confirmation — it should arrive in the next minute or two.
        </p>
        <Link href="/about" style={{ fontSize: 15, color: '#1A6948', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to Focal Point
        </Link>
      </div>
    )
  }

  if (alreadyActive) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 60, height: 60, borderRadius: '50%',
          background: 'rgba(123,80,0,0.10)',
          marginBottom: 20,
        }}>
          <svg width="26" height="26" fill="none" stroke="#7B5000" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
          </svg>
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#161412', marginBottom: 12 }}>
          Account already exists
        </h3>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: '#4A4037', maxWidth: '32ch', margin: '0 auto 28px' }}>
          A club is already set up with <strong style={{ color: '#161412' }}>{email}</strong>. Sign in to access it.
        </p>
        <Link href="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#E8B14A', color: '#161412',
          padding: '11px 24px', borderRadius: 8,
          fontSize: 15, fontWeight: 700, textDecoration: 'none',
        }}>
          Sign in →
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 22 }}>
      {/* Honeypot — bots fill this, humans don't see it */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={e => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
      />

      {/* Club name */}
      <div>
        <label style={labelStyle}>
          Club name <span aria-hidden="true" style={{ color: '#C0392B' }}>*</span>
          <span className="sr-only"> (required)</span>
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Six Rivers Photography Club"
          value={clubName}
          onChange={e => setClubName(e.target.value)}
          style={inputStyle}
          aria-required="true"
        />
        {preview && (
          <p style={{ ...helperStyle, fontFamily: 'var(--font-roboto-mono, monospace)' }}>
            {/* Preview URL — informational, not required to understand the form */}
            focalpointhq.com/<span style={{ color: '#2C2620', fontWeight: 600 }}>{preview}</span>
          </p>
        )}
      </div>

      {/* Location */}
      <div>
        <label style={labelStyle}>
          Location{' '}
          <span style={{ fontWeight: 400, fontSize: 14, color: '#5C5047' }}>(optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Toronto, ON"
          value={location}
          onChange={e => setLocation(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Name row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={labelStyle}>
            First name <span aria-hidden="true" style={{ color: '#C0392B' }}>*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <input
            type="text"
            required
            placeholder="Jane"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            style={inputStyle}
            aria-required="true"
          />
        </div>
        <div>
          <label style={labelStyle}>
            Last name <span aria-hidden="true" style={{ color: '#C0392B' }}>*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <input
            type="text"
            required
            placeholder="Smith"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            style={inputStyle}
            aria-required="true"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label style={labelStyle}>
          Email address <span aria-hidden="true" style={{ color: '#C0392B' }}>*</span>
          <span className="sr-only"> (required)</span>
        </label>
        <input
          type="email"
          required
          placeholder="you@club.org"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
          aria-required="true"
          aria-describedby="email-hint"
        />
        <p id="email-hint" style={helperStyle}>
          Your confirmation link goes here.
        </p>
      </div>

      {error && (
        <p role="alert" style={{
          borderRadius: 8, padding: '12px 16px', fontSize: 15,
          background: '#FDEEEE', color: '#7A1515',
          border: '1px solid rgba(211,47,47,0.18)',
          margin: 0,
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
          color: '#161412',       // #161412 on #E8B14A ≈ 10:1 ✓
          border: 'none',
          borderRadius: 8,
          padding: '13px 20px',
          fontSize: 17,
          fontWeight: 700,
          cursor: submitting ? 'not-allowed' : 'pointer',
          letterSpacing: '-0.01em',
          transition: 'background 0.15s',
          marginTop: 4,
        }}
      >
        {submitting ? 'Starting your trial…' : 'Start free trial'}
      </button>

      {/* #5C5047 on white = 7.8:1 ✓ */}
      <p style={{ textAlign: 'center', fontSize: 14, color: '#5C5047', lineHeight: 1.6, margin: 0 }}>
        60 days free · No credit card · No commitment
      </p>
    </form>
  )
}

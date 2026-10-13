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

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  background: '#F9F6F0',
  border: '1px solid rgba(22,20,18,0.16)',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 14,
  color: '#161412',
  height: 40,
  outline: 'none',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 6,
  color: '#2C2620',
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
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(63,168,137,0.12)',
          marginBottom: 20,
        }}>
          <svg width="24" height="24" fill="none" stroke="#3FA889" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#161412', marginBottom: 10 }}>
          You&apos;re on your way, {firstName}!
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: '#6D655B', maxWidth: '30ch', margin: '0 auto 24px' }}>
          Check <strong style={{ color: '#161412' }}>{email}</strong> for your confirmation — it should arrive in the next minute or two.
        </p>
        <Link href="/" style={{ fontSize: 13, color: '#E8B14A', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to focalpointhq.com
        </Link>
      </div>
    )
  }

  if (alreadyActive) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(232,177,74,0.12)',
          marginBottom: 20,
        }}>
          <svg width="24" height="24" fill="none" stroke="#E8B14A" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
          </svg>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#161412', marginBottom: 10 }}>
          Account already exists
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: '#6D655B', maxWidth: '30ch', margin: '0 auto 24px' }}>
          A club is already set up with <strong style={{ color: '#161412' }}>{email}</strong>. Sign in to access it.
        </p>
        <Link href="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#E8B14A', color: '#161412',
          padding: '9px 20px', borderRadius: 8,
          fontSize: 14, fontWeight: 700, textDecoration: 'none',
        }}>
          Sign in →
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
      {/* Honeypot */}
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
          Club name <span style={{ color: '#C0392B' }}>*</span>
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Six Rivers Photography Club"
          value={clubName}
          onChange={e => setClubName(e.target.value)}
          style={inputStyle}
        />
        {preview && (
          <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(22,20,18,0.40)', fontFamily: 'var(--font-roboto-mono, monospace)' }}>
            focalpointhq.com/<span style={{ color: '#6D655B' }}>{preview}</span>
          </p>
        )}
      </div>

      {/* Location */}
      <div>
        <label style={labelStyle}>
          Location{' '}
          <span style={{ fontWeight: 400, fontSize: 12, color: 'rgba(22,20,18,0.40)' }}>(optional)</span>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>
            First name <span style={{ color: '#C0392B' }}>*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Jane"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>
            Last name <span style={{ color: '#C0392B' }}>*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Smith"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label style={labelStyle}>
          Email address <span style={{ color: '#C0392B' }}>*</span>
        </label>
        <input
          type="email"
          required
          placeholder="you@club.org"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
        />
        <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(22,20,18,0.40)' }}>
          Your confirmation link goes here.
        </p>
      </div>

      {error && (
        <p style={{
          borderRadius: 8, padding: '10px 14px', fontSize: 13,
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
          background: submitting ? 'rgba(232,177,74,0.55)' : '#E8B14A',
          color: '#161412',
          border: 'none',
          borderRadius: 8,
          padding: '11px 20px',
          fontSize: 15,
          fontWeight: 700,
          cursor: submitting ? 'not-allowed' : 'pointer',
          letterSpacing: '-0.01em',
          transition: 'background 0.15s',
        }}
      >
        {submitting ? 'Starting your trial…' : 'Start my free trial →'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(22,20,18,0.35)', lineHeight: 1.6, margin: 0 }}>
        60 days free · No credit card · No commitment
      </p>
    </form>
  )
}

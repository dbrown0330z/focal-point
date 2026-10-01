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

export default function StartClient() {
  const [clubName,     setClubName]     = useState('')
  const [location,     setLocation]     = useState('')
  const [firstName,    setFirstName]    = useState('')
  const [lastName,     setLastName]     = useState('')
  const [email,        setEmail]        = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [done,         setDone]         = useState(false)

  const preview = slugPreview(clubName)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const fd = new FormData()
    fd.set('clubName',     clubName)
    fd.set('location',     location)
    fd.set('firstName',    firstName)
    fd.set('lastName',     lastName)
    fd.set('contactEmail', email)
    const res = await submitClubApplication(fd)
    setSubmitting(false)
    if (res.error) { setError(res.error); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full mb-6"
             style={{ background: 'var(--status-success-bg)' }}>
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"
               style={{ color: 'var(--status-success)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Application received!
        </h2>
        <p className="text-base max-w-md mx-auto mb-8" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Thanks, {firstName}! We&apos;ll review your request and send a setup link to{' '}
          <strong>{email}</strong> within 1–2 business days.
        </p>
        <Link href="/" className="text-sm font-medium" style={{ color: 'var(--action-primary)' }}>
          ← Back to home
        </Link>
      </div>
    )
  }

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
  const inputStyle = {
    background: 'var(--surface-2)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-primary)',
    height: '38px',
  } as React.CSSProperties

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Club name */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
          Club name <span style={{ color: 'var(--status-error)' }}>*</span>
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Six Rivers Photography Club"
          value={clubName}
          onChange={e => setClubName(e.target.value)}
          className={inputCls}
          style={inputStyle}
        />
        {preview && (
          <p className="mt-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Your site URL: <span style={{ color: 'var(--text-secondary)' }}>focalpointhq.com/<strong>{preview}</strong></span>
          </p>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
          Location <span className="font-normal text-xs" style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Toronto, ON"
          value={location}
          onChange={e => setLocation(e.target.value)}
          className={inputCls}
          style={inputStyle}
        />
      </div>

      {/* Your name */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
            First name <span style={{ color: 'var(--status-error)' }}>*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Jane"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className={inputCls}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Last name <span style={{ color: 'var(--status-error)' }}>*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Smith"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            className={inputCls}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
          Email address <span style={{ color: 'var(--status-error)' }}>*</span>
        </label>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={inputCls}
          style={inputStyle}
        />
        <p className="mt-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          We&apos;ll send your setup link here.
        </p>
      </div>

      {error && (
        <p className="rounded-lg px-3 py-2.5 text-sm"
           style={{ background: 'var(--status-error-bg)', color: 'var(--status-error-text)' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ background: 'var(--action-primary)', boxShadow: 'var(--action-primary-shadow)' }}
      >
        {submitting ? 'Submitting…' : 'Request access'}
      </button>

      <p className="text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
        No credit card required. We&apos;ll follow up within 1–2 business days.
      </p>
    </form>
  )
}

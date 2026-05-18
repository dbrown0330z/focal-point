'use client'

import { useState, FormEvent } from 'react'
import { Reveal } from '@/components/marketing/Reveal'

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--paper-warm)',
  border: '1px solid var(--rule)',
  borderRadius: 8,
  padding: '10px 14px',
  fontFamily: 'var(--sans)',
  fontSize: 15,
  color: 'var(--ink)',
  outline: 'none',
}

export function ContactForm() {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [club,    setClub]    = useState('')
  const [message, setMessage] = useState('')
  const [sent,    setSent]    = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <Reveal delay={80}>
      <div className="mkt-card" style={{ background: 'var(--paper-warm)', padding: 32 }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 28, marginBottom: 12 }}>Thanks!</div>
            <p style={{ color: 'var(--ink-soft)' }}>We&apos;ll be in touch soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@club.org"
                  required
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
                Club name (optional)
              </label>
              <input
                type="text"
                value={club}
                onChange={e => setClub(e.target.value)}
                placeholder="Riverbend Camera Club"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
                Message
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="How can we help?"
                required
                rows={5}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <button type="submit" className="mkt-btn mkt-btn-amber" style={{ justifyContent: 'center' }}>
              Send message
            </button>
          </form>
        )}
      </div>
    </Reveal>
  )
}

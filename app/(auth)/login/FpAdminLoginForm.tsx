'use client'

import { useState } from 'react'

export default function FpAdminLoginForm({
  errorParam,
  nextParam,
}: {
  errorParam?: string
  nextParam?: string
}) {
  const [loading, setLoading] = useState(false)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1C1C1E',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: 'var(--font-roboto-mono, "Roboto Mono", monospace)',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <p style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: '#5A6C82', marginBottom: 12,
        }}>
          Internal tool
        </p>
        <h1 style={{
          fontSize: 28, fontWeight: 700, color: '#E8EDF2',
          letterSpacing: '-0.02em', margin: 0,
        }}>
          Focal Point
        </h1>
        <h2 style={{
          fontSize: 16, fontWeight: 400, color: '#7E8EA3',
          letterSpacing: '-0.01em', margin: '6px 0 0',
        }}>
          Application Admin
        </h2>
      </div>

      {/* Card */}
      <div style={{
        background: '#26374C',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 12,
        padding: '36px 40px',
        width: '100%',
        maxWidth: 380,
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
      }}>
        {errorParam && (
          <div style={{
            marginBottom: 20, borderRadius: 8, padding: '10px 14px',
            background: 'rgba(211,47,47,0.15)', border: '1px solid rgba(211,47,47,0.30)',
            color: '#F09595', fontSize: 13,
          }}>
            {errorParam}
          </div>
        )}

        <form
          action="/api/auth/login"
          method="POST"
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          onSubmit={() => setLoading(true)}
        >
          {nextParam && <input type="hidden" name="next" value={nextParam} />}

          <div>
            <label style={{
              display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 500,
              color: '#B0BACA', letterSpacing: '0.03em',
            }}>
              Email
            </label>
            <input
              name="email" type="email" autoComplete="email" required
              style={{
                display: 'block', width: '100%', boxSizing: 'border-box',
                background: '#131F2E', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6, padding: '9px 12px', fontSize: 14, color: '#E8EDF2',
                outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 500,
              color: '#B0BACA', letterSpacing: '0.03em',
            }}>
              Password
            </label>
            <input
              name="password" type="password" autoComplete="current-password" required
              style={{
                display: 'block', width: '100%', boxSizing: 'border-box',
                background: '#131F2E', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6, padding: '9px 12px', fontSize: 14, color: '#E8EDF2',
                outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4, width: '100%', background: loading ? '#163A6B' : '#1E4D8C',
              color: '#E8EDF2', border: 'none', borderRadius: 6,
              padding: '11px 20px', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              letterSpacing: '0.02em',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: '#3E5066', textAlign: 'center' }}>
        Focal Point · Internal access only
      </p>
    </div>
  )
}

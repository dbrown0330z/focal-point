'use client'

import { useState } from 'react'

// Renders inside (auth)/layout.tsx which already provides the outer card and
// the "Focal Point / Admin Portal" header — no wrapper needed here.
export default function FpAdminLoginForm({
  errorParam,
  nextParam,
}: {
  errorParam?: string
  nextParam?: string
}) {
  const [loading, setLoading] = useState(false)

  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%', boxSizing: 'border-box',
    background: '#292929', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6, padding: '9px 12px', fontSize: 14, color: '#E8E8E8',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#E8E8E8',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <p style={{
        marginBottom: 20, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: '#5A6C82',
      }}>
        Internal access only
      </p>

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
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        onSubmit={() => setLoading(true)}
      >
        {nextParam && <input type="hidden" name="next" value={nextParam} />}

        <div>
          <label style={labelStyle}>Email</label>
          <input name="email" type="email" autoComplete="email" required style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Password</label>
          <input name="password" type="password" autoComplete="current-password" required style={inputStyle} />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 4, width: '100%',
            background: loading ? 'rgba(30,77,140,0.60)' : '#1E4D8C',
            color: '#E8E8E8', border: 'none', borderRadius: 6,
            padding: '10px 20px', fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

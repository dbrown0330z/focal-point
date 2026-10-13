'use client'

import Link from 'next/link'
import { IrisMark } from './IrisMark'

export function Footer() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-wrap">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
          gap: 40,
          paddingBottom: 56,
          borderBottom: '1px solid rgba(255,255,255,0.10)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IrisMark size={42} ink="#E8E2D3" accent="#E8B14A" paper="#1A1714" />
              <span style={{
                fontFamily:    'var(--wordmark)',
                fontSize:      26,
                fontWeight:    600,
                letterSpacing: '-0.8px',
                color:         '#F2EDDF',
              }}>
                Focal<span style={{ color: '#E26A3E' }}>.</span>Point
              </span>
            </div>
            <p style={{ marginTop: 18, color: 'rgba(232,226,211,0.80)', maxWidth: '36ch' }}>
              Photography club management built by people who actually love the craft.
            </p>
          </div>
          <div>
            <div className="mkt-footer-meta" style={{ marginBottom: 14 }}>Product</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              <li><Link href="/features">Features</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/features">Judge portal</Link></li>
              <li><Link href="/features">Galleries</Link></li>
            </ul>
          </div>
          <div>
            <div className="mkt-footer-meta" style={{ marginBottom: 14 }}>Company</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/about">Contact</Link></li>
              <li><a href="#">Changelog</a></li>
              <li><a href="#">Privacy</a></li>
            </ul>
          </div>
          <div>
            <div className="mkt-footer-meta" style={{ marginBottom: 14 }}>Stay close</div>
            <p style={{ color: 'rgba(232,226,211,0.80)', marginTop: 0 }}>
              Quarterly notes — competitions, features, and craft.
            </p>
            <form style={{ display: 'flex', gap: 8, marginTop: 12 }} onSubmit={e => e.preventDefault()}>
              <input
                type="email"
                placeholder="you@club.org"
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: '#F2EDDF', borderRadius: 999, padding: '10px 14px',
                  fontFamily: 'var(--sans)', fontSize: 14, outline: 'none',
                }}
              />
              <button type="submit" className="mkt-btn mkt-btn-amber mkt-btn-sm">Join</button>
            </form>
          </div>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 28, flexWrap: 'wrap', gap: 12,
        }}>
          <span className="mkt-footer-meta">© Focal Point Studio · MMXXVI</span>
          <span className="mkt-footer-meta">Made with care · From everywhere</span>
        </div>
      </div>
    </footer>
  )
}

'use client'

import Link from 'next/link'
import { IrisApertureLogo } from './IrisApertureLogo'
import { IconArrow } from './Icons'

export function BigCTA() {
  return (
    <section className="mkt-band" style={{ padding: '120px 0' }}>
      <div className="mkt-wrap">
        <div style={{
          background: 'var(--ink)', color: 'var(--paper)',
          borderRadius: 20, padding: '72px 56px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -60, bottom: -60, opacity: 0.9 }}>
            <IrisApertureLogo size={320} ink="#F6F1E5" />
          </div>
          <div style={{ position: 'relative', maxWidth: '32ch' }}>
            <div className="mkt-kicker" style={{ color: 'rgba(232,226,211,0.67)', marginBottom: 18 }}>
              <span className="mkt-kicker-dot" style={{ background: '#E8B14A' }} />
              Ready when you are
            </div>
            <h2 className="mkt-display" style={{ marginBottom: 22 }}>
              Modernize your club{' '}
              <em style={{ color: '#E8B14A' }}>this season.</em>
            </h2>
            <p style={{ color: 'rgba(232,226,211,0.80)', fontSize: 18, marginBottom: 28 }}>
              Free for 30 days. Bring your whole club. We&apos;ll help you migrate.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/pricing" className="mkt-btn mkt-btn-amber">
                Start free trial <IconArrow />
              </Link>
              <Link
                href="/about"
                className="mkt-btn"
                style={{ background: 'transparent', color: 'var(--paper)', borderColor: 'rgba(255,255,255,0.27)' }}
              >
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

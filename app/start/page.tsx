import Image from 'next/image'
import StartClient from './StartClient'

export const metadata = { title: 'Start your free trial — Focal Point' }

const STEPS = [
  {
    n: '01',
    title: 'Fill in the basics',
    body: 'Club name, your name, and an email address. That\'s all we need to get started — everything else gets configured inside.',
  },
  {
    n: '02',
    title: 'Check your inbox',
    body: 'We\'ll send a confirmation to the address you enter. One click and you\'re in.',
  },
  {
    n: '03',
    title: 'Quick setup, then go',
    body: 'A short onboarding flow gets your club configured in minutes. Competitions, member invites, the works.',
  },
]

export default function StartPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FBF6EC', fontFamily: 'var(--font-lora, Georgia, serif)' }}>

      {/* Top bar */}
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid rgba(22,20,18,0.10)',
        background: '#F6F1E5',
      }}>
        <a href="/">
          <Image src="/fp-logo-light.svg" alt="Focal Point" width={120} height={32} />
        </a>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'clamp(40px, 6vw, 80px)',
          alignItems: 'start',
        }}>

          {/* Left — welcome + steps */}
          <div>
            <p style={{
              fontFamily: 'var(--font-roboto-mono, monospace)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#3FA889',
              marginBottom: 20,
            }}>
              60-day free trial · No card required
            </p>

            <h1 style={{
              fontSize: 'clamp(28px, 4vw, 38px)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: '#161412',
              marginBottom: 20,
            }}>
              Welcome. We&apos;re really glad{' '}
              <em style={{ color: '#E8B14A', fontStyle: 'italic' }}>you&apos;re here.</em>
            </h1>

            <p style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: '#6D655B',
              marginBottom: 48,
            }}>
              Camera clubs put real care into their competitions and their community.
              We built Focal Point to make that easier to run — and we think you&apos;re
              going to love the experience.
            </p>

            {/* Steps */}
            <div style={{ display: 'grid', gap: 28 }}>
              <p style={{
                fontFamily: 'var(--font-roboto-mono, monospace)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(22,20,18,0.30)',
                marginBottom: -8,
              }}>
                Here&apos;s what happens next
              </p>
              {STEPS.map(s => (
                <div key={s.n} style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: '0 16px', alignItems: 'start' }}>
                  <div style={{
                    fontFamily: 'var(--font-roboto-mono, monospace)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#E8B14A',
                    paddingTop: 2,
                  }}>
                    {s.n}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#161412', marginBottom: 4 }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: '#6D655B' }}>
                      {s.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p style={{
              marginTop: 48,
              fontSize: 13,
              lineHeight: 1.6,
              color: 'rgba(22,20,18,0.40)',
              borderTop: '1px solid rgba(22,20,18,0.10)',
              paddingTop: 24,
            }}>
              60 days. No payment. No commitment. If it&apos;s not the right fit, walk away — no hard feelings and no invoice.
            </p>
          </div>

          {/* Right — form card */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid rgba(22,20,18,0.10)',
            borderRadius: 16,
            padding: 'clamp(28px, 4vw, 44px)',
            boxShadow: '0 2px 12px rgba(22,20,18,0.06)',
          }}>
            <h2 style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#161412',
              marginBottom: 8,
              letterSpacing: '-0.01em',
            }}>
              Start your trial
            </h2>
            <p style={{ fontSize: 14, color: '#6D655B', marginBottom: 28 }}>
              Tell us about your club and we&apos;ll get things moving.
            </p>
            <StartClient />
          </div>

        </div>
      </div>
    </div>
  )
}

import Image from 'next/image'
import StartClient from './StartClient'

export const metadata = { title: 'Start your free trial — Focal Point' }

const STEPS = [
  {
    n: '01',
    title: 'Fill in the basics',
    body: 'Club name, your name, and an email address. That\'s all we need — everything else gets configured inside.',
  },
  {
    n: '02',
    title: 'Check your inbox',
    body: 'We\'ll send a confirmation to the address you enter. One click and you\'re in.',
  },
  {
    n: '03',
    title: 'Quick setup, then you\'re off',
    body: 'A short onboarding walk-through gets your club configured in minutes. Competitions, member invites — the works.',
  },
]

export default function StartPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FBF6EC', fontFamily: 'var(--font-lora, Georgia, serif)' }}>

      {/* Top bar */}
      <header style={{
        padding: '18px 28px',
        borderBottom: '1px solid rgba(22,20,18,0.10)',
        background: '#F6F1E5',
      }}>
        {/* Link to /about avoids the auth redirect that sends logged-in members to their club */}
        <a href="/about" aria-label="Focal Point — back to site">
          <Image src="/fp-logo-light.svg" alt="Focal Point" width={130} height={34} />
        </a>
      </header>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: 'clamp(52px, 8vw, 100px) 28px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'clamp(48px, 6vw, 88px)',
          alignItems: 'start',
        }}>

          {/* Left — welcome + steps */}
          <div>
            {/* Kicker — #1A6948 on #FBF6EC = 6.1:1 ✓ */}
            <p style={{
              fontFamily: 'var(--font-roboto-mono, monospace)',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: '#1A6948',
              marginBottom: 22,
            }}>
              60-day free trial · No card required
            </p>

            {/* Heading — #161412 on #FBF6EC ≈ 16:1 ✓ */}
            {/* Amber italic — #7B5000 on #FBF6EC ≈ 6.5:1 ✓ (also large text) */}
            <h1 style={{
              fontSize: 'clamp(30px, 4vw, 40px)',
              fontWeight: 700,
              lineHeight: 1.18,
              letterSpacing: '-0.02em',
              color: '#161412',
              marginBottom: 22,
            }}>
              Built for clubs like yours.{' '}
              <em style={{ color: '#7B5000', fontStyle: 'italic' }}>Ready when you are.</em>
            </h1>

            {/* Body — #4A4037 on #FBF6EC ≈ 9.1:1 ✓ */}
            <p style={{
              fontSize: 18,
              lineHeight: 1.75,
              color: '#4A4037',
              marginBottom: 52,
            }}>
              Camera clubs put real care into their competitions and community.
              We built Focal Point to make running yours easier — and we think
              you&apos;re going to love the experience.
            </p>

            {/* Steps */}
            <div style={{ display: 'grid', gap: 32 }}>
              {/* Section label — #6B6058 on #FBF6EC ≈ 5.7:1 ✓ */}
              <p style={{
                fontFamily: 'var(--font-roboto-mono, monospace)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: '#6B6058',
                marginBottom: -12,
              }}>
                Here&apos;s what happens next
              </p>

              {STEPS.map(s => (
                <div key={s.n} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: '0 12px', alignItems: 'start' }}>
                  {/* Step numbers are decorative position markers — screen readers skip */}
                  <div
                    aria-hidden="true"
                    style={{
                      fontFamily: 'var(--font-roboto-mono, monospace)',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#E8B14A',
                      paddingTop: 3,
                    }}
                  >
                    {s.n}
                  </div>
                  <div>
                    {/* Step title — #161412 on #FBF6EC ≈ 16:1 ✓ */}
                    <div style={{ fontSize: 17, fontWeight: 600, color: '#161412', marginBottom: 6 }}>
                      {s.title}
                    </div>
                    {/* Step body — #4A4037 on #FBF6EC ≈ 9.1:1 ✓ */}
                    <div style={{ fontSize: 16, lineHeight: 1.65, color: '#4A4037' }}>
                      {s.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right — form card */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid rgba(22,20,18,0.10)',
            borderRadius: 16,
            padding: 'clamp(32px, 4vw, 48px)',
            boxShadow: '0 2px 16px rgba(22,20,18,0.07)',
          }}>
            {/* Card heading — #161412 on #FFF ≈ 21:1 ✓ */}
            <h2 style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#161412',
              marginBottom: 8,
              letterSpacing: '-0.01em',
            }}>
              Start your trial
            </h2>
            {/* Subtitle — #4A4037 on #FFF ≈ 12:1 ✓ */}
            <p style={{ fontSize: 16, lineHeight: 1.6, color: '#4A4037', marginBottom: 32 }}>
              Tell us about your club and we&apos;ll get things moving.
            </p>
            <StartClient />
          </div>

        </div>

        {/* Fine print — full width, centred below both columns */}
        <p style={{
          marginTop: 48,
          fontSize: 14,
          lineHeight: 1.65,
          color: '#5C5047',
          textAlign: 'center',
          borderTop: '1px solid rgba(22,20,18,0.10)',
          paddingTop: 28,
        }}>
          60 days. No payment. No commitment. If it&apos;s not the right fit, walk away — no hard feelings and no invoice.
        </p>
      </div>
    </div>
  )
}

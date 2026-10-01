import Image from 'next/image'
import StartClient from './StartClient'

export const metadata = { title: 'Start your club site — Focal Point' }

const checks = [
  'Member image library & competition management',
  'Monthly judging with external judge portal',
  'Member news feed, calendar & announcements',
  'Custom pages, galleries & club branding',
  'Easy to use — no technical skills required',
]

export default function StartPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-0)' }}>

      {/* Top bar */}
      <header className="border-b px-6 py-4" style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)' }}>
        <a href="/">
          <Image src="/fp-logo-light.svg" alt="Focal Point" width={120} height={32} className="block dark:hidden" />
          <Image src="/fp-logo-dark.svg" alt="Focal Point" width={120} height={32} className="hidden dark:block" />
        </a>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="grid gap-16 md:grid-cols-2 md:items-start md:gap-24">

          {/* Left — value prop */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--action-primary)' }}>
              Get started
            </p>
            <h1 className="mb-5 text-4xl font-bold leading-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              A modern home for your camera club.
            </h1>
            <p className="mb-10 text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Focal Point gives your club a beautiful, easy-to-manage website with everything built in — competitions, image libraries, member management, and more.
            </p>
            <ul className="space-y-3">
              {checks.map(c => (
                <li key={c} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: 'var(--status-success-bg)' }}>
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                         style={{ color: 'var(--status-success)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — form card */}
          <div className="rounded-xl p-8 shadow-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
            <h2 className="mb-1.5 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Request access
            </h2>
            <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Tell us about your club and we&apos;ll get you set up.
            </p>
            <StartClient />
          </div>

        </div>
      </div>
    </div>
  )
}

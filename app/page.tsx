import Link from 'next/link'

/**
 * Focal Point marketing / landing page.
 *
 * This is the root of focalpointhq.com — visible to anyone before they choose
 * a club. Each club lives at focalpointhq.com/{clubSlug}.
 */
export default function FocalPointHomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1
        className="font-[family-name:var(--font-lora)] font-bold text-content-primary"
        style={{ fontSize: '36px', letterSpacing: '-0.02em' }}
      >
        Focal Point
      </h1>
      <p className="mt-3 max-w-sm text-content-secondary" style={{ fontSize: '16px' }}>
        The complete platform for camera clubs — competitions, image libraries, and club news in one place.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/apply"
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ background: 'var(--action-primary)' }}
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-lg border px-5 py-2.5 text-sm font-medium text-content-primary transition-colors hover:bg-surface-1"
          style={{ borderColor: 'var(--border-default)' }}
        >
          Sign in
        </Link>
      </div>
    </main>
  )
}

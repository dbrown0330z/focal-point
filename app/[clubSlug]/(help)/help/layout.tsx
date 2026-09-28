import Image from 'next/image'

export default function HelpOuterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-0)', color: 'var(--text-primary)' }}>
      <header
        className="border-b px-6 py-4"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-2)' }}
      >
        <Image
          src="/fp-logo-light.svg"
          alt="Focal Point"
          width={110}
          height={30}
          className="block dark:hidden"
          priority
        />
        <Image
          src="/fp-logo-dark.svg"
          alt="Focal Point"
          width={110}
          height={30}
          className="hidden dark:block"
          priority
        />
        <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Help &amp; Support
        </p>
      </header>
      {children}
    </div>
  )
}

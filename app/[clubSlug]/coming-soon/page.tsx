import { createServiceClient } from '@/lib/supabase/service'

export default async function ComingSoonPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>
}) {
  const { clubSlug } = await params
  const admin = createServiceClient()

  const { data: club } = await admin
    .from('clubs')
    .select('name')
    .eq('slug', clubSlug)
    .maybeSingle()

  const clubName = club?.name ?? 'This club'

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-0)',
        padding: '24px',
        fontFamily: 'var(--font-primary)',
      }}
    >
      {/* Camera shutter SVG */}
      <svg
        width="52" height="52" viewBox="0 0 52 52" fill="none"
        style={{ marginBottom: 20, opacity: 0.35 }}
      >
        <circle cx="26" cy="26" r="25" stroke="currentColor" strokeWidth="2" />
        <circle cx="26" cy="26" r="13" stroke="currentColor" strokeWidth="2" />
        <path d="M26 13 L30 20 L22 20 Z" fill="currentColor" opacity="0.6" />
        <path d="M38.5 19.5 L35 26 L38.5 32.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M13.5 19.5 L17 26 L13.5 32.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M26 39 L30 32 L22 32 Z" fill="currentColor" opacity="0.6" />
      </svg>

      <h1
        style={{
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          margin: '0 0 8px',
          textAlign: 'center',
        }}
      >
        {clubName}
      </h1>

      <p
        style={{
          fontSize: 15,
          color: 'var(--text-secondary)',
          margin: '0 0 32px',
          textAlign: 'center',
          maxWidth: 360,
          lineHeight: 1.6,
        }}
      >
        We&rsquo;re getting things set up. Check back soon.
      </p>

      <a
        href={`/${clubSlug}/login`}
        style={{
          fontSize: 13,
          color: 'var(--text-tertiary)',
          textDecoration: 'none',
        }}
      >
        Club admin sign in →
      </a>
    </div>
  )
}

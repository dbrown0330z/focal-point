import Link from 'next/link'

export default function DraftPreviewBanner({ clubSlug }: { clubSlug: string }) {
  return (
    <div style={{
      background: 'var(--status-warning-bg)',
      borderBottom: '1px solid rgba(166,124,0,0.20)',
      padding: '10px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      justifyContent: 'center',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: 'var(--status-warning)',
        display: 'inline-block',
      }} />
      <span style={{ fontSize: 13, color: 'var(--status-warning-text)' }}>
        This site is in draft mode — members can&rsquo;t access it yet. You&rsquo;re viewing it as a preview.
      </span>
      <Link
        href={`/${clubSlug}/admin`}
        style={{
          fontSize: 13, fontWeight: 600,
          color: 'var(--status-warning-text)',
          textDecoration: 'underline',
          whiteSpace: 'nowrap',
        }}
      >
        Go to Admin →
      </Link>
    </div>
  )
}

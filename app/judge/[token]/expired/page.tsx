export default function JudgeExpiredPage() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 52px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 380 }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--surface-2)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          margin: '0 auto 20px',
        }}>
          ⛔
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.015em',
          margin: '0 0 12px',
        }}>
          Link unavailable
        </h1>

        <p style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          margin: 0,
        }}>
          This judging link is no longer valid. The competition may not be
          open for judging, or the link may have been revoked.
          Contact the club admin if you think this is a mistake.
        </p>
      </div>
    </div>
  )
}

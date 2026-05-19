import { createClient } from '@/lib/supabase/server'

export default async function JudgeExpiredPage() {
  const supabase = await createClient()
  const { data: club } = await supabase
    .from('club_settings')
    .select('club_name, contact_email')
    .single()

  const clubName     = club?.club_name     ?? 'the club'
  const contactEmail = club?.contact_email ?? null

  return (
    <div style={{
      minHeight: 'calc(100vh - 52px)',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '24px 16px',
      textAlign:      'center',
    }}>
      <div style={{ maxWidth: 420 }}>

        {/* Icon */}
        <div style={{
          width:          64,
          height:         64,
          borderRadius:   '50%',
          background:     'var(--surface-2)',
          border:         '1px solid var(--border-default)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       28,
          margin:         '0 auto 28px',
          boxShadow:      '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          🔗
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily:    'var(--font-heading)',
          fontSize:      26,
          fontWeight:    700,
          color:         'var(--text-primary)',
          letterSpacing: '-0.018em',
          margin:        '0 0 16px',
          lineHeight:    1.2,
        }}>
          This link isn&apos;t active right now
        </h1>

        {/* Explanation */}
        <p style={{
          fontSize:   15,
          color:      'var(--text-secondary)',
          lineHeight: 1.7,
          margin:     '0 0 32px',
        }}>
          Judging links are only valid while a competition is open for
          judging. This one may not have started yet, or the judging
          window may have closed.
        </p>

        {/* Contact card */}
        <div style={{
          borderRadius: 14,
          border:       '1px solid var(--border-default)',
          background:   'var(--surface-2)',
          padding:      '24px 28px',
          boxShadow:    '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <p style={{
            fontSize:      11,
            fontWeight:    600,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color:         'var(--text-secondary)',
            margin:        '0 0 10px',
          }}>
            Need help?
          </p>
          <p style={{
            fontSize:   15,
            color:      'var(--text-primary)',
            lineHeight: 1.65,
            margin:     0,
          }}>
            If you believe this is a mistake, reach out to{' '}
            <strong style={{ fontWeight: 600 }}>{clubName}</strong>{' '}
            and they can resend your invitation or confirm the judging schedule.
          </p>

          {contactEmail && (
            <a
              href={`mailto:${contactEmail}`}
              style={{
                display:        'inline-flex',
                alignItems:     'center',
                gap:            6,
                marginTop:      16,
                padding:        '9px 18px',
                borderRadius:   8,
                background:     'var(--action-primary)',
                color:          '#fff',
                fontSize:       14,
                fontWeight:     500,
                textDecoration: 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              Email {clubName}
            </a>
          )}
        </div>

      </div>
    </div>
  )
}

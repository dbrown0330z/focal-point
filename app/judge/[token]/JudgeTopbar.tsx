'use client'

import Link from 'next/link'
import { useTheme } from '@/components/layout/ThemeProvider'

export default function JudgeTopbar({
  clubName,
  judgeName,
}: {
  clubName:  string
  judgeName: string | null
}) {
  const { theme, toggle } = useTheme()

  return (
    <header style={{
      background: 'var(--surface-1)',
      borderBottom: '1px solid var(--border-default)',
      height: 52,
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Left: club name — links to public homepage in new tab */}
      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          textDecoration: 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {clubName}
      </Link>

      {/* Center: portal label + judge name */}
      <span style={{
        fontFamily:    'var(--font-body)',
        fontSize:      14,
        fontWeight:    600,
        textTransform: 'uppercase',
        letterSpacing: '0.16em',
        color:         'var(--text-secondary)',
        whiteSpace:    'nowrap',
      }}>
        Judging Portal{judgeName ? ` / ${judgeName}` : ''}
      </span>

      {/* Right: theme toggle — shows what it will switch TO */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            padding: '0 12px',
            height: 34,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
          }}
        >
          {theme === 'dark' ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
              </svg>
              Light mode
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              Dark mode
            </>
          )}
        </button>
      </div>
    </header>
  )
}

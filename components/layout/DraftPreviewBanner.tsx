'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function DraftPreviewBanner({ clubSlug }: { clubSlug: string }) {
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <div style={{
        background: 'var(--status-warning-bg)',
        borderBottom: '1px solid color-mix(in srgb, var(--status-warning) 30%, transparent)',
        padding: '7px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <EyeIcon />
        <span style={{ fontSize: 13, color: 'var(--status-warning-text)', fontWeight: 500, flex: 1 }}>
          Admin preview — site not yet active
        </span>
        <Link
          href={`/${clubSlug}/admin`}
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--status-warning-text)' }}
        >
          Go to Admin →
        </Link>
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand preview banner"
          title="Show details"
          style={{
            background: 'none', border: '1px solid color-mix(in srgb, var(--status-warning-text) 35%, transparent)',
            cursor: 'pointer', color: 'var(--status-warning-text)',
            padding: '3px 7px', borderRadius: 4, lineHeight: 1,
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500,
          }}
        >
          <ChevronDownIcon /> Details
        </button>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--status-warning-bg)',
      borderBottom: '1px solid color-mix(in srgb, var(--status-warning) 30%, transparent)',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '14px 24px',
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
      }}>
        {/* Icon */}
        <div style={{
          flexShrink: 0,
          width: 36, height: 36,
          borderRadius: '50%',
          background: 'color-mix(in srgb, var(--status-warning) 15%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 1,
        }}>
          <EyeIcon />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--status-warning-text)' }}>
              Admin preview
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: 'var(--status-warning-text)', opacity: 0.75,
            }}>
              Site not yet active
            </span>
          </div>
          <p style={{ margin: '0 0 4px', fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>
            You&rsquo;re previewing the member site — only admins can see this right now. Members who visit this URL see a{' '}
            <Link href={`/${clubSlug}/coming-soon`} target="_blank" style={{ color: 'var(--status-warning-text)', textDecoration: 'underline', fontWeight: 600 }}>
              coming soon page
            </Link>
            .
          </p>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Configure your homepage, competitions, and content in the{' '}
            <Link href={`/${clubSlug}/admin`} style={{ color: 'var(--status-warning-text)', textDecoration: 'underline', fontWeight: 600 }}>
              admin area
            </Link>
            . When everything looks right, activate your site there to open it up to members.
          </p>
        </div>

        {/* Actions */}
        <div style={{ flexShrink: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link
            href={`/${clubSlug}/admin`}
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '7px 14px', borderRadius: 6,
              background: 'var(--status-warning-text)',
              color: 'var(--status-warning-bg)', fontSize: 14, fontWeight: 600,
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Go to Admin →
          </Link>
          <button
            onClick={() => setCollapsed(true)}
            aria-label="Collapse preview banner"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--status-warning-text)', opacity: 0.6, padding: '6px',
              borderRadius: 4, lineHeight: 1,
              display: 'flex', alignItems: 'center',
            }}
          >
            <ChevronUpIcon />
          </button>
        </div>
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--status-warning-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ChevronUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

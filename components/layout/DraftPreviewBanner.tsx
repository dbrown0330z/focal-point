'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function DraftPreviewBanner({ clubSlug }: { clubSlug: string }) {
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <div style={{
        background: 'rgba(26,111,196,0.08)',
        borderBottom: '1px solid rgba(26,111,196,0.18)',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        justifyContent: 'center',
      }}>
        <EyeIcon />
        <span style={{ fontSize: 13, color: 'var(--action-primary)', fontWeight: 500 }}>
          Admin preview mode — members can&rsquo;t see this yet.
        </span>
        <button
          onClick={() => setCollapsed(false)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--action-primary)', fontWeight: 600,
            padding: '2px 8px', borderRadius: 4,
            textDecoration: 'underline',
          }}
        >
          Show details
        </button>
        <Link
          href={`/${clubSlug}/admin`}
          style={{ fontSize: 12, fontWeight: 600, color: 'var(--action-primary)', marginLeft: 4 }}
        >
          Go to Admin →
        </Link>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(26,111,196,0.06)',
      borderBottom: '1px solid rgba(26,111,196,0.16)',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '16px 24px',
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
      }}>
        {/* Icon */}
        <div style={{
          flexShrink: 0,
          width: 36, height: 36,
          borderRadius: '50%',
          background: 'rgba(26,111,196,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 1,
        }}>
          <EyeIcon />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--action-primary)' }}>
              Admin preview
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
              color: 'var(--action-primary)', opacity: 0.7,
            }}>
              Not published
            </span>
          </div>
          <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
            <strong>This is exactly what your members will see</strong> when they sign in — once you publish.
            Only you can view it right now.
          </p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Everything on this page is customisable in your admin area. Make a change there, then
            come back here and refresh to see it reflected.
          </p>
        </div>

        {/* Actions */}
        <div style={{ flexShrink: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link
            href={`/${clubSlug}/admin`}
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '7px 14px', borderRadius: 6,
              background: 'var(--action-primary)',
              color: 'white', fontSize: 13, fontWeight: 600,
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
              color: 'var(--text-tertiary)', padding: '6px',
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--action-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

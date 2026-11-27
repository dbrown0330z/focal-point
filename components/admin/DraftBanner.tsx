'use client'

import { useState, useTransition } from 'react'
import { publishSite } from '@/app/[clubSlug]/(admin)/admin/draft/actions'
import { useUnsavedChanges } from '@/components/admin/UnsavedChangesProvider'

export type DraftChecklist = {
  clubSlug:        string
  duesModeOk:      boolean
  hasCompetition:  boolean
  hasPost:         boolean
}

// Light-mode palette — hardcoded to avoid OS dark-mode bleed into admin
const BG     = '#FFF8E1'
const BORDER = 'rgba(196,122,0,0.20)'
const DOT    = '#C47A00'
const TEXT   = '#5A4000'
const MUTED  = '#8A6820'

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function Item({ done, label, href }: { done: boolean; label: string; href: string }) {
  const { navigate } = useUnsavedChanges()
  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 12,
        fontWeight: done ? 500 : 600,
        color: done ? MUTED : TEXT,
        textDecoration: 'none',
        padding: '3px 8px',
        borderRadius: 20,
        border: `1px solid ${done ? 'rgba(196,122,0,0.18)' : 'rgba(196,122,0,0.35)'}`,
        background: done ? 'rgba(196,122,0,0.06)' : 'rgba(196,122,0,0.12)',
        opacity: done ? 0.7 : 1,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <span style={{ color: done ? '#2E7D32' : DOT, flexShrink: 0 }}>
        {done ? <CheckIcon /> : <ArrowIcon />}
      </span>
      {label}
    </button>
  )
}

export default function DraftBanner({ checklist: initial }: { checklist: DraftChecklist }) {
  const [checklist] = useState(initial)
  const [publishing, start] = useTransition()
  const [publishError, setPublishError] = useState<string | null>(null)

  const { clubSlug, duesModeOk, hasCompetition, hasPost } = checklist

  const items = [
    { done: duesModeOk,     label: 'Dues & payment',      href: `/${clubSlug}/admin/dues-payment` },
    { done: false,          label: 'Club Basics',          href: `/${clubSlug}/admin/club-defaults` },
    { done: false,          label: 'Site pages & nav',      href: `/${clubSlug}/admin/content` },
    { done: false,          label: 'About our club',        href: `/${clubSlug}/admin/content/about` },
    { done: false,          label: 'Join / Renew page',    href: `/${clubSlug}/admin/content/join` },
    { done: hasCompetition, label: 'First competition',    href: `/${clubSlug}/admin/competitions/new` },
    { done: hasPost,        label: 'Welcome post (member feed)', href: `/${clubSlug}/admin/posts/new` },
  ]

  async function handlePublish() {
    setPublishError(null)
    start(async () => {
      const result = await publishSite()
      if (result.error) setPublishError(result.error)
    })
  }

  return (
    <div style={{
      background: BG,
      borderBottom: `1px solid ${BORDER}`,
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      fontFamily: 'var(--font-primary)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>

        {/* Dot */}
        <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: DOT }} />

        {/* Text + checklist */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, color: TEXT }}>
            Your site is in <strong>setup mode</strong> — visitors see a coming soon page until you go live.
            {' '}You can go live at any time; here&rsquo;s what&rsquo;s worth setting up first:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {items.map(item => (
              <Item key={item.href} done={item.done} label={item.label} href={item.href} />
            ))}
          </div>
        </div>

        {/* Publish button — always active */}
        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing}
          style={{
            flexShrink: 0,
            padding: '7px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600,
            background: '#2E7D32', color: 'white',
            border: 'none', cursor: publishing ? 'default' : 'pointer',
            opacity: publishing ? 0.7 : 1, fontFamily: 'inherit',
          }}
        >
          {publishing ? 'Going live…' : 'Go live →'}
        </button>
      </div>

      {publishError && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 10px' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#D32F2F' }}>⚠ {publishError}</p>
        </div>
      )}
    </div>
  )
}

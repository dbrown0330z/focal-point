'use client'

import { useState, useTransition, useEffect } from 'react'
import { publishSite } from '@/app/[clubSlug]/(admin)/admin/draft/actions'
import { useUnsavedChanges } from '@/components/admin/UnsavedChangesProvider'

export type DraftChecklist = {
  clubSlug:        string
  duesModeOk:      boolean
  hasCompetition:  boolean
  hasPost:         boolean
}

// Light-mode palette — hardcoded to avoid OS dark-mode bleed into admin
const BG     = '#FEF3EB'
const BORDER = 'rgba(195,80,0,0.18)'
const DOT    = '#C45000'
const TEXT   = '#5A2800'
const MUTED  = '#8A4820'

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
        border: `1px solid ${done ? 'rgba(195,80,0,0.18)' : 'rgba(195,80,0,0.35)'}`,
        background: done ? 'rgba(195,80,0,0.06)' : 'rgba(195,80,0,0.12)',
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

// ── Activation confirmation dialog ─────────────────────────────────────────────

function ActivateDialog({
  clubSlug,
  incomplete,
  publishing,
  error,
  onConfirm,
  onCancel,
}: {
  clubSlug:    string
  incomplete:  { label: string; href: string }[]
  publishing:  boolean
  error:       string | null
  onConfirm:   () => void
  onCancel:    () => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const siteUrl = typeof window !== 'undefined' ? `${window.location.origin}/${clubSlug}` : `/${clubSlug}`

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 9000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: '28px 32px',
          maxWidth: 480,
          width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.12)',
          fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(46,125,50,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </span>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#131F2E' }}>
              Ready to activate your site?
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: '#5A6C82', lineHeight: 1.6 }}>
            Once active, members can sign in and your site is publicly visible. You can continue
            setting things up after — nothing is locked in.
          </p>
        </div>

        {/* Incomplete items */}
        {incomplete.length > 0 && (
          <div style={{
            background: '#FFFBE6',
            border: '1px solid rgba(166,124,0,0.25)',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 20,
          }}>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#6B5000' }}>
              A few things aren&rsquo;t set up yet — worth finishing soon:
            </p>
            <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {incomplete.map(item => (
                <li key={item.href} style={{ fontSize: 13, color: '#6B5000' }}>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* What's next */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#131F2E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            After activation
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: '🔗', text: <>Share your site URL — <span style={{ fontFamily: 'monospace', fontSize: 12, background: '#F0F0F0', padding: '1px 5px', borderRadius: 3 }}>{siteUrl}</span> — so members can sign up</> },
              { icon: '✉️', text: 'Send your club a note with the link and instructions for creating their account' },
              { icon: '👥', text: 'Review and approve any pending member applications in the Members section' },
              { icon: '📸', text: 'Set up your first competition so members can start submitting images' },
              { icon: '📣', text: 'Post a welcome message in the member feed to greet anyone who signs in' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, lineHeight: '20px', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: '#3E5066', lineHeight: 1.5 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#D32F2F' }}>⚠ {error}</p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={publishing}
            style={{
              padding: '8px 18px', borderRadius: 6, fontSize: 14, fontWeight: 500,
              background: 'none', border: '1px solid #B0BACA', color: '#3E5066',
              cursor: publishing ? 'default' : 'pointer', fontFamily: 'inherit',
            }}
          >
            Not yet
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={publishing}
            style={{
              padding: '8px 20px', borderRadius: 6, fontSize: 14, fontWeight: 600,
              background: '#2E7D32', color: 'white',
              border: 'none', cursor: publishing ? 'default' : 'pointer',
              opacity: publishing ? 0.7 : 1, fontFamily: 'inherit',
            }}
          >
            {publishing ? 'Activating…' : 'Activate member site →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main banner ─────────────────────────────────────────────────────────────────

export default function DraftBanner({ checklist: initial }: { checklist: DraftChecklist }) {
  const [checklist] = useState(initial)
  const [publishing, start] = useTransition()
  const [publishError, setPublishError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  const { clubSlug, duesModeOk, hasCompetition, hasPost } = checklist

  const items = [
    { done: duesModeOk,     label: 'Dues & payment',           href: `/${clubSlug}/admin/dues-payment` },
    { done: false,          label: 'Club basics',              href: `/${clubSlug}/admin/club-defaults` },
    { done: false,          label: 'Site pages & nav',         href: `/${clubSlug}/admin/content` },
    { done: false,          label: 'About our club',           href: `/${clubSlug}/admin/content/about` },
    { done: false,          label: 'Join / Renew page',        href: `/${clubSlug}/admin/content/join` },
    { done: hasCompetition, label: 'First competition',        href: `/${clubSlug}/admin/competitions/new` },
    { done: hasPost,        label: 'Welcome post (member feed)', href: `/${clubSlug}/admin/posts/new` },
  ]

  const incompleteItems = items.filter(i => !i.done)

  function handleActivateClick() {
    setPublishError(null)
    setShowDialog(true)
  }

  function handleConfirm() {
    start(async () => {
      const result = await publishSite()
      if (result.error) {
        setPublishError(result.error)
      } else {
        setShowDialog(false)
      }
    })
  }

  return (
    <>
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
              Your site is in <strong>setup mode</strong> — visitors see a coming soon page until you activate.
              {' '}You can activate at any time; here&rsquo;s what&rsquo;s worth setting up first:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {items.map(item => (
                <Item key={item.href} done={item.done} label={item.label} href={item.href} />
              ))}
            </div>
          </div>

          {/* Activate button — always active */}
          <button
            type="button"
            onClick={handleActivateClick}
            disabled={publishing}
            style={{
              flexShrink: 0,
              padding: '7px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600,
              background: '#2E7D32', color: 'white',
              border: 'none', cursor: publishing ? 'default' : 'pointer',
              opacity: publishing ? 0.7 : 1, fontFamily: 'inherit',
            }}
          >
            Activate member site →
          </button>
        </div>

        {publishError && !showDialog && (
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 10px' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#D32F2F' }}>⚠ {publishError}</p>
          </div>
        )}
      </div>

      {showDialog && (
        <ActivateDialog
          clubSlug={clubSlug}
          incomplete={incompleteItems}
          publishing={publishing}
          error={publishError}
          onConfirm={handleConfirm}
          onCancel={() => setShowDialog(false)}
        />
      )}
    </>
  )
}

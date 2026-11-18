'use client'

import { useState, useTransition } from 'react'
import { publishSite } from '@/app/[clubSlug]/(admin)/admin/draft/actions'

export type DraftChecklist = {
  duesModeOk: boolean
  clubSlug:   string
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// Light-mode palette — hardcoded to avoid OS dark-mode bleed into admin
const W = { bg: '#FFF0C0', text: '#6B4000', dot: '#C47A00', border: 'rgba(196,122,0,0.25)' }
const S = { bg: '#EDFAF0', text: '#174A1A', dot: '#2E7D32', border: 'rgba(46,125,50,0.20)' }

const SUGGESTED = [
  {
    label: 'Review Club Basics',
    desc:  'Fill in your club name, location, season dates, and other key details.',
    path:  '/admin/club-defaults',
  },
  {
    label: 'Customize the homepage',
    desc:  'Edit the hero text and welcome message visitors see on your public site.',
    path:  '/admin/content',
  },
  {
    label: 'Customize your About page',
    desc:  'Tell your story — history, what you shoot, and who you welcome.',
    path:  '/admin/content/about',
  },
  {
    label: 'Schedule your first competition',
    desc:  'Create a competition template and open entries for your first round.',
    path:  '/admin/competitions/new',
  },
  {
    label: 'Write a welcome post',
    desc:  'Publish a news post so members see something when they first log in.',
    path:  '/admin/posts/new',
  },
]

export default function DraftBanner({ checklist: initial }: { checklist: DraftChecklist }) {
  const [checklist, setChecklist] = useState(initial)
  const [requiredOpen,  setRequiredOpen]  = useState(!initial.duesModeOk)
  const [suggestedOpen, setSuggestedOpen] = useState(false)
  const [publishing, start]              = useTransition()
  const [publishError, setPublishError]  = useState<string | null>(null)

  const allDone = checklist.duesModeOk
  const palette = allDone ? S : W

  function toggleRequired()  { setRequiredOpen(v => !v); setSuggestedOpen(false) }
  function toggleSuggested() { setSuggestedOpen(v => !v); setRequiredOpen(false) }

  async function handlePublish() {
    setPublishError(null)
    start(async () => {
      const result = await publishSite()
      if (result.error) setPublishError(result.error)
    })
  }

  return (
    <div style={{
      position: 'relative',
      background: palette.bg,
      borderBottom: `1px solid ${palette.border}`,
      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
      fontFamily: 'var(--font-primary)',
      zIndex: 40,
    }}>

      {/* ── Summary bar ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: palette.dot }} />

        <span style={{ fontSize: 14, color: palette.text, flex: 1 }}>
          {allDone
            ? 'Your site is ready to go live — members can\'t access it yet.'
            : 'Your site is in draft mode — complete 1 step before publishing.'}
        </span>

        {!allDone && (
          <button
            type="button"
            onClick={toggleRequired}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: W.text, padding: '2px 6px', whiteSpace: 'nowrap' }}
          >
            What&rsquo;s needed <ChevronDown open={requiredOpen} />
          </button>
        )}

        <button
          type="button"
          onClick={toggleSuggested}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: palette.text, padding: '2px 6px', whiteSpace: 'nowrap', opacity: 0.72 }}
        >
          Suggested <ChevronDown open={suggestedOpen} />
        </button>

        <button
          type="button"
          onClick={handlePublish}
          disabled={!allDone || publishing}
          style={{
            padding: '7px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600,
            background: allDone ? S.dot : 'rgba(0,0,0,0.10)',
            color: allDone ? 'white' : '#A0A0A0',
            border: 'none', cursor: allDone ? 'pointer' : 'default',
            opacity: publishing ? 0.7 : 1, flexShrink: 0,
          }}
        >
          {publishing ? 'Publishing…' : 'Publish site →'}
        </button>
      </div>

      {/* ── Required panel (pushes content down) ── */}
      {requiredOpen && !allDone && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 14px' }}>
          <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', marginBottom: 10 }} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: W.dot, flexShrink: 0 }}>Required:</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={W.dot} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: -1, flexShrink: 0 }}>
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', flexShrink: 0 }}>Dues &amp; Payment</span>
            <span style={{ fontSize: 14, color: '#696969' }}>— Members need to know what they&rsquo;re paying and how to pay before they join.</span>
            <a
              href={`/${checklist.clubSlug}/admin/dues-payment`}
              style={{ fontSize: 14, fontWeight: 600, color: '#1A6FC4', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              Set up Dues &amp; Payment →
            </a>
          </div>
          {publishError && <p style={{ margin: '10px 0 0', fontSize: 13, color: '#D32F2F' }}>⚠ {publishError}</p>}
        </div>
      )}

      {/* ── Suggested panel (absolute overlay — doesn't push page content) ── */}
      {suggestedOpen && (
        <>
          {/* invisible backdrop to close on outside click */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 48 }}
            onClick={() => setSuggestedOpen(false)}
            aria-hidden
          />
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 49,
            background: '#FFFFFF',
            borderBottom: '1px solid rgba(0,0,0,0.12)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
          }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '18px 24px 22px' }}>
              <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7E8EA3' }}>
                Suggested — nice to have before launch
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                {SUGGESTED.map(item => (
                  <a
                    key={item.path}
                    href={`/${checklist.clubSlug}${item.path}`}
                    style={{ display: 'block', padding: '10px 14px', borderRadius: 8, border: '1px solid #D8DDE7', textDecoration: 'none', background: '#F7F8FA' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#EDF0F5')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#F7F8FA')}
                  >
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#131F2E', marginBottom: 3 }}>
                      {item.label} →
                    </span>
                    <span style={{ display: 'block', fontSize: 12, color: '#5A6C82', lineHeight: 1.45 }}>
                      {item.desc}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

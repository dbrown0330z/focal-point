'use client'

import { useState, useTransition } from 'react'
import { publishSite } from '@/app/[clubSlug]/(admin)/admin/draft/actions'

export type DraftChecklist = {
  duesModeOk: boolean
  clubSlug:   string
}

const SUGGESTED = [
  { label: 'Review Club Basics',           desc: 'Fill in your club name, location, season dates, and other key details.',      path: '/admin/club-defaults' },
  { label: 'Customize the homepage',        desc: 'Edit the hero text and welcome message visitors see on your public site.',     path: '/admin/content' },
  { label: 'Customize your About page',     desc: 'Tell your story — history, what you shoot, and who you welcome.',             path: '/admin/content/about' },
  { label: 'Schedule your first competition', desc: 'Create a competition template and open entries for your first round.',      path: '/admin/competitions/new' },
  { label: 'Write a welcome post',          desc: 'Publish a news post so members see something when they first log in.',        path: '/admin/posts/new' },
]

export default function DraftBanner({ checklist: initial }: { checklist: DraftChecklist }) {
  const [checklist]                        = useState(initial)
  const [suggestedOpen, setSuggestedOpen]  = useState(false)
  const [publishing, start]               = useTransition()
  const [publishError, setPublishError]   = useState<string | null>(null)

  const allDone = checklist.duesModeOk

  async function handlePublish() {
    setPublishError(null)
    start(async () => {
      const result = await publishSite()
      if (result.error) setPublishError(result.error)
    })
  }

  return (
    <div style={{ position: 'relative', zIndex: 40, fontFamily: 'var(--font-primary)' }}>

      {/* ── Main card ── */}
      <div style={{
        margin: '0 0 24px',
        padding: '16px 20px',
        background: '#FFFFFF',
        border: '1px solid #D8DDE7',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 20,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 6px', fontSize: 14, lineHeight: 1.55, color: '#131F2E' }}>
            Your club&rsquo;s site is in{' '}
            <strong>draft mode</strong>
            {' '}— anyone visiting your club URL will see a coming soon page until you publish.
          </p>

          {!allDone && (
            <p style={{ margin: '0 0 6px', fontSize: 14, lineHeight: 1.55, color: '#5A6C82' }}>
              You must{' '}
              <a
                href={`/${checklist.clubSlug}/admin/dues-payment`}
                style={{ color: '#1E4D8C', fontWeight: 500, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                indicate dues &amp; payment
              </a>
              {' '}(if any) before publishing.
            </p>
          )}

          <button
            type="button"
            onClick={() => setSuggestedOpen(v => !v)}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: 14, color: '#1E4D8C', fontFamily: 'inherit',
            }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            Additional suggested items to set up before publishing
          </button>

          {publishError && (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#D32F2F' }}>⚠ {publishError}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handlePublish}
          disabled={!allDone || publishing}
          style={{
            flexShrink: 0,
            padding: '8px 18px',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'inherit',
            border: `1px solid ${allDone ? '#1E4D8C' : '#B0BACA'}`,
            background: 'transparent',
            color: allDone ? '#1E4D8C' : '#B0BACA',
            cursor: allDone ? 'pointer' : 'default',
            opacity: publishing ? 0.7 : 1,
            transition: 'background 0.15s, color 0.15s',
            alignSelf: 'center',
          }}
          onMouseEnter={e => { if (allDone) { e.currentTarget.style.background = '#1E4D8C'; e.currentTarget.style.color = '#fff' } }}
          onMouseLeave={e => { if (allDone) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1E4D8C' } }}
        >
          {publishing ? 'Publishing…' : 'Publish site'}
        </button>
      </div>

      {/* ── Suggested overlay ── */}
      {suggestedOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 48 }}
            onClick={() => setSuggestedOpen(false)}
            aria-hidden
          />
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 49,
            background: '#FFFFFF',
            border: '1px solid #D8DDE7',
            borderRadius: 10,
            boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
            padding: '18px 20px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7E8EA3' }}>
                Suggested before launch
              </p>
              <button
                type="button"
                onClick={() => setSuggestedOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#7E8EA3', lineHeight: 1 }}
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>
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
        </>
      )}
    </div>
  )
}

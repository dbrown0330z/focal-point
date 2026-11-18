'use client'

import { useState, useTransition } from 'react'
import { publishSite } from '@/app/[clubSlug]/(admin)/admin/draft/actions'

export type DraftChecklist = {
  duesModeOk: boolean
  clubSlug:   string
}

// Light-mode palette — hardcoded to avoid OS dark-mode bleed into admin
const W = { bg: '#FFF0C0', text: '#6B4000', dot: '#C47A00', border: 'rgba(196,122,0,0.25)' }
const S = { bg: '#EDFAF0', text: '#174A1A', dot: '#2E7D32', border: 'rgba(46,125,50,0.20)' }

const SUGGESTED = [
  { label: 'Review Club Basics',             desc: 'Fill in your club name, location, season dates, and other key details.',   path: '/admin/club-defaults' },
  { label: 'Customize the homepage',          desc: 'Edit the hero text and welcome message visitors see on your public site.', path: '/admin/content' },
  { label: 'Customize your About page',       desc: 'Tell your story — history, what you shoot, and who you welcome.',          path: '/admin/content/about' },
  { label: 'Schedule your first competition', desc: 'Create a competition template and open entries for your first round.',     path: '/admin/competitions/new' },
  { label: 'Write a welcome post',            desc: 'Publish a news post so members see something when they first log in.',     path: '/admin/posts/new' },
]

export default function DraftBanner({ checklist: initial }: { checklist: DraftChecklist }) {
  const [checklist]                        = useState(initial)
  const [suggestedOpen, setSuggestedOpen]  = useState(false)
  const [publishing, start]               = useTransition()
  const [publishError, setPublishError]   = useState<string | null>(null)

  const allDone = checklist.duesModeOk
  const palette = allDone ? S : W

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

      {/* ── Main bar ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: palette.dot }} />

        <div style={{ flex: 1, fontSize: 14, color: palette.text, lineHeight: 1.5 }}>
          {allDone ? (
            'Your site is ready to go live — members can\'t access it yet.'
          ) : (
            <>
              Your site is in <strong>draft mode</strong> — anyone visiting your URL will see a coming soon page until you publish.
              {' '}You must{' '}
              <a
                href={`/${checklist.clubSlug}/admin/dues-payment`}
                style={{ color: W.text, fontWeight: 700, textDecoration: 'underline' }}
              >
                indicate dues &amp; payment
              </a>
              {' '}(if any) before publishing.
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setSuggestedOpen(v => !v)}
          style={{
            flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 500, color: palette.text, padding: '2px 6px',
            opacity: 0.75, whiteSpace: 'nowrap', fontFamily: 'inherit',
          }}
        >
          Suggested {suggestedOpen ? '↑' : '↓'}
        </button>

        <button
          type="button"
          onClick={handlePublish}
          disabled={!allDone || publishing}
          style={{
            flexShrink: 0,
            padding: '7px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600,
            background: allDone ? S.dot : 'rgba(0,0,0,0.10)',
            color: allDone ? 'white' : '#A0A0A0',
            border: 'none', cursor: allDone ? 'pointer' : 'default',
            opacity: publishing ? 0.7 : 1, fontFamily: 'inherit',
          }}
        >
          {publishing ? 'Publishing…' : 'Publish site →'}
        </button>
      </div>

      {publishError && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 10px' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#D32F2F' }}>⚠ {publishError}</p>
        </div>
      )}

      {/* ── Suggested overlay (drops over page content) ── */}
      {suggestedOpen && (
        <>
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

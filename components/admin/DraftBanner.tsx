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
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// Light-mode palette — hardcoded to avoid OS dark-mode bleed into admin
const W = { bg: '#FFFBE6', text: '#6B5000', dot: '#A67C00', border: 'rgba(166,124,0,0.20)' }
const S = { bg: '#EDFAF0', text: '#174A1A', dot: '#2E7D32', border: 'rgba(46,125,50,0.20)' }

export default function DraftBanner({ checklist: initial }: { checklist: DraftChecklist }) {
  const [checklist, setChecklist] = useState(initial)
  const [expanded,  setExpanded]  = useState(!initial.duesModeOk)
  const [publishing, start]       = useTransition()
  const [publishError, setPublishError] = useState<string | null>(null)

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
    <div style={{ background: palette.bg, borderBottom: `1px solid ${palette.border}`, fontFamily: 'var(--font-primary)' }}>
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
            onClick={() => setExpanded(e => !e)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: W.text, padding: '2px 4px' }}
          >
            What&rsquo;s needed <ChevronDown open={expanded} />
          </button>
        )}

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

      {/* ── Expanded detail ── */}
      {expanded && !allDone && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 16px' }}>
          <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={W.dot} strokeWidth="2" strokeLinecap="round" style={{ marginTop: 3, flexShrink: 0 }}>
              <circle cx="12" cy="12" r="9" />
            </svg>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>
                Dues &amp; Payment
              </p>
              <p style={{ margin: '0 0 8px', fontSize: 14, color: '#696969', lineHeight: 1.5 }}>
                Members need to know what they&rsquo;re paying and how to pay before they join.
              </p>
              <a
                href={`/${checklist.clubSlug}/admin/dues-payment`}
                style={{ fontSize: 14, fontWeight: 600, color: '#1A6FC4', textDecoration: 'none' }}
              >
                Set up Dues &amp; Payment →
              </a>
            </div>
          </div>
          {publishError && <p style={{ margin: '12px 0 0', fontSize: 13, color: '#D32F2F' }}>⚠ {publishError}</p>}
        </div>
      )}
    </div>
  )
}

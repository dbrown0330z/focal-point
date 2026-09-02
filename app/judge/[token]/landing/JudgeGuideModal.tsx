'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

// ─── Section data ──────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    step:  '01',
    title: 'The welcome page',
    icon:  '🏠',
    body: [
      'This page shows you every category in the competition. Each card displays how many images are in that category and how many you\'ve scored so far.',
      'Your progress saves automatically to the cloud — you can close the window and come back at any time before the deadline.',
      'When every category is complete the Submit button will activate. Until then it stays locked.',
    ],
    tips: [],
  },
  {
    step:  '02',
    title: 'Quick Triage — your first pass',
    icon:  '⚡',
    body: [
      'When you open a category you land in Quick Triage — a drag-and-drop sorting board. This is your chance to form a first impression before any scores are committed.',
      'Unsorted images appear in a horizontal strip across the top. Drag each one into one of three columns: Strong, Maybe, or Weak. If you change your mind, click the ✕ badge on any card to return it to the strip.',
    ],
    tips: [
      'Triage doesn\'t assign scores — it\'s purely for rough grouping.',
      'If the strip is too wide to see all at once, use the ‹ › arrows on each side to scroll through.',
      'You can skip Triage entirely and go straight to Grid or Single view using the controls at the top.',
    ],
  },
  {
    step:  '03',
    title: 'Grid view — score at a glance',
    icon:  '⊞',
    body: [
      'Switch to Grid view to score images in a thumbnail layout. Unscored images show four quick-pick buttons — tap any number to set a starting score instantly. Once scored, a slider appears so you can fine-tune.',
      'The bucket filter dropdown lets you focus on images from a specific Triage group (Strong / Maybe / Weak) so your scores stay consistent within each group.',
      'Sorting doesn\'t happen automatically — scores won\'t jumble cards while you\'re working. When you\'re ready to reorder the grid, pick a sort direction from the dropdown and click Sort ↕.',
    ],
    tips: [
      'Use the S / L toggle to adjust thumbnail size.',
      'Switch to the list icon (☰) for a ranked view that groups images by score.',
      'Clicking a thumbnail opens that image in Single view for a closer look.',
    ],
  },
  {
    step:  '04',
    title: 'Single view — one image at a time',
    icon:  '◻',
    body: [
      'Single view shows one full-size image with a score panel on the right. Use the score slider or type a number directly into the score field. Scores save automatically within a second.',
      'Navigate with the Previous / Next buttons, or use keyboard shortcuts: ← → (or ↑ ↓) to move between images, Z to zoom to fullscreen, F to flag an image for your own reference.',
    ],
    tips: [
      'Flagged images get a purple ⚑ badge — useful for ones you want to revisit.',
      'The filmstrip at the bottom shows all images in the current category. Flagged images have a purple border; scored images show their score. Click any thumbnail to jump there.',
      'The progress bar in the top bar updates in real time.',
    ],
  },
  {
    step:  '05',
    title: 'Finishing up',
    icon:  '✓',
    body: [
      'Once you\'ve scored every image in every category, come back to the welcome page. The overall progress bar will be full and the Submit button will activate.',
      'After submitting, your scores are final. You can still browse images but cannot make changes. The club admin will be notified automatically.',
    ],
    tips: [
      'If you notice a mistake before submitting, go back into the category and adjust — there\'s no lock until you hit Submit.',
    ],
  },
]

// ─── Component ──────────────────────────────────────────────────────────────────
export default function JudgeGuideModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        style={{
          background:  'none',
          border:      'none',
          padding:     0,
          cursor:      'pointer',
          fontSize:    14,
          color:       'var(--action-primary)',
          fontFamily:  'inherit',
          display:     'inline-flex',
          alignItems:  'center',
          gap:         5,
          fontWeight:  500,
          opacity:     0.85,
          transition:  'opacity 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'}
      >
        <span style={{
          display:        'inline-flex',
          alignItems:     'center',
          justifyContent: 'center',
          width:          18,
          height:         18,
          borderRadius:   '50%',
          border:         '1.5px solid currentColor',
          fontSize:       11,
          fontWeight:     700,
          flexShrink:     0,
        }}>?</span>
        How this works
      </button>

      {/* Modal — rendered via portal so it escapes any stacking context */}
      {open && typeof window !== 'undefined' && createPortal(
        <div
          onClick={() => setOpen(false)}
          style={{
            position:        'fixed',
            inset:           0,
            zIndex:          9999,
            background:      'rgba(0,0,0,0.55)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            padding:         '24px 16px',
            backdropFilter:  'blur(4px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:   'var(--surface-2)',
              border:       '1px solid var(--border-default)',
              borderRadius: 16,
              width:        '100%',
              maxWidth:     680,
              maxHeight:    '85vh',
              display:      'flex',
              flexDirection:'column',
              overflow:     'hidden',
              boxShadow:    '0 24px 64px rgba(0,0,0,0.30)',
            }}
          >
            {/* Header */}
            <div style={{
              padding:       '22px 28px 18px',
              borderBottom:  '1px solid var(--border-subtle)',
              display:       'flex',
              alignItems:    'baseline',
              justifyContent:'space-between',
              gap:           16,
              flexShrink:    0,
            }}>
              <div>
                <h2 style={{
                  fontFamily:    'var(--font-heading, Georgia, serif)',
                  fontSize:      22,
                  fontWeight:    700,
                  letterSpacing: '-0.015em',
                  color:         'var(--text-primary)',
                  margin:        '0 0 4px',
                }}>
                  How judging works
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                  A quick guide from welcome screen to submission
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close guide"
                style={{
                  background:  'none',
                  border:      '1px solid var(--border-default)',
                  borderRadius:8,
                  width:       32,
                  height:      32,
                  cursor:      'pointer',
                  color:       'var(--text-secondary)',
                  fontSize:    18,
                  fontWeight:  300,
                  display:     'flex',
                  alignItems:  'center',
                  justifyContent:'center',
                  flexShrink:  0,
                }}
              >✕</button>
            </div>

            {/* Scrollable body */}
            <div style={{ overflowY: 'auto', padding: '24px 28px 32px', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {SECTIONS.map((s, i) => (
                  <section key={s.step}>
                    {/* Step header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <span style={{
                        flexShrink:  0,
                        width:       32,
                        height:      32,
                        borderRadius:'50%',
                        background:  'var(--surface-1)',
                        border:      '1px solid var(--border-default)',
                        display:     'flex',
                        alignItems:  'center',
                        justifyContent:'center',
                        fontSize:    16,
                      }}>{s.icon}</span>
                      <div>
                        <p style={{
                          fontSize:      10,
                          fontWeight:    700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color:         'var(--text-tertiary)',
                          margin:        '0 0 1px',
                        }}>Step {s.step}</p>
                        <h3 style={{
                          fontFamily:    'var(--font-heading, Georgia, serif)',
                          fontSize:      17,
                          fontWeight:    700,
                          letterSpacing: '-0.01em',
                          color:         'var(--text-primary)',
                          margin:        0,
                        }}>{s.title}</h3>
                      </div>
                    </div>

                    {/* Body paragraphs */}
                    <div style={{ paddingLeft: 44, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {s.body.map((p, pi) => (
                        <p key={pi} style={{
                          fontSize:   14,
                          lineHeight: 1.65,
                          color:      'var(--text-primary)',
                          margin:     0,
                          opacity:    0.88,
                        }}>{p}</p>
                      ))}

                      {/* Tips */}
                      {s.tips.length > 0 && (
                        <ul style={{
                          margin:     '6px 0 0',
                          padding:    '12px 16px',
                          borderRadius: 8,
                          background: 'var(--surface-1)',
                          border:     '1px solid var(--border-subtle)',
                          listStyle:  'none',
                          display:    'flex',
                          flexDirection:'column',
                          gap:        6,
                        }}>
                          {s.tips.map((tip, ti) => (
                            <li key={ti} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                              <span style={{ flexShrink: 0, fontSize: 12, color: 'var(--action-primary)', marginTop: 1 }}>→</span>
                              <span style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Divider (except after last) */}
                    {i < SECTIONS.length - 1 && (
                      <div style={{ height: 1, background: 'var(--border-subtle)', marginTop: 32 }} />
                    )}
                  </section>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding:     '16px 28px',
              borderTop:   '1px solid var(--border-subtle)',
              display:     'flex',
              justifyContent:'flex-end',
              flexShrink:  0,
            }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  padding:     '9px 24px',
                  borderRadius: 8,
                  border:      'none',
                  background:  'var(--action-primary)',
                  color:       '#fff',
                  fontSize:    14,
                  fontWeight:  600,
                  cursor:      'pointer',
                  fontFamily:  'inherit',
                }}
              >
                Got it, let's judge
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  heading:      string
  body:         string   // HTML from rich-text editor
  previewLines: number
}

type LeadMode =
  | { type: 'text-only' }
  | { type: 'leading-image'; src: string; alt: string }
  | { type: 'floated-image'; src: string; alt: string; float: 'left' | 'right'; textHtml: string }

function stripImages(html: string): string {
  return html.replace(/<img[^>]*>/gi, '')
}

// Pure-string parse — no DOMParser, safe for SSR/hydration.
function parseLeadMode(html: string): LeadMode {
  const h = html?.trim()
  if (!h) return { type: 'text-only' }

  // Find the first <img tag in the document
  const imgIdx = h.toLowerCase().indexOf('<img')
  if (imgIdx === -1) return { type: 'text-only' }

  // Only proceed if everything before the <img is optional whitespace + optional <p …>
  const before = h.slice(0, imgIdx)
  if (!/^(<p[^>]*>\s*)?\s*$/.test(before)) return { type: 'text-only' }

  // Extract the full opening <img …> tag
  const imgTagMatch = h.slice(imgIdx).match(/^<img([^>]*)>/i)
  if (!imgTagMatch) return { type: 'text-only' }

  const attrs   = imgTagMatch[1]
  const fullTag = imgTagMatch[0]

  const src = attrs.match(/src="([^"]*)"/i)?.[1]
           ?? attrs.match(/src='([^']*)'/i)?.[1]
           ?? ''
  if (!src) return { type: 'text-only' }

  const alt   = attrs.match(/alt="([^"]*)"/i)?.[1] ?? ''
  const style = attrs.match(/style="([^"]*)"/i)?.[1] ?? ''
  const float = style.match(/float\s*:\s*(left|right)/i)?.[1]

  if (!float) {
    // Standalone leading image — card becomes image-only
    return { type: 'leading-image', src, alt }
  }

  // Floated image — strip it from the text so we can lay them out separately
  const textHtml = html
    .replace(fullTag, '')           // remove the <img …> tag
    .replace(/^<p[^>]*>\s*<\/p>/i, '') // remove any empty <p> left behind
    .trim()

  return { type: 'floated-image', src, alt, float: float as 'left' | 'right', textHtml }
}

export default function CustomContentNote({ heading, body, previewLines }: Props) {
  const leadMode = parseLeadMode(body)

  const [clamped, setClamped] = useState(false)
  const [open,    setOpen]    = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  const hasBody = !!body && body.trim() !== '' && body !== '<p><br></p>'
  const textHtml = leadMode.type === 'floated-image' ? leadMode.textHtml : body

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    setClamped(el.scrollHeight > el.clientHeight + 2)
  }, [body])

  // ─── Leading image: card is image only ───────────────────────────────────────
  if (leadMode.type === 'leading-image') {
    return (
      <>
        <div
          className="rounded-lg overflow-hidden h-full cursor-pointer"
          style={{ background: 'var(--surface-1)', position: 'relative' }}
          onClick={() => setOpen(true)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={leadMode.src}
            alt={leadMode.alt}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        {open && (
          <FullModal heading={heading} body={body} onClose={() => setOpen(false)} />
        )}
      </>
    )
  }

  // ─── Common card wrapper ──────────────────────────────────────────────────────
  return (
    <>
      <div
        className="rounded-lg p-4 h-full flex flex-col"
        style={{ background: 'var(--surface-1)' }}
      >
        {heading && (
          <h3 style={{
            fontFamily:    'var(--font-lora, Georgia, serif)',
            fontSize:      16,
            fontWeight:    700,
            color:         'var(--text-primary)',
            marginBottom:  10,
            lineHeight:    1.3,
            letterSpacing: '-0.01em',
          }}>
            {heading}
          </h3>
        )}

        {hasBody ? (
          <>
            {/* ── Floated image + text side by side ── */}
            {leadMode.type === 'floated-image' ? (
              <div
                className="flex-1 min-h-0"
                style={{
                  display:   'flex',
                  flexDirection: leadMode.float === 'right' ? 'row-reverse' : 'row',
                  gap:       12,
                  overflow:  'hidden',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={leadMode.src}
                  alt={leadMode.alt}
                  style={{
                    height:      `calc(${previewLines} * 1.6em)`,
                    width:       'auto',
                    maxWidth:    '45%',
                    objectFit:   'contain',
                    flexShrink:  0,
                    borderRadius: 4,
                    alignSelf:   'flex-start',
                  }}
                />
                <div
                  ref={bodyRef}
                  className="rte-content flex-1 min-w-0"
                  style={{
                    overflow:        'hidden',
                    display:         '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: previewLines,
                  }}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: textHtml }}
                />
              </div>
            ) : (
              /* ── Text only ── */
              <div
                ref={bodyRef}
                className="rte-content flex-1"
                style={{
                  overflow:        'hidden',
                  display:         '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: previewLines,
                }}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: stripImages(body) }}
              />
            )}

            {clamped && (
              <button
                onClick={() => setOpen(true)}
                style={{
                  marginTop:  10,
                  cursor:     'pointer',
                  border:     'none',
                  background: 'none',
                  padding:    0,
                  fontSize:   13,
                  fontWeight: 500,
                  color:      'var(--action-primary)',
                  fontFamily: 'var(--font-nunito, system-ui, sans-serif)',
                  textAlign:  'left',
                }}
              >
                Read more →
              </button>
            )}
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            No content yet.
          </p>
        )}
      </div>

      {open && (
        <FullModal heading={heading} body={body} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

// ─── Shared full-content modal ────────────────────────────────────────────────

function FullModal({ heading, body, onClose }: { heading: string; body: string; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         1300,
        background:     'rgba(0,0,0,0.55)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '24px 16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:    'var(--surface-2)',
          borderRadius:  12,
          border:        '1px solid var(--border-default)',
          maxWidth:      600,
          width:         '100%',
          maxHeight:     'calc(100vh - 80px)',
          display:       'flex',
          flexDirection: 'column',
          boxShadow:     '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '18px 24px 14px',
          borderBottom:   '1px solid var(--border-subtle)',
          flexShrink:     0,
        }}>
          {heading ? (
            <h2 style={{
              fontFamily:    'var(--font-lora, Georgia, serif)',
              fontSize:      18,
              fontWeight:    700,
              color:         'var(--text-primary)',
              lineHeight:    1.25,
              margin:        0,
              letterSpacing: '-0.01em',
            }}>
              {heading}
            </h2>
          ) : <span />}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              flexShrink:   0,
              marginLeft:   16,
              cursor:       'pointer',
              border:       'none',
              background:   'none',
              padding:      4,
              color:        'var(--text-tertiary)',
              fontSize:     20,
              lineHeight:   1,
              borderRadius: 4,
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}
          className="rte-content"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: body }}
        />
      </div>
    </div>
  )
}

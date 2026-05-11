'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  heading:      string
  body:         string   // HTML from rich-text editor
  previewLines: number
}

export default function CustomContentNote({ heading, body, previewLines }: Props) {
  const [clamped,  setClamped]  = useState(false)   // true if content overflows
  const [open,     setOpen]     = useState(false)   // modal open
  const bodyRef = useRef<HTMLDivElement>(null)

  const hasBody = !!body && body.trim() !== '' && body !== '<p><br></p>'

  // Detect whether the content is actually clamped after mount
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    setClamped(el.scrollHeight > el.clientHeight + 2)
  }, [body])

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
            <div
              ref={bodyRef}
              className="rte-content flex-1"
              style={{
                overflow:          'hidden',
                display:           '-webkit-box',
                WebkitBoxOrient:   'vertical',
                WebkitLineClamp:   previewLines,
              }}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: body }}
            />
            {clamped && (
              <button
                onClick={() => setOpen(true)}
                style={{
                  marginTop:   10,
                  cursor:      'pointer',
                  border:      'none',
                  background:  'none',
                  padding:     0,
                  fontSize:    13,
                  fontWeight:  500,
                  color:       'var(--action-primary)',
                  fontFamily:  'var(--font-nunito, system-ui, sans-serif)',
                  textAlign:   'left',
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

      {/* Read-more modal */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position:        'fixed',
            inset:           0,
            zIndex:          1300,
            background:      'rgba(0,0,0,0.55)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            padding:         '24px 16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:   'var(--surface-2)',
              borderRadius: 12,
              border:       '1px solid var(--border-default)',
              maxWidth:     600,
              width:        '100%',
              maxHeight:    'calc(100vh - 80px)',
              display:      'flex',
              flexDirection:'column',
              boxShadow:    '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Modal header */}
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
                  fontFamily:   'var(--font-lora, Georgia, serif)',
                  fontSize:     18,
                  fontWeight:   700,
                  color:        'var(--text-primary)',
                  lineHeight:   1.25,
                  margin:       0,
                  letterSpacing: '-0.01em',
                }}>
                  {heading}
                </h2>
              ) : <span />}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{
                  flexShrink:  0,
                  marginLeft:  16,
                  cursor:      'pointer',
                  border:      'none',
                  background:  'none',
                  padding:     4,
                  color:       'var(--text-tertiary)',
                  fontSize:    20,
                  lineHeight:  1,
                  borderRadius: 4,
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div
              style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}
              className="rte-content"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: body }}
            />
          </div>
        </div>
      )}
    </>
  )
}

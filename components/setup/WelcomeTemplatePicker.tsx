'use client'

import { useEffect, useState } from 'react'
import { WELCOME_TEMPLATES, resolveTemplate, type WelcomeTemplate } from '@/lib/homepage/welcome-templates'
import type { WelcomeContent } from '@/lib/homepage/types'

interface Props {
  clubName: string
  value:    WelcomeContent
  onChange: (v: WelcomeContent) => void
}

export function WelcomeTemplatePicker({ clubName, value, onChange }: Props) {
  const [templateId, setTemplateId]   = useState(value.templateId ?? WELCOME_TEMPLATES[0].id)
  const [vars, setVars]               = useState<Record<string, string>>(value.templateVars ?? {})

  const template = WELCOME_TEMPLATES.find(t => t.id === templateId) ?? WELCOME_TEMPLATES[0]

  // When template changes, reset vars to empty so old keys don't bleed through
  function pickTemplate(id: string) {
    setTemplateId(id)
    setVars({})
  }

  function setVar(key: string, val: string) {
    setVars(prev => ({ ...prev, [key]: val }))
  }

  // Propagate resolved content upward whenever inputs change
  useEffect(() => {
    const resolved = resolveTemplate(template, clubName, vars)
    onChange({
      ...value,
      heading:      resolved.heading,
      body:         resolved.body,
      templateId,
      templateVars: vars,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, vars, clubName])

  const preview = resolveTemplate(template, clubName, vars)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Template selector */}
      <div>
        <label style={labelStyle}>Choose a style</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
          {WELCOME_TEMPLATES.map(t => (
            <label key={t.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
              border: `1.5px solid ${templateId === t.id ? 'var(--action-primary)' : 'var(--border-default)'}`,
              background: templateId === t.id ? 'rgba(26,111,196,0.04)' : 'var(--surface-2)',
              transition: 'border-color .15s',
            }}>
              <input
                type="radio"
                name="welcomeTemplate"
                value={t.id}
                checked={templateId === t.id}
                onChange={() => pickTemplate(t.id)}
                style={{ marginTop: 2, accentColor: 'var(--action-primary)' }}
              />
              <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: templateId === t.id ? 500 : 400 }}>
                {t.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Variable inputs */}
      {template.vars.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Fill in your club details — the preview updates as you type.
          </p>
          {template.vars.map(v => (
            <div key={v.key}>
              <label style={labelStyle}>{v.label}</label>
              <input
                type="text"
                value={vars[v.key] ?? ''}
                onChange={e => setVar(v.key, e.target.value)}
                placeholder={v.placeholder}
                style={inputStyle}
              />
            </div>
          ))}
        </div>
      )}

      {/* Live preview */}
      <div style={{
        padding: '16px 18px', borderRadius: 8,
        background: 'var(--surface-1)',
        border: '1px solid var(--border-subtle)',
      }}>
        <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Preview</p>
        <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)',
                    lineHeight: 1.35 }}>
          {preview.heading}
        </p>
        {preview.body.split('\n\n').map((para, i) => (
          <p key={i} style={{ margin: i === 0 ? 0 : '8px 0 0', fontSize: 13,
                              color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            {para}
          </p>
        ))}
      </div>

      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)' }}>
        You can edit the headline and body text directly in Admin → Content at any time.
      </p>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 500,
  color: 'var(--text-primary)', marginBottom: 4,
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '7px 10px', borderRadius: 7, fontSize: 14,
  border: '1px solid var(--border-default)',
  background: 'var(--surface-2)', color: 'var(--text-primary)',
  outline: 'none',
}

'use client'

import { useState, useTransition, createContext, useContext, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Collapse, Dialog, Switch } from '@mui/material'
import { createCompetitionFromSchedule } from '../actions'
import { saveTemplate }                from './templates/actions'
import {
  defaultConfig, defaultSchedule, CLUB_DEFAULTS, PRESET_DEFAULTS,
  type CompetitionConfig, type CompetitionSchedule, type CompetitionType,
  type JudgingPreset, type ImageReusePolicy, type JudgeCommentsSetting,
} from '@/types/competition'

// ─── Types ────────────────────────────────────────────────────────────────────

type Template = { id: string; name: string; config: CompetitionConfig }

// ─── Color palettes ───────────────────────────────────────────────────────────

const C_DARK = {
  surface:            '#16202F',
  sunken:             '#111B28',
  inputBg:            '#101A27',
  accent:             '#3F7FC4',
  accentBorder:       '#4D8FD6',
  accentChipBg:       '#24405E',
  accentChipBorder:   'rgba(122,175,235,.35)',
  stepCurrent:        '#5B9BD5',
  stepDone:           '#2F6394',
  stepPending:        'rgba(255,255,255,.09)',
  link:               '#6AA9E9',
  linkHover:          '#8FC2F5',
  textPrimary:        '#F1F5FA',
  textBody:           '#E6EDF6',
  textOnChip:         '#DBE6F2',
  textSecondary:      '#A9BACD',
  textMuted:          '#8B9CB0',
  textLabel:          '#7D90A6',
  textFaint:          '#63748A',
  textEyebrow:        '#6B7D92',
  custom:             '#D8B23C',
  customBorder:       'rgba(216,178,60,.35)',
  rule:               'rgba(255,255,255,.07)',
  ruleSoft:           'rgba(255,255,255,.055)',
  bandChipBg:         '#111B28',
  dimLabel:           '#8394A8',
  dimDesc:            '#6B7C90',
  inputBorder:        'rgba(255,255,255,.1)',
  inputBorderAccent:  'rgba(122,175,235,.45)',
  border:             'rgba(255,255,255,.14)',
  borderSubtle:       'rgba(255,255,255,.09)',
  indentBorder:       'rgba(122,175,235,.3)',
  changeHighlight:    '#F4D98A',
  stepDoneBorder:     'rgba(122,175,235,.3)',
  stepCurrentGlow:    '0 0 0 4px rgba(91,155,213,.18)',
  catBtnUnselBorder:  'rgba(255,255,255,.1)',
  error:              '#D32F2F',
}

const C_LIGHT = {
  surface:            '#FFFFFF',
  sunken:             '#F7F8FA',
  inputBg:            '#EDF0F5',
  accent:             '#1E4D8C',
  accentBorder:       '#163A6B',
  accentChipBg:       'rgba(30,77,140,0.08)',
  accentChipBorder:   'rgba(30,77,140,0.3)',
  stepCurrent:        '#1E4D8C',
  stepDone:           '#3E5066',
  stepPending:        'rgba(0,0,0,.09)',
  link:               '#1E4D8C',
  linkHover:          '#163A6B',
  textPrimary:        '#131F2E',
  textBody:           '#26374C',
  textOnChip:         '#131F2E',
  textSecondary:      '#5A6C82',
  textMuted:          '#7E8EA3',
  textLabel:          '#7E8EA3',
  textFaint:          '#B0BACA',
  textEyebrow:        '#5A6C82',
  custom:             '#7B6B38',
  customBorder:       'rgba(123,107,56,0.35)',
  rule:               '#D8DDE7',
  ruleSoft:           '#EDF0F5',
  bandChipBg:         '#F7F8FA',
  dimLabel:           '#B0BACA',
  dimDesc:            '#D8DDE7',
  inputBorder:        '#B0BACA',
  inputBorderAccent:  'rgba(30,77,140,.35)',
  border:             'rgba(0,0,0,.14)',
  borderSubtle:       'rgba(0,0,0,.08)',
  indentBorder:       'rgba(30,77,140,.25)',
  changeHighlight:    '#7B6B38',
  stepDoneBorder:     'rgba(30,77,140,.2)',
  stepCurrentGlow:    '0 0 0 4px rgba(30,77,140,.15)',
  catBtnUnselBorder:  'rgba(0,0,0,.1)',
  error:              '#D32F2F',
}

type CType = typeof C_DARK
const ThemeCtx = createContext<CType>(C_DARK)

function useDarkMode(): boolean {
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return dark
}

function differs(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) !== JSON.stringify(b)
}

function addDays(dateStr: string, days: number): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function fmtDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtTime(timeStr: string) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function ProvChip({ isCustom, resetTo, onReset, chipText = 'Club default', customText = 'Custom' }: {
  isCustom: boolean; resetTo: string; onReset: () => void
  chipText?: string; customText?: string
}) {
  const c = useContext(ThemeCtx)
  const chip: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontSize: 11.5, letterSpacing: '.03em', borderRadius: 5,
    padding: '2px 7px', border: `1px solid ${isCustom ? c.customBorder : c.inputBorder}`,
    color: isCustom ? c.custom : c.textLabel,
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={chip}>{isCustom ? customText : chipText}</span>
      {isCustom && (
        <button onClick={onReset} style={{
          fontSize: 11.5, color: c.link, background: 'none', border: 'none',
          cursor: 'pointer', padding: 0,
        }}>
          Reset to {resetTo}
        </button>
      )}
    </div>
  )
}

function InlineChip({ label }: { label: string }) {
  const c = useContext(ThemeCtx)
  return (
    <span style={{
      fontSize: 11, letterSpacing: '.03em', borderRadius: 5, whiteSpace: 'nowrap',
      padding: '2px 7px', border: `1px solid ${c.inputBorder}`, color: c.textLabel,
    }}>
      {label}
    </span>
  )
}

function BandChip({ label, dim }: { label: string; dim?: boolean }) {
  const c = useContext(ThemeCtx)
  return (
    <span style={{
      fontSize: 12.5, background: c.bandChipBg,
      border: `1px solid ${c.rule}`, borderRadius: 6,
      padding: '5px 10px', color: dim ? c.dimDesc : c.textSecondary,
    }}>
      {label}
    </span>
  )
}

function TogRow({ label, on, onChange, onDesc, offDesc, narrow, labelExtra, children }: {
  label: string; on: boolean; onChange: (v: boolean) => void
  onDesc: string; offDesc: string; narrow?: boolean
  labelExtra?: React.ReactNode; children?: React.ReactNode
}) {
  const c = useContext(ThemeCtx)
  const switchSx = {
    '& .MuiSwitch-switchBase.Mui-checked': { color: '#fff' },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
      backgroundColor: c.accent, opacity: 1,
    },
  }
  const lc = on ? c.textBody : c.dimLabel
  const dc = on ? c.textMuted : c.dimDesc
  const desc = (on ? 'On — ' : 'Off — ') + (on ? onDesc : offDesc)
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontSize: 14.5, fontWeight: 500, color: lc }}>{label}</span>
            {labelExtra}
          </div>
          <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, color: dc, maxWidth: '56ch' }}>{desc}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: 2 }}>
          <Switch size="small" sx={switchSx} checked={on} onChange={e => onChange(e.target.checked)} />
        </div>
      </div>
      {children}
    </div>
  )
}

function ChildRow({ children }: { children: React.ReactNode }) {
  const c = useContext(ThemeCtx)
  return (
    <div style={{
      marginTop: 12, marginLeft: 18, paddingLeft: 22,
      borderLeft: `2px solid ${c.indentBorder}`,
    }}>
      {children}
    </div>
  )
}

function Stepper({ value, min, max, onChange }: {
  value: number; min: number; max?: number; onChange: (v: number) => void
}) {
  const c = useContext(ThemeCtx)
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)
  const btn: React.CSSProperties = {
    width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent',
    color: c.textSecondary, fontSize: 16, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  }
  return (
    <div style={{
      display: 'flex', gap: 3, alignItems: 'center', padding: 3,
      background: c.inputBg, border: `1px solid ${c.inputBorder}`, borderRadius: 9,
    }}>
      <button style={btn} onClick={dec}>−</button>
      <span style={{ minWidth: 36, textAlign: 'center', fontSize: 15, fontWeight: 600, color: c.textPrimary }}>{value}</span>
      <button style={btn} onClick={inc}>+</button>
    </div>
  )
}

function Sel({ value, onChange, options, width, placeholder }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
  width?: number; placeholder?: string
}) {
  const c = useContext(ThemeCtx)
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width: width ?? 'auto' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none', background: c.inputBg, border: `1px solid ${c.inputBorder}`,
          borderRadius: 9, padding: '8px 32px 8px 12px', fontSize: 14, color: value ? c.textBody : c.textLabel,
          cursor: 'pointer', width: '100%', minWidth: width ?? 150, fontFamily: 'inherit',
        }}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 10, pointerEvents: 'none', fontSize: 10, color: c.textLabel }}>▾</span>
    </div>
  )
}

function TextInput({ value, onChange, placeholder, maxWidth, error, hint }: {
  value: string; onChange: (v: string) => void; placeholder?: string
  maxWidth?: number; error?: string; hint?: string
}) {
  const c = useContext(ThemeCtx)
  return (
    <div style={{ maxWidth: maxWidth ?? 420 }}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: c.inputBg, border: `1px solid ${error ? c.error : c.inputBorderAccent}`,
          borderRadius: 9, padding: '11px 14px', fontSize: 15,
          color: c.textPrimary, fontFamily: 'inherit',
          outline: 'none',
        }}
      />
      {hint && !error && <div style={{ marginTop: 6, fontSize: 12.5, color: c.textMuted }}>{hint}</div>}
      {error && <div style={{ marginTop: 6, fontSize: 12.5, color: c.error }}>{error}</div>}
    </div>
  )
}

function DateInput({ value, onChange, label }: {
  value: string; onChange: (v: string) => void; label?: string
}) {
  const c = useContext(ThemeCtx)
  return (
    <div>
      {label && <div style={{ fontSize: 12.5, color: c.textLabel, marginBottom: 6 }}>{label}</div>}
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: c.inputBg, border: `1px solid ${c.inputBorder}`,
          borderRadius: 9, padding: '8px 12px', fontSize: 14,
          color: value ? c.textBody : c.textLabel,
          fontFamily: 'inherit', cursor: 'pointer',
        }}
      />
    </div>
  )
}

function OptionCard({ selected, onClick, title, desc, unavailable, badge }: {
  selected: boolean; onClick: () => void; title: string; desc: string
  unavailable?: boolean; badge?: string
}) {
  const c = useContext(ThemeCtx)
  return (
    <button
      onClick={unavailable ? undefined : onClick}
      disabled={unavailable}
      style={{
        textAlign: 'left', width: '100%', borderRadius: 10, padding: '14px 16px',
        background: selected ? c.accentChipBg : c.sunken,
        border: `1.5px solid ${selected ? c.stepCurrent : c.stepPending}`,
        boxShadow: selected ? `0 0 0 1px ${c.accentChipBorder}` : 'none',
        opacity: unavailable ? 0.55 : 1,
        cursor: unavailable ? 'default' : 'pointer',
        transition: 'border-color .12s',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
          border: `1.5px solid ${selected ? c.stepCurrent : c.border}`,
          background: selected ? c.stepCurrent : 'transparent',
          boxShadow: selected ? `inset 0 0 0 3.5px ${c.surface}` : 'none',
        }} />
        <span style={{ fontSize: 14.5, fontWeight: 600, color: c.textPrimary }}>{title}</span>
        {badge && (
          <span style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 5,
            border: `1px solid ${c.inputBorder}`, color: c.textLabel,
          }}>{badge}</span>
        )}
      </div>
      <div style={{ marginTop: 7, paddingLeft: 27, fontSize: 13, lineHeight: 1.5, color: c.textMuted }}>{desc}</div>
    </button>
  )
}

const STEP_LABELS = ['Basics', 'Entries', 'Judging', 'Recognition', 'Review', 'Schedule']
function BarStepper({ step, onStep }: { step: number; onStep: (s: number) => void }) {
  const c = useContext(ThemeCtx)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginTop: 22 }}>
      {STEP_LABELS.map((label, i) => {
        const n = i + 1
        const done    = n < step
        const current = n === step
        const barColor = done ? c.stepDone : current ? c.stepCurrent : c.stepPending
        const lblColor = current ? c.textPrimary : done ? c.textSecondary : c.textEyebrow
        const lblWeight = current ? 600 : 400
        return (
          <button
            key={n}
            onClick={() => onStep(n)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ height: 3, borderRadius: 2, background: barColor }} />
            <div style={{ marginTop: 7, fontSize: 12.5, fontWeight: lblWeight, color: lblColor }}>{label}</div>
          </button>
        )
      })}
    </div>
  )
}

function Band({ label, subLine, children, gutterExtra }: {
  label: string; subLine?: string; children: React.ReactNode; gutterExtra?: React.ReactNode
}) {
  const c = useContext(ThemeCtx)
  return (
    <div style={{
      display: 'flex', gap: 32, padding: '24px 32px 26px',
      borderTop: `1px solid ${c.rule}`,
    }}>
      <div style={{ width: 176, flexShrink: 0, paddingTop: 2 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: c.textLabel }}>
          {label}
        </div>
        {subLine && <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.5, color: c.textFaint }}>{subLine}</div>}
        {gutterExtra}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

function Rows({ children }: { children: React.ReactNode }) {
  const c = useContext(ThemeCtx)
  const items = (Array.isArray(children) ? (children as unknown[]).flat() : [children]).filter(Boolean)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {items.map((child, i) => (
        <div key={i} style={{ paddingTop: i > 0 ? 16 : 0, borderTop: i > 0 ? `1px solid ${c.ruleSoft}` : 'none' }}>
          {child as React.ReactNode}
        </div>
      ))}
    </div>
  )
}

function Row({ label, desc, children, narrow, labelExtra }: {
  label: string; desc?: string; children?: React.ReactNode
  narrow?: boolean; labelExtra?: React.ReactNode
}) {
  const c = useContext(ThemeCtx)
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: narrow ? '1fr 120px' : '1fr 260px',
      gap: 24, alignItems: 'start',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14.5, fontWeight: 500, color: c.textBody }}>
          <span>{label}</span>{labelExtra}
        </div>
        {desc && <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, color: c.textMuted, maxWidth: '52ch' }}>{desc}</div>}
      </div>
      {children && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 7 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function DefFooter({ note, linkText, linkHref }: {
  note: React.ReactNode; linkText?: string; linkHref?: string
}) {
  const c = useContext(ThemeCtx)
  return (
    <div style={{
      background: c.sunken, borderTop: `1px solid ${c.rule}`,
      padding: '14px 32px', display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', flexShrink: 0,
    }}>
      <span style={{ fontSize: 12.5, color: c.textMuted }}>{note}</span>
      {linkHref && (
        <a href={linkHref}
          target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 12.5, color: c.link, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          {linkText ?? 'Manage competition defaults'} ↗
        </a>
      )}
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const JUDGE_COUNT_OPTIONS = [1,2,3,4,5].map(n => ({ value: String(n), label: n === 1 ? '1 judge' : `${n} judges` }))

const COMMENT_OPTIONS: { value: JudgeCommentsSetting; label: string }[] = [
  { value: 'none',     label: 'None'     },
  { value: 'optional', label: 'Optional' },
  { value: 'required', label: 'Required' },
]

const REUSE_OPTIONS: { value: ImageReusePolicy; label: string }[] = [
  { value: 'once-per-type',   label: 'Allowed in other types' },
  { value: 'once-per-season', label: 'Once per season' },
  { value: 'once-ever',       label: 'Once ever' },
  { value: 'unrestricted',    label: 'Unrestricted' },
]

const PRESET_OPTIONS: { value: JudgingPreset; label: string; desc: string; best: string }[] = [
  { value: 'simple-scored', label: 'Salon style',   desc: 'A judge gives each image a number; members see their score and where it ranked.', best: 'Best for monthly salons and regular club competitions.' },
  { value: 'salon',         label: 'Salon (panel)', desc: 'Multiple judges score independently and the scores are totalled per image.',       best: 'Best for larger salons with an invited panel.' },
  { value: 'awards-only',   label: 'Awards only',   desc: 'No numeric scores — judges name placings and honourable mentions.',                best: 'Best for themed nights and end-of-season shows.' },
  { value: 'member-vote',   label: 'Member vote',   desc: 'Members rank the entries themselves; votes are tallied on close.',                  best: "Best for club choice and people's-choice rounds." },
  { value: 'end-of-year',   label: 'End of year',   desc: "Entries are drawn from the season's results and judged as a final round.",        best: 'Best for annual competitions and trophy nights.' },
]

const benchmarkBands = [...(CLUB_DEFAULTS.recognitionDefaults.benchmark?.bands ?? [])].reverse()

// ─── Step 1 — Basics ──────────────────────────────────────────────────────────

function Step1({ name, onName, showFriendly, onShowFriendly, friendlyName, onFriendlyName,
  start, onStart, templates, selectedTemplateId, onSelectTemplate, clubSlug }: {
  name: string; onName: (v: string) => void
  showFriendly: boolean; onShowFriendly: (v: boolean) => void
  friendlyName: string; onFriendlyName: (v: string) => void
  start: 'template' | 'scratch'; onStart: (v: 'template' | 'scratch') => void
  templates: Template[]; selectedTemplateId: string | null
  onSelectTemplate: (id: string | null) => void; clubSlug: string
}) {
  const c = useContext(ThemeCtx)
  return (
    <>
      <Band label="Name" subLine="Required to publish">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <TextInput
            value={name}
            onChange={onName}
            placeholder="e.g. August 2026"
            hint="How it appears to admins and members in the competition list."
          />
          {!showFriendly && (
            <button
              onClick={() => onShowFriendly(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: c.link, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Add a member-friendly name <span style={{ fontSize: 10 }}>▾</span>
            </button>
          )}
          {showFriendly && (
            <TextInput
              value={friendlyName}
              onChange={onFriendlyName}
              placeholder="Member-friendly name (optional)"
              hint="Shown on the calendar and in member-facing views."
            />
          )}
        </div>
      </Band>

      <Band label="Starting point" subLine="Sets the next three steps">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <OptionCard
              selected={start === 'template'}
              onClick={() => onStart('template')}
              title="Use a template"
              desc="Prefills entries, judging and recognition."
            />
            <OptionCard
              selected={start === 'scratch'}
              onClick={() => onStart('scratch')}
              title="Start from scratch"
              desc="Every setting falls back to your club defaults."
            />
          </div>
          {start === 'template' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Sel
                value={selectedTemplateId ?? ''}
                onChange={id => onSelectTemplate(id || null)}
                options={templates.map(t => ({ value: t.id, label: t.name }))}
                placeholder={templates.length === 0 ? 'No templates yet' : undefined}
                width={280}
              />
              <a href={`/${clubSlug}/admin/competitions/templates`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12.5, color: c.link, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Manage templates ↗
              </a>
            </div>
          )}
        </div>
      </Band>
    </>
  )
}

// ─── Step 2 — Entries & submissions ───────────────────────────────────────────

function Step2({ config, onChange, clubCategories, includedCats, onIncludedCats,
  baseline, start }: {
  config: CompetitionConfig; onChange: (p: Partial<CompetitionConfig>) => void
  clubCategories: string[]; includedCats: string[]; onIncludedCats: (cats: string[]) => void
  baseline: CompetitionConfig; start: 'template' | 'scratch'
}) {
  const c = useContext(ThemeCtx)
  const provText   = start === 'template' ? 'From template' : 'Club default'
  const customText = 'Changed for this competition'

  const perMemberCustom = differs(config.maxEntriesPerMember, baseline.maxEntriesPerMember)
  const perCatCustom    = differs(config.maxEntriesPerCategory, baseline.maxEntriesPerCategory)
  const reuseCustom     = differs(config.imageReusePolicy, baseline.imageReusePolicy)
  const withdrawCustom  = differs(config.allowWithdrawals, baseline.allowWithdrawals)

  const toggleCat = (cat: string) => {
    const next = includedCats.includes(cat)
      ? includedCats.filter(cc => cc !== cat)
      : [...includedCats, cat]
    onIncludedCats(next)
  }

  return (
    <>
      <Band label="Categories" subLine={`${includedCats.length} in this competition`}>
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {clubCategories.map(cat => {
              const included = includedCats.includes(cat)
              return (
                <button
                  key={cat}
                  onClick={() => toggleCat(cat)}
                  style={{
                    fontSize: 13.5, borderRadius: 7, padding: '6px 11px', cursor: 'pointer',
                    fontFamily: 'inherit', border: 'none',
                    color: included ? c.textOnChip : c.textMuted,
                    background: included ? c.accentChipBg : 'transparent',
                    outline: included ? `1px solid ${c.accentChipBorder}` : `1px solid ${c.catBtnUnselBorder}`,
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>
          <div style={{ marginTop: 10, fontSize: 12.5, color: c.textLabel }}>
            Tap a category to include or exclude it for this competition.
          </div>
        </div>
      </Band>

      <Band label="Entry limits" subLine="How much a member may submit">
        <Rows>
          <Row label="Entries per member" desc="Total images one member may submit to this competition.">
            <Stepper value={config.maxEntriesPerMember} min={1}
              onChange={v => onChange({ maxEntriesPerMember: v })} />
            <ProvChip isCustom={perMemberCustom}
              resetTo={String(baseline.maxEntriesPerMember)}
              onReset={() => onChange({ maxEntriesPerMember: baseline.maxEntriesPerMember })}
              chipText={provText} customText={customText} />
          </Row>
          <Row label="Entries per category"
            desc="Cap within a single category, inside the per-member total.">
            <Stepper value={config.maxEntriesPerCategory ?? 1} min={1}
              onChange={v => onChange({ maxEntriesPerCategory: v })} />
            <ProvChip isCustom={perCatCustom}
              resetTo={String(baseline.maxEntriesPerCategory ?? 1)}
              onReset={() => onChange({ maxEntriesPerCategory: baseline.maxEntriesPerCategory })}
              chipText={provText} customText={customText} />
          </Row>
        </Rows>
      </Band>

      <Band label="Files & eligibility" subLine="What counts as a valid entry">
        <Rows>
          <Row label="Long edge maximum" desc="1920 px matches standard HD projector resolution.">
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: c.inputBg, border: `1px solid ${c.inputBorder}`,
              borderRadius: 9, padding: '7px 12px',
            }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary }}>1920</span>
              <span style={{ fontSize: 13, color: c.textLabel }}>px</span>
            </div>
            <ProvChip isCustom={false} resetTo="" onReset={() => {}} chipText="Club default" customText={customText} />
          </Row>
          <Row label="Re-entering an image" desc={
            config.imageReusePolicy === 'once-ever'       ? 'An image can only be entered once, ever.' :
            config.imageReusePolicy === 'once-per-season' ? 'An image can only be entered once per season.' :
            config.imageReusePolicy === 'unrestricted'    ? 'Images may be re-entered freely.' :
            'An image can only be entered into a competition once per type.'
          }>
            <Sel value={config.imageReusePolicy}
              onChange={v => onChange({ imageReusePolicy: v as ImageReusePolicy })}
              options={REUSE_OPTIONS} width={190} />
            <ProvChip isCustom={reuseCustom}
              resetTo={baseline.imageReusePolicy}
              onReset={() => onChange({ imageReusePolicy: baseline.imageReusePolicy })}
              chipText={provText} customText={customText} />
          </Row>
          <TogRow
            label="Allow withdrawals"
            on={config.allowWithdrawals}
            onChange={v => onChange({ allowWithdrawals: v })}
            onDesc="members can pull their entry back before submissions close."
            offDesc="entries are final once submitted."
          />
          {withdrawCustom && (
            <div style={{ paddingTop: 6 }}>
              <ProvChip isCustom={withdrawCustom}
                resetTo={baseline.allowWithdrawals ? 'on' : 'off'}
                onReset={() => onChange({ allowWithdrawals: baseline.allowWithdrawals })}
                chipText={provText} customText={customText} />
            </div>
          )}
        </Rows>
      </Band>
    </>
  )
}

// ─── Step 3 — Judging & scoring ───────────────────────────────────────────────

function Step3({ config, onChange, baseline, start }: {
  config: CompetitionConfig; onChange: (p: Partial<CompetitionConfig>) => void
  baseline: CompetitionConfig; start: 'template' | 'scratch'
}) {
  const c = useContext(ThemeCtx)
  const provText   = start === 'template' ? 'From template' : 'Club default'
  const customText = 'Changed for this competition'
  const preset = config.judgingPreset
  const showScoring = preset !== 'member-vote' && preset !== 'end-of-year' && preset !== 'awards-only'
  const selectedPreset = PRESET_OPTIONS.find(p => p.value === preset) ?? PRESET_OPTIONS[0]

  const scoreCustom     = differs([config.scoreMin, config.scoreMax], [baseline.scoreMin, baseline.scoreMax])
  const namesCustom     = differs(config.blindHideName, baseline.blindHideName)
  const commentsCustom  = differs(config.judgeComments, baseline.judgeComments)
  const minScoreCustom  = differs(config.minimumScoreToPublish, baseline.minimumScoreToPublish)

  const minScoreOptions = Array.from({ length: config.scoreMax - 1 }, (_, i) => ({
    value: String(i + 2),
    label: `${i + 2} of ${config.scoreMax}`,
  }))

  return (
    <>
      <Band label="Judging preset" subLine="Sets the scoring model">
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ width: 190, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {PRESET_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => {
                onChange({ judgingPreset: opt.value, ...PRESET_DEFAULTS[opt.value] })
              }} style={{
                textAlign: 'left', padding: '9px 12px', borderRadius: 8,
                fontSize: 14, fontFamily: 'inherit', cursor: 'pointer',
                fontWeight: opt.value === preset ? 600 : 400,
                color: opt.value === preset ? c.textPrimary : c.textSecondary,
                background: opt.value === preset ? c.accentChipBg : 'transparent',
                border: opt.value === preset ? `1px solid ${c.accentChipBorder}` : '1px solid transparent',
              }}>{opt.label}</button>
            ))}
          </div>
          <div style={{ flex: 1, background: c.sunken, border: `1px solid ${c.rule}`, borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: c.textPrimary }}>{selectedPreset.label}</div>
            <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6, color: c.textMuted, maxWidth: '56ch' }}>{selectedPreset.desc}</div>
            <div style={{ marginTop: 12, fontSize: 12.5, color: c.textLabel }}>{selectedPreset.best}</div>
          </div>
        </div>
      </Band>

      {showScoring && (
        <Band label="Judging panel" subLine="Who scores the entries">
          <Rows>
            <Row label="Number of judges"
              desc={config.numberOfJudges === 1
                ? 'One judge scores all images independently.'
                : `${config.numberOfJudges} judges score images independently.`}>
              <Sel value={String(config.numberOfJudges)}
                onChange={v => onChange({ numberOfJudges: Number(v) })}
                options={JUDGE_COUNT_OPTIONS} width={150} />
            </Row>
          </Rows>
        </Band>
      )}

      {showScoring && (
        <Band label="Judge experience" subLine="What judges see and enter">
          <Rows>
            <Row label="Score range"
              desc={`Judges score each entry from ${config.scoreMin} to ${config.scoreMax}.`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  background: c.inputBg, border: `1px solid ${c.inputBorder}`,
                  borderRadius: 9, padding: '7px 12px',
                }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary }}>1</span>
                </div>
                <span style={{ fontSize: 13, color: c.textLabel }}>to</span>
                <Stepper value={config.scoreMax} min={2}
                  onChange={v => {
                    const clamped = Math.min(config.minimumScoreToPublishValue || v, v)
                    onChange({ scoreMax: v, minimumScoreToPublishValue: clamped })
                  }} />
              </div>
              <ProvChip isCustom={scoreCustom}
                resetTo={`1–${baseline.scoreMax}`}
                onReset={() => onChange({ scoreMin: baseline.scoreMin, scoreMax: baseline.scoreMax })}
                chipText={provText} customText={customText} />
            </Row>

            <div>
              <TogRow
                label="Hide member names during judging"
                on={config.blindHideName}
                onChange={v => onChange({ blindHideName: v })}
                onDesc="images are identified by number only."
                offDesc="judges see the member's name with each image."
              />
              {namesCustom && (
                <div style={{ marginTop: 6 }}>
                  <ProvChip isCustom={namesCustom}
                    resetTo={baseline.blindHideName ? 'on' : 'off'}
                    onReset={() => onChange({ blindHideName: baseline.blindHideName })}
                    chipText={provText} customText={customText} />
                </div>
              )}
            </div>

            <Row label="Written feedback from judges"
              desc={config.judgeComments === 'none' ? 'Judges are not asked to write comments.' :
                config.judgeComments === 'optional' ? 'Judges may add written feedback if they wish.' :
                'Judges must write feedback for each image.'}>
              <Sel value={config.judgeComments}
                onChange={v => onChange({ judgeComments: v as JudgeCommentsSetting })}
                options={COMMENT_OPTIONS} width={150} />
              <ProvChip isCustom={commentsCustom}
                resetTo={baseline.judgeComments}
                onReset={() => onChange({ judgeComments: baseline.judgeComments })}
                chipText={provText} customText={customText} />
            </Row>

            <div>
              <TogRow
                label="Minimum score to publish results"
                on={config.minimumScoreToPublish}
                onChange={v => onChange({ minimumScoreToPublish: v })}
                onDesc="only entries at or above a set score are published."
                offDesc="all entries appear in the published results regardless of their score."
              >
                {config.minimumScoreToPublish && (
                  <ChildRow>
                    <div style={{ fontSize: 14, fontWeight: 500, color: c.textBody }}>Minimum score</div>
                    <div style={{ marginTop: 3, fontSize: 12.5, color: c.textMuted }}>
                      Entries scoring below {config.minimumScoreToPublishValue || 2} are left out of the published results.
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <Sel
                        value={String(config.minimumScoreToPublishValue || 2)}
                        onChange={v => onChange({ minimumScoreToPublishValue: Number(v) })}
                        options={minScoreOptions} width={130}
                      />
                    </div>
                  </ChildRow>
                )}
              </TogRow>
              {minScoreCustom && (
                <div style={{ marginTop: 6 }}>
                  <ProvChip isCustom={minScoreCustom}
                    resetTo={baseline.minimumScoreToPublish ? 'on' : 'off'}
                    onReset={() => onChange({ minimumScoreToPublish: baseline.minimumScoreToPublish, minimumScoreToPublishValue: baseline.minimumScoreToPublishValue })}
                    chipText={provText} customText={customText} />
                </div>
              )}
            </div>
          </Rows>
        </Band>
      )}
    </>
  )
}

// ─── Step 4 — Recognition ─────────────────────────────────────────────────────

function Step4({ config, onChange, baseline, start }: {
  config: CompetitionConfig; onChange: (p: Partial<CompetitionConfig>) => void
  baseline: CompetitionConfig; start: 'template' | 'scratch'
}) {
  const provText   = start === 'template' ? 'From template' : 'Default for new competitions'
  const customText = 'Changed for this competition'

  const benchCustom = differs(config.benchmarkEnabled, baseline.benchmarkEnabled)
  const poyCustom   = differs(config.countTowardPOY, baseline.countTowardPOY)

  const preset = config.judgingPreset
  const showStandings = preset === 'simple-scored' || preset === 'salon'

  return (
    <>
      <Band label="Awards" subLine="Named placings">
        <TogRow
          label="Give awards for this competition"
          on={config.awardsEnabled}
          onChange={v => onChange({ awardsEnabled: v })}
          onDesc="judges name placings alongside the scores."
          offDesc="images are scored and ranked only, with no placings named."
        />
      </Band>

      {showStandings && (
        <Band label="Standings" subLine="How this competition affects current-season rankings">
          <Rows>
            <div>
              <TogRow
                label="Benchmark classification"
                on={config.benchmarkEnabled}
                onChange={v => onChange({ benchmarkEnabled: v })}
                onDesc="images are classified against your club's bands, and member profiles update when results publish."
                offDesc="scores from this competition are not classified against your club's bands."
                labelExtra={<InlineChip label={provText} />}
              >
                {config.benchmarkEnabled && benchmarkBands.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {benchmarkBands.map(b => <BandChip key={b} label={b} />)}
                  </div>
                )}
              </TogRow>
              {benchCustom && (
                <div style={{ marginTop: 8 }}>
                  <ProvChip isCustom={benchCustom}
                    resetTo={baseline.benchmarkEnabled ? 'on' : 'off'}
                    onReset={() => onChange({ benchmarkEnabled: baseline.benchmarkEnabled })}
                    chipText={provText} customText={customText} />
                </div>
              )}
            </div>
            <div>
              <TogRow
                label="Photographer of the Year"
                on={config.countTowardPOY}
                onChange={v => onChange({ countTowardPOY: v })}
                onDesc="every score counts toward the current season standings; rankings recalculate for all members when results publish."
                offDesc="scores from this competition do not count toward the season standings."
                labelExtra={<InlineChip label={provText} />}
              />
              {poyCustom && (
                <div style={{ marginTop: 8 }}>
                  <ProvChip isCustom={poyCustom}
                    resetTo={baseline.countTowardPOY ? 'on' : 'off'}
                    onReset={() => onChange({ countTowardPOY: baseline.countTowardPOY })}
                    chipText={provText} customText={customText} />
                </div>
              )}
            </div>
          </Rows>
        </Band>
      )}
    </>
  )
}

// ─── Step 5 — Review ──────────────────────────────────────────────────────────

function ReviewLine({ primary, secondary }: { primary?: string; secondary?: string }) {
  const c = useContext(ThemeCtx)
  return (
    <div>
      {primary && <div style={{ fontSize: 14.5, color: c.textBody }}>{primary}</div>}
      {secondary && <div style={{ fontSize: 13, color: c.textMuted, marginTop: 2 }}>{secondary}</div>}
    </div>
  )
}

const PRESET_LABEL: Record<JudgingPreset, string> = {
  'simple-scored': 'Salon style', 'salon': 'Salon (panel)',
  'awards-only': 'Awards only', 'member-vote': 'Member vote', 'end-of-year': 'End of year',
}

type ChangeItem = { label: string; from: string; to: string }
function getChanges(config: CompetitionConfig, baseline: CompetitionConfig, includedCats: string[], baseCats: string[]): ChangeItem[] {
  const items: ChangeItem[] = []
  if (config.maxEntriesPerMember !== baseline.maxEntriesPerMember)
    items.push({ label: 'Entries per member', from: String(baseline.maxEntriesPerMember), to: String(config.maxEntriesPerMember) })
  if (config.maxEntriesPerCategory !== baseline.maxEntriesPerCategory)
    items.push({ label: 'Entries per category', from: String(baseline.maxEntriesPerCategory ?? 1), to: String(config.maxEntriesPerCategory ?? 1) })
  if (differs(includedCats.sort(), baseCats.sort()))
    items.push({ label: 'Categories', from: baseCats.join(', ') || 'none', to: includedCats.join(', ') || 'none' })
  if (config.judgingPreset !== baseline.judgingPreset)
    items.push({ label: 'Judging preset', from: PRESET_LABEL[baseline.judgingPreset], to: PRESET_LABEL[config.judgingPreset] })
  if (config.scoreMax !== baseline.scoreMax)
    items.push({ label: 'Score range', from: `1–${baseline.scoreMax}`, to: `1–${config.scoreMax}` })
  if (config.blindHideName !== baseline.blindHideName)
    items.push({ label: 'Hide member names', from: baseline.blindHideName ? 'On' : 'Off', to: config.blindHideName ? 'On' : 'Off' })
  if (config.minimumScoreToPublish !== baseline.minimumScoreToPublish)
    items.push({ label: 'Minimum score to publish', from: baseline.minimumScoreToPublish ? 'On' : 'Off', to: config.minimumScoreToPublish ? 'On' : 'Off' })
  if (config.allowWithdrawals !== baseline.allowWithdrawals)
    items.push({ label: 'Allow withdrawals', from: baseline.allowWithdrawals ? 'On' : 'Off', to: config.allowWithdrawals ? 'On' : 'Off' })
  if (config.awardsEnabled !== baseline.awardsEnabled)
    items.push({ label: 'Awards', from: baseline.awardsEnabled ? 'On' : 'Off', to: config.awardsEnabled ? 'On' : 'Off' })
  if (config.benchmarkEnabled !== baseline.benchmarkEnabled)
    items.push({ label: 'Benchmark classification', from: baseline.benchmarkEnabled ? 'On' : 'Off', to: config.benchmarkEnabled ? 'On' : 'Off' })
  if (config.countTowardPOY !== baseline.countTowardPOY)
    items.push({ label: 'Photographer of the Year', from: baseline.countTowardPOY ? 'On' : 'Off', to: config.countTowardPOY ? 'On' : 'Off' })
  return items
}

function Step5({ name, config, baseline, includedCats, baseCats, start, selectedTemplate,
  saveTpl, onSaveTpl, tplAction, onTplAction, tplName, onTplName, onStep }: {
  name: string; config: CompetitionConfig; baseline: CompetitionConfig
  includedCats: string[]; baseCats: string[]
  start: 'template' | 'scratch'; selectedTemplate: Template | null
  saveTpl: boolean; onSaveTpl: (v: boolean) => void
  tplAction: 'update' | 'new'; onTplAction: (v: 'update' | 'new') => void
  tplName: string; onTplName: (v: string) => void
  onStep: (s: number) => void
}) {
  const c = useContext(ThemeCtx)
  const changes = getChanges(config, baseline, includedCats, baseCats)
  const hasChanges = changes.length > 0
  const preset = config.judgingPreset
  const showStandings = preset === 'simple-scored' || preset === 'salon'

  const catLine = includedCats.length === 1 ? '1 category' : `${includedCats.length} categories`
  const limitsLine = `${config.maxEntriesPerMember} images total, ${config.maxEntriesPerCategory ?? 1} max per category`
  const judgingLine = `${PRESET_LABEL[preset]} · ${config.numberOfJudges} judge${config.numberOfJudges !== 1 ? 's' : ''} · scale of 1 to ${config.scoreMax}`
  const judgeExpLine = [
    config.blindHideName ? 'Member names hidden' : 'Member names visible',
    config.judgeComments === 'none' ? 'no written feedback' : `written feedback ${config.judgeComments}`,
    config.minimumScoreToPublish ? `minimum score ${config.minimumScoreToPublishValue}` : 'all entries published',
  ].join(' · ')

  const recParts: string[] = []
  if (!config.awardsEnabled && preset !== 'awards-only') recParts.push('No awards')
  if (config.awardsEnabled || preset === 'awards-only') recParts.push('Awards given')
  if (showStandings && config.benchmarkEnabled) recParts.push('Benchmark classification')
  if (showStandings && config.countTowardPOY) recParts.push('Current season POY standings')
  const recLine = recParts.join(' · ') || 'No recognition settings'

  const sourceLabel = start === 'template' && selectedTemplate
    ? `the ${selectedTemplate.name} template`
    : 'your club defaults'

  const showReuse = start === 'scratch' || (start === 'template' && hasChanges)
  const showUpdateCard = start === 'template' && hasChanges && saveTpl
  const showNameInput  = saveTpl && (start === 'scratch' || tplAction === 'new')

  const editLinkStyle: React.CSSProperties = {
    fontSize: 12.5, color: c.link, background: 'none', border: 'none',
    cursor: 'pointer', padding: 0, fontFamily: 'inherit', textDecoration: 'none',
  }

  return (
    <>
      <Band label="Entries" gutterExtra={
        <button onClick={() => onStep(2)} style={{ ...editLinkStyle, marginTop: 6 }}>Edit step 2</button>
      }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ReviewLine primary={`${catLine}: ${includedCats.join(', ') || 'none selected'}`} />
          <ReviewLine primary={limitsLine} />
        </div>
      </Band>

      <Band label="Judging" gutterExtra={
        <button onClick={() => onStep(3)} style={{ ...editLinkStyle, marginTop: 6 }}>Edit step 3</button>
      }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ReviewLine primary={judgingLine} />
          <ReviewLine primary={judgeExpLine} />
        </div>
      </Band>

      <Band label="Recognition" gutterExtra={
        <button onClick={() => onStep(4)} style={{ ...editLinkStyle, marginTop: 6 }}>Edit step 4</button>
      }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ReviewLine primary={recLine} />
          {showStandings && (config.benchmarkEnabled || config.countTowardPOY) && (
            <ReviewLine secondary={
              start === 'template' && !differs(config.benchmarkEnabled, baseline.benchmarkEnabled) && !differs(config.countTowardPOY, baseline.countTowardPOY)
                ? `Carried over from ${selectedTemplate?.name ?? 'the template'}.`
                : start === 'scratch' ? 'Standard for new competitions.' : 'Adjusted for this competition.'
            } />
          )}
        </div>
      </Band>

      {hasChanges && (
        <Band label="Changes" subLine={`${changes.length} setting${changes.length !== 1 ? 's' : ''} differ`}>
          <div>
            <div style={{ fontSize: 13, color: c.textMuted, maxWidth: '64ch', marginBottom: 12 }}>
              Compared with {sourceLabel} this competition was built from.
            </div>
            <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${c.rule}` }}>
              {changes.map((ch, i) => (
                <div key={i} style={{
                  background: c.sunken, padding: '11px 16px',
                  borderTop: i > 0 ? `1px solid ${c.ruleSoft}` : 'none',
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'baseline',
                }}>
                  <span style={{ fontSize: 13.5, color: c.textBody }}>{ch.label}</span>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 13, color: c.dimDesc, textDecoration: 'line-through' }}>{ch.from}</span>
                    <span style={{ fontSize: 11, color: c.textLabel }}>→</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: c.changeHighlight }}>{ch.to}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Band>
      )}

      {showReuse && (
        <Band label="Reuse" subLine="Optional">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TogRow
              label={start === 'template' ? 'Keep these changes for next time' : 'Save these settings as a template'}
              on={saveTpl}
              onChange={onSaveTpl}
              onDesc={start === 'template' ? "you'll choose whether to update the template or save a new one." : 'this configuration is saved so you can reuse it next time.'}
              offDesc="these settings apply to this competition only."
            />
            {showUpdateCard && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <OptionCard
                  selected={tplAction === 'update'}
                  onClick={() => onTplAction('update')}
                  title="Update the template"
                  desc={`Applies these ${changes.length} change${changes.length !== 1 ? 's' : ''} to ${selectedTemplate?.name ?? 'the template'}.`}
                />
                <OptionCard
                  selected={tplAction === 'new'}
                  onClick={() => onTplAction('new')}
                  title="Save as a new template"
                  desc="Leaves the original untouched."
                />
              </div>
            )}
            {showNameInput && (
              <TextInput
                value={tplName}
                onChange={onTplName}
                placeholder={start === 'template' ? 'New template name' : 'Template name — e.g. Monthly Scored Competition'}
                maxWidth={420}
              />
            )}
          </div>
        </Band>
      )}
    </>
  )
}

// ─── Step 6 — Schedule ────────────────────────────────────────────────────────

const AUDIENCE_OPTIONS = [
  { value: 'members-only',    label: 'Members only'               },
  { value: 'public',          label: 'Public'                     },
  { value: 'members-first',   label: 'Members first, then public' },
]

const SCORE_PUBLISH_OPTIONS = [
  { value: 'event-end',     label: 'When the event ends'  },
  { value: 'judging-close', label: 'After judging closes' },
  { value: 'specific-time', label: 'At a specific time'   },
]

function Step6({ subOpen, onSubOpen, subClose, onSubClose, jugOpen, onJugOpen, jugClose, onJugClose,
  judgeIds, onJudgeIds, meeting, onMeeting, eventDate, onEventDate, eventTime, onEventTime,
  eventVenue, onEventVenue, meetingLocations, audience, onAudience,
  scorePublishTiming, onScorePublishTiming, members, numberOfJudges }: {
  subOpen: string; onSubOpen: (v: string) => void
  subClose: string; onSubClose: (v: string) => void
  jugOpen: string; onJugOpen: (v: string) => void
  jugClose: string; onJugClose: (v: string) => void
  judgeIds: string[]; onJudgeIds: (ids: string[]) => void
  meeting: boolean; onMeeting: (v: boolean) => void
  eventDate: string; onEventDate: (v: string) => void
  eventTime: string; onEventTime: (v: string) => void
  eventVenue: string; onEventVenue: (v: string) => void
  meetingLocations: string[]; audience: string; onAudience: (v: string) => void
  scorePublishTiming: string; onScorePublishTiming: (v: string) => void
  members: { id: string; name: string }[]
  numberOfJudges: number
}) {
  const c = useContext(ThemeCtx)
  const setJudgeAt = (i: number, id: string) => {
    const next = [...judgeIds]
    next[i] = id
    onJudgeIds(next)
  }
  const assignedIds = judgeIds.filter(Boolean)
  const venueOptions = meetingLocations.map(v => ({ value: v, label: v }))

  const daysBetween = (a: string, b: string) => {
    if (!a || !b) return 0
    return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))
  }
  const subDays = daysBetween(subOpen, subClose)
  const jugDays = daysBetween(jugOpen, jugClose)

  const scorePublishHint = (() => {
    if (scorePublishTiming === 'event-end' && eventDate && eventTime)
      return `${fmtDate(eventDate)}, after ${fmtTime(eventTime)}`
    if (scorePublishTiming === 'judging-close' && jugClose)
      return `After ${fmtDate(jugClose)}`
    return ''
  })()

  return (
    <>
      <Band label="Submissions" subLine="Shown on the club calendar">
        <Rows>
          <Row label="Submission window" desc="When members can upload. Visible on the calendar once the competition is published.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <DateInput value={subOpen} onChange={onSubOpen} />
              <span style={{ fontSize: 13, color: c.textLabel }}>→</span>
              <DateInput value={subClose} onChange={onSubClose} />
            </div>
            {subDays > 0 && <div style={{ fontSize: 11.5, color: c.textLabel }}>{subDays} days open</div>}
          </Row>
        </Rows>
      </Band>

      <Band label="Judging" subLine="Internal — not shown to members">
        <Rows>
          {Array.from({ length: Math.max(1, numberOfJudges) }).map((_, i) => {
            const available = members.filter(m => m.id === judgeIds[i] || !assignedIds.includes(m.id))
            return (
              <Row key={i} label={numberOfJudges > 1 ? `Judge ${i + 1}` : 'Judge'}
                desc="Can be assigned later — required before the judging window opens.">
                <Sel
                  value={judgeIds[i] ?? ''}
                  onChange={id => setJudgeAt(i, id)}
                  options={available.map(m => ({ value: m.id, label: m.name }))}
                  placeholder="Select a judge…"
                  width={200}
                />
              </Row>
            )
          })}
          <Row label="Judging window" desc="Starts after submissions close; these dates stay internal.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <DateInput value={jugOpen} onChange={onJugOpen} />
              <span style={{ fontSize: 13, color: c.textLabel }}>→</span>
              <DateInput value={jugClose} onChange={onJugClose} />
            </div>
            {jugDays > 0 && <div style={{ fontSize: 11.5, color: c.textLabel }}>{jugDays} days to judge</div>}
          </Row>
        </Rows>
      </Band>

      <Band label="Results" subLine="How and when they go out">
        <Rows>
          <TogRow
            label="Announce at a meeting or event"
            on={meeting}
            onChange={onMeeting}
            onDesc="results are revealed at a set time and place, then published."
            offDesc="there is no reveal event — results publish on their own."
          >
            {meeting && (
              <ChildRow>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: c.textBody }}>Event date &amp; time</div>
                    <div style={{ marginTop: 3, fontSize: 12.5, color: c.textMuted }}>Members see this on the club calendar.</div>
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <DateInput value={eventDate} onChange={onEventDate} />
                      <input
                        type="time"
                        value={eventTime}
                        onChange={e => onEventTime(e.target.value)}
                        style={{
                          background: c.inputBg, border: `1px solid ${c.inputBorder}`,
                          borderRadius: 9, padding: '8px 12px', fontSize: 14, width: 120,
                          color: eventTime ? c.textBody : c.textLabel, fontFamily: 'inherit',
                        }}
                      />
                    </div>
                  </div>
                  {venueOptions.length > 0 && (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: c.textBody }}>Event location</div>
                      <div style={{ marginTop: 3, fontSize: 12.5, color: c.textMuted }}>Where the results are announced.</div>
                      <div style={{ marginTop: 10 }}>
                        <Sel value={eventVenue} onChange={onEventVenue}
                          options={venueOptions} placeholder="Select a venue…" width={220} />
                      </div>
                    </div>
                  )}
                </div>
              </ChildRow>
            )}
          </TogRow>

          <Row
            label="Scores are published"
            desc={meeting
              ? 'Scores appear on the website and in member profiles once the event is over.'
              : 'Scores appear on the website and in member profiles at this time.'}
          >
            {meeting ? (
              <>
                <Sel
                  value={scorePublishTiming}
                  onChange={onScorePublishTiming}
                  options={SCORE_PUBLISH_OPTIONS}
                  width={220}
                />
                {scorePublishHint && (
                  <div style={{ fontSize: 12.5, color: c.textLabel }}>{scorePublishHint}</div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DateInput value={eventDate} onChange={onEventDate} />
                <input
                  type="time"
                  value={eventTime}
                  onChange={e => onEventTime(e.target.value)}
                  style={{
                    background: c.inputBg, border: `1px solid ${c.inputBorder}`,
                    borderRadius: 9, padding: '8px 12px', fontSize: 14, width: 120,
                    color: eventTime ? c.textBody : c.textLabel, fontFamily: 'inherit',
                  }}
                />
              </div>
            )}
          </Row>

          <Row label="Who can see results" desc="Signed-in members only — results are not public.">
            <Sel value={audience} onChange={onAudience} options={AUDIENCE_OPTIONS} width={220} />
            <ProvChip isCustom={false} chipText="Club default" resetTo="" onReset={() => {}} />
          </Row>
        </Rows>
      </Band>

      {(subOpen || jugOpen) && (
        <div style={{ padding: '0 32px 26px' }}>
          <div style={{
            background: c.sunken, border: `1px solid ${c.rule}`,
            borderRadius: 10, padding: '18px 22px 20px',
          }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: c.textLabel, marginBottom: 16 }}>
              Timeline
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `${Math.max(subDays, 1)}fr 2fr ${Math.max(jugDays, 1)}fr auto`,
              alignItems: 'end', columnGap: 0,
            }}>
              <div style={{ paddingRight: 10 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: c.textOnChip }}>Open for entries</div>
                <div style={{ marginTop: 3, fontSize: 12.5, color: c.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
                  {subOpen && subClose ? `${fmtDate(subOpen)} – ${fmtDate(subClose)}${subDays > 0 ? ` · ${subDays} days` : ''}` : '—'}
                </div>
                <div style={{ marginTop: 8, height: 8, borderRadius: 4, background: c.accent, border: `1px solid ${c.accentBorder}` }} />
              </div>
              <div style={{ padding: '0 4px', textAlign: 'center' }}>
                <div style={{ fontSize: 12.5, color: c.textFaint, marginBottom: 3 }}>
                  {jugOpen && subClose ? `${daysBetween(subClose, jugOpen)} d` : ''}
                </div>
                <div style={{ height: 8, borderTop: `1px dashed ${c.borderSubtle}`, borderBottom: `1px dashed ${c.borderSubtle}` }} />
              </div>
              <div style={{ padding: '0 10px' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: c.textOnChip }}>Judging</div>
                <div style={{ marginTop: 3, fontSize: 12.5, color: c.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
                  {jugOpen && jugClose ? `${fmtDate(jugOpen)} – ${fmtDate(jugClose)}${jugDays > 0 ? ` · ${jugDays} days` : ''}` : '—'}
                </div>
                <div style={{ marginTop: 8, height: 8, borderRadius: 4, background: c.stepDone, border: `1px solid ${c.stepDoneBorder}` }} />
              </div>
              <div style={{ minWidth: 112, textAlign: 'center', paddingLeft: 10 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: c.textPrimary }}>
                  {meeting ? 'Announced' : 'Published'}
                </div>
                <div style={{ marginTop: 3, fontSize: 12.5, color: c.textSecondary }}>
                  {meeting && eventDate ? `${fmtDate(eventDate)}, ${fmtTime(eventTime)}` : '—'}
                </div>
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: c.stepCurrent, boxShadow: c.stepCurrentGlow,
                  }} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 18, fontSize: 12.5, color: c.textLabel, lineHeight: 1.5 }}>
              {meeting
                ? 'Members see the submission window and the event on the club calendar; judging dates stay internal.'
                : 'Members see the submission window on the club calendar; judging dates stay internal.'}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CreateCompetitionWizard({
  open, onClose, templates, members, meetingLocations,
  clubCategories = [], clubDefaults = {}, clubSlug,
}: {
  open:             boolean
  onClose:          () => void
  templates:        Template[]
  members:          { id: string; name: string }[]
  meetingLocations: string[]
  clubCategories?:  string[]
  clubDefaults?:    Partial<CompetitionConfig>
  clubSlug:         string
}) {
  const router = useRouter()
  const [saving, startSaving] = useTransition()
  const isDark = useDarkMode()
  const C = isDark ? C_DARK : C_LIGHT

  // ── Step ──
  const [step, setStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  // ── Step 1: Basics ──
  const [name,          setName]          = useState('')
  const [showFriendly,  setShowFriendly]  = useState(false)
  const [friendlyName,  setFriendlyName]  = useState('')
  const [start, setStart]                 = useState<'template' | 'scratch'>(templates.length > 0 ? 'template' : 'scratch')
  const [selectedTplId, setSelectedTplId] = useState<string | null>(templates[0]?.id ?? null)

  // ── Config + baseline (steps 2–4) ──
  const baseClub: CompetitionConfig = { ...defaultConfig, ...clubDefaults }
  const [config,   setConfig]   = useState<CompetitionConfig>(() => {
    const tpl = templates.find(t => t.id === templates[0]?.id)
    return tpl ? { ...baseClub, ...tpl.config } : baseClub
  })
  const [baseline,  setBaseline]  = useState<CompetitionConfig>(() => {
    const tpl = templates.find(t => t.id === templates[0]?.id)
    return tpl ? { ...baseClub, ...tpl.config } : baseClub
  })
  const [includedCats, setIncludedCats] = useState<string[]>(
    () => templates[0]?.config.categories ?? clubCategories
  )
  const [baseCats, setBaseCats] = useState<string[]>(
    () => templates[0]?.config.categories ?? clubCategories
  )

  // ── Step 6: Schedule ──
  const [subOpen,            setSubOpen]            = useState('')
  const [subClose,           setSubClose]           = useState('')
  const [jugOpen,            setJugOpen]            = useState('')
  const [jugClose,           setJugClose]           = useState('')
  const [judgeIds,           setJudgeIds]           = useState<string[]>([])
  const [meeting,            setMeeting]            = useState(true)
  const [eventDate,          setEventDate]          = useState('')
  const [eventTime,          setEventTime]          = useState('19:00')
  const [eventVenue,         setEventVenue]         = useState('')
  const [audience,           setAudience]           = useState('members-only')
  const [scorePublishTiming, setScorePublishTiming] = useState('event-end')

  const handleSubOpenChange = (date: string) => {
    setSubOpen(date)
    if (date) {
      const sc = addDays(date, 14)
      setSubClose(sc)
      const jo = addDays(sc, 2)
      setJugOpen(jo)
      setJugClose(addDays(jo, 14))
    }
  }

  // ── Step 5: Reuse ──
  const [saveTpl,    setSaveTpl]    = useState(true)
  const [tplAction,  setTplAction]  = useState<'update' | 'new'>('new')
  const [tplName,    setTplName]    = useState('')

  // ── Errors ──
  const [nameError, setNameError] = useState('')

  const onChange = (partial: Partial<CompetitionConfig>) =>
    setConfig(prev => ({ ...prev, ...partial }))

  const handleSelectTemplate = (id: string | null) => {
    setSelectedTplId(id)
    if (id) {
      const tpl = templates.find(t => t.id === id)
      if (tpl) {
        const seeded = { ...baseClub, ...tpl.config }
        setConfig(seeded)
        setBaseline({ ...seeded })
        setIncludedCats(tpl.config.categories ?? clubCategories)
        setBaseCats(tpl.config.categories ?? clubCategories)
      }
    }
  }

  const handleStart = (newStart: 'template' | 'scratch') => {
    setStart(newStart)
    if (newStart === 'scratch') {
      setConfig(baseClub)
      setBaseline({ ...baseClub })
      setIncludedCats([...clubCategories])
      setBaseCats([...clubCategories])
      setSelectedTplId(null)
    } else {
      const id = selectedTplId ?? templates[0]?.id ?? null
      handleSelectTemplate(id)
    }
  }

  const handleClose = () => {
    setStep(1); setCompletedSteps([])
    setName(''); setShowFriendly(false); setFriendlyName('')
    setStart(templates.length > 0 ? 'template' : 'scratch')
    const firstTpl = templates[0]
    setSelectedTplId(firstTpl?.id ?? null)
    const seeded = firstTpl ? { ...baseClub, ...firstTpl.config } : baseClub
    setConfig(seeded); setBaseline({ ...seeded })
    setIncludedCats(firstTpl?.config.categories ?? clubCategories)
    setBaseCats(firstTpl?.config.categories ?? clubCategories)
    setSubOpen(''); setSubClose(''); setJugOpen(''); setJugClose('')
    setJudgeIds([]); setMeeting(true)
    setEventDate(''); setEventTime('19:00'); setEventVenue(''); setAudience('members-only')
    setScorePublishTiming('event-end')
    setSaveTpl(true); setTplAction('new'); setTplName('')
    setNameError('')
    onClose()
  }

  const goTo = (s: number) => {
    if (completedSteps.includes(s) || s === step || s <= step + 1) setStep(s)
  }

  const goNext = () => {
    if (step === 1 && !name.trim()) { setNameError('Competition name is required'); return }
    setNameError('')
    setCompletedSteps(prev => prev.includes(step) ? prev : [...prev, step])
    setStep(s => Math.min(s + 1, 6))
  }

  const handleSave = (status: 'draft' | 'open') => {
    if (!name.trim()) { setStep(1); setNameError('Competition name is required'); return }
    startSaving(async () => {
      try {
        const schedulePayload: CompetitionSchedule = {
          ...defaultSchedule,
          instanceName:         name.trim(),
          calendarTitle:        friendlyName.trim(),
          submissionsOpenDate:  subOpen,
          submissionsCloseDate: subClose,
          judgingOpenDate:      jugOpen,
          judgingCloseDate:     jugClose,
          judgeIds:             judgeIds.filter(Boolean),
          resultsRevealMode:    meeting ? 'meeting' : 'auto-publish',
          eventDate:            meeting ? eventDate : '',
          eventTime:            meeting ? eventTime : '19:00',
          eventLocationVenue:   meeting ? eventVenue : '',
          publicVisibility:     audience === 'public' ? 'public-same-time'
                              : audience === 'members-first' ? 'members-first' : 'members-only',
        }
        const configPayload: CompetitionConfig = {
          ...config,
          categories: includedCats,
          competitionType: 'digital',
        }
        await createCompetitionFromSchedule({ config: configPayload, schedule: schedulePayload, competitionType: 'digital', status })

        if (saveTpl && tplName.trim()) {
          try { await saveTemplate(tplName.trim(), configPayload) } catch { /* best-effort */ }
        }

        handleClose()
        router.refresh()
      } catch (err) {
        console.error('createCompetition failed:', err)
      }
    })
  }

  const selectedTemplate = templates.find(t => t.id === selectedTplId) ?? null
  const STEPS = 6

  const stepTitle = ['Basics', 'Entries & submissions', 'Judging & scoring', 'Recognition', 'Review', 'Schedule'][step - 1]
  const stepBlurb = [
    'Name this competition and pick where its settings come from.',
    'What members may enter, and what counts as a valid image.',
    'How entries are scored, and what the judges see.',
    'What this competition feeds once results are published.',
    'Check the setup before you set dates.',
    'Set the dates, the judge, and how results reach members.',
  ][step - 1]

  // ── Footer strip computed from current step ────────────────────────────────────────────
  const footerForStep = (() => {
    if (step === 2) {
      const perMemberCustom = differs(config.maxEntriesPerMember, baseline.maxEntriesPerMember)
      const perCatCustom    = differs(config.maxEntriesPerCategory, baseline.maxEntriesPerCategory)
      const reuseCustom     = differs(config.imageReusePolicy, baseline.imageReusePolicy)
      const withdrawCustom  = differs(config.allowWithdrawals, baseline.allowWithdrawals)
      const count = [!perMemberCustom, !perCatCustom, !reuseCustom, !withdrawCustom].filter(Boolean).length
      return {
        note: `${count} of 4 values on this step come from your ${start === 'template' ? 'template' : 'club defaults'}. Editing one here affects this competition only.`,
        linkHref: `/${clubSlug}/admin/competitions/competition-defaults`,
      }
    }
    if (step === 3) {
      const preset3 = config.judgingPreset
      const showScoring3 = preset3 !== 'member-vote' && preset3 !== 'end-of-year' && preset3 !== 'awards-only'
      const scoreCustom    = differs([config.scoreMin, config.scoreMax], [baseline.scoreMin, baseline.scoreMax])
      const namesCustom    = differs(config.blindHideName, baseline.blindHideName)
      const commentsCustom = differs(config.judgeComments, baseline.judgeComments)
      const minScoreCustom = differs(config.minimumScoreToPublish, baseline.minimumScoreToPublish)
      const count = [!scoreCustom && showScoring3, !namesCustom && showScoring3, !commentsCustom && showScoring3, !minScoreCustom && showScoring3].filter(Boolean).length
      const total = showScoring3 ? 4 : 0
      return {
        note: total > 0
          ? `${count} of ${total} values on this step come from your ${start === 'template' ? 'template' : 'club defaults'}. Editing one here affects this competition only.`
          : 'Judging panel settings apply to this competition only.',
        linkHref: `/${clubSlug}/admin/competitions/competition-defaults`,
      }
    }
    if (step === 4) {
      return {
        note: 'Benchmark and POY settings are configured per-competition in Recognition & Standings.',
        linkText: 'Manage recognition settings',
        linkHref: `/${clubSlug}/admin/competitions/recognition`,
      }
    }
    if (step === 6) {
      return {
        note: 'Who can see results comes from your club defaults; dates are set per competition.',
        linkHref: `/${clubSlug}/admin/competitions/competition-defaults`,
      }
    }
    return null
  })()

  return (
    <ThemeCtx.Provider value={C}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={false}
        slotProps={{
          backdrop: { sx: { bgcolor: 'rgba(10,14,19,0.82)' } },
          paper: {
            sx: {
              bgcolor: C.surface,
              border: `1px solid ${C.rule}`,
              borderRadius: '14px',
              boxShadow: '0 24px 60px rgba(0,0,0,.35)',
              maxWidth: 1040,
              width: 'calc(100vw - 64px)',
              height: '90vh',
              maxHeight: '90vh',
              m: 'auto',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            },
          },
        }}
      >
        {/* Header */}
        <div style={{ padding: '26px 32px 22px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: C.textEyebrow }}>
              New competition
            </span>
            <span style={{ fontSize: 12, color: C.textEyebrow }}>Step {step} of {STEPS}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 27, fontWeight: 600, letterSpacing: '-.015em', color: C.textPrimary }}>
            {stepTitle}
          </div>
          <div style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.6, color: C.textMuted, maxWidth: '66ch' }}>
            {stepBlurb}
          </div>
          <BarStepper step={step} onStep={goTo} />
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {step === 1 && (
            <Step1
              name={name} onName={v => { setName(v); if (v.trim()) setNameError('') }}
              showFriendly={showFriendly} onShowFriendly={setShowFriendly}
              friendlyName={friendlyName} onFriendlyName={setFriendlyName}
              start={start} onStart={handleStart}
              templates={templates} selectedTemplateId={selectedTplId} onSelectTemplate={handleSelectTemplate}
              clubSlug={clubSlug}
            />
          )}
          {step === 2 && (
            <Step2
              config={config} onChange={onChange}
              clubCategories={clubCategories} includedCats={includedCats} onIncludedCats={setIncludedCats}
              baseline={baseline} start={start}
            />
          )}
          {step === 3 && (
            <Step3
              config={config} onChange={onChange}
              baseline={baseline} start={start}
            />
          )}
          {step === 4 && (
            <Step4
              config={config} onChange={onChange}
              baseline={baseline} start={start}
            />
          )}
          {step === 5 && (
            <Step5
              name={name} config={config} baseline={baseline}
              includedCats={includedCats} baseCats={baseCats}
              start={start} selectedTemplate={selectedTemplate}
              saveTpl={saveTpl} onSaveTpl={setSaveTpl}
              tplAction={tplAction} onTplAction={setTplAction}
              tplName={tplName} onTplName={setTplName}
              onStep={goTo}
            />
          )}
          {step === 6 && (
            <Step6
              subOpen={subOpen} onSubOpen={handleSubOpenChange}
              subClose={subClose} onSubClose={setSubClose}
              jugOpen={jugOpen} onJugOpen={setJugOpen}
              jugClose={jugClose} onJugClose={setJugClose}
              judgeIds={judgeIds} onJudgeIds={setJudgeIds}
              meeting={meeting} onMeeting={setMeeting}
              eventDate={eventDate} onEventDate={setEventDate}
              eventTime={eventTime} onEventTime={setEventTime}
              eventVenue={eventVenue} onEventVenue={setEventVenue}
              meetingLocations={meetingLocations}
              audience={audience} onAudience={setAudience}
              scorePublishTiming={scorePublishTiming} onScorePublishTiming={setScorePublishTiming}
              members={members} numberOfJudges={config.numberOfJudges}
            />
          )}

          {step === 1 && nameError && (
            <div style={{ padding: '0 32px 16px', fontSize: 13, color: C.error }}>{nameError}</div>
          )}
        </div>

        {/* Defaults footer — pinned above button bar */}
        {footerForStep && (
          <DefFooter
            note={footerForStep.note}
            linkText={'linkText' in footerForStep ? (footerForStep as { linkText: string }).linkText : undefined}
            linkHref={footerForStep.linkHref}
          />
        )}

        {/* Button bar */}
        <div style={{
          borderTop: `1px solid ${C.rule}`, padding: '18px 32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <button
            onClick={() => setStep(s => Math.max(s - 1, 1))}
            disabled={step === 1}
            style={{
              fontSize: 14, borderRadius: 9, padding: '10px 20px', fontFamily: 'inherit',
              cursor: step === 1 ? 'default' : 'pointer',
              background: 'transparent',
              border: step === 1 ? `1px solid ${C.borderSubtle}` : `1px solid ${C.border}`,
              color: step === 1 ? C.textFaint : C.textSecondary,
            }}
          >
            Back
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleClose}
              style={{
                fontSize: 14, borderRadius: 9, padding: '10px 20px', fontFamily: 'inherit',
                cursor: 'pointer', background: 'transparent',
                border: `1px solid ${C.border}`, color: C.textSecondary,
              }}
            >
              Cancel
            </button>

            {step < 6 && (
              <button
                onClick={goNext}
                style={{
                  fontSize: 14, fontWeight: 600, borderRadius: 9, padding: '10px 22px',
                  fontFamily: 'inherit', cursor: 'pointer',
                  background: C.accent, border: `1px solid ${C.accentBorder}`, color: '#fff',
                }}
              >
                {step === 5 ? 'Continue to schedule' : 'Continue'}
              </button>
            )}

            {step === 6 && (
              <>
                <button
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  style={{
                    fontSize: 14, borderRadius: 9, padding: '10px 20px', fontFamily: 'inherit',
                    cursor: saving ? 'default' : 'pointer', background: 'transparent',
                    border: `1px solid ${C.border}`, color: C.textSecondary,
                  }}
                >
                  {saving ? 'Saving…' : 'Save as draft'}
                </button>
                <button
                  onClick={() => handleSave('open')}
                  disabled={saving}
                  style={{
                    fontSize: 14, fontWeight: 600, borderRadius: 9, padding: '10px 22px',
                    fontFamily: 'inherit', cursor: saving ? 'default' : 'pointer',
                    background: C.accent, border: `1px solid ${C.accentBorder}`, color: '#fff',
                  }}
                >
                  {saving ? 'Publishing…' : 'Publish competition'}
                </button>
              </>
            )}
          </div>
        </div>
      </Dialog>
    </ThemeCtx.Provider>
  )
}

'use client'

import { useState, useTransition } from 'react'
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

// ─── Design tokens (identical to CreateTemplateWizard) ────────────────────────

const C = {
  surface:         '#16202F',
  sunken:          '#111B28',
  inputBg:         '#101A27',
  accent:          '#3F7FC4',
  accentBorder:    '#4D8FD6',
  accentChipBg:    '#24405E',
  accentChipBorder:'rgba(122,175,235,.35)',
  stepCurrent:     '#5B9BD5',
  stepDone:        '#2F6394',
  stepPending:     'rgba(255,255,255,.09)',
  link:            '#6AA9E9',
  linkHover:       '#8FC2F5',
  textPrimary:     '#F1F5FA',
  textBody:        '#E6EDF6',
  textOnChip:      '#DBE6F2',
  textSecondary:   '#A9BACD',
  textMuted:       '#8B9CB0',
  textLabel:       '#7D90A6',
  textFaint:       '#63748A',
  textEyebrow:     '#6B7D92',
  custom:          '#D8B23C',
  customBorder:    'rgba(216,178,60,.35)',
  rule:            'rgba(255,255,255,.07)',
  ruleSoft:        'rgba(255,255,255,.055)',
  bandChipBg:      '#111B28',
  // Toggle-off dimming
  dimLabel:        '#8394A8',
  dimDesc:         '#6B7C90',
}

const switchSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: '#fff' },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: C.accent, opacity: 1,
  },
}

function differs(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) !== JSON.stringify(b)
}

// ─── Primitives ───────────────────────────────────────────────────────────────

/** Below-control provenance chip. chipText = what to show when not custom. */
function ProvChip({ isCustom, resetTo, onReset, chipText = 'Club default', customText = 'Custom' }: {
  isCustom: boolean; resetTo: string; onReset: () => void
  chipText?: string; customText?: string
}) {
  const chip: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontSize: 11.5, letterSpacing: '.03em', borderRadius: 5,
    padding: '2px 7px', border: `1px solid ${isCustom ? C.customBorder : 'rgba(255,255,255,.1)'}`,
    color: isCustom ? C.custom : C.textLabel,
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={chip}>{isCustom ? customText : chipText}</span>
      {isCustom && (
        <button onClick={onReset} style={{
          fontSize: 11.5, color: C.link, background: 'none', border: 'none',
          cursor: 'pointer', padding: 0,
        }}>
          Reset to {resetTo}
        </button>
      )}
    </div>
  )
}

/** Inline label chip (provenance, not custom) */
function InlineChip({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 11, letterSpacing: '.03em', borderRadius: 5, whiteSpace: 'nowrap',
      padding: '2px 7px', border: '1px solid rgba(255,255,255,.1)', color: C.textLabel,
    }}>
      {label}
    </span>
  )
}

/** Read-only band chip — dims when dim=true */
function BandChip({ label, dim }: { label: string; dim?: boolean }) {
  return (
    <span style={{
      fontSize: 12.5, background: C.bandChipBg,
      border: `1px solid ${C.rule}`, borderRadius: 6,
      padding: '5px 10px', color: dim ? C.dimDesc : C.textSecondary,
    }}>
      {label}
    </span>
  )
}

/** Toggle row with state-first copy and label/desc dimming when off */
function TogRow({ label, on, onChange, onDesc, offDesc, narrow, labelExtra, children }: {
  label: string; on: boolean; onChange: (v: boolean) => void
  onDesc: string; offDesc: string; narrow?: boolean
  labelExtra?: React.ReactNode; children?: React.ReactNode
}) {
  const lc = on ? C.textBody : C.dimLabel
  const dc = on ? C.textMuted : C.dimDesc
  const desc = (on ? 'On — ' : 'Off — ') + (on ? onDesc : offDesc)
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontSize: 14.5, fontWeight: 500, color: lc }}>{label}</span>
            {labelExtra}
          </div>
          <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, color: dc, maxWidth: '56ch' }}>{desc}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 2 }}>
          <Switch size="small" sx={switchSx} checked={on} onChange={e => onChange(e.target.checked)} />
        </div>
      </div>
      {children}
    </div>
  )
}

/** Indented child row — shown when a parent toggle is on */
function ChildRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginTop: 12, marginLeft: 18, paddingLeft: 22,
      borderLeft: '2px solid rgba(122,175,235,.3)',
    }}>
      {children}
    </div>
  )
}

/** Number stepper */
function Stepper({ value, min, max, onChange }: {
  value: number; min: number; max?: number; onChange: (v: number) => void
}) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)
  const btn: React.CSSProperties = {
    width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent',
    color: C.textSecondary, fontSize: 16, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  }
  return (
    <div style={{
      display: 'flex', gap: 3, alignItems: 'center', padding: 3,
      background: C.inputBg, border: '1px solid rgba(255,255,255,.1)', borderRadius: 9,
    }}>
      <button style={btn} onClick={dec}>−</button>
      <span style={{ minWidth: 36, textAlign: 'center', fontSize: 15, fontWeight: 600, color: C.textPrimary }}>{value}</span>
      <button style={btn} onClick={inc}>+</button>
    </div>
  )
}

/** Styled native select */
function Sel({ value, onChange, options, width, placeholder }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
  width?: number; placeholder?: string
}) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width: width ?? 'auto' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none', background: C.inputBg, border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 9, padding: '8px 32px 8px 12px', fontSize: 14, color: value ? C.textBody : C.textLabel,
          cursor: 'pointer', width: '100%', minWidth: width ?? 150, fontFamily: 'inherit',
        }}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 10, pointerEvents: 'none', fontSize: 10, color: C.textLabel }}>▾</span>
    </div>
  )
}

/** Text input styled to match selects */
function TextInput({ value, onChange, placeholder, maxWidth, error, hint }: {
  value: string; onChange: (v: string) => void; placeholder?: string
  maxWidth?: number; error?: string; hint?: string
}) {
  return (
    <div style={{ maxWidth: maxWidth ?? 420 }}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: C.inputBg, border: `1px solid ${error ? '#D32F2F' : 'rgba(122,175,235,.45)'}`,
          borderRadius: 9, padding: '11px 14px', fontSize: 15,
          color: C.textPrimary, fontFamily: 'inherit',
          outline: 'none',
        }}
      />
      {hint && !error && <div style={{ marginTop: 6, fontSize: 12.5, color: C.textMuted }}>{hint}</div>}
      {error && <div style={{ marginTop: 6, fontSize: 12.5, color: '#D32F2F' }}>{error}</div>}
    </div>
  )
}

/** Date input */
function DateInput({ value, onChange, label }: {
  value: string; onChange: (v: string) => void; label?: string
}) {
  return (
    <div>
      {label && <div style={{ fontSize: 12.5, color: C.textLabel, marginBottom: 6 }}>{label}</div>}
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: C.inputBg, border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 9, padding: '8px 12px', fontSize: 14,
          color: value ? C.textBody : C.textLabel,
          fontFamily: 'inherit', cursor: 'pointer',
        }}
      />
    </div>
  )
}

/** Radio option card */
function OptionCard({ selected, onClick, title, desc, unavailable, badge }: {
  selected: boolean; onClick: () => void; title: string; desc: string
  unavailable?: boolean; badge?: string
}) {
  return (
    <button
      onClick={unavailable ? undefined : onClick}
      disabled={unavailable}
      style={{
        textAlign: 'left', width: '100%', borderRadius: 10, padding: '14px 16px',
        background: selected ? C.accentChipBg : C.sunken,
        border: `1.5px solid ${selected ? C.stepCurrent : 'rgba(255,255,255,.09)'}`,
        boxShadow: selected ? '0 0 0 1px rgba(91,155,213,.25)' : 'none',
        opacity: unavailable ? 0.55 : 1,
        cursor: unavailable ? 'default' : 'pointer',
        transition: 'border-color .12s',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
          border: `1.5px solid ${selected ? C.stepCurrent : 'rgba(255,255,255,.22)'}`,
          background: selected ? C.stepCurrent : 'transparent',
          boxShadow: selected ? `inset 0 0 0 3.5px ${C.surface}` : 'none',
        }} />
        <span style={{ fontSize: 14.5, fontWeight: 600, color: C.textPrimary }}>{title}</span>
        {badge && (
          <span style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 5,
            border: '1px solid rgba(255,255,255,.1)', color: C.textLabel,
          }}>{badge}</span>
        )}
      </div>
      <div style={{ marginTop: 7, paddingLeft: 27, fontSize: 13, lineHeight: 1.5, color: C.textMuted }}>{desc}</div>
    </button>
  )
}

/** 6-step bar stepper */
const STEP_LABELS = ['Basics', 'Entries', 'Judging', 'Recognition', 'Review', 'Schedule']
function BarStepper({ step, onStep }: { step: number; onStep: (s: number) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginTop: 22 }}>
      {STEP_LABELS.map((label, i) => {
        const n = i + 1
        const done    = n < step
        const current = n === step
        const barColor = done ? C.stepDone : current ? C.stepCurrent : C.stepPending
        const lblColor = current ? C.textPrimary : done ? C.textSecondary : C.textEyebrow
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

/** Section band */
function Band({ label, subLine, children, gutterExtra }: {
  label: string; subLine?: string; children: React.ReactNode; gutterExtra?: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', gap: 32, padding: '24px 32px 26px',
      borderTop: `1px solid ${C.rule}`,
    }}>
      <div style={{ width: 176, flexShrink: 0, paddingTop: 2 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: C.textLabel }}>
          {label}
        </div>
        {subLine && <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.5, color: C.textFaint }}>{subLine}</div>}
        {gutterExtra}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

/** Row container — adds soft rules between children */
function Rows({ children }: { children: React.ReactNode }) {
  const items = (Array.isArray(children) ? (children as unknown[]).flat() : [children]).filter(Boolean)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {items.map((child, i) => (
        <div key={i} style={{ paddingTop: i > 0 ? 16 : 0, borderTop: i > 0 ? `1px solid ${C.ruleSoft}` : 'none' }}>
          {child as React.ReactNode}
        </div>
      ))}
    </div>
  )
}

/** Two-column row: label+desc left, control right */
function Row({ label, desc, children, narrow, labelExtra }: {
  label: string; desc?: string; children?: React.ReactNode
  narrow?: boolean; labelExtra?: React.ReactNode
}) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: narrow ? '1fr 120px' : '1fr 260px',
      gap: 24, alignItems: 'start',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14.5, fontWeight: 500, color: C.textBody }}>
          <span>{label}</span>{labelExtra}
        </div>
        {desc && <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, color: C.textMuted, maxWidth: '52ch' }}>{desc}</div>}
      </div>
      {children && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 7 }}>
          {children}
        </div>
      )}
    </div>
  )
}

/** Defaults footer strip */
function DefFooter({ note, clubSlug, linkText, linkHref }: {
  note: React.ReactNode; clubSlug: string; linkText?: string; linkHref?: string
}) {
  return (
    <div style={{
      background: C.sunken, borderTop: `1px solid ${C.rule}`,
      padding: '14px 32px', display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', flexShrink: 0,
    }}>
      <span style={{ fontSize: 12.5, color: C.textMuted }}>{note}</span>
      <a href={linkHref ?? `/${clubSlug}/admin/competitions/competition-defaults`}
        target="_blank" rel="noopener noreferrer"
        style={{ fontSize: 12.5, color: C.link, textDecoration: 'none', whiteSpace: 'nowrap' }}>
        {linkText ?? 'Manage club defaults'} ↗
      </a>
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

const CAPTURE_DATE_OPTIONS = [
  { value: 'none',    label: 'Not required' },
  { value: '1-years', label: 'Within 1 year' },
  { value: '2-years', label: 'Within 2 years' },
  { value: '3-years', label: 'Within 3 years' },
  { value: '5-years', label: 'Within 5 years' },
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
  { value: 'member-vote',   label: 'Member vote',   desc: 'Members rank the entries themselves; votes are tallied on close.',                  best: 'Best for club choice and people\'s-choice rounds.' },
  { value: 'end-of-year',   label: 'End of year',   desc: 'Entries are drawn from the season\'s results and judged as a final round.',        best: 'Best for annual competitions and trophy nights.' },
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
  return (
    <>
      {/* ── Name ── */}
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
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.link, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
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

      {/* ── Starting point ── */}
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
                style={{ fontSize: 12.5, color: C.link, textDecoration: 'none', whiteSpace: 'nowrap' }}>
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
  baseline, start, clubSlug }: {
  config: CompetitionConfig; onChange: (p: Partial<CompetitionConfig>) => void
  clubCategories: string[]; includedCats: string[]; onIncludedCats: (cats: string[]) => void
  baseline: CompetitionConfig; start: 'template' | 'scratch'; clubSlug: string
}) {
  const provText   = start === 'template' ? 'From template' : 'Club default'
  const customText = 'Changed for this competition'

  const perMemberCustom = differs(config.maxEntriesPerMember, baseline.maxEntriesPerMember)
  const perCatCustom    = differs(config.maxEntriesPerCategory, baseline.maxEntriesPerCategory)
  const reuseCustom     = differs(config.imageReusePolicy, baseline.imageReusePolicy)
  const withdrawCustom  = differs(config.allowWithdrawals, baseline.allowWithdrawals)

  const toggleCat = (cat: string) => {
    const next = includedCats.includes(cat)
      ? includedCats.filter(c => c !== cat)
      : [...includedCats, cat]
    onIncludedCats(next)
  }

  const defaultsOnStep = [!perMemberCustom, !perCatCustom, !reuseCustom, !withdrawCustom].filter(Boolean).length
  const footerNote = `${defaultsOnStep} of 4 values on this step come from your ${start === 'template' ? 'template' : 'club defaults'}. Editing one here affects this competition only.`

  return (
    <>
      {/* ── Categories ── */}
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
                    color: included ? C.textOnChip : C.textMuted,
                    background: included ? C.accentChipBg : 'transparent',
                    outline: included ? `1px solid ${C.accentChipBorder}` : '1px solid rgba(255,255,255,.1)',
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>
          <div style={{ marginTop: 10, fontSize: 12.5, color: C.textLabel }}>
            Tap a category to include or exclude it for this competition.
          </div>
        </div>
      </Band>

      {/* ── Entry limits ── */}
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

      {/* ── Files & eligibility ── */}
      <Band label="Files & eligibility" subLine="What counts as a valid entry">
        <Rows>
          <Row label="Long edge maximum" desc="1920 px matches standard HD projector resolution.">
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: C.inputBg, border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 9, padding: '7px 12px',
            }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary }}>1920</span>
              <span style={{ fontSize: 13, color: C.textLabel }}>px</span>
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

      <DefFooter note={footerNote} clubSlug={clubSlug} />
    </>
  )
}

// ─── Step 3 — Judging & scoring ───────────────────────────────────────────────

function Step3({ config, onChange, baseline, start, clubSlug }: {
  config: CompetitionConfig; onChange: (p: Partial<CompetitionConfig>) => void
  baseline: CompetitionConfig; start: 'template' | 'scratch'; clubSlug: string
}) {
  const provText   = start === 'template' ? 'From template' : 'Club default'
  const customText = 'Changed for this competition'
  const preset = config.judgingPreset
  const showScoring = preset !== 'member-vote' && preset !== 'end-of-year' && preset !== 'awards-only'
  const selectedPreset = PRESET_OPTIONS.find(p => p.value === preset) ?? PRESET_OPTIONS[0]

  const scoreCustom     = differs([config.scoreMin, config.scoreMax], [baseline.scoreMin, baseline.scoreMax])
  const namesCustom     = differs(config.blindHideName, baseline.blindHideName)
  const commentsCustom  = differs(config.judgeComments, baseline.judgeComments)
  const minScoreCustom  = differs(config.minimumScoreToPublish, baseline.minimumScoreToPublish)

  const defaultsOnStep = [
    !scoreCustom && showScoring, !namesCustom && showScoring,
    !commentsCustom && showScoring, !minScoreCustom && showScoring,
  ].filter(Boolean).length
  const totalOnStep = showScoring ? 4 : 0
  const footerNote = totalOnStep > 0
    ? `${defaultsOnStep} of ${totalOnStep} values on this step come from your ${start === 'template' ? 'template' : 'club defaults'}. Editing one here affects this competition only.`
    : 'Judging panel settings apply to this competition only.'

  const minScoreOptions = Array.from({ length: config.scoreMax - 1 }, (_, i) => ({
    value: String(i + 2),
    label: `${i + 2} of ${config.scoreMax}`,
  }))

  return (
    <>
      {/* ── Judging preset ── */}
      <Band label="Judging preset" subLine="Sets the scoring model">
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Preset list */}
          <div style={{ width: 190, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {PRESET_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => {
                onChange({ judgingPreset: opt.value, ...PRESET_DEFAULTS[opt.value] })
              }} style={{
                textAlign: 'left', padding: '9px 12px', borderRadius: 8,
                fontSize: 14, fontFamily: 'inherit', cursor: 'pointer',
                fontWeight: opt.value === preset ? 600 : 400,
                color: opt.value === preset ? C.textPrimary : C.textSecondary,
                background: opt.value === preset ? C.accentChipBg : 'transparent',
                border: opt.value === preset ? `1px solid ${C.accentChipBorder}` : '1px solid transparent',
              }}>{opt.label}</button>
            ))}
          </div>
          {/* Detail panel */}
          <div style={{ flex: 1, background: C.sunken, border: `1px solid ${C.rule}`, borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: C.textPrimary }}>{selectedPreset.label}</div>
            <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6, color: C.textMuted, maxWidth: '56ch' }}>{selectedPreset.desc}</div>
            <div style={{ marginTop: 12, fontSize: 12.5, color: C.textLabel }}>{selectedPreset.best}</div>
          </div>
        </div>
      </Band>

      {/* ── Judging panel ── */}
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

      {/* ── Judge experience ── */}
      {showScoring && (
        <Band label="Judge experience" subLine="What judges see and enter">
          <Rows>
            <Row label="Score range"
              desc={`Judges score each entry from ${config.scoreMin} to ${config.scoreMax}.`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  background: C.inputBg, border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 9, padding: '7px 12px',
                }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary }}>1</span>
                </div>
                <span style={{ fontSize: 13, color: C.textLabel }}>to</span>
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

            <TogRow
              label="Hide member names during judging"
              on={config.blindHideName}
              onChange={v => onChange({ blindHideName: v })}
              onDesc="images are identified by number only."
              offDesc="judges see the member's name with each image."
            />
            {namesCustom && (
              <div style={{ paddingTop: 6 }}>
                <ProvChip isCustom={namesCustom}
                  resetTo={baseline.blindHideName ? 'on' : 'off'}
                  onReset={() => onChange({ blindHideName: baseline.blindHideName })}
                  chipText={provText} customText={customText} />
              </div>
            )}

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

            <TogRow
              label="Minimum score to publish results"
              on={config.minimumScoreToPublish}
              onChange={v => onChange({ minimumScoreToPublish: v })}
              onDesc="only entries at or above a set score are published."
              offDesc="all entries appear in the published results regardless of their score."
            >
              {config.minimumScoreToPublish && (
                <ChildRow>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.textBody }}>Minimum score</div>
                  <div style={{ marginTop: 3, fontSize: 12.5, color: C.textMuted }}>
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
              <div style={{ paddingTop: 6 }}>
                <ProvChip isCustom={minScoreCustom}
                  resetTo={baseline.minimumScoreToPublish ? 'on' : 'off'}
                  onReset={() => onChange({ minimumScoreToPublish: baseline.minimumScoreToPublish, minimumScoreToPublishValue: baseline.minimumScoreToPublishValue })}
                  chipText={provText} customText={customText} />
              </div>
            )}
          </Rows>
        </Band>
      )}

      <DefFooter note={footerNote} clubSlug={clubSlug} />
    </>
  )
}

// ─── Step 4 — Recognition ─────────────────────────────────────────────────────

function Step4({ config, onChange, baseline, start, clubSlug }: {
  config: CompetitionConfig; onChange: (p: Partial<CompetitionConfig>) => void
  baseline: CompetitionConfig; start: 'template' | 'scratch'; clubSlug: string
}) {
  const provText   = start === 'template' ? 'From template' : 'Default for new competitions'
  const customText = 'Changed for this competition'

  const benchCustom = differs(config.benchmarkEnabled, baseline.benchmarkEnabled)
  const poyCustom   = differs(config.countTowardPOY, baseline.countTowardPOY)

  const preset = config.judgingPreset
  const showStandings = preset === 'simple-scored' || preset === 'salon'

  return (
    <>
      {/* ── Awards ── */}
      <Band label="Awards" subLine="Named placings">
        <TogRow
          label="Give awards for this competition"
          on={config.awardsEnabled}
          onChange={v => onChange({ awardsEnabled: v })}
          onDesc="judges name placings alongside the scores."
          offDesc="images are scored and ranked only, with no placings named."
        />
      </Band>

      {/* ── Standings ── */}
      {showStandings && (
        <Band label="Standings" subLine="How this competition affects current-season rankings">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '20px 24px' }}>
            {/* Benchmark */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 14.5, fontWeight: 500, color: config.benchmarkEnabled ? C.textBody : C.dimLabel }}>
                  Benchmark classification
                </span>
                <InlineChip label={provText} />
              </div>
              <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, color: config.benchmarkEnabled ? C.textMuted : C.dimDesc, maxWidth: '56ch' }}>
                {config.benchmarkEnabled
                  ? 'On — images are classified against your club\'s bands, and member profiles update when results publish.'
                  : 'Off — scores from this competition are not classified against your club\'s bands.'}
              </div>
              {config.benchmarkEnabled && benchmarkBands.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {benchmarkBands.map(b => <BandChip key={b} label={b} dim={!config.benchmarkEnabled} />)}
                </div>
              )}
              {benchCustom && (
                <div style={{ marginTop: 8 }}>
                  <ProvChip isCustom={benchCustom}
                    resetTo={baseline.benchmarkEnabled ? 'on' : 'off'}
                    onReset={() => onChange({ benchmarkEnabled: baseline.benchmarkEnabled })}
                    chipText={provText} customText={customText} />
                </div>
              )}
            </div>
            <div style={{ paddingTop: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Switch size="small" sx={switchSx} checked={config.benchmarkEnabled}
                onChange={e => onChange({ benchmarkEnabled: e.target.checked })} />
            </div>

            {/* POY */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 14.5, fontWeight: 500, color: config.countTowardPOY ? C.textBody : C.dimLabel }}>
                  Photographer of the Year
                </span>
                <InlineChip label={provText} />
              </div>
              <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, color: config.countTowardPOY ? C.textMuted : C.dimDesc, maxWidth: '56ch' }}>
                {config.countTowardPOY
                  ? 'On — every score counts toward the current season standings; rankings recalculate for all members when results publish.'
                  : 'Off — scores from this competition do not count toward the season standings.'}
              </div>
              {poyCustom && (
                <div style={{ marginTop: 8 }}>
                  <ProvChip isCustom={poyCustom}
                    resetTo={baseline.countTowardPOY ? 'on' : 'off'}
                    onReset={() => onChange({ countTowardPOY: baseline.countTowardPOY })}
                    chipText={provText} customText={customText} />
                </div>
              )}
            </div>
            <div style={{ paddingTop: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Switch size="small" sx={switchSx} checked={config.countTowardPOY}
                onChange={e => onChange({ countTowardPOY: e.target.checked })} />
            </div>
          </div>
        </Band>
      )}

      <DefFooter
        note="Benchmark and POY settings are configured per-competition in Recognition & Standings."
        clubSlug={clubSlug}
        linkText="Manage recognition settings"
        linkHref={`/${clubSlug}/admin/competitions/recognition`}
      />
    </>
  )
}

// ─── Step 5 — Review ──────────────────────────────────────────────────────────

function ReviewLine({ primary, secondary }: { primary?: string; secondary?: string }) {
  return (
    <div>
      {primary && <div style={{ fontSize: 14.5, color: C.textBody }}>{primary}</div>}
      {secondary && <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>{secondary}</div>}
    </div>
  )
}

const linkStyle = (): React.CSSProperties => ({
  fontSize: 12.5, color: C.link, background: 'none', border: 'none',
  cursor: 'pointer', padding: 0, fontFamily: 'inherit', textDecoration: 'none',
})

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

  return (
    <>
      {/* ── Entries ── */}
      <Band label="Entries" gutterExtra={
        <button onClick={() => onStep(2)} style={{ ...linkStyle(), marginTop: 6 }}>Edit step 2</button>
      }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ReviewLine primary={`${catLine}: ${includedCats.join(', ') || 'none selected'}`} />
          <ReviewLine primary={limitsLine} />
        </div>
      </Band>

      {/* ── Judging ── */}
      <Band label="Judging" gutterExtra={
        <button onClick={() => onStep(3)} style={{ ...linkStyle(), marginTop: 6 }}>Edit step 3</button>
      }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ReviewLine primary={judgingLine} />
          <ReviewLine primary={judgeExpLine} />
        </div>
      </Band>

      {/* ── Recognition ── */}
      <Band label="Recognition" gutterExtra={
        <button onClick={() => onStep(4)} style={{ ...linkStyle(), marginTop: 6 }}>Edit step 4</button>
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

      {/* ── Changes ── */}
      {hasChanges && (
        <Band label="Changes" subLine={`${changes.length} setting${changes.length !== 1 ? 's' : ''} differ`}>
          <div>
            <div style={{ fontSize: 13, color: C.textMuted, maxWidth: '64ch', marginBottom: 12 }}>
              Compared with {sourceLabel} this competition was built from.
            </div>
            <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.rule}` }}>
              {changes.map((c, i) => (
                <div key={i} style={{
                  background: C.sunken, padding: '11px 16px',
                  borderTop: i > 0 ? `1px solid ${C.ruleSoft}` : 'none',
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'baseline',
                }}>
                  <span style={{ fontSize: 13.5, color: C.textBody }}>{c.label}</span>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 13, color: C.dimDesc, textDecoration: 'line-through' }}>{c.from}</span>
                    <span style={{ fontSize: 11, color: C.textLabel }}>→</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#F4D98A' }}>{c.to}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Band>
      )}

      {/* ── Reuse ── */}
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
  { value: 'members-only',    label: 'Members only'            },
  { value: 'public',          label: 'Public'                  },
  { value: 'members-first',   label: 'Members first, then public' },
]

function Step6({ subOpen, onSubOpen, subClose, onSubClose, jugOpen, onJugOpen, jugClose, onJugClose,
  judgeIds, onJudgeIds, meeting, onMeeting, eventDate, onEventDate, eventTime, onEventTime,
  eventVenue, onEventVenue, meetingLocations, audience, onAudience, members, numberOfJudges, clubSlug }: {
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
  members: { id: string; name: string }[]
  numberOfJudges: number; clubSlug: string
}) {
  const setJudgeAt = (i: number, id: string) => {
    const next = [...judgeIds]
    next[i] = id
    onJudgeIds(next)
  }
  const assignedIds = judgeIds.filter(Boolean)
  const venueOptions = meetingLocations.map(v => ({ value: v, label: v }))

  // Duration hints
  const daysBetween = (a: string, b: string) => {
    if (!a || !b) return 0
    return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))
  }
  const subDays = daysBetween(subOpen, subClose)
  const jugDays = daysBetween(jugOpen, jugClose)

  const footerNote = "Who can see results comes from your club defaults; dates are set per competition."

  return (
    <>
      {/* ── Submissions ── */}
      <Band label="Submissions" subLine="Shown on the club calendar">
        <Rows>
          <Row label="Submission window" desc="When members can upload. Visible on the calendar once the competition is published.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <DateInput value={subOpen} onChange={onSubOpen} />
              <span style={{ fontSize: 13, color: C.textLabel }}>→</span>
              <DateInput value={subClose} onChange={onSubClose} />
            </div>
            {subDays > 0 && <div style={{ fontSize: 11.5, color: C.textLabel }}>{subDays} days open</div>}
          </Row>
        </Rows>
      </Band>

      {/* ── Judging ── */}
      <Band label="Judging" subLine="Internal — not shown to members">
        <Rows>
          {/* Judge slots */}
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
                {!judgeIds[i] && <ProvChip isCustom chipText="" customText="Not yet assigned" resetTo="" onReset={() => {}} />}
              </Row>
            )
          })}
          <Row label="Judging window" desc="Starts after submissions close; these dates stay internal.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <DateInput value={jugOpen} onChange={onJugOpen} />
              <span style={{ fontSize: 13, color: C.textLabel }}>→</span>
              <DateInput value={jugClose} onChange={onJugClose} />
            </div>
            {jugDays > 0 && <div style={{ fontSize: 11.5, color: C.textLabel }}>{jugDays} days to judge</div>}
          </Row>
        </Rows>
      </Band>

      {/* ── Results ── */}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Row label="Event date & time" desc="Members see this on the club calendar." narrow>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <DateInput value={eventDate} onChange={onEventDate} />
                      <input type="time" value={eventTime} onChange={e => onEventTime(e.target.value)}
                        style={{
                          background: C.inputBg, border: '1px solid rgba(255,255,255,.1)',
                          borderRadius: 9, padding: '8px 12px', fontSize: 14,
                          color: eventTime ? C.textBody : C.textLabel, fontFamily: 'inherit',
                        }} />
                    </div>
                  </Row>
                  {venueOptions.length > 0 && (
                    <Row label="Event location" desc="Where the results are announced." narrow>
                      <Sel value={eventVenue} onChange={onEventVenue}
                        options={venueOptions} placeholder="Select a venue…" width={220} />
                    </Row>
                  )}
                </div>
              </ChildRow>
            )}
          </TogRow>

          <Row label="Who can see results" desc="Controls who can view scores once published.">
            <Sel value={audience} onChange={onAudience} options={AUDIENCE_OPTIONS} width={220} />
            <ProvChip isCustom={false} chipText="Club default" resetTo="" onReset={() => {}} />
          </Row>
        </Rows>
      </Band>

      <DefFooter note={footerNote} clubSlug={clubSlug} />
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
  const [subOpen,     setSubOpen]     = useState('')
  const [subClose,    setSubClose]    = useState('')
  const [jugOpen,     setJugOpen]     = useState('')
  const [jugClose,    setJugClose]    = useState('')
  const [judgeIds,    setJudgeIds]    = useState<string[]>([])
  const [meeting,     setMeeting]     = useState(true)
  const [eventDate,   setEventDate]   = useState('')
  const [eventTime,   setEventTime]   = useState('19:00')
  const [eventVenue,  setEventVenue]  = useState('')
  const [audience,    setAudience]    = useState('members-only')

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

        // Optionally save as template
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

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      slotProps={{
        backdrop: { sx: { bgcolor: 'rgba(10,14,19,0.92)' } },
        paper: {
          sx: {
            bgcolor: C.surface,
            border: `1px solid ${C.rule}`,
            borderRadius: '14px',
            boxShadow: '0 24px 60px rgba(0,0,0,.5)',
            maxWidth: 1040,
            width: 'calc(100vw - 64px)',
            maxHeight: '90vh',
            m: 'auto',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
      }}
    >
      {/* ── Header ── */}
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

      {/* ── Scrollable content ── */}
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
            baseline={baseline} start={start} clubSlug={clubSlug}
          />
        )}
        {step === 3 && (
          <Step3
            config={config} onChange={onChange}
            baseline={baseline} start={start} clubSlug={clubSlug}
          />
        )}
        {step === 4 && (
          <Step4
            config={config} onChange={onChange}
            baseline={baseline} start={start} clubSlug={clubSlug}
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
            subOpen={subOpen} onSubOpen={setSubOpen}
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
            members={members} numberOfJudges={config.numberOfJudges}
            clubSlug={clubSlug}
          />
        )}

        {/* Name error — step 1 only, no footer strip */}
        {step === 1 && nameError && (
          <div style={{ padding: '0 32px 16px', fontSize: 13, color: '#D32F2F' }}>{nameError}</div>
        )}
      </div>

      {/* ── Button bar ── */}
      <div style={{
        borderTop: `1px solid ${C.rule}`, padding: '18px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        {/* Back */}
        <button
          onClick={() => setStep(s => Math.max(s - 1, 1))}
          disabled={step === 1}
          style={{
            fontSize: 14, borderRadius: 9, padding: '10px 20px', fontFamily: 'inherit',
            cursor: step === 1 ? 'default' : 'pointer',
            background: 'transparent',
            border: step === 1 ? `1px solid rgba(255,255,255,.09)` : `1px solid rgba(255,255,255,.14)`,
            color: step === 1 ? C.textFaint : C.textSecondary,
          }}
        >
          Back
        </button>

        {/* Right group */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleClose}
            style={{
              fontSize: 14, borderRadius: 9, padding: '10px 20px', fontFamily: 'inherit',
              cursor: 'pointer', background: 'transparent',
              border: `1px solid rgba(255,255,255,.14)`, color: C.textSecondary,
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
                  border: `1px solid rgba(255,255,255,.14)`, color: C.textSecondary,
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
  )
}

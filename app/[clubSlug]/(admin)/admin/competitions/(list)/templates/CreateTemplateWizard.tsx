'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Collapse, Dialog, Switch } from '@mui/material'
import { saveTemplate } from './actions'
import { addCompetitionDefaultCategory } from '@/app/[clubSlug]/(admin)/admin/club-defaults/actions'
import {
  defaultConfig,
  CLUB_DEFAULTS,
  PRESET_DEFAULTS,
  type CompetitionConfig,
  type JudgingPreset,
  type ImageReusePolicy,
  type JudgeCommentsSetting,
} from '@/types/competition'

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  surface:       '#16202F',
  sunken:        '#111B28',
  inputBg:       '#101A27',
  accent:        '#3F7FC4',
  accentBorder:  '#4D8FD6',
  accentChipBg:  '#24405E',
  accentChipBorder: 'rgba(122,175,235,.35)',
  stepCurrent:   '#5B9BD5',
  stepDone:      '#2F6394',
  stepPending:   'rgba(255,255,255,.09)',
  link:          '#6AA9E9',
  linkHover:     '#8FC2F5',
  textPrimary:   '#F1F5FA',
  textBody:      '#E6EDF6',
  textOnChip:    '#DBE6F2',
  textSecondary: '#A9BACD',
  textMuted:     '#8B9CB0',
  textLabel:     '#7D90A6',
  textFaint:     '#63748A',
  textEyebrow:   '#6B7D92',
  custom:        '#D8B23C',
  customBorder:  'rgba(216,178,60,.35)',
  rule:          'rgba(255,255,255,.07)',
  ruleSoft:      'rgba(255,255,255,.055)',
  bandChipBg:    '#111B28',
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function differs(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) !== JSON.stringify(b)
}

function linkStyle(base = false) {
  return {
    fontSize: 12.5, color: C.link, background: 'none', border: 'none', cursor: 'pointer',
    padding: 0, fontFamily: 'inherit', textDecoration: base ? 'none' : undefined,
  } as React.CSSProperties
}

// ── Primitives ─────────────────────────────────────────────────────────────────

function ProvChip({ isCustom, resetTo, onReset }: {
  isCustom: boolean; resetTo: string; onReset: () => void
}) {
  if (!isCustom) {
    return (
      <span style={{ fontSize: 11.5, letterSpacing: '.03em', color: C.textLabel,
        border: `1px solid ${C.rule}`, borderRadius: 5, padding: '2px 7px' }}>
        Club default
      </span>
    )
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11.5, letterSpacing: '.03em', color: C.custom,
        border: `1px solid ${C.customBorder}`, borderRadius: 5, padding: '2px 7px' }}>
        Custom
      </span>
      <button onClick={onReset} style={linkStyle()}>
        Reset to {resetTo}
      </button>
    </span>
  )
}

function InlineChip({ label }: { label: string }) {
  return (
    <span style={{ fontSize: 11, letterSpacing: '.03em', color: C.textLabel,
      border: `1px solid ${C.rule}`, borderRadius: 5, padding: '2px 7px', flexShrink: 0 }}>
      {label}
    </span>
  )
}

function BandChip({ label }: { label: string }) {
  return (
    <span style={{ fontSize: 12.5, color: C.textSecondary, background: C.bandChipBg,
      border: `1px solid ${C.rule}`, borderRadius: 6, padding: '5px 10px' }}>
      {label}
    </span>
  )
}

// Switch sx — makes the MUI Switch legible on the dark card surface
const switchSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: '#fff' },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: '#3F7FC4',
    opacity: 1,
  },
}

// ── Number stepper ─────────────────────────────────────────────────────────────

function Stepper({ value, min = 1, onChange }: {
  value: number; min?: number; onChange: (v: number) => void
}) {
  const [hov, setHov] = useState<'dec' | 'inc' | null>(null)
  const btn = (dir: 'dec' | 'inc'): React.CSSProperties => ({
    width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
    background: hov === dir ? 'rgba(255,255,255,.06)' : 'transparent',
    color: hov === dir ? C.textPrimary : C.textSecondary,
    fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: C.inputBg,
      border: `1px solid rgba(255,255,255,.1)`, borderRadius: 9, padding: 3, gap: 3 }}>
      <button style={btn('dec')}
        onMouseEnter={() => setHov('dec')} onMouseLeave={() => setHov(null)}
        onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <div style={{ minWidth: 36, textAlign: 'center', fontSize: 15, fontWeight: 600,
        color: C.textPrimary, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <button style={btn('inc')}
        onMouseEnter={() => setHov('inc')} onMouseLeave={() => setHov(null)}
        onClick={() => onChange(value + 1)}>+</button>
    </div>
  )
}

// ── Select ─────────────────────────────────────────────────────────────────────

function Sel({ value, onChange, options, width = 190 }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; width?: number
}) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        appearance: 'none', WebkitAppearance: 'none', background: C.inputBg,
        border: `1px solid rgba(255,255,255,.1)`, borderRadius: 9,
        padding: '8px 28px 8px 12px', color: C.textBody, fontSize: 14,
        cursor: 'pointer', width, outline: 'none', fontFamily: 'inherit',
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 10, fontSize: 10,
        color: C.textLabel, pointerEvents: 'none' }}>▾</span>
    </div>
  )
}

// ── Bar stepper ────────────────────────────────────────────────────────────────

const STEPS = ['Entries & submissions', 'Judging & scoring', 'Recognition', 'Review & save']

function BarStepper({ step, onStep }: { step: number; onStep: (s: number) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginTop: 22 }}>
      {STEPS.map((name, i) => {
        const n       = i + 1
        const done    = n < step
        const current = n === step
        return (
          <button key={n} onClick={() => onStep(n)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
            <div style={{ height: 3, borderRadius: 2, marginBottom: 8,
              background: done ? C.stepDone : current ? C.stepCurrent : C.stepPending }} />
            <span style={{ fontSize: 12.5, fontWeight: current ? 600 : 400,
              color: current ? C.textPrimary : done ? C.textSecondary : C.textEyebrow }}>
              {name}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Layout primitives ──────────────────────────────────────────────────────────

function Band({ label, subLine, gutterExtra, children }: {
  label: string; subLine?: string; gutterExtra?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', gap: 32, padding: '24px 32px 26px',
      borderTop: `1px solid ${C.rule}` }}>
      <div style={{ width: 176, flexShrink: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase' as const,
          letterSpacing: '.1em', color: C.textLabel }}>{label}</div>
        {subLine && <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 4 }}>{subLine}</div>}
        {gutterExtra}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

function Rows({ children }: { children: React.ReactNode }) {
  const items = (Array.isArray(children) ? children.flat() : [children]).filter(Boolean)
  return (
    <div>
      {items.map((child, i) => (
        <div key={i} style={{
          paddingTop: i > 0 ? 16 : 0, paddingBottom: 16,
          borderTop: i > 0 ? `1px solid ${C.ruleSoft}` : 'none',
        }}>{child}</div>
      ))}
    </div>
  )
}

function Row({ label, desc, children, labelExtra, narrow }: {
  label: string; desc: string; children?: React.ReactNode;
  labelExtra?: React.ReactNode; narrow?: boolean
}) {
  return (
    <div style={{ display: 'grid',
      gridTemplateColumns: narrow ? '1fr 120px' : '1fr 260px',
      gap: 24, alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9,
          fontSize: 14.5, fontWeight: 500, color: C.textBody, flexWrap: 'wrap' as const }}>
          <span>{label}</span>{labelExtra}
        </div>
        <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5,
          color: C.textMuted, maxWidth: '52ch' }}>{desc}</div>
      </div>
      {children && (
        <div style={{ display: 'flex', flexDirection: 'column' as const,
          alignItems: 'flex-start', gap: 7 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function DefFooter({ note, clubSlug, linkText, linkHref }: {
  note: React.ReactNode; clubSlug: string; linkText?: string; linkHref?: string
}) {
  return (
    <div style={{ background: C.sunken, borderTop: `1px solid ${C.rule}`,
      padding: '14px 32px', display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 12.5, color: C.textMuted }}>{note}</span>
      <a href={linkHref ?? `/${clubSlug}/admin/club-defaults`} target="_blank" rel="noopener noreferrer"
        style={{ fontSize: 12.5, color: C.link, textDecoration: 'none' }}>
        {linkText ?? 'Manage club defaults'} ↗
      </a>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step 1 – Entries & submissions
// ═══════════════════════════════════════════════════════════════════════════════

const REUSE_OPTIONS = [
  { value: 'once-per-type',   label: 'Allowed in other types' },
  { value: 'once-per-season', label: 'Once per season' },
  { value: 'once-ever',       label: 'Once ever' },
  { value: 'unrestricted',    label: 'Unrestricted' },
] as const

const REUSE_LABEL: Record<ImageReusePolicy, string> = {
  'once-per-type':   'Allowed in other types',
  'once-per-season': 'Once per season',
  'once-ever':       'Once ever',
  'unrestricted':    'Unrestricted',
}

const CAPTURE_OPTIONS = [
  { value: 'none',       label: 'Not required' },
  { value: '1-years',    label: 'Last 1 year' },
  { value: '2-years',    label: 'Last 2 years' },
  { value: '3-years',    label: 'Last 3 years' },
  { value: '5-years',    label: 'Last 5 years' },
]

function captureDateKey(config: CompetitionConfig): string {
  if (!config.requireCaptureDate) return 'none'
  return `${config.captureDateAmount}-${config.captureDateUnit}`
}

function applyCaptureDateKey(key: string): Partial<CompetitionConfig> {
  if (key === 'none') return { requireCaptureDate: false }
  const [amount, unit] = key.split('-')
  return { requireCaptureDate: true, captureDateAmount: parseInt(amount), captureDateUnit: unit as 'years' | 'months' }
}

function captureDateResetLabel(): string {
  return CLUB_DEFAULTS.defaultRequireCaptureDate
    ? `Last ${CLUB_DEFAULTS.defaultCaptureDateAmount} ${CLUB_DEFAULTS.defaultCaptureDateUnit}`
    : 'Not required'
}

function captureDateIsCustom(config: CompetitionConfig): boolean {
  if (config.requireCaptureDate !== CLUB_DEFAULTS.defaultRequireCaptureDate) return true
  if (!config.requireCaptureDate) return false
  return config.captureDateAmount !== CLUB_DEFAULTS.defaultCaptureDateAmount ||
    config.captureDateUnit !== CLUB_DEFAULTS.defaultCaptureDateUnit
}

function Step1({ config, onChange, clubCategories, onAddClubCategory, clubSlug }: {
  config: CompetitionConfig
  onChange: (p: Partial<CompetitionConfig>) => void
  clubCategories: string[]
  onAddClubCategory: (name: string) => void
  clubSlug: string
}) {
  const [adding,    setAdding]    = useState(false)
  const [newCat,    setNewCat]    = useState('')
  const [saving,    startSave]    = useTransition()

  const toggleCat = (cat: string) => {
    const selected = config.categories.includes(cat)
    if (selected && config.categories.length <= 1) return
    onChange({ categories: selected
      ? config.categories.filter(c => c !== cat)
      : [...config.categories, cat] })
  }

  const doAddCat = () => {
    const cat = newCat.trim()
    if (!cat || clubCategories.includes(cat)) return
    startSave(async () => {
      const { id, error } = await addCompetitionDefaultCategory(cat)
      if (!error && id) {
        onAddClubCategory(cat)
        onChange({ categories: [...config.categories, cat] })
        setNewCat(''); setAdding(false)
      }
    })
  }

  // Provenance helpers
  const perMemberCustom = differs(config.maxEntriesPerMember,   CLUB_DEFAULTS.defaultMaxEntriesPerMember)
  const perCatCustom    = differs(config.maxEntriesPerCategory, CLUB_DEFAULTS.defaultMaxEntriesPerCategory)
  const longEdgeCustom  = differs(config.imageLongEdgePreset,   CLUB_DEFAULTS.defaultImageLongEdgePreset)
  const captureCustom   = captureDateIsCustom(config)
  const reuseCustom     = differs(config.imageReusePolicy,      CLUB_DEFAULTS.defaultImageReusePolicy)

  const defaultsOnThisStep = [!perMemberCustom, !perCatCustom, !longEdgeCustom, !captureCustom, !reuseCustom].filter(Boolean).length
  const footerNote = `${defaultsOnThisStep} of 5 values on this step come from your club defaults. Editing one here affects this template only.`

  const reusePolicyDesc =
    config.imageReusePolicy === 'once-per-type'   ? 'An image may be entered in a later competition, but not twice in the same type.' :
    config.imageReusePolicy === 'once-per-season' ? 'An image can only be entered once across all competitions this season.' :
    config.imageReusePolicy === 'once-ever'       ? 'An image can only ever be entered into a competition once.' :
                                                    'The same image can be entered into any competition multiple times.'

  const longEdgeDesc =
    config.imageLongEdgePreset === '1920' ? '1920 px matches standard HD projector resolution.' :
    config.imageLongEdgePreset === '1400' ? '1400 px matches legacy 4:3 projector resolution.' :
    config.imageLongEdgePreset === '3840' ? '3840 px matches 4K display resolution.' :
    config.imageLongEdgePreset === 'custom' ? `${config.imageLongEdgeCustom ?? '—'} px custom limit.` : ''

  return (
    <>
      {/* ── Categories ── */}
      <Band label="Categories" subLine={`${config.categories.length} in this template`}>
        <Rows>
          {/* Chip row */}
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {clubCategories.map(cat => {
                const sel = config.categories.includes(cat)
                return (
                  <button key={cat} onClick={() => toggleCat(cat)} style={{
                    padding: '6px 11px', borderRadius: 7, cursor: 'pointer', fontSize: 13.5,
                    background: sel ? C.accentChipBg : 'transparent',
                    border: sel ? `1px solid ${C.accentChipBorder}` : `1px solid rgba(255,255,255,.12)`,
                    color: sel ? C.textOnChip : C.textSecondary,
                    fontFamily: 'inherit', transition: 'all 0.1s',
                  }}>{cat}</button>
                )
              })}
              {/* Add category */}
              {adding ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    autoFocus value={newCat} onChange={e => setNewCat(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') doAddCat(); if (e.key === 'Escape') { setAdding(false); setNewCat('') }}}
                    placeholder="Category name"
                    style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${C.accentChipBorder}`,
                      background: C.inputBg, color: C.textPrimary, fontSize: 13.5, width: 160, outline: 'none', fontFamily: 'inherit' }}
                  />
                  <button onClick={doAddCat} disabled={!newCat.trim() || saving}
                    style={{ padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                      background: C.accent, color: '#fff', fontSize: 12.5, fontFamily: 'inherit' }}>
                    {saving ? '…' : 'Add'}
                  </button>
                  <button onClick={() => { setAdding(false); setNewCat('') }}
                    style={{ ...linkStyle(), fontSize: 12.5 }}>Cancel</button>
                </span>
              ) : (
                <button onClick={() => setAdding(true)} style={{
                  padding: '6px 11px', borderRadius: 7, cursor: 'pointer', fontSize: 13.5,
                  background: 'transparent', border: `1px dashed rgba(122,175,235,.4)`,
                  color: C.link, fontFamily: 'inherit',
                }}>+ Add category</button>
              )}
            </div>
          </div>
          {/* Judge separately — shown if >=2 categories */}
          <Collapse in={config.categories.length >= 2} timeout={150} unmountOnExit>
            <Row label="Judge categories separately"
              desc={config.judgeSeparateCategories
                ? 'Each category is judged on its own — results are not compared across categories.'
                : 'All categories are judged together in a single pool.'}>
              <Switch size="small" sx={switchSx} checked={config.judgeSeparateCategories}
                onChange={e => onChange({ judgeSeparateCategories: e.target.checked })} />
            </Row>
          </Collapse>
        </Rows>
      </Band>

      {/* ── Entry limits ── */}
      <Band label="Entry limits" subLine="How much a member may submit">
        <Rows>
          <Row label="Entries per member"
            desc={`Total images one member may submit to this competition.`}>
            <Stepper value={config.maxEntriesPerMember} onChange={v => onChange({ maxEntriesPerMember: v })} />
            <ProvChip isCustom={perMemberCustom} resetTo={String(CLUB_DEFAULTS.defaultMaxEntriesPerMember)}
              onReset={() => onChange({ maxEntriesPerMember: CLUB_DEFAULTS.defaultMaxEntriesPerMember })} />
          </Row>
          <Collapse in={config.categories.length > 1} timeout={150} unmountOnExit>
            <Row label="Entries per category"
              desc="Cap within a single category, inside the per-member total.">
              <Stepper value={config.maxEntriesPerCategory ?? 1}
                onChange={v => onChange({ maxEntriesPerCategory: v })} />
              <ProvChip isCustom={perCatCustom}
                resetTo={String(CLUB_DEFAULTS.defaultMaxEntriesPerCategory ?? '—')}
                onReset={() => onChange({ maxEntriesPerCategory: CLUB_DEFAULTS.defaultMaxEntriesPerCategory })} />
            </Row>
          </Collapse>
        </Rows>
      </Band>

      {/* ── Files & eligibility ── */}
      <Band label="Files & eligibility" subLine="What counts as a valid image">
        <Rows>
          <Row label="Long edge maximum" desc={longEdgeDesc || 'Maximum pixel dimension on the long side.'}>
            <Sel value={config.imageLongEdgePreset}
              onChange={v => onChange({ imageLongEdgePreset: v as CompetitionConfig['imageLongEdgePreset'], imageLongEdgeCustom: undefined })}
              options={[
                { value: '1400', label: '1400 px' },
                { value: '1920', label: '1920 px' },
                { value: '3840', label: '3840 px' },
              ]} width={140} />
            <ProvChip isCustom={longEdgeCustom}
              resetTo={`${CLUB_DEFAULTS.defaultImageLongEdgePreset} px`}
              onReset={() => onChange({ imageLongEdgePreset: CLUB_DEFAULTS.defaultImageLongEdgePreset, imageLongEdgeCustom: undefined })} />
          </Row>
          <Row label="Restrict by when image was taken"
            desc={config.requireCaptureDate
              ? `Images must have been taken within the last ${config.captureDateAmount} ${config.captureDateUnit}.`
              : 'Images of any age can be submitted.'}>
            <Sel value={captureDateKey(config)}
              onChange={v => onChange(applyCaptureDateKey(v))}
              options={CAPTURE_OPTIONS} width={160} />
            <ProvChip isCustom={captureCustom} resetTo={captureDateResetLabel()}
              onReset={() => onChange({
                requireCaptureDate: CLUB_DEFAULTS.defaultRequireCaptureDate,
                captureDateAmount:  CLUB_DEFAULTS.defaultCaptureDateAmount,
                captureDateUnit:    CLUB_DEFAULTS.defaultCaptureDateUnit,
              })} />
          </Row>
          <Row label="Re-entering an image" desc={reusePolicyDesc}>
            <Sel value={config.imageReusePolicy}
              onChange={v => onChange({ imageReusePolicy: v as ImageReusePolicy })}
              options={REUSE_OPTIONS as unknown as { value: string; label: string }[]} width={210} />
            <ProvChip isCustom={reuseCustom} resetTo={REUSE_LABEL[CLUB_DEFAULTS.defaultImageReusePolicy]}
              onReset={() => onChange({ imageReusePolicy: CLUB_DEFAULTS.defaultImageReusePolicy })} />
          </Row>
        </Rows>
      </Band>

      <DefFooter note={footerNote} clubSlug={clubSlug} />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step 2 – Judging & scoring
// ═══════════════════════════════════════════════════════════════════════════════

const PRESETS: { key: JudgingPreset; label: string; desc: string; bestFor: string }[] = [
  {
    key:     'simple-scored',
    label:   'Simple scored',
    desc:    'A judge gives each image a number; members see their score and where it ranked.',
    bestFor: 'Best for monthly salons and regular club competitions.',
  },
  {
    key:     'salon',
    label:   'Salon style',
    desc:    'Multiple judges score independently and the scores are totalled per image.',
    bestFor: 'Best for larger salons with an invited panel.',
  },
  {
    key:     'awards-only',
    label:   'Awards only',
    desc:    'No numeric scores — judges name placings and honourable mentions.',
    bestFor: 'Best for themed nights and end-of-season shows.',
  },
  {
    key:     'member-vote',
    label:   'Member vote',
    desc:    'Members rank the entries themselves; votes are tallied on close.',
    bestFor: 'Best for club choice and people\'s-choice rounds.',
  },
  {
    key:     'end-of-year',
    label:   'End of year',
    desc:    'Entries are drawn from the season\'s results and judged as a final round.',
    bestFor: 'Best for annual competitions and trophy nights.',
  },
]

const COMMENT_OPTIONS: { value: JudgeCommentsSetting; label: string }[] = [
  { value: 'none',     label: 'None' },
  { value: 'optional', label: 'Optional' },
  { value: 'required', label: 'Required' },
]

const JUDGE_COUNT_OPTIONS = [
  { value: '1', label: '1 judge' },
  { value: '2', label: '2 judges' },
  { value: '3', label: '3 judges' },
  { value: '4', label: '4 judges' },
  { value: '5', label: '5 judges' },
]

function Step2({ config, onChange, clubSlug }: {
  config: CompetitionConfig
  onChange: (p: Partial<CompetitionConfig>) => void
  clubSlug: string
}) {
  const preset = config.judgingPreset
  const selected = PRESETS.find(p => p.key === preset)!

  const selectPreset = (key: JudgingPreset) =>
    onChange({ judgingPreset: key, ...PRESET_DEFAULTS[key], customised: false })

  const scoreCustom    = differs([config.scoreMin, config.scoreMax], [CLUB_DEFAULTS.defaultScoreMin, CLUB_DEFAULTS.defaultScoreMax])
  const namesCustom    = differs(config.blindHideName, CLUB_DEFAULTS.defaultBlindHideName)
  const commentsCustom = differs(config.judgeComments, CLUB_DEFAULTS.defaultJudgeComments)
  const minScoreCustom = differs(config.minimumScoreToPublish, CLUB_DEFAULTS.defaultMinimumScoreToPublish)

  const showScoring     = preset !== 'member-vote' && preset !== 'end-of-year' && preset !== 'awards-only'
  const defaultsOnStep  = [!scoreCustom && showScoring, !namesCustom && showScoring, !commentsCustom && showScoring, !minScoreCustom && showScoring].filter(Boolean).length
  const totalOnStep     = showScoring ? 4 : 0
  const footerNote      = totalOnStep > 0
    ? `${defaultsOnStep} of ${totalOnStep} values on this step come from your club defaults. Editing one here affects this template only.`
    : 'Judging panel settings apply to this template only.'

  const hideNamesDesc = config.blindHideName
    ? 'Images are identified by number only.'
    : 'Member names are visible to judges during scoring.'

  const commentsDesc =
    config.judgeComments === 'none'     ? 'Judges are not asked to write comments.' :
    config.judgeComments === 'optional' ? 'Judges can add comments but are not required to.' :
                                          'A comment must be entered before a score can be submitted.'

  const minScoreDesc = config.minimumScoreToPublish
    ? `Entries scoring below ${config.minimumScoreToPublishValue} will be withheld from published results.`
    : 'All entries appear in the published results regardless of their score.'

  return (
    <>
      {/* ── Judging preset ── */}
      <Band label="Judging preset" subLine="Sets the scoring model">
        <div style={{ display: 'flex', gap: 0, border: `1px solid ${C.rule}`, borderRadius: 10, overflow: 'hidden' }}>
          {/* Left list */}
          <div style={{ width: 190, flexShrink: 0, borderRight: `1px solid ${C.rule}` }}>
            {PRESETS.map(p => {
              const sel = preset === p.key
              return (
                <button key={p.key} onClick={() => selectPreset(p.key)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '9px 12px', border: 'none', cursor: 'pointer',
                  background: sel ? C.accentChipBg : 'transparent',
                  borderLeft: sel ? `2px solid ${C.accentBorder}` : '2px solid transparent',
                  fontSize: 14, fontWeight: sel ? 600 : 400,
                  color: sel ? C.textPrimary : C.textSecondary,
                  fontFamily: 'inherit', transition: 'all 0.1s',
                }}>{p.label}</button>
              )
            })}
          </div>
          {/* Right detail */}
          <div style={{ flex: 1, padding: '18px 20px', background: C.sunken }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>
              {selected.label}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: C.textMuted, maxWidth: '56ch', marginBottom: 12 }}>
              {selected.desc}
            </div>
            <div style={{ fontSize: 12.5, color: C.textLabel }}>{selected.bestFor}</div>
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
              <Sel value={String(Math.min(config.numberOfJudges, 5))}
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
            {/* Score range — simple-scored only */}
            {preset === 'simple-scored' && (
              <Row label="Score range"
                desc={`Judges score each entry from ${config.scoreMin} to ${config.scoreMax}.`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" value={config.scoreMin}
                    onChange={e => onChange({ scoreMin: Number(e.target.value) })}
                    style={{ width: 56, padding: '7px 10px', background: C.inputBg,
                      border: `1px solid rgba(255,255,255,.1)`, borderRadius: 9,
                      color: C.textPrimary, fontSize: 15, fontWeight: 600, textAlign: 'center',
                      outline: 'none', fontFamily: 'inherit' }} />
                  <span style={{ fontSize: 13, color: C.textLabel }}>to</span>
                  <input type="number" value={config.scoreMax}
                    onChange={e => onChange({ scoreMax: Number(e.target.value) })}
                    style={{ width: 56, padding: '7px 10px', background: C.inputBg,
                      border: `1px solid rgba(255,255,255,.1)`, borderRadius: 9,
                      color: C.textPrimary, fontSize: 15, fontWeight: 600, textAlign: 'center',
                      outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <ProvChip isCustom={scoreCustom} resetTo={`${CLUB_DEFAULTS.defaultScoreMin} to ${CLUB_DEFAULTS.defaultScoreMax}`}
                  onReset={() => onChange({ scoreMin: CLUB_DEFAULTS.defaultScoreMin, scoreMax: CLUB_DEFAULTS.defaultScoreMax })} />
              </Row>
            )}
            <Row label="Hide member names during judging" desc={hideNamesDesc}>
              <Switch size="small" sx={switchSx} checked={config.blindHideName} onChange={e => onChange({ blindHideName: e.target.checked })} />
              <ProvChip isCustom={namesCustom} resetTo={CLUB_DEFAULTS.defaultBlindHideName ? 'on' : 'off'}
                onReset={() => onChange({ blindHideName: CLUB_DEFAULTS.defaultBlindHideName })} />
            </Row>
            <Row label="Written feedback from judges" desc={commentsDesc}>
              <Sel value={config.judgeComments}
                onChange={v => onChange({ judgeComments: v as JudgeCommentsSetting })}
                options={COMMENT_OPTIONS as { value: string; label: string }[]} width={150} />
              <ProvChip isCustom={commentsCustom} resetTo={CLUB_DEFAULTS.defaultJudgeComments}
                onReset={() => onChange({ judgeComments: CLUB_DEFAULTS.defaultJudgeComments })} />
            </Row>
            {/* Min score to publish — simple-scored only */}
            {preset === 'simple-scored' && (
              <Row label="Minimum score to publish results" desc={minScoreDesc}>
                <Switch size="small" sx={switchSx} checked={config.minimumScoreToPublish} onChange={e => onChange({ minimumScoreToPublish: e.target.checked })} />
                <ProvChip isCustom={minScoreCustom} resetTo={CLUB_DEFAULTS.defaultMinimumScoreToPublish ? 'on' : 'off'}
                  onReset={() => onChange({ minimumScoreToPublish: CLUB_DEFAULTS.defaultMinimumScoreToPublish })} />
              </Row>
            )}
          </Rows>
        </Band>
      )}

      <DefFooter note={footerNote} clubSlug={clubSlug} />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step 3 – Recognition
// ═══════════════════════════════════════════════════════════════════════════════

const benchmarkBands = CLUB_DEFAULTS.recognitionDefaults.benchmark?.bands ?? []
const poySeason      = CLUB_DEFAULTS.recognitionDefaults.poy?.season ?? '—'

function Step3({ config, onChange, clubSlug }: {
  config: CompetitionConfig
  onChange: (p: Partial<CompetitionConfig>) => void
  clubSlug: string
}) {
  const preset       = config.judgingPreset
  const showStandings = preset === 'simple-scored' || preset === 'salon'
  const awardsRequired = preset === 'awards-only'

  const awardsDesc = config.awardsEnabled
    ? 'Judges assign awards to standout images after scoring.'
    : 'Off — images are scored and ranked only, with no placings named.'

  return (
    <>
      {/* ── Awards ── */}
      <Band label="Awards" subLine="Named placings">
        <Rows>
          {awardsRequired ? (
            <Row label="Awards" desc="Required for Awards only judging — judges assign placings directly, no numeric scoring." narrow>
              <Switch size="small" sx={switchSx} checked={true} onChange={() => {}} />
            </Row>
          ) : (
            <Row label="Give awards for this competition" desc={awardsDesc} narrow>
              <Switch size="small" sx={switchSx} checked={config.awardsEnabled} onChange={e => onChange({ awardsEnabled: e.target.checked })} />
            </Row>
          )}
        </Rows>
      </Band>

      {/* ── Standings ── */}
      {showStandings && (
        <Band label="Standings" subLine="What these scores feed">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '16px 24px' }}>
            {/* Benchmark */}
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 500, color: C.textBody }}>Benchmark classification</div>
              <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, color: C.textMuted, maxWidth: '52ch' }}>
                Images are classified against your club&apos;s bands, and member profiles update when results publish.
              </div>
              {config.benchmarkEnabled && benchmarkBands.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[...benchmarkBands].reverse().map(b => <BandChip key={b} label={b} />)}
                </div>
              )}
            </div>
            <div style={{ paddingTop: 2 }}>
              <Switch size="small" sx={switchSx} checked={config.benchmarkEnabled} onChange={e => onChange({ benchmarkEnabled: e.target.checked })} />
            </div>

            {/* POY */}
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 500, color: C.textBody }}>Photographer of the Year</div>
              <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, color: C.textMuted, maxWidth: '52ch' }}>
                {config.countTowardPOY
                  ? 'Every score counts toward the current season standings; rankings recalculate for all members when results publish.'
                  : 'Scores from this competition will not feed the current season POY standings.'}
              </div>
            </div>
            <div style={{ paddingTop: 2 }}>
              <Switch size="small" sx={switchSx} checked={config.countTowardPOY} onChange={e => onChange({ countTowardPOY: e.target.checked })} />
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

// ═══════════════════════════════════════════════════════════════════════════════
// Step 4 – Review & save
// ═══════════════════════════════════════════════════════════════════════════════

const PRESET_LABEL: Record<JudgingPreset, string> = {
  'simple-scored': 'Simple scored',
  'salon':         'Salon style',
  'awards-only':   'Awards only',
  'member-vote':   'Member vote',
  'end-of-year':   'End of year',
}

function ReviewLine({ primary, secondary }: { primary: string; secondary?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 14.5, color: C.textBody }}>{primary}</span>
      {secondary && <span style={{ fontSize: 13, color: C.textMuted }}>{secondary}</span>}
    </div>
  )
}

function Step4({ config, templateName, onTemplateName, nameError, onStep, clubSlug }: {
  config: CompetitionConfig
  templateName: string
  onTemplateName: (v: string) => void
  nameError: string
  onStep: (s: number) => void
  clubSlug: string
}) {
  // Derive summary lines from live config
  const catLine    = config.categories.length === 1
    ? `1 category: ${config.categories[0]}`
    : `${config.categories.length} categories, ${config.judgeSeparateCategories ? 'judged separately' : 'judged together'}`
  const catList    = config.categories.join(', ')
  const limitsLine = `${config.maxEntriesPerMember} ${config.maxEntriesPerMember === 1 ? 'image' : 'images'} total, ${config.maxEntriesPerCategory ?? '—'} max per category`

  const longEdgeVal = config.imageLongEdgePreset === 'custom' ? `${config.imageLongEdgeCustom ?? '—'} px` : `${config.imageLongEdgePreset} px`
  const capturePart = config.requireCaptureDate ? `taken within ${config.captureDateAmount} ${config.captureDateUnit}` : 'any image age'
  const reusePart   =
    config.imageReusePolicy === 'once-per-type'   ? 're-entry allowed in other types' :
    config.imageReusePolicy === 'once-per-season' ? 're-entry once per season' :
    config.imageReusePolicy === 'once-ever'       ? 'no re-entry ever' :
                                                    're-entry unrestricted'
  const fileLine = `Long edge up to ${longEdgeVal} · ${capturePart} · ${reusePart}`

  const judgeCount = config.judgingPreset === 'member-vote' || config.judgingPreset === 'end-of-year' ? null : config.numberOfJudges
  const scorePart  = config.judgingPreset === 'simple-scored' ? ` · scale of ${config.scoreMin} to ${config.scoreMax}` : ''
  const judgingLine = `${PRESET_LABEL[config.judgingPreset]}${judgeCount ? ` · ${judgeCount} judge${judgeCount !== 1 ? 's' : ''}` : ''}${scorePart}`

  const namesHiddenPart = config.blindHideName ? 'Member names hidden during judging' : 'Member names visible'
  const commentsPart    = config.judgeComments === 'none' ? 'no written feedback' : `feedback: ${config.judgeComments}`
  const judgeExpLine    = `${namesHiddenPart} · ${commentsPart} · all entries published`

  const recognitionParts: string[] = []
  if (!config.awardsEnabled && config.judgingPreset !== 'awards-only') recognitionParts.push('No awards')
  if (config.awardsEnabled || config.judgingPreset === 'awards-only') recognitionParts.push('Awards enabled')
  if (config.benchmarkEnabled) recognitionParts.push('scores feed benchmark classification')
  if (config.countTowardPOY) recognitionParts.push('feeds current season POY standings')
  const recognitionLine = recognitionParts.join(' · ') || 'No recognition settings applied'

  return (
    <>
      {/* ── Entries ── */}
      <Band label="Entries" gutterExtra={
        <button onClick={() => onStep(1)} style={{ ...linkStyle(), marginTop: 6 }}>Edit step 1</button>
      }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ReviewLine primary={catLine} secondary={catList} />
          <ReviewLine primary={limitsLine} />
          <ReviewLine primary={fileLine} />
        </div>
      </Band>

      {/* ── Judging ── */}
      <Band label="Judging" gutterExtra={
        <button onClick={() => onStep(2)} style={{ ...linkStyle(), marginTop: 6 }}>Edit step 2</button>
      }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ReviewLine primary={judgingLine} />
          {judgeCount && <ReviewLine primary={judgeExpLine} />}
        </div>
      </Band>

      {/* ── Recognition ── */}
      <Band label="Recognition" gutterExtra={
        <button onClick={() => onStep(3)} style={{ ...linkStyle(), marginTop: 6 }}>Edit step 3</button>
      }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ReviewLine primary={recognitionLine} />
          {(config.benchmarkEnabled || config.countTowardPOY) && (
            <ReviewLine secondary="Configured in Recognition & Standings for each competition." primary="" />
          )}
        </div>
      </Band>

      {/* ── Name ── */}
      <Band label="Name" subLine="Required to save">
        <div>
          <input
            type="text"
            value={templateName}
            onChange={e => onTemplateName(e.target.value)}
            placeholder="e.g. Monthly Scored Competition"
            style={{
              width: '100%', maxWidth: 420, display: 'block',
              padding: '11px 14px', background: C.inputBg, fontSize: 15, color: C.textPrimary,
              border: nameError
                ? `1px solid rgba(211,47,47,.6)`
                : `1px solid rgba(122,175,235,.45)`,
              borderRadius: 9, outline: 'none', fontFamily: 'inherit',
            }}
          />
          {nameError ? (
            <div style={{ marginTop: 6, fontSize: 12.5, color: '#F09595' }}>{nameError}</div>
          ) : (
            <div style={{ marginTop: 6, fontSize: 12.5, color: C.textMuted }}>
              Give this template a name so you can find and reuse it later.
            </div>
          )}
        </div>
      </Band>

      <DefFooter
        note="Values marked Club default were inherited; anything you changed is marked Custom."
        clubSlug={clubSlug}
      />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main wizard
// ═══════════════════════════════════════════════════════════════════════════════

const STEP_BLURBS = [
  'What members may enter, and what counts as a valid image.',
  'How entries are scored, and what the judges see.',
  'What this competition feeds once results are published.',
  'Check the setup, then name the template so you can reuse it.',
]

export function CreateTemplateWizard({ open, onClose, clubCategories, onAddClubCategory, clubSlug }: {
  open:              boolean
  onClose:           () => void
  clubCategories:    string[]
  onAddClubCategory: (name: string) => void
  clubSlug:          string
}) {
  const router = useRouter()
  const [step,          setStep]          = useState(1)
  const [config,        setConfig]        = useState<CompetitionConfig>(() => ({
    ...defaultConfig,
    categories: clubCategories.length ? clubCategories : defaultConfig.categories,
  }))
  const [templateName,  setTemplateName]  = useState('')
  const [nameError,     setNameError]     = useState('')
  const [saving,        startSave]        = useTransition()

  const onChange = (partial: Partial<CompetitionConfig>) =>
    setConfig(prev => ({ ...prev, ...partial }))

  const handleClose = () => {
    setStep(1)
    setConfig({ ...defaultConfig, categories: clubCategories.length ? clubCategories : defaultConfig.categories })
    setTemplateName('')
    setNameError('')
    onClose()
  }

  const handleSave = () => {
    if (!templateName.trim()) { setNameError('Template name is required'); return }
    setNameError('')
    startSave(async () => {
      try {
        await saveTemplate(templateName.trim(), config)
        handleClose()
        router.refresh()
      } catch {
        setNameError('Failed to save template. Please try again.')
      }
    })
  }

  const btnBase: React.CSSProperties = {
    fontSize: 14, borderRadius: 9, padding: '10px 20px', cursor: 'pointer',
    border: 'none', fontFamily: 'inherit', fontWeight: 500, transition: 'all 0.12s',
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
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
      <div style={{ padding: '26px 32px 22px', borderBottom: `1px solid ${C.rule}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: C.textEyebrow }}>
            New template
          </span>
          <span style={{ fontSize: 12, color: C.textEyebrow }}>
            Step {step} of 4
          </span>
        </div>
        <h1 style={{ margin: '8px 0 6px', fontSize: 27, fontWeight: 600, letterSpacing: '-.015em', color: C.textPrimary }}>
          {STEPS[step - 1]}
        </h1>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: C.textMuted, maxWidth: '66ch' }}>
          {STEP_BLURBS[step - 1]}
        </p>
        <BarStepper step={step} onStep={setStep} />
      </div>

      {/* ── Step content (scrollable) ── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {step === 1 && (
          <Step1 config={config} onChange={onChange}
            clubCategories={clubCategories} onAddClubCategory={onAddClubCategory} clubSlug={clubSlug} />
        )}
        {step === 2 && (
          <Step2 config={config} onChange={onChange} clubSlug={clubSlug} />
        )}
        {step === 3 && (
          <Step3 config={config} onChange={onChange} clubSlug={clubSlug} />
        )}
        {step === 4 && (
          <Step4 config={config} templateName={templateName} onTemplateName={v => { setTemplateName(v); if (v.trim()) setNameError('') }}
            nameError={nameError} onStep={setStep} clubSlug={clubSlug} />
        )}
      </div>

      {/* ── Button bar ── */}
      <div style={{
        borderTop: `1px solid ${C.rule}`, padding: '18px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        {/* Back */}
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          style={{
            ...btnBase,
            border: `1px solid ${step === 1 ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.14)'}`,
            color: step === 1 ? C.textEyebrow : C.textSecondary,
            background: 'transparent',
            cursor: step === 1 ? 'default' : 'pointer',
          }}>
          Back
        </button>

        {/* Right group */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleClose}
            style={{ ...btnBase, border: `1px solid rgba(255,255,255,.14)`, color: C.textSecondary, background: 'transparent' }}>
            Cancel
          </button>
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)}
              style={{ ...btnBase, padding: '10px 22px', background: C.accent, border: `1px solid ${C.accentBorder}`, color: '#fff', fontWeight: 600 }}>
              Continue
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              style={{ ...btnBase, padding: '10px 22px', background: C.accent, border: `1px solid ${C.accentBorder}`, color: '#fff', fontWeight: 600,
                opacity: saving ? 0.7 : 1, cursor: saving ? 'default' : 'pointer' }}>
              {saving ? 'Saving…' : 'Save template'}
            </button>
          )}
        </div>
      </div>
    </Dialog>
  )
}

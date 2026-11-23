'use client'

import { useEffect, useRef, useState } from 'react'

// ─── Club-year helpers ────────────────────────────────────────────────────────

export function currentClubYear(): string {
  const now = new Date()
  const m = now.getMonth() + 1
  const y = now.getFullYear()
  const start = m >= 9 ? y : y - 1
  return `${start}/${String(start + 1).slice(-2)}`
}

export function generateClubYears(from = 2021): string[] {
  const now = new Date()
  const m = now.getMonth() + 1
  const y = now.getFullYear()
  const endStart = m >= 9 ? y : y - 1
  const years: string[] = []
  for (let s = endStart; s >= from; s--) {
    years.push(`${s}/${String(s + 1).slice(-2)}`)
  }
  return years
}

// ─── Design constants ─────────────────────────────────────────────────────────

const K = {
  barBg:      'linear-gradient(180deg, #0f1826 0%, #0b1220 100%)',
  barBorder:  '1px solid rgba(255,255,255,0.08)',
  barShadow:  '0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px rgba(0,0,0,0.35)',
  popupBg:    '#111c30',
  popupBorder:'1px solid rgba(255,255,255,0.12)',
  popupShadow:'0 16px 40px rgba(0,0,0,0.5)',
  accent:     '#4f7fdb',
  accentText: '#8fb3f5',
  divider:    'rgba(255,255,255,0.09)',
  pillBorder: 'rgba(255,255,255,0.18)',
  pillText:   '#c3ccd9',
  muted:      '#5d6b82',
  rowText:    '#dbe2ec',
  popupLabel: '#8291a8',
}

// ─── Micro-label ──────────────────────────────────────────────────────────────

function MicroLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'block', fontSize: 11, fontWeight: 600,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      color: K.muted, marginBottom: 6,
    }}>
      {children}
    </span>
  )
}

// ─── Score section ────────────────────────────────────────────────────────────

function ScoreSection({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <MicroLabel>Min Score</MicroLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14, color: K.pillText, whiteSpace: 'nowrap', minWidth: 105 }}>
          Min score:{' '}
          <strong style={{ color: value > 0 ? K.accentText : K.pillText, fontWeight: 700 }}>
            {value > 0 ? value : 'Any'}
          </strong>
        </span>
        <input
          type="range"
          min={0} max={10} step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ width: 110, accentColor: K.accent, cursor: 'pointer' }}
        />
      </div>
    </div>
  )
}

// ─── Checkbox row ─────────────────────────────────────────────────────────────

function CheckRow({
  label, checked, disabled, onToggle,
}: { label: string; checked: boolean; disabled?: boolean; onToggle: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => !disabled && onToggle()}
      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); !disabled && onToggle() } }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 8px', borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: hov && !disabled ? 'rgba(255,255,255,0.05)' : 'transparent',
        userSelect: 'none', opacity: disabled ? 0.4 : 1,
      }}
    >
      <div style={{
        width: 16, height: 16, flexShrink: 0, borderRadius: 4,
        border: checked ? 'none' : '1.5px solid rgba(255,255,255,0.22)',
        background: checked ? K.accent : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.1s',
      }}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#0b1220" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span style={{ fontSize: 14, color: K.rowText, lineHeight: 1.4 }}>{label}</span>
    </div>
  )
}

// ─── Pill dropdown ────────────────────────────────────────────────────────────

function PillDropdown({
  id, sectionLabel, buttonLabel, buttonWidth,
  options, selected, onChange,
  showSearch, align = 'left',
  isOpen, onToggle,
}: {
  id:            string
  sectionLabel:  string
  buttonLabel:   string
  buttonWidth:   number
  options:       { id: string; label: string }[]
  selected:      string[]
  onChange:      (v: string[]) => void
  showSearch?:   boolean
  align?:        'left' | 'right'
  isOpen:        boolean
  onToggle:      () => void
}) {
  const [query, setQuery]           = useState('')
  const [hov, setHov]               = useState(false)
  const buttonRef                   = useRef<HTMLButtonElement>(null)
  const [fixedTop,  setFixedTop]    = useState(0)
  const [fixedLeft, setFixedLeft]   = useState(0)
  const [fixedRight, setFixedRight] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setFixedTop(rect.bottom + 8)
      if (align === 'right') {
        setFixedLeft(0)
        setFixedRight(window.innerWidth - rect.right)
      } else {
        setFixedLeft(rect.left)
        setFixedRight(undefined)
      }
    }
  }, [isOpen, align])

  const filtered = showSearch && query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  const allSelected = selected.length === options.length

  function toggle(optId: string) {
    if (selected.includes(optId)) {
      if (selected.length === 1) return
      onChange(selected.filter(x => x !== optId))
    } else {
      onChange([...selected, optId])
    }
  }

  function toggleAll() {
    if (allSelected) {
      onChange([options[0].id])
    } else {
      onChange(options.map(o => o.id))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative' }}>
      <MicroLabel>{sectionLabel}</MicroLabel>
      <button
        ref={buttonRef}
        type="button"
        id={`filter-pill-${id}`}
        onClick={onToggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          border: `1.5px solid ${hov || isOpen ? 'rgba(255,255,255,0.30)' : K.pillBorder}`,
          borderRadius: 9999,
          padding: '8px 14px',
          background: isOpen ? 'rgba(255,255,255,0.06)' : 'transparent',
          color: K.pillText, fontSize: 14, cursor: 'pointer',
          width: buttonWidth, minWidth: buttonWidth, maxWidth: buttonWidth,
          whiteSpace: 'nowrap', overflow: 'hidden',
          transition: 'border-color 0.12s, background 0.12s',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, textAlign: 'left' }}>
          {buttonLabel}
        </span>
        <span style={{ fontSize: 10, color: K.muted, flexShrink: 0,
          transform: isOpen ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.15s',
          display: 'inline-block',
        }}>▾</span>
      </button>

      {isOpen && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position:     'fixed',
            top:          fixedTop,
            left:         fixedRight !== undefined ? undefined : fixedLeft,
            right:        fixedRight,
            background:   K.popupBg,
            border:       K.popupBorder,
            borderRadius: 14,
            boxShadow:    K.popupShadow,
            padding:      14,
            minWidth:     220,
            zIndex:       100,
            animation:    'filterDropIn 0.12s ease-out both',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{
              fontSize: 12, fontWeight: 600, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: K.popupLabel,
            }}>
              {sectionLabel}
            </span>
            <button type="button" onClick={toggleAll}
              style={{
                fontSize: 13, fontWeight: 600, color: K.accent,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, fontFamily: 'inherit',
              }}>
              {allSelected ? 'Clear' : 'Select all'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: K.muted, margin: '0 0 10px' }}>
            At least 1 must be selected
          </p>

          {showSearch && (
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search…"
              style={{
                width: '100%', boxSizing: 'border-box', marginBottom: 8,
                padding: '7px 10px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                fontSize: 13, color: K.rowText, outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          )}

          <div style={{ maxHeight: 240, overflowY: 'auto', marginRight: -4, paddingRight: 4 }}>
            {filtered.map(opt => (
              <CheckRow
                key={opt.id}
                label={opt.label}
                checked={selected.includes(opt.id)}
                disabled={selected.includes(opt.id) && selected.length === 1}
                onToggle={() => toggle(opt.id)}
              />
            ))}
            {filtered.length === 0 && (
              <p style={{ fontSize: 13, color: K.muted, margin: '8px 0', textAlign: 'center' }}>
                No results
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div style={{
      width: 1, alignSelf: 'stretch', flexShrink: 0,
      background: K.divider, margin: '0 14px',
    }} />
  )
}

// ─── Exported types ───────────────────────────────────────────────────────────

export type DynamicFilterBarProps = {
  scoreMin:            number
  onScoreMin:          (v: number) => void

  selectedYears:       string[]   // empty = all years
  availableYears:      string[]
  onYears:             (v: string[]) => void

  selectedCategories:  string[]   // empty = all categories
  availableCategories: string[]
  onCategories:        (v: string[]) => void

  // Admin only — omit for member gallery
  selectedMemberIds?:  string[]   // empty = all members
  members?:            { id: string; displayName: string }[]
  onMemberIds?:        (v: string[]) => void
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DynamicFilterBar({
  scoreMin, onScoreMin,
  selectedYears, availableYears, onYears,
  selectedCategories, availableCategories, onCategories,
  selectedMemberIds, members, onMemberIds,
}: DynamicFilterBarProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null)

  function toggle(id: string) {
    setOpenFilter(prev => prev === id ? null : id)
  }

  // For display: treat empty selection as "all selected"
  const displayYears = selectedYears.length === 0 ? availableYears : selectedYears
  const displayCats  = selectedCategories.length === 0 ? availableCategories : selectedCategories
  const allMemberIds = (members ?? []).map(m => m.id)
  const displayMembers = !selectedMemberIds || selectedMemberIds.length === 0 ? allMemberIds : selectedMemberIds

  // Year button label
  const cur = currentClubYear()
  const yearLabel = (() => {
    if (selectedYears.length === 0 || selectedYears.length === availableYears.length) return 'All years'
    if (selectedYears.length === 1 && selectedYears[0] === cur) return `This year (${cur})`
    if (selectedYears.length === 1) return selectedYears[0]
    return `${selectedYears.length} years`
  })()

  const catLabel = (() => {
    if (selectedCategories.length === 0 || selectedCategories.length === availableCategories.length) return 'All categories'
    if (selectedCategories.length === 1) return selectedCategories[0]
    return `${selectedCategories.length} categories`
  })()

  const memberLabel = (() => {
    if (!members || !selectedMemberIds || selectedMemberIds.length === 0 || selectedMemberIds.length === members.length) return 'All members'
    if (selectedMemberIds.length === 1) {
      return members.find(m => m.id === selectedMemberIds[0])?.displayName ?? '1 member'
    }
    return `${selectedMemberIds.length} members`
  })()

  const hasMembers = members && members.length > 0 && !!onMemberIds

  return (
    <>
      <style>{`
        @keyframes filterDropIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Click-outside overlay */}
      {openFilter && (
        <div
          onClick={() => setOpenFilter(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
        />
      )}

      <div style={{
        display:      'flex',
        alignItems:   'center',
        flexWrap:     'nowrap',
        overflowX:    'auto',
        gap:          0,
        background:   K.barBg,
        border:       K.barBorder,
        borderRadius: 16,
        padding:      '12px 20px',
        boxShadow:    K.barShadow,
        marginBottom: 28,
      }}>

        {/* Min Score */}
        <ScoreSection value={scoreMin} onChange={onScoreMin} />

        <Divider />

        {/* Club Year */}
        <PillDropdown
          id="year"
          sectionLabel="Club Year"
          buttonLabel={yearLabel}
          buttonWidth={170}
          options={availableYears.map(y => ({ id: y, label: y }))}
          selected={displayYears}
          onChange={v => onYears(v.length === availableYears.length ? [] : v)}
          isOpen={openFilter === 'year'}
          onToggle={() => toggle('year')}
        />

        {availableCategories.length > 0 && (
          <>
            <Divider />
            <PillDropdown
              id="categories"
              sectionLabel="Categories"
              buttonLabel={catLabel}
              buttonWidth={170}
              options={availableCategories.map(c => ({ id: c, label: c }))}
              selected={displayCats}
              onChange={v => onCategories(v.length === availableCategories.length ? [] : v)}
              isOpen={openFilter === 'categories'}
              onToggle={() => toggle('categories')}
            />
          </>
        )}

        {hasMembers && (
          <>
            <Divider />
            <PillDropdown
              id="members"
              sectionLabel="Members"
              buttonLabel={memberLabel}
              buttonWidth={160}
              options={allMemberIds.map(id => ({
                id,
                label: members!.find(m => m.id === id)?.displayName ?? id,
              }))}
              selected={displayMembers}
              onChange={v => onMemberIds!(v.length === members!.length ? [] : v)}
              showSearch={members!.length > 5}
              align="right"
              isOpen={openFilter === 'members'}
              onToggle={() => toggle('members')}
            />
          </>
        )}
      </div>
    </>
  )
}

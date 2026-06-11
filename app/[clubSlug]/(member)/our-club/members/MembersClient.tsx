'use client'

import { useState, useMemo, useCallback } from 'react'
import Select        from '@mui/material/Select'
import MenuItem      from '@mui/material/MenuItem'
import { SHOOTING_INTERESTS, EXPERIENCE_LEVELS, skillLabel } from '@/lib/profile-options'
import type { MemberRow } from './page'
import MemberProfileModal from './MemberProfileModal'

// ─── Avatar helpers ───────────────────────────────────────────────────────────

import { avatarGradient as getAvatarGradient, avatarInitials as getInitials } from '@/lib/avatar'

function RowAvatar({ member }: { member: MemberRow }) {
  if (member.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.avatar_url}
        alt={member.display_name}
        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--border-default)', flexShrink: 0, display: 'block' }}
      />
    )
  }
  return (
    <div style={{ width: 44, height: 44, borderRadius: '50%', background: getAvatarGradient(member.display_name), display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--border-default)', flexShrink: 0, userSelect: 'none' }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: 'white', lineHeight: 1 }}>{getInitials(member.display_name)}</span>
    </div>
  )
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────

type SortKey = 'first_name' | 'last_name' | 'year_joined' | 'submissions_ytd' | 'submissions_all' | 'experience' | 'camera'

function sortValue(m: MemberRow, key: SortKey): string | number {
  switch (key) {
    case 'first_name':      return (m.first_name  ?? m.display_name).toLowerCase()
    case 'last_name':       return (m.last_name   ?? '').toLowerCase()
    case 'year_joined':     return m.member_since ? new Date(m.member_since).getFullYear() : 0
    case 'submissions_ytd': return m.submissions_ytd
    case 'submissions_all': return m.submissions_all
    case 'experience':      return (m.experience_level ?? '').toLowerCase()
    case 'camera':          return ((m.camera_brands ?? [])[0] ?? '').toLowerCase()
    default:                return ''
  }
}

function SortIcon({ dir }: { dir?: 'asc' | 'desc' }) {
  if (!dir) return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3, flexShrink: 0 }}>
      <path d="M3 3.5L5 1.5 7 3.5M3 6.5L5 8.5 7 6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  return dir === 'asc' ? (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ flexShrink: 0 }}>
      <path d="M2 7l3-4 3 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ flexShrink: 0 }}>
      <path d="M2 3l3 4 3-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ColHead({
  label, sortKey: key, activeSortKey, sortDir, onSort,
  align = 'left', rowSpan, borderLeft, borderRight,
}: {
  label: string; sortKey: SortKey; activeSortKey: SortKey; sortDir: 'asc' | 'desc'
  onSort: (k: SortKey) => void; align?: 'left' | 'right'; rowSpan?: number
  borderLeft?: string; borderRight?: string
}) {
  const active = activeSortKey === key
  return (
    <th
      rowSpan={rowSpan}
      onClick={() => onSort(key)}
      style={{
        textAlign:     align,
        padding:       '10px 12px',
        fontSize:      11,
        fontWeight:    600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color:         active ? 'var(--action-primary)' : 'var(--text-secondary)',
        cursor:        'pointer',
        userSelect:    'none',
        whiteSpace:    'nowrap',
        borderBottom:  '1px solid var(--border-default)',
        borderLeft,
        borderRight,
        background:    'var(--surface-1)',
        verticalAlign: 'bottom',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        <SortIcon dir={active ? sortDir : undefined} />
      </span>
    </th>
  )
}

// ─── Main client ──────────────────────────────────────────────────────────────

export default function MembersClient({
  members,
  directoryVisible,
}: {
  members: MemberRow[]
  directoryVisible: boolean
}) {
  const [search,         setSearch]     = useState('')
  const [skillFilter,    setSkill]      = useState('')
  const [interestFilter, setInterest]   = useState('')
  const [sortKey,        setSortKey]    = useState<SortKey>('last_name')
  const [sortDir,        setSortDir]    = useState<'asc' | 'desc'>('asc')
  const [modalIndex,     setModalIndex] = useState<number | null>(null)

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const rows = members.filter(m => {
      if (q &&
        !m.display_name.toLowerCase().includes(q) &&
        !(m.first_name  ?? '').toLowerCase().includes(q) &&
        !(m.last_name   ?? '').toLowerCase().includes(q) &&
        !(m.location    ?? '').toLowerCase().includes(q) &&
        !(m.bio         ?? '').toLowerCase().includes(q)) return false
      if (skillFilter    && m.experience_level !== skillFilter)                     return false
      if (interestFilter && !(m.shooting_interests ?? []).includes(interestFilter)) return false
      return true
    })

    return [...rows].sort((a, b) => {
      const av = sortValue(a, sortKey)
      const bv = sortValue(b, sortKey)
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [members, search, skillFilter, interestFilter, sortKey, sortDir])

  const hasFilters = search || skillFilter || interestFilter
  const closeModal = useCallback(() => setModalIndex(null), [])
  const navModal   = useCallback((i: number) => setModalIndex(i), [])

  const sharedHead: React.CSSProperties = {
    padding:       '10px 12px',
    fontSize:      11,
    fontWeight:    600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color:         'var(--text-secondary)',
    whiteSpace:    'nowrap',
    background:    'var(--surface-1)',
    borderBottom:  '1px solid var(--border-default)',
    textAlign:     'center',
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="mb-0 font-bold text-content-primary" style={{ fontFamily: 'var(--font-heading)', fontSize: 28, letterSpacing: '-0.02em' }}>Members</h1>
      </div>

      {!directoryVisible ? (
        <div className="rounded-xl border border-border-default bg-surface-1 px-6 py-12 text-center">
          <svg className="mx-auto mb-3 h-8 w-8 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm text-content-secondary">The member directory is not publicly visible at this time.</p>
        </div>
      ) : (
        <>
          {/* Filters + live count */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search members…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border-default bg-surface-2 py-2 pl-9 pr-3 text-sm text-content-primary placeholder:text-content-tertiary outline-none focus:border-action-primary transition-colors"
              />
            </div>
            <Select
              size="small"
              value={skillFilter}
              onChange={e => setSkill(e.target.value)}
              displayEmpty
              sx={{ fontSize: 14, fontFamily: 'inherit', minWidth: 150 }}
            >
              <MenuItem value="" sx={{ fontSize: 14, fontFamily: 'inherit' }}>All skill levels</MenuItem>
              {EXPERIENCE_LEVELS.map(l => (
                <MenuItem key={l.value} value={l.value} sx={{ fontSize: 14, fontFamily: 'inherit' }}>{l.label}</MenuItem>
              ))}
            </Select>
            <Select
              size="small"
              value={interestFilter}
              onChange={e => setInterest(e.target.value)}
              displayEmpty
              sx={{ fontSize: 14, fontFamily: 'inherit', minWidth: 150 }}
            >
              <MenuItem value="" sx={{ fontSize: 14, fontFamily: 'inherit' }}>All interests</MenuItem>
              {SHOOTING_INTERESTS.map(i => (
                <MenuItem key={i} value={i} sx={{ fontSize: 14, fontFamily: 'inherit' }}>{i}</MenuItem>
              ))}
            </Select>
            {hasFilters && (
              <button onClick={() => { setSearch(''); setSkill(''); setInterest('') }} className="text-sm text-action-primary hover:underline">
                Clear
              </button>
            )}

            {/* Live member count — updates as filters change */}
            <span className="ml-auto text-sm" style={{ color: 'var(--text-secondary)' }}>
              {filtered.length} {filtered.length === 1 ? 'member' : 'members'}
              {hasFilters && members.length !== filtered.length && (
                <span style={{ color: 'var(--text-tertiary)' }}> of {members.length}</span>
              )}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border-default bg-surface-1 px-6 py-12 text-center">
              <p className="text-sm text-content-secondary">No members match your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border-default" style={{ background: 'var(--surface-2)' }}>
              <table className="w-full border-collapse text-sm">
                <thead>
                  {/* Row 1: main headings */}
                  <tr>
                    {/* Avatar — no sort, spans 2 rows */}
                    <th rowSpan={2} style={{ ...sharedHead, padding: '10px 8px 10px 14px', width: 56 }} />

                    <ColHead label="First name"  sortKey="first_name"  activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} rowSpan={2} />
                    <ColHead label="Last name"   sortKey="last_name"   activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} rowSpan={2} />
                    <ColHead label="Experience"  sortKey="experience"  activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} rowSpan={2} />
                    <ColHead label="Camera"      sortKey="camera"      activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} rowSpan={2} />

                    {/* Grouped submissions header */}
                    <th colSpan={2} style={{ ...sharedHead, borderBottom: 'none', borderLeft: '1px solid var(--border-default)', borderRight: '1px solid var(--border-default)', paddingBottom: 4 }}>
                      Submissions
                    </th>

                    <ColHead label="Year joined" sortKey="year_joined" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} rowSpan={2} />
                  </tr>

                  {/* Row 2: submission sub-headings */}
                  <tr>
                    <ColHead label="YTD"      sortKey="submissions_ytd" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" borderLeft="1px solid var(--border-default)" />
                    <ColHead label="All time" sortKey="submissions_all" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" borderRight="1px solid var(--border-default)" />
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((member, i) => {
                    const yearJoined = member.member_since ? new Date(member.member_since).getFullYear() : '—'
                    const cameras    = (member.camera_brands ?? []).slice(0, 2).join(', ') || '—'
                    const exp        = skillLabel(member.experience_level) || '—'

                    return (
                      <tr
                        key={member.id}
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-1)'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ''}
                      >
                        {/* Avatar */}
                        <td
                          style={{ padding: '10px 8px 10px 14px', verticalAlign: 'middle', cursor: 'pointer' }}
                          onClick={() => setModalIndex(i)}
                        >
                          <RowAvatar member={member} />
                        </td>

                        {/* First name — styled as a link, opens modal */}
                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                          <button
                            onClick={() => setModalIndex(i)}
                            className="text-left font-medium transition-colors hover:underline focus:outline-none"
                            style={{ color: 'var(--action-primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}
                          >
                            {member.first_name ?? '—'}
                          </button>
                        </td>

                        <td style={{ padding: '10px 12px', verticalAlign: 'middle', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {member.last_name ?? '—'}
                        </td>

                        <td style={{ padding: '10px 12px', verticalAlign: 'middle', color: 'var(--text-secondary)' }}>
                          {exp}
                        </td>

                        <td style={{ padding: '10px 12px', verticalAlign: 'middle', color: 'var(--text-secondary)', maxWidth: 180 }}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cameras}</span>
                        </td>

                        <td style={{ padding: '10px 12px', verticalAlign: 'middle', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', borderLeft: '1px solid var(--border-default)' }}>
                          {member.submissions_ytd}
                        </td>

                        <td style={{ padding: '10px 12px', verticalAlign: 'middle', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', borderRight: '1px solid var(--border-default)' }}>
                          {member.submissions_all}
                        </td>

                        <td style={{ padding: '10px 12px', verticalAlign: 'middle', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                          {yearJoined}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Profile modal */}
      {modalIndex !== null && (
        <MemberProfileModal
          members={filtered}
          index={modalIndex}
          onClose={closeModal}
          onNav={navModal}
        />
      )}
    </div>
  )
}

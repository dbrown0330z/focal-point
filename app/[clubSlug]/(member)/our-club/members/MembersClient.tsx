'use client'

import { useState, useMemo, useCallback } from 'react'
import { SHOOTING_INTERESTS, EXPERIENCE_LEVELS, skillLabel } from '@/lib/profile-options'
import type { MemberRow } from './page'
import MemberProfileModal from './MemberProfileModal'

// ─── Avatar tile helpers ──────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  'var(--action-primary)', 'var(--spot-teal)', 'var(--spot-purple)',
  'var(--spot-green)',     'var(--spot-pink)', 'var(--spot-orange)',
]
function getInitials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean)
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}
function getAvatarBg(name: string) {
  let h = 0
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────

type SortKey = 'first_name' | 'last_name' | 'year_joined' | 'submissions_ytd' | 'submissions_all' | 'experience' | 'camera'

function sortValue(m: MemberRow, key: SortKey): string | number {
  switch (key) {
    case 'first_name':       return (m.first_name  ?? m.display_name).toLowerCase()
    case 'last_name':        return (m.last_name   ?? '').toLowerCase()
    case 'year_joined':      return m.member_since ? new Date(m.member_since).getFullYear() : 0
    case 'submissions_ytd':  return m.submissions_ytd
    case 'submissions_all':  return m.submissions_all
    case 'experience':       return (m.experience_level ?? '').toLowerCase()
    case 'camera':           return ((m.camera_brands ?? [])[0] ?? '').toLowerCase()
    default:                 return ''
  }
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ dir }: { dir?: 'asc' | 'desc' }) {
  if (!dir) return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
      <path d="M3 3.5L5 1.5 7 3.5M3 6.5L5 8.5 7 6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  return dir === 'asc' ? (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M2 7l3-4 3 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M2 3l3 4 3-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Grid tile ────────────────────────────────────────────────────────────────

function MemberTile({ member, onClick }: { member: MemberRow; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2.5 rounded-xl p-4 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-action-primary"
      style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-1)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)' }}
    >
      {member.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={member.avatar_url} alt={member.display_name} className="rounded-full object-cover border border-border-default" style={{ width: 72, height: 72, flexShrink: 0 }} />
      ) : (
        <div className="flex items-center justify-center rounded-full font-bold text-white" style={{ width: 72, height: 72, flexShrink: 0, fontSize: 22, background: getAvatarBg(member.display_name), border: '2px solid var(--border-default)' }}>
          {getInitials(member.display_name)}
        </div>
      )}
      <p className="w-full truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        {member.display_name}
      </p>
      {(member.location || member.membership_class) && (
        <p className="w-full truncate text-xs" style={{ color: 'var(--text-secondary)', marginTop: -4 }}>
          {member.membership_class ?? member.location}
        </p>
      )}
    </button>
  )
}

// ─── View toggle icons ────────────────────────────────────────────────────────

function GridIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} style={{ color: active ? 'var(--action-primary)' : 'var(--text-tertiary)' }}>
      <rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  )
}
function ListIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} style={{ color: active ? 'var(--action-primary)' : 'var(--text-tertiary)' }}>
      <line x1="1" y1="4"  x2="15" y2="4"  strokeLinecap="round" />
      <line x1="1" y1="8"  x2="15" y2="8"  strokeLinecap="round" />
      <line x1="1" y1="12" x2="15" y2="12" strokeLinecap="round" />
    </svg>
  )
}

// ─── Main client ──────────────────────────────────────────────────────────────

const TABLE_COLS: { label: string; key: SortKey; align?: 'right' }[] = [
  { label: 'First name',          key: 'first_name' },
  { label: 'Last name',           key: 'last_name' },
  { label: 'Year joined',         key: 'year_joined' },
  { label: 'Submissions (YTD)',   key: 'submissions_ytd',  align: 'right' },
  { label: 'Submissions (all)',   key: 'submissions_all',  align: 'right' },
  { label: 'Experience',          key: 'experience' },
  { label: 'Camera',              key: 'camera' },
]

export default function MembersClient({
  members,
  directoryVisible,
}: {
  members: MemberRow[]
  directoryVisible: boolean
}) {
  const [view,          setView]       = useState<'grid' | 'list'>('grid')
  const [search,        setSearch]     = useState('')
  const [skillFilter,   setSkill]      = useState('')
  const [interestFilter,setInterest]   = useState('')
  const [sortKey,       setSortKey]    = useState<SortKey>('last_name')
  const [sortDir,       setSortDir]    = useState<'asc' | 'desc'>('asc')
  const [modalIndex,    setModalIndex] = useState<number | null>(null)

  function handleSortClick(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const rows = members.filter(m => {
      if (q && !m.display_name.toLowerCase().includes(q) &&
               !(m.first_name  ?? '').toLowerCase().includes(q) &&
               !(m.last_name   ?? '').toLowerCase().includes(q) &&
               !(m.location    ?? '').toLowerCase().includes(q) &&
               !(m.bio         ?? '').toLowerCase().includes(q)) return false
      if (skillFilter    && m.experience_level !== skillFilter)              return false
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

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Members</h1>
          <p className="mt-1 text-sm text-content-secondary">
            {directoryVisible ? `${members.length} active member${members.length !== 1 ? 's' : ''}` : 'Member directory'}
          </p>
        </div>

        {/* View toggle */}
        {directoryVisible && (
          <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setView('grid')}
              className="flex items-center justify-center rounded-md p-1.5 transition-colors"
              style={{ background: view === 'grid' ? 'var(--surface-2)' : 'transparent', boxShadow: view === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}
              aria-label="Grid view"
            >
              <GridIcon active={view === 'grid'} />
            </button>
            <button
              onClick={() => setView('list')}
              className="flex items-center justify-center rounded-md p-1.5 transition-colors"
              style={{ background: view === 'list' ? 'var(--surface-2)' : 'transparent', boxShadow: view === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}
              aria-label="List view"
            >
              <ListIcon active={view === 'list'} />
            </button>
          </div>
        )}
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
          {/* Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
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

            <select value={skillFilter} onChange={e => setSkill(e.target.value)} className="rounded-lg border border-border-default bg-surface-2 py-2 px-3 text-sm text-content-primary outline-none focus:border-action-primary transition-colors cursor-pointer">
              <option value="">All skill levels</option>
              {EXPERIENCE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>

            <select value={interestFilter} onChange={e => setInterest(e.target.value)} className="rounded-lg border border-border-default bg-surface-2 py-2 px-3 text-sm text-content-primary outline-none focus:border-action-primary transition-colors cursor-pointer">
              <option value="">All interests</option>
              {SHOOTING_INTERESTS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>

            {hasFilters && (
              <button onClick={() => { setSearch(''); setSkill(''); setInterest('') }} className="text-sm text-action-primary hover:underline">Clear</button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border-default bg-surface-1 px-6 py-12 text-center">
              <p className="text-sm text-content-secondary">No members match your search.</p>
            </div>
          ) : view === 'grid' ? (

            /* ── Grid ───────────────────────────────────────────────────────── */
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filtered.map((member, i) => (
                <MemberTile key={member.id} member={member} onClick={() => setModalIndex(i)} />
              ))}
            </div>

          ) : (

            /* ── Table ──────────────────────────────────────────────────────── */
            <div className="overflow-x-auto rounded-xl border border-border-default" style={{ background: 'var(--surface-2)' }}>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--surface-1)' }}>
                    {TABLE_COLS.map(col => (
                      <th
                        key={col.key}
                        onClick={() => handleSortClick(col.key)}
                        className="whitespace-nowrap px-4 py-3 font-semibold cursor-pointer select-none transition-colors hover:text-content-primary"
                        style={{
                          textAlign:    col.align ?? 'left',
                          color:        sortKey === col.key ? 'var(--action-primary)' : 'var(--text-secondary)',
                          fontSize:     11,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {col.label}
                          <SortIcon dir={sortKey === col.key ? sortDir : undefined} />
                        </span>
                      </th>
                    ))}
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
                        onClick={() => setModalIndex(i)}
                        className="cursor-pointer transition-colors"
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-1)'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ''}
                      >
                        <td className="px-4 py-3" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {member.first_name ?? '—'}
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {member.last_name ?? '—'}
                        </td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                          {yearJoined}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-right" style={{ color: 'var(--text-secondary)' }}>
                          {member.submissions_ytd}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-right" style={{ color: 'var(--text-secondary)' }}>
                          {member.submissions_all}
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                          {exp}
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-secondary)', maxWidth: 180 }}>
                          <span className="block truncate">{cameras}</span>
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

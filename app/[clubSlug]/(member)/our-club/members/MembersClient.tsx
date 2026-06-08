'use client'

import { useState, useMemo, useCallback } from 'react'
import { SHOOTING_INTERESTS, EXPERIENCE_LEVELS } from '@/lib/profile-options'
import type { MemberRow } from './page'
import MemberProfileModal from './MemberProfileModal'

// ─── Avatar tile ──────────────────────────────────────────────────────────────

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

function MemberTile({ member, onClick }: { member: MemberRow; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2.5 rounded-xl p-4 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-action-primary"
      style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-1)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)' }}
    >
      {/* Avatar */}
      {member.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.avatar_url}
          alt={member.display_name}
          className="rounded-full object-cover border border-border-default"
          style={{ width: 72, height: 72, flexShrink: 0 }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full font-bold text-white"
          style={{ width: 72, height: 72, flexShrink: 0, fontSize: 22, background: getAvatarBg(member.display_name), border: '2px solid var(--border-default)' }}
        >
          {getInitials(member.display_name)}
        </div>
      )}

      {/* Name */}
      <p className="w-full truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        {member.display_name}
      </p>

      {/* Secondary: location or class */}
      {(member.location || member.membership_class) && (
        <p className="w-full truncate text-xs" style={{ color: 'var(--text-secondary)', marginTop: -4 }}>
          {member.membership_class ?? member.location}
        </p>
      )}
    </button>
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
  const [search,         setSearch]   = useState('')
  const [skillFilter,    setSkill]    = useState('')
  const [interestFilter, setInterest] = useState('')
  const [modalIndex,     setModalIndex] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return members.filter(m => {
      if (q && !m.display_name.toLowerCase().includes(q) &&
               !(m.location ?? '').toLowerCase().includes(q) &&
               !(m.bio ?? '').toLowerCase().includes(q)) return false
      if (skillFilter    && m.experience_level !== skillFilter)                            return false
      if (interestFilter && !(m.shooting_interests ?? []).includes(interestFilter)) return false
      return true
    })
  }, [members, search, skillFilter, interestFilter])

  const hasFilters = search || skillFilter || interestFilter
  const closeModal = useCallback(() => setModalIndex(null), [])
  const navModal   = useCallback((i: number) => setModalIndex(i), [])

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Members</h1>
        <p className="mt-1 text-sm text-content-secondary">
          {directoryVisible ? `${members.length} active member${members.length !== 1 ? 's' : ''}` : 'Member directory'}
        </p>
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

            <select
              value={skillFilter}
              onChange={e => setSkill(e.target.value)}
              className="rounded-lg border border-border-default bg-surface-2 py-2 px-3 text-sm text-content-primary outline-none focus:border-action-primary transition-colors cursor-pointer"
            >
              <option value="">All skill levels</option>
              {EXPERIENCE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>

            <select
              value={interestFilter}
              onChange={e => setInterest(e.target.value)}
              className="rounded-lg border border-border-default bg-surface-2 py-2 px-3 text-sm text-content-primary outline-none focus:border-action-primary transition-colors cursor-pointer"
            >
              <option value="">All interests</option>
              {SHOOTING_INTERESTS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>

            {hasFilters && (
              <button onClick={() => { setSearch(''); setSkill(''); setInterest('') }} className="text-sm text-action-primary hover:underline">
                Clear
              </button>
            )}
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border-default bg-surface-1 px-6 py-12 text-center">
              <p className="text-sm text-content-secondary">No members match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filtered.map((member, i) => (
                <MemberTile key={member.id} member={member} onClick={() => setModalIndex(i)} />
              ))}
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

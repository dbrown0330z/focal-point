'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { SHOOTING_INTERESTS, EXPERIENCE_LEVELS, skillLabel } from '@/lib/profile-options'
import type { MemberRow } from './page'

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function Avatar({ member, size = 'md' }: { member: MemberRow; size?: 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'h-20 w-20 text-xl' : 'h-12 w-12 text-sm'
  if (member.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.avatar_url}
        alt={member.display_name}
        className={`${dim} rounded-full object-cover border border-border-default flex-shrink-0`}
      />
    )
  }
  return (
    <span
      className={`flex ${dim} flex-shrink-0 items-center justify-center rounded-full font-bold text-white`}
      style={{ background: 'var(--action-primary)' }}
    >
      {getInitials(member.display_name)}
    </span>
  )
}

function SkillBadge({ level }: { level: string }) {
  const colours: Record<string, { bg: string; text: string }> = {
    beginner:     { bg: 'rgba(0,151,167,0.10)',  text: 'var(--spot-teal)' },
    intermediate: { bg: 'rgba(108,71,212,0.10)', text: 'var(--spot-purple)' },
    advanced:     { bg: 'rgba(46,125,50,0.12)',  text: 'var(--status-success-text)' },
  }
  const style = colours[level] ?? { bg: 'rgba(90,106,130,0.10)', text: 'var(--text-secondary)' }
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: style.bg, color: style.text }}
    >
      {skillLabel(level)}
    </span>
  )
}

// ── Member profile modal ───────────────────────────────────────────────────────

function MemberModal({
  members,
  index,
  onClose,
  onNav,
}: {
  members: MemberRow[]
  index: number
  onClose: () => void
  onNav: (i: number) => void
}) {
  const member = members[index]

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft'  && index > 0)                  onNav(index - 1)
      if (e.key === 'ArrowRight' && index < members.length - 1) onNav(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, members.length, onClose, onNav])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const joinedDate = member.member_since
    ? new Date(member.member_since).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors z-10"
          style={{ background: 'var(--surface-1)', color: 'var(--text-secondary)' }}
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-start gap-4 pr-8">
            <Avatar member={member} size="lg" />
            <div className="min-w-0 flex-1 pt-1">
              <h2 className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {member.display_name}
              </h2>

              {member.location && (
                <p className="mt-1 flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {member.location}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {member.experience_level && <SkillBadge level={member.experience_level} />}
                {member.membership_class && (
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ background: 'rgba(123,107,56,0.10)', color: 'var(--spot-gold)' }}
                  >
                    {member.membership_class}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">

          {/* Meta row: member number + joined */}
          {(member.member_number || joinedDate) && (
            <div className="flex gap-6">
              {member.member_number && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Member #</p>
                  <p className="mt-0.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{member.member_number}</p>
                </div>
              )}
              {joinedDate && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Member since</p>
                  <p className="mt-0.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{joinedDate}</p>
                </div>
              )}
            </div>
          )}

          {/* Bio */}
          {member.bio && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>About</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{member.bio}</p>
            </div>
          )}

          {/* Shooting interests */}
          {member.shooting_interests && member.shooting_interests.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Shooting interests</p>
              <div className="flex flex-wrap gap-1.5">
                {member.shooting_interests.map(interest => (
                  <span
                    key={interest}
                    className="rounded-full px-2.5 py-1 text-xs"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Camera gear */}
          {member.camera_brands && member.camera_brands.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Camera gear</p>
              <div className="flex flex-wrap gap-1.5">
                {member.camera_brands.map(brand => (
                  <span
                    key={brand}
                    className="rounded-full px-2.5 py-1 text-xs"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!member.bio && !member.shooting_interests?.length && !member.camera_brands?.length && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-secondary)' }}>
              This member hasn&apos;t filled out their profile yet.
            </p>
          )}
        </div>

        {/* Footer nav */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <button
            onClick={() => onNav(index - 1)}
            disabled={index === 0}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: 'var(--text-secondary)', background: index === 0 ? 'transparent' : 'var(--surface-1)' }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {index + 1} of {members.length}
          </span>

          <button
            onClick={() => onNav(index + 1)}
            disabled={index === members.length - 1}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: 'var(--text-secondary)', background: index === members.length - 1 ? 'transparent' : 'var(--surface-1)' }}
          >
            Next
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main client ────────────────────────────────────────────────────────────────

export default function MembersClient({
  members,
  directoryVisible,
}: {
  members: MemberRow[]
  directoryVisible: boolean
}) {
  const [search, setSearch]           = useState('')
  const [skillFilter, setSkill]       = useState('')
  const [interestFilter, setInterest] = useState('')
  const [modalIndex, setModalIndex]   = useState<number | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return members.filter(m => {
      if (q && !m.display_name.toLowerCase().includes(q) &&
               !(m.location ?? '').toLowerCase().includes(q) &&
               !(m.bio ?? '').toLowerCase().includes(q)) return false
      if (skillFilter && m.experience_level !== skillFilter) return false
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
              {EXPERIENCE_LEVELS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>

            <select
              value={interestFilter}
              onChange={e => setInterest(e.target.value)}
              className="rounded-lg border border-border-default bg-surface-2 py-2 px-3 text-sm text-content-primary outline-none focus:border-action-primary transition-colors cursor-pointer"
            >
              <option value="">All interests</option>
              {SHOOTING_INTERESTS.map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>

            {hasFilters && (
              <button
                onClick={() => { setSearch(''); setSkill(''); setInterest('') }}
                className="text-sm text-action-primary hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border-default bg-surface-1 px-6 py-12 text-center">
              <p className="text-sm text-content-secondary">No members match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((member, i) => (
                <button
                  key={member.id}
                  onClick={() => setModalIndex(i)}
                  className="rounded-xl border border-border-default bg-surface-2 p-4 flex flex-col gap-3 text-left transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-action-primary"
                  style={{ cursor: 'pointer' }}
                >
                  {/* Avatar + name row */}
                  <div className="flex items-center gap-3">
                    <Avatar member={member} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-content-primary text-sm leading-tight">
                        {member.display_name}
                      </p>
                      {member.location && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-content-secondary truncate">
                          <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {member.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {member.experience_level && (
                    <div><SkillBadge level={member.experience_level} /></div>
                  )}

                  {member.bio && (
                    <p className="text-xs text-content-secondary leading-relaxed line-clamp-3">
                      {member.bio}
                    </p>
                  )}

                  {member.shooting_interests && member.shooting_interests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {member.shooting_interests.slice(0, 4).map(interest => (
                        <span
                          key={interest}
                          className="rounded-full px-2 py-0.5 text-xs text-content-secondary"
                          style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}
                        >
                          {interest}
                        </span>
                      ))}
                      {member.shooting_interests.length > 4 && (
                        <span className="text-xs text-content-tertiary py-0.5">
                          +{member.shooting_interests.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modalIndex !== null && (
        <MemberModal
          members={filtered}
          index={modalIndex}
          onClose={closeModal}
          onNav={navModal}
        />
      )}
    </div>
  )
}

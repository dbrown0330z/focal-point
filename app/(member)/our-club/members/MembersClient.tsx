'use client'

import { useState, useMemo } from 'react'
import { SHOOTING_INTERESTS, EXPERIENCE_LEVELS, skillLabel } from '@/lib/profile-options'
import type { MemberRow } from './page'

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function Avatar({ member }: { member: MemberRow }) {
  if (member.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.avatar_url}
        alt={member.display_name}
        className="h-12 w-12 rounded-full object-cover border border-border-default flex-shrink-0"
      />
    )
  }
  return (
    <span
      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
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
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: style.bg, color: style.text }}
    >
      {skillLabel(level)}
    </span>
  )
}

export default function MembersClient({
  members,
  directoryVisible,
}: {
  members: MemberRow[]
  directoryVisible: boolean
}) {
  const [search, setSearch]     = useState('')
  const [skillFilter, setSkill] = useState('')
  const [interestFilter, setInterest] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return members.filter(m => {
      if (q && !m.display_name.toLowerCase().includes(q) &&
               !(m.location ?? '').toLowerCase().includes(q) &&
               !(m.bio ?? '').toLowerCase().includes(q)) return false
      if (skillFilter && m.skill_level !== skillFilter) return false
      if (interestFilter && !(m.shooting_interests ?? []).includes(interestFilter)) return false
      return true
    })
  }, [members, search, skillFilter, interestFilter])

  const hasFilters = search || skillFilter || interestFilter

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
            {/* Search */}
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

            {/* Skill filter */}
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

            {/* Interest filter */}
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
              {filtered.map(member => (
                <div
                  key={member.id}
                  className="rounded-xl border border-border-default bg-surface-2 p-4 flex flex-col gap-3"
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

                  {/* Skill badge */}
                  {member.skill_level && (
                    <div>
                      <SkillBadge level={member.skill_level} />
                    </div>
                  )}

                  {/* Bio */}
                  {member.bio && (
                    <p className="text-xs text-content-secondary leading-relaxed line-clamp-3">
                      {member.bio}
                    </p>
                  )}

                  {/* Interests */}
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
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

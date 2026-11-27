'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { logout } from '@/app/(auth)/actions'
import { useTheme } from './ThemeProvider'


function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function MemberNav({
  clubSlug = '',
  clubName = 'Focal Point',
  displayName,
  email,
  role,
  avatarUrl: _avatarUrl,
  customPages: _customPages,
  customTabs: _customTabs,
  pendingCount: _pendingCount,
  resourcesEnabled = true,
  galleriesEnabled = true,
  navPageOrder,
}: {
  clubSlug?:          string
  clubName?:          string
  displayName:        string
  email:              string
  role:               string | null
  avatarUrl?:         string | null
  customPages?:       unknown[]
  customTabs?:        unknown[]
  pendingCount?:      number
  resourcesEnabled?:  boolean
  galleriesEnabled?:  boolean
  navPageOrder?:      Record<string, string[]>
}) {
  const base = `/${clubSlug}`

  // Canonical sortId → nav link mapping
  const BUILTIN_LINKS: Record<string, { href: string; label: string }> = {
    'builtin:my-images':        { href: `${base}/library`,                    label: 'My library' },
    'builtin:my-galleries':     { href: `${base}/library/galleries`,          label: 'My galleries' },
    'builtin:comp-current':     { href: `${base}/competitions`,               label: 'Current' },
    'builtin:comp-results':     { href: `${base}/competitions/results`,       label: 'Results' },
    'builtin:comp-standings':   { href: `${base}/our-club/members/standings`, label: 'Standings' },
    'builtin:about':            { href: `${base}/our-club/about`,             label: 'About our club' },
    'builtin:member-directory': { href: `${base}/our-club/members`,          label: 'Member directory' },
    'builtin:resources':        { href: `${base}/resources`,                 label: 'Resources' },
    'builtin:club-galleries':   { href: `${base}/our-club/galleries`,        label: 'Club galleries' },
    'builtin:join':             { href: `${base}/our-club/join`,             label: 'Join / Renew' },
  }

  // Apply nav_page_order for a group, falling back to default order
  function orderedLinks(
    group: string,
    defaults: { href: string; label: string }[],
    filterFn?: (sortId: string) => boolean,
  ): { href: string; label: string }[] {
    const order = navPageOrder?.[group]
    if (!order?.length) return defaults
    return order
      .filter(id => id.startsWith('builtin:') && BUILTIN_LINKS[id])
      .filter(id => !filterFn || filterFn(id))
      .map(id => BUILTIN_LINKS[id])
  }

  const topLinks = [
    { href: `${base}`,          label: 'Home' },
    { href: `${base}/calendar`, label: 'Calendar' },
  ]

  const myImagesLinks = orderedLinks('images', [
    BUILTIN_LINKS['builtin:my-images'],
    BUILTIN_LINKS['builtin:my-galleries'],
  ])

  const competitionsLinks = orderedLinks('competitions', [
    BUILTIN_LINKS['builtin:comp-current'],
    BUILTIN_LINKS['builtin:comp-results'],
    BUILTIN_LINKS['builtin:comp-standings'],
  ])

  const ourClubLinks = orderedLinks(
    'our-club',
    [
      BUILTIN_LINKS['builtin:about'],
      BUILTIN_LINKS['builtin:member-directory'],
      ...(resourcesEnabled ? [BUILTIN_LINKS['builtin:resources']]      : []),
      ...(galleriesEnabled ? [BUILTIN_LINKS['builtin:club-galleries']]  : []),
      BUILTIN_LINKS['builtin:join'],
    ],
    id => {
      if (id === 'builtin:resources'     && !resourcesEnabled) return false
      if (id === 'builtin:club-galleries' && !galleriesEnabled)  return false
      return true
    },
  )

  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [userOpen,     setUserOpen]     = useState(false)
  const [myImgOpen,    setMyImgOpen]    = useState(false)
  const [compOpen,     setCompOpen]     = useState(false)
  const [ourClubOpen,  setOurClubOpen]  = useState(false)
  const userRef    = useRef<HTMLDivElement>(null)
  const myImgRef   = useRef<HTMLDivElement>(null)
  const compRef    = useRef<HTMLDivElement>(null)
  const ourClubRef = useRef<HTMLDivElement>(null)


  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userRef.current    && !userRef.current.contains(e.target as Node))    setUserOpen(false)
      if (myImgRef.current   && !myImgRef.current.contains(e.target as Node))   setMyImgOpen(false)
      if (compRef.current    && !compRef.current.contains(e.target as Node))    setCompOpen(false)
      if (ourClubRef.current && !ourClubRef.current.contains(e.target as Node)) setOurClubOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setUserOpen(false); setMyImgOpen(false); setCompOpen(false); setOurClubOpen(false) }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  const initials = getInitials(displayName)
  const isMyImagesActive = pathname.startsWith(`/${clubSlug}/library`)
  const isCompActive     = pathname.startsWith(`/${clubSlug}/competitions`)
  const isOurClubActive  = pathname.startsWith(`/${clubSlug}/our-club`)

  return (
    <header className="border-b border-border-default bg-surface-2">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">

        {/* Left: brand + nav links */}
        <nav className="flex items-center gap-6">
          <span
            className="mr-2 font-[family-name:var(--font-lora)]"
            style={{ fontSize: 17, fontWeight: 700, color: 'var(--action-primary)', letterSpacing: '-0.01em', lineHeight: 1 }}
          >
            {clubName}
          </span>
          {topLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                pathname === href
                  ? 'font-medium text-content-primary'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              {label}
            </Link>
          ))}

          {/* My Images dropdown */}
          <div className="relative" ref={myImgRef}>
            <button
              onClick={() => setMyImgOpen(o => !o)}
              className={`flex items-center gap-1 text-sm transition-colors ${
                isMyImagesActive
                  ? 'font-medium text-content-primary'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
              aria-expanded={myImgOpen}
            >
              My Images
              <svg className={`h-3 w-3 transition-transform ${myImgOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {myImgOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border-default bg-surface-2 shadow-lg">
                {myImagesLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMyImgOpen(false)}
                    className={`flex items-center px-4 py-2.5 text-sm transition-colors hover:bg-surface-1 ${
                      pathname === href ? 'font-medium text-content-primary' : 'text-content-secondary'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Competitions dropdown */}
          <div className="relative" ref={compRef}>
            <button
              onClick={() => setCompOpen(o => !o)}
              className={`flex items-center gap-1 text-sm transition-colors ${
                isCompActive
                  ? 'font-medium text-content-primary'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
              aria-expanded={compOpen}
            >
              Competitions
              <svg className={`h-3 w-3 transition-transform ${compOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {compOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border-default bg-surface-2 shadow-lg">
                {competitionsLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setCompOpen(false)}
                    className={`flex items-center px-4 py-2.5 text-sm transition-colors hover:bg-surface-1 ${
                      pathname === href || pathname.startsWith(href + '/')
                        ? 'font-medium text-content-primary'
                        : 'text-content-secondary'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Our Club dropdown */}
          <div className="relative" ref={ourClubRef}>
            <button
              onClick={() => setOurClubOpen(o => !o)}
              className={`flex items-center gap-1 text-sm transition-colors ${
                isOurClubActive
                  ? 'font-medium text-content-primary'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
              aria-expanded={ourClubOpen}
            >
              Our Club
              <svg className={`h-3 w-3 transition-transform ${ourClubOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {ourClubOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border-default bg-surface-2 shadow-lg">
                {ourClubLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOurClubOpen(false)}
                    className={`flex items-center px-4 py-2.5 text-sm transition-colors hover:bg-surface-1 ${
                      pathname === href || pathname.startsWith(href + '/')
                        ? 'font-medium text-content-primary'
                        : 'text-content-secondary'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>

        </nav>

        {/* Right: avatar + dropdown */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen(o => !o)}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-surface-1 transition-colors"
            aria-expanded={userOpen}
            aria-haspopup="true"
          >
            {/* Initials circle */}
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-action-primary text-xs font-bold text-white">
              {initials}
            </span>
            {/* Chevron */}
            <svg
              className={`h-3.5 w-3.5 text-content-tertiary transition-transform ${userOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-60 overflow-hidden rounded-xl border border-border-default bg-surface-2 shadow-lg">

              {/* User identity */}
              <div className="border-b border-border-subtle px-4 py-3">
                <p className="font-semibold text-content-primary">{displayName}</p>
                <p className="mt-0.5 text-sm text-content-secondary">{email}</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  href={`${base}/profile`}
                  onClick={() => setUserOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-content-primary hover:bg-surface-1 transition-colors"
                >
                  Profile
                </Link>

                {role === 'admin' && (
                  <Link
                    href={`${base}/admin`}
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-action-primary hover:bg-surface-1 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Admin
                  </Link>
                )}

                {/* Theme toggle */}
                <button
                  onClick={toggle}
                  className="flex w-full items-center justify-between px-4 py-2 text-sm text-content-primary hover:bg-surface-1 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                    {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                  </span>
                  {/* Toggle pill */}
                  <span className={`flex h-5 w-9 items-center rounded-full px-0.5 transition-colors ${theme === 'dark' ? 'bg-surface-1' : 'bg-surface-1'}`}>
                    <span className={`h-4 w-4 rounded-full bg-surface-2 shadow transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
                  </span>
                </button>

                <div className="my-1 border-t border-border-subtle" />

                <form action={logout}>
                  <button
                    type="submit"
                    className="flex w-full items-center px-4 py-2 text-sm text-content-secondary hover:bg-surface-1 transition-colors"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}

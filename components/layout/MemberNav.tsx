'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { logout } from '@/app/(auth)/actions'
import { useTheme } from './ThemeProvider'

// ── Icon components ────────────────────────────────────────────────────────────

function ImagesIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
function GalleriesIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )
}
function TrophyIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 21h8M12 17v4M12 17a5 5 0 005-5V5H7v7a5 5 0 005 5zM7 5H4.5A1.5 1.5 0 003 6.5v.5A3.5 3.5 0 006.5 10.5H7M17 5h2.5A1.5 1.5 0 0121 6.5v.5a3.5 3.5 0 01-3.5 3.5H17" />
    </svg>
  )
}
function ResultsIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}
function AboutIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}
function MembersIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function StandingsIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  )
}
function DocumentsIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg className={`h-3 w-3 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  )
}
function CustomPageIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
function ExternalLinkIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}


function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ── Shared dropdown panel style ────────────────────────────────────────────────

const PANEL_CLS = 'absolute left-0 top-full z-50 rounded-xl border border-border-default bg-surface-2 shadow-lg'
const ITEM_CLS  = 'flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-surface-1'
const ACTIVE_CLS = 'bg-[rgba(26,111,196,0.06)] dark:bg-[rgba(74,144,212,0.08)]'

// ── NavDropdown — generic hover-triggered dropdown ────────────────────────────

function NavDropdown({
  label,
  isActive,
  children,
}: {
  label: string
  isActive: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const onEnter = () => { clearTimeout(timerRef.current); setOpen(true) }
  const onLeave = () => { timerRef.current = setTimeout(() => setOpen(false), 80) }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors ${
          isActive
            ? 'font-semibold text-action-primary bg-[rgba(26,111,196,0.09)] dark:bg-[rgba(74,144,212,0.14)]'
            : 'font-medium text-content-secondary hover:text-content-primary hover:bg-surface-1'
        }`}
      >
        {label}
        <ChevronDown open={open} />
      </button>

      {open && (
        <div className={`${PANEL_CLS} w-52 mt-0`}>
          {/* Invisible bridge covers the gap between button bottom and panel top */}
          <div className="absolute -top-1.5 left-0 right-0 h-1.5" />
          <div className="py-1.5 overflow-hidden rounded-xl">{children}</div>
        </div>
      )}
    </div>
  )
}

// ── DropdownLink — item inside a dropdown ─────────────────────────────────────

function DropdownLink({
  href,
  label,
  icon,
  active,
  onClick,
}: {
  href: string
  label: string
  icon: React.ReactNode
  active: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${ITEM_CLS} ${active ? ACTIVE_CLS : ''}`}
    >
      <span className="text-content-tertiary">{icon}</span>
      <span className={`font-medium ${active ? 'text-action-primary' : 'text-content-primary'}`}>
        {label}
      </span>
    </Link>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

type NavCustomPage = {
  id: string
  title: string
  slug: string
  parent_system: string | null
  tab_id: string | null
  page_type: string
  external_url: string | null
  visibility: string
  sort_order: number
}
type NavCustomTab = { id: string; name: string; slug: string; sort_order: number }

function customPageHref(page: NavCustomPage): string {
  if (page.page_type === 'external_link') return page.external_url ?? '#'
  return `/p/${page.slug}`
}

export default function MemberNav({
  clubName,
  displayName,
  email,
  role,
  avatarUrl,
  customPages = [],
  customTabs  = [],
}: {
  clubName:     string
  displayName:  string
  email:        string
  role:         string | null
  avatarUrl:    string | null
  customPages?: NavCustomPage[]
  customTabs?:  NavCustomTab[]
}) {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  const initials = getInitials(displayName)

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <header className="sticky top-0 z-40 border-b border-border-default backdrop-blur-md bg-[rgba(245,245,245,0.82)] dark:bg-[rgba(30,30,30,0.85)]">
      <div className="mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4">

        {/* Left: camera icon + club name */}
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--action-primary)' }}>
            <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
            <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3h-15a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0zm12-1.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          <span className="whitespace-nowrap font-[family-name:var(--font-lora)] text-base font-bold" style={{ color: 'var(--action-primary)' }}>
            {clubName}
          </span>
        </div>

        {/* Center: nav links */}
        <nav className="flex items-center gap-1 whitespace-nowrap">

          {/* Home */}
          <Link href="/"
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${isActive('/', true) ? 'font-semibold text-action-primary bg-[rgba(26,111,196,0.09)] dark:bg-[rgba(74,144,212,0.14)]' : 'font-medium text-content-secondary hover:text-content-primary hover:bg-surface-1'}`}>
            Home
          </Link>

          {/* Calendar — plain link when no custom sub-pages, otherwise replaced by the dropdown below */}
          {!customPages.some(p => p.parent_system === 'calendar') && (
            <Link href="/calendar"
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${isActive('/calendar') ? 'font-semibold text-action-primary bg-[rgba(26,111,196,0.09)] dark:bg-[rgba(74,144,212,0.14)]' : 'font-medium text-content-secondary hover:text-content-primary hover:bg-surface-1'}`}>
              Calendar
            </Link>
          )}

          {/* Images ▾ */}
          <NavDropdown label="Images" isActive={isActive('/library')}>
            <DropdownLink href="/library"           label="My images" icon={<ImagesIcon />}   active={isActive('/library', true)} />
            <DropdownLink href="/library/galleries" label="Galleries" icon={<GalleriesIcon />} active={isActive('/library/galleries')} />
            {customPages.filter(p => p.parent_system === 'images').map(p => (
              <DropdownLink key={p.id} href={customPageHref(p)} label={p.title}
                icon={p.page_type === 'external_link' ? <ExternalLinkIcon /> : <CustomPageIcon />}
                active={isActive(`/p/${p.slug}`)} />
            ))}
          </NavDropdown>

          {/* Competitions ▾ */}
          <NavDropdown label="Competitions" isActive={isActive('/competitions')}>
            <DropdownLink href="/competitions"         label="Current" icon={<TrophyIcon />}  active={isActive('/competitions', true)} />
            <DropdownLink href="/competitions/results" label="Results" icon={<ResultsIcon />} active={isActive('/competitions/results')} />
            {customPages.filter(p => p.parent_system === 'competitions').map(p => (
              <DropdownLink key={p.id} href={customPageHref(p)} label={p.title}
                icon={p.page_type === 'external_link' ? <ExternalLinkIcon /> : <CustomPageIcon />}
                active={isActive(`/p/${p.slug}`)} />
            ))}
          </NavDropdown>

          {/* Our Club ▾ */}
          <NavDropdown label="Our Club" isActive={isActive('/our-club')}>
            <DropdownLink href="/our-club/about"             label="About our club"   icon={<AboutIcon />}     active={isActive('/our-club/about')} />
            <DropdownLink href="/our-club/members"           label="Member directory" icon={<MembersIcon />}   active={isActive('/our-club/members', true)} />
            <DropdownLink href="/our-club/members/standings" label="Standings"        icon={<StandingsIcon />} active={isActive('/our-club/members/standings')} />
            <DropdownLink href="/our-club/documents"         label="Documents"        icon={<DocumentsIcon />} active={isActive('/our-club/documents')} />
            {customPages.filter(p => p.parent_system === 'our-club').map(p => (
              <DropdownLink key={p.id} href={customPageHref(p)} label={p.title}
                icon={p.page_type === 'external_link' ? <ExternalLinkIcon /> : <CustomPageIcon />}
                active={isActive(`/p/${p.slug}`)} />
            ))}
          </NavDropdown>

          {/* Calendar custom sub-pages (only show if any) */}
          {customPages.some(p => p.parent_system === 'calendar') && (
            <NavDropdown label="Calendar" isActive={isActive('/calendar')}>
              <DropdownLink href="/calendar" label="Calendar" icon={<svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} active={isActive('/calendar', true)} />
              {customPages.filter(p => p.parent_system === 'calendar').map(p => (
                <DropdownLink key={p.id} href={customPageHref(p)} label={p.title}
                  icon={p.page_type === 'external_link' ? <ExternalLinkIcon /> : <CustomPageIcon />}
                  active={isActive(`/p/${p.slug}`)} />
              ))}
            </NavDropdown>
          )}

          {/* Custom tabs */}
          {customTabs.map(tab => {
            const tabPages = customPages.filter(p => p.tab_id === tab.id)
            if (tabPages.length === 0) return null
            return (
              <NavDropdown key={tab.id} label={tab.name} isActive={tabPages.some(p => isActive(`/p/${p.slug}`))}>
                {tabPages.map(p => (
                  <DropdownLink key={p.id} href={customPageHref(p)} label={p.title}
                    icon={p.page_type === 'external_link' ? <ExternalLinkIcon /> : <CustomPageIcon />}
                    active={isActive(`/p/${p.slug}`)} />
                ))}
              </NavDropdown>
            )
          })}

        </nav>

        {/* Right: avatar + dropdown */}
        <div className="flex justify-end">
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(o => !o)}
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-surface-1 transition-colors"
              aria-expanded={profileOpen}
              aria-haspopup="true"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={displayName} className="h-8 w-8 rounded-full object-cover border border-border-default" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-action-primary text-xs font-bold text-white flex-shrink-0">
                  {initials}
                </span>
              )}
              <svg className={`h-3.5 w-3.5 text-content-tertiary transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-60 overflow-hidden rounded-xl border border-border-default bg-surface-2 shadow-lg">
                <div className="border-b border-border-subtle px-4 py-3">
                  <p className="font-semibold text-content-primary">{displayName}</p>
                  <p className="mt-0.5 text-sm text-content-secondary">{email}</p>
                </div>
                <div className="py-1">
                  <Link href="/profile" onClick={() => setProfileOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-content-primary hover:bg-surface-1 transition-colors">
                    My Profile
                  </Link>
                  {role === 'admin' && (
                    <Link href="/admin" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-action-primary hover:bg-surface-1 transition-colors">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Admin
                    </Link>
                  )}
                  <button onClick={toggle}
                    className="flex w-full items-center justify-between px-4 py-2 text-sm text-content-primary hover:bg-surface-1 transition-colors">
                    <span className="flex items-center gap-2">
                      {theme === 'dark' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      )}
                      {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                    </span>
                    <span className={`flex h-5 w-9 items-center rounded-full px-0.5 transition-colors ${theme === 'dark' ? 'bg-surface-1' : 'bg-surface-1'}`}>
                      <span className={`h-4 w-4 rounded-full bg-surface-2 shadow transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
                    </span>
                  </button>
                  <div className="my-1 border-t border-border-subtle" />
                  <form action={logout}>
                    <button type="submit" className="flex w-full items-center px-4 py-2 text-sm text-content-secondary hover:bg-surface-1 transition-colors">
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  )
}

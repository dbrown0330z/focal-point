'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { logout } from '@/app/(auth)/actions'
import { useTheme } from './ThemeProvider'

const links = [
  { href: '/',             label: 'Home' },
  { href: '/calendar',     label: 'Calendar' },
  { href: '/library',      label: 'My Images' },
  { href: '/competitions', label: 'Competitions' },
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function MemberNav({
  displayName,
  email,
  role,
}: {
  displayName: string
  email: string
  role: string | null
}) {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  const initials = getInitials(displayName)

  return (
    <header className="border-b border-border-default bg-surface-2">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">

        {/* Left: brand + nav links */}
        <nav className="flex items-center gap-6">
          <span className="mr-2 text-sm font-semibold text-content-primary">
            Focal Point
          </span>
          {links.map(({ href, label }) => (
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
        </nav>

        {/* Right: avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-surface-1 transition-colors"
            aria-expanded={open}
            aria-haspopup="true"
          >
            {/* Initials circle */}
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-action-primary text-xs font-bold text-white">
              {initials}
            </span>
            {/* Chevron */}
            <svg
              className={`h-3.5 w-3.5 text-content-tertiary transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-60 overflow-hidden rounded-xl border border-border-default bg-surface-2 shadow-lg">

              {/* User identity */}
              <div className="border-b border-border-subtle px-4 py-3">
                <p className="font-semibold text-content-primary">{displayName}</p>
                <p className="mt-0.5 text-sm text-content-secondary">{email}</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-content-primary hover:bg-surface-1 transition-colors"
                >
                  Profile
                </Link>

                {role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
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

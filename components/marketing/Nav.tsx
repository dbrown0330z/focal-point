'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from './Logo'

const NAV_ITEMS = [
  { href: '/',         label: 'Home'     },
  { href: '/features', label: 'Features' },
  { href: '/pricing',  label: 'Pricing'  },
  { href: '/about',    label: 'About'    },
]

export function Nav() {
  const [open, setOpen] = useState(false)
  const pathname        = usePathname()

  return (
    <nav className="mkt-nav">
      <div className="mkt-wrap mkt-nav-inner">
        <Logo />
        <div className="mkt-nav-links">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={'mkt-nav-link' + (pathname === item.href ? ' active' : '')}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/pricing" className="mkt-btn mkt-btn-amber mkt-btn-sm" style={{ marginLeft: 12 }}>
            Start free trial
          </Link>
        </div>
        <button
          className="mkt-menu-toggle"
          aria-label="Menu"
          onClick={() => setOpen(o => !o)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open
              ? <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>
              : <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>}
          </svg>
        </button>
      </div>
      <div className={'mkt-mobile-sheet' + (open ? ' open' : '')}>
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={'mkt-nav-link' + (pathname === item.href ? ' active' : '')}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/pricing"
          className="mkt-btn mkt-btn-amber"
          style={{ marginTop: 8, justifyContent: 'center' }}
          onClick={() => setOpen(false)}
        >
          Start free trial
        </Link>
      </div>
    </nav>
  )
}

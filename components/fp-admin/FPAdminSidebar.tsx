'use client'

import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { fpAdminLogout } from '@/app/fp-admin/actions'

const NAV = [
  {
    href: '/fp-admin',
    exact: true,
    label: 'Dashboard',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: '/fp-admin/clubs',
    exact: false,
    label: 'Clubs',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
]

export default function FPAdminSidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  function active(href: string, exact: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="flex h-screen w-56 flex-col shrink-0" style={{ background: '#111827' }}>

      {/* Logo + label */}
      <div className="px-4 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <Image src="/fp-logo-dark.svg" alt="Focal Point" width={96} height={26} />
        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
           style={{ color: 'rgba(255,255,255,0.35)' }}>
          Admin Portal
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const isActive = active(item.href, item.exact)
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
              style={{
                background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.45)',
              }}
            >
              {item.icon}
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t px-2 py-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <form action={fpAdminLogout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}

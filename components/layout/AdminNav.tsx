'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/(auth)/actions'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/competitions', label: 'Competitions' },
  { href: '/admin/members', label: 'Members' },
  { href: '/admin/posts', label: 'Posts' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <nav className="flex items-center gap-6">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mr-2">
            Focal Point <span className="text-zinc-400 font-normal">Admin</span>
          </span>
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                pathname === href || (href !== '/admin' && pathname.startsWith(href))
                  ? 'font-medium text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <form action={logout}>
          <button type="submit" className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            Sign out
          </button>
        </form>
      </div>
    </header>
  )
}

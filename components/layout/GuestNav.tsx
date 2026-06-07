'use client'

import { useState } from 'react'
import Link from 'next/link'
import LoginModal from '@/components/home/LoginModal'

interface GuestNavProps {
  clubSlug: string
  clubName: string
}

export default function GuestNav({ clubSlug, clubName }: GuestNavProps) {
  const [loginOpen, setLoginOpen] = useState(false)
  const base = `/${clubSlug}`

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border-default backdrop-blur-md bg-[rgba(245,245,245,0.82)] dark:bg-[rgba(30,30,30,0.85)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">

          {/* Left: club name */}
          <Link
            href={base}
            className="flex items-center gap-2 transition-opacity hover:opacity-75"
            style={{ textDecoration: 'none' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--action-primary)' }}>
              <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
              <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3h-15a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0zm12-1.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            <span
              className="whitespace-nowrap font-[family-name:var(--font-lora)] text-base font-bold"
              style={{ color: 'var(--action-primary)' }}
            >
              {clubName}
            </span>
          </Link>

          {/* Right: Log in button */}
          <button
            onClick={() => setLoginOpen(true)}
            className="rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors"
            style={{
              border: '1.5px solid var(--action-secondary)',
              color: 'var(--action-secondary)',
              background: 'transparent',
            }}
          >
            Log in
          </button>

        </div>
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} clubSlug={clubSlug} />
    </>
  )
}

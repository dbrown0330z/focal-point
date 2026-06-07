'use client'

import { useState } from 'react'
import Link from 'next/link'
import LoginModal from './LoginModal'
import type { WelcomeContent } from '@/lib/homepage/types'

interface GuestWelcomeBlockProps {
  content:  WelcomeContent
  clubSlug: string
}

export default function GuestWelcomeBlock({ content, clubSlug }: GuestWelcomeBlockProps) {
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <>
      <div
        className="w-full border-b border-border-default"
        style={{ background: 'var(--surface-1)' }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:py-12">
          {/* Text */}
          <div className="max-w-xl">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{
                fontFamily: 'var(--font-lora, Lora, Georgia, serif)',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {content.heading}
            </h1>
            {content.body && (
              <p
                className="mt-2 text-base leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {content.body}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-shrink-0 items-center gap-3">
            <button
              onClick={() => setLoginOpen(true)}
              className="rounded-lg px-5 py-2 text-sm font-semibold transition-colors"
              style={{
                border: '1.5px solid var(--action-secondary)',
                color: 'var(--action-secondary)',
                background: 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--action-secondary-hover)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--action-secondary)')}
            >
              Log in
            </button>
            <Link
              href={content.ctaLink || `/${clubSlug}/apply`}
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{
                background: 'var(--action-primary)',
                boxShadow: 'var(--action-primary-shadow)',
              }}
            >
              {content.ctaLabel || 'Join the club'}
            </Link>
          </div>
        </div>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} clubSlug={clubSlug} />
    </>
  )
}

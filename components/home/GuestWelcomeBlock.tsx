'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LoginModal from './LoginModal'
import type { WelcomeContent } from '@/lib/homepage/types'

const HEADINGS = [
  'Every great shot starts somewhere.',
  'Photography is better with people.',
  'Shoot more. Learn more. Share more.',
  'Where photographers come to grow.',
  'Great photography. Great company.',
  'More than a club — a community of photographers.',
]

interface GuestWelcomeBlockProps {
  content:  WelcomeContent
  clubSlug: string
  clubName: string
}

export default function GuestWelcomeBlock({ content, clubSlug, clubName }: GuestWelcomeBlockProps) {
  const [loginOpen,    setLoginOpen]    = useState(false)
  const [headingIndex, setHeadingIndex] = useState(0)
  const [visible,      setVisible]      = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out, swap, fade in
      setVisible(false)
      setTimeout(() => {
        setHeadingIndex(i => (i + 1) % HEADINGS.length)
        setVisible(true)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Replace [Club Name] placeholder in body with the actual club name
  const bodyText = (content.body || '').replace(/\[Club Name\]/gi, clubName)

  return (
    <>
      <div
        className="w-full border-b border-border-default"
        style={{ background: 'var(--surface-1)' }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:py-12">

          {/* Text */}
          <div className="max-w-xl">
            <p
              style={{
                fontFamily:  'var(--font-lora, Lora, Georgia, serif)',
                fontSize:    '1.35rem',
                fontStyle:   'italic',
                fontWeight:  400,
                color:       'var(--text-primary)',
                lineHeight:  1.4,
                transition:  'opacity 0.4s ease',
                opacity:     visible ? 1 : 0,
                minHeight:   '2.1em',  // prevent layout shift during crossfade
              }}
            >
              {HEADINGS[headingIndex]}
            </p>
            {bodyText && (
              <p
                className="mt-3 text-base leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {bodyText}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-shrink-0 items-center gap-3">
            <button
              onClick={() => setLoginOpen(true)}
              className="rounded-lg px-5 py-2 text-sm font-semibold transition-colors"
              style={{
                border:     '1.5px solid var(--action-secondary)',
                color:      'var(--action-secondary)',
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
                boxShadow:  'var(--action-primary-shadow)',
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

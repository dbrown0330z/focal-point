'use client'

import { useState } from 'react'

type ClubInfo = {
  club_name:           string
  club_location:       string | null
  contact_email:       string | null
  website_url:         string | null
  facebook_url:        string | null
  instagram_url:       string | null
  annual_dues:         string | null
  join_fee:            string | null
  meeting_schedule:    string | null
  meeting_notes:       string | null
  founded_year:        number | null
  member_count_approx: number | null
  join_open:           boolean
}

// ── Ask for more info modal ───────────────────────────────────────────────────

function AskMoreInfoDialog({
  open,
  onClose,
  contactEmail,
  clubName,
}: {
  open: boolean
  onClose: () => void
  contactEmail: string | null
  clubName: string
}) {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [message, setMessage] = useState('')

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const to      = contactEmail ?? ''
    const subject = encodeURIComponent(`Question about ${clubName}`)
    const body    = encodeURIComponent(`Hi,\n\nMy name is ${name} (${email}).\n\n${message}\n\nThanks`)
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface-2 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ask-title"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="ask-title" className="text-base font-bold text-content-primary">Ask for more information</h2>
            <p className="mt-0.5 text-sm text-content-secondary">We&apos;ll open your email client with a pre-filled message.</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-content-tertiary hover:bg-surface-1 transition-colors"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-secondary">Your name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Jane Smith"
              className="w-full rounded-lg border border-border-default bg-surface-0 px-3 py-2 text-sm text-content-primary placeholder:text-content-hint focus:border-action-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-secondary">Your email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="jane@example.com"
              className="w-full rounded-lg border border-border-default bg-surface-0 px-3 py-2 text-sm text-content-primary placeholder:text-content-hint focus:border-action-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-secondary">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              placeholder="What would you like to know?"
              className="w-full rounded-lg border border-border-default bg-surface-0 px-3 py-2 text-sm text-content-primary placeholder:text-content-hint focus:border-action-primary focus:outline-none resize-none"
            />
          </div>
          {!contactEmail && (
            <p className="text-xs text-content-tertiary">
              No contact email has been set for this club yet.
            </p>
          )}
          <div className="mt-1 flex gap-3">
            <button
              type="submit"
              disabled={!contactEmail}
              className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--action-primary)' }}
            >
              Open email app
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{ border: '1.5px solid var(--action-secondary)', color: 'var(--action-secondary)' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Details panel row ─────────────────────────────────────────────────────────

function DetailRow({ icon, label, value, href, target }: {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
  target?: string
}) {
  return (
    <div className="flex gap-3 py-2.5">
      <span className="mt-0.5 shrink-0 text-content-tertiary">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-content-tertiary">{label}</p>
        {href ? (
          <a href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined}
            className="text-sm font-medium text-action-primary hover:underline break-all">
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium text-content-primary">{value}</p>
        )}
      </div>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-border-subtle" />
}

// ── Social icon buttons ────────────────────────────────────────────────────────

function InstagramIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function WebIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AboutClient({
  clubName,
  clubSlug,
  html,
  isLoggedIn,
  info,
}: {
  clubName:    string
  clubSlug:    string
  html:        string | null
  isLoggedIn:  boolean
  info:        ClubInfo
}) {
  const [askOpen, setAskOpen] = useState(false)

  const hasPanel =
    info.club_location || info.annual_dues || info.join_fee ||
    info.meeting_schedule || info.founded_year || info.member_count_approx ||
    info.contact_email || info.website_url || info.instagram_url || info.facebook_url

  return (
    <>
      <AskMoreInfoDialog
        open={askOpen}
        onClose={() => setAskOpen(false)}
        contactEmail={info.contact_email}
        clubName={clubName}
      />

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">

        {/* ── Left: prose content ─────────────────────────────────────────── */}
        <div className="min-w-0 flex-1">
          <div className="mb-8">
            <h1
              className="font-[family-name:var(--font-lora)] font-bold text-content-primary"
              style={{ fontSize: '28px', letterSpacing: '-0.02em', lineHeight: 1.25 }}
            >
              About our club
            </h1>
            <p
              className="mt-1 font-[family-name:var(--font-lora)] text-content-secondary"
              style={{ fontSize: '17px', fontWeight: 500 }}
            >
              {clubName}
            </p>
          </div>

          {html ? (
            <div className="about-page-content" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <div className="rounded-xl border border-border-default bg-surface-1 px-6 py-10 text-center">
              <p className="text-sm text-content-secondary">Club information coming soon. Check back later.</p>
            </div>
          )}
        </div>

        {/* ── Right: details panel ─────────────────────────────────────────── */}
        <aside className="w-full shrink-0 lg:w-72">
          <div className="rounded-xl border border-border-default bg-surface-1 p-5">

            {/* Membership header */}
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-content-tertiary">Club details</h2>

            {/* Established + member count */}
            {(info.founded_year || info.member_count_approx) && (
              <>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                  {info.founded_year && (
                    <span className="text-sm text-content-secondary">
                      Est. <span className="font-semibold text-content-primary">{info.founded_year}</span>
                    </span>
                  )}
                  {info.member_count_approx && (
                    <span className="text-sm text-content-secondary">
                      <span className="font-semibold text-content-primary">{info.member_count_approx}+</span> members
                    </span>
                  )}
                </div>
                <Divider />
              </>
            )}

            {/* Location */}
            {info.club_location && (
              <>
                <DetailRow
                  icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
                  label="Location"
                  value={info.club_location}
                />
                <Divider />
              </>
            )}

            {/* Meetings */}
            {info.meeting_schedule && (
              <>
                <DetailRow
                  icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}
                  label="Meetings"
                  value={info.meeting_schedule}
                />
                {info.meeting_notes && (
                  <p className="mb-2 ml-7 text-xs text-content-secondary leading-relaxed">{info.meeting_notes}</p>
                )}
                <Divider />
              </>
            )}

            {/* Dues */}
            {(info.annual_dues || info.join_fee) && (
              <>
                <div className="py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-content-tertiary">Membership</p>
                  {info.annual_dues && (
                    <div className="mt-1.5 flex items-baseline justify-between">
                      <span className="text-xs text-content-secondary">Annual dues</span>
                      <span className="text-sm font-semibold text-content-primary">{info.annual_dues}</span>
                    </div>
                  )}
                  {info.join_fee && (
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-xs text-content-secondary">Join fee</span>
                      <span className="text-sm font-semibold text-content-primary">{info.join_fee}</span>
                    </div>
                  )}
                </div>
                <Divider />
              </>
            )}

            {/* Contact email */}
            {info.contact_email && (
              <>
                <DetailRow
                  icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>}
                  label="Contact"
                  value={info.contact_email}
                  href={`mailto:${info.contact_email}`}
                />
                <Divider />
              </>
            )}

            {/* Links */}
            {(info.website_url || info.instagram_url || info.facebook_url) && (
              <div className="py-2.5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-content-tertiary">Links</p>
                <div className="flex flex-wrap gap-2">
                  {info.website_url && (
                    <a href={info.website_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-border-default px-3 py-1.5 text-xs font-medium text-content-secondary hover:border-border-strong hover:text-content-primary transition-colors">
                      <WebIcon /> Website
                    </a>
                  )}
                  {info.instagram_url && (
                    <a
                      href={info.instagram_url.startsWith('http') ? info.instagram_url : `https://instagram.com/${info.instagram_url}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-border-default px-3 py-1.5 text-xs font-medium text-content-secondary hover:border-border-strong hover:text-content-primary transition-colors">
                      <InstagramIcon /> Instagram
                    </a>
                  )}
                  {info.facebook_url && (
                    <a href={info.facebook_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-border-default px-3 py-1.5 text-xs font-medium text-content-secondary hover:border-border-strong hover:text-content-primary transition-colors">
                      <FacebookIcon /> Facebook
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* No panel data — filler for empty state */}
            {!hasPanel && (
              <p className="py-2 text-sm text-content-tertiary">Club details coming soon.</p>
            )}

            {/* CTAs */}
            <div className="mt-4 flex flex-col gap-2">
              {!isLoggedIn && info.join_open && (
                <a
                  href={`/${clubSlug}/apply`}
                  className="flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
                  style={{ background: 'var(--action-primary)' }}
                >
                  Apply for membership
                </a>
              )}
              {!isLoggedIn && !info.join_open && (
                <div className="rounded-lg border border-border-default px-4 py-2.5 text-center text-sm text-content-secondary">
                  Applications currently closed
                </div>
              )}
              <button
                onClick={() => setAskOpen(true)}
                className="flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                style={{ border: '1.5px solid var(--action-secondary)', color: 'var(--action-secondary)' }}
              >
                Ask for more info
              </button>
            </div>
          </div>
        </aside>

      </div>
    </>
  )
}

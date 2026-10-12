'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Reveal } from '@/components/marketing/Reveal'

// ── Data ─────────────────────────────────────────────────────────────────────

const TIERS = [
  {
    name: 'Starter',
    desc: 'For smaller clubs getting started',
    annualPrice: 149,
    monthlyPrice: 15,
    psaAnnual: 127,
    members: 'Up to 30',
    images: '1,500',
    storage: '25 GB',
    featured: false,
  },
  {
    name: 'Club',
    desc: 'The right fit for most active clubs',
    annualPrice: 279,
    monthlyPrice: 27,
    psaAnnual: 237,
    members: 'Up to 75',
    images: '4,000',
    storage: '65 GB',
    featured: true,
  },
  {
    name: 'Pro',
    desc: 'For larger clubs with active competition programs',
    annualPrice: 449,
    monthlyPrice: 44,
    psaAnnual: 382,
    members: 'Up to 150',
    images: '8,000',
    storage: '130 GB',
    featured: false,
  },
  {
    name: 'Unlimited',
    desc: 'For large clubs and federations',
    annualPrice: 699,
    monthlyPrice: 69,
    psaAnnual: 594,
    members: 'Up to 300',
    images: '15,000',
    storage: '250 GB',
    featured: false,
  },
]

const FEATURES = [
  {
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    title: 'Online judging portal',
    desc: 'Judges access via a secure link — no account needed. Score images in grid, single, or triage view.',
  },
  {
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
    title: 'Member management',
    desc: 'Onboarding, membership dues, skill levels, roles, and the full member lifecycle in one place.',
  },
  {
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
    title: 'Competition management',
    desc: 'Create competitions from templates, manage submissions, assign judges, and publish results automatically.',
  },
  {
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/></svg>,
    title: 'Club website',
    desc: 'A public-facing club site with a homepage builder, custom pages, member galleries, and a document library.',
  },
  {
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
    title: 'Standings & recognition',
    desc: 'Points of Year tracking, benchmark bands, awards, and a public leaderboard — all calculated automatically.',
  },
  {
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
    title: 'Automated email notifications',
    desc: 'Members and judges get the right emails at the right time — no manual chasing of submission deadlines.',
  },
]

const DIFFS = [
  {
    title: 'Judging is always included',
    desc: 'Online judging is a core feature of every Focal Point plan. There is no standard-vs-premium split that keeps judging behind a higher tier.',
  },
  {
    title: 'No overage charges',
    desc: "When you approach your storage or image limit, you'll see a clear in-app prompt to upgrade. You'll never be charged automatically for going over.",
  },
  {
    title: 'Billing stays with the club',
    desc: "Subscriptions are attached to the club account, not an individual. When your treasurer role changes, your plan doesn't need to follow them out the door.",
  },
  {
    title: 'Migration assistance included',
    desc: "Switching platforms is the part nobody wants to think about. We'll help you bring your competition history and member data across so nothing gets left behind.",
  },
]

const FAQ_ITEMS = [
  {
    q: 'What happens when my trial ends?',
    a: "Your club moves into read-only mode — everyone can still see your site and data, but no new competitions can be created and no images uploaded. Your data is preserved for 100 days. Subscribe at any time to reactivate immediately with everything intact.",
  },
  {
    q: 'Can I run Focal Point alongside our existing platform during the trial?',
    a: "Yes — and we encourage it. The 60-day trial is designed to give you time to run at least one or two full competitions on Focal Point while keeping your existing setup in place. Make a decision based on actual experience, not a demo.",
  },
  {
    q: 'Does the judging portal cost extra?',
    a: "No. Online judging is included in every Focal Point plan at no additional charge. Judges access the portal through a secure link — no account needed, and no per-judge or per-competition fees.",
  },
  {
    q: 'What happens if we exceed our image or storage limit?',
    a: "You'll see a clear in-app notice at 80% and again at 95%. There are no automatic overage charges. If you reach 100%, new uploads pause until you upgrade — existing data is never affected. Upgrading takes about 30 seconds.",
  },
  {
    q: 'How does the PSA member discount work?',
    a: "PSA-affiliated clubs receive 15% off all annual plans. Enter your PSA membership number at checkout. The discount applies on renewal as long as your PSA membership remains active.",
  },
  {
    q: 'Can we bring our history across from another platform?',
    a: "Migration assistance is included with every account. We'll help you import your member list and, where possible, historical competition data. Get in touch at hello@focalpointhq.com when you're ready.",
  },
]

// ── Icons ────────────────────────────────────────────────────────────────────

function IconCheck() {
  return (
    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  )
}

// ── Page component ────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [isMonthly, setIsMonthly] = useState(false)
  const [openFaq,   setOpenFaq]   = useState<number | null>(null)

  return (
    <div className="mkt-page" style={{ fontFamily: 'var(--sans)' }}>

      {/* ── Hero ── */}
      <section style={{ textAlign: 'center', padding: '72px 20px 56px', maxWidth: 720, margin: '0 auto' }}>
        <span style={{
          display: 'inline-block', fontSize: 12, fontWeight: 600,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--teal)', marginBottom: 16,
        }}>
          Pricing
        </span>
        <h1 style={{
          fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 5vw, 3.25rem)',
          fontWeight: 600, lineHeight: 1.15, margin: '0 0 20px', color: 'var(--ink)',
        }}>
          Everything your club needs.<br/>No surprises.
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--muted)', maxWidth: 560, margin: '0 auto 36px' }}>
          One plan level for every club size. Online judging, member management, and a beautiful club website — included at every tier.
        </p>

        {/* Hero CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <Link href="/start" className="mkt-btn mkt-btn-amber" style={{ fontSize: '1.0625rem', padding: '14px 36px', gap: 10 }}>
            <IconClock />
            Start your free 60-day trial
          </Link>
          <p style={{ fontSize: '.875rem', color: 'var(--muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--teal)', fontWeight: 700 }}>✓</span>
            No credit card required &nbsp;·&nbsp; Full access for 60 days &nbsp;·&nbsp; Cancel anytime
          </p>
        </div>

        {/* Billing toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <span
            onClick={() => setIsMonthly(false)}
            style={{ fontSize: '.9375rem', fontWeight: 500, cursor: 'pointer', color: isMonthly ? 'var(--muted)' : 'var(--ink)', transition: 'color .15s' }}
          >
            Annual
          </span>
          <button
            onClick={() => setIsMonthly(v => !v)}
            aria-label="Switch billing period"
            style={{
              position: 'relative', width: 52, height: 28,
              background: 'var(--teal)', borderRadius: 14, border: 'none',
              cursor: 'pointer', flexShrink: 0, transition: 'background .2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: 3, width: 22, height: 22,
              background: 'white', borderRadius: '50%',
              transition: 'transform .2s',
              transform: isMonthly ? 'translateX(24px)' : 'translateX(0)',
              display: 'block',
            }} />
          </button>
          <span
            onClick={() => setIsMonthly(true)}
            style={{ fontSize: '.9375rem', fontWeight: 500, cursor: 'pointer', color: isMonthly ? 'var(--ink)' : 'var(--muted)', transition: 'color .15s' }}
          >
            Monthly
          </span>
          {!isMonthly && (
            <span style={{
              fontSize: '.75rem', fontWeight: 600,
              background: 'var(--surface-teal)', color: 'var(--teal)',
              padding: '2px 8px', borderRadius: 12, whiteSpace: 'nowrap',
            }}>
              Save up to 18%
            </span>
          )}
        </div>
      </section>

      {/* ── Tier cards ── */}
      <section style={{ padding: '0 20px 24px', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 16,
        }}>
          {TIERS.map((tier) => (
            <Reveal key={tier.name}>
              <div style={{
                background: 'var(--paper-warm)',
                border: `1.5px solid ${tier.featured ? 'var(--teal)' : 'var(--rule)'}`,
                borderRadius: 12, padding: '28px 24px',
                display: 'flex', flexDirection: 'column', gap: 0,
                boxShadow: tier.featured
                  ? '0 2px 8px rgba(63,168,137,.15), 0 8px 32px rgba(63,168,137,.1)'
                  : '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)',
                position: 'relative',
              }}>
                {tier.featured && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--teal)', color: 'white',
                    fontSize: '.6875rem', fontWeight: 700, letterSpacing: '.08em',
                    textTransform: 'uppercase', padding: '3px 12px', borderRadius: 12,
                    whiteSpace: 'nowrap',
                  }}>
                    Most popular
                  </div>
                )}

                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', fontWeight: 600, margin: '0 0 4px', color: 'var(--ink)' }}>
                  {tier.name}
                </h3>
                <p style={{ fontSize: '.8125rem', color: 'var(--muted)', margin: '0 0 20px', minHeight: '2.6em' }}>
                  {tier.desc}
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: '2.25rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1 }}>
                    ${isMonthly ? tier.monthlyPrice : tier.annualPrice}
                  </span>
                  <span style={{ fontSize: '.875rem', color: 'var(--muted)' }}>
                    {isMonthly ? '/month' : '/year'}
                  </span>
                </div>
                <p style={{ fontSize: '.8rem', color: 'var(--muted)', margin: '0 0 4px' }}>
                  {isMonthly ? 'Billed monthly' : 'Billed annually'}
                </p>
                <p style={{ fontSize: '.8125rem', color: 'var(--teal)', fontWeight: 500, margin: '0 0 20px' }}>
                  PSA members: ${tier.psaAnnual}/yr
                </p>

                <hr style={{ border: 'none', borderTop: '1px solid var(--rule)', margin: '0 0 20px' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {[
                    { label: 'Members',      val: tier.members },
                    { label: 'Images/year',  val: tier.images },
                    { label: 'Storage',      val: tier.storage },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8125rem', gap: 8 }}>
                      <span style={{ color: 'var(--muted)' }}>{row.label}</span>
                      <span style={{ fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{row.val}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/start"
                  style={{
                    display: 'block', textAlign: 'center',
                    padding: '11px 16px', borderRadius: 7,
                    fontSize: '.9375rem', fontWeight: 600,
                    textDecoration: 'none', marginTop: 'auto',
                    border: tier.featured ? '1.5px solid var(--teal)' : '1.5px solid var(--rule)',
                    color: tier.featured ? 'white' : 'var(--ink)',
                    background: tier.featured ? 'var(--teal)' : 'transparent',
                    transition: 'background .15s, border-color .15s',
                  }}
                >
                  Start free trial
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        <p style={{
          textAlign: 'center', fontSize: '.875rem', color: 'var(--muted)',
          margin: '24px 0 64px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
          PSA member clubs save <strong style={{ color: 'var(--teal)', margin: '0 2px' }}>15%</strong> on all annual plans. Enter your PSA number at checkout.
        </p>
      </section>

      {/* ── What's included ── */}
      <section style={{ padding: '0 20px 72px', maxWidth: 1120, margin: '0 auto' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 12 }}>
          Included at every tier
        </p>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 600, textAlign: 'center', margin: '0 0 8px', color: 'var(--ink)' }}>
          Everything your club needs to run competitions professionally
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', maxWidth: 480, margin: '0 auto 40px', fontSize: '.9375rem' }}>
          No add-ons. No feature gates. No per-judge fees. All features are available from your first day.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {FEATURES.map((f) => (
            <Reveal key={f.title}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  flexShrink: 0, width: 36, height: 36, borderRadius: 8,
                  background: 'var(--surface-teal)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'var(--teal)', marginTop: 1,
                }}>
                  {f.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: '.9375rem', fontWeight: 600, margin: '0 0 3px', color: 'var(--ink)' }}>{f.title}</h4>
                  <p style={{ fontSize: '.8125rem', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Why Focal Point ── */}
      <section style={{ padding: '0 20px 72px', maxWidth: 1120, margin: '0 auto' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 12 }}>
          Why Focal Point
        </p>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 600, textAlign: 'center', margin: '0 0 8px', color: 'var(--ink)' }}>
          Built differently
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', maxWidth: 480, margin: '0 auto 40px', fontSize: '.9375rem' }}>
          A few things worth knowing before you compare.
        </p>

        <div style={{
          background: 'var(--paper-warm)', border: '1px solid var(--rule)',
          borderRadius: 14, padding: '48px 40px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px 48px' }}>
            {DIFFS.map((d) => (
              <div key={d.title}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 6px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--surface-teal)', color: 'var(--teal)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <IconCheck />
                  </span>
                  {d.title}
                </h4>
                <p style={{ fontSize: '.875rem', color: 'var(--muted)', margin: 0, lineHeight: 1.55 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trial CTA ── */}
      <section style={{ padding: '0 20px 72px', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{
          textAlign: 'center', background: 'var(--surface-teal)',
          border: '1px solid rgba(63,168,137,.25)', borderRadius: 16, padding: '56px 32px',
        }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 600, margin: '0 0 12px', color: 'var(--ink)' }}>
            Try Focal Point free for 60 days
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--muted)', maxWidth: 480, margin: '0 auto 32px' }}>
            Set up your club, run a competition, put your judge through their paces. No credit card, no commitment — just see if it works for you.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Link href="/start" className="mkt-btn mkt-btn-amber" style={{ fontSize: '1.0625rem', padding: '14px 40px', gap: 10 }}>
              <IconClock />
              Start your free trial
            </Link>
            <p style={{ fontSize: '.875rem', color: 'var(--muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ color: 'var(--teal)', fontWeight: 700 }}>✓</span> No credit card required &nbsp;·&nbsp;
              <span style={{ color: 'var(--teal)', fontWeight: 700 }}>✓</span> Full access for 60 days &nbsp;·&nbsp;
              <span style={{ color: 'var(--teal)', fontWeight: 700 }}>✓</span> Your data stays safe if you choose not to continue
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '0 20px 72px', maxWidth: 1120, margin: '0 auto' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 12 }}>
          FAQ
        </p>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 600, textAlign: 'center', margin: '0 0 8px', color: 'var(--ink)' }}>
          Common questions
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', maxWidth: 480, margin: '0 auto 32px', fontSize: '.9375rem' }}>
          Anything else, email us at <a href="mailto:hello@focalpointhq.com" style={{ color: 'var(--teal)' }}>hello@focalpointhq.com</a>
        </p>

        <div style={{
          maxWidth: 720, margin: '0 auto',
          border: '1px solid var(--rule)', borderRadius: 12, overflow: 'hidden',
        }}>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} style={{ borderBottom: i < FAQ_ITEMS.length - 1 ? '1px solid var(--rule)' : 'none' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%', background: 'none', border: 'none',
                  textAlign: 'left', padding: '20px 24px',
                  fontSize: '.9375rem', fontWeight: 500, color: 'var(--ink)',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', gap: 16,
                  transition: 'background .1s',
                }}
              >
                <span>{item.q}</span>
                <span style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                  border: '1.5px solid var(--rule)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: openFaq === i ? 'var(--ink)' : 'transparent',
                  color: openFaq === i ? 'white' : 'var(--muted)',
                  transition: 'transform .2s, background .15s',
                  transform: openFaq === i ? 'rotate(45deg)' : 'none',
                  fontSize: 18, lineHeight: 1,
                }}>
                  +
                </span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 24px 20px', fontSize: '.875rem', color: 'var(--muted)', lineHeight: 1.65 }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer note */}
      <p style={{ textAlign: 'center', paddingBottom: 56, fontSize: '.875rem', color: 'var(--muted)' }}>
        Questions? Email{' '}
        <a href="mailto:hello@focalpointhq.com" style={{ color: 'var(--teal)' }}>hello@focalpointhq.com</a>
        {' '}&nbsp;·&nbsp; All prices in USD &nbsp;·&nbsp; Annual plans renew with 30 days advance notice
      </p>

    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SectionHeader } from '@/components/marketing/SectionHeader'
import { Reveal } from '@/components/marketing/Reveal'
import { BigCTA } from '@/components/marketing/BigCTA'
import { IconCheck, IconArrow, IconPlus } from '@/components/marketing/Icons'

const FREE_FEATURES = [
  'Up to 25 members',
  '3 competitions per year',
  'Image library (50 images/member)',
  'Basic judge portal',
  'Club announcements',
  'Email support',
]

const STANDARD_FEATURES = [
  'Unlimited members',
  'Unlimited competitions',
  'Unlimited image storage',
  'Full judge portal with magic links',
  'Events & field trips calendar',
  'Multi-round judging',
  'Automated scoring & results',
  'PDF & CSV exports',
  'Priority support',
]

const PRO_FEATURES = [
  'Everything in Standard',
  'Multiple clubs / chapters',
  'Custom domain',
  'White-label branding',
  'API access',
  'Dedicated onboarding',
  'SLA guarantee',
  'Custom integrations',
]

const FAQ_ITEMS = [
  {
    q: 'What happens after the 30-day trial?',
    a: "Your club keeps access to everything you've set up. At the end of the trial you choose a plan — or we'll help you figure out if Focal Point is the right fit. We won't charge you without warning.",
  },
  {
    q: 'Do judges need an account?',
    a: "No. Judges receive a magic link scoped to a single competition. They click, they judge, they're done. The link expires automatically when the competition closes. No passwords, no accounts, no friction.",
  },
  {
    q: 'Can I migrate from another platform?',
    a: "Yes — we'll help. We have import tools for common formats and a migration team ready to assist. Most clubs are fully onboarded within a week. Bring your member list, competition history, and images.",
  },
  {
    q: 'Is there a per-member fee?',
    a: "No. All plans are flat-rate per club. You can have 200 members on the Standard plan at the same price as 20. The only limit on the Free plan is a 25-member cap.",
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards and can issue invoices for annual billing. Non-profit clubs can ask about our discounted rates.',
  },
  {
    q: 'Can I cancel or change plans at any time?',
    a: 'Yes. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period. No cancellation fees, ever.',
  },
]

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="mkt-page">

      {/* ── HEADER ── */}
      <section className="mkt-band" style={{ paddingBottom: 64 }}>
        <div className="mkt-wrap">
          <SectionHeader
            kicker="Pricing"
            kickerColor="#E26A3E"
            title={<>Simple pricing. <em style={{ color: '#E26A3E' }}>No surprises.</em></>}
            lead="One flat price per club. No per-member fees. No feature gates. Everything your club needs to run smoothly — from the first competition to the hundredth."
            align="center"
          />
        </div>
      </section>

      {/* ── PRICING CARDS ── */}
      <section style={{ paddingBottom: 80 }}>
        <div className="mkt-wrap">
          <div className="mkt-grid-3" style={{ alignItems: 'start', gap: 20 }}>

            {/* Free Trial */}
            <Reveal>
              <div className="mkt-price-card">
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                    Free Trial
                  </div>
                  <div className="mkt-price-amt">
                    $0<small>/ 30 days</small>
                  </div>
                </div>
                <p style={{ color: 'var(--ink-soft)', fontSize: 15, margin: 0 }}>
                  Everything you need to evaluate Focal Point. No card required. No commitment.
                </p>
                <div style={{ height: 1, background: 'var(--rule)' }} />
                <div style={{ display: 'grid', gap: 10 }}>
                  {FREE_FEATURES.map((f, i) => (
                    <div key={i} className="mkt-feat-row">
                      <span className="mkt-check"><IconCheck /></span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/pricing" className="mkt-btn mkt-btn-ghost" style={{ justifyContent: 'center' }}>
                  Start free trial
                </Link>
              </div>
            </Reveal>

            {/* Standard — featured */}
            <Reveal delay={60}>
              <div className="mkt-price-card featured" style={{ marginTop: -8 }}>
                <span className="badge">Most popular</span>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>
                    Standard
                  </div>
                  <div className="mkt-price-amt">
                    $49<small>/ month</small>
                  </div>
                </div>
                <p style={{ color: 'rgba(232,226,211,0.80)', fontSize: 15, margin: 0 }}>
                  The complete Focal Point experience for active clubs running regular competitions.
                </p>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.12)' }} />
                <div style={{ display: 'grid', gap: 10 }}>
                  {STANDARD_FEATURES.map((f, i) => (
                    <div key={i} className="mkt-feat-row">
                      <span className="mkt-check"><IconCheck /></span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/pricing" className="mkt-btn mkt-btn-amber" style={{ justifyContent: 'center' }}>
                  Start free trial <IconArrow />
                </Link>
              </div>
            </Reveal>

            {/* Club Pro */}
            <Reveal delay={120}>
              <div className="mkt-price-card">
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                    Club Pro
                  </div>
                  <div className="mkt-price-amt">
                    $149<small>/ month</small>
                  </div>
                </div>
                <p style={{ color: 'var(--ink-soft)', fontSize: 15, margin: 0 }}>
                  For multi-chapter organizations, federations, and clubs that need enterprise features.
                </p>
                <div style={{ height: 1, background: 'var(--rule)' }} />
                <div style={{ display: 'grid', gap: 10 }}>
                  {PRO_FEATURES.map((f, i) => (
                    <div key={i} className="mkt-feat-row">
                      <span className="mkt-check"><IconCheck /></span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/about" className="mkt-btn mkt-btn-ghost" style={{ justifyContent: 'center' }}>
                  Talk to us
                </Link>
              </div>
            </Reveal>

          </div>

          {/* Assurance row */}
          <Reveal delay={80}>
            <div style={{
              marginTop: 40,
              border: '1.5px dashed var(--rule)',
              borderRadius: 12,
              padding: '20px 28px',
              display: 'flex',
              justifyContent: 'space-around',
              flexWrap: 'wrap',
              gap: 16,
            }}>
              {[
                { t: '30-day free trial',       d: 'No card required' },
                { t: 'Cancel any time',          d: 'No lock-in, ever' },
                { t: 'Migration assistance',     d: "We'll move your data" },
                { t: 'Non-profit discounts',     d: 'Ask us about rates' },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{item.t}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', letterSpacing: '0.08em', marginTop: 4 }}>{item.d}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mkt-band" style={{ background: 'var(--surface-rose)' }}>
        <div className="mkt-wrap">
          <SectionHeader
            kicker="FAQ"
            kickerColor="#C9436F"
            title={<>Questions? <em style={{ color: '#C9436F' }}>We&apos;ve got you.</em></>}
            align="center"
          />
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div className="mkt-acc">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className={'mkt-acc-item' + (openFaq === i ? ' open' : '')}>
                  <button
                    className="mkt-acc-q"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{item.q}</span>
                    <span className="mkt-acc-toggle">
                      <IconPlus />
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="mkt-acc-a">{item.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <BigCTA />
    </div>
  )
}

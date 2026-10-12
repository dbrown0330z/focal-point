'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SectionHeader } from '@/components/marketing/SectionHeader'
import { Reveal } from '@/components/marketing/Reveal'
import { BigCTA } from '@/components/marketing/BigCTA'
import { IconCheck } from '@/components/marketing/Icons'

// ── Data ─────────────────────────────────────────────────────────────────────

const TIERS = [
  {
    name:     'Starter',
    desc:     'For smaller clubs getting started',
    price:    149,
    psa:      127,
    members:  'Up to 30',
    images:   '1,500 / year',
    storage:  '25 GB',
    featured: false,
  },
  {
    name:     'Club',
    desc:     'The right fit for most active clubs',
    price:    279,
    psa:      237,
    members:  'Up to 75',
    images:   '4,000 / year',
    storage:  '65 GB',
    featured: true,
  },
  {
    name:     'Pro',
    desc:     'For larger clubs with active competition programs',
    price:    449,
    psa:      382,
    members:  'Up to 150',
    images:   '8,000 / year',
    storage:  '130 GB',
    featured: false,
  },
  {
    name:     'Unlimited',
    desc:     'For large clubs and federations',
    price:    699,
    psa:      594,
    members:  'Up to 300',
    images:   '15,000 / year',
    storage:  '250 GB',
    featured: false,
  },
]

const ALL_FEATURES = [
  'Online judging portal — judges need no account',
  'Member management and onboarding',
  'Unlimited competitions and categories',
  'Blind scoring with multi-round support',
  'Automated results, standings, and awards',
  'Club website with public-facing pages',
  'Member image library and galleries',
  'Events and calendar',
  'Document library',
  'Automated email notifications',
  'PDF and CSV result exports',
  'Migration assistance included',
]

const DIFFS = [
  {
    title: 'Judging is always included',
    desc:  'Online judging is a core feature at every tier — no standard-vs-premium split, no per-judge fees.',
  },
  {
    title: 'No overage charges',
    desc:  "You'll see a clear in-app prompt at 80% and 95% of your limit. You're never automatically billed for going over.",
  },
  {
    title: 'Billing stays with the club',
    desc:  "Subscriptions are attached to the club account, not an individual. A change of treasurer doesn't affect your plan.",
  },
  {
    title: 'Migration assistance included',
    desc:  "We'll help you bring your member list and competition history across. Nothing left behind.",
  },
]

const FAQ_ITEMS = [
  {
    q: 'What happens when my trial ends?',
    a: "Your club moves into read-only mode — everyone can still see the site and existing data, but no new competitions can be created and no images uploaded. Your data is preserved for 100 days. Subscribe at any time to reactivate immediately with everything intact.",
  },
  {
    q: 'Can I run Focal Point alongside our existing platform during the trial?',
    a: "Yes — and we encourage it. The 60-day trial is designed to let you run at least one or two full competitions while keeping your existing setup in place. Make a decision based on actual experience, not a demo.",
  },
  {
    q: 'Does the judging portal cost extra?',
    a: "No. Online judging is included at every tier. Judges access the portal through a secure link — no account needed, and no per-judge or per-competition fees.",
  },
  {
    q: 'What happens if we exceed our image or storage limit?',
    a: "You'll see a clear notice at 80% and again at 95%. There are no automatic overage charges. If you reach 100%, new uploads pause until you upgrade — existing data is never affected. Upgrading takes about 30 seconds.",
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="mkt-page">

      {/* ── Hero ── */}
      <section className="mkt-band" style={{ paddingBottom: 64 }}>
        <div className="mkt-wrap" style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <SectionHeader
            kicker="Pricing"
            kickerColor="var(--teal)"
            title="Everything your club needs. No surprises."
            lead="All features are available at every tier — the only difference is how many members and images your plan supports. Pick the size that fits your club."
            align="center"
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 36 }}>
            <Link href="/start" className="mkt-btn mkt-btn-amber" style={{ fontSize: 16, padding: '13px 36px' }}>
              Start your free 60-day trial
            </Link>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>
              No credit card required &nbsp;·&nbsp; Full access for 60 days &nbsp;·&nbsp; Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* ── Tier cards ── */}
      <section style={{ padding: '0 var(--gutter) 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* "All features, any plan" callout */}
          <Reveal>
            <div style={{
              textAlign: 'center', marginBottom: 32,
              padding: '16px 24px', borderRadius: 10,
              background: 'var(--surface-teal)',
              border: '1px solid rgba(63,168,137,0.2)',
            }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'var(--ink-soft)' }}>
                <span style={{ color: 'var(--teal)', fontWeight: 700 }}>Every feature</span> is included at every tier.
                Plans differ only in member count, image allowance, and storage.
              </p>
            </div>
          </Reveal>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 20,
          }}>
            {TIERS.map((tier) => (
              <Reveal key={tier.name}>
                <div className={tier.featured ? 'mkt-price-card featured' : 'mkt-price-card'} style={{
                  border: tier.featured ? '2px solid var(--teal)' : undefined,
                  boxShadow: tier.featured
                    ? '0 2px 8px rgba(63,168,137,.18), 0 8px 32px rgba(63,168,137,.10)'
                    : undefined,
                }}>
                  {tier.featured && <span className="badge">Most popular</span>}

                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: tier.featured ? 'rgba(255,255,255,0.55)' : 'var(--muted)', marginBottom: 6 }}>
                    {tier.name}
                  </div>
                  <p style={{ fontSize: 13, color: tier.featured ? 'rgba(232,226,211,0.75)' : 'var(--muted)', margin: '0 0 16px', minHeight: '2.5em' }}>
                    {tier.desc}
                  </p>

                  <div className="mkt-price-amt" style={{ marginBottom: 4 }}>
                    ${tier.price}<small>/year</small>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 500, margin: '0 0 20px', fontFamily: 'var(--mono)' }}>
                    PSA members: ${tier.psa}/yr
                  </p>

                  <div style={{ height: 1, background: tier.featured ? 'rgba(255,255,255,0.12)' : 'var(--rule)', margin: '0 0 20px' }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                    {[
                      { label: 'Members',  val: tier.members },
                      { label: 'Images',   val: tier.images  },
                      { label: 'Storage',  val: tier.storage },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, gap: 8 }}>
                        <span style={{ color: tier.featured ? 'rgba(255,255,255,0.5)' : 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>{row.label}</span>
                        <span style={{ fontWeight: 600, color: tier.featured ? 'var(--paper)' : 'var(--ink)', whiteSpace: 'nowrap' }}>{row.val}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/start"
                    className={tier.featured ? 'mkt-btn mkt-btn-amber' : 'mkt-btn mkt-btn-ghost'}
                    style={{ justifyContent: 'center', marginTop: 'auto' }}
                  >
                    Start free trial
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          <p style={{
            textAlign: 'center', fontSize: 13, color: 'var(--muted)',
            margin: '0 0 72px', fontFamily: 'var(--mono)', letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            ★ PSA member clubs save <strong style={{ color: 'var(--teal)' }}>15%</strong> on all annual plans — enter your PSA number at checkout.
          </p>
        </div>
      </section>

      {/* ── What's included ── */}
      <section className="mkt-band" style={{ background: 'var(--paper-warm)' }}>
        <div className="mkt-wrap" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionHeader
            kicker="Included at every tier"
            kickerColor="var(--teal)"
            title="Every feature. Every plan."
            lead="There are no feature gates between tiers. Every club gets the full Focal Point platform — the only thing that changes is capacity."
            align="center"
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '10px 32px',
            maxWidth: 900, margin: '0 auto',
          }}>
            {ALL_FEATURES.map((f) => (
              <div key={f} className="mkt-feat-row" style={{ fontSize: 15 }}>
                <span className="mkt-check"><IconCheck /></span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Focal Point ── */}
      <section className="mkt-band">
        <div className="mkt-wrap" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionHeader
            kicker="Why Focal Point"
            kickerColor="var(--teal)"
            title="Built differently"
            lead="A few things worth knowing before you compare."
            align="center"
          />
          <Reveal>
            <div style={{
              background: 'var(--paper-warm)', border: '1.5px solid var(--rule)',
              borderRadius: 14, padding: '44px 40px',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '32px 48px',
            }}>
              {DIFFS.map((d) => (
                <div key={d.title}>
                  <h4 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'var(--surface-teal)', color: 'var(--teal)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <IconCheck />
                    </span>
                    {d.title}
                  </h4>
                  <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>{d.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mkt-band" style={{ background: 'var(--surface-teal)' }}>
        <div className="mkt-wrap" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionHeader
            kicker="FAQ"
            kickerColor="var(--teal)"
            title="Common questions"
            lead={<>Anything else, email us at <a href="mailto:hello@focalpointhq.com" style={{ color: 'var(--teal)' }}>hello@focalpointhq.com</a></>}
            align="center"
          />
          <div className="mkt-acc" style={{ maxWidth: 780, margin: '0 auto' }}>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className={'mkt-acc-item' + (openFaq === i ? ' open' : '')}>
                <button className="mkt-acc-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{item.q}</span>
                  <span className="mkt-acc-toggle">+</span>
                </button>
                {openFaq === i && <div className="mkt-acc-a">{item.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <BigCTA />

      {/* Footer note */}
      <p style={{ textAlign: 'center', padding: '0 20px 48px', fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>
        All prices in USD &nbsp;·&nbsp; Annual plans renew automatically with 30 days advance notice &nbsp;·&nbsp;{' '}
        <a href="mailto:hello@focalpointhq.com" style={{ color: 'var(--teal)' }}>hello@focalpointhq.com</a>
      </p>
    </div>
  )
}

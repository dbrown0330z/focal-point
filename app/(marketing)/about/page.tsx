import { IrisApertureLogo } from '@/components/marketing/IrisApertureLogo'
import { SectionHeader } from '@/components/marketing/SectionHeader'
import { Reveal } from '@/components/marketing/Reveal'
import { BigCTA } from '@/components/marketing/BigCTA'
import { IconSparkle, IconUsers, IconStar } from '@/components/marketing/Icons'
import { ContactForm } from './ContactForm'

const VALUES = [
  {
    icon: IconSparkle,
    color: '#E26A3E',
    title: 'Craft over complexity',
    body: "Photography is about seeing, not administrating. We make the management invisible so the creative work stays front and centre. If a feature makes the product feel heavier, we don't ship it.",
  },
  {
    icon: IconUsers,
    color: '#3F7FB8',
    title: 'Clubs are communities',
    body: "The best camera clubs aren't just about the images — they're about the people. Focal Point supports the social structure of clubs: roles, trust, shared history, and recognition. We build for that.",
  },
  {
    icon: IconStar,
    color: '#3FA889',
    title: 'Obvious beats clever',
    body: "Every person who uses Focal Point learned photography, not software. We design for that. Clear language, predictable interactions, zero learning curve. If it needs a manual, we redesign it.",
  },
]


export default function AboutPage() {
  return (
    <div className="mkt-page">

      {/* ── ORIGIN ── */}
      <section className="mkt-band">
        <div className="mkt-wrap">
          <div className="mkt-grid-2" style={{ gap: 64 }}>
            <Reveal>
              <div>
                <div className="mkt-kicker" style={{ marginBottom: 18 }}>
                  <span className="mkt-kicker-dot" />
                  Our story
                </div>
                <h2 className="mkt-display" style={{ marginBottom: 24 }}>
                  Built by people who <em style={{ color: '#C9436F' }}>actually shoot.</em>
                </h2>
                <div style={{ display: 'grid', gap: 18, color: 'var(--ink-soft)', fontSize: 17 }}>
                  <p style={{ margin: 0 }}>
                    Focal Point started as a frustration. Running the monthly competition for a camera club of
                    sixty members meant spreadsheets, email chains, and a folder full of manually renamed JPEG files.
                    After the third year of the same mess, we decided to build something better.
                  </p>
                  <p style={{ margin: 0 }}>
                    What started as a personal project became a platform when other club admins started asking
                    for access. The problem wasn&apos;t unique — every camera club runs the same workarounds,
                    just in different spreadsheets.
                  </p>
                  <p style={{ margin: 0 }}>
                    Focal Point is built and run from New Hampshire. It&apos;s a small operation, which means
                    every conversation with a club actually matters, every piece of feedback lands directly
                    with the people who can act on it, and nothing gets lost in a ticket queue.
                  </p>
                  <p style={{ margin: 0 }}>
                    Small, independent, and happy about both.
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                {/* bokeh halos */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `
                    radial-gradient(circle at 30% 20%, rgba(201,67,111,0.30) 0 6%, transparent 12%),
                    radial-gradient(circle at 70% 75%, rgba(63,168,137,0.30) 0 6%, transparent 12%),
                    radial-gradient(circle at 80% 25%, rgba(232,177,74,0.35) 0 5%, transparent 10%),
                    radial-gradient(circle at 20% 70%, rgba(63,127,184,0.30) 0 5%, transparent 10%)
                  `,
                  filter: 'blur(8px)',
                  zIndex: 0,
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <IrisApertureLogo size={360} />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="mkt-band" style={{ background: 'var(--surface-blue)' }}>
        <div className="mkt-wrap">
          <SectionHeader
            kicker="What we believe"
            kickerColor="#3F7FB8"
            title={<>Three things we <em style={{ color: '#3F7FB8' }}>never compromise on.</em></>}
            align="center"
          />
          <div className="mkt-grid-3">
            {VALUES.map((v, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="mkt-value-card" style={{ background: 'var(--paper-warm)' }}>
                  <div style={{ color: v.color, marginBottom: 16 }}><v.icon /></div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: 24, margin: '0 0 12px', lineHeight: 1.15 }}>{v.title}</h3>
                  <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.6 }}>{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO WE ARE ── */}
      <section className="mkt-band">
        <div className="mkt-wrap">
          <Reveal>
            <div style={{
              background: 'var(--paper-warm)', border: '1.5px solid var(--rule)',
              borderRadius: 16, padding: '52px 56px',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '40px 64px', alignItems: 'center',
            }}>
              <div>
                <div className="mkt-kicker" style={{ marginBottom: 18 }}>
                  <span className="mkt-kicker-dot" style={{ background: '#E26A3E' }} />
                  Who&apos;s building this
                </div>
                <h2 className="mkt-display" style={{ marginBottom: 20 }}>
                  Small team. <em style={{ color: '#E26A3E' }}>Real photographers.</em>
                </h2>
                <div style={{ display: 'grid', gap: 16, color: 'var(--ink-soft)', fontSize: 16 }}>
                  <p style={{ margin: 0 }}>
                    Focal Point is built by a small team based in New Hampshire. We shoot,
                    we&apos;ve run clubs, and we know exactly how much a well-run monthly competition
                    matters to a membership.
                  </p>
                  <p style={{ margin: 0 }}>
                    Being small means we move fast, stay close to the clubs using the product,
                    and never lose sight of why we built this in the first place.
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 20 }}>
                {[
                  { label: 'Based in',   value: 'New Hampshire, USA' },
                  { label: 'Founded',    value: '2024' },
                  { label: 'What we do', value: 'Build tools. Run competitions. Make images.' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ borderTop: '1px solid var(--rule)', paddingTop: 16 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="mkt-band" style={{ background: 'var(--surface-amber)' }}>
        <div className="mkt-wrap">
          <div className="mkt-grid-2" style={{ gap: 64, alignItems: 'start' }}>
            <Reveal>
              <div>
                <div className="mkt-kicker" style={{ marginBottom: 18 }}>
                  <span className="mkt-kicker-dot" style={{ background: '#E8B14A' }} />
                  Get in touch
                </div>
                <h2 className="mkt-display" style={{ marginBottom: 24 }}>
                  We answer <em style={{ color: '#E26A3E' }}>real emails.</em>
                </h2>
                <p style={{ color: 'var(--ink-soft)', fontSize: 17, marginBottom: 32 }}>
                  We&apos;re a small team with a real commitment to every club that uses Focal Point.
                  Drop us a line — we&apos;re usually back within a few hours.
                </p>
                <div style={{ display: 'grid', gap: 20 }}>
                  {[
                    { label: 'Support', email: 'support@focalpoint.club',  note: 'Help with your account or club setup' },
                    { label: 'Sales',   email: 'hello@focalpoint.club',    note: 'Questions about plans, pricing, or trials' },
                    { label: 'Press',   email: 'press@focalpoint.club',    note: 'Media kit and interview requests' },
                  ].map((c, i) => (
                    <div key={i}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>{c.label}</div>
                      <a href={`mailto:${c.email}`} style={{ fontWeight: 600, fontSize: 17, color: 'var(--ink)', textDecoration: 'none' }}>{c.email}</a>
                      <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 2 }}>{c.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <ContactForm />
          </div>
        </div>
      </section>

      <BigCTA />
    </div>
  )
}

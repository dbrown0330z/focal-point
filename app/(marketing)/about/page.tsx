import { IrisApertureLogo } from '@/components/marketing/IrisApertureLogo'
import { SectionHeader } from '@/components/marketing/SectionHeader'
import { Reveal } from '@/components/marketing/Reveal'
import { BigCTA } from '@/components/marketing/BigCTA'
import { IconSparkle, IconUsers, IconStar, IconPlus } from '@/components/marketing/Icons'
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

const TEAM = [
  { name: 'David Brown',     role: 'Founder & Engineer',    palette: ['#2B2218', '#E26A3E', '#E8B14A'] },
  { name: 'Marguerite Loh',  role: 'Design & UX',           palette: ['#3A1A22', '#C9436F', '#F5D2DB'] },
  { name: 'David Okafor',    role: 'Community & Clubs',     palette: ['#1B2A20', '#3FA889', '#CBE7DA'] },
  { name: 'Aiko Pereira',    role: 'Customer Success',      palette: ['#0D2433', '#3F7FB8', '#9DC4E5'] },
  { name: 'Jonas Henrik',    role: 'Infrastructure',        palette: ['#26143A', '#7A4DAA', '#D8C9EA'] },
  { name: 'Sara Nakamura',   role: 'Product',               palette: ['#1F1A12', '#806749', '#E5D8B5'] },
  { name: 'Rafi Abdi',       role: 'Photography & Testing', palette: ['#1E2B27', '#3FA889', '#E8B14A'] },
  { name: 'Cleo Martins',    role: 'Marketing & Growth',    palette: ['#2B1422', '#AD1457', '#F4D8DD'] },
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
                    for access. We realized the problem wasn&apos;t unique — every camera club in the world was
                    solving the same problem with the same workarounds.
                  </p>
                  <p style={{ margin: 0 }}>
                    Today Focal Point is used by clubs across North America, Europe, and Australia.
                    The product is shaped entirely by the clubs who use it. We listen to every conversation,
                    take every competition season as a test, and ship improvements fast.
                  </p>
                  <p style={{ margin: 0 }}>
                    We&apos;re small, independent, and very happy about both of those things.
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

      {/* ── TEAM ── */}
      <section className="mkt-band">
        <div className="mkt-wrap">
          <SectionHeader
            kicker="The team"
            title={<>Small team. <em style={{ color: '#E26A3E' }}>Big opinions about photography.</em></>}
            lead="Everyone at Focal Point either shoots or has run a camera club. Usually both."
          />
          <div className="mkt-grid-4">
            {TEAM.map((person, i) => (
              <Reveal key={i} delay={i * 40}>
                <div className="mkt-card" style={{ padding: 20 }}>
                  <div style={{
                    aspectRatio: '1',
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${person.palette.join(', ')})`,
                    marginBottom: 14,
                  }} />
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{person.name}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', marginTop: 4 }}>{person.role}</div>
                </div>
              </Reveal>
            ))}
            <Reveal delay={TEAM.length * 40}>
              <div className="mkt-card" style={{ padding: 20, borderStyle: 'dashed', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', minHeight: 180 }}>
                <div style={{ color: 'var(--muted)', marginBottom: 12 }}><IconPlus /></div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Join us</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', marginTop: 4 }}>We&apos;re hiring</div>
              </div>
            </Reveal>
          </div>
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

import Link from 'next/link'
import { SectionHeader } from '@/components/marketing/SectionHeader'
import { Reveal } from '@/components/marketing/Reveal'
import { BigCTA } from '@/components/marketing/BigCTA'
import {
  IconTrophy, IconGavel, IconImage, IconCalendar,
  IconUsers, IconLock, IconCloud, IconSparkle, IconCheck, IconArrow,
} from '@/components/marketing/Icons'

export default function FeaturesPage() {
  return (
    <div className="mkt-page">

      {/* ── HERO ── */}
      <section className="mkt-band" style={{ paddingBottom: 56 }}>
        <div className="mkt-wrap">
          <SectionHeader
            kicker="Features"
            kickerColor="#7A4DAA"
            title={<>Powerful where it counts. <em style={{ color: '#7A4DAA' }}>Quiet everywhere else.</em></>}
            lead="Every tool your club needs — and nothing it doesn't. Focal Point keeps the complexity behind the scenes so your members just see something that works."
          />
        </div>
      </section>

      {/* ── FEATURE BLOCK 1: Competition Management ── */}
      <section className="mkt-band" style={{ paddingTop: 0 }}>
        <div className="mkt-wrap">
          <div className="mkt-grid-2" style={{ gap: 64 }}>
            <Reveal>
              <div>
                <div className="mkt-kicker" style={{ marginBottom: 16 }}>
                  <span className="mkt-kicker-dot" style={{ background: '#E26A3E' }} />
                  Competition Management
                </div>
                <h3 className="mkt-display" style={{ marginBottom: 18 }}>
                  From open call to <em style={{ color: '#E26A3E' }}>award night.</em>
                </h3>
                <p style={{ color: 'var(--ink-soft)', marginBottom: 28, fontSize: 17 }}>
                  Configure categories, set submission windows, assign judges, run blind scoring rounds,
                  and publish results — all without a spreadsheet in sight. Supports single and multi-round formats.
                </p>
                <div style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
                  {[
                    'Per-category submission limits',
                    'Blind judging — members never see their own entry flagged',
                    'Multi-round scoring with automatic aggregate tallying',
                    'Instant results export (PDF + CSV)',
                    'Awards and recognition tracking',
                  ].map((f, i) => (
                    <div key={i} className="mkt-feat-row">
                      <span className="mkt-check"><IconCheck /></span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/pricing" className="mkt-btn mkt-btn-primary">
                  Get started <IconArrow />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div className="mkt-mock">
                <div className="mkt-mock-chrome">
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E26A3E' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E8B14A' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3FA889' }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>
                    May 2026 · Salon Category · Results
                  </span>
                </div>
                <div style={{ padding: '0 0 8px' }}>
                  <div style={{ padding: '12px 20px', display: 'grid', gridTemplateColumns: '1fr 2fr 60px 100px', gap: 12, borderBottom: '1px solid var(--rule)', background: 'var(--paper-deep)' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Rank</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Title</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Score</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Award</span>
                  </div>
                  {[
                    { rank: '1st', member: 'M. Loh',      title: 'Heron at Dawn',     score: '27', award: 'Gold',   awardColor: '#E8B14A' },
                    { rank: '2nd', member: 'D. Okafor',   title: 'Storm Light',        score: '25', award: 'Silver', awardColor: '#A0A0A0' },
                    { rank: '3rd', member: 'A. Pereira',  title: 'Fog and Wire',       score: '23', award: 'Bronze', awardColor: '#C87941' },
                    { rank: '4th', member: 'J. Henrik',   title: 'Last Ferry',         score: '22', award: 'HM',     awardColor: '#7A4DAA' },
                    { rank: '5th', member: 'S. Nakamura', title: 'Market at Close',    score: '21', award: 'HM',     awardColor: '#7A4DAA' },
                    { rank: '6th', member: 'R. Abdi',     title: 'Tide Pool Mirror',   score: '19', award: '—',      awardColor: 'var(--muted)' },
                  ].map((row, i) => (
                    <div key={i} style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr 2fr 60px 100px', gap: 12, borderBottom: '1px solid var(--rule)', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>{row.rank}</span>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{row.title}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{row.member}</div>
                      </div>
                      <span style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{row.score}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: row.awardColor, letterSpacing: '0.06em' }}>{row.award}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FEATURE BLOCK 2: Judge Portal ── */}
      <section className="mkt-band" style={{ background: 'var(--paper-warm)' }}>
        <div className="mkt-wrap">
          <div className="mkt-grid-2" style={{ gap: 64 }}>
            <Reveal delay={80}>
              <div className="mkt-mock">
                <div className="mkt-mock-chrome">
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E26A3E' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E8B14A' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3FA889' }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>
                    Judge Portal · Nature Category
                  </span>
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <div style={{ aspectRatio: '4/3', borderRadius: 8, background: 'linear-gradient(135deg, #1B2A20, #3FA889, #CBE7DA)' }} />
                    <div style={{ aspectRatio: '4/3', borderRadius: 8, background: 'linear-gradient(135deg, #0D2433, #3F7FB8, #9DC4E5)' }} />
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Score this entry
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[5, 6, 7, 8, 9, 10].map(n => (
                      <button key={n} style={{
                        width: 42, height: 42, borderRadius: 8, border: n === 9 ? '2px solid #7A4DAA' : '1px solid var(--rule)',
                        background: n === 9 ? '#7A4DAA' : 'var(--paper)',
                        color: n === 9 ? 'white' : 'var(--ink)',
                        fontFamily: 'var(--serif)', fontSize: 20,
                        cursor: 'pointer',
                      }}>
                        {n}
                      </button>
                    ))}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                      <button style={{ height: 42, padding: '0 14px', borderRadius: 8, border: '1px solid var(--rule)', background: 'var(--paper)', fontFamily: 'var(--sans)', fontSize: 13, cursor: 'pointer', color: 'var(--ink-soft)' }}>
                        Skip
                      </button>
                      <button style={{ height: 42, padding: '0 14px', borderRadius: 8, border: 'none', background: '#7A4DAA', color: 'white', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal>
              <div>
                <div className="mkt-kicker" style={{ marginBottom: 16 }}>
                  <span className="mkt-kicker-dot" style={{ background: '#7A4DAA' }} />
                  Judge Portal
                </div>
                <h3 className="mkt-display" style={{ marginBottom: 18 }}>
                  A judging experience <em style={{ color: '#7A4DAA' }}>judges actually enjoy.</em>
                </h3>
                <p style={{ color: 'var(--ink-soft)', marginBottom: 28, fontSize: 17 }}>
                  Judges receive a magic link — no account creation, no password, no friction.
                  The portal shows them exactly what they need: the image, the category, and the score controls.
                  Nothing else.
                </p>
                <div style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
                  {[
                    'Magic-link access — no account required for judges',
                    'Full-screen, distraction-free image view',
                    'Score from 5–10 with keyboard shortcuts',
                    'Per-category comment fields',
                    'Access scoped to one competition only',
                    'Portal closes automatically when judging ends',
                  ].map((f, i) => (
                    <div key={i} className="mkt-feat-row">
                      <span className="mkt-check"><IconCheck /></span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FEATURE BLOCK 3: Galleries ── */}
      <section className="mkt-band">
        <div className="mkt-wrap">
          <div className="mkt-grid-2" style={{ gap: 64 }}>
            <Reveal>
              <div>
                <div className="mkt-kicker" style={{ marginBottom: 16 }}>
                  <span className="mkt-kicker-dot" style={{ background: '#3F7FB8' }} />
                  Image Galleries
                </div>
                <h3 className="mkt-display" style={{ marginBottom: 18 }}>
                  Beautiful portfolios, <em style={{ color: '#3F7FB8' }}>zero configuration.</em>
                </h3>
                <p style={{ color: 'var(--ink-soft)', marginBottom: 28, fontSize: 17 }}>
                  Every member gets a personal image library that doubles as their portfolio.
                  Competition entries are automatically archived with scores and awards.
                  The club gallery showcases your best work to the world.
                </p>
                <div style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
                  {[
                    'Personal image library for every member',
                    'Automatic competition archive with scores',
                    'EXIF data preserved and displayed',
                    'Public club gallery for prospective members',
                    'High-res downloads with permission controls',
                  ].map((f, i) => (
                    <div key={i} className="mkt-feat-row">
                      <span className="mkt-check"><IconCheck /></span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div className="mkt-mock">
                <div className="mkt-mock-chrome">
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E26A3E' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E8B14A' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3FA889' }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>
                    M. Loh · Library · 24 images
                  </span>
                </div>
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    ['#1B2A20', '#3FA889'], ['#0D2433', '#3F7FB8'], ['#3A1A22', '#C9436F'],
                    ['#26143A', '#7A4DAA'], ['#1F1A12', '#E8B14A'], ['#2B2218', '#E26A3E'],
                  ].map(([a, b], i) => (
                    <div key={i} style={{
                      aspectRatio: '4/3', borderRadius: 6,
                      background: `linear-gradient(135deg, ${a}, ${b})`,
                    }} />
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── SUPPORTING CAST ── */}
      <section className="mkt-band" style={{ background: 'var(--surface-teal)' }}>
        <div className="mkt-wrap">
          <SectionHeader
            kicker="Also included"
            kickerColor="#3FA889"
            title={<>Everything else <em style={{ color: '#3FA889' }}>your club needs.</em></>}
            lead="Focal Point ships as a complete platform. No integrations required."
          />
          <div className="mkt-grid-3">
            {([
              { I: IconUsers,    c: '#E26A3E', t: 'Members & Roles',    d: 'Member applications, admin approval, role-based permissions, membership status tracking.' },
              { I: IconCalendar, c: '#3F7FB8', t: 'Events',            d: 'Calendar with competition dates, field trips, workshops, and club meetings. RSVPs included.' },
              { I: IconSparkle,  c: '#7A4DAA', t: 'Announcements',     d: 'Club-wide news feed. Admins post, members read. No social noise — just what matters.' },
              { I: IconImage,    c: '#3FA889', t: 'Image Pipeline',    d: 'Upload once, use everywhere. Library → submission → archive. Images never enter the same form twice.' },
              { I: IconLock,     c: '#C9436F', t: 'Privacy Controls',  d: 'Member-zone content is always gated. Galleries have per-image visibility settings.' },
              { I: IconCloud,    c: '#E8B14A', t: 'Cloud Native',      d: 'Hosted on Vercel + Supabase. Automatic backups, 99.9% uptime, zero server management.' },
            ] as const).map((item, i) => (
              <Reveal key={i} delay={i * 50}>
                <div className="mkt-value-card" style={{ background: 'var(--paper-warm)' }}>
                  <div style={{ color: item.c, marginBottom: 14 }}><item.I /></div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, margin: '0 0 8px', lineHeight: 1.2 }}>{item.t}</h3>
                  <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 15 }}>{item.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── EASE OF USE CALLOUT ── */}
      <section className="mkt-band">
        <div className="mkt-wrap">
          <Reveal>
            <div className="mkt-card" style={{ background: 'var(--paper-warm)', padding: '48px 40px' }}>
              <div className="mkt-grid-2" style={{ gap: 48, alignItems: 'start' }}>
                <div>
                  <div className="mkt-kicker" style={{ marginBottom: 16 }}>
                    <span className="mkt-kicker-dot" style={{ background: '#3FA889' }} />
                    Designed for real people
                  </div>
                  <h3 className="mkt-display" style={{ marginBottom: 16 }}>
                    Your members are <em style={{ color: '#3FA889' }}>photographers,</em> not software engineers.
                  </h3>
                  <p style={{ color: 'var(--ink-soft)', fontSize: 17 }}>
                    We make every decision with a non-technical club member in mind.
                    If it requires a manual, we redesign it until it doesn&apos;t.
                  </p>
                </div>
                <div style={{ display: 'grid', gap: 18 }}>
                  {[
                    { t: 'Submit in under 60 seconds',    d: 'Pick competition → pick category → pick image. Done. No forms, no uploads, no re-entering titles.' },
                    { t: 'Mobile-first everywhere',       d: 'Members browse results, check scores, and submit from their phones. Every page works beautifully at any size.' },
                    { t: 'Admin tools that make sense',   d: 'The admin panel uses plain language, not jargon. Your club secretary can manage everything without training.' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#3FA889', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <IconCheck />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.t}</div>
                        <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 15 }}>{item.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <BigCTA />
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { IrisApertureLogo } from '@/components/marketing/IrisApertureLogo'
import { SectionHeader } from '@/components/marketing/SectionHeader'
import { Photo } from '@/components/marketing/Photo'
import { Reveal } from '@/components/marketing/Reveal'
import { BigCTA } from '@/components/marketing/BigCTA'
import {
  IconTrophy, IconUsers, IconImage, IconCalendar,
  IconGavel, IconSparkle, IconStar, IconArrow,
} from '@/components/marketing/Icons'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const params = await searchParams
  // Auth redirect: logged-in members with an active club go straight there.
  // Skip when ref=app so footer logo links from inside the app land here.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user && params.ref !== 'app') {
    // Use service client to bypass RLS — auth is already verified above
    const admin = createServiceClient()
    const { data: membership } = await admin
      .from('club_memberships')
      .select('club_id')
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .limit(1)
      .maybeSingle()

    if (membership?.club_id) {
      const { data: club } = await admin
        .from('clubs')
        .select('slug')
        .eq('id', membership.club_id)
        .maybeSingle()
      if (club?.slug) redirect(`/${club.slug}`)
    }
  }

  return (
    <div className="mkt-page">

      {/* ── HERO ── */}
      <section className="mkt-hero">
        <div className="mkt-wrap mkt-hero-grid">
          <div>
            <div className="mkt-kicker" style={{ marginBottom: 22 }}>
              <span className="mkt-kicker-dot" />
              Photography club management — reimagined
            </div>
            <h1 className="mkt-display" style={{ marginBottom: 22 }}>
              Every great shot<br />
              deserves a <em style={{ color: '#C9436F' }}>great club.</em>
            </h1>
            <p className="mkt-lead" style={{ marginBottom: 30 }}>
              Run competitions, manage members, and showcase the work your club is proud of —
              all in one place built by people who actually love photography.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/pricing" className="mkt-btn mkt-btn-amber">
                Start your free trial <IconArrow />
              </Link>
              <Link href="/features" className="mkt-btn mkt-btn-ghost">
                See features
              </Link>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
              <span className="mkt-chip"><span className="mkt-chip-swatch" style={{ background: '#3FA889' }} />30-day trial</span>
              <span className="mkt-chip"><span className="mkt-chip-swatch" style={{ background: '#3F7FB8' }} />No card required</span>
              <span className="mkt-chip"><span className="mkt-chip-swatch" style={{ background: '#E26A3E' }} />Cancel anytime</span>
            </div>
          </div>
          <div className="mkt-hero-art">
            {/* bokeh radial gradients */}
            <div style={{
              position: 'absolute', width: '110%', height: '110%', left: '-5%', top: '-5%',
              background: `
                radial-gradient(circle at 50% 8%,  rgba(226,106,62,0.40) 0 4%, transparent 7%),
                radial-gradient(circle at 86% 22%, rgba(63,127,184,0.40) 0 3.5%, transparent 6%),
                radial-gradient(circle at 92% 60%, rgba(232,177,74,0.53) 0 3%, transparent 5.5%),
                radial-gradient(circle at 78% 90%, rgba(122,77,170,0.40) 0 4%, transparent 7%),
                radial-gradient(circle at 30% 92%, rgba(63,168,137,0.40) 0 3.5%, transparent 6%),
                radial-gradient(circle at 6% 64%,  rgba(201,67,111,0.40) 0 3.5%, transparent 6%),
                radial-gradient(circle at 14% 18%, rgba(226,106,62,0.27) 0 2.5%, transparent 5%)
              `,
              filter: 'blur(4px)', zIndex: 0, pointerEvents: 'none',
            }} />
            <IrisApertureLogo size={420} />
          </div>
        </div>
      </section>

      {/* ── FILMSTRIP ── */}
      <section style={{ paddingBottom: 56 }}>
        <div className="mkt-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
            <div className="mkt-kicker">
              <span className="mkt-kicker-dot" style={{ background: '#3F7FB8' }} />
              This week on Focal Point
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
              Salon · Nature · Open · Mono
            </span>
          </div>
          <div className="mkt-filmstrip">
            {[
              { palette: ['#2B2218', '#E26A3E', '#E8B14A'], label: 'Riverbend Camera Club',         tag: '01' },
              { palette: ['#0D2433', '#3F7FB8', '#9DC4E5'], label: 'Northshore Photography Society', tag: '02' },
              { palette: ['#3A1A22', '#C9436F', '#F5D2DB'], label: 'Magnolia Imaging Club',          tag: '03' },
              { palette: ['#1B2A20', '#3FA889', '#CBE7DA'], label: 'Cedar Lens Collective',          tag: '04' },
              { palette: ['#26143A', '#7A4DAA', '#D8C9EA'], label: 'Twilight Salon Group',           tag: '05' },
              { palette: ['#1F1A12', '#806749', '#E5D8B5'], label: 'Old Mill Camera Club',           tag: '06' },
              { palette: ['#1E2B27', '#3FA889', '#E8B14A'], label: 'Coastal Frame Society',          tag: '07' },
            ].map(p => <Photo key={p.tag} {...p} />)}
          </div>
        </div>
      </section>

      {/* ── VALUE PROPS ── */}
      <section className="mkt-band">
        <div className="mkt-wrap">
          <SectionHeader
            kicker="Why Focal Point"
            title={<>Built for clubs, <em style={{ color: '#3FA889' }}>not spreadsheets.</em></>}
            lead="The day-to-day of running a camera club is wonderful — until it isn't. Focal Point replaces the patchwork of forms, emails, and reply-all chaos with one calm, capable home."
          />
          <div className="mkt-grid-3">
            {([
              { c: '#E26A3E', t: 'Built for clubs, not spreadsheets',  d: 'Every workflow — submissions, scoring, awards — designed around how camera clubs actually operate.', I: IconSparkle },
              { c: '#3F7FB8', t: 'Members love it',                    d: 'Beautiful galleries, clean profiles, easy submissions. Your members will spend more time looking at the work, less time wrestling with software.', I: IconUsers },
              { c: '#3FA889', t: 'Run better competitions',            d: 'Structured rounds, blind judging, automated scoring, instant results. From open call to award ceremony — smooth.', I: IconTrophy },
            ] as const).map((v, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="mkt-card" style={{ padding: 32 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: v.c, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <v.I />
                  </div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: 24, margin: '0 0 10px', lineHeight: 1.15 }}>{v.t}</h3>
                  <p style={{ margin: 0, color: 'var(--ink-soft)' }}>{v.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE TEASERS ── */}
      <section className="mkt-band" style={{ background: 'var(--surface-amber)', padding: '96px 0' }}>
        <div className="mkt-wrap">
          <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', marginBottom: 48, gap: 32, flexWrap: 'wrap' }}>
            <div style={{ maxWidth: '44ch' }}>
              <div className="mkt-kicker" style={{ marginBottom: 16 }}>
                <span className="mkt-kicker-dot" style={{ background: '#7A4DAA' }} />
                What&apos;s inside
              </div>
              <h2 className="mkt-display">A full kit. <em>Nothing extra.</em></h2>
            </div>
            <Link href="/features" className="mkt-btn mkt-btn-ghost">
              Tour every feature <IconArrow />
            </Link>
          </div>
          <div className="mkt-grid-4">
            {([
              { c: '#E26A3E', t: 'Competition Management', d: 'Submissions, multi-round judging, automated scoring, results.',        I: IconTrophy   },
              { c: '#3F7FB8', t: 'Image Galleries',        d: 'Member portfolios and curated club showcases with EXIF intact.',       I: IconImage    },
              { c: '#3FA889', t: 'Events & Field Trips',   d: 'Calendar, registration, attendance — workshops to walks.',            I: IconCalendar },
              { c: '#7A4DAA', t: 'Judge Portal',           d: "Dedicated, frictionless judging interface — no account required.",    I: IconGavel    },
            ] as const).map((f, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="mkt-card" style={{ background: 'var(--paper-warm)' }}>
                  <div className="mkt-card-accent" style={{ background: f.c }} />
                  <div style={{ color: f.c, marginBottom: 14 }}><f.I /></div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, margin: '0 0 8px', lineHeight: 1.2 }}>{f.t}</h3>
                  <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 15 }}>{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="mkt-band">
        <div className="mkt-wrap">
          <div className="mkt-grid-2">
            <Reveal>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: -28, left: -8,
                  fontFamily: 'var(--serif)', fontSize: 160,
                  lineHeight: 1, color: '#C9436F', pointerEvents: 'none', userSelect: 'none',
                }}>&ldquo;</div>
                <blockquote style={{
                  margin: 0, fontSize: 32, lineHeight: 1.25, color: 'var(--ink)',
                  fontStyle: 'italic', textWrap: 'balance', paddingTop: 24,
                  fontFamily: 'var(--serif)',
                }}>
                  Our monthly competition used to take two evenings to score by hand. Now I push one button
                  and the awards print themselves. The members noticed within a week.
                </blockquote>
                <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 999, background: 'linear-gradient(135deg, #C9436F, #E8B14A)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Marguerite Loh</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', letterSpacing: '0.08em' }}>
                      President · Northshore Photography Society
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div style={{ background: 'var(--ink)', color: 'var(--paper)', borderRadius: 16, padding: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                {([
                  { n: '500+',  l: 'Active clubs',        c: '#E8B14A' },
                  { n: '12k',   l: 'Competitions judged', c: '#E26A3E' },
                  { n: '240k',  l: 'Images managed',      c: '#3FA889' },
                  { n: '99.9%', l: 'Platform uptime',     c: '#3F7FB8' },
                ] as const).map((s, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 56, lineHeight: 1, color: s.c }}>{s.n}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', color: '#E8E2D3', marginTop: 8, textTransform: 'uppercase' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
          <div className="mkt-grid-3" style={{ marginTop: 64 }}>
            {([
              { q: "It feels like our club's website grew up. Judges thank us now.",    n: 'David Okafor',  r: 'Competition Chair · Riverbend CC' },
              { q: 'Setup took an evening, not a quarter. That alone was worth it.',    n: 'Aiko Pereira',  r: 'Secretary · Coastal Frame Society' },
              { q: 'The judge portal is the cleanest piece of software in my life.',    n: 'Jonas Henrik',  r: 'Visiting Judge · PSA-affiliated' },
            ] as const).map((t, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="mkt-card">
                  <IconStar />
                  <p style={{ fontFamily: 'var(--serif)', fontSize: 19, lineHeight: 1.35, marginTop: 12, marginBottom: 18, color: 'var(--ink)' }}>
                    &ldquo;{t.q}&rdquo;
                  </p>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.n}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em' }}>{t.r}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <BigCTA />
    </div>
  )
}

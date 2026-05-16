import { createClient } from '@/lib/supabase/server'

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatHeaderDate(date: Date, tz: string): string {
  return date
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: tz })
    .toUpperCase()
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function TrophyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ width: 20, height: 20, flexShrink: 0, color: '#C9A84C' }}
      aria-hidden="true"
    >
      <path d="M19 5h-2V3H7v2H5C3.9 5 3 5.9 3 7v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V18H9v2h6v-2h-2v-2.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zm-2 3.82V7h2v1c0 1.49-.96 2.74-2.28 3.2L17 10.82zM5 8V7h2v1.82l-.28.18A3.01 3.01 0 015 8z" />
    </svg>
  )
}

function StatCard({
  label,
  value,
  valueSuffix,
  icon,
  href,
}: {
  label:        string
  value:        string
  valueSuffix?: string
  icon?:        React.ReactNode
  href?:        string
}) {
  const valueStyle: React.CSSProperties = {
    fontFamily: 'var(--font-lora, Georgia, serif)',
    fontSize:   26,
    fontWeight: 400,
    lineHeight: 1.1,
    color:      href ? 'var(--action-primary)' : 'var(--text-primary)',
    textDecoration: 'none',
  }

  return (
    <div
      className="rounded-xl flex-shrink-0"
      style={{ background: 'var(--surface-1)', padding: '14px 18px', minWidth: 120 }}
    >
      <p style={{
        fontSize:      10,
        fontWeight:    700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color:         'var(--text-tertiary)',
        marginBottom:  8,
        whiteSpace:    'nowrap',
      }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        {icon && (
          <span style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            {icon}
          </span>
        )}
        {href ? (
          <a href={href} style={valueStyle}>
            {value}
          </a>
        ) : (
          <span style={valueStyle}>{value}</span>
        )}
        {valueSuffix && (
          <span style={{
            fontFamily: 'var(--font-lora, Georgia, serif)',
            fontSize:   14,
            fontWeight: 400,
            color:      'var(--text-tertiary)',
            lineHeight: 1,
          }}>
            {valueSuffix}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default async function WelcomeHeader({
  firstName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId,
}: {
  firstName: string
  userId:    string
}) {
  const supabase = await createClient()

  // Fetch club timezone so the date header shows the correct local day
  const { data: clubSettings } = await supabase
    .from('club_settings')
    .select('timezone')
    .single()
  const tz: string = clubSettings?.timezone || 'UTC'

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-4">
      <div className="flex items-center justify-between gap-6 flex-wrap sm:flex-nowrap">

        {/* ── Left: date / heading ───────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <p style={{
            fontSize:      11,
            fontWeight:    600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color:         'var(--text-tertiary)',
            marginBottom:  10,
          }}>
            {formatHeaderDate(new Date(), tz)}
          </p>

          <h1 style={{
            fontFamily:    'var(--font-lora, Georgia, serif)',
            fontSize:      'clamp(26px, 3.0vw, 44px)',
            fontWeight:    400,
            color:         'var(--text-primary)',
            lineHeight:    1.1,
            letterSpacing: '-0.02em',
          }}>
            Welcome back, <em style={{ fontStyle: 'italic' }}>{firstName}</em>.
          </h1>
        </div>

        {/* ── Right: stat cards ──────────────────────────────────────────── */}
        <div className="flex gap-3 self-center flex-shrink-0">
          <StatCard
            label="Submissions"
            value="23"
            href="/library?tab=submitted"
          />
          <StatCard
            label="Benchmark"
            value="BM3"
            icon={<TrophyIcon />}
          />
          <StatCard
            label="POY Rank"
            value="12"
            valueSuffix="of 38"
          />
        </div>

      </div>
    </div>
  )
}

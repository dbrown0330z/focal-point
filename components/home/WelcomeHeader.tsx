import { createClient } from '@/lib/supabase/server'

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatHeaderDate(date: Date): string {
  return date
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    .toUpperCase()
}

function formatRelative(iso: string): string {
  const target = new Date(iso)
  const now    = new Date()
  // Compare calendar dates, not ms difference
  const todayMidnight  = new Date(now.getFullYear(),    now.getMonth(),    now.getDate())
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const diffDays = Math.round((targetMidnight.getTime() - todayMidnight.getTime()) / 86_400_000)

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays <= 6)  return `this ${target.toLocaleDateString('en-US', { weekday: 'long' })}`
  return target.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label:     string
  value:     string
  sub?:      string
  highlight?: boolean
}) {
  return (
    <div
      className="rounded-xl flex-shrink-0"
      style={{ background: 'var(--surface-1)', padding: '14px 18px', minWidth: 112 }}
    >
      <p style={{
        fontSize:      10,
        fontWeight:    700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color:         'var(--text-tertiary)',
        marginBottom:  6,
        whiteSpace:    'nowrap',
      }}>
        {label}
      </p>
      <p style={{
        fontSize:   24,
        fontWeight: 700,
        lineHeight: 1.15,
        color:      highlight ? 'var(--action-primary)' : 'var(--text-primary)',
      }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
          {sub}
        </p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default async function WelcomeHeader({
  firstName,
  userId,
}: {
  firstName: string
  userId:    string
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const nowIso   = new Date().toISOString()

  const [
    { data: openComps },
    { data: upcomingComps },
    { count: memberCount },
    { count: imageCount },
  ] = await Promise.all([
    // Open competitions sorted by earliest close date
    supabase
      .from('competitions')
      .select('id, title, short_title, closes_at')
      .eq('status', 'open')
      .order('closes_at', { ascending: true, nullsFirst: false })
      .limit(2),
    // Draft competitions opening soonest
    supabase
      .from('competitions')
      .select('id, title, short_title, opens_at')
      .eq('status', 'draft')
      .gte('opens_at', nowIso)
      .order('opens_at')
      .limit(1),
    // Total active members
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('membership_status', 'active'),
    // Member's own image count
    supabase
      .from('images')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId),
  ])

  // ── Build summary sentence ─────────────────────────────────────────────────
  type CompRow = { id: string; title: string; short_title: string | null; closes_at?: string | null; opens_at?: string | null }
  const firstOpen = (openComps as CompRow[] | null)?.[0] ?? null
  const firstUpcoming = (upcomingComps as CompRow[] | null)?.[0] ?? null
  const openCount = (openComps as CompRow[] | null)?.length ?? 0

  let summaryNode: React.ReactNode = null
  if (firstOpen) {
    const name  = firstOpen.short_title?.trim() || firstOpen.title
    const until = firstOpen.closes_at ? ` — closes ${formatRelative(firstOpen.closes_at)}` : ''
    const extra = openCount > 1 ? ` ${openCount - 1} other competition${openCount > 2 ? 's are' : ' is'} also open.` : ''
    summaryNode = (
      <>
        Submissions for the <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{name}</strong> competition are open{until}.{extra && <> {extra}</>}
      </>
    )
  } else if (firstUpcoming) {
    const name  = firstUpcoming.short_title?.trim() || firstUpcoming.title
    const opens = firstUpcoming.opens_at ? ` opens ${formatRelative(firstUpcoming.opens_at)}` : ' is coming up'
    summaryNode = (
      <>
        The <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{name}</strong> competition{opens}. Get your images ready!
      </>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-4">
      <div className="flex items-center justify-between gap-6 flex-wrap sm:flex-nowrap">

        {/* ── Left: date / heading / summary ────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <p style={{
            fontSize:      11,
            fontWeight:    600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color:         'var(--text-tertiary)',
            marginBottom:  10,
          }}>
            {formatHeaderDate(new Date())}
          </p>

          <h1 style={{
            fontFamily:    'var(--font-lora, Georgia, serif)',
            fontSize:      'clamp(30px, 3.5vw, 50px)',
            fontWeight:    400,
            color:         'var(--text-primary)',
            lineHeight:    1.1,
            letterSpacing: '-0.02em',
            marginBottom:  summaryNode ? 12 : 0,
          }}>
            Welcome back, <em style={{ fontStyle: 'italic' }}>{firstName}</em>.
          </h1>

          {summaryNode && (
            <p style={{
              fontSize:  16,
              color:     'var(--text-secondary)',
              lineHeight: 1.65,
              maxWidth:  480,
            }}>
              {summaryNode}
            </p>
          )}
        </div>

        {/* ── Right: stat cards ──────────────────────────────────────────── */}
        <div className="flex gap-3 self-center flex-shrink-0">
          <StatCard
            label="Active members"
            value={String(memberCount ?? '—')}
          />
          <StatCard
            label="Open now"
            value={String(openCount)}
            highlight={openCount > 0}
          />
          <StatCard
            label="Your images"
            value={String(imageCount ?? 0)}
          />
        </div>

      </div>
    </div>
  )
}

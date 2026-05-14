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

function TrophyIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ width: 18, height: 18, flexShrink: 0, color: '#C9A84C' }}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 1a1 1 0 01.894.553l1.618 3.278 3.618.526a1 1 0 01.554 1.706l-2.618 2.551.618 3.602a1 1 0 01-1.451 1.054L10 12.347l-3.233 1.699a1 1 0 01-1.451-1.054l.618-3.602L3.316 7.063a1 1 0 01.554-1.706l3.618-.526L9.106 1.553A1 1 0 0110 1z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function StatCard({
  label,
  value,
  valueSuffix,
  icon,
}: {
  label:        string
  value:        string
  valueSuffix?: string   // rendered smaller, inline after the value
  icon?:        React.ReactNode
}) {
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
        <span style={{
          fontFamily: 'var(--font-lora, Georgia, serif)',
          fontSize:   26,
          fontWeight: 700,
          lineHeight: 1.1,
          color:      'var(--text-primary)',
        }}>
          {value}
        </span>
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
    // Open competitions sorted by earliest close date — include submission_limit
    supabase
      .from('competitions')
      .select('id, title, short_title, closes_at, submission_limit')
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

  // ── Fetch member's submission count for the first open competition ─────────
  type CompRow = { id: string; title: string; short_title: string | null; closes_at?: string | null; opens_at?: string | null; submission_limit?: number | null }
  const firstOpen = (openComps as CompRow[] | null)?.[0] ?? null

  let memberSubmissionCount = 0
  if (firstOpen) {
    const { count } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('competition_id', firstOpen.id)
      .eq('member_id', userId)
      .eq('status', 'submitted')
    memberSubmissionCount = count ?? 0
  }

  // ── Build summary sentences ────────────────────────────────────────────────
  const firstUpcoming = (upcomingComps as CompRow[] | null)?.[0] ?? null
  const openCount     = (openComps as CompRow[] | null)?.length ?? 0

  let summaryNode: React.ReactNode = null
  if (firstOpen) {
    const name  = firstOpen.short_title?.trim() || firstOpen.title
    const until = firstOpen.closes_at ? ` — closes ${formatRelative(firstOpen.closes_at)}` : ''
    const extra = openCount > 1 ? ` ${openCount - 1} other competition${openCount > 2 ? 's are' : ' is'} also open.` : ''

    // Second sentence: member's entry status
    const limit = firstOpen.submission_limit ?? 3
    let entrySentence: React.ReactNode = null
    if (memberSubmissionCount === 0) {
      entrySentence = <>You haven't entered yet — you can submit up to <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{limit} {limit === 1 ? 'image' : 'images'}</strong>.</>
    } else if (memberSubmissionCount < limit) {
      entrySentence = <>You've entered <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{memberSubmissionCount} of {limit}</strong> {limit === 1 ? 'image' : 'images'} so far.</>
    } else {
      entrySentence = <>You've submitted all <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{limit} {limit === 1 ? 'image' : 'images'}</strong> — you're all set!</>
    }

    summaryNode = (
      <>
        Submissions for the <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{name}</strong> competition are open{until}.{extra && <> {extra}</>}
        {' '}{entrySentence}
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
            label="Submissions"
            value="23"
          />
          <StatCard
            label="Benchmark Status"
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

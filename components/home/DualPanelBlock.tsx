import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DualPanelEvents, { type CEvent } from './DualPanelEvents'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysRemaining(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}
function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString('en-US', opts ?? { month: 'short', day: 'numeric' })
}
function dn(c: { title: string; short_title?: string | null }) {
  return c.short_title?.trim() || c.title
}
function fp(n: number) { return n.toFixed(1) }

// ─── Card types ───────────────────────────────────────────────────────────────

type OpenCard = {
  kind:         'open'
  id:           string
  name:         string
  closesAt:     string | null
  totalEntries: number
  memberUsed:   number
  memberMax:    number
}
type ResultsCard = {
  kind:          'results'
  id:            string
  name:          string
  memberEntered: boolean
  scores:        { score: number; imageTitle: string }[]
}
type JudgingCard    = { kind: 'judging';     id: string; name: string }
type ComingSoonCard = { kind: 'coming_soon'; id: string; name: string; opensAt: string | null }
type CompCard = OpenCard | ResultsCard | JudgingCard | ComingSoonCard

// ─── Status dot ───────────────────────────────────────────────────────────────

function StatusDot({ kind }: { kind: CompCard['kind'] }) {
  const styles: Record<CompCard['kind'], { symbol: string; color: string }> = {
    open:        { symbol: '●', color: 'var(--action-primary)' },
    results:     { symbol: '✓', color: 'var(--status-success)' },
    judging:     { symbol: '◐', color: 'var(--status-warning)' },
    coming_soon: { symbol: '○', color: 'var(--text-tertiary)' },
  }
  const s = styles[kind]
  return (
    <span style={{ color: s.color, fontSize: 13, flexShrink: 0, lineHeight: 1, marginTop: 1 }} aria-hidden="true">
      {s.symbol}
    </span>
  )
}

// ─── Card renderers ───────────────────────────────────────────────────────────

function OpenCompCard({ card }: { card: OpenCard }) {
  const days     = card.closesAt ? daysRemaining(card.closesAt) : null
  const complete = card.memberUsed >= card.memberMax

  return (
    <div style={{
      borderRadius: 10,
      border:       '1px solid var(--border-default)',
      borderLeft:   '3px solid var(--phase-open-border)',
      overflow:     'hidden',
    }}>
      {/* ── Header zone — green tint ── */}
      <div style={{ background: 'var(--phase-open-bg)', padding: '13px 15px 11px' }}>

        {/* Name row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 5 }}>
          <StatusDot kind="open" />
          <span style={{
            fontFamily: 'var(--font-lora, Georgia, serif)',
            fontSize: 14, fontWeight: 700,
            color: 'var(--text-primary)', lineHeight: 1.3,
          }}>
            {card.name}
          </span>
        </div>

        {/* Submissions open + deadline */}
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 20, lineHeight: 1.5 }}>
          <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>Submissions open</span>
          {card.closesAt && days !== null && (
            <>
              {' · '}Closes {fmtDate(card.closesAt)}
              {' · '}
              <span style={{ color: days <= 3 ? 'var(--status-warning)' : 'inherit', fontWeight: days <= 3 ? 600 : 400 }}>
                {days} day{days !== 1 ? 's' : ''} left
              </span>
            </>
          )}
        </p>
      </div>

      {/* ── Footer zone — entry status + CTA ── */}
      <div style={{
        background:  'var(--surface-1)',
        borderTop:   '1px solid var(--border-subtle)',
        padding:     '9px 15px 11px',
        paddingLeft: 35,
        display:     'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{card.totalEntries}</span>
          {' '}entr{card.totalEntries === 1 ? 'y' : 'ies'}
          {' · '}
          <span style={{ fontWeight: 500 }}>{card.memberUsed}</span>
          {` of ${card.memberMax} submitted`}
        </p>
        <Link
          href={`/submit?competition=${card.id}`}
          style={{ fontSize: 12, fontWeight: 600, color: 'var(--action-primary)', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          {complete ? 'Edit your submissions →' : 'Submit an image →'}
        </Link>
      </div>
    </div>
  )
}

function ResultsCompCard({ card }: { card: ResultsCard }) {
  return (
    <div style={{
      background:   'var(--surface-1)',
      borderRadius: 10,
      padding:      '13px 15px',
      border:       '1px solid var(--border-default)',
      borderLeft:   '3px solid var(--status-success)',
    }}>
      {/* Name + "Results published" */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 7 }}>
        <StatusDot kind="results" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontFamily: 'var(--font-lora, Georgia, serif)',
            fontSize: 14, fontWeight: 700,
            color: 'var(--text-primary)', lineHeight: 1.3,
          }}>
            {card.name}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 6 }}>
            — Results published
          </span>
        </div>
      </div>

      {/* Scores row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, paddingLeft: 20,
        borderTop: '1px solid var(--border-subtle)', paddingTop: 9,
      }}>
        {card.memberEntered ? (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Your scores:{' '}
            {card.scores.map((s, i) => (
              <span key={i}>
                {i > 0 && <span style={{ userSelect: 'none' }}>{'  '}</span>}
                {/* title attr gives native browser tooltip — not shown on mobile, matching spec */}
                <span
                  title={s.imageTitle}
                  style={{ fontWeight: 600, color: 'var(--text-primary)', cursor: 'help' }}
                >
                  {fp(s.score)}
                </span>
              </span>
            ))}
          </p>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            You didn&apos;t enter this one
          </p>
        )}
        <Link
          href={`/competitions/${card.id}`}
          style={{ fontSize: 12, fontWeight: 600, color: 'var(--action-primary)', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          View →
        </Link>
      </div>
    </div>
  )
}

function SlimRow({ card }: { card: JudgingCard | ComingSoonCard }) {
  const label = card.kind === 'judging'
    ? 'Judging in progress'
    : card.opensAt
      ? `Opens ${fmtDate(card.opensAt)}`
      : 'Opening soon'

  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          8,
      padding:      '10px 13px',
      borderRadius: 8,
      border:       '1px solid var(--border-subtle)',
    }}>
      <StatusDot kind={card.kind} />
      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {card.name}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>
        {label}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const JUDGING_STATUSES = ['judging', 'judging_on_hold', 'results_pending'] as const
const MAX_CARDS = 4

export default async function DualPanelBlock() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null
  const nowIso = new Date().toISOString()

  // ── Round 1: all feeds in parallel ───────────────────────────────────────
  const [
    { data: calData },
    { data: compMilestoneData },
    { data: allCompsRaw },
  ] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('id, title, starts_at, ends_at, all_day, event_type, location')
      .gte('starts_at', nowIso)
      .order('starts_at')
      .limit(15),

    supabase
      .from('competitions')
      .select('id, title, short_title, opens_at, closes_at, status')
      .in('status', ['draft', 'open'])
      .or(`opens_at.gte.${nowIso},closes_at.gte.${nowIso}`)
      .order('opens_at', { ascending: true, nullsFirst: false }),

    supabase
      .from('competitions')
      .select('id, title, short_title, status, opens_at, closes_at, results_at, submission_limit')
      .in('status', ['open', 'results_published', 'draft', ...JUDGING_STATUSES])
      .limit(30),
  ])

  // ── Build events list (unchanged) ────────────────────────────────────────
  type CompMilestone = { id: string; title: string; short_title: string | null; opens_at: string | null; closes_at: string | null; status: string }
  const compEvents: CEvent[] = []
  for (const c of (compMilestoneData ?? []) as CompMilestone[]) {
    const name = c.short_title?.trim() || c.title
    if (c.status === 'draft' && c.opens_at && c.opens_at >= nowIso)
      compEvents.push({ id: `${c.id}-opens`,  title: name, starts_at: c.opens_at,  ends_at: null, all_day: true, event_type: 'submission_open',   location: null })
    if (c.status === 'open'  && c.closes_at && c.closes_at >= nowIso)
      compEvents.push({ id: `${c.id}-closes`, title: name, starts_at: c.closes_at, ends_at: null, all_day: true, event_type: 'submission_closed', location: null })
  }
  const allEvents = [...(calData ?? []) as CEvent[], ...compEvents]
  allEvents.sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const events = allEvents.slice(0, 4)

  // ── Categorise + prioritise competitions ─────────────────────────────────
  type RawComp = { id: string; title: string; short_title: string | null; status: string; opens_at: string | null; closes_at: string | null; results_at: string | null; submission_limit: number | null }
  const comps = (allCompsRaw ?? []) as RawComp[]

  // A competition is only "open" if its opens_at has passed (or has no opens_at gate).
  // If opens_at is still in the future it renders as "coming soon" regardless of DB status.
  const openList       = comps.filter(c => c.status === 'open' && (!c.opens_at || c.opens_at <= nowIso)).sort((a, b) => (a.closes_at ?? '').localeCompare(b.closes_at ?? ''))
  const resultsList    = comps.filter(c => c.status === 'results_published').sort((a, b) => (b.results_at ?? '').localeCompare(a.results_at ?? ''))
  const judgingList    = comps.filter(c => (JUDGING_STATUSES as readonly string[]).includes(c.status))
  const comingSoonList = comps
    .filter(c =>
      (c.status === 'draft' && c.opens_at && c.opens_at > nowIso) ||
      (c.status === 'open'  && c.opens_at && c.opens_at > nowIso),
    )
    .sort((a, b) => (a.opens_at ?? '').localeCompare(b.opens_at ?? ''))

  const s1 = openList.slice(0, MAX_CARDS)
  const r1 = MAX_CARDS - s1.length
  const s2 = resultsList.slice(0, r1)
  const r2 = r1 - s2.length
  const s3 = judgingList.slice(0, r2)
  const r3 = r2 - s3.length
  const s4 = comingSoonList.slice(0, r3)

  // ── Round 2: fetch card details (parallel) ───────────────────────────────
  const openIds    = s1.map(c => c.id)
  const resultsIds = s2.map(c => c.id)

  const [entriesRes, memberEntriesRes, memberSubsRes] = await Promise.all([
    // Total submitted entries per open comp
    openIds.length > 0
      ? supabase
          .from('submissions')
          .select('competition_id')
          .in('competition_id', openIds)
          .eq('status', 'submitted')
      : Promise.resolve({ data: [] as { competition_id: string }[] }),

    // Member's submitted entries per open comp
    openIds.length > 0 && userId
      ? supabase
          .from('submissions')
          .select('competition_id')
          .in('competition_id', openIds)
          .eq('member_id', userId)
          .eq('status', 'submitted')
      : Promise.resolve({ data: [] as { competition_id: string }[] }),

    // Member's submissions + image title for results comps
    resultsIds.length > 0 && userId
      ? supabase
          .from('submissions')
          .select('id, competition_id, images(title)')
          .in('competition_id', resultsIds)
          .eq('member_id', userId)
          .eq('status', 'submitted')
      : Promise.resolve({ data: [] as { id: string; competition_id: string; images: { title: string } | null }[] }),
  ])

  // Aggregate total entries per open comp
  const totalEntriesMap: Record<string, number> = {}
  for (const e of (entriesRes.data ?? [])) {
    totalEntriesMap[e.competition_id] = (totalEntriesMap[e.competition_id] ?? 0) + 1
  }
  const memberUsedMap: Record<string, number> = {}
  for (const e of (memberEntriesRes.data ?? [])) {
    memberUsedMap[e.competition_id] = (memberUsedMap[e.competition_id] ?? 0) + 1
  }

  // Fetch scores for member's submissions in results comps
  type SubRow = { id: string; competition_id: string; images: { title: string } | null }
  const memberSubs = (memberSubsRes.data ?? []) as SubRow[]
  const subIds     = memberSubs.map(s => s.id)
  const { data: scoresRaw } = subIds.length > 0
    ? await supabase.from('scores').select('submission_id, score').in('submission_id', subIds)
    : { data: [] as { submission_id: string; score: number }[] }

  // Build avg score per submission
  const scoreMap: Record<string, number[]> = {}
  for (const r of (scoresRaw ?? [])) {
    if (!scoreMap[r.submission_id]) scoreMap[r.submission_id] = []
    scoreMap[r.submission_id].push(r.score)
  }
  const avgScore = (subId: string) => {
    const s = scoreMap[subId]
    if (!s || s.length === 0) return null
    return s.reduce((a, b) => a + b, 0) / s.length
  }

  // Group member subs by competition
  const memberSubsByComp: Record<string, { score: number; imageTitle: string }[]> = {}
  for (const sub of memberSubs) {
    const avg = avgScore(sub.id)
    if (avg === null) continue
    if (!memberSubsByComp[sub.competition_id]) memberSubsByComp[sub.competition_id] = []
    memberSubsByComp[sub.competition_id].push({ score: avg, imageTitle: sub.images?.title ?? 'Untitled' })
  }
  // Sort each comp's scores descending
  for (const k of Object.keys(memberSubsByComp)) memberSubsByComp[k].sort((a, b) => b.score - a.score)

  // ── Build typed cards ────────────────────────────────────────────────────
  const cards: CompCard[] = [
    ...s1.map((c): OpenCard => ({
      kind:         'open',
      id:           c.id,
      name:         dn(c),
      closesAt:     c.closes_at,
      totalEntries: totalEntriesMap[c.id] ?? 0,
      memberUsed:   memberUsedMap[c.id]   ?? 0,
      memberMax:    c.submission_limit    ?? 3,
    })),
    ...s2.map((c): ResultsCard => {
      const scores = memberSubsByComp[c.id] ?? []
      return {
        kind:          'results',
        id:            c.id,
        name:          dn(c),
        memberEntered: scores.length > 0,
        scores,
      }
    }),
    ...s3.map((c): JudgingCard => ({ kind: 'judging',     id: c.id, name: dn(c) })),
    ...s4.map((c): ComingSoonCard => ({ kind: 'coming_soon', id: c.id, name: dn(c), opensAt: c.opens_at })),
  ]

  // Next "coming soon" for empty-state message
  const nextUp = comingSoonList[0]

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="border-b border-[var(--border-subtle)] py-7 last:border-b-0">
      <div className="grid grid-cols-1 md:grid-cols-2">

        {/* ── LEFT: Next 4 Events ─────────────────────────────────────────── */}
        <div className="pb-8 md:pb-0 md:pr-8 md:border-r" style={{ borderColor: 'var(--border-subtle)' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-lora, Georgia, serif)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)', lineHeight: 1.3 }}>
              Next 4 Events
            </h2>
            <Link href="/calendar" style={{ fontSize: 13, fontWeight: 500, color: 'var(--action-primary)', textDecoration: 'none', flexShrink: 0 }}>
              View all →
            </Link>
          </div>

          <DualPanelEvents events={events} />
        </div>

        {/* ── RIGHT: Competitions ─────────────────────────────────────────── */}
        <div className="md:pl-8">

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-lora, Georgia, serif)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)', lineHeight: 1.3 }}>
              Competition activity
            </h2>
            <Link href="/competitions" style={{ fontSize: 13, fontWeight: 500, color: 'var(--action-primary)', textDecoration: 'none', flexShrink: 0 }}>
              View all →
            </Link>
          </div>

          {cards.length === 0 ? (
            <div style={{ padding: '20px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                No competitions open right now.
                {nextUp && nextUp.opens_at && (
                  <> {dn(nextUp)} opens {fmtDate(nextUp.opens_at)}.</>
                )}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cards.map(card => {
                if (card.kind === 'open')        return <OpenCompCard   key={card.id} card={card} />
                if (card.kind === 'results')     return <ResultsCompCard key={card.id} card={card} />
                if (card.kind === 'judging')     return <SlimRow        key={card.id} card={card} />
                if (card.kind === 'coming_soon') return <SlimRow        key={card.id} card={card} />
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

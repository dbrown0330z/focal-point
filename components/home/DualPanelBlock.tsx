import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

// ─── Event type styling — matches CalendarClient.tsx exactly ─────────────────

const EVT: Record<string, { accent: string; bg: string; text: string; label: string }> = {
  competition:       { accent: '#1A6FC4', bg: '#1A6FC4',                       text: '#fff',                           label: 'Competition'  },
  regular_meeting:   { accent: '#0097A7', bg: '#0097A7',                       text: '#fff',                           label: 'Meeting'      },
  board_meeting:     { accent: '#6C47D4', bg: '#6C47D4',                       text: '#fff',                           label: 'Board'        },
  field_trip:        { accent: '#E65100', bg: '#E65100',                       text: '#fff',                           label: 'Field trip'   },
  other:             { accent: '#5A7A96', bg: '#5A7A96',                       text: '#fff',                           label: 'Event'        },
  submission_open:   { accent: 'var(--status-success)', bg: 'var(--status-success-bg)', text: 'var(--status-success-text)', label: 'Opens'    },
  submission_closed: { accent: 'var(--status-error)',   bg: 'var(--status-error-bg)',   text: 'var(--status-error-text)',   label: 'Closes'   },
}
const EVT_DEFAULT = { accent: '#5A7A96', bg: '#5A7A96', text: '#fff', label: 'Event' }

// Category colours for donut pie slices
const PIE_COLORS = ['#1A6FC4', '#0097A7', '#E65100', '#6C47D4', '#00796B', '#AD1457']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysRemaining(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}
function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString('en-US', opts ?? { month: 'short', day: 'numeric' })
}
function fmtTime(iso: string, allDay: boolean) {
  if (allDay) return 'All day'
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
function dn(c: { title: string; short_title?: string | null }) {
  return c.short_title?.trim() || c.title
}
function f(n: number) { return n.toFixed(1) }
function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

// ─── Donut chart ──────────────────────────────────────────────────────────────

type DonutSlice = { value: number; color: string; label: string }

function DonutChart({ slices, total }: { slices: DonutSlice[]; total: number }) {
  const SIZE = 64, CX = 32, CY = 32, R = 28, INNER = 14

  if (total === 0) {
    return (
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ flexShrink: 0 }} aria-hidden="true">
        <circle cx={CX} cy={CY} r={R} fill="var(--surface-1)" stroke="var(--border-default)" strokeWidth="1" />
        <circle cx={CX} cy={CY} r={INNER} fill="var(--surface-0)" />
        <text x={CX} y={CY + 4} textAnchor="middle" fontSize="10" fill="var(--text-tertiary)">0</text>
      </svg>
    )
  }

  const active = slices.filter(s => s.value > 0)
  const GAP    = active.length > 1 ? 0.05 : 0
  let   pos    = -Math.PI / 2

  const paths = active.map((slice, i) => {
    const full = (slice.value / total) * 2 * Math.PI
    const draw = Math.max(full - GAP, 0.01)
    const a1   = pos + GAP / 2
    const a2   = a1 + draw
    pos += full

    const ox1 = CX + R * Math.cos(a1),     oy1 = CY + R * Math.sin(a1)
    const ox2 = CX + R * Math.cos(a2),     oy2 = CY + R * Math.sin(a2)
    const ix1 = CX + INNER * Math.cos(a1), iy1 = CY + INNER * Math.sin(a1)
    const ix2 = CX + INNER * Math.cos(a2), iy2 = CY + INNER * Math.sin(a2)
    const lg  = draw > Math.PI ? 1 : 0

    return (
      <path key={i}
        d={`M ${f(ox1)} ${f(oy1)} A ${R} ${R} 0 ${lg} 1 ${f(ox2)} ${f(oy2)} L ${f(ix2)} ${f(iy2)} A ${INNER} ${INNER} 0 ${lg} 0 ${f(ix1)} ${f(iy1)} Z`}
        fill={slice.color}
      />
    )
  })

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ flexShrink: 0 }} aria-hidden="true">
      {/* Background disc */}
      <circle cx={CX} cy={CY} r={R} fill="var(--surface-1)" />
      {paths}
      {/* Donut hole */}
      <circle cx={CX} cy={CY} r={INNER} fill="var(--surface-0)" />
      {/* Total in centre */}
      <text x={CX} y={CY - 2}  textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text-primary)">{total}</text>
      <text x={CX} y={CY + 9}  textAnchor="middle" fontSize="7"                   fill="var(--text-tertiary)">IMGS</text>
    </svg>
  )
}

// ─── Data types ───────────────────────────────────────────────────────────────

type CEvent = {
  id: string; title: string; starts_at: string; ends_at: string | null
  all_day: boolean; event_type: string; location: string | null
}

type OpenCompData = {
  id:               string
  title:            string
  short_title:      string | null
  closes_at:        string | null
  submission_limit: number
  totalEntries:     number
  memberUsed:       number
  categories:       { id: string; name: string; count: number }[]
}

type RecentResultData = {
  id:           string
  title:        string
  short_title:  string | null
  totalImages:  number
  topImages:    { publicUrl: string; title: string; memberName: string; score: number }[]
  memberResult: { imageTitle: string; score: number; placement: number; categoryName: string } | null
}

// ─── Main component ───────────────────────────────────────────────────────────

export default async function DualPanelBlock() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseRaw = await createClient()
  const supabase    = supabaseRaw as any

  const { data: { user } } = await supabaseRaw.auth.getUser()
  const userId = user?.id ?? null
  const nowIso = new Date().toISOString()

  // ── Parallel round 1: events, open comp, recent results heading ───────────
  const [
    { data: calData },
    { data: compMilestoneData },
    { data: openCompRaw },
    { data: recentCompRaw },
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
      .select('id, title, short_title, closes_at, submission_limit')
      .eq('status', 'open')
      .order('closes_at', { ascending: true, nullsFirst: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from('competitions')
      .select('id, title, short_title, results_at, score_min, score_max')
      .eq('status', 'results_published')
      .order('results_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
  ])

  // ── Build events list ─────────────────────────────────────────────────────
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
  const events = allEvents.slice(0, 5)

  // ── Parallel round 2: open-comp details + recent-results details ──────────
  let openComp:   OpenCompData     | null = null
  let recentComp: RecentResultData | null = null

  const detailPromises: Promise<void>[] = []

  if (openCompRaw) {
    const compId = openCompRaw.id
    detailPromises.push(
      (async () => {
        const [{ data: catsRaw }, { data: subsRaw }, memberRes] = await Promise.all([
          supabase
            .from('competition_categories')
            .select('id, name')
            .eq('competition_id', compId)
            .order('created_at'),
          supabase
            .from('submissions')
            .select('category_id')
            .eq('competition_id', compId)
            .eq('status', 'submitted'),
          userId
            ? supabase
                .from('submissions')
                .select('id', { count: 'exact', head: true })
                .eq('competition_id', compId)
                .eq('member_id', userId)
                .eq('status', 'submitted')
            : Promise.resolve({ count: 0 }),
        ])

        const catCounts: Record<string, number> = {}
        for (const s of (subsRaw ?? [])) catCounts[s.category_id] = (catCounts[s.category_id] ?? 0) + 1

        openComp = {
          id:               compId,
          title:            openCompRaw.title,
          short_title:      openCompRaw.short_title,
          closes_at:        openCompRaw.closes_at,
          submission_limit: openCompRaw.submission_limit ?? 3,
          totalEntries:     (subsRaw ?? []).length,
          memberUsed:       memberRes?.count ?? 0,
          categories:       (catsRaw ?? []).map((c: { id: string; name: string }) => ({
            id:    c.id,
            name:  c.name,
            count: catCounts[c.id] ?? 0,
          })),
        }
      })()
    )
  }

  if (recentCompRaw) {
    const compId = recentCompRaw.id
    detailPromises.push(
      (async () => {
        const { data: subsRaw } = await supabase
          .from('submissions')
          .select('id, category_id, member_id, images(id, storage_path, title), profiles!member_id(id, display_name)')
          .eq('competition_id', compId)
          .eq('status', 'submitted')

        const submissionIds: string[] = (subsRaw ?? []).map((s: { id: string }) => s.id)

        const { data: scoresRaw } = await supabase
          .from('scores')
          .select('submission_id, score')
          .in('submission_id', submissionIds.length > 0 ? submissionIds : ['00000000-0000-0000-0000-000000000000'])

        type ScoreRow = { submission_id: string; score: number }
        const scoreMap: Record<string, number[]> = {}
        for (const r of (scoresRaw ?? []) as ScoreRow[]) {
          if (!scoreMap[r.submission_id]) scoreMap[r.submission_id] = []
          scoreMap[r.submission_id].push(r.score)
        }

        type SubRow = {
          id: string; category_id: string; member_id: string
          images:   { storage_path: string; title: string } | null
          profiles: { id: string; display_name: string } | null
        }

        const scored: { id: string; catId: string; memberId: string; path: string; title: string; memberName: string; avg: number }[] = []
        for (const sub of (subsRaw ?? []) as SubRow[]) {
          if (!sub.images || !sub.profiles) continue
          const scores = scoreMap[sub.id]
          if (!scores || scores.length === 0) continue
          const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length
          scored.push({ id: sub.id, catId: sub.category_id, memberId: sub.member_id, path: sub.images.storage_path, title: sub.images.title, memberName: sub.profiles.display_name, avg })
        }

        const top3 = [...scored].sort((a, b) => b.avg - a.avg).slice(0, 3)

        let memberResult: RecentResultData['memberResult'] = null
        if (userId) {
          const memberSubs = scored.filter(s => s.memberId === userId).sort((a, b) => b.avg - a.avg)
          if (memberSubs.length > 0) {
            const best       = memberSubs[0]
            const catSubs    = scored.filter(s => s.catId === best.catId).sort((a, b) => b.avg - a.avg)
            const placement  = catSubs.findIndex(s => s.id === best.id) + 1
            const { data: catRow } = await supabase
              .from('competition_categories').select('name').eq('id', best.catId).maybeSingle()
            memberResult = { imageTitle: best.title, score: best.avg, placement, categoryName: catRow?.name ?? 'Unknown' }
          }
        }

        recentComp = {
          id:          compId,
          title:       recentCompRaw.title,
          short_title: recentCompRaw.short_title,
          totalImages: scored.length,
          topImages:   top3.map(s => ({
            publicUrl:  supabaseRaw.storage.from('images').getPublicUrl(s.path).data.publicUrl,
            title:      s.title,
            memberName: s.memberName,
            score:      s.avg,
          })),
          memberResult,
        }
      })()
    )
  }

  await Promise.all(detailPromises)

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="border-b border-[var(--border-subtle)] py-7 last:border-b-0">
      <div className="grid grid-cols-1 md:grid-cols-2">

        {/* ── LEFT: Next 5 Events ─────────────────────────────────────────── */}
        <div className="pb-8 md:pb-0 md:pr-8 md:border-r" style={{ borderColor: 'var(--border-subtle)' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-lora, Georgia, serif)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)', lineHeight: 1.3 }}>
              Next 5 Events
            </h2>
            <Link href="/calendar" style={{ fontSize: 13, fontWeight: 500, color: 'var(--action-primary)', textDecoration: 'none', flexShrink: 0 }}>
              View all →
            </Link>
          </div>

          {events.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No upcoming events scheduled.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {events.map((ev, i) => {
                const cfg  = EVT[ev.event_type] ?? EVT_DEFAULT
                const time = fmtTime(ev.starts_at, ev.all_day)
                const date = fmtDate(ev.starts_at, { weekday: 'short', month: 'short', day: 'numeric' })

                return (
                  <div key={ev.id} style={{
                    display:       'flex',
                    alignItems:    'center',
                    gap:           12,
                    padding:       '11px 0',
                    borderTop:     i === 0 ? 'none' : '1px solid var(--border-subtle)',
                    borderLeft:    `3px solid ${cfg.accent}`,
                    paddingLeft:   12,
                    marginLeft:    0,
                  }}>
                    {/* Event info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ev.title}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {date}
                        {!ev.all_day && <> · {time}</>}
                        {ev.location && <> · {ev.location}</>}
                      </p>
                    </div>

                    {/* Type chip — solid colour matching calendar */}
                    <span style={{
                      flexShrink:      0,
                      fontSize:        11,
                      fontWeight:      600,
                      background:      cfg.bg,
                      color:           cfg.text,
                      borderRadius:    4,
                      padding:         '3px 8px',
                      letterSpacing:   '0.02em',
                    }}>
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: Competitions ─────────────────────────────────────────── */}
        <div className="md:pl-8">

          <h2 style={{ fontFamily: 'var(--font-lora, Georgia, serif)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 16 }}>
            Competitions
          </h2>

          {!openComp && !recentComp ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic', marginBottom: 12 }}>
                No active competitions right now.
              </p>
              <Link href="/competitions" style={{ fontSize: 13, fontWeight: 600, color: 'var(--action-primary)', textDecoration: 'none' }}>
                View all competitions →
              </Link>
            </div>
          ) : (
            <>
              {/* ── Top zone: open competition ─────────────────────────── */}
              {openComp ? (
                <div style={{ marginBottom: recentComp ? 20 : 0 }}>
                  {/* Zone label */}
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--status-success-text)', marginBottom: 10 }}>
                    Open now
                  </p>

                  {/* Competition card */}
                  <div style={{
                    background:   'var(--surface-1)',
                    borderRadius: 10,
                    padding:      '14px 16px',
                    border:       '1px solid var(--border-default)',
                    borderLeft:   '3px solid var(--phase-open-border)',
                  }}>
                    {/* Name */}
                    <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-lora, Georgia, serif)', color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 4 }}>
                      {dn(openComp)}
                    </p>

                    {/* Close date */}
                    {openComp.closes_at && (() => {
                      const days = daysRemaining(openComp.closes_at!)
                      return (
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                          Closes {fmtDate(openComp.closes_at!)}
                          {' · '}
                          <strong style={{ color: days <= 3 ? 'var(--status-warning)' : 'inherit' }}>
                            {days} day{days !== 1 ? 's' : ''} remaining
                          </strong>
                        </p>
                      )
                    })()}

                    {/* Category donut chart + legend */}
                    {openComp.categories.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                        <DonutChart
                          slices={openComp.categories.map((c, i) => ({
                            value: c.count,
                            color: PIE_COLORS[i % PIE_COLORS.length],
                            label: c.name,
                          }))}
                          total={openComp.totalEntries}
                        />
                        {/* Legend */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {openComp.categories.map((cat, i) => (
                            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <span style={{ width: 9, height: 9, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {cat.name}
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0, minWidth: 20, textAlign: 'right' }}>
                                {cat.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Entry status */}
                    <div style={{ paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      {openComp.memberUsed >= openComp.submission_limit ? (
                        <p style={{ fontSize: 13, color: 'var(--status-success-text)', fontWeight: 500 }}>
                          ✓ All {openComp.submission_limit} {openComp.submission_limit === 1 ? 'entry' : 'entries'} submitted
                        </p>
                      ) : (
                        <>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {openComp.memberUsed === 0
                              ? "You haven't entered yet."
                              : `${openComp.memberUsed} of ${openComp.submission_limit} entries submitted.`}
                          </p>
                          <Link
                            href={`/submit?competition=${openComp.id}`}
                            style={{ flexShrink: 0, fontSize: 13, fontWeight: 600, color: 'var(--action-primary)', textDecoration: 'none', whiteSpace: 'nowrap' }}
                          >
                            {openComp.memberUsed === 0 ? 'Enter now →' : 'Enter again →'}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* No open competition placeholder */
                <div style={{ marginBottom: 20, padding: '14px 16px', background: 'var(--surface-1)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No competition is open for submissions right now.</p>
                </div>
              )}

              {/* ── Bottom zone: recent results ────────────────────────── */}
              {recentComp && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 3 }}>
                        Latest results
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-lora, Georgia, serif)', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                        {dn(recentComp)}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {recentComp.totalImages} {recentComp.totalImages === 1 ? 'image' : 'images'} entered
                      </p>
                    </div>
                    <Link
                      href={`/competitions/${recentComp.id}`}
                      style={{ fontSize: 12, fontWeight: 600, color: 'var(--action-primary)', textDecoration: 'none', flexShrink: 0, paddingTop: 2 }}
                    >
                      View results →
                    </Link>
                  </div>

                  {/* Top 3 thumbnails */}
                  {recentComp.topImages.length > 0 && (
                    <div style={{
                      display:               'grid',
                      gridTemplateColumns:   `repeat(${recentComp.topImages.length}, 1fr)`,
                      gap:                   8,
                      marginBottom:          12,
                    }}>
                      {recentComp.topImages.map((img, i) => (
                        <Link key={i} href={`/competitions/${recentComp!.id}`} style={{ display: 'block', borderRadius: 7, overflow: 'hidden', position: 'relative', aspectRatio: '1', background: 'var(--surface-1)' }}>
                          <Image
                            src={img.publicUrl}
                            alt={img.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="120px"
                          />
                          {/* Score badge */}
                          <span style={{
                            position:   'absolute', bottom: 4, right: 4,
                            background: 'rgba(0,0,0,0.62)',
                            color:      '#fff',
                            fontSize:   10,
                            fontWeight: 700,
                            borderRadius: 3,
                            padding:    '2px 5px',
                            lineHeight: 1,
                          }}>
                            {img.score.toFixed(1)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Member's own result */}
                  {recentComp.memberResult && (
                    <div style={{
                      padding:      '10px 14px',
                      background:   'var(--surface-1)',
                      borderRadius: 8,
                      border:       '1px solid var(--border-subtle)',
                    }}>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Your result: </span>
                        {recentComp.memberResult.imageTitle}
                        {' · '}
                        Score: <strong style={{ color: 'var(--text-primary)' }}>{recentComp.memberResult.score.toFixed(1)}</strong>
                        {' · '}
                        {ordinal(recentComp.memberResult.placement)} place in {recentComp.memberResult.categoryName}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Footer link */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                <Link href="/competitions" style={{ fontSize: 13, fontWeight: 600, color: 'var(--action-primary)', textDecoration: 'none' }}>
                  View all competitions →
                </Link>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

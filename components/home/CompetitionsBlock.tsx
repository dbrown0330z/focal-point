import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { CompetitionsSettings } from '@/lib/homepage/types'
import OpenCompEntryButton from './OpenCompEntryButton'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysRemaining(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function displayName(comp: { title: string; short_title?: string | null }) {
  return comp.short_title?.trim() || comp.title
}

// ─── Zone 1 — Open now ────────────────────────────────────────────────────────

type OpenComp = {
  id:               string
  title:            string
  short_title:      string | null
  closes_at:        string | null
  submission_limit: number
  memberUsed:       number
  memberImageUrls:  string[]
  categories:       { id: string; name: string; count?: number }[]
}

function OpenCompCard({ comp, userId, clubSlug }: { comp: OpenComp; userId: string | null; clubSlug: string }) {
  const days     = comp.closes_at ? daysRemaining(comp.closes_at) : null
  const complete = comp.memberUsed >= comp.submission_limit && comp.submission_limit > 0
  const partial  = comp.memberUsed > 0 && !complete

  return (
    <div style={{
      borderRadius: 10,
      border:       '1px solid var(--border-default)',
      borderLeft:   '3px solid var(--phase-open-border)',
      overflow:     'hidden',
    }}>
      {/* Header zone — green tint */}
      <div style={{ background: 'var(--phase-open-bg)', padding: '13px 15px 11px' }}>

        {/* Name row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 5 }}>
          <span style={{ color: 'var(--action-primary)', fontSize: 13, flexShrink: 0, lineHeight: 1, marginTop: 1 }}>●</span>
          <span style={{ fontFamily: 'var(--font-lora, Georgia, serif)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {displayName(comp)}
          </span>
        </div>

        {/* Subtext: Submissions open · Closes Jul 28 · 14 days left */}
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 20, lineHeight: 1.5 }}>
          <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>Submissions open</span>
          {comp.closes_at && days !== null && (
            <>
              {' · '}Closes {fmtDate(comp.closes_at)}
              {' · '}
              <span style={{ color: days <= 3 ? 'var(--status-warning)' : 'inherit', fontWeight: days <= 3 ? 600 : 400 }}>
                {days} day{days !== 1 ? 's' : ''} left
              </span>
            </>
          )}
        </p>

        {/* Thumbnails + entry count + edit link (fully submitted only) */}
        {complete && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingLeft: 20, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 500 }}>{comp.memberUsed}</span>
                {` of ${comp.submission_limit} submitted`}
              </span>
              {comp.memberImageUrls.length > 0 && (
                <div style={{ display: 'flex', gap: 3 }}>
                  {comp.memberImageUrls.slice(0, comp.submission_limit).map((url, i) => (
                    <div key={i} style={{ width: 30, height: 24, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-0)' }}>
                      <Image src={url} alt="" width={30} height={24} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link
              href={`/${clubSlug}/competitions`}
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--action-primary)', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              Edit selections →
            </Link>
          </div>
        )}
      </div>

      {/* Footer zone — only shown when not fully submitted */}
      {!complete && (
        <div style={{
          background:  'var(--surface-1)',
          borderTop:   '1px solid var(--border-subtle)',
          padding:     '9px 15px 11px',
          paddingLeft: 35,
          display:     'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {partial
              ? <><span style={{ fontWeight: 500 }}>{comp.memberUsed}</span>{` of ${comp.submission_limit} submitted`}</>
              : "You haven't entered yet."}
          </p>
          {userId ? (
            <OpenCompEntryButton comp={comp} userId={userId} status={partial ? 'partial' : 'none'} />
          ) : (
            <Link
              href={`/${clubSlug}/competitions`}
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--action-primary)', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              Submit an image →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Zone 2 — Recently published results ─────────────────────────────────────

type RecentResultData = {
  id:            string
  title:         string
  short_title:   string | null
  memberEntered: boolean
  memberScores:  { score: number; imageTitle: string }[]
}

// ─── Shared constants ─────────────────────────────────────────────────────────

const JUDGING_STATUSES = ['judging', 'judging_on_hold', 'results_pending'] as const

// ─── Main server component ────────────────────────────────────────────────────

export default async function CompetitionsBlock({
  settings,
  clubSlug,
}: {
  settings:  CompetitionsSettings
  clubSlug:  string
}) {
  const supabaseRaw = await createClient()
  const supabase = supabaseRaw
  const nowIso = new Date().toISOString()

  const { data: { user } } = await supabaseRaw.auth.getUser()
  const userId = user?.id ?? null

  // ── 1. Open competitions (must be open AND closes_at in the future) ────────
  const { data: openCompsRaw } = await supabase
    .from('competitions')
    .select('id, title, short_title, closes_at, submission_limit, competition_categories(id, name)')
    .eq('status', 'open')
    .gt('closes_at', nowIso)
    .order('closes_at', { ascending: true, nullsFirst: false })
    .limit(settings.maxOpenShown)

  // ── 1b. Judging competitions ──────────────────────────────────────────────
  // Include: explicit judging statuses, plus 'open' comps whose closes_at has passed
  const [{ data: judgingByStatusRaw }, { data: judgingExpiredRaw }] = await Promise.all([
    supabase
      .from('competitions')
      .select('id, title, short_title')
      .in('status', [...JUDGING_STATUSES])
      .order('closes_at', { ascending: false, nullsFirst: false }),
    supabase
      .from('competitions')
      .select('id, title, short_title')
      .eq('status', 'open')
      .lte('closes_at', nowIso)
      .order('closes_at', { ascending: false, nullsFirst: false }),
  ])

  type JudgingComp = { id: string; title: string; short_title: string | null }
  const seenJudging = new Set<string>()
  const judgingComps: JudgingComp[] = []
  for (const c of [...(judgingByStatusRaw ?? []), ...(judgingExpiredRaw ?? [])] as JudgingComp[]) {
    if (!seenJudging.has(c.id)) { seenJudging.add(c.id); judgingComps.push(c) }
  }

  const openComps: OpenComp[] = []
  if ((openCompsRaw ?? []).length > 0) {
    const openIds: string[] = (openCompsRaw ?? []).map((c: { id: string }) => c.id)

    // Total entries per open competition, also track per-category counts
    const { data: allEntriesRaw } = await supabase
      .from('submissions')
      .select('competition_id, category_id')
      .in('competition_id', openIds)
      .eq('status', 'submitted')

    const catCounts: Record<string, Record<string, number>> = {}
    for (const row of (allEntriesRaw ?? [])) {
      if (!catCounts[row.competition_id]) catCounts[row.competition_id] = {}
      catCounts[row.competition_id][row.category_id] = (catCounts[row.competition_id][row.category_id] ?? 0) + 1
    }

    // Member's entries per open competition, with image paths for thumbnails
    const memberCounts: Record<string, number> = {}
    const memberImagePaths: Record<string, string[]> = {}
    if (userId) {
      const { data: memberEntriesRaw } = await supabase
        .from('submissions')
        .select('competition_id, images(storage_path)')
        .in('competition_id', openIds)
        .eq('member_id', userId)
        .eq('status', 'submitted')

      for (const row of (memberEntriesRaw ?? [])) {
        memberCounts[row.competition_id] = (memberCounts[row.competition_id] ?? 0) + 1
        const path = (row.images as { storage_path: string } | null)?.storage_path
        if (path) {
          if (!memberImagePaths[row.competition_id]) memberImagePaths[row.competition_id] = []
          memberImagePaths[row.competition_id].push(path)
        }
      }
    }

    for (const c of (openCompsRaw ?? [])) {
      const cats = (c.competition_categories as unknown as { id: string; name: string }[]) ?? []
      const compCatCounts = catCounts[c.id] ?? {}
      openComps.push({
        id:               c.id,
        title:            c.title,
        short_title:      c.short_title,
        closes_at:        c.closes_at,
        submission_limit: c.submission_limit,
        memberUsed:       memberCounts[c.id] ?? 0,
        memberImageUrls:  (memberImagePaths[c.id] ?? []).map(
          p => supabaseRaw.storage.from('images').getPublicUrl(p).data.publicUrl
        ),
        categories:       cats.map(cat => ({ id: cat.id, name: cat.name, count: compCatCounts[cat.id] ?? 0 })),
      })
    }
  }

  // ── 2. Most recently published results ───────────────────────────────────
  let recentResult: RecentResultData | null = null

  const { data: recentCompRaw } = await supabase
    .from('competitions')
    .select('id, title, short_title, results_at')
    .eq('status', 'results_published')
    .order('results_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (recentCompRaw) {
    const compId = recentCompRaw.id

    // Only fetch member's own submissions + scores — no need for full competition data
    let memberScores: { score: number; imageTitle: string }[] = []

    if (userId) {
      const { data: memberSubsRaw } = await supabase
        .from('submissions')
        .select('id, images(title)')
        .eq('competition_id', compId)
        .eq('member_id', userId)
        .eq('status', 'submitted')

      const memberSubIds = (memberSubsRaw ?? []).map((s: { id: string }) => s.id)

      if (memberSubIds.length > 0) {
        const { data: memberScoresRaw } = await supabase
          .from('scores')
          .select('submission_id, score')
          .in('submission_id', memberSubIds)

        type ScoreRow = { submission_id: string; score: number }
        const avgBySubmission: Record<string, number> = {}
        const countBySubmission: Record<string, number> = {}
        for (const r of (memberScoresRaw ?? []) as ScoreRow[]) {
          avgBySubmission[r.submission_id]   = (avgBySubmission[r.submission_id]   ?? 0) + r.score
          countBySubmission[r.submission_id] = (countBySubmission[r.submission_id] ?? 0) + 1
        }

        for (const sub of (memberSubsRaw ?? [])) {
          const img = sub.images as { title: string } | null
          const n   = countBySubmission[sub.id] ?? 0
          if (n === 0) continue
          memberScores.push({ score: avgBySubmission[sub.id] / n, imageTitle: img?.title ?? '' })
        }
        memberScores.sort((a, b) => b.score - a.score)
      }
    }

    recentResult = {
      id:            compId,
      title:         recentCompRaw.title,
      short_title:   recentCompRaw.short_title,
      memberEntered: memberScores.length > 0,
      memberScores,
    }
  }

  // ── 3. Upcoming competitions ──────────────────────────────────────────────
  type UpcomingComp = { id: string; title: string; short_title: string | null; opens_at: string }
  let upcomingComps: UpcomingComp[] = []

  if (settings.showComingSoon) {
    const { data: upcomingRaw } = await supabase
      .from('competitions')
      .select('id, title, short_title, opens_at')
      .eq('status', 'draft')
      .not('opens_at', 'is', null)
      .gt('opens_at', new Date().toISOString())
      .order('opens_at', { ascending: true })
      .limit(1)

    upcomingComps = (upcomingRaw ?? []) as UpcomingComp[]
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  const hasAnything = openComps.length > 0 || judgingComps.length > 0 || recentResult || upcomingComps.length > 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="border-b border-[var(--border-subtle)] py-7 last:border-b-0">
      {/* Block heading + "View all results" link on same row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{
          fontFamily:    'var(--font-lora, Georgia, serif)',
          fontSize:      18,
          fontWeight:    700,
          letterSpacing: '-0.01em',
          color:         'var(--text-primary)',
          lineHeight:    1.3,
          margin:        0,
        }}>
          {settings.heading}
        </h2>
        <Link
          href={`/${clubSlug}/competitions/results`}
          style={{ fontSize: 13, fontWeight: 500, color: 'var(--action-primary)', textDecoration: 'none', flexShrink: 0 }}
        >
          View all results →
        </Link>
      </div>

      {!hasAnything ? (
        /* Empty state */
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            No competitions yet. Check back soon — your club admin will announce upcoming competitions here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Zone 1 — Open now */}
          {openComps.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {openComps.map(comp => (
                <OpenCompCard key={comp.id} comp={comp} userId={userId} clubSlug={clubSlug} />
              ))}
            </div>
          )}

          {/* Zone 1b — Judging in progress */}
          {judgingComps.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {judgingComps.map(comp => (
                <div key={comp.id} style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          10,
                  padding:      '10px 14px 10px 12px',
                  borderRadius: 10,
                  border:       '1px solid var(--border-default)',
                  borderLeft:   '3px solid var(--status-warning)',
                  background:   'var(--phase-warning-bg)',
                }}>
                  <span style={{ fontSize: 15, color: 'var(--status-warning)', flexShrink: 0, lineHeight: 1 }}>◐</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-lora, Georgia, serif)', flex: 1, minWidth: 0 }}>
                    {displayName(comp)}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--status-warning)', flexShrink: 0 }}>
                    Judging in progress
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Zone 2 — Recently published results */}
          {recentResult && (
            <div style={{
              background:   'var(--surface-1)',
              borderRadius: 10,
              padding:      '13px 15px',
              border:       '1px solid var(--border-default)',
              borderLeft:   '3px solid var(--action-primary)',
            }}>
              {/* Name + "Results published" */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 7 }}>
                <span style={{ color: 'var(--action-primary)', fontSize: 13, flexShrink: 0, lineHeight: 1, marginTop: 1 }}>✓</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: 'var(--font-lora, Georgia, serif)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {displayName(recentResult)}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 6 }}>
                    — Results published
                  </span>
                </div>
              </div>

              {/* Scores row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingLeft: 20, borderTop: '1px solid var(--border-subtle)', paddingTop: 9 }}>
                {recentResult.memberEntered ? (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Your scores:{' '}
                    {recentResult.memberScores.map((s, i) => (
                      <span key={i}>
                        {i > 0 && <span style={{ userSelect: 'none' }}>{'  '}</span>}
                        <span title={s.imageTitle} style={{ fontWeight: 600, color: 'var(--text-primary)', cursor: 'help' }}>
                          {s.score.toFixed(1)}
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
                  href={`/${clubSlug}/competitions/results/${recentResult.id}`}
                  style={{ fontSize: 12, fontWeight: 600, color: 'var(--action-primary)', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
                >
                  View full results →
                </Link>
              </div>
            </div>
          )}

          {/* Zone 3 — Coming soon */}
          {settings.showComingSoon && upcomingComps.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                Coming up
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {upcomingComps.map(comp => {
                  const openLabel = comp.opens_at
                    ? new Date(comp.opens_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                    : null
                  return (
                    <p key={comp.id} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{displayName(comp)}</span>
                      {openLabel && <span style={{ color: 'var(--text-tertiary)' }}> · Submissions open {openLabel}</span>}
                    </p>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

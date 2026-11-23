import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import CategoryCard from './CategoryCard'
import SubmitButton from './SubmitButton'
import StatusBadge, { type JudgeStatus } from './StatusBadge'
import ResetJudgingButton from './ResetJudgingButton'
import JudgeGuideModal from './JudgeGuideModal'
import type { AwardTier } from '@/types/competition'

export default async function JudgeLandingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Session guard
  const cookieStore = await cookies()
  if (cookieStore.get(`jv_${token}`)?.value !== '1') {
    redirect(`/judge/${token}/access`)
  }

  const supabase = createServiceClient()

  // Club contact — used for the "contact us" link in the welcome banner
  const { data: clubSettings } = await supabase
    .from('club_settings')
    .select('contact_email')
    .single()
  const contactEmail = (clubSettings as unknown as { contact_email?: string | null } | null)?.contact_email ?? null

  const { data: judgeToken } = await supabase
    .from('judge_tokens')
    .select('id, judge_name, competition_id, submitted_at, competitions(title, short_title, status, judge_instructions, preset, awards_enabled, award_types, score_min, score_max, require_feedback, judging_closes_at, results_at, score_aggregation, blind_judging)')
    .eq('token', token)
    .single()

  const competition = judgeToken?.competitions as unknown as {
    title:              string
    short_title:        string | null
    status:             string
    judge_instructions: string | null
    preset:             string
    awards_enabled:     boolean
    award_types:        AwardTier[]
    score_min:          number
    score_max:          number
    require_feedback:   boolean
    judging_closes_at:  string | null
    results_at:         string | null
    score_aggregation:  'sum' | 'average' | 'drop_extremes'
    blind_judging:      boolean
  } | null

  // Let submitted judges through regardless of competition status — they need
  // to see their confirmation state even after the competition moves to results_pending.
  const alreadySubmitted = !!judgeToken?.submitted_at
  if (!judgeToken || (competition?.status !== 'judging' && !alreadySubmitted)) {
    redirect(`/judge/${token}/expired`)
  }
  // competition is non-null here: judgeToken exists and joins competitions
  const comp = competition!

  const isSubmitted   = !!judgeToken.submitted_at
  const awardsEnabled = comp.awards_enabled ?? false
  const awardTypes    = (comp.award_types ?? []) as AwardTier[]
  const isAwardsOnly  = comp.preset === 'awards-only'

  // Fetch categories
  const { data: categories } = await supabase
    .from('competition_categories')
    .select('id, name')
    .eq('competition_id', judgeToken.competition_id)

  // Fetch all submitted entries for this competition
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, category_id')
    .eq('competition_id', judgeToken.competition_id)
    .eq('status', 'submitted')

  // Fetch all scores this judge has given (with award_id)
  const { data: scores } = await supabase
    .from('scores')
    .select('submission_id, award_id')
    .eq('judge_token_id', judgeToken.id)

  const scoredSet = new Set(scores?.map(s => s.submission_id) ?? [])

  // Fetch awards-pass completions for this judge
  const { data: awardsCompletions } = await supabase
    .from('judge_category_awards')
    .select('category_id')
    .eq('judge_token_id', judgeToken.id)

  const awardsCompleteSet = new Set(awardsCompletions?.map(a => a.category_id) ?? [])

  // Fetch other judges in this competition (for judging panel)
  const { data: otherJudgeTokens } = await supabase
    .from('judge_tokens')
    .select('id, judge_name, submitted_at')
    .eq('competition_id', judgeToken.competition_id)
    .neq('id', judgeToken.id)

  const otherJudgeIds = (otherJudgeTokens ?? []).map(j => j.id)
  const { data: otherJudgeScores } = otherJudgeIds.length > 0
    ? await supabase
        .from('scores')
        .select('judge_token_id')
        .in('judge_token_id', otherJudgeIds)
    : { data: [] }

  const judgesWithScores = new Set(otherJudgeScores?.map(s => s.judge_token_id) ?? [])
  const otherJudges = (otherJudgeTokens ?? []).map(j => ({
    name:   j.judge_name as string,
    status: (j.submitted_at ? 'complete' : judgesWithScores.has(j.id) ? 'in-progress' : 'not-started') as JudgeStatus,
  }))

  // Category stats
  type CategoryStat = {
    id:             string
    name:           string
    total:          number
    scored:         number
    awardsComplete: boolean
  }

  const categoryStats: CategoryStat[] = (categories ?? []).map(cat => {
    const catSubs = (submissions ?? []).filter(s => s.category_id === cat.id)
    const scored  = catSubs.filter(s => scoredSet.has(s.id)).length
    return {
      id:             cat.id,
      name:           cat.name,
      total:          catSubs.length,
      scored,
      awardsComplete: awardsCompleteSet.has(cat.id),
    }
  })

  const totalEntries = submissions?.length ?? 0
  const totalScored  = scoredSet.size

  const scoringDone = isAwardsOnly
    ? true
    : totalEntries > 0 && totalScored >= totalEntries

  const allAwardsDone = awardsEnabled
    ? categoryStats.every(c => c.awardsComplete)
    : true

  const allDone    = scoringDone && allAwardsDone
  const firstName  = judgeToken.judge_name.split(' ')[0]
  const progressPct = totalEntries > 0 ? Math.round((totalScored / totalEntries) * 100) : 0

  // This judge's overall status for the panel
  const myStatus: JudgeStatus = isSubmitted ? 'complete' : totalScored > 0 ? 'in-progress' : 'not-started'

  // Deadline / results dates
  const now = new Date()
  const judgingDeadline = comp.judging_closes_at ? new Date(comp.judging_closes_at) : null
  const resultsDate     = comp.results_at         ? new Date(comp.results_at)         : null
  const daysRemainingRaw = judgingDeadline
    ? Math.ceil((judgingDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null
  const deadlinePassed = daysRemainingRaw !== null && daysRemainingRaw < 0
  const daysRemaining  = daysRemainingRaw !== null ? Math.max(0, daysRemainingRaw) : null

  const formatDate = (d: Date) =>
    d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-0)', color: 'var(--text-primary)' }}>

      {/* Welcome banner */}
      <section style={{ borderBottom: '1px solid var(--border-default)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px 72px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 20 }}>
            <h1 style={{
              fontFamily:    'var(--font-heading)',
              fontSize:      'clamp(32px, 5vw, 56px)',
              fontWeight:    500,
              lineHeight:    1.15,
              letterSpacing: '-0.02em',
              color:         'var(--text-primary)',
              margin:        0,
              maxWidth:      800,
            }}>
              Welcome {firstName}.{' '}
              <span style={{ color: 'var(--text-secondary)' }}>Happy to have you judging this competition.</span>
            </h1>
            <div style={{ paddingTop: 8, flexShrink: 0 }}>
              <ResetJudgingButton token={token} />
            </div>
          </div>
          <div style={{ maxWidth: 600, marginBottom: 16 }}>
            <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 6px' }}>
              You&apos;re judging{' '}
              <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{comp.short_title ?? comp.title}</strong>.
            </p>
            <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 6px', whiteSpace: 'nowrap' }}>
              {judgingDeadline && deadlinePassed
                ? <>The judging window closed on <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{formatDate(judgingDeadline)}</strong> — contact the club administrator if you still need to submit.</>
                : judgingDeadline
                  ? <>You have until <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{formatDate(judgingDeadline)}</strong> when the judging window closes — your progress saves automatically.</>
                  : <>Your progress saves automatically — you can return at any time before the deadline.</>}
            </p>
            <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
              If you have any issues{' '}
              {contactEmail
                ? <a href={`mailto:${contactEmail}`} style={{ color: 'var(--action-primary)', textDecoration: 'none', fontWeight: 500 }}>contact us</a>
                : <span>contact us</span>}.
            </p>
          </div>
          <JudgeGuideModal />
        </div>
      </section>

      {/* Two-column content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 96px' }}>
        <style>{`
          .judge-landing-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 32px;
          }
          @media (min-width: 1024px) {
            .judge-landing-grid {
              grid-template-columns: 2fr 3fr;
            }
          }
        `}</style>
        <div className="judge-landing-grid">

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Competition overview */}
            <section style={{
              borderRadius: 16,
              border:       '1px solid var(--border-default)',
              background:   'var(--surface-2)',
              padding:      28,
              boxShadow:    '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <p style={{
                fontSize:      11,
                fontWeight:    500,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color:         'var(--text-secondary)',
                margin:        '0 0 20px',
              }}>
                Competition overview
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{
                  fontFamily:         'var(--font-heading)',
                  fontSize:           64,
                  fontWeight:         600,
                  letterSpacing:      '-0.03em',
                  color:              'var(--text-primary)',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight:         1,
                }}>
                  {totalEntries}
                </span>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>images</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '8px 0 0' }}>
                across {categoryStats.length} {categoryStats.length === 1 ? 'category' : 'categories'}
              </p>
            </section>

            {/* How to score / instructions */}
            <section style={{
              borderRadius: 16,
              border:       '1px solid rgba(0,151,167,0.30)',
              background:   'rgba(0,151,167,0.06)',
              padding:      28,
            }}>
              <h2 style={{
                fontFamily:    'var(--font-heading)',
                fontSize:      18,
                fontWeight:    600,
                letterSpacing: '-0.01em',
                color:         'var(--text-primary)',
                margin:        '0 0 16px',
              }}>
                How to score
              </h2>
              <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!isAwardsOnly && (
                  <li style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-primary)', opacity: 0.85 }}>
                    Score each image on a scale of{' '}
                    <strong style={{ fontWeight: 600 }}>{comp.score_min}–{comp.score_max}</strong>.
                  </li>
                )}
                {categoryStats.length > 1 && (
                  <li style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-primary)', opacity: 0.85 }}>
                    There {categoryStats.length === 2 ? 'are' : 'are'}{' '}
                    <strong style={{ fontWeight: 600 }}>{categoryStats.length} categories</strong> — judge each one separately at your own pace.
                  </li>
                )}
                <li style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-primary)', opacity: 0.85 }}>
                  {comp.require_feedback
                    ? <>Written feedback is <strong style={{ fontWeight: 600 }}>required</strong> for every image.</>
                    : 'Written feedback is optional but encouraged.'}
                </li>
                <li style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-primary)', opacity: 0.85 }}>
                  Your progress saves automatically — you can return at any time before the deadline.
                </li>
              </ul>

              {comp.judge_instructions && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(0,151,167,0.20)' }}>
                  <p style={{
                    fontSize:      11,
                    fontWeight:    500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color:         'var(--text-secondary)',
                    margin:        '0 0 8px',
                  }}>
                    A note from the club
                  </p>
                  <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--text-primary)', margin: 0, opacity: 0.85, whiteSpace: 'pre-wrap' }}>
                    {comp.judge_instructions}
                  </p>
                </div>
              )}
            </section>

            {/* Judging panel */}
            <section style={{
              borderRadius: 16,
              border:       '1px solid var(--border-default)',
              background:   'var(--surface-2)',
              padding:      28,
              boxShadow:    '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <h2 style={{
                fontFamily:    'var(--font-heading)',
                fontSize:      18,
                fontWeight:    600,
                letterSpacing: '-0.01em',
                color:         'var(--text-primary)',
                margin:        '0 0 8px',
              }}>
                Judging panel
              </h2>

              {otherJudges.length === 0 ? (
                /* Sole judge */
                <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                  You are the sole judge for this competition.
                </p>
              ) : (
                /* Multiple judges */
                <>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
                    You are one of{' '}
                    <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {otherJudges.length + 1} judges
                    </strong>{' '}
                    scoring this competition.
                  </p>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    <li style={{
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'space-between',
                      padding:        '12px 0',
                      borderBottom:   '1px solid var(--border-subtle)',
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {judgeToken.judge_name}{' '}
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 400 }}>(you)</span>
                      </span>
                      <StatusBadge status={myStatus} />
                    </li>
                    {otherJudges.map((j, i) => (
                      <li
                        key={i}
                        style={{
                          display:        'flex',
                          alignItems:     'center',
                          justifyContent: 'space-between',
                          padding:        '12px 0',
                          borderBottom:   i < otherJudges.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        }}
                      >
                        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>
                          {j.name}
                        </span>
                        <StatusBadge status={j.status} />
                      </li>
                    ))}
                  </ul>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', margin: '20px 0 0' }}>
                    {comp.score_aggregation === 'sum'
                      ? "Scores from all judges will be summed to produce each image's final score."
                      : comp.score_aggregation === 'drop_extremes'
                        ? "The highest and lowest scores will be dropped, and the remainder averaged."
                        : "Scores from all judges will be averaged to produce each image's final score."}
                  </p>
                  {comp.blind_judging && (
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', margin: '8px 0 0' }}>
                      Blind judging is enabled — you will not see other judges&apos; scores while the judging window is open.
                    </p>
                  )}
                </>
              )}
            </section>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Your progress */}
            <section style={{
              borderRadius: 16,
              border:       '1px solid var(--border-default)',
              background:   'var(--surface-2)',
              padding:      28,
              boxShadow:    '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: judgingDeadline || resultsDate ? 12 : 20 }}>
                <h2 style={{
                  fontFamily:    'var(--font-heading)',
                  fontSize:      18,
                  fontWeight:    600,
                  letterSpacing: '-0.01em',
                  color:         'var(--text-primary)',
                  margin:        0,
                }}>
                  Your progress
                </h2>
                {!isAwardsOnly && (
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                    {progressPct}%
                  </span>
                )}
              </div>

              {/* Deadline + results dates */}
              {(judgingDeadline || resultsDate) && (
                <div style={{
                  display:      'flex',
                  gap:          20,
                  marginBottom: 20,
                  flexWrap:     'wrap',
                }}>
                  {judgingDeadline && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-secondary)', margin: '0 0 2px' }}>
                        Judging deadline
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                        {formatDate(judgingDeadline)}
                      </p>
                    </div>
                  )}
                  {resultsDate && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-secondary)', margin: '0 0 2px' }}>
                        Results reveal
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                        {formatDate(resultsDate)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!isAwardsOnly && (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 20 }}>
                    <span style={{
                      fontFamily:         'var(--font-heading)',
                      fontSize:           52,
                      fontWeight:         600,
                      letterSpacing:      '-0.03em',
                      color:              'var(--text-primary)',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight:         1,
                    }}>
                      {totalScored}
                    </span>
                    <span style={{ fontSize: 16, color: 'var(--text-secondary)' }}>
                      of {totalEntries} scored
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={totalScored}
                    aria-valuemin={0}
                    aria-valuemax={totalEntries}
                    style={{ height: 12, borderRadius: 9999, background: 'var(--surface-1)', overflow: 'hidden' }}
                  >
                    <div style={{
                      height:       '100%',
                      width:        totalEntries > 0 ? `${(totalScored / totalEntries) * 100}%` : '0%',
                      background:   scoringDone ? 'var(--status-success)' : 'var(--action-primary)',
                      borderRadius: 9999,
                      transition:   'width 0.5s ease-out',
                    }} />
                  </div>
                </>
              )}

              {/* Awards progress — shown when awards enabled */}
              {awardsEnabled && (
                <div style={{ marginTop: isAwardsOnly ? 0 : 20, opacity: scoringDone ? 1 : 0.5 }}>
                  {!isAwardsOnly && (
                    <p style={{
                      fontSize:      11,
                      fontWeight:    500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color:         'var(--text-secondary)',
                      margin:        '0 0 10px',
                    }}>
                      Awards pass
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                    {isAwardsOnly ? (
                      <>
                        <span style={{
                          fontFamily:         'var(--font-heading)',
                          fontSize:           52,
                          fontWeight:         600,
                          letterSpacing:      '-0.03em',
                          color:              'var(--text-primary)',
                          fontVariantNumeric: 'tabular-nums',
                          lineHeight:         1,
                        }}>
                          {awardsCompleteSet.size}
                        </span>
                        <span style={{ fontSize: 16, color: 'var(--text-secondary)' }}>
                          of {categoryStats.length} {categoryStats.length === 1 ? 'category' : 'categories'} reviewed
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                        {awardsCompleteSet.size} of {categoryStats.length} {categoryStats.length === 1 ? 'category' : 'categories'} reviewed
                      </span>
                    )}
                  </div>
                  <div style={{ height: 8, borderRadius: 9999, background: 'var(--surface-1)', overflow: 'hidden' }}>
                    <div style={{
                      height:       '100%',
                      width:        categoryStats.length > 0 ? `${(awardsCompleteSet.size / categoryStats.length) * 100}%` : '0%',
                      background:   allAwardsDone ? 'var(--status-success)' : 'var(--spot-gold)',
                      borderRadius: 9999,
                      transition:   'width 0.5s ease-out',
                    }} />
                  </div>
                  {!scoringDone && (
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '8px 0 0' }}>
                      Complete scoring first to unlock awards assignment.
                    </p>
                  )}
                </div>
              )}

              {/* Countdown */}
              {daysRemaining !== null && !isSubmitted && !deadlinePassed && (
                <div style={{
                  marginTop:    20,
                  padding:      '12px 16px',
                  borderRadius: 10,
                  background:   daysRemaining <= 2
                    ? 'var(--status-warning-bg)'
                    : 'var(--surface-1)',
                  border:       `1px solid ${daysRemaining <= 2 ? 'var(--status-warning)' : 'var(--border-subtle)'}`,
                  display:      'flex',
                  alignItems:   'center',
                  gap:          10,
                }}>
                  <span style={{ fontSize: 20 }}>{daysRemaining <= 2 ? '⚠️' : '⏱'}</span>
                  <p style={{ fontSize: 14, color: daysRemaining <= 2 ? 'var(--status-warning-text)' : 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {daysRemaining === 0
                      ? <><strong style={{ fontWeight: 600 }}>Judging closes today.</strong> Submit your scores before the window closes.</>
                      : daysRemaining === 1
                        ? <><strong style={{ fontWeight: 600 }}>1 day remaining</strong> — judging window closes tomorrow.</>
                        : <><strong style={{ fontWeight: 600 }}>{daysRemaining} days remaining</strong> in the judging window.</>}
                  </p>
                </div>
              )}

              {/* Submit area */}
              <div style={{
                marginTop:   28,
                paddingTop:  24,
                borderTop:   '1px solid var(--border-default)',
                display:     'flex',
                flexDirection: 'column',
                gap:         16,
              }}>
                {isSubmitted ? (
                  <div style={{
                    padding:      '20px 24px',
                    background:   'var(--status-success-bg)',
                    borderRadius: 12,
                    border:       '1px solid var(--status-success)',
                    textAlign:    'center',
                  }}>
                    <p style={{ fontSize: 24, margin: '0 0 8px' }}>✓</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--status-success-text)', margin: '0 0 6px' }}>
                      {awardsEnabled ? 'Scores and awards submitted' : 'Scores submitted'}
                    </p>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                      Thank you, {firstName}. Your {awardsEnabled ? 'scores and awards' : 'scores'} have been received.
                      The club admin has been notified. You can close this window.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                        {allDone
                          ? `All ${isAwardsOnly ? 'categories reviewed' : `${totalEntries} images scored`}${awardsEnabled ? ' and awards assigned' : ''}. Submit to send to the club.`
                          : !scoringDone
                            ? 'Score every image across all categories to submit.'
                            : 'Complete awards assignment in all categories to submit.'}
                      </p>
                      {allDone ? (
                        <SubmitButton
                          token={token}
                          judgeName={judgeToken.judge_name}
                          competitionTitle={comp.title}
                          awardsEnabled={awardsEnabled}
                          isAwardsOnly={isAwardsOnly}
                        />
                      ) : (
                        <button
                          disabled
                          style={{
                            width:        '100%',
                            borderRadius: 10,
                            padding:      '15px 20px',
                            fontSize:     16,
                            fontWeight:   700,
                            border:       '1px solid var(--border-default)',
                            background:   'none',
                            color:        'var(--text-disabled)',
                            cursor:       'not-allowed',
                          }}
                        >
                          {awardsEnabled ? 'Submit scores and awards' : 'Submit all scores'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Categories */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 4px 16px' }}>
                <h2 style={{
                  fontFamily:    'var(--font-heading)',
                  fontSize:      18,
                  fontWeight:    600,
                  letterSpacing: '-0.01em',
                  color:         'var(--text-primary)',
                  margin:        0,
                }}>
                  Categories
                </h2>
                <span style={{
                  fontSize:      11,
                  fontWeight:    500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color:         'var(--text-secondary)',
                }}>
                  {categoryStats.length} total
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {categoryStats.map(cat => (
                  <CategoryCard
                    key={cat.id}
                    token={token}
                    categoryId={cat.id}
                    name={cat.name}
                    total={cat.total}
                    scored={cat.scored}
                    awardsEnabled={awardsEnabled}
                    isAwardsOnly={isAwardsOnly}
                    awardsComplete={cat.awardsComplete}
                    scoringComplete={isAwardsOnly ? true : cat.scored >= cat.total && cat.total > 0}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

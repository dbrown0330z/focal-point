import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug } from '@/lib/club-context'

export const dynamic = 'force-dynamic'
import { LifecycleActions }  from './LifecycleActions'
import { StatusBanner }      from './StatusBanner'
import { ScheduleSection }   from './ScheduleSection'
import { InlineTitle }       from './InlineTitle'
import { JudgeSection }      from './JudgeSection'
import { headers } from 'next/headers'

function contextDate(
  status: string,
  opensAt:         string | null,
  closesAt:        string | null,
  judgingClosesAt: string | null,
  resultsAt:       string | null,
): string | null {
  const now = new Date()
  const fmt = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  if (status === 'draft' || status === 'open') {
    if (opensAt && new Date(opensAt) > now) return `Opens ${fmt(opensAt)}`
    if (closesAt) return `Closes ${fmt(closesAt)}`
  }
  if (status === 'judging' || status === 'judging_on_hold') {
    if (judgingClosesAt) return `Judging closes ${fmt(judgingClosesAt)}`
  }
  if (status === 'results_pending' && resultsAt) return `Results ${fmt(resultsAt)}`
  return null
}

const statusStyles: Record<string, string> = {
  draft:             'bg-surface-1 text-content-secondary',
  open:              'bg-status-success-bg text-status-success-text',
  judging:           'bg-status-warning-bg text-status-warning-text',
  judging_on_hold:   'bg-status-error-bg text-status-error-text',
  closed:            'bg-surface-1 text-content-tertiary',
  cancelled:         'bg-surface-1 text-content-tertiary',
  results_pending:   'bg-surface-1 text-content-secondary',
  results_published: 'bg-status-success-bg text-status-success-text',
}

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const clubSlug        = await requireClubSlug()
  const supabase        = await createClient()
  const admin = createServiceClient()

  const { data: competition } = await admin
    .from('competitions')
    .select('*, competition_categories(*), judge_tokens(id, judge_name, judge_email, token, access_code, invitation_sent_at)')
    .eq('id', id)
    .single()

  if (!competition) notFound()

  // Fetch submission count and per-category breakdown in parallel with judge directory
  const [
    { count: submissionCount },
    { data: submissionRows },
    { data: judgeDirectory },
    { data: venueRows },
  ] = await Promise.all([
    admin
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('competition_id', id),
    admin
      .from('submissions')
      .select('category_id')
      .eq('competition_id', id),
    admin
      .from('judge_directory')
      .select('id, name, email')
      .order('name', { ascending: true }),
    admin
      .from('competitions')
      .select('results_location_venue')
      .not('results_location_venue', 'is', null),
  ])

  const headersList = await headers()
  const origin = `${headersList.get('x-forwarded-proto') ?? 'http'}://${headersList.get('host')}`

  const isTerminal = ['closed', 'cancelled', 'results_published'].includes(competition.status)
  const nameEditable = !isTerminal

  const comp = competition as typeof competition & {
    judging_opens_at?:           string | null
    judging_closes_at?:          string | null
    archived_at?:                string | null
    cancelled_at?:               string | null
    cancellation_reason?:        string | null
    results_at?:                 string | null
    results_event_type?:         string | null
    results_location_mode?:      string | null
    results_location_venue?:     string | null
    results_publish_visibility?: string | null
  }

  const existingVenues = Array.from(new Set(
    (venueRows ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(r => (r as any).results_location_venue as string | null)
      .filter((v): v is string => !!v)
  ))

  const judgeName  = comp.judge_tokens?.[0]?.judge_name ?? null
  const categories = comp.competition_categories as { id: string; name: string }[]

  // Build per-category submission counts
  const catCountMap: Record<string, number> = {}
  for (const s of submissionRows ?? []) {
    catCountMap[s.category_id] = (catCountMap[s.category_id] ?? 0) + 1
  }
  const categoryData = categories.map(c => ({
    id:    c.id,
    name:  c.name,
    count: catCountMap[c.id] ?? 0,
  }))

  // Judge dropdown uses only the judge directory
  const members = (judgeDirectory ?? []).map(j => ({
    id:    `dir_${j.id}`,
    name:  j.name,
    email: j.email ?? '',
  }))

  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <Link href={`/${clubSlug}/admin/competitions`} className="inline-flex items-center gap-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Competitions
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-6">

        {/* Left: title + status chip + contextual date */}
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <InlineTitle id={id} title={competition.title} editable={nameEditable} />
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[competition.status] ?? 'bg-surface-1 text-content-secondary'}`}>
              {competition.status.replace(/_/g, ' ')}
            </span>
            {comp.archived_at && (
              <span className="rounded-full bg-surface-1 px-2.5 py-0.5 text-xs font-medium text-content-tertiary">
                Archived
              </span>
            )}
            {(() => {
              const cd = contextDate(
                competition.status,
                competition.opens_at ?? null,
                competition.closes_at ?? null,
                comp.judging_closes_at ?? null,
                comp.results_at ?? null,
              )
              return cd ? <span className="text-sm text-content-secondary">{cd}</span> : null
            })()}
          </div>
        </div>

        {/* Right: lifecycle actions */}
        <div className="shrink-0">
          <LifecycleActions
            id={id}
            title={competition.title}
            status={competition.status}
            submissionCount={submissionCount ?? 0}
            isArchived={!!comp.archived_at}
          />
        </div>

      </div>

      {/* Results link — only when results are published */}
      {(competition.status === 'results_published' || competition.status === 'closed') && (
        <Link
          href={`/${clubSlug}/competitions/results/${id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-default bg-surface-1 px-4 py-2 text-sm font-medium text-content-primary hover:bg-surface-2 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" />
          </svg>
          View member results page →
        </Link>
      )}

      {/* Status banner */}
      <StatusBanner
        id={id}
        status={competition.status}
        opensAt={competition.opens_at ?? null}
        closesAt={competition.closes_at ?? null}
        judgingOpensAt={comp.judging_opens_at ?? null}
        judgingClosesAt={comp.judging_closes_at ?? null}
        cancelledAt={comp.cancelled_at ?? null}
        cancellationReason={comp.cancellation_reason ?? null}
        submissionCount={submissionCount ?? 0}
        judgeName={judgeName}
        categories={categoryData}
      />

      {/* Schedule */}
      <ScheduleSection
        id={id}
        status={competition.status}
        opensAt={competition.opens_at ?? null}
        closesAt={competition.closes_at ?? null}
        judgingOpensAt={comp.judging_opens_at ?? null}
        judgingClosesAt={comp.judging_closes_at ?? null}
        results={{
          resultsAt:         comp.results_at         ?? null,
          resultsEventType:  comp.results_event_type ?? null,
          locationMode:      comp.results_location_mode      ?? null,
          locationVenue:     comp.results_location_venue     ?? null,
          publishVisibility: comp.results_publish_visibility ?? null,
        }}
        existingVenues={existingVenues}
      />

      {/* Judge */}
      <section id="judge">
        <h2 className="mt-[15px] mb-3 text-sm font-medium uppercase tracking-wider text-content-tertiary">Judge</h2>
        <JudgeSection
          competitionId={id}
          competitionStatus={competition.status}
          judgeTokens={comp.judge_tokens ?? []}
          judgingOpensAt={comp.judging_opens_at ?? null}
          judgingClosesAt={comp.judging_closes_at ?? null}
          origin={origin}
          members={members}
        />
      </section>


    </div>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
import { LifecycleActions }  from './LifecycleActions'
import { StatusBanner }      from './StatusBanner'
import { ScheduleSection }   from './ScheduleSection'
import { InlineTitle }       from './InlineTitle'
import { JudgeSection }      from './JudgeSection'
import { EntriesSection }    from './EntriesSection'
import { headers } from 'next/headers'

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
  const supabase        = await createClient()
  const serviceSupabase = createServiceClient()

  const { data: competition } = await supabase
    .from('competitions')
    .select('*, competition_categories(*), judge_tokens(id, judge_name, judge_email, token)')
    .eq('id', id)
    .single()

  if (!competition) notFound()

  // Fetch submission count and per-category breakdown in parallel with members list
  const [
    { count: submissionCount },
    { data: submissionRows },
    { data: profiles },
  ] = await Promise.all([
    supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('competition_id', id),
    supabase
      .from('submissions')
      .select('category_id')
      .eq('competition_id', id),
    serviceSupabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('membership_status', ['active', 'complimentary'])
      .order('last_name', { ascending: true }),
  ])

  const headersList = await headers()
  const origin = `${headersList.get('x-forwarded-proto') ?? 'http'}://${headersList.get('host')}`

  const isTerminal = ['closed', 'cancelled', 'results_published'].includes(competition.status)
  const nameEditable = !isTerminal

  const comp = competition as typeof competition & {
    judging_opens_at?:    string | null
    judging_closes_at?:   string | null
    archived_at?:         string | null
    cancelled_at?:        string | null
    cancellation_reason?: string | null
    results_at?:          string | null
    results_event_type?:  string | null
  }

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

  const members = (profiles ?? []).map(p => ({
    id:   p.id,
    name: [p.first_name, p.last_name].filter(Boolean).join(' ') || '—',
  }))

  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <Link href="/admin/competitions" className="inline-flex items-center gap-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Competitions
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2 min-w-0">
          <InlineTitle id={id} title={competition.title} editable={nameEditable} />
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[competition.status] ?? 'bg-surface-1 text-content-secondary'}`}>
              {competition.status.replace(/_/g, ' ')}
            </span>
            {comp.archived_at && (
              <span className="rounded-full bg-surface-1 px-2.5 py-0.5 text-xs font-medium text-content-tertiary">
                Archived
              </span>
            )}
          </div>
        </div>
        <LifecycleActions
          id={id}
          title={competition.title}
          status={competition.status}
          submissionCount={submissionCount ?? 0}
          isArchived={!!comp.archived_at}
        />
      </div>

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
      />

      {/* Schedule */}
      <ScheduleSection
        id={id}
        status={competition.status}
        opensAt={competition.opens_at ?? null}
        closesAt={competition.closes_at ?? null}
        judgingOpensAt={comp.judging_opens_at ?? null}
        judgingClosesAt={comp.judging_closes_at ?? null}
        resultsAt={comp.results_at ?? null}
        resultsEventType={comp.results_event_type ?? null}
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

      {/* Entries */}
      <EntriesSection
        competitionId={id}
        submissionCount={submissionCount ?? 0}
        categories={categoryData}
      />

    </div>
  )
}

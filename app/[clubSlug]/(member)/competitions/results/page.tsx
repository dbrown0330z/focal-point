import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug } from '@/lib/club-context'

export const dynamic = 'force-dynamic'

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export default async function CompetitionResultsIndexPage() {
  const clubSlug = await requireClubSlug()
  const admin    = createServiceClient()

  // Fetch all competitions with published results, newest first
  const { data: compsRaw } = await admin
    .from('competitions')
    .select('id, title, closes_at, judge_tokens(judge_name)')
    .in('status', ['results_published', 'closed'])
    .is('deleted_at', null)
    .order('closes_at', { ascending: false })

  type JudgeToken = { judge_name: string }
  type CompRow = {
    id: string
    title: string
    closes_at: string | null
    judge_tokens: JudgeToken[] | null
  }
  const comps: CompRow[] = (compsRaw as CompRow[] | null) ?? []

  // Get submission counts for each competition
  const withCounts = await Promise.all(
    comps.map(async comp => {
      const { count } = await admin
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('competition_id', comp.id)
        .eq('status', 'submitted')

      const judgeName = (comp.judge_tokens as JudgeToken[] | null)?.[0]?.judge_name ?? null

      return {
        id:         comp.id,
        title:      comp.title,
        closesAt:   comp.closes_at,
        judgeName,
        imageCount: count ?? 0,
      }
    })
  )

  return (
    <div style={{ paddingBottom: 64 }}>
      {/* Page header */}
      <div className="mb-8">
        <h1
          className="text-[28px] font-bold leading-tight tracking-[-0.02em]"
          style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}
        >
          Competition Results
        </h1>
        {withCounts.length > 0 && (
          <p className="mt-1 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            {withCounts.length} published {withCounts.length === 1 ? 'competition' : 'competitions'}
          </p>
        )}
      </div>

      {/* Results list */}
      {withCounts.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: 'var(--surface-1)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8" style={{ color: 'var(--text-tertiary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>
          <p className="text-[17px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            No results published yet
          </p>
          <p className="mt-1 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            Results will appear here once a competition has been judged and published.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {withCounts.map(comp => (
            <Link
              key={comp.id}
              href={`/${clubSlug}/competitions/results/${comp.id}`}
              className="group flex items-center justify-between rounded-xl px-5 py-4 transition-colors hover:brightness-95"
              style={{
                background: 'var(--surface-1)',
                border:     '1px solid var(--border-default)',
              }}
            >
              <div className="min-w-0">
                <p
                  className="text-[16px] font-semibold leading-snug transition-colors group-hover:underline"
                  style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}
                >
                  {comp.title}
                </p>
                <p className="mt-0.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  {[
                    comp.closesAt && fmtDate(comp.closesAt),
                    comp.judgeName && `Judge: ${comp.judgeName}`,
                    comp.imageCount > 0 && `${comp.imageCount} ${comp.imageCount === 1 ? 'entry' : 'entries'}`,
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>
              <svg
                className="ml-4 h-5 w-5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                style={{ color: 'var(--text-tertiary)' }}
                viewBox="0 0 20 20" fill="currentColor"
              >
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

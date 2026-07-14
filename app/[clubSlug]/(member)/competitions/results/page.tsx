import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug } from '@/lib/club-context'

export const dynamic = 'force-dynamic'

function fmtDate(iso: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, opts ?? { month: 'long', year: 'numeric' })
}

export default async function CompetitionResultsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const { year } = await searchParams
  const clubSlug  = await requireClubSlug()
  const admin     = createServiceClient()

  const { data: compsRaw } = await admin
    .from('competitions')
    .select('id, title, closes_at, judge_tokens(judge_name)')
    .in('status', ['results_published', 'closed'])
    .is('deleted_at', null)
    .order('closes_at', { ascending: false })

  type JudgeToken = { judge_name: string }
  type CompRow = { id: string; title: string; closes_at: string | null; judge_tokens: JudgeToken[] | null }
  const allComps: CompRow[] = (compsRaw as CompRow[] | null) ?? []

  // Derive available years from closes_at
  const allYears = [
    ...new Set(
      allComps
        .map(c => (c.closes_at ? new Date(c.closes_at).getFullYear() : null))
        .filter((y): y is number => y !== null),
    ),
  ].sort((a, b) => b - a)

  const selectedYear = year ? parseInt(year, 10) : (allYears[0] ?? new Date().getFullYear())

  const filtered = allComps.filter(
    c => c.closes_at && new Date(c.closes_at).getFullYear() === selectedYear,
  )

  const withCounts = await Promise.all(
    filtered.map(async comp => {
      const { count } = await admin
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('competition_id', comp.id)
        .eq('status', 'submitted')

      const judgeName = (comp.judge_tokens as JudgeToken[] | null)?.[0]?.judge_name ?? null
      return { id: comp.id, title: comp.title, closesAt: comp.closes_at, judgeName, imageCount: count ?? 0 }
    }),
  )

  return (
    <div style={{ paddingBottom: 64 }}>
      {/* Header row */}
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
        <h1
          className="text-[28px] font-bold leading-tight tracking-[-0.02em]"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
        >
          Competition Results
        </h1>

        {/* Year selector */}
        {allYears.length > 1 && (
          <div className="flex items-center gap-1.5">
            {allYears.map(y => (
              <Link
                key={y}
                href={`/${clubSlug}/competitions/results?year=${y}`}
                className="rounded-full px-3 py-1 text-sm font-medium transition-colors"
                style={
                  y === selectedYear
                    ? { background: 'var(--action-primary)', color: '#fff' }
                    : {
                        background: 'var(--surface-1)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-default)',
                      }
                }
              >
                {y}
              </Link>
            ))}
          </div>
        )}
      </div>

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
            No results published for {selectedYear} yet
          </p>
          <p className="mt-1 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            Results will appear here once a competition has been judged and published.
          </p>
        </div>
      ) : (
        <div
          className="overflow-hidden"
          style={{
            borderRadius: 14,
            border: '1px solid var(--border-default)',
            background: 'var(--surface-1)',
          }}
        >
          {/* Table header */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: '1fr 150px 90px 180px',
              padding: '10px 22px',
              borderBottom: '1px solid var(--border-default)',
              background: 'var(--surface-2)',
            }}
          >
            {['Competition', 'Date', 'Images', ''].map(h => (
              <p key={h} className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--text-tertiary)' }}>
                {h}
              </p>
            ))}
          </div>

          {withCounts.map((comp, i) => (
            <div
              key={comp.id}
              className="grid items-center"
              style={{
                gridTemplateColumns: '1fr 150px 90px 180px',
                padding: '14px 22px',
                borderBottom: i < withCounts.length - 1 ? '1px solid var(--border-subtle)' : undefined,
              }}
            >
              <div>
                <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {comp.title}
                </p>
                {comp.judgeName && (
                  <p className="mt-0.5 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                    Judge: {comp.judgeName}
                  </p>
                )}
              </div>
              <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                {fmtDate(comp.closesAt, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-[15px] font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                {comp.imageCount}
              </p>
              <div>
                <Link
                  href={`/${clubSlug}/competitions/results/${comp.id}`}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
                  style={{ color: 'var(--action-primary)' }}
                >
                  View full results
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

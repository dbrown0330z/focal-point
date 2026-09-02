import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function fmtDate(iso: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, opts ?? { month: 'long', year: 'numeric' })
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const { year } = await searchParams
  const supabase = await createClient()

  const { data: compsRaw } = await supabase
    .from('competitions')
    .select('id, title, closes_at, judge_tokens(judge_name)')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .in('status', ['results_published', 'closed'] as any)
    .order('closes_at', { ascending: false })

  const allComps = compsRaw ?? []

  // Derive the set of years that have results
  const allYears = [
    ...new Set(
      allComps
        .map(c => (c.closes_at ? new Date(c.closes_at).getFullYear() : null))
        .filter((y): y is number => y !== null),
    ),
  ].sort((a, b) => b - a)

  const currentYear = new Date().getFullYear()
  const selectedYear = year ? parseInt(year, 10) : (allYears[0] ?? currentYear)

  const filtered = allComps.filter(
    c => c.closes_at && new Date(c.closes_at).getFullYear() === selectedYear,
  )

  // Fetch submission counts in parallel
  const competitions = await Promise.all(
    filtered.map(async comp => {
      const { count } = await supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('competition_id', comp.id)
        .eq('status', 'submitted')

      const tokens = comp.judge_tokens as unknown as { judge_name: string }[] | null
      const judgeName = tokens?.[0]?.judge_name ?? null

      return {
        id: comp.id,
        title: comp.title,
        closes_at: comp.closes_at,
        judgeName,
        imageCount: count ?? 0,
      }
    }),
  )

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 36px 48px' }}>
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1
          className="text-[28px] font-bold tracking-[-0.02em]"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
        >
          Competition Results
        </h1>

        {/* Year selector */}
        {allYears.length > 1 && (
          <div className="flex items-center gap-1">
            {allYears.map(y => (
              <Link
                key={y}
                href={`/competitions/results?year=${y}`}
                className="rounded-full px-3 py-1 text-sm font-medium transition-colors"
                style={
                  y === selectedYear
                    ? {
                        background: 'var(--action-primary)',
                        color: '#fff',
                      }
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

      {competitions.length === 0 ? (
        <div
          className="py-16 text-center text-sm"
          style={{ color: 'var(--text-tertiary)' }}
        >
          No results published for {selectedYear} yet.
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
              gridTemplateColumns: '1fr 130px 90px 160px',
              padding: '10px 22px',
              borderBottom: '1px solid var(--border-default)',
              background: 'var(--surface-2)',
            }}
          >
            {['Competition', 'Date', 'Images', ''].map(h => (
              <p
                key={h}
                className="text-[11px] font-bold uppercase tracking-[0.06em]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {h}
              </p>
            ))}
          </div>

          {competitions.map((comp, i) => (
            <div
              key={comp.id}
              className="grid items-center"
              style={{
                gridTemplateColumns: '1fr 130px 90px 160px',
                padding: '14px 22px',
                borderBottom:
                  i < competitions.length - 1 ? '1px solid var(--border-subtle)' : undefined,
              }}
            >
              {/* Title + judge */}
              <div>
                <p
                  className="text-[14px] font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {comp.title}
                </p>
                {comp.judgeName && (
                  <p className="mt-0.5 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                    Judge: {comp.judgeName}
                  </p>
                )}
              </div>

              {/* Date */}
              <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                {fmtDate(comp.closes_at, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>

              {/* Image count */}
              <p
                className="text-[15px] font-bold"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
              >
                {comp.imageCount}
              </p>

              {/* Link */}
              <div>
                <Link
                  href={`/competitions/results/${comp.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors"
                  style={{ color: 'var(--action-primary)' }}
                >
                  View full results
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
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

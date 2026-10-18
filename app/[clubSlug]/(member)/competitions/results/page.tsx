import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug, requireClubId } from '@/lib/club-context'
import TrophyIllustration from '@/components/illustrations/TrophyIllustration'
import SeasonPicker from './SeasonPicker'

export const dynamic = 'force-dynamic'

function fmtDate(iso: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, opts ?? { month: 'long', year: 'numeric' })
}

function currentSeasonStartYear(startMonth: number): number {
  const today = new Date()
  const m = today.getMonth() + 1
  const y = today.getFullYear()
  return m >= startMonth ? y : y - 1
}

function seasonBounds(startMonth: number, startYear: number) {
  return {
    start: new Date(startYear,     startMonth - 1, 1).toISOString(),
    end:   new Date(startYear + 1, startMonth - 1, 1).toISOString(),
    label: `${startYear}–${startYear + 1}`,
  }
}

export default async function CompetitionResultsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>
}) {
  const { season } = await searchParams
  const clubSlug = await requireClubSlug()
  const clubId   = await requireClubId()
  const admin    = createServiceClient()

  // Load season_start_month from club_settings
  const { data: settingsRaw } = await admin
    .from('club_settings')
    .select('season_start_month')
    .eq('club_id', clubId)
    .single()
  const startMonth: number = (settingsRaw as { season_start_month: number | null } | null)?.season_start_month ?? 9

  const currentYear   = currentSeasonStartYear(startMonth)
  const requestedYear = season ? parseInt(season, 10) : NaN
  const seasonYear    = !isNaN(requestedYear) ? requestedYear : currentYear

  // Offer current + 5 previous seasons
  const seasonOptions = Array.from({ length: 6 }, (_, i) => {
    const y = currentYear - i
    return { year: y, label: `${y}–${y + 1}`, isCurrent: i === 0 }
  })

  const { start, end, label: seasonLabel } = seasonBounds(startMonth, seasonYear)

  const { data: compsRaw } = await admin
    .from('competitions')
    .select('id, title, status, closes_at, judge_tokens(judge_name)')
    .eq('club_id', clubId)
    .in('status', ['results_pending', 'results_published', 'closed'])
    .is('deleted_at', null)
    .gte('closes_at', start)
    .lt('closes_at', end)
    .order('closes_at', { ascending: false })

  type JudgeToken = { judge_name: string }
  type CompRow = { id: string; title: string; status: string; closes_at: string | null; judge_tokens: JudgeToken[] | null }
  const allComps: CompRow[] = (compsRaw as CompRow[] | null) ?? []

  const withCounts = await Promise.all(
    allComps.map(async comp => {
      const { count } = await admin
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('competition_id', comp.id)
        .eq('status', 'submitted')

      const judgeName = (comp.judge_tokens as JudgeToken[] | null)?.[0]?.judge_name ?? null
      return { id: comp.id, title: comp.title, status: comp.status, closesAt: comp.closes_at, judgeName, imageCount: count ?? 0 }
    }),
  )

  return (
    <div style={{ paddingBottom: 64 }}>
      {/* Header row */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1
          className="text-[28px] font-bold leading-tight tracking-[-0.02em]"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
        >
          Competition Results
        </h1>

        {/* Season selector */}
        <SeasonPicker options={seasonOptions} current={seasonYear} clubSlug={clubSlug} />
      </div>

      {withCounts.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <TrophyIllustration size={120} />
          <p className="mt-4 text-[22px] font-bold tracking-[-0.01em]"
            style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-secondary)' }}>
            No results yet this season.
          </p>
          <p className="mt-2 text-[15px]" style={{ color: 'var(--text-secondary)' }}>
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
                {comp.status === 'results_pending' ? (
                  <p className="text-[13px] italic" style={{ color: 'var(--text-tertiary)' }}>
                    Results coming soon
                  </p>
                ) : (
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
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useState } from 'react'

type CategorySlice = {
  id:    string
  name:  string
  count: number
}

type Props = {
  competitionId:  string
  submissionCount: number
  categories:     CategorySlice[]
}

const SPOT_COLORS = ['#6C47D4', '#0097A7', '#E65100', '#AD1457', '#00796B', '#7B6B38']

function DonutChart({ slices, total }: { slices: CategorySlice[]; total: number }) {
  const [hovered, setHovered] = useState<string | null>(null)

  const r    = 38
  const cx   = 55
  const cy   = 55
  const sw   = 18
  const circ = 2 * Math.PI * r

  if (total === 0) {
    return (
      <svg width="110" height="110" viewBox="0 0 110 110" aria-hidden>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EDF0F5" strokeWidth={sw} />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="16" fontWeight="600" fill="#7E8EA3" fontFamily="inherit">0</text>
      </svg>
    )
  }

  let cumulative = 0
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" aria-hidden>
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EDF0F5" strokeWidth={sw} />

      {slices.map((s, i) => {
        if (s.count === 0) return null
        const frac       = s.count / total
        const dashLen    = frac * circ
        const dashOffset = -(cumulative / total) * circ
        cumulative += s.count
        const color = SPOT_COLORS[i % SPOT_COLORS.length]
        const isHovered = hovered === s.id

        return (
          <circle
            key={s.id}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth={isHovered ? sw + 3 : sw}
            strokeDasharray={`${dashLen} ${circ}`}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-width 0.15s ease', cursor: 'default' }}
            onMouseEnter={() => setHovered(s.id)}
            onMouseLeave={() => setHovered(null)}
          />
        )
      })}

      {/* Center: show hovered slice count or total */}
      {hovered ? (
        <>
          <text x={cx} y={cy + 1} textAnchor="middle" fontSize="17" fontWeight="600" fill="#131F2E" fontFamily="inherit">
            {slices.find(s => s.id === hovered)?.count ?? ''}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize="8" fill="#7E8EA3" fontFamily="inherit">
            {slices.find(s => s.id === hovered)?.name.slice(0, 14) ?? ''}
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy + 1} textAnchor="middle" fontSize="20" fontWeight="600" fill="#131F2E" fontFamily="inherit">
            {total}
          </text>
          <text x={cx} y={cy + 13} textAnchor="middle" fontSize="8" fill="#7E8EA3" fontFamily="inherit">
            entries
          </text>
        </>
      )}
    </svg>
  )
}

export function EntriesSection({ competitionId, submissionCount, categories }: Props) {
  const hasCategories = categories.length > 0

  return (
    <section>
      <h2 className="mt-[15px] mb-3 text-sm font-medium uppercase tracking-wider text-content-tertiary">Entries</h2>
      <div className="rounded-xl border border-border-default bg-surface-2 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-content-primary">
                {submissionCount} submitted
                {hasCategories && ` · ${categories.length} ${categories.length === 1 ? 'category' : 'categories'}`}
              </p>
              <Link
                href={`/admin/competitions/${competitionId}/entries`}
                className="text-sm text-action-primary hover:underline shrink-0"
              >
                View all entries →
              </Link>
            </div>

            {hasCategories && submissionCount > 0 && (
              <div className="flex items-center gap-6">
                <DonutChart slices={categories} total={submissionCount} />
                <div className="space-y-1.5">
                  {categories.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <span
                        className="shrink-0 h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: SPOT_COLORS[i % SPOT_COLORS.length] }}
                      />
                      <span className="text-xs text-content-secondary truncate max-w-[140px]">{c.name}</span>
                      <span className="text-xs font-medium text-content-primary ml-auto pl-3">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasCategories && submissionCount === 0 && (
              <p className="text-xs text-content-tertiary">{categories.map(c => c.name).join(', ')}</p>
            )}

            {!hasCategories && submissionCount > 0 && (
              <div className="flex items-center gap-6">
                <DonutChart slices={[{ id: 'all', name: 'All entries', count: submissionCount }]} total={submissionCount} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

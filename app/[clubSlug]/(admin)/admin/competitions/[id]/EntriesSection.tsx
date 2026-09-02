'use client'

import Link from 'next/link'
import { useState } from 'react'

type CategorySlice = {
  id:    string
  name:  string
  count: number
}

type Props = {
  competitionId:   string
  submissionCount: number
  categories:      CategorySlice[]
}

export const SPOT_COLORS = ['#5B86A8', '#4F9A91', '#6A9A63', '#A3A05C', '#C2905E', '#B8746E', '#96718F', '#6D74A3']

export function DonutChart({
  slices,
  total,
  size = 110,
}: {
  slices: CategorySlice[]
  total:  number
  size?:  number
}) {
  const [hovered, setHovered] = useState<string | null>(null)

  const r    = size * 0.345
  const cx   = size / 2
  const cy   = size / 2
  const sw   = size * 0.164
  const circ = 2 * Math.PI * r

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EDF0F5" strokeWidth={sw} />
        <text x={cx} y={cy + size * 0.045} textAnchor="middle" fontSize={size * 0.145} fontWeight="600" fill="#7E8EA3" fontFamily="inherit">0</text>
      </svg>
    )
  }

  // Gap (in SVG arc units) creates the 1px white border between slices.
  // Only apply when there are multiple non-zero slices.
  const nonZero = slices.filter(s => s.count > 0).length
  const gap     = nonZero > 1 ? 1.5 : 0

  let cumulative = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EDF0F5" strokeWidth={sw} />
      {slices.map((s, i) => {
        if (s.count === 0) return null
        const frac      = s.count / total
        const dashLen   = frac * circ - gap
        const dashOff   = -(cumulative / total) * circ
        cumulative += s.count
        const color     = SPOT_COLORS[i % SPOT_COLORS.length]
        const isHovered = hovered === s.id
        return (
          <circle
            key={s.id}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth={isHovered ? sw + 3 : sw}
            strokeDasharray={`${Math.max(0, dashLen)} ${circ}`}
            strokeDashoffset={dashOff}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-width 0.15s ease', cursor: 'default' }}
            onMouseEnter={() => setHovered(s.id)}
            onMouseLeave={() => setHovered(null)}
          />
        )
      })}
      {hovered ? (
        <>
          <text x={cx} y={cy + 1} textAnchor="middle" fontSize={size * 0.155} fontWeight="600" fill="#131F2E" fontFamily="inherit">
            {slices.find(s => s.id === hovered)?.count ?? ''}
          </text>
          <text x={cx} y={cy + size * 0.127} textAnchor="middle" fontSize={size * 0.073} fill="#7E8EA3" fontFamily="inherit">
            {slices.find(s => s.id === hovered)?.name.slice(0, 14) ?? ''}
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy + 1} textAnchor="middle" fontSize={size * 0.182} fontWeight="600" fill="#131F2E" fontFamily="inherit">
            {total}
          </text>
          <text x={cx} y={cy + size * 0.118} textAnchor="middle" fontSize={size * 0.073} fill="#7E8EA3" fontFamily="inherit">
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

        {hasCategories && (
          <div className="space-y-2">
            {categories.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2">
                <span
                  className="shrink-0 h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: SPOT_COLORS[i % SPOT_COLORS.length] }}
                />
                <span className="text-xs text-content-secondary truncate flex-1 max-w-[200px]">{c.name}</span>
                <span className="text-xs font-semibold text-content-primary">{c.count}</span>
              </div>
            ))}
          </div>
        )}

        {!hasCategories && submissionCount > 0 && (
          <p className="text-xs text-content-tertiary">{submissionCount} entries (no categories)</p>
        )}
      </div>
    </section>
  )
}

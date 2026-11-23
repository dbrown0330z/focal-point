'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { ResultsData, RankedEntry } from './page'

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtScore(score: number | null): string {
  if (score === null) return '—'
  const v = Math.round(score * 10) / 10
  return v % 1 === 0 ? String(v) : v.toFixed(1)
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  entries,
  startIndex,
  competitionTitle,
  judgeNames,
  onClose,
}: {
  entries: RankedEntry[]
  startIndex: number
  competitionTitle: string
  judgeNames: string[]
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const entry = entries[index]

  // Keyboard navigation + Escape to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft')  setIndex(i => (i - 1 + entries.length) % entries.length)
      if (e.key === 'ArrowRight') setIndex(i => (i + 1) % entries.length)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, entries.length])

  // Freeze body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      onClick={onClose}
    >
      {/* Close — top right */}
      <button
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-white"
        style={{ background: 'rgba(255,255,255,0.12)' }}
        onClick={onClose}
        aria-label="Close"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Prev arrow */}
      {entries.length > 1 && (
        <button
          className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-xl text-white"
          style={{ background: 'rgba(255,255,255,0.12)' }}
          onClick={e => { e.stopPropagation(); setIndex(i => (i - 1 + entries.length) % entries.length) }}
          aria-label="Previous"
        >‹</button>
      )}

      {/* Content */}
      <div
        className="flex flex-col items-center gap-3"
        style={{ maxWidth: '90vw', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Competition title + judge above the image */}
        <div className="text-center">
          <p className="text-[15px] font-semibold text-white">{competitionTitle}</p>
          {judgeNames.length > 0 && (
            <p className="mt-0.5 text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Judge: {judgeNames.join(', ')}
            </p>
          )}
        </div>

        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.imageUrl}
          alt={entry.imageTitle}
          style={{ maxHeight: '65vh', maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }}
        />

        {/* Image caption + score */}
        <div className="flex items-center gap-4 text-center">
          <div>
            <p className="text-[15px] font-semibold text-white">{entry.imageTitle}</p>
            <p className="mt-0.5 text-[12px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {entry.memberName} · {entry.categoryName}
            </p>
          </div>
          {entry.aggregatedScore !== null && (
            <span
              className="rounded-lg px-3 py-1.5 text-lg font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.15)', whiteSpace: 'nowrap' }}
            >
              {fmtScore(entry.aggregatedScore)}
            </span>
          )}
        </div>
      </div>

      {/* Next arrow */}
      {entries.length > 1 && (
        <button
          className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-xl text-white"
          style={{ background: 'rgba(255,255,255,0.12)' }}
          onClick={e => { e.stopPropagation(); setIndex(i => (i + 1) % entries.length) }}
          aria-label="Next"
        >›</button>
      )}

      {/* Dot strip */}
      {entries.length > 1 && entries.length <= 24 && (
        <div className="absolute bottom-5 flex gap-1.5">
          {entries.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setIndex(i) }}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 20 : 6,
                background: i === index ? '#fff' : 'rgba(255,255,255,0.35)',
              }}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Spot colours for pie slices ──────────────────────────────────────────────

const SLICE_COLORS = ['#6C47D4', '#0097A7', '#E65100', '#AD1457', '#00796B', '#7B6B38', '#1A6FC4', '#D4A800']

// ─── Pie / donut chart ────────────────────────────────────────────────────────

function CategoryPieChart({ data }: { data: ResultsData }) {
  const slices = data.categories
    .map((cat, i) => ({ name: cat.categoryName, count: cat.entries.length, color: SLICE_COLORS[i % SLICE_COLORS.length] }))
    .filter(s => s.count > 0)

  const total = slices.reduce((s, c) => s + c.count, 0)
  if (total === 0) return null

  const CX = 90, CY = 90, OR = 72, IR = 40
  let angle = -Math.PI / 2

  const paths = slices.map(s => {
    const sweep = (s.count / total) * 2 * Math.PI
    const end   = angle + sweep
    const lg    = sweep > Math.PI ? 1 : 0
    let d: string

    if (sweep >= 2 * Math.PI - 0.001) {
      d = `M${CX},${CY - OR} A${OR},${OR},0,1,1,${CX - 0.01},${CY - OR} Z M${CX},${CY - IR} A${IR},${IR},0,1,0,${CX - 0.01},${CY - IR} Z`
    } else {
      const ox1 = CX + OR * Math.cos(angle), oy1 = CY + OR * Math.sin(angle)
      const ox2 = CX + OR * Math.cos(end),   oy2 = CY + OR * Math.sin(end)
      const ix1 = CX + IR * Math.cos(angle), iy1 = CY + IR * Math.sin(angle)
      const ix2 = CX + IR * Math.cos(end),   iy2 = CY + IR * Math.sin(end)
      d = `M${ox1},${oy1} A${OR},${OR},0,${lg},1,${ox2},${oy2} L${ix2},${iy2} A${IR},${IR},0,${lg},0,${ix1},${iy1} Z`
    }
    angle = end
    return { d, color: s.color, name: s.name, count: s.count }
  })

  return (
    <div style={{
      padding: '20px 24px',
      background: 'var(--surface-1)',
      borderRadius: 12,
      border: '1px solid var(--border-default)',
      minWidth: 280,
    }}>
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.07em]" style={{ color: 'var(--text-tertiary)' }}>
        By Category
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <svg width={180} height={180} viewBox="0 0 180 180" style={{ flexShrink: 0 }}>
          {paths.map((p, i) => (
            <path key={i} d={p.d} fill={p.color} stroke="var(--surface-1)" strokeWidth={3} />
          ))}
          <text x={CX} y={CY - 6} textAnchor="middle"
            style={{ fill: 'var(--text-primary)', fontSize: 28, fontWeight: 700, fontFamily: 'Lora, Georgia, serif' }}>
            {total}
          </text>
          <text x={CX} y={CY + 16} textAnchor="middle"
            style={{ fill: 'var(--text-tertiary)', fontSize: 10, letterSpacing: '0.05em' }}>
            IMAGES
          </text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
          {paths.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginLeft: 8, flexShrink: 0 }}>
                {p.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Score heat map ───────────────────────────────────────────────────────────

function ScoreHeatmap({ data }: { data: ResultsData }) {
  if (!data.hasScores) return null

  const allScored = data.categories.flatMap(c => c.entries.filter(e => e.aggregatedScore !== null))
  if (allScored.length === 0) return null

  const vals = allScored.map(e => e.aggregatedScore as number)
  const minS = Math.floor(Math.min(...vals))
  const maxS = Math.ceil(Math.max(...vals))

  const scoreColumns: number[] = []
  for (let s = minS; s <= maxS; s++) scoreColumns.push(s)

  const rows = data.categories.map(cat => {
    const counts: Record<number, number> = {}
    cat.entries.forEach(e => {
      if (e.aggregatedScore !== null) {
        const r = Math.round(e.aggregatedScore)
        counts[r] = (counts[r] ?? 0) + 1
      }
    })
    return { name: cat.categoryName, counts, total: cat.entries.filter(e => e.aggregatedScore !== null).length }
  })

  const maxCount = Math.max(...rows.flatMap(r => Object.values(r.counts)), 1)

  // Blue scale: light sky blue → deep navy
  function cellBg(n: number): string {
    if (n === 0) return 'transparent'
    const t = n / maxCount
    // rgba(26,111,196, alpha): 0.18 → 1.0
    const alpha = 0.18 + t * 0.82
    return `rgba(26, 111, 196, ${alpha.toFixed(2)})`
  }

  function cellFg(n: number): string {
    if (n === 0) return 'transparent'
    return (n / maxCount) > 0.5 ? 'rgba(255,255,255,0.92)' : 'rgb(14, 60, 120)'
  }

  return (
    <div style={{
      padding: '20px 24px',
      background: 'var(--surface-1)',
      borderRadius: 12,
      border: '1px solid var(--border-default)',
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <p className="mb-4 w-full text-[11px] font-bold uppercase tracking-[0.07em]" style={{ color: 'var(--text-tertiary)' }}>
        Score Distribution
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 3 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 90 }} />
              {scoreColumns.map(s => (
                <th key={s} style={{ width: 34, textAlign: 'center', fontWeight: 400, color: 'var(--text-tertiary)', fontSize: 11, paddingBottom: 6 }}>
                  {s}
                </th>
              ))}
              <th style={{ width: 34, textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, paddingBottom: 6, paddingLeft: 6 }}>
                Σ
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                <td style={{ textAlign: 'right', paddingRight: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                  {row.name}
                </td>
                {scoreColumns.map(s => {
                  const n = row.counts[s] ?? 0
                  return (
                    <td
                      key={s}
                      style={{
                        width: 34, height: 34,
                        textAlign: 'center', verticalAlign: 'middle',
                        background: cellBg(n),
                        border: n === 0 ? '1px solid var(--border-subtle)' : 'none',
                        borderRadius: 4,
                        fontWeight: 600,
                        fontSize: 12,
                        color: cellFg(n),
                      }}
                    >
                      {n > 0 ? n : null}
                    </td>
                  )
                })}
                <td style={{ textAlign: 'center', paddingLeft: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', verticalAlign: 'middle' }}>
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>Few</span>
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {[0.12, 0.28, 0.44, 0.60, 0.76, 1.0].map(t => (
            <div
              key={t}
              style={{
                width: 20, height: 12, borderRadius: 3,
                background: cellBg(Math.max(1, Math.round(t * maxCount))),
                border: t === 0.12 ? '1px solid var(--border-subtle)' : 'none',
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>More Images</span>
      </div>
    </div>
  )
}

// ─── Entry card ───────────────────────────────────────────────────────────────

function EntryCard({
  entry,
  isMine,
  onClick,
}: {
  entry: RankedEntry
  isMine: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full overflow-hidden rounded-xl text-left transition-transform hover:-translate-y-0.5"
      style={{
        background: 'var(--surface-1)',
        border: isMine ? '2px solid var(--action-primary)' : '1px solid var(--border-subtle)',
        boxShadow: isMine
          ? '0 0 0 3px rgba(26,111,196,0.18), 0 1px 4px rgba(0,0,0,0.06)'
          : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* Square thumbnail */}
      <div className="relative" style={{ paddingTop: '100%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.imageUrl}
          alt={entry.imageTitle}
          className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
        />
        {/* Score badge */}
        {entry.aggregatedScore !== null && (
          <span
            className="absolute bottom-2 right-2 rounded-md px-2 py-1 font-bold text-white"
            style={{ fontSize: 26, lineHeight: 1, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          >
            {fmtScore(entry.aggregatedScore)}
          </span>
        )}
        {/* "My entry" indicator */}
        {isMine && (
          <span
            className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white"
            style={{ background: 'var(--action-primary)' }}
          >
            Mine
          </span>
        )}
        {/* Award badge */}
        {entry.awardLabel && !isMine && (
          <span
            className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white"
            style={{ background: 'rgba(0,0,0,0.60)' }}
          >
            {entry.awardLabel}
          </span>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p
          className="overflow-hidden text-[13px] font-semibold leading-snug"
          style={{
            color: 'var(--text-primary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {entry.imageTitle}
        </p>
        <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          {entry.categoryName}
        </p>
        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
          {entry.memberName}
        </p>
      </div>
    </button>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

type SortOrder = 'high' | 'low'

export default function ResultsClient({
  data,
  clubSlug,
}: {
  data: ResultsData
  clubSlug: string
}) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortOrder,    setSortOrder]    = useState<SortOrder>('high')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const mySet      = new Set(data.mySubmissionIds)
  const allEntries = data.categories.flatMap(c => c.entries)

  const filteredEntries =
    activeFilter === 'all'
      ? allEntries
      : activeFilter === 'mine'
        ? allEntries.filter(e => mySet.has(e.submissionId))
        : allEntries.filter(e => e.categoryId === activeFilter)

  // Apply sort
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const sa = a.aggregatedScore ?? (sortOrder === 'high' ? -Infinity : Infinity)
    const sb = b.aggregatedScore ?? (sortOrder === 'high' ? -Infinity : Infinity)
    return sortOrder === 'high' ? sb - sa : sa - sb
  })

  const mineCt = data.mySubmissionIds.length

  const tabs = [
    { id: 'all',  label: 'All',  count: allEntries.length },
    ...(mineCt > 0 ? [{ id: 'mine', label: 'Mine', count: mineCt }] : []),
    ...data.categories.map(cat => ({
      id:    cat.categoryId,
      label: cat.categoryName,
      count: cat.entries.length,
    })),
  ]

  const avgDisplay = data.averageScore !== null ? data.averageScore.toFixed(2) : '—'

  const selectStyle: React.CSSProperties = {
    background: 'var(--surface-0)',
    border: '1px solid var(--border-default)',
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 12,
    color: 'var(--text-secondary)',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none' as const,
    paddingRight: 24,
  }

  return (
    <>
      {lightboxIndex !== null && (
        <Lightbox
          entries={sortedEntries}
          startIndex={lightboxIndex}
          competitionTitle={data.title}
          judgeNames={data.judgeNames}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <div style={{ paddingBottom: 64 }}>
        {/* Back link */}
        <Link
          href={`/${clubSlug}/competitions/results`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
          All results
        </Link>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-6">
          <h1 style={{
            fontFamily: 'Lora, Georgia, serif',
            fontSize: 36,
            fontWeight: 400,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
          }}>
            {data.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
            {data.judgeNames.length > 0 && (
              <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Judge:</span>{' '}
                {data.judgeNames.join(', ')}
              </p>
            )}
            {data.closesAt && (
              <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Meeting date:</span>{' '}
                {fmtDate(data.closesAt)}
              </p>
            )}
          </div>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────────── */}
        <div
          className="mb-6 grid"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: 'var(--border-default)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {[
            { value: String(data.totalImages), label: 'Total Images' },
            {
              value: data.totalMembers > 0
                ? `${data.membersSubmitted} of ${data.totalMembers}`
                : String(data.membersSubmitted),
              label: 'Members Submitted',
            },
            { value: avgDisplay, label: 'Average Score' },
          ].map(stat => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center py-5"
              style={{ background: 'var(--surface-1)' }}
            >
              <p
                className="text-[34px] font-bold leading-none tracking-[-0.02em]"
                style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--text-primary)' }}
              >
                {stat.value}
              </p>
              <p
                className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.05em]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Pie chart + heat map ────────────────────────────────────────── */}
        {data.categories.length > 1 && (
          <div className="mb-6 flex gap-4" style={{ alignItems: 'stretch' }}>
            <CategoryPieChart data={data} />
            <ScoreHeatmap data={data} />
          </div>
        )}

        {/* ── Filter tabs + sort ─────────────────────────────────────────── */}
        <div
          className="mb-5 flex items-end justify-between border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex gap-0.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className="-mb-px px-3 py-2 text-[13px] font-medium transition-colors"
                style={
                  activeFilter === tab.id
                    ? { color: 'var(--action-primary)', borderBottom: '2px solid var(--action-primary)' }
                    : { color: 'var(--text-secondary)', borderBottom: '2px solid transparent' }
                }
              >
                {tab.label}{' '}
                <span style={{ opacity: 0.6 }}>({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="pb-2.5" style={{ position: 'relative' }}>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as SortOrder)}
              style={selectStyle}
            >
              <option value="high">Score: high → low</option>
              <option value="low">Score: low → high</option>
            </select>
            {/* Chevron */}
            <svg
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3"
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* ── Image grid ─────────────────────────────────────────────────── */}
        {sortedEntries.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No entries for this filter.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {sortedEntries.map((entry, i) => (
              <EntryCard
                key={entry.submissionId}
                entry={entry}
                isMine={mySet.has(entry.submissionId)}
                onClick={() => setLightboxIndex(i)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ResultsData, RankedEntry } from './page'

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtScore(score: number | null, method: string): string {
  if (score === null) return '—'
  const v = method === 'sum' ? Math.round(score * 10) / 10 : Math.round(score * 10) / 10
  return v % 1 === 0 ? String(v) : v.toFixed(1)
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  entries,
  startIndex,
  scoreMethod,
  onClose,
}: {
  entries: RankedEntry[]
  startIndex: number
  scoreMethod: string
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const entry = entries[index]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      onClick={onClose}
    >
      <button
        className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-white"
        style={{ background: 'rgba(255,255,255,0.12)' }}
        onClick={onClose}
        aria-label="Close"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {entries.length > 1 && (
        <button
          className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-lg text-white"
          style={{ background: 'rgba(255,255,255,0.12)' }}
          onClick={e => { e.stopPropagation(); setIndex(i => (i - 1 + entries.length) % entries.length) }}
          aria-label="Previous"
        >‹</button>
      )}

      <div
        className="mx-auto flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-4"
        onClick={e => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.imageUrl}
          alt={entry.imageTitle}
          className="max-h-[78vh] max-w-full rounded-lg object-contain"
        />
        <div className="flex items-center gap-4 text-center">
          <div>
            <p className="text-base font-semibold text-white">{entry.imageTitle}</p>
            <p className="mt-0.5 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {entry.memberName} · {entry.categoryName}
            </p>
          </div>
          {entry.aggregatedScore !== null && (
            <span
              className="rounded-lg px-3 py-1.5 text-lg font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              {fmtScore(entry.aggregatedScore, scoreMethod)}
            </span>
          )}
        </div>
      </div>

      {entries.length > 1 && (
        <button
          className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-lg text-white"
          style={{ background: 'rgba(255,255,255,0.12)' }}
          onClick={e => { e.stopPropagation(); setIndex(i => (i + 1) % entries.length) }}
          aria-label="Next"
        >›</button>
      )}

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

// ─── Category bar chart ────────────────────────────────────────────────────────

function CategoryChart({ data }: { data: ResultsData }) {
  const counts = data.categories.map(cat => ({ name: cat.categoryName, count: cat.entries.length }))
  const max    = Math.max(...counts.map(c => c.count), 1)

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: 12,
        border: '1px solid var(--border-default)',
        background: 'var(--surface-1)',
        padding: '20px 24px',
      }}
    >
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.07em]" style={{ color: 'var(--text-tertiary)' }}>
        By Category
      </p>
      <div className="space-y-2.5">
        {counts.map(cat => (
          <div key={cat.name} className="grid items-center gap-3" style={{ gridTemplateColumns: '100px 1fr 36px' }}>
            <p className="truncate text-right text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              {cat.name}
            </p>
            <div className="h-3 overflow-hidden rounded-full" style={{ background: 'var(--surface-0)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(cat.count / max) * 100}%`,
                  background: 'var(--action-primary)',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <p className="text-center text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>
              {cat.count}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Entry card ───────────────────────────────────────────────────────────────

function EntryCard({
  entry,
  scoreMethod,
  onClick,
}: {
  entry: RankedEntry
  scoreMethod: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full overflow-hidden rounded-xl text-left transition-transform hover:-translate-y-0.5"
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div className="relative" style={{ paddingTop: '125%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.imageUrl}
          alt={entry.imageTitle}
          className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
        />
        {/* Score badge */}
        {entry.aggregatedScore !== null && (
          <span
            className="absolute bottom-2 right-2 rounded-md px-1.5 py-0.5 text-[13px] font-bold text-white"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          >
            {fmtScore(entry.aggregatedScore, scoreMethod)}
          </span>
        )}
        {/* Award badge */}
        {entry.awardLabel && (
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

export default function ResultsClient({
  data,
  clubSlug,
}: {
  data: ResultsData
  clubSlug: string
}) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const mySet      = new Set(data.mySubmissionIds)
  const allEntries = data.categories.flatMap(c => c.entries)

  const filteredEntries =
    activeFilter === 'all'
      ? allEntries
      : activeFilter === 'mine'
        ? allEntries.filter(e => mySet.has(e.submissionId))
        : allEntries.filter(e => e.categoryId === activeFilter)

  const mineCt = data.mySubmissionIds.length

  const tabs = [
    { id: 'all', label: 'All', count: allEntries.length },
    ...(mineCt > 0 ? [{ id: 'mine', label: 'Mine', count: mineCt }] : []),
    ...data.categories.map(cat => ({
      id: cat.categoryId,
      label: cat.categoryName,
      count: cat.entries.length,
    })),
  ]

  // Average score display
  const avgDisplay = data.averageScore !== null
    ? data.averageScore.toFixed(2)
    : (data.hasScores ? '—' : '—')

  return (
    <>
      {lightboxIndex !== null && (
        <Lightbox
          entries={filteredEntries}
          startIndex={lightboxIndex}
          scoreMethod={data.scoreAggregation}
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
          <h1
            className="text-[32px] font-bold leading-tight tracking-[-0.025em]"
            style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}
          >
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
            { value: String(data.totalImages).padStart(3, '0'), label: 'Total Images' },
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
                style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}
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

        {/* ── Category chart ─────────────────────────────────────────────── */}
        {data.categories.length > 1 && (
          <div className="mb-6">
            <CategoryChart data={data} />
          </div>
        )}

        {/* ── Filter tabs ────────────────────────────────────────────────── */}
        <div
          className="mb-5 flex items-center justify-between border-b"
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
                {tab.label}
              </button>
            ))}
          </div>
          <p className="pb-2 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            {filteredEntries.length} image{filteredEntries.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ── Image grid ─────────────────────────────────────────────────── */}
        {filteredEntries.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No entries for this filter.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
            }}
          >
            {filteredEntries.map((entry, i) => (
              <EntryCard
                key={entry.submissionId}
                entry={entry}
                scoreMethod={data.scoreAggregation}
                onClick={() => setLightboxIndex(i)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

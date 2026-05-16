'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { ResultsData, RankedEntry, CategoryResults } from './page'

// ─── Rank styling ─────────────────────────────────────────────────────────────

type RankStyle = { bg: string; text: string; border: string; label: string }

const RANK_STYLES: Record<number, RankStyle> = {
  1: { bg: '#B8860B', text: '#FFF8E1', border: '#D4A017', label: '1st Place' },
  2: { bg: '#6B7280', text: '#F9FAFB', border: '#9CA3AF', label: '2nd Place' },
  3: { bg: '#92400E', text: '#FFF7ED', border: '#B45309', label: '3rd Place' },
}

function rankStyle(rank: number): RankStyle {
  return RANK_STYLES[rank] ?? { bg: 'var(--surface-0)', text: 'var(--text-secondary)', border: 'var(--border-default)', label: `${rank}th` }
}

function rankLabel(rank: number): string {
  if (rank === 1) return '1st'
  if (rank === 2) return '2nd'
  if (rank === 3) return '3rd'
  return `${rank}th`
}

// ─── Score display ────────────────────────────────────────────────────────────

function fmt(score: number | null, method: string): string {
  if (score === null) return '—'
  const rounded = method === 'sum' ? Math.round(score * 10) / 10 : Math.round(score * 10) / 10
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1)
}

// ─── Date format ──────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconClose() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
    </svg>
  )
}

function IconChevronDown() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
  )
}

function IconArrowLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
    </svg>
  )
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

type LightboxEntry = {
  imageUrl: string
  imageTitle: string
  memberName: string
  rank: number
  aggregatedScore: number | null
  awardLabel: string | null
  scoreAggregation: string
  categoryName: string
  judgeNotes: string[]
}

function Lightbox({
  entries,
  startIdx,
  onClose,
  scoreAggregation,
  hasScores,
}: {
  entries: LightboxEntry[]
  startIdx: number
  onClose: () => void
  scoreAggregation: string
  hasScores: boolean
}) {
  const [idx, setIdx] = useState(startIdx)
  const current = entries[idx]

  const prev = useCallback(() => { if (idx > 0) setIdx(idx - 1) }, [idx])
  const next = useCallback(() => { if (idx < entries.length - 1) setIdx(idx + 1) }, [idx, entries.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  if (!current) return null
  const rs = rankStyle(current.rank)

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-4xl flex-col items-center px-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-4 flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white"
          style={{ background: 'rgba(255,255,255,0.10)' }}
        >
          <IconClose />
        </button>

        {/* Image */}
        <div className="relative w-full overflow-hidden rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.imageUrl}
            alt={current.imageTitle}
            className="max-h-[72vh] w-full object-contain"
          />

          {/* Rank badge */}
          <div
            className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold"
            style={{ background: rs.bg, color: rs.text, border: `1px solid ${rs.border}` }}
          >
            {rankLabel(current.rank)}
            {current.awardLabel && <span style={{ opacity: 0.8 }}>· {current.awardLabel}</span>}
          </div>

          {/* Prev / Next */}
          {idx > 0 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); prev() }}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
              style={{ background: 'rgba(0,0,0,0.50)' }}
            >
              <IconChevronLeft />
            </button>
          )}
          {idx < entries.length - 1 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); next() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
              style={{ background: 'rgba(0,0,0,0.50)' }}
            >
              <IconChevronRight />
            </button>
          )}
        </div>

        {/* Caption */}
        <div className="mt-4 flex w-full items-start justify-between gap-4">
          <div>
            <p
              className="text-[18px] font-bold leading-snug text-white"
              style={{ fontFamily: 'var(--font-primary)' }}
            >
              {current.imageTitle}
            </p>
            <p className="mt-0.5 text-[13px] text-white/60">
              {current.categoryName} · by {current.memberName}
            </p>
            {current.judgeNotes.length > 0 && (
              <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-white/50 italic">
                &ldquo;{current.judgeNotes[0]}&rdquo;
              </p>
            )}
          </div>
          {hasScores && (
            <div className="shrink-0 text-right">
              <p
                className="text-[36px] font-bold leading-none text-white"
                style={{ fontFamily: 'var(--font-primary)' }}
              >
                {fmt(current.aggregatedScore, scoreAggregation)}
              </p>
              <p className="mt-0.5 text-[11px] uppercase tracking-widest text-white/40">
                {scoreAggregation === 'sum' ? 'total score' : scoreAggregation === 'average' ? 'avg score' : 'adj. score'}
              </p>
            </div>
          )}
        </div>

        {/* Dot strip */}
        {entries.length > 1 && (
          <div className="mt-4 flex gap-1.5">
            {entries.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={e => { e.stopPropagation(); setIdx(i) }}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width:      i === idx ? 20 : 6,
                  background: i === idx ? 'white' : 'rgba(255,255,255,0.28)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Award badge ──────────────────────────────────────────────────────────────

function AwardBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]"
      style={{ background: 'rgba(184,134,11,0.15)', color: '#B8860B', border: '1px solid rgba(184,134,11,0.35)' }}
    >
      {label}
    </span>
  )
}

// ─── Rank pill ────────────────────────────────────────────────────────────────

function RankPill({ rank, size = 'sm' }: { rank: number; size?: 'sm' | 'lg' }) {
  const rs = rankStyle(rank)
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{
        background: rs.bg,
        color:      rs.text,
        border:     `1px solid ${rs.border}`,
        width:      size === 'lg' ? 36 : 24,
        height:     size === 'lg' ? 36 : 24,
        fontSize:   size === 'lg' ? 14 : 11,
        minWidth:   size === 'lg' ? 36 : 24,
      }}
    >
      {rank}
    </span>
  )
}

// ─── Winner card (1st place, full width) ──────────────────────────────────────

function WinnerCard({
  entry,
  hasScores,
  scoreAggregation,
  onOpen,
}: {
  entry: RankedEntry
  hasScores: boolean
  scoreAggregation: string
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-2xl focus:outline-none"
      style={{
        boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
        display: 'block',
      }}
    >
      {/* Image */}
      <div className="relative w-full" style={{ paddingTop: '52%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.imageUrl}
          alt={entry.imageTitle}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.72) 100%)',
          }}
        />

        {/* Top-left: rank badge */}
        <div className="absolute left-5 top-5">
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{
              background: RANK_STYLES[1].bg,
              color:      RANK_STYLES[1].text,
              boxShadow:  '0 2px 8px rgba(0,0,0,0.35)',
            }}
          >
            <span className="text-[13px] font-bold tracking-wide">1st Place</span>
            {entry.awardLabel && (
              <>
                <span style={{ opacity: 0.6 }}>·</span>
                <span className="text-[12px] font-semibold" style={{ opacity: 0.9 }}>{entry.awardLabel}</span>
              </>
            )}
          </div>
        </div>

        {/* Top-right: score */}
        {hasScores && entry.aggregatedScore !== null && (
          <div
            className="absolute right-5 top-5 flex flex-col items-end"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
          >
            <span
              className="text-[44px] font-bold leading-none text-white"
              style={{ fontFamily: 'var(--font-primary)' }}
            >
              {fmt(entry.aggregatedScore, scoreAggregation)}
            </span>
            <span className="text-[11px] uppercase tracking-widest text-white/60 mt-0.5">
              {scoreAggregation === 'sum' ? 'points' : 'score'}
            </span>
          </div>
        )}

        {/* Bottom caption */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
          <p
            className="text-[22px] font-bold leading-tight text-white"
            style={{ fontFamily: 'var(--font-primary)', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
          >
            {entry.imageTitle}
          </p>
          <p className="mt-1 text-[14px] text-white/75">
            by {entry.memberName}
          </p>
        </div>

        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ background: 'rgba(0,0,0,0.12)' }}
        >
          <span
            className="rounded-full px-4 py-1.5 text-[12px] font-bold text-white"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          >
            View full size
          </span>
        </div>
      </div>
    </button>
  )
}

// ─── Placed card (2nd / 3rd, side by side) ────────────────────────────────────

function PlacedCard({
  entry,
  hasScores,
  scoreAggregation,
  onOpen,
}: {
  entry: RankedEntry
  hasScores: boolean
  scoreAggregation: string
  onOpen: () => void
}) {
  const rs = rankStyle(entry.rank)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative overflow-hidden rounded-xl focus:outline-none"
      style={{
        display: 'block',
        width: '100%',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
      }}
    >
      {/* Image */}
      <div className="relative w-full" style={{ paddingTop: '70%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.imageUrl}
          alt={entry.imageTitle}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.65) 100%)' }}
        />

        {/* Rank badge */}
        <div className="absolute left-3 top-3">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold"
            style={{ background: rs.bg, color: rs.text, border: `1px solid ${rs.border}` }}
          >
            {entry.rank}
          </span>
        </div>

        {/* Score */}
        {hasScores && entry.aggregatedScore !== null && (
          <div
            className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[13px] font-bold text-white"
            style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(4px)' }}
          >
            {fmt(entry.aggregatedScore, scoreAggregation)}
          </div>
        )}

        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
          <p
            className="text-[14px] font-bold leading-snug text-white"
            style={{ fontFamily: 'var(--font-primary)' }}
          >
            {entry.imageTitle}
          </p>
          <p className="text-[11px] text-white/65 mt-0.5">
            {entry.memberName}
          </p>
        </div>

        {/* Hover */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
          style={{ background: 'rgba(0,0,0,0.15)' }}
        >
          <span
            className="rounded-full px-3 py-1 text-[11px] font-bold text-white"
            style={{ background: 'rgba(0,0,0,0.55)' }}
          >
            View
          </span>
        </div>
      </div>

      {/* Award badge below image */}
      {entry.awardLabel && (
        <div
          className="px-3 py-1.5"
          style={{ background: 'var(--surface-1)', borderTop: '1px solid var(--border-subtle)' }}
        >
          <AwardBadge label={entry.awardLabel} />
        </div>
      )}
    </button>
  )
}

// ─── Compact entry card (4th+) ────────────────────────────────────────────────

function CompactCard({
  entry,
  hasScores,
  scoreAggregation,
  onOpen,
}: {
  entry: RankedEntry
  hasScores: boolean
  scoreAggregation: string
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-xl text-left focus:outline-none"
      style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}
    >
      {/* Thumbnail */}
      <div className="relative w-full overflow-hidden" style={{ paddingTop: '72%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.imageUrl}
          alt={entry.imageTitle}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
        />
        {/* Rank */}
        <span
          className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
          style={{ background: 'rgba(0,0,0,0.68)', color: '#fff' }}
        >
          {entry.rank}
        </span>
        {/* Score overlay */}
        {hasScores && entry.aggregatedScore !== null && (
          <span
            className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
            style={{ background: 'rgba(0,0,0,0.65)' }}
          >
            {fmt(entry.aggregatedScore, scoreAggregation)}
          </span>
        )}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
          style={{ background: 'rgba(0,0,0,0.18)' }}
        >
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: 'rgba(0,0,0,0.55)' }}>
            View
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="px-2.5 py-2">
        <p
          className="truncate text-[12px] font-semibold leading-snug"
          style={{ color: 'var(--text-primary)' }}
        >
          {entry.imageTitle}
        </p>
        <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          {entry.memberName}
        </p>
        {entry.awardLabel && (
          <div className="mt-1.5">
            <AwardBadge label={entry.awardLabel} />
          </div>
        )}
      </div>
    </button>
  )
}

// ─── Category section ─────────────────────────────────────────────────────────

function CategorySection({
  cat,
  hasScores,
  scoreAggregation,
  onOpenLightbox,
}: {
  cat: CategoryResults
  hasScores: boolean
  scoreAggregation: string
  onOpenLightbox: (categoryId: string, submissionId: string) => void
}) {
  const [showAll, setShowAll] = useState(false)

  const [first, ...rest]  = cat.entries
  const second            = rest[0]
  const third             = rest[1]
  const remaining         = rest.slice(2)         // 4th place+

  const placedPair = [second, third].filter(Boolean)
  const hasRemaining = remaining.length > 0

  if (!first) {
    return (
      <div className="py-4 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
        No entries in this category.
      </div>
    )
  }

  return (
    <div>
      {/* Winner */}
      <WinnerCard
        entry={first}
        hasScores={hasScores}
        scoreAggregation={scoreAggregation}
        onOpen={() => onOpenLightbox(cat.categoryId, first.submissionId)}
      />

      {/* 2nd and 3rd */}
      {placedPair.length > 0 && (
        <div
          className="mt-3 grid gap-3"
          style={{ gridTemplateColumns: `repeat(${placedPair.length}, 1fr)` }}
        >
          {placedPair.map(entry => (
            <PlacedCard
              key={entry.submissionId}
              entry={entry}
              hasScores={hasScores}
              scoreAggregation={scoreAggregation}
              onOpen={() => onOpenLightbox(cat.categoryId, entry.submissionId)}
            />
          ))}
        </div>
      )}

      {/* 4th+ */}
      {hasRemaining && (
        <div className="mt-3">
          {/* Show/hide toggle */}
          <button
            type="button"
            onClick={() => setShowAll(v => !v)}
            className="flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
            style={{ color: 'var(--action-primary)' }}
          >
            <span
              className="transition-transform duration-200"
              style={{ display: 'inline-block', transform: showAll ? 'rotate(180deg)' : 'none' }}
            >
              <IconChevronDown />
            </span>
            {showAll
              ? 'Hide remaining entries'
              : `Show all ${remaining.length} more ${remaining.length === 1 ? 'entry' : 'entries'}`}
          </button>

          {showAll && (
            <div
              className="mt-3 grid gap-2.5"
              style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
            >
              {remaining.map(entry => (
                <CompactCard
                  key={entry.submissionId}
                  entry={entry}
                  hasScores={hasScores}
                  scoreAggregation={scoreAggregation}
                  onOpen={() => onOpenLightbox(cat.categoryId, entry.submissionId)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyResults() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: 'var(--surface-1)' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8" style={{ color: 'var(--text-tertiary)' }}>
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
          <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
        </svg>
      </div>
      <p className="text-[17px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        No results to show yet
      </p>
      <p className="mt-1 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
        No images were entered in this competition, or results haven&apos;t been published.
      </p>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ResultsClient({ data }: { data: ResultsData }) {
  // Flatten all entries across all categories for lightbox navigation
  type LightboxState = { categoryId: string; submissionId: string } | null
  const [lightbox, setLightbox] = useState<LightboxState>(null)

  // Flat list with submissionId for reliable lightbox index lookup
  const allEntries: (LightboxEntry & { submissionId: string })[] = data.categories.flatMap(cat =>
    cat.entries.map(e => ({
      submissionId:     e.submissionId,
      imageUrl:         e.imageUrl,
      imageTitle:       e.imageTitle,
      memberName:       e.memberName,
      rank:             e.rank,
      aggregatedScore:  e.aggregatedScore,
      awardLabel:       e.awardLabel,
      scoreAggregation: data.scoreAggregation,
      categoryName:     cat.categoryName,
      judgeNotes:       e.judgeNotes,
    }))
  )

  const lightboxIdx = lightbox
    ? allEntries.findIndex(e => e.submissionId === lightbox.submissionId)
    : -1

  function openLightbox(categoryId: string, submissionId: string) {
    setLightbox({ categoryId, submissionId })
  }

  const totalEntries = data.categories.reduce((sum, c) => sum + c.entries.length, 0)

  return (
    <div style={{ paddingBottom: 64 }}>
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/competitions"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)')}
          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)')}
        >
          <IconArrowLeft />
          All competitions
        </Link>
      </div>

      {/* Competition header */}
      <div className="mb-8">
        <p
          className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Competition Results
        </p>
        <h1
          className="text-[34px] font-bold leading-tight tracking-[-0.02em]"
          style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}
        >
          {data.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          {data.closesAt && (
            <span className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
              {fmtDate(data.closesAt)}
            </span>
          )}
          {data.judgeNames.length > 0 && (
            <span className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
              Judge: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {data.judgeNames.join(', ')}
              </strong>
            </span>
          )}
          {totalEntries > 0 && (
            <span className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
              {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'} · {data.categories.length} {data.categories.length === 1 ? 'category' : 'categories'}
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      {totalEntries === 0 ? (
        <EmptyResults />
      ) : (
        <div className="space-y-14">
          {data.categories.map((cat, catIdx) => (
            <div key={cat.categoryId}>
              {/* Category header */}
              <div
                className="mb-5 flex items-center gap-4"
              >
                <div
                  className="h-px flex-1"
                  style={{ background: 'var(--border-default)' }}
                />
                <h2
                  className="shrink-0 text-[13px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {cat.categoryName}
                </h2>
                <div
                  className="h-px flex-1"
                  style={{ background: 'var(--border-default)' }}
                />
                <span
                  className="shrink-0 text-[12px]"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {cat.entries.length} {cat.entries.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              <CategorySection
                cat={cat}
                hasScores={data.hasScores}
                scoreAggregation={data.scoreAggregation}
                onOpenLightbox={openLightbox}
              />

              {catIdx < data.categories.length - 1 && (
                <div className="mt-14 h-px" style={{ background: 'var(--border-subtle)' }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && lightboxIdx >= 0 && (
        <Lightbox
          entries={allEntries}
          startIdx={lightboxIdx}
          onClose={() => setLightbox(null)}
          scoreAggregation={data.scoreAggregation}
          hasScores={data.hasScores}
        />
      )}
    </div>
  )
}

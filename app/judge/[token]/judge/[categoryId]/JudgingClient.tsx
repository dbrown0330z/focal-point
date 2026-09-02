'use client'

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { saveScore, saveRank, saveFlag, applyBucketScores } from './actions'
import type { SubmissionForJudge } from './page'
import { useTheme } from '@/components/layout/ThemeProvider'

// ─── Triage bucket definitions ─────────────────────────────────────────────────
// Header uses solid coloured background + white text for maximum vibrancy.
// Text colour (used against surface-2/white) maintains WCAG AA ≥ 4.5:1.
const SORT_BUCKETS = [
  {
    id:        'strong',
    label:     'Strong',
    color:     'var(--judgment-strong)',
    headerBg:  'var(--judgment-strong)',
    bg:        'var(--judgment-strong-bg)',
    border:    'var(--judgment-strong-border)',
    dotColor:  'var(--judgment-strong)',
  },
  {
    id:        'maybe',
    label:     'Maybe',
    color:     'var(--judgment-maybe)',
    headerBg:  'var(--judgment-maybe)',
    bg:        'var(--judgment-maybe-bg)',
    border:    'var(--judgment-maybe-border)',
    dotColor:  'var(--judgment-maybe)',
  },
  {
    id:        'weak',
    label:     'Weak',
    color:     'var(--judgment-weak)',
    headerBg:  'var(--judgment-weak)',
    bg:        'var(--judgment-weak-bg)',
    border:    'var(--judgment-weak-border)',
    dotColor:  'var(--judgment-weak)',
  },
] as const

type BucketId = 'strong' | 'maybe' | 'weak'

// Bucket colours that have sufficient contrast on dark surfaces (~7–9:1 on #1E1E1E)
const BUCKET_DARK: Record<BucketId, { color: string; headerBg: string; bg: string; border: string; dotColor: string }> = {
  strong: { color: '#4ADE80', headerBg: '#14532D', bg: 'rgba(74,222,128,0.10)',   border: 'rgba(74,222,128,0.45)',   dotColor: '#4ADE80' },
  maybe:  { color: '#FCD34D', headerBg: '#78350F', bg: 'rgba(252,211,77,0.10)',   border: 'rgba(252,211,77,0.45)',   dotColor: '#FCD34D' },
  weak:   { color: '#F87171', headerBg: '#7F1D1D', bg: 'rgba(248,113,113,0.10)',  border: 'rgba(248,113,113,0.45)', dotColor: '#F87171' },
}

type ThemedBucket = { id: string; label: string; color: string; headerBg: string; bg: string; border: string; dotColor: string }

function themedBucket(bucket: (typeof SORT_BUCKETS)[number], theme: string): ThemedBucket {
  if (theme !== 'dark') return bucket
  return { id: bucket.id, label: bucket.label, ...BUCKET_DARK[bucket.id as BucketId] }
}

// Flagged = vivid purple — clearly distinct from all bucket colours (see --judgment-flag* tokens)
const FLAG_COLOR  = 'var(--judgment-flag)'
const FLAG_BG     = 'var(--judgment-flag-bg)'
const FLAG_BORDER = 'var(--judgment-flag-border)'

// Score threshold helper — used for score badge colouring only (not bucket placement).
// Dynamic thirds of [scoreMin, scoreMax].
function bucketForScore(
  score: number | null,
  scoreMin: number,
  scoreMax: number,
): (typeof SORT_BUCKETS)[number] | null {
  if (score === null) return null
  const range     = scoreMax - scoreMin
  const strongMin = scoreMin + Math.round(range * 2 / 3)
  const maybeMin  = scoreMin + Math.round(range / 3)
  if (score >= strongMin) return SORT_BUCKETS[0]
  if (score >= maybeMin)  return SORT_BUCKETS[1]
  return SORT_BUCKETS[2]
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type View         = 'triage' | 'grid' | 'single'
type FilterMode   = 'all' | 'unscored' | 'scored' | 'flagged'
type GridSubView  = 'grid' | 'list'
type GridSize     = 'S' | 'M' | 'L'
type BucketFilter = 'all' | BucketId | 'unsorted'

type LocalScore = {
  score:   number | null
  notes:   string
  rank:    number | null
  flagged: boolean
  saving:  boolean
  saved:   boolean
}

// ─── DraggableCard (triage mode) ──────────────────────────────────────────────
function DraggableCard({
  sub, localScore, bucketId, scoreMin, scoreMax, isDragOverlay, onView, onReturn, rank,
}: {
  sub:            SubmissionForJudge
  localScore:     LocalScore
  bucketId:       BucketId | null
  scoreMin:       number
  scoreMax:       number
  isDragOverlay?: boolean
  onView?:        () => void
  onReturn?:      () => void
  rank?:          number
}) {
  const { theme: cardTheme } = useTheme()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: sub.id })
  const rawBucket    = SORT_BUCKETS.find(b => b.id === bucketId) ?? null
  const assignedBucket = rawBucket ? themedBucket(rawBucket, cardTheme) : null
  const localFlagColor  = cardTheme === 'dark' ? '#A78BFA' : FLAG_COLOR
  const localFlagBorder = cardTheme === 'dark' ? 'rgba(167,139,250,0.55)' : FLAG_BORDER
  const cardBorderColor = localScore.flagged
    ? localFlagBorder
    : assignedBucket
      ? assignedBucket.border
      : 'var(--border-default)'

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        background: 'var(--surface-2)',
        border: `2px solid ${cardBorderColor}`,
        borderRadius: 10, padding: 8,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        opacity: isDragging && !isDragOverlay ? 0.35 : 1,
        boxShadow: isDragOverlay ? '0 8px 24px rgba(0,0,0,0.25)' : 'none',
        width: 165, flexShrink: 0,
      }}
    >
      <div style={{ position: 'relative', width: 138, height: 138 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sub.thumbUrl}
          alt={sub.imageTitle}
          style={{ width: 138, height: 138, objectFit: 'cover', borderRadius: 6, display: 'block', pointerEvents: 'none' }}
        />
        {/* Entry number badge */}
        <span style={{
          position: 'absolute', top: 3, left: 3,
          background: 'rgba(0,0,0,0.60)', color: '#fff',
          fontSize: 12, fontWeight: 700, borderRadius: 3,
          padding: '1px 5px', lineHeight: 1.5, pointerEvents: 'none',
        }}>
          #{rank ?? sub.entryNumber}
        </span>
        {/* Flag badge */}
        {localScore.flagged && (
          <span style={{
            position: 'absolute', bottom: 3, left: 3,
            background: localFlagColor, color: '#fff',
            fontSize: 12, borderRadius: 3, padding: '1px 5px', lineHeight: 1.5, pointerEvents: 'none',
          }}>⚑</span>
        )}
      </div>

      <span style={{
        fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)',
        textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', width: '100%', pointerEvents: 'none',
      }}>
        {sub.imageTitle}
      </span>

      {localScore.score !== null ? (
        <span style={{
          fontSize: 14, fontWeight: 700, color: 'var(--text-primary)',
          background: 'var(--surface-0)',
          borderRadius: 4, padding: '2px 8px', pointerEvents: 'none', lineHeight: 1.5,
        }}>
          {localScore.score}
        </span>
      ) : (
        <span style={{ fontSize: 14, color: 'var(--text-hint)', pointerEvents: 'none', fontStyle: 'italic' }}>
          not scored
        </span>
      )}

      {onView && (
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onView() }}
          title="Open in single view"
          style={{
            position: 'absolute', top: 4, right: 4,
            background: 'rgba(0,0,0,0.50)', border: 'none',
            borderRadius: 4, color: '#fff', fontSize: 14,
            lineHeight: 1, padding: '3px 6px', cursor: 'pointer',
          }}
        >↗</button>
      )}

      {/* Return-to-unsorted badge — top-right corner of the outer card */}
      {onReturn && (
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onReturn() }}
          title="Return to unsorted"
          style={{
            position: 'absolute', top: -9, right: -9,
            width: 20, height: 20,
            background: 'var(--surface-0)',
            border: '1.5px solid var(--border-default)',
            borderRadius: '50%',
            color: 'var(--text-secondary)',
            fontSize: 11, fontWeight: 700,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1, zIndex: 10,
          }}
        >✕</button>
      )}
    </div>
  )
}

// ─── BucketColumn (triage droppable) ──────────────────────────────────────────
function BucketColumn({
  bucket, items, localScores, submissions, scoreMin, scoreMax, onJumpToGrid, onViewSub, onReturn, rankMap,
}: {
  bucket:       ThemedBucket
  items:        string[]
  localScores:  Record<string, LocalScore>
  submissions:  SubmissionForJudge[]
  scoreMin:     number
  scoreMax:     number
  onJumpToGrid: () => void
  onViewSub:    (id: string) => void
  onReturn:     (id: string) => void
  rankMap:      Record<string, number>
}) {
  const { setNodeRef, isOver } = useDroppable({ id: bucket.id })
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
      {/* Solid coloured header — white text for clear vibrancy */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
        background: bucket.headerBg,
        borderTop: `1px solid ${bucket.headerBg}`,
        borderLeft: `1px solid ${bucket.headerBg}`,
        borderRight: `1px solid ${bucket.headerBg}`,
        borderBottom: 'none', borderRadius: '10px 10px 0 0',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{bucket.label}</span>
        <span style={{ marginLeft: 'auto', fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{items.length}</span>
        {items.length > 0 && (
          <button onClick={onJumpToGrid} style={{
            marginLeft: 8, background: 'none', border: 'none', padding: 0,
            fontSize: 14, color: '#fff', cursor: 'pointer',
            textDecoration: 'underline', textUnderlineOffset: 2, flexShrink: 0, fontWeight: 600,
            opacity: 0.9,
          }}>View in grid →</button>
        )}
      </div>
      <div ref={setNodeRef} style={{
        flex: 1, overflow: 'auto',
        borderTop: `1px solid ${bucket.border}`,
        borderLeft: `1px solid ${isOver ? bucket.border : 'var(--border-default)'}`,
        borderRight: `1px solid ${isOver ? bucket.border : 'var(--border-default)'}`,
        borderBottom: `1px solid ${isOver ? bucket.border : 'var(--border-default)'}`,
        borderRadius: '0 0 10px 10px',
        background: isOver ? bucket.bg : 'var(--surface-1)',
        transition: 'background 0.15s, border-color 0.15s',
        padding: 14, display: 'flex', flexWrap: 'wrap', gap: 12, alignContent: 'flex-start',
      }}>
        {items.map(id => {
          const sub = submissions.find(s => s.id === id)
          if (!sub) return null
          return (
            <DraggableCard
              key={id} sub={sub} localScore={localScores[id]}
              bucketId={bucket.id as BucketId} scoreMin={scoreMin} scoreMax={scoreMax}
              onView={() => onViewSub(id)} onReturn={() => onReturn(id)} rank={rankMap[id]}
            />
          )
        })}
        {items.length === 0 && (
          <span style={{ fontSize: 14, color: 'var(--text-hint)', padding: '8px 4px', fontStyle: 'italic' }}>
            Drop images here
          </span>
        )}
      </div>
    </div>
  )
}

// ─── UnsortedPool (triage droppable — horizontal scrolling strip) ────────────
function UnsortedPool({
  items, localScores, submissions, scoreMin, scoreMax, rankMap,
}: {
  items:       string[]
  localScores: Record<string, LocalScore>
  submissions: SubmissionForJudge[]
  scoreMin:    number
  scoreMax:    number
  rankMap:     Record<string, number>
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unsorted' })
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft,  setCanLeft]  = useState(false)
  const [canRight, setCanRight] = useState(false)

  function checkScroll() {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 2)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }

  useEffect(() => { setTimeout(checkScroll, 50) }, [items.length])

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' })
    setTimeout(checkScroll, 350)
  }

  // Merge droppable ref with scroll container ref
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(scrollRef as any).current = node
    setNodeRef(node)
  }, [setNodeRef])

  if (items.length === 0) return null

  return (
    <div style={{ flexShrink: 0, marginBottom: 12 }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)',
        textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px',
      }}>
        Unsorted — {items.length} remaining
      </p>

      {/* Strip wrapper — arrow buttons overlay on left/right */}
      <div style={{ position: 'relative' }}>
        {canLeft && (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => scroll('left')}
            style={{
              position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
              zIndex: 20, width: 40, height: 40,
              background: 'rgba(0,0,0,0.72)',
              border: '2px solid rgba(255,255,255,0.35)',
              borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: '#fff', fontWeight: 700,
              boxShadow: '0 2px 12px rgba(0,0,0,0.40)',
              backdropFilter: 'blur(4px)',
            }}
          >‹</button>
        )}

        <div
          ref={setRefs}
          onScroll={checkScroll}
          style={{
            display: 'flex', flexDirection: 'row', gap: 10,
            overflowX: 'auto', scrollbarWidth: 'none',
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${isOver ? 'var(--action-primary)' : 'var(--border-default)'}`,
            background: isOver ? 'rgba(26,111,196,0.06)' : 'var(--surface-1)',
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          {items.map(id => {
            const sub = submissions.find(s => s.id === id)
            if (!sub) return null
            return (
              <DraggableCard
                key={id} sub={sub} localScore={localScores[id]}
                bucketId={null} scoreMin={scoreMin} scoreMax={scoreMax}
                rank={rankMap[id]}
              />
            )
          })}
        </div>

        {canRight && (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => scroll('right')}
            style={{
              position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
              zIndex: 20, width: 40, height: 40,
              background: 'rgba(0,0,0,0.72)',
              border: '2px solid rgba(255,255,255,0.35)',
              borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: '#fff', fontWeight: 700,
              boxShadow: '0 2px 12px rgba(0,0,0,0.40)',
              backdropFilter: 'blur(4px)',
            }}
          >›</button>
        )}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function JudgingClient({
  token, categoryId, categoryName, submissions,
  prevCategoryId, nextCategoryId, allCategories,
  scoreMin, scoreMax, allowHalfPoints, requireFeedback,
  showMemberName, showExif, isSubmitted,
}: {
  token:           string
  categoryId:      string
  categoryName:    string
  submissions:     SubmissionForJudge[]
  prevCategoryId:  string | null
  nextCategoryId:  string | null
  allCategories:   { id: string; name: string }[]
  scoreMin:        number
  scoreMax:        number
  allowHalfPoints: boolean
  requireFeedback: boolean
  showMemberName:  boolean
  showExif:        boolean
  isSubmitted:     boolean
}) {
  const router = useRouter()
  const { theme } = useTheme()

  // Panel background reflects dark/light mode; use explicit hex since var()
  // may not update in time when theme is toggled rapidly.
  const panelBg = theme === 'dark' ? '#141414' : '#F0F0F0'

  // Flag color — lighter violet in dark mode for legibility against dark surfaces
  const flagColor  = theme === 'dark' ? '#A78BFA' : FLAG_COLOR   // violet-400 vs violet-800
  const flagBorder = theme === 'dark' ? 'rgba(167,139,250,0.55)' : FLAG_BORDER
  const flagBg     = theme === 'dark' ? 'rgba(167,139,250,0.14)' : FLAG_BG

  // ── State ───────────────────────────────────────────────────────────────────
  const [view, setView]               = useState<View>('triage')
  const [filterMode, setFilterMode]   = useState<FilterMode>('all')
  const [currentIdx, setCurrentIdx]   = useState(0)
  const [activeId, setActiveId]       = useState<string | null>(null)
  const [zoom, setZoom]               = useState(false)
  const [showApplyPrompt, setShowApplyPrompt] = useState(false)
  const [applyPromptDone, setApplyPromptDone] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [pendingView, setPendingView] = useState<'grid' | 'single'>('grid')

  const [gridSubView,  setGridSubView]  = useState<GridSubView>('grid')
  const [listSort,     setListSort]     = useState<'score-desc' | 'score-asc'>('score-desc')
  const [gridSize,     setGridSize]     = useState<GridSize>('L')
  const [bucketFilter, setBucketFilter] = useState<BucketFilter>('all')

  // Restore grid size preference
  useEffect(() => {
    const stored = localStorage.getItem('judge_thumb_size')
    if (stored === 'S' || stored === 'M' || stored === 'L') setGridSize(stored as GridSize)
  }, [])
  useEffect(() => {
    localStorage.setItem('judge_thumb_size', gridSize)
  }, [gridSize])

  const [localScores, setLocalScores] = useState<Record<string, LocalScore>>(() => {
    const init: Record<string, LocalScore> = {}
    for (const s of submissions) {
      init[s.id] = { score: s.score, notes: s.notes ?? '', rank: s.rank, flagged: s.flagged, saving: false, saved: false }
    }
    return init
  })

  // Live rank: score-based position, updates as scores change
  const liveRankMap = useMemo(() => {
    const map: Record<string, number> = {}
    const scored = submissions
      .filter(s => (localScores[s.id]?.score ?? null) !== null)
      .sort((a, b) => (localScores[b.id]?.score ?? 0) - (localScores[a.id]?.score ?? 0))
    scored.forEach((s, i) => { map[s.id] = i + 1 })
    return map
  }, [submissions, localScores])

  const bucketStorageKey = `judge_buckets_${token}_${categoryId}`
  const [bucketMap, setBucketMap] = useState<Record<string, BucketId | null>>(() => {
    const init: Record<string, BucketId | null> = {}
    for (const s of submissions) init[s.id] = null
    return init
  })

  // Restore triage buckets from localStorage after mount (deferred to avoid SSR mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(bucketStorageKey)
      if (stored) {
        const parsed: Record<string, BucketId | null> = JSON.parse(stored)
        setBucketMap(prev => {
          const updated = { ...prev }
          for (const s of submissions) {
            if (parsed[s.id] !== undefined) updated[s.id] = parsed[s.id]
          }
          return updated
        })
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    localStorage.setItem(bucketStorageKey, JSON.stringify(bucketMap))
  }, [bucketMap, bucketStorageKey])

  const saveTimers  = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const notesTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filtered = (() => {
    let base = [...submissions]
    // Status filter
    if (filterMode === 'unscored') base = base.filter(s => localScores[s.id]?.score === null)
    else if (filterMode === 'scored')  base = base.filter(s => localScores[s.id]?.score !== null)
    else if (filterMode === 'flagged') base = base.filter(s => localScores[s.id]?.flagged)
    // Bucket filter
    if (bucketFilter === 'unsorted') base = base.filter(s => !bucketMap[s.id])
    else if (bucketFilter !== 'all') base = base.filter(s => bucketMap[s.id] === bucketFilter)
    // Sort in grid view (applies to both thumbnail grid and ranked list subview)
    if (view === 'grid') {
      return [...base].sort((a, b) => {
        const sa = localScores[a.id]?.score ?? null
        const sb = localScores[b.id]?.score ?? null
        if (sa === null && sb === null) return 0
        if (sa === null) return 1
        if (sb === null) return -1
        const diff = listSort === 'score-asc' ? sa - sb : sb - sa
        if (diff !== 0) return diff
        const ra = localScores[a.id]?.rank ?? Infinity
        const rb = localScores[b.id]?.rank ?? Infinity
        return ra - rb
      })
    }
    return base
  })()

  const currentSub  = filtered[currentIdx] ?? filtered[0]
  const scoredCount = submissions.filter(s => localScores[s.id]?.score !== null).length
  const pct         = submissions.length > 0 ? (scoredCount / submissions.length) * 100 : 0

  // 4 equidistant quick-score values
  const quickScores = [
    scoreMin + Math.round((scoreMax - scoreMin) / 4),
    scoreMin + Math.round((scoreMax - scoreMin) / 2),
    scoreMin + Math.round((scoreMax - scoreMin) * 3 / 4),
    scoreMax,
  ]

  // Show individual score buttons for small ranges (≤ 10 steps)
  const showNumberButtons = scoreMax - scoreMin <= 10

  // Keep a ref so the async save callback always sees fresh scores without stale closures
  const localScoresRef = useRef(localScores)
  localScoresRef.current = localScores

  // ── Auto-save ───────────────────────────────────────────────────────────────
  const scheduleAutoSave = useCallback(
    (submissionId: string, scoreOverride?: number, notesOverride?: string) => {
      const existing = saveTimers.current.get(submissionId)
      if (existing) clearTimeout(existing)
      const t = setTimeout(async () => {
        saveTimers.current.delete(submissionId)
        // Read current values from ref — never from inside a state updater
        const ls = localScoresRef.current[submissionId]
        if (!ls || ls.score === null) return
        const score = scoreOverride ?? ls.score
        const notes = notesOverride ?? ls.notes
        // Mark saving — plain state update, not inside another updater
        setLocalScores(prev => ({ ...prev, [submissionId]: { ...prev[submissionId], saving: true } }))
        try {
          await saveScore(token, submissionId, score, notes || null)
          setLocalScores(p => ({ ...p, [submissionId]: { ...p[submissionId], saving: false, saved: true } }))
          setTimeout(() => setLocalScores(p => ({ ...p, [submissionId]: { ...p[submissionId], saved: false } })), 2000)
        } catch {
          setLocalScores(p => ({ ...p, [submissionId]: { ...p[submissionId], saving: false } }))
        }
      }, 600)
      saveTimers.current.set(submissionId, t)
    },
    [token],
  )

  function handleScoreChange(submissionId: string, score: number) {
    setLocalScores(prev => ({ ...prev, [submissionId]: { ...prev[submissionId], score } }))
    scheduleAutoSave(submissionId, score)
  }

  function handleNotesChange(submissionId: string, notes: string) {
    setLocalScores(prev => ({ ...prev, [submissionId]: { ...prev[submissionId], notes } }))
    const existing = notesTimers.current.get(submissionId)
    if (existing) clearTimeout(existing)
    notesTimers.current.set(
      submissionId,
      setTimeout(() => scheduleAutoSave(submissionId, undefined, notes), 1200),
    )
  }

  function handleFlagChange(submissionId: string, flagged: boolean) {
    setLocalScores(prev => ({ ...prev, [submissionId]: { ...prev[submissionId], flagged } }))
    saveFlag(token, submissionId, flagged)
  }

  // ── View switching + apply-bucket prompt ────────────────────────────────────
  function switchToScoreView(targetView: 'grid' | 'single') {
    // Triage buckets are for rough sorting only — scores are not auto-assigned.
    // Just switch directly to the scoring view; bucket state is preserved for reference.
    setView(targetView)
    setCurrentIdx(0)
  }

  async function handleApplyBuckets() {
    const range   = scoreMax - scoreMin
    const buckets: { submissionId: string; score: number }[] = []
    for (const s of submissions) {
      const bid = bucketMap[s.id]
      if (!bid) continue
      const score =
        bid === 'strong' ? scoreMin + Math.round(range * 5 / 6) :
        bid === 'maybe'  ? scoreMin + Math.round(range / 2) :
                           scoreMin + Math.round(range / 6)
      buckets.push({ submissionId: s.id, score })
    }
    await applyBucketScores(token, buckets)
    setLocalScores(prev => {
      const next = { ...prev }
      for (const { submissionId, score } of buckets) {
        if (next[submissionId]?.score === null) {
          next[submissionId] = { ...next[submissionId], score }
        }
      }
      return next
    })
    setApplyPromptDone(true)
    setShowApplyPrompt(false)
    setView(pendingView)
    setCurrentIdx(0)
  }

  function handleSkipApply() {
    setApplyPromptDone(true)
    setShowApplyPrompt(false)
    setView(pendingView)
    setCurrentIdx(0)
  }

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA') return
      if (target.tagName === 'INPUT' && (target as HTMLInputElement).type !== 'range') return

      // Escape — close zoom from any view (highest priority)
      if (e.key === 'Escape' && zoom) { setZoom(false); return }

      // View switch (always active)
      if (e.key === 'g' || e.key === 'G') { setView('grid');   setCurrentIdx(0); return }
      if (e.key === 's' || e.key === 'S') { setView('single'); setCurrentIdx(0); return }
      if (e.key === 't' || e.key === 'T') { setView('triage'); return }

      if (view !== 'single') return

      // Arrow navigation
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault(); setCurrentIdx(i => Math.min(i + 1, filtered.length - 1)); return
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault(); setCurrentIdx(i => Math.max(i - 1, 0)); return
      }

      // Zoom toggle
      if (e.key === 'z' || e.key === 'Z') { setZoom(z => !z); return }

      // F: flag
      if ((e.key === 'f' || e.key === 'F') && currentSub) {
        handleFlagChange(currentSub.id, !localScores[currentSub.id]?.flagged); return
      }

    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, filtered, currentIdx, currentSub, zoom, localScores])

  // ── Triage DnD ──────────────────────────────────────────────────────────────
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragStart(e: DragStartEvent) { setActiveId(e.active.id as string) }
  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const overId       = over.id as string
    const submissionId = active.id as string
    if (overId === 'unsorted') { setBucketMap(prev => ({ ...prev, [submissionId]: null })); return }
    const bucket = SORT_BUCKETS.find(b => b.id === overId)
    if (bucket) setBucketMap(prev => ({ ...prev, [submissionId]: bucket.id }))
  }

  const sortPartitions = {
    unsorted: submissions.filter(s => bucketMap[s.id] === null).map(s => s.id),
    strong:   submissions.filter(s => bucketMap[s.id] === 'strong').map(s => s.id),
    maybe:    submissions.filter(s => bucketMap[s.id] === 'maybe').map(s => s.id),
    weak:     submissions.filter(s => bucketMap[s.id] === 'weak').map(s => s.id),
  }
  const activeSub = activeId ? submissions.find(s => s.id === activeId) : null

  // ── Filmstrip scroll ────────────────────────────────────────────────────────
  const filmstripRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const strip = filmstripRef.current
    if (!strip) return
    const el = strip.children[currentIdx] as HTMLElement | undefined
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [currentIdx])

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', position: 'relative' }}>

      {/* ── Full-viewport zoom overlay — rendered via portal so it escapes all stacking contexts ── */}
      {zoom && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: theme === 'dark' ? '#141414' : '#F0F0F0',
            overflow: 'auto',
          }}
          onClick={() => setZoom(false)}
        >
          <div style={{
            minHeight: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            padding: 20, boxSizing: 'border-box',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentSub?.fullUrl}
              alt={currentSub?.imageTitle}
              style={{ maxWidth: '100%', maxHeight: '100vh', display: 'block', cursor: 'default' }}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <button
            onClick={e => { e.stopPropagation(); setZoom(false) }}
            aria-label="Exit zoom"
            style={{
              position: 'fixed', top: 14, right: 14, zIndex: 10000,
              background: 'rgba(0,0,0,0.75)',
              border: '1.5px solid rgba(255,255,255,0.40)',
              borderRadius: 8, width: 44, height: 44, color: '#fff',
              fontSize: 22, fontWeight: 300, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1, boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}
          >✕</button>
          <div style={{
            position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.70)', color: '#fff', fontSize: 14,
            padding: '6px 16px', borderRadius: 9999, zIndex: 10000, whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>Click anywhere outside image · Esc to close</div>
        </div>,
        document.body
      )}

      {/* Apply-bucket prompt */}
      {showApplyPrompt && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24,
        }}>
          <div style={{
            background: 'var(--surface-2)', border: '1px solid var(--border-default)',
            borderRadius: 14, padding: '28px 28px 24px', maxWidth: 440, width: '100%',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-primary)', fontSize: 20, fontWeight: 700,
              color: 'var(--text-primary)', margin: '0 0 12px', letterSpacing: '-0.01em',
            }}>
              Apply triage as starting scores?
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px' }}>
              You&apos;ve sorted images into triage groups. Apply representative starting scores?
              Strong → upper third · Maybe → middle · Weak → lower third.
              Only unscored images are affected — existing scores are preserved.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={handleSkipApply} style={{
                background: 'none', border: '1px solid var(--border-default)', borderRadius: 8,
                padding: '9px 20px', fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer',
                fontFamily: 'inherit',
              }}>Skip</button>
              <button onClick={handleApplyBuckets} style={{
                background: 'var(--action-primary)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Apply scores</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset triage confirmation */}
      {showResetConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24,
        }}>
          <div style={{
            background: 'var(--surface-2)', border: '1px solid var(--border-default)',
            borderRadius: 14, padding: '28px 28px 24px', maxWidth: 400, width: '100%',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-primary)', fontSize: 20, fontWeight: 700,
              color: 'var(--text-primary)', margin: '0 0 10px', letterSpacing: '-0.01em',
            }}>Reset triage?</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px' }}>
              All images will return to the unsorted pool. Scores are not affected.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  background: 'none', border: '1px solid var(--border-default)', borderRadius: 8,
                  padding: '9px 20px', fontSize: 14, color: 'var(--text-secondary)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Cancel</button>
              <button
                onClick={() => {
                  setBucketMap(Object.fromEntries(submissions.map(s => [s.id, null])))
                  setShowResetConfirm(false)
                }}
                style={{
                  background: 'var(--status-error)', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* Submitted overlay */}
      {isSubmitted && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.50)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24,
        }}>
          <div style={{
            background: 'var(--status-success-bg)', border: '1px solid var(--status-success)',
            borderRadius: 14, padding: '32px 36px', textAlign: 'center', maxWidth: 380,
          }}>
            <p style={{ fontSize: 28, margin: '0 0 8px' }}>✓</p>
            <p style={{ fontFamily: 'var(--font-primary)', fontSize: 17, fontWeight: 700, color: 'var(--status-success-text)', margin: '0 0 8px' }}>
              Scores submitted
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              Your scores are final. You can still review images but cannot make changes.
            </p>
          </div>
        </div>
      )}

      {/* ── Mode selector + nav (single row) ────────────────────────────────── */}
      <div style={{
        background: 'var(--surface-2)', borderBottom: '1px solid var(--border-default)',
        padding: '8px 16px', display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        {/* Left: category nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', minWidth: 0 }}>
          <Link href={`/judge/${token}/landing`} style={{
            fontSize: 14, color: 'var(--action-primary)', textDecoration: 'none',
            flexShrink: 0, fontFamily: 'inherit', whiteSpace: 'nowrap', fontWeight: 500,
          }}>← Home</Link>
          <span style={{ color: 'var(--border-default)', flexShrink: 0 }}>|</span>
          <span style={{
            fontFamily: 'var(--font-primary)', fontSize: 15, fontWeight: 700,
            color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
          }}>{categoryName}</span>
          <span style={{ fontSize: 14, color: 'var(--text-tertiary)', flexShrink: 0, whiteSpace: 'nowrap' }}>
            {scoredCount}/{submissions.length}
          </span>
          <div style={{ width: 40, height: 4, background: 'var(--surface-0)', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--status-success)' : 'var(--action-primary)', borderRadius: 3 }} />
          </div>
        </div>
        {/* Center: mode controls — Triage pill | separator | Grid+Single segment */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Left group: Triage (standalone pill) */}
          {(() => {
            const active = view === 'triage'
            return (
              <button
                onClick={() => setView('triage')}
                style={{
                  padding: '5px 18px',
                  background: active ? 'var(--toggle-selected)' : 'transparent',
                  border: `1px solid ${active ? 'var(--toggle-selected)' : 'var(--border-default)'}`,
                  borderRadius: 7,
                  cursor: 'pointer',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  fontFamily: 'inherit',
                  position: 'relative', zIndex: active ? 1 : 0,
                  transition: 'background 0.12s, color 0.12s',
                }}
              >Quick Triage</button>
            )
          })()}

          {/* Separator */}
          <div style={{ width: 1, height: 20, background: 'var(--border-default)', margin: '0 18px' }} />

          {/* Scoring views label */}
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-tertiary)', marginRight: 6, whiteSpace: 'nowrap' }}>
            Scoring views:
          </span>

          {/* Right group: Grid | Single (connected 2-button segment) */}
          {([
            { id: 'grid',   label: 'Grid',   onClick: () => switchToScoreView('grid') },
            { id: 'single', label: 'Single', onClick: () => switchToScoreView('single') },
          ] as const).map((item, i) => {
            const active = view === item.id
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                style={{
                  padding: '5px 18px',
                  background: active ? 'var(--toggle-selected)' : 'transparent',
                  border: `1px solid ${active ? 'var(--toggle-selected)' : 'var(--border-default)'}`,
                  borderRadius: i === 0 ? '7px 0 0 7px' : '0 7px 7px 0',
                  marginLeft: i > 0 ? -1 : 0,
                  cursor: 'pointer',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  fontFamily: 'inherit',
                  position: 'relative', zIndex: active ? 1 : 0,
                  transition: 'background 0.12s, color 0.12s',
                }}
              >{item.label}</button>
            )
          })}
        </div>

        {/* Right: prev/next category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
          {prevCategoryId && (
            <Link href={`/judge/${token}/judge/${prevCategoryId}`} style={{
              fontSize: 14, padding: '5px 10px', borderRadius: 6,
              border: '1px solid var(--border-default)', color: 'var(--text-secondary)',
              textDecoration: 'none', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>← Prev</Link>
          )}
          {nextCategoryId && (
            <Link href={`/judge/${token}/judge/${nextCategoryId}`} style={{
              fontSize: 14, padding: '5px 10px', borderRadius: 6,
              border: '1px solid var(--border-default)', color: 'var(--text-secondary)',
              textDecoration: 'none', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>Next →</Link>
          )}
        </div>
      </div>

      {/* ── Secondary controls (Grid / Single only) ────────────────────────── */}
      {view !== 'triage' && (
        <div style={{
          background: 'var(--surface-1)', borderBottom: '1px solid var(--border-default)',
          padding: '7px 16px', display: 'flex', alignItems: 'center',
          gap: 6, flexShrink: 0, flexWrap: 'wrap',
        }}>
          {/* Filter button group — merged segment */}
          <div style={{
            display: 'flex', background: 'var(--surface-0)', borderRadius: 7,
            border: '1px solid var(--border-default)', padding: 2, flexShrink: 0,
          }}>
            {(['all', 'unscored', 'scored', 'flagged'] as FilterMode[]).map((mode, i, arr) => (
              <button key={mode} onClick={() => { setFilterMode(mode); setCurrentIdx(0) }} style={{
                padding: '3px 10px', fontSize: 13, fontWeight: filterMode === mode ? 700 : 500,
                cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                borderRadius: i === 0 ? '5px 0 0 5px' : i === arr.length - 1 ? '0 5px 5px 0' : 0,
                background: filterMode === mode ? 'var(--action-primary)' : 'transparent',
                color: filterMode === mode ? '#fff' : 'var(--text-secondary)',
                transition: 'background 0.12s, color 0.12s', whiteSpace: 'nowrap',
              }}>
                {mode === 'all' ? 'All' : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Bucket filter — grid view only; sits right after the filter group */}
          {view === 'grid' && (
            <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
              <select
                value={bucketFilter}
                onChange={e => { setBucketFilter(e.target.value as BucketFilter); setCurrentIdx(0) }}
                style={{
                  appearance: 'none', WebkitAppearance: 'none',
                  padding: '4px 24px 4px 8px', borderRadius: 6, fontSize: 13,
                  border: `1px solid ${bucketFilter !== 'all' ? 'var(--action-primary)' : 'var(--border-default)'}`,
                  background: bucketFilter !== 'all' ? 'rgba(26,111,196,0.08)' : 'var(--surface-2)',
                  color: bucketFilter !== 'all' ? 'var(--action-primary)' : 'var(--text-secondary)',
                  fontWeight: bucketFilter !== 'all' ? 600 : 400,
                  cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
                }}
              >
                <option value="all">All buckets</option>
                <option value="strong">Strong</option>
                <option value="maybe">Maybe</option>
                <option value="weak">Weak</option>
                <option value="unsorted">Unsorted</option>
              </select>
              <span style={{
                position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                pointerEvents: 'none', color: 'var(--text-tertiary)', fontSize: 11, lineHeight: 1,
              }}>▾</span>
            </div>
          )}

          <div style={{ flex: 1 }} />

          {view === 'grid' && (
            <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
              <select
                value={listSort}
                onChange={e => setListSort(e.target.value as typeof listSort)}
                style={{
                  appearance: 'none', WebkitAppearance: 'none',
                  padding: '4px 24px 4px 8px', borderRadius: 6, fontSize: 13,
                  border: '1px solid var(--border-default)',
                  background: 'var(--surface-2)', color: 'var(--text-primary)',
                  cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
                }}
              >
                <option value="score-desc">Score – high to low</option>
                <option value="score-asc">Score – low to high</option>
              </select>
              <span style={{
                position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                pointerEvents: 'none', color: 'var(--text-tertiary)', fontSize: 11, lineHeight: 1,
              }}>▾</span>
            </div>
          )}

          {view === 'grid' && gridSubView === 'grid' && (
            <div style={{
              display: 'flex', background: 'var(--surface-0)', borderRadius: 7,
              border: '1px solid var(--border-default)', padding: 2, gap: 2, flexShrink: 0,
            }}>
              {([{ value: 'M', label: 'S' }, { value: 'L', label: 'L' }] as { value: GridSize; label: string }[]).map(({ value, label }) => (
                <button key={value} onClick={() => setGridSize(value)} style={{
                  padding: '3px 10px', borderRadius: 5, border: 'none', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  background: gridSize === value ? 'var(--action-primary)' : 'transparent',
                  color: gridSize === value ? '#fff' : 'var(--text-secondary)',
                  transition: 'background 0.12s, color 0.12s',
                }}>{label}</button>
              ))}
            </div>
          )}

          {view === 'grid' && (
            <div style={{
              display: 'flex', background: 'var(--surface-0)', borderRadius: 7,
              border: '1px solid var(--border-default)', padding: 2, gap: 2, flexShrink: 0,
            }}>
              <button onClick={() => setGridSubView('grid')} title="Thumbnail grid" style={{
                padding: '4px 9px', borderRadius: 5, border: 'none', cursor: 'pointer',
                background: gridSubView === 'grid' ? 'var(--action-primary)' : 'transparent',
                color: gridSubView === 'grid' ? '#fff' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center',
                transition: 'background 0.12s, color 0.12s',
              }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="1" y="1" width="6" height="6" rx="1"/>
                  <rect x="9" y="1" width="6" height="6" rx="1"/>
                  <rect x="1" y="9" width="6" height="6" rx="1"/>
                  <rect x="9" y="9" width="6" height="6" rx="1"/>
                </svg>
              </button>
              <button onClick={() => setGridSubView('list')} title="Ranked list" style={{
                padding: '4px 9px', borderRadius: 5, border: 'none', cursor: 'pointer',
                background: gridSubView === 'list' ? 'var(--action-primary)' : 'transparent',
                color: gridSubView === 'list' ? '#fff' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center',
                transition: 'background 0.12s, color 0.12s',
              }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="1" y="2" width="14" height="2" rx="1"/>
                  <rect x="1" y="7" width="14" height="2" rx="1"/>
                  <rect x="1" y="12" width="14" height="2" rx="1"/>
                </svg>
              </button>
            </div>
          )}

        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* SINGLE VIEW */}
        {view === 'single' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
                No images match the current filter
              </div>
            ) : (
              <>
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

                  {/* Image panel */}
                  <div
                    onClick={() => setZoom(true)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: panelBg,
                      position: 'relative', overflow: 'hidden',
                      minWidth: 0, cursor: 'zoom-in',
                    }}
                  >
                    {/* Prev arrow */}
                    {!zoom && currentIdx > 0 && (
                      <button onClick={e => { e.stopPropagation(); setCurrentIdx(i => i - 1) }} aria-label="Previous" style={{
                        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                        zIndex: 2, background: 'rgba(0,0,0,0.50)', border: 'none',
                        borderRadius: '50%', width: 44, height: 44, color: '#fff',
                        fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>‹</button>
                    )}
                    {/* Next arrow */}
                    {!zoom && currentIdx < filtered.length - 1 && (
                      <button onClick={e => { e.stopPropagation(); setCurrentIdx(i => i + 1) }} aria-label="Next" style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        zIndex: 2, background: 'rgba(0,0,0,0.50)', border: 'none',
                        borderRadius: '50%', width: 44, height: 44, color: '#fff',
                        fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>›</button>
                    )}

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      key={currentSub?.id}
                      src={currentSub?.fullUrl}
                      alt={currentSub?.imageTitle}
                      style={{
                        maxWidth: '100%', maxHeight: '100%',
                        objectFit: 'contain', display: 'block',
                      }}
                    />

                    {/* Fullscreen overlay button */}
                    {!zoom && (
                      <button
                        onClick={e => { e.stopPropagation(); setZoom(true) }}
                        title="Fullscreen (Z)"
                        style={{
                          position: 'absolute', top: 10, right: 10, zIndex: 2,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 32, height: 32,
                          background: 'rgba(0,0,0,0.45)', border: 'none',
                          borderRadius: 6, color: 'rgba(255,255,255,0.85)',
                          cursor: 'pointer', backdropFilter: 'blur(4px)',
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                          <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                        </svg>
                      </button>
                    )}

                  </div>

                  {/* Score panel — hidden in zoom */}
                  {!zoom && (
                    <div style={{
                      width: 270, flexShrink: 0,
                      borderLeft: '1px solid var(--border-default)',
                      background: 'var(--surface-1)',
                      display: 'flex', flexDirection: 'column',
                      overflow: 'hidden',
                    }}>
                      {/* Header */}
                      <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--border-default)', flexShrink: 0 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                          {currentSub && liveRankMap[currentSub.id] ? `#${liveRankMap[currentSub.id]}` : '—'}
                        </span>
                        <h2 style={{
                          fontFamily: 'var(--font-lora, Lora, Georgia, serif)', fontSize: 16, fontWeight: 700,
                          color: 'var(--text-primary)', margin: '2px 0 0', letterSpacing: '-0.01em',
                          lineHeight: 1.3,
                        }}>{currentSub?.imageTitle}</h2>
                      </div>

                      {/* Score section */}
                      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-default)', flexShrink: 0 }}>
                        {currentSub && (
                          <ScorePanel
                            submissionId={currentSub.id}
                            localScore={localScores[currentSub.id]}
                            assignedBucket={(() => { const b = SORT_BUCKETS.find(b => b.id === bucketMap[currentSub.id]); return b ? themedBucket(b, theme) : null })()}
                            onScoreChange={handleScoreChange}
                            onNotesChange={handleNotesChange}
                            onFlagChange={handleFlagChange}
                            scoreMin={scoreMin}
                            scoreMax={scoreMax}
                            allowHalfPoints={allowHalfPoints}
                            requireFeedback={requireFeedback}
                            showNumberButtons={showNumberButtons}
                          />
                        )}
                      </div>

                      {/* Photographer */}
                      {showMemberName && currentSub?.memberName && (
                        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-default)', flexShrink: 0 }}>
                          <span style={{
                            display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 3,
                          }}>Photographer</span>
                          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{currentSub.memberName}</span>
                        </div>
                      )}

                      {/* Capture data */}
                      {showExif && currentSub?.exifData && Object.keys(currentSub.exifData).length > 0 && (
                        <div style={{ padding: '12px 18px', flex: 1, overflow: 'auto' }}>
                          <span style={{
                            display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 8,
                          }}>Capture data</span>
                          <ExifGrid exifData={currentSub.exifData} />
                        </div>
                      )}

                      {/* Spacer when no scrollable content */}
                      {!(showExif && currentSub?.exifData && Object.keys(currentSub.exifData).length > 0) && (
                        <div style={{ flex: 1 }} />
                      )}

                      {/* Prev / counter / Next */}
                      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-default)', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <button
                            onClick={() => setCurrentIdx(i => Math.max(i - 1, 0))}
                            disabled={currentIdx === 0}
                            style={{
                              flex: 1, padding: '8px 6px', fontSize: 13, fontWeight: 500,
                              background: 'transparent',
                              border: '1px solid var(--border-default)',
                              borderRadius: 7, fontFamily: 'inherit',
                              cursor: currentIdx === 0 ? 'default' : 'pointer',
                              color: currentIdx === 0 ? 'var(--text-disabled)' : 'var(--text-secondary)',
                            }}
                          >← Prev</button>
                          <span style={{
                            fontSize: 13, color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap', textAlign: 'center', minWidth: 40,
                          }}>
                            {currentIdx + 1} / {filtered.length}
                          </span>
                          <button
                            onClick={() => {
                              if (currentIdx < filtered.length - 1) setCurrentIdx(i => i + 1)
                              else if (nextCategoryId) router.push(`/judge/${token}/judge/${nextCategoryId}`)
                            }}
                            disabled={currentIdx === filtered.length - 1 && !nextCategoryId}
                            style={{
                              flex: 1, padding: '8px 6px', fontSize: 13, fontWeight: 500,
                              background: 'transparent',
                              border: '1px solid var(--border-default)',
                              borderRadius: 7, fontFamily: 'inherit',
                              cursor: (currentIdx === filtered.length - 1 && !nextCategoryId) ? 'default' : 'pointer',
                              color: (currentIdx === filtered.length - 1 && !nextCategoryId) ? 'var(--text-disabled)' : 'var(--text-secondary)',
                            }}
                          >
                            {currentIdx < filtered.length - 1
                              ? 'Next →'
                              : nextCategoryId ? 'Next cat →' : 'Next →'}
                          </button>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-hint)', margin: 0, textAlign: 'center' }}>
                          ← → keys · Z zoom · F flag
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Filmstrip */}
                {!zoom && (
                  <div ref={filmstripRef} style={{
                    height: 84, flexShrink: 0,
                    display: 'flex', gap: 6, overflowX: 'auto',
                    padding: '8px 12px',
                    background: 'var(--surface-2)', borderTop: '1px solid var(--border-default)',
                    scrollbarWidth: 'none',
                  }}>
                    {filtered.map((sub, i) => {
                      const ls      = localScores[sub.id]
                      const active  = i === currentIdx
                      const flagged = ls?.flagged
                      return (
                        <button key={sub.id} onClick={() => setCurrentIdx(i)} style={{
                          flexShrink: 0, width: 64, height: 64, borderRadius: 6, overflow: 'hidden',
                          border: `2px solid ${active ? 'var(--action-primary)' : flagged ? flagColor : 'transparent'}`,
                          padding: 0, cursor: 'pointer', position: 'relative',
                          background: panelBg, outline: 'none',
                        }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={sub.thumbUrl} alt={sub.imageTitle} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          {ls?.score !== null && (
                            <div style={{
                              position: 'absolute', bottom: 2, right: 2,
                              background: 'rgba(0,0,0,0.60)', color: '#fff', fontSize: 12, fontWeight: 700,
                              borderRadius: 3, padding: '1px 4px', lineHeight: 1.4,
                            }}>{ls.score}</div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* GRID VIEW */}
        {view === 'grid' && (
          <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
            {filtered.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', fontSize: 14 }}>
                No images match the current filter
              </div>
            ) : gridSubView === 'list' ? (
              /* Ranked list */
              (() => {
                const groups: { score: number | null; subs: SubmissionForJudge[] }[] = []
                for (const sub of filtered) {
                  const s = localScores[sub.id]?.score ?? null
                  const last = groups[groups.length - 1]
                  if (last && last.score === s) last.subs.push(sub)
                  else groups.push({ score: s, subs: [sub] })
                }
                // Sort tied groups by rank so drag-reorder is immediately reflected
                for (const group of groups) {
                  if (group.subs.length > 1) {
                    group.subs.sort((a, b) => {
                      const ra = localScores[a.id]?.rank ?? 9999
                      const rb = localScores[b.id]?.rank ?? 9999
                      return ra - rb
                    })
                  }
                }
                function handleRankDragEnd(e: DragEndEvent, groupSubs: SubmissionForJudge[]) {
                  const { active, over } = e
                  if (!over || active.id === over.id) return
                  const oldIdx = groupSubs.findIndex(s => s.id === active.id)
                  const newIdx = groupSubs.findIndex(s => s.id === over.id)
                  if (oldIdx === -1 || newIdx === -1) return
                  const reordered = arrayMove(groupSubs, oldIdx, newIdx)
                  setLocalScores(prev => {
                    const next = { ...prev }
                    reordered.forEach((sub, idx) => {
                      next[sub.id] = { ...next[sub.id], rank: idx + 1 }
                      saveRank(token, sub.id, idx + 1)
                    })
                    return next
                  })
                }
                return (
                  <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {groups.map((group, gi) => {
                      const isTied = group.subs.length > 1
                      return (
                        <div key={`group-${gi}`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{
                              fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                              fontFamily: 'var(--font-lora, Lora, Georgia, serif)',
                              color: group.score !== null ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            }}>{group.score !== null ? group.score : 'Unscored'}</span>
                            {isTied && (
                              <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>
                                · {group.subs.length} tied — drag to set preference
                              </span>
                            )}
                            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                          </div>
                          <DndContext sensors={sensors} onDragEnd={e => handleRankDragEnd(e, group.subs)}>
                            <SortableContext items={group.subs.map(s => s.id)} strategy={verticalListSortingStrategy}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {group.subs.map((sub, si) => (
                                  <RankRow
                                    key={sub.id} sub={sub}
                                    localScore={localScores[sub.id]}
                                    rankWithinGroup={si + 1} isTied={isTied}
                                    assignedBucket={(() => { const b = SORT_BUCKETS.find(b => b.id === bucketMap[sub.id]); return b ? themedBucket(b, theme) : null })()}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        </div>
                      )
                    })}
                  </div>
                )
              })()
            ) : (
              /* Thumbnail grid */
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(${gridSize === 'L' ? 300 : gridSize === 'M' ? 220 : 155}px, 1fr))`,
                gap: 16,
              }}>
                {filtered.map((sub, i) => {
                  const ls             = localScores[sub.id]
                  const assignedBucket = (() => { const b = SORT_BUCKETS.find(b => b.id === bucketMap[sub.id]); return b ? themedBucket(b, theme) : null })()
                  const scoreBucket    = bucketForScore(ls?.score ?? null, scoreMin, scoreMax)
                  const cardBorder     = ls?.flagged
                    ? `2px solid ${flagBorder}`
                    : assignedBucket
                      ? `2px solid ${assignedBucket.border}`
                      : '2px solid var(--border-default)'
                  return (
                    <div key={sub.id} style={{
                      borderRadius: 10, overflow: 'hidden',
                      border: cardBorder,
                      background: 'var(--surface-2)', transition: 'box-shadow 0.15s',
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
                    >
                      {/* Thumbnail → click → single view */}
                      <div
                        onClick={() => { setView('single'); setCurrentIdx(i) }}
                        style={{ aspectRatio: '4/3', overflow: 'hidden', background: panelBg, cursor: 'pointer', position: 'relative' }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={sub.thumbUrl} alt={sub.imageTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{
                          position: 'absolute', top: 5, left: 5,
                          background: 'rgba(0,0,0,0.60)', color: '#fff',
                          fontSize: 12, fontWeight: 700, borderRadius: 3, padding: '2px 6px',
                        }}>#{liveRankMap[sub.id] ?? '—'}</span>
                        {ls?.flagged && (
                          <span style={{
                            position: 'absolute', top: 5, right: 5,
                            background: flagColor, color: '#fff',
                            fontSize: 12, fontWeight: 600, borderRadius: 3, padding: '2px 7px',
                          }}>⚑ Flagged</span>
                        )}
                      </div>

                      <div style={{ padding: '10px 14px 14px' }}>
                        <p style={{
                          fontFamily: 'var(--font-primary)',
                          fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                          margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{sub.imageTitle}</p>

                        <div onClick={e => e.stopPropagation()}>
                          {ls?.score === null ? (
                            /* Unscored — show quick-pick buttons; no misleading slider position */
                            <div style={{ marginBottom: 8 }}>
                              <p style={{
                                fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
                                textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 5px',
                              }}>Score</p>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {quickScores.map(qs => (
                                  <button key={qs} onClick={() => handleScoreChange(sub.id, qs)} style={{
                                    flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 13, fontWeight: 600,
                                    border: '1.5px solid var(--border-default)',
                                    background: 'transparent', color: 'var(--text-secondary)',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                    transition: 'background 0.1s, color 0.1s, border-color 0.1s',
                                  }}
                                    onMouseEnter={e => {
                                      const el = e.currentTarget as HTMLButtonElement
                                      el.style.background = 'var(--action-primary)'
                                      el.style.color = '#fff'
                                      el.style.borderColor = 'var(--action-primary)'
                                    }}
                                    onMouseLeave={e => {
                                      const el = e.currentTarget as HTMLButtonElement
                                      el.style.background = 'transparent'
                                      el.style.color = 'var(--text-secondary)'
                                      el.style.borderColor = 'var(--border-default)'
                                    }}
                                  >{qs}</button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            /* Scored — show slider + editable number */
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <input
                                type="range" min={scoreMin} max={scoreMax}
                                step={allowHalfPoints ? 0.5 : 1}
                                value={ls.score}
                                onChange={e => handleScoreChange(sub.id, Number(e.target.value))}
                                style={{ flex: 1, accentColor: 'var(--action-primary)', cursor: 'pointer' }}
                              />
                              <HoverScoreInput
                                score={ls.score}
                                scoreMin={scoreMin}
                                scoreMax={scoreMax}
                                defaultScore={ls.score}
                                fontSize={15}
                                onScoreChange={n => handleScoreChange(sub.id, n)}
                              />
                            </div>
                          )}

                          {/* Flag + status */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={() => handleFlagChange(sub.id, !ls?.flagged)} style={{
                              background: ls?.flagged ? flagBg : 'none',
                              border: `1px solid ${ls?.flagged ? flagBorder : 'var(--border-default)'}`,
                              borderRadius: 6, padding: '4px 10px', fontSize: 14,
                              color: ls?.flagged ? flagColor : 'var(--text-secondary)',
                              cursor: 'pointer', fontWeight: ls?.flagged ? 600 : 400, fontFamily: 'inherit',
                            }}>⚑ {ls?.flagged ? 'Flagged' : 'Flag'}</button>
                            <div style={{ marginLeft: 'auto' }}>
                              {ls?.saving && <span style={{ fontSize: 14, color: 'var(--text-hint)' }}>Saving…</span>}
                              {ls?.saved  && <span style={{ fontSize: 14, color: 'var(--status-success-text)' }}>Saved ✓</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TRIAGE VIEW */}
        {view === 'triage' && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            overflow: 'hidden', padding: '16px 24px 16px',
          }}>

            {/* Header row: category name (prominent) + hint + reset */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 12, flexShrink: 0 }}>
              <h2 style={{
                fontFamily: 'var(--font-primary)', fontSize: 22, fontWeight: 700,
                letterSpacing: '-0.015em', color: 'var(--text-primary)', margin: 0,
                lineHeight: 1.2,
              }}>
                {categoryName}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.5, flex: 1 }}>
                Drag into groups · click ✕ on a card to return it to the strip
              </p>
              {Object.values(bucketMap).some(v => v !== null) && (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  style={{
                    flexShrink: 0, background: 'none',
                    border: '1px solid var(--border-default)',
                    borderRadius: 8, padding: '5px 12px', fontSize: 13,
                    color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >Reset triage</button>
              )}
            </div>

            <DndContext id="triage-dnd" sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              {/* Unsorted strip — fixed height across the top */}
              <UnsortedPool
                items={sortPartitions.unsorted} localScores={localScores}
                submissions={submissions} scoreMin={scoreMin} scoreMax={scoreMax}
                rankMap={liveRankMap}
              />

              {/* Bucket columns — fill remaining viewport height */}
              <div style={{ flex: 1, display: 'flex', gap: 12, minHeight: 0 }}>
                {SORT_BUCKETS.map(rawBucket => (
                  <BucketColumn
                    key={rawBucket.id} bucket={themedBucket(rawBucket, theme)}
                    items={sortPartitions[rawBucket.id as BucketId]}
                    localScores={localScores} submissions={submissions}
                    scoreMin={scoreMin} scoreMax={scoreMax}
                    onJumpToGrid={() => { setFilterMode('all'); switchToScoreView('grid') }}
                    onViewSub={id => {
                      const idx = submissions.findIndex(s => s.id === id)
                      setFilterMode('all')
                      setGridSubView('grid')
                      setCurrentIdx(idx >= 0 ? idx : 0)
                      switchToScoreView('single')
                    }}
                    onReturn={id => setBucketMap(prev => ({ ...prev, [id]: null }))}
                    rankMap={liveRankMap}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeSub ? (
                  <DraggableCard
                    sub={activeSub} localScore={localScores[activeSub.id]}
                    bucketId={bucketMap[activeSub.id] ?? null}
                    scoreMin={scoreMin} scoreMax={scoreMax} isDragOverlay
                    rank={liveRankMap[activeSub.id]}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── HoverScoreInput ───────────────────────────────────────────────────────────
function HoverScoreInput({
  score, scoreMin, scoreMax, defaultScore, fontSize, onScoreChange,
}: {
  score: number | null
  scoreMin: number
  scoreMax: number
  defaultScore: number
  fontSize: number
  onScoreChange: (n: number) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [rawVal, setRawVal]   = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const displayScore = score ?? defaultScore
  const w = fontSize * 1.05
  const h = Math.ceil(fontSize * 1.15)

  function commit(val: string) {
    const n = parseFloat(val)
    if (!isNaN(n) && val.trim() !== '') {
      onScoreChange(Math.min(Math.max(n, scoreMin), scoreMax))
    }
    setHovered(false)
  }

  return (
    <div
      style={{ display: 'inline-block', width: w, height: h, cursor: 'text', flexShrink: 0 }}
      onMouseEnter={() => { setHovered(true); setRawVal(String(displayScore)) }}
      onMouseLeave={() => { if (document.activeElement !== inputRef.current) setHovered(false) }}
    >
      {hovered ? (
        <input
          ref={inputRef}
          autoFocus
          value={rawVal}
          onChange={e => setRawVal(e.target.value.replace(/[^0-9.]/g, ''))}
          onBlur={() => commit(rawVal)}
          onKeyDown={e => {
            if (e.key === 'Enter') { commit(rawVal); inputRef.current?.blur() }
            if (e.key === 'Escape') { setHovered(false) }
          }}
          style={{
            width: w, height: h,
            fontSize, fontWeight: 700, lineHeight: `${h}px`,
            fontFamily: 'var(--font-lora, Lora, Georgia, serif)',
            color: 'var(--action-primary)',
            background: 'rgba(26,111,196,0.07)',
            borderRadius: 4, border: 'none', outline: 'none',
            boxShadow: '0 0 0 2px rgba(26,111,196,0.25)',
            textAlign: 'center', padding: 0, boxSizing: 'border-box',
            display: 'block',
          }}
        />
      ) : (
        <span style={{
          display: 'block', width: w, height: h,
          fontSize, fontWeight: 700, lineHeight: `${h}px`,
          fontFamily: 'var(--font-lora, Lora, Georgia, serif)',
          color: score !== null ? 'var(--text-primary)' : 'var(--text-tertiary)',
          textAlign: 'center',
        }}>
          {displayScore}
        </span>
      )}
    </div>
  )
}

// ─── FeedbackField ────────────────────────────────────────────────────────────
function FeedbackField({
  submissionId,
  notes,
  requireFeedback,
  onNotesChange,
}: {
  submissionId:    string
  notes:           string
  requireFeedback: boolean
  onNotesChange:   (id: string, notes: string) => void
}) {
  // If optional and no existing notes, start collapsed
  const [expanded, setExpanded] = useState(!requireFeedback ? !!notes : true)

  if (requireFeedback) {
    return (
      <div>
        <label style={{
          display: 'block', fontSize: 14, fontWeight: 600,
          color: 'var(--text-secondary)', textTransform: 'uppercase',
          letterSpacing: '0.04em', marginBottom: 6,
        }}>
          Feedback{' '}
          <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--status-error)' }}>
            (required)
          </span>
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={e => onNotesChange(submissionId, e.target.value)}
          placeholder="Feedback for the photographer…"
          style={{
            width: '100%', resize: 'vertical', borderRadius: 8,
            border: '1px solid var(--border-default)',
            background: 'var(--surface-2)', color: 'var(--text-primary)',
            fontSize: 14, padding: '8px 10px', lineHeight: 1.6,
            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          background: 'none', border: 'none', padding: 0,
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
          color: 'var(--action-primary)', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        <span style={{
          display: 'inline-block',
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s',
          fontSize: 10,
        }}>
          ▶
        </span>
        {expanded ? 'Hide feedback' : 'Add feedback'}{' '}
        <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span>
      </button>
      {expanded && (
        <textarea
          rows={3}
          value={notes}
          onChange={e => onNotesChange(submissionId, e.target.value)}
          placeholder="Feedback for the photographer…"
          autoFocus={!notes}
          style={{
            marginTop: 8,
            width: '100%', resize: 'vertical', borderRadius: 8,
            border: '1px solid var(--border-default)',
            background: 'var(--surface-2)', color: 'var(--text-primary)',
            fontSize: 14, padding: '8px 10px', lineHeight: 1.6,
            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  )
}

// ─── ScorePanel ────────────────────────────────────────────────────────────────
function ScorePanel({
  submissionId, localScore, assignedBucket, onScoreChange, onNotesChange, onFlagChange,
  scoreMin, scoreMax, allowHalfPoints, requireFeedback, showNumberButtons,
}: {
  submissionId:      string
  localScore:        LocalScore
  assignedBucket:    ThemedBucket | null
  onScoreChange:     (id: string, score: number) => void
  onNotesChange:     (id: string, notes: string) => void
  onFlagChange:      (id: string, flagged: boolean) => void
  scoreMin:          number
  scoreMax:          number
  allowHalfPoints:   boolean
  requireFeedback:   boolean
  showNumberButtons: boolean
}) {
  const { theme: panelTheme } = useTheme()
  const localFlagColor  = panelTheme === 'dark' ? '#A78BFA' : FLAG_COLOR
  const localFlagBorder = panelTheme === 'dark' ? 'rgba(167,139,250,0.55)' : FLAG_BORDER
  const localFlagBg     = panelTheme === 'dark' ? 'rgba(167,139,250,0.14)' : FLAG_BG
  const score = localScore?.score ?? null
  const notes = localScore?.notes ?? ''
  const [feedbackOpen, setFeedbackOpen] = useState(requireFeedback || !!notes)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div>
        {/* Score label row: SCORE left, bucket badge + saving right */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Score
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {assignedBucket && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: assignedBucket.color,
                background: assignedBucket.bg, borderRadius: 4, padding: '2px 7px',
              }}>
                {assignedBucket.label}
              </span>
            )}
            {localScore?.saving && <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>saving…</span>}
            {localScore?.saved  && <span style={{ fontSize: 11, color: 'var(--status-success-text)' }}>saved ✓</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 10 }}>
          <HoverScoreInput
            score={score}
            scoreMin={scoreMin}
            scoreMax={scoreMax}
            defaultScore={Math.round((scoreMin + scoreMax) / 2)}
            fontSize={44}
            onScoreChange={n => onScoreChange(submissionId, n)}
          />
          <span style={{ fontSize: 16, color: 'var(--text-tertiary)', marginLeft: 6 }}>/{scoreMax}</span>
        </div>

        {/* Number buttons for small ranges */}
        {showNumberButtons && (
          <div style={{ display: 'flex', gap: 3, marginBottom: 10, flexWrap: 'wrap' }}>
            {Array.from({ length: scoreMax - scoreMin + 1 }, (_, i) => scoreMin + i).map(n => (
              <button key={n} onClick={() => onScoreChange(submissionId, n)} style={{
                flex: 1, minWidth: 30, padding: '6px 2px', fontSize: 14, fontWeight: 600,
                border: `1px solid ${score === n ? 'var(--action-primary)' : 'var(--border-default)'}`,
                borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                background: score === n ? 'var(--action-primary)' : 'var(--surface-2)',
                color: score === n ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.1s',
              }}>{n}</button>
            ))}
          </div>
        )}

        <input
          type="range" min={scoreMin} max={scoreMax} step={allowHalfPoints ? 0.5 : 1}
          value={score ?? Math.round((scoreMin + scoreMax) / 2)}
          onChange={e => onScoreChange(submissionId, Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--action-primary)', cursor: 'pointer' }}
        />
        {/* Feedback toggle + Flag on same row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, minHeight: 28 }}>
          {score === null && !assignedBucket ? (
            <span style={{ fontSize: 12, color: 'var(--text-hint)', flex: 1 }}>Move slider to score</span>
          ) : <span style={{ flex: 1 }} />}
          {!requireFeedback && (
            <button
              onClick={() => setFeedbackOpen(v => !v)}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: 14, fontWeight: 500, cursor: 'pointer',
                color: 'var(--action-primary)', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
              }}
            >
              <span style={{
                display: 'inline-block',
                transform: feedbackOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s', fontSize: 9,
              }}>▶</span>
              Feedback
              <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-tertiary)' }}>(Optional)</span>
            </button>
          )}
          <button
            onClick={() => onFlagChange(submissionId, !localScore?.flagged)}
            title="Flag for review"
            style={{
              background: localScore?.flagged ? localFlagBg : 'transparent',
              border: localScore?.flagged ? `2px solid ${localFlagBorder}` : '1px solid var(--border-default)',
              borderRadius: 6, width: 32, height: 32, fontSize: 16, lineHeight: 1,
              color: localScore?.flagged ? localFlagColor : 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >⚑</button>
        </div>
      </div>

      {/* Feedback textarea */}
      {requireFeedback ? (
        <div style={{ marginTop: 10 }}>
          <span style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 5 }}>
            Feedback <span style={{ fontSize: 14, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(Required)</span>
          </span>
          <textarea
            rows={3} value={notes}
            onChange={e => onNotesChange(submissionId, e.target.value)}
            placeholder="Feedback for the photographer…"
            style={{
              width: '100%', resize: 'vertical', borderRadius: 8,
              border: '1px solid var(--border-default)',
              background: 'var(--surface-2)', color: 'var(--text-primary)',
              fontSize: 13, padding: '8px 10px', lineHeight: 1.6,
              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>
      ) : feedbackOpen && (
        <textarea
          rows={3} value={notes} autoFocus={!notes}
          onChange={e => onNotesChange(submissionId, e.target.value)}
          placeholder="Feedback for the photographer…"
          style={{
            marginTop: 8, width: '100%', resize: 'vertical', borderRadius: 8,
            border: '1px solid var(--border-default)',
            background: 'var(--surface-2)', color: 'var(--text-primary)',
            fontSize: 13, padding: '8px 10px', lineHeight: 1.6,
            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  )
}

// ─── ExifGrid ──────────────────────────────────────────────────────────────────
function ExifGrid({ exifData }: { exifData: Record<string, unknown> }) {
  return (
    <div>
      {/* Capture date */}
      {(() => {
        const raw = exifData['DateTimeOriginal'] ?? exifData['CreateDate'] ?? exifData['DateTime']
        if (!raw) return null
        let formatted: string
        try {
          const d = raw instanceof Date ? raw : new Date(String(raw))
          formatted = isNaN(d.getTime()) ? String(raw) : d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
        } catch {
          formatted = String(raw)
        }
        return (
          <div style={{ marginBottom: 7 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block' }}>Captured</span>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{formatted}</span>
          </div>
        )
      })()}
      {/* Lens */}
      {(() => {
        const lens = exifData['LensModel'] ?? exifData['lens'] ?? exifData['Lens']
        return lens ? (
          <div style={{ marginBottom: 7 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block' }}>Lens</span>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, wordBreak: 'break-word' }}>
              {String(lens)}
            </span>
          </div>
        ) : null
      })()}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 8px' }}>
        {(
          [
            ['Make',         exifData['Make']            ?? exifData['make'],           (v: unknown) => String(v)],
            ['Model',        exifData['Model']           ?? exifData['model'],          (v: unknown) => String(v)],
            ['Focal length', exifData['FocalLength']     ?? exifData['focal_length'],   (v: unknown) => `${Math.round(parseFloat(String(v)))}mm`],
            ['Aperture',     exifData['FNumber']         ?? exifData['aperture'],       (v: unknown) => `f/${parseFloat(String(v)).toFixed(1).replace(/\.0$/, '')}`],
            ['Shutter',      exifData['ExposureTime']    ?? exifData['shutter_speed'],  (v: unknown) => {
              const s = String(v)
              if (s.includes('/')) return `${s}s`
              const n = parseFloat(s)
              if (isNaN(n)) return s
              if (n >= 1) return `${n}s`
              return `1/${Math.round(1 / n)}s`
            }],
            ['ISO',          exifData['ISOSpeedRatings'] ?? exifData['iso'] ?? exifData['ISO'], (v: unknown) => String(Array.isArray(v) ? v[0] : v)],
          ] as [string, unknown, (v: unknown) => string][]
        ).filter(([, v]) => v != null).map(([label, value, fmt]) => (
          <div key={label}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block' }}>{label}</span>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
              {fmt(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── RankRow (sortable, used in score-order list) ──────────────────────────────
function RankRow({
  sub, localScore, rankWithinGroup, isTied, assignedBucket,
}: {
  sub:             SubmissionForJudge
  localScore:      LocalScore
  rankWithinGroup: number
  isTied:          boolean
  assignedBucket:  ThemedBucket | null
}) {
  const { theme: rowTheme } = useTheme()
  const localFlagBorder = rowTheme === 'dark' ? 'rgba(167,139,250,0.55)' : FLAG_BORDER
  const localFlagColor  = rowTheme === 'dark' ? '#A78BFA' : FLAG_COLOR
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sub.id })
  return (
    <div ref={setNodeRef} style={{
      transform: CSS.Transform.toString(transform), transition,
      opacity: isDragging ? 0.4 : 1,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 8,
      background: 'var(--surface-2)',
      border: `1px solid ${localScore.flagged ? localFlagBorder : assignedBucket ? assignedBucket.border : 'var(--border-default)'}`,
    }}>
      <span
        {...(isTied ? { ...attributes, ...listeners } : {})}
        style={{
          display: 'flex', flexDirection: 'column', gap: 3,
          cursor: isTied ? 'grab' : 'default', padding: '2px 4px',
          color: isTied ? 'var(--text-tertiary)' : 'transparent',
          flexShrink: 0, userSelect: 'none',
        }}
      >
        {[0, 1, 2].map(i => (
          <span key={i} style={{ display: 'flex', gap: 3 }}>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'currentColor' }} />
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'currentColor' }} />
          </span>
        ))}
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-tertiary)', minWidth: 24, textAlign: 'right', flexShrink: 0 }}>
        {isTied ? `${rankWithinGroup}.` : ''}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={sub.thumbUrl} alt={sub.imageTitle} style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
      <span style={{ fontFamily: 'var(--font-primary)', flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {sub.imageTitle}
      </span>
      <span style={{ fontSize: 14, color: 'var(--text-tertiary)', flexShrink: 0 }}>#{sub.entryNumber}</span>
      {localScore.flagged && (
        <span style={{ fontSize: 14, fontWeight: 600, color: localFlagColor, flexShrink: 0 }}>⚑</span>
      )}
      {assignedBucket && (
        <span style={{
          fontSize: 14, fontWeight: 600, color: assignedBucket.color,
          background: assignedBucket.bg, border: `1px solid ${assignedBucket.border}`,
          borderRadius: 9999, padding: '3px 10px', flexShrink: 0,
        }}>{assignedBucket.label}</span>
      )}
      <span style={{
        fontSize: 15, fontWeight: 700,
        fontFamily: 'var(--font-lora, Lora, Georgia, serif)',
        color: localScore.score !== null ? 'var(--text-primary)' : 'var(--text-hint)',
        background: 'var(--surface-0)',
        border: '1px solid var(--border-default)',
        borderRadius: 6, padding: '3px 10px', minWidth: 38, textAlign: 'center', flexShrink: 0,
      }}>{localScore.score ?? '—'}</span>
    </div>
  )
}

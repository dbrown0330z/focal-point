'use client'

import { useState, useTransition, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/layout/ThemeProvider'
import { saveAward, markAwardsComplete } from '../actions'
import type { SubmissionForAwards } from './page'
import type { AwardTier } from '@/types/competition'

// How many entries to show initially in scored mode before "Show all"
const DEFAULT_SHOW_COUNT = 10

export default function AwardsClient({
  token,
  categoryId,
  categoryName,
  submissions,
  awardTypes,
  isAwardsOnly,
  alreadyComplete,
  prevCategoryId,
  nextCategoryId,
  allCategories,
  isSubmitted,
}: {
  token:           string
  categoryId:      string
  categoryName:    string
  submissions:     SubmissionForAwards[]
  awardTypes:      AwardTier[]
  isAwardsOnly:    boolean
  alreadyComplete: boolean
  prevCategoryId:  string | null
  nextCategoryId:  string | null
  allCategories:   { id: string; name: string }[]
  isSubmitted:     boolean
}) {
  const router = useRouter()
  const { theme } = useTheme()

  // Local award state, keyed by submission id
  const [awards, setAwards] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {}
    submissions.forEach(s => { init[s.id] = s.awardId })
    return init
  })

  const [showAll,      setShowAll]      = useState(false)
  const [completing,   setCompleting]   = useState(false)
  const [, startTransition]             = useTransition()

  // Fullscreen single-image viewer
  const [fullscreenIdx, setFullscreenIdx] = useState<number | null>(null)

  const surfaceBg = theme === 'dark' ? '#1E1E1E' : '#FFFFFF'

  // Which award IDs are already assigned (to enforce uniqueness)
  const assignedAwardIds = Object.values(awards).filter(Boolean) as string[]

  const handleAwardChange = useCallback(async (submissionId: string, awardId: string | null) => {
    setAwards(prev => ({ ...prev, [submissionId]: awardId }))
    await saveAward(token, submissionId, awardId)
  }, [token])

  async function handleComplete() {
    setCompleting(true)
    await markAwardsComplete(token, categoryId)
    router.push(`/judge/${token}/landing`)
  }

  // Determine visible submissions
  const showCount = (!isAwardsOnly && !showAll) ? DEFAULT_SHOW_COUNT : submissions.length
  const visible   = submissions.slice(0, showCount)
  const hidden    = submissions.length - showCount

  // Detect ties (for scored preset)
  function isTied(sub: SubmissionForAwards, idx: number): boolean {
    if (isAwardsOnly || sub.score === null) return false
    const prev = submissions[idx - 1]
    const next = submissions[idx + 1]
    return (prev?.score === sub.score) || (next?.score === sub.score)
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 80px' }}>

      {/* Nav bar */}
      <div style={{
        background:   'var(--surface-1)',
        borderBottom: '1px solid var(--border-default)',
        padding:      '0 20px',
        height:       44,
        display:      'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems:   'center',
        position:     'sticky',
        top:          52,
        zIndex:       40,
      }}>
        {/* Left: back to landing */}
        <Link
          href={`/judge/${token}/landing`}
          style={{ fontSize: 14, color: 'var(--action-primary)', textDecoration: 'none', fontWeight: 500 }}
        >
          ← Home
        </Link>

        {/* Center: category name */}
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
          {categoryName} — Awards
        </span>

        {/* Right: prev/next category awards */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {prevCategoryId ? (
            <Link
              href={`/judge/${token}/judge/${prevCategoryId}/awards`}
              style={{ fontSize: 14, color: 'var(--action-primary)', textDecoration: 'none', fontWeight: 500 }}
            >
              ← Prev
            </Link>
          ) : <span />}
          {nextCategoryId ? (
            <Link
              href={`/judge/${token}/judge/${nextCategoryId}/awards`}
              style={{ fontSize: 14, color: 'var(--action-primary)', textDecoration: 'none', fontWeight: 500 }}
            >
              Next →
            </Link>
          ) : null}
        </div>
      </div>

      <div style={{ padding: '28px 24px 0' }}>

        {/* Instruction */}
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          {isAwardsOnly
            ? 'Review all entries and assign awards. Each award can only be given once.'
            : `Assign awards to the top entries. Each award can only be given once per category.${!showAll && submissions.length > DEFAULT_SHOW_COUNT ? ` The top ${DEFAULT_SHOW_COUNT} entries are shown by default.` : ''}`}
        </p>

        {/* Award type reference */}
        {awardTypes.length > 0 && (
          <div style={{
            display:      'flex',
            flexWrap:     'wrap',
            gap:          8,
            marginBottom: 24,
          }}>
            {awardTypes.map(award => {
              const isAssigned = assignedAwardIds.includes(award.id)
              return (
                <span
                  key={award.id}
                  style={{
                    fontSize:     12,
                    fontWeight:   600,
                    padding:      '4px 10px',
                    borderRadius: 9999,
                    background:   isAssigned ? 'var(--spot-gold)' : 'var(--surface-1)',
                    color:        isAssigned ? '#fff' : 'var(--text-secondary)',
                    border:       '1px solid var(--border-default)',
                    transition:   'background 0.15s, color 0.15s',
                  }}
                >
                  {isAssigned ? '✓ ' : ''}{award.label}
                </span>
              )
            })}
          </div>
        )}

        {/* Submission list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map((sub, idx) => {
            const tied        = isTied(sub, idx)
            const currentAward = awards[sub.id] ?? null
            const awardLabel  = awardTypes.find(a => a.id === currentAward)?.label

            return (
              <div
                key={sub.id}
                style={{
                  background:   'var(--surface-2)',
                  border:       `1px solid ${currentAward ? 'rgba(123,107,56,0.45)' : 'var(--border-default)'}`,
                  borderRadius: 10,
                  padding:      '14px 16px',
                  display:      'grid',
                  gridTemplateColumns: '52px 1fr auto',
                  gap:          14,
                  alignItems:   'center',
                }}
              >
                {/* Thumbnail */}
                <button
                  onClick={() => setFullscreenIdx(idx)}
                  style={{
                    background:   'none',
                    border:       'none',
                    padding:      0,
                    cursor:       'zoom-in',
                    borderRadius: 6,
                    overflow:     'hidden',
                    width:        52,
                    height:       52,
                    flexShrink:   0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sub.thumbUrl}
                    alt={sub.imageTitle}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </button>

                {/* Title + score */}
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize:     14,
                    fontWeight:   600,
                    color:        'var(--text-primary)',
                    overflow:     'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace:   'nowrap',
                  }}>
                    {sub.imageTitle}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    {!isAwardsOnly && sub.score !== null && (
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Score: {sub.score}
                        {tied && (
                          <span style={{
                            marginLeft: 6,
                            fontSize:   11,
                            color:      'var(--status-warning)',
                            fontWeight: 600,
                          }}>
                            TIE
                          </span>
                        )}
                      </span>
                    )}
                    {sub.memberName && (
                      <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                        {sub.memberName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Award selector */}
                <AwardSelector
                  awardTypes={awardTypes}
                  currentAwardId={currentAward}
                  assignedAwardIds={assignedAwardIds}
                  onChange={id => handleAwardChange(sub.id, id)}
                  theme={theme}
                />
              </div>
            )
          })}
        </div>

        {/* Show all toggle */}
        {!isAwardsOnly && !showAll && hidden > 0 && (
          <button
            onClick={() => setShowAll(true)}
            style={{
              marginTop:    16,
              background:   'none',
              border:       '1px solid var(--border-default)',
              borderRadius: 8,
              padding:      '8px 20px',
              fontSize:     14,
              color:        'var(--text-secondary)',
              cursor:       'pointer',
              width:        '100%',
            }}
          >
            Show all {submissions.length} entries ({hidden} more)
          </button>
        )}

        {/* Complete / Return buttons */}
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {!isSubmitted && (
            <button
              onClick={handleComplete}
              disabled={completing}
              style={{
                background:   completing ? 'var(--action-primary-hover)' : 'var(--action-primary)',
                color:        '#fff',
                border:       'none',
                borderRadius: 8,
                padding:      '10px 28px',
                fontSize:     14,
                fontWeight:   600,
                cursor:       completing ? 'wait' : 'pointer',
                opacity:      completing ? 0.8 : 1,
              }}
            >
              {alreadyComplete
                ? (completing ? 'Saving…' : 'Update and return to categories')
                : (completing ? 'Marking complete…' : 'Mark as reviewed — return to categories')}
            </button>
          )}
          <Link
            href={`/judge/${token}/landing`}
            style={{
              fontSize:       14,
              color:          'var(--text-secondary)',
              textDecoration: 'none',
            }}
          >
            Return to categories without marking complete
          </Link>
        </div>
      </div>

      {/* Fullscreen viewer */}
      {fullscreenIdx !== null && (
        <FullscreenViewer
          submissions={visible}
          initialIdx={fullscreenIdx}
          onClose={() => setFullscreenIdx(null)}
          awardTypes={awardTypes}
          awards={awards}
          assignedAwardIds={assignedAwardIds}
          onAwardChange={handleAwardChange}
          theme={theme}
          surfaceBg={surfaceBg}
          isAwardsOnly={isAwardsOnly}
        />
      )}
    </div>
  )
}

// ── Award selector dropdown ───────────────────────────────────────────────────

function AwardSelector({
  awardTypes,
  currentAwardId,
  assignedAwardIds,
  onChange,
  theme,
}: {
  awardTypes:      AwardTier[]
  currentAwardId:  string | null
  assignedAwardIds: string[]
  onChange:        (id: string | null) => void
  theme:           string
}) {
  if (awardTypes.length === 0) return null

  const inputBorder = theme === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'

  return (
    <select
      value={currentAwardId ?? ''}
      onChange={e => onChange(e.target.value || null)}
      style={{
        fontSize:     13,
        padding:      '6px 10px',
        borderRadius: 6,
        border:       `1px solid ${inputBorder}`,
        background:   'var(--surface-1)',
        color:        'var(--text-primary)',
        cursor:       'pointer',
        minWidth:     140,
        fontFamily:   'inherit',
      }}
    >
      <option value="">No award</option>
      {awardTypes.map(award => {
        const isAssignedElsewhere = assignedAwardIds.includes(award.id) && award.id !== currentAwardId
        return (
          <option
            key={award.id}
            value={award.id}
            disabled={isAssignedElsewhere}
          >
            {award.label}{isAssignedElsewhere ? ' (assigned)' : ''}
          </option>
        )
      })}
    </select>
  )
}

// ── Fullscreen viewer ─────────────────────────────────────────────────────────

function FullscreenViewer({
  submissions,
  initialIdx,
  onClose,
  awardTypes,
  awards,
  assignedAwardIds,
  onAwardChange,
  theme,
  surfaceBg,
  isAwardsOnly,
}: {
  submissions:      SubmissionForAwards[]
  initialIdx:       number
  onClose:          () => void
  awardTypes:       AwardTier[]
  awards:           Record<string, string | null>
  assignedAwardIds: string[]
  onAwardChange:    (id: string, awardId: string | null) => void
  theme:            string
  surfaceBg:        string
  isAwardsOnly:     boolean
}) {
  const [idx, setIdx] = useState(initialIdx)
  const sub           = submissions[idx]

  if (!sub) return null

  const bgColor = theme === 'dark' ? '#0A0A0A' : '#1A1A1A'

  return (
    <div
      style={{
        position:        'fixed',
        inset:           0,
        zIndex:          9999,
        backgroundColor: bgColor,
        display:         'flex',
        flexDirection:   'column',
      }}
    >
      {/* Top bar */}
      <div style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        padding:         '12px 20px',
        background:      'rgba(0,0,0,0.45)',
        flexShrink:      0,
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#E8E8E8' }}>
          {sub.imageTitle}
          {!isAwardsOnly && sub.score !== null && (
            <span style={{ marginLeft: 10, fontWeight: 400, color: '#9E9E9E' }}>
              Score: {sub.score}
            </span>
          )}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AwardSelector
            awardTypes={awardTypes}
            currentAwardId={awards[sub.id] ?? null}
            assignedAwardIds={assignedAwardIds}
            onChange={id => onAwardChange(sub.id, id)}
            theme="dark"
          />
          <button
            onClick={onClose}
            aria-label="Close fullscreen"
            style={{
              background:   'rgba(255,255,255,0.12)',
              border:       '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              width:        32,
              height:       32,
              color:        '#E8E8E8',
              cursor:       'pointer',
              fontSize:     18,
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Image */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sub.fullUrl}
          alt={sub.imageTitle}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />

        {/* Prev */}
        {idx > 0 && (
          <button
            onClick={() => setIdx(i => i - 1)}
            style={{
              position:     'absolute',
              left:         12,
              top:          '50%',
              transform:    'translateY(-50%)',
              background:   'rgba(0,0,0,0.5)',
              border:       '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              color:        '#E8E8E8',
              padding:      '8px 14px',
              cursor:       'pointer',
              fontSize:     18,
            }}
          >
            ‹
          </button>
        )}
        {/* Next */}
        {idx < submissions.length - 1 && (
          <button
            onClick={() => setIdx(i => i + 1)}
            style={{
              position:     'absolute',
              right:        12,
              top:          '50%',
              transform:    'translateY(-50%)',
              background:   'rgba(0,0,0,0.5)',
              border:       '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              color:        '#E8E8E8',
              padding:      '8px 14px',
              cursor:       'pointer',
              fontSize:     18,
            }}
          >
            ›
          </button>
        )}
      </div>

      {/* Bottom bar: position indicator */}
      <div style={{
        textAlign:  'center',
        padding:    '8px',
        color:      '#737373',
        fontSize:   13,
        flexShrink: 0,
      }}>
        {idx + 1} / {submissions.length}
      </div>
    </div>
  )
}

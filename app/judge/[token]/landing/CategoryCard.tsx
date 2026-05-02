'use client'

import Link from 'next/link'
import { useState } from 'react'
import StatusBadge, { type JudgeStatus } from './StatusBadge'

export default function CategoryCard({
  token,
  categoryId,
  name,
  total,
  scored,
  awardsEnabled,
  isAwardsOnly,
  awardsComplete,
  scoringComplete,
}: {
  token:           string
  categoryId:      string
  name:            string
  total:           number
  scored:          number
  awardsEnabled:   boolean
  isAwardsOnly:    boolean
  awardsComplete:  boolean
  scoringComplete: boolean
}) {
  const [hovered, setHovered] = useState(false)

  const scorePct  = !isAwardsOnly && total > 0 ? (scored / total) * 100 : 100
  const scoreDone = isAwardsOnly || (total > 0 && scored >= total)
  const isFullyDone = scoreDone && (!awardsEnabled || awardsComplete)
  const hasStarted  = scored > 0 || awardsComplete
  const pct = total > 0 ? Math.round((scored / total) * 100) : 0

  const status: JudgeStatus = isFullyDone
    ? 'complete'
    : hasStarted ? 'in-progress' : 'not-started'

  // Routing and CTA
  const href = scoringComplete
    ? awardsEnabled
      ? `/judge/${token}/judge/${categoryId}/awards`
      : `/judge/${token}/judge/${categoryId}`
    : `/judge/${token}/judge/${categoryId}`

  const ctaLabel = (() => {
    if (!scoringComplete)  return scored === 0 ? 'Start' : 'Continue'
    if (!awardsEnabled)    return 'Review'
    if (!awardsComplete)   return 'Assign awards'
    return 'Review'
  })()

  const isComplete = status === 'complete'

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <section
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderRadius: 12,
          border:       `1px solid ${isComplete ? 'var(--status-success)' : 'var(--border-default)'}`,
          background:   'var(--surface-2)',
          padding:      '16px 20px',
          cursor:       'pointer',
          transition:   'box-shadow 0.15s',
          boxShadow:    hovered ? '0 2px 12px rgba(0,0,0,0.12)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Left: name + status + progress */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <h3 style={{
                fontFamily:    'var(--font-heading)',
                fontSize:      17,
                fontWeight:    600,
                letterSpacing: '-0.01em',
                color:         'var(--text-primary)',
                margin:        0,
                overflow:      'hidden',
                textOverflow:  'ellipsis',
                whiteSpace:    'nowrap',
              }}>
                {name}
              </h3>
              <StatusBadge status={status} />
            </div>

            {/* Scoring progress — hidden for awards-only */}
            {!isAwardsOnly && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  role="progressbar"
                  aria-valuenow={scored}
                  aria-valuemin={0}
                  aria-valuemax={total}
                  style={{
                    flex:         1,
                    height:       8,
                    borderRadius: 9999,
                    background:   'var(--surface-1)',
                    overflow:     'hidden',
                  }}
                >
                  <div style={{
                    height:     '100%',
                    width:      `${scorePct}%`,
                    background: scoreDone ? 'var(--status-success)' : 'var(--action-primary)',
                    borderRadius: 9999,
                    transition: 'width 0.5s ease-out',
                  }} />
                </div>
                <span style={{
                  flexShrink:  0,
                  fontSize:    12,
                  color:       'var(--text-secondary)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {scored}/{total} · {pct}%
                </span>
              </div>
            )}

            {/* Awards progress row */}
            {awardsEnabled && (
              <div style={{ marginTop: 6, opacity: scoringComplete ? 1 : 0.45 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 9999, background: 'var(--surface-1)', overflow: 'hidden' }}>
                    <div style={{
                      height:     '100%',
                      width:      awardsComplete ? '100%' : '0%',
                      background: 'var(--spot-gold)',
                      borderRadius: 9999,
                      transition: 'width 0.5s ease-out',
                    }} />
                  </div>
                  <span style={{ flexShrink: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {awardsComplete ? 'Awards done' : scoringComplete ? 'Awards ready' : 'Awards locked'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: CTA button */}
          <button style={{
            flexShrink:   0,
            fontSize:     13,
            fontWeight:   500,
            padding:      '7px 16px',
            borderRadius: 8,
            border:       isComplete ? '1px solid var(--border-default)' : 'none',
            background:   isComplete ? 'transparent' : 'var(--action-primary)',
            color:        isComplete ? 'var(--text-secondary)' : '#fff',
            cursor:       'pointer',
            whiteSpace:   'nowrap',
            transition:   'opacity 0.15s',
          }}>
            {ctaLabel} →
          </button>
        </div>
      </section>
    </Link>
  )
}

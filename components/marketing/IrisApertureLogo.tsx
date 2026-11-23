'use client'

import { useState, useEffect, useRef } from 'react'

const BLADE_COLORS = ['#E8B14A', '#E26A3E', '#C9436F', '#7A4DAA', '#3F7FB8', '#3FA889']

export function IrisApertureLogo({
  size = 420,
  ink = '#161412',
  accent = '#E8B14A',
}: {
  size?:   number
  ink?:    string
  accent?: string
}) {
  const [now, setNow]     = useState(0)
  const rafRef            = useRef<number>(0)
  const startRef          = useRef<number>(0)
  const reducedMotion     = useRef(false)

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion.current) return

    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      setNow((ts - startRef.current) / 1000)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const R = 92

  // Steady rotation — the whole iris spins at a constant pace
  const rot = (now * 14) % 360

  // Aperture cycle: smooth open → close → open on a 5-second period
  // openness: 0 = fully open, 1 = fully closed
  const openness = 0.5 - 0.5 * Math.cos((now * Math.PI * 2) / 5)

  // Inner radius shrinks as the iris closes
  const inner = 8 + (44 - 8) * (1 - openness)

  // Blade twist: inner corners rotate relative to outer corners as aperture closes.
  // This creates the "blades sliding over each other" shutter effect.
  const bladeTwist = 26 * openness

  const blades = Array.from({ length: 6 }, (_, i) => {
    const oa1 = (i * 60)       * Math.PI / 180
    const oa2 = ((i + 1) * 60) * Math.PI / 180
    // Inner corners are rotated forward by bladeTwist, creating the angled blade shape
    const ia1 = (i * 60       + bladeTwist) * Math.PI / 180
    const ia2 = ((i + 1) * 60 + bladeTwist) * Math.PI / 180

    const ox1 = R * Math.cos(oa1), oy1 = R * Math.sin(oa1)
    const ox2 = R * Math.cos(oa2), oy2 = R * Math.sin(oa2)
    const ix1 = inner * Math.cos(ia1), iy1 = inner * Math.sin(ia1)
    const ix2 = inner * Math.cos(ia2), iy2 = inner * Math.sin(ia2)

    return (
      <polygon
        key={i}
        points={`${ox1},${oy1} ${ox2},${oy2} ${ix2},${iy2} ${ix1},${iy1}`}
        fill={BLADE_COLORS[i]}
        stroke={ink}
        strokeWidth="5"
        strokeLinejoin="round"
      />
    )
  })

  // Central aperture opening — a polygon formed by the inner blade corners
  const apertureHex = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 + bladeTwist) * Math.PI / 180
    return `${inner * Math.cos(a)},${inner * Math.sin(a)}`
  }).join(' ')

  return (
    <svg
      width={size}
      height={size}
      viewBox="-110 -110 220 220"
      style={{ overflow: 'visible', display: 'block' }}
    >
      <g transform={`rotate(${rot})`}>
        {blades}
        <polygon
          points={apertureHex}
          fill={accent}
          stroke={ink}
          strokeWidth="6"
          strokeLinejoin="round"
        />
      </g>
      {/* fixed outer ring */}
      <circle cx="0" cy="0" r="95" fill="none" stroke={ink} strokeWidth="6" />
    </svg>
  )
}

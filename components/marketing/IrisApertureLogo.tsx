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

  const R     = 92
  const pulse = 0.5 - 0.5 * Math.cos((now * Math.PI) / 3.2)
  const inner = 16 + (40 - 16) * pulse
  const rot   = (now * 6) % 360

  const blades = Array.from({ length: 6 }, (_, i) => {
    const a     = (i * 60 * Math.PI) / 180
    const aNext = ((i + 1) * 60 * Math.PI) / 180
    const ox  = R * Math.cos(a),      oy  = R * Math.sin(a)
    const ox2 = R * Math.cos(aNext),  oy2 = R * Math.sin(aNext)
    const ix1 = inner * Math.cos(a),  iy1 = inner * Math.sin(a)
    const ix2 = inner * Math.cos(aNext), iy2 = inner * Math.sin(aNext)
    return (
      <polygon
        key={i}
        points={`${ox},${oy} ${ox2},${oy2} ${ix2},${iy2} ${ix1},${iy1}`}
        fill={BLADE_COLORS[i]}
        stroke={ink}
        strokeWidth="5"
        strokeLinejoin="round"
      />
    )
  })

  const hexPts = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 * Math.PI) / 180
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
          points={hexPts}
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

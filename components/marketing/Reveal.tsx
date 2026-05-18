'use client'

import { useRef, useEffect, ReactNode } from 'react'

export function Reveal({
  children,
  delay = 0,
  className = '',
  style,
}: {
  children:   ReactNode
  delay?:     number
  className?: string
  style?:     React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) { el.classList.add('in'); return }
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setTimeout(() => el.classList.add('in'), delay)
            io.disconnect()
          }
        })
      },
      { threshold: 0.12 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={`mkt-reveal ${className}`} style={style}>
      {children}
    </div>
  )
}

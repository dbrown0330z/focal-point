'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

type Slide = {
  src:   string
  title: string
  maker: string
}

const SLIDES: Slide[] = [
  { src: '/hero/image-1.jpg', title: 'Ritual Motion',         maker: 'Marcus Okafor'   },
  { src: '/hero/image-2.jpg', title: 'Platform No. 7',        maker: 'Elena Vasquez'   },
  { src: '/hero/image-3.jpg', title: 'San Polo Morning',      maker: 'James Whitfield' },
  { src: '/hero/image-4.jpg', title: 'First Light, December', maker: 'Sarah Chen'      },
  { src: '/hero/image-5.jpg', title: 'Baltic Dusk',           maker: 'Tomás Reinholt'  },
  { src: '/hero/image-6.jpg', title: 'Quiet Shore',           maker: 'Priya Nambiar'   },
  { src: '/hero/image-7.jpg', title: 'After the Rain',        maker: 'Daniel Ferreira' },
]

const INTERVAL_MS = 6000

export default function HeroSlideshow({ clubName }: { clubName: string }) {
  const [current, setCurrent] = useState(0)
  const [prev,    setPrev]    = useState<number | null>(null)
  const [fading,  setFading]  = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(c => {
        const next = (c + 1) % SLIDES.length
        setPrev(c)
        setFading(true)
        return next
      })
    }, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  // Clear the outgoing slide after fade completes
  useEffect(() => {
    if (!fading) return
    const t = setTimeout(() => { setPrev(null); setFading(false) }, 800)
    return () => clearTimeout(t)
  }, [fading])

  const slide = SLIDES[current]

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '21/8', minHeight: 260, maxHeight: 520 }}>

      {/* Outgoing slide — fades out */}
      {prev !== null && (
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: fading ? 0 : 1 }}
        >
          <Image
            src={SLIDES[prev].src}
            alt={SLIDES[prev].title}
            fill
            className="object-cover"
            priority={false}
            sizes="100vw"
          />
        </div>
      )}

      {/* Current slide — always visible */}
      <div className="absolute inset-0">
        <Image
          src={slide.src}
          alt={slide.title}
          fill
          className="object-cover"
          priority={current === 0}
          sizes="100vw"
        />
      </div>

      {/* Gradient overlays — top-left darkened for text legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.10) 45%, transparent 65%)',
            'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 40%)',
          ].join(', '),
        }}
      />

      {/* Top-left: club welcome */}
      <div className="absolute top-0 left-0 p-5 sm:p-7">
        <p
          style={{
            fontFamily:   'var(--font-lora, Georgia, serif)',
            fontSize:     18,
            lineHeight:   1.4,
            color:        '#ffffff',
            textShadow:   '0 1px 4px rgba(0,0,0,0.5)',
            whiteSpace:   'pre-line',
          }}
        >
          {`Welcome to\n${clubName}`}
        </p>
      </div>

      {/* Bottom-right: image credit */}
      <div className="absolute bottom-0 right-0 p-4 sm:p-5 text-right">
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.92)', textShadow: '0 1px 3px rgba(0,0,0,0.6)', lineHeight: 1.4 }}>
          <span style={{ fontWeight: 600 }}>{slide.title}</span>
          <br />
          <span style={{ fontWeight: 400 }}>{slide.maker}</span>
        </p>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setPrev(current); setCurrent(i); setFading(true) }}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width:        i === current ? 20 : 6,
              height:       6,
              borderRadius: 3,
              background:   i === current ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
              border:       'none',
              cursor:       'pointer',
              transition:   'width 0.3s ease, background 0.3s ease',
              padding:      0,
            }}
          />
        ))}
      </div>
    </div>
  )
}

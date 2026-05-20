'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

type Slide = {
  src:     string
  title:   string
  maker:   string
  camera?: string
  lens?:   string
}

const SLIDES: Slide[] = [
  { src: '/hero/image-1.jpg', title: 'Ritual Motion',         maker: 'Marcus Okafor',   camera: 'Sony A7 IV',        lens: 'FE 35mm f/1.8'         },
  { src: '/hero/image-2.jpg', title: 'Platform No. 7',        maker: 'Elena Vasquez',   camera: 'Fujifilm X-T5',     lens: 'XF 23mm f/2 R WR'      },
  { src: '/hero/image-3.jpg', title: 'San Polo Morning',      maker: 'James Whitfield', camera: 'Nikon Z8',          lens: 'Nikkor Z 24-70mm f/4 S' },
  { src: '/hero/image-4.jpg', title: 'First Light, December', maker: 'Sarah Chen',      camera: 'Canon EOS R5',      lens: 'RF 50mm f/1.2L USM'    },
  { src: '/hero/image-5.jpg', title: 'Baltic Dusk',           maker: 'Tomás Reinholt',  camera: 'Leica M11',         lens: 'Summicron-M 28mm f/2'  },
  { src: '/hero/image-6.jpg', title: 'Quiet Shore',           maker: 'Priya Nambiar',   camera: 'OM System OM-1',    lens: 'M.Zuiko 12-40mm f/2.8' },
  { src: '/hero/image-7.jpg', title: 'After the Rain',        maker: 'Daniel Ferreira', camera: 'Panasonic S5 II',   lens: 'Lumix S 85mm f/1.8'    },
  { src: '/hero/image-8.jpg', title: 'Still Water',           maker: 'Aoife Brennan',   camera: 'Sony A7R V',        lens: 'FE 24mm f/1.4 GM'      },
]

const INTERVAL_MS      = 7000  // time between advances
const FADE_MS          = 1100  // cross-fade duration
const CREDITS_DELAY_MS = 200   // wait after image settles before credits appear
const CREDITS_FADE_MS  = 700   // credits fade-in duration

// ─── Slide layer ──────────────────────────────────────────────────────────────

function SlideLayer({
  slide,
  priority = false,
  creditsVisible,
}: {
  slide:         Slide
  priority?:     boolean
  creditsVisible: boolean
}) {
  return (
    <>
      {/* Blurred fill — covers letterbox gaps */}
      <Image
        src={slide.src}
        alt=""
        aria-hidden
        fill
        className="object-cover"
        priority={priority}
        sizes="(max-width: 1152px) 100vw, 1152px"
        style={{ filter: 'blur(18px) brightness(0.55)', transform: 'scale(1.08)' }}
      />
      {/* Sharp image — never cropped */}
      <Image
        src={slide.src}
        alt={slide.title}
        fill
        className="object-contain"
        priority={priority}
        sizes="(max-width: 1152px) 100vw, 1152px"
      />
      {/* Gradient for credit legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.60) 0%, transparent 50%)' }}
      />

      {/* ── Credits — second animation, fades in after image settles ── */}
      <div
        className="absolute bottom-0 right-0 p-4 sm:p-5 text-right"
        style={{
          textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.75)',
          opacity:    creditsVisible ? 1 : 0,
          transform:  creditsVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: creditsVisible
            ? `opacity ${CREDITS_FADE_MS}ms ease, transform ${CREDITS_FADE_MS}ms ease`
            : 'none',
        }}
      >
        <p style={{ fontFamily: 'var(--font-lora, Georgia, serif)', fontSize: 18, fontWeight: 400, color: 'rgba(255,255,255,0.97)', lineHeight: 1.3 }}>
          {slide.title}
        </p>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.90)', marginTop: 3, lineHeight: 1.4 }}>
          {slide.maker}
        </p>
        {slide.camera && (
          <p style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.60)', marginTop: 2, lineHeight: 1.4 }}>
            {slide.camera}
          </p>
        )}
        {slide.lens && (
          <p style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.60)', lineHeight: 1.4 }}>
            {slide.lens}
          </p>
        )}
      </div>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

// clubName prop kept for API compatibility
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function HeroSlideshow({ clubName }: { clubName: string }) {
  const [activeIdx,      setActiveIdx]      = useState<number | null>(null)
  const [incomingIdx,    setIncomingIdx]    = useState<number | null>(null)
  const [isFading,       setIsFading]       = useState(false)
  const [creditsVisible, setCreditsVisible] = useState(false)
  const activeIdxRef = useRef(0)

  // Pick random start slide on mount (avoids SSR hydration mismatch)
  useEffect(() => {
    const initial = Math.floor(Math.random() * SLIDES.length)
    activeIdxRef.current = initial
    setActiveIdx(initial)
  }, [])

  // Fade credits in after each slide settles (including the first)
  useEffect(() => {
    if (activeIdx === null) return
    setCreditsVisible(false)
    const t = setTimeout(() => setCreditsVisible(true), CREDITS_DELAY_MS)
    return () => clearTimeout(t)
  }, [activeIdx])

  // Preload the next slide's image so it's ready when the crossfade starts
  useEffect(() => {
    if (activeIdx === null) return
    const nextIdx = (activeIdx + 1) % SLIDES.length
    const img = new window.Image()
    img.src = SLIDES[nextIdx].src
  }, [activeIdx])

  // Auto-advance timer — re-arms each time activeIdx is set
  useEffect(() => {
    if (activeIdx === null) return
    const timer = setInterval(() => {
      const next = (activeIdxRef.current + 1) % SLIDES.length
      setIncomingIdx(next)
      setCreditsVisible(false)

      // Two rAFs ensure incoming starts at opacity 0 before transition begins
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setIsFading(true))
      )

      // After cross-fade completes, promote incoming → active
      setTimeout(() => {
        activeIdxRef.current = next
        setActiveIdx(next)
        setIncomingIdx(null)
        setIsFading(false)
      }, FADE_MS)
    }, INTERVAL_MS)

    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx])

  const activeSlide   = activeIdx   !== null ? SLIDES[activeIdx]   : null
  const incomingSlide = incomingIdx !== null ? SLIDES[incomingIdx] : null

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg"
      style={{ aspectRatio: '21/8', minHeight: 220, maxHeight: 480 }}
    >
      {/* Placeholder while JS hydrates */}
      {!activeSlide && (
        <div className="absolute inset-0" style={{ background: 'var(--surface-1)' }} />
      )}

      {/* Active (outgoing) slide — fades to 0 during transition */}
      {activeSlide && (
        <div
          className="absolute inset-0"
          style={{
            opacity:    isFading ? 0 : 1,
            transition: isFading ? `opacity ${FADE_MS}ms ease-in-out` : 'none',
          }}
        >
          <SlideLayer slide={activeSlide} priority creditsVisible={creditsVisible} />
        </div>
      )}

      {/* Incoming slide — cross-fades in with a subtle drift from right */}
      {incomingSlide && (
        <div
          className="absolute inset-0"
          style={{
            opacity:    isFading ? 1 : 0,
            transform:  isFading ? 'translateX(0)' : 'translateX(28px)',
            transition: isFading
              ? `opacity ${FADE_MS}ms ease-in-out, transform ${FADE_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
              : 'none',
          }}
        >
          {/* Credits always hidden on incoming — they fade in only after it becomes active */}
          <SlideLayer slide={incomingSlide} creditsVisible={false} />
        </div>
      )}
    </div>
  )
}

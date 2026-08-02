'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export type Slide = {
  src:     string
  title:   string
  maker:   string
  camera?: string
  lens?:   string
}

const SLIDES: Slide[] = [
  { src: '/hero/image-1.jpg', title: 'Ritual Motion',         maker: 'Marcus Okafor',   camera: 'Sony A7 IV',        lens: 'FE 35mm f/1.8'              },
  { src: '/hero/image-2.jpg', title: 'Sparrows, Rush Hour',    maker: 'Ingrid Larsen',   camera: 'Nikon Z6 III',      lens: 'Nikkor Z 24mm f/1.8 S'      },
  { src: '/hero/image-3.jpg', title: 'San Polo, Venice',      maker: 'James Whitfield', camera: 'Nikon Z8',          lens: 'Nikkor Z 24-70mm f/4 S'     },
  { src: '/hero/image-4.jpg', title: 'First Light, December', maker: 'Sarah Chen',      camera: 'Canon EOS R5',      lens: 'RF 50mm f/1.2L USM'         },
  { src: '/hero/image-5.jpg', title: 'Platform No. 7',        maker: 'Yuki Tanaka',     camera: 'Sony A7R V',        lens: 'FE 200-600mm f/5.6-6.3 G'   },
  { src: '/hero/image-6.jpg', title: 'Quiet Shore',           maker: 'Priya Nambiar',   camera: 'OM System OM-1',    lens: 'M.Zuiko 12-40mm f/2.8'      },
  { src: '/hero/image-7.jpg', title: 'After the Rain',        maker: 'Daniel Ferreira', camera: 'Panasonic S5 II',   lens: 'Lumix S 85mm f/1.8'         },
  { src: '/hero/image-8.jpg', title: 'Green Eyes',             maker: 'Aoife Brennan',   camera: 'Olympus OM-D E-M1', lens: 'M.Zuiko 60mm f/2.8 Macro'   },
]

const INTERVAL_MS      = 7000  // time between advances
const FADE_MS          = 1100  // cross-fade duration
const CREDITS_DELAY_MS = 200   // wait after image settles before credits appear
const CREDITS_FADE_MS  = 700   // credits fade-in duration
const MAX_LOAD_WAIT_MS = 3000  // start fade even if image hasn't loaded yet

// ─── Slide layer ──────────────────────────────────────────────────────────────

function SlideLayer({
  slide,
  priority = false,
  creditsVisible,
  onSharpLoad,
}: {
  slide:          Slide
  priority?:      boolean
  creditsVisible: boolean
  onSharpLoad?:   () => void
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
        onLoad={onSharpLoad}
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
export default function HeroSlideshow({ clubName, slides: propSlides }: { clubName: string; slides?: Slide[] }) {
  const activeSlides = (propSlides && propSlides.length > 0) ? propSlides : SLIDES
  const [activeIdx,      setActiveIdx]      = useState(0)
  const [incomingIdx,    setIncomingIdx]    = useState<number | null>(null)
  const [isFading,       setIsFading]       = useState(false)
  const [creditsVisible, setCreditsVisible] = useState(false)

  const activeIdxRef    = useRef(0)
  // Guard so onLoad and the fallback timeout don't both kick off a fade
  const fadeStartedRef  = useRef(false)
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fade credits in after each slide settles (including the first)
  useEffect(() => {
    setCreditsVisible(false)
    const t = setTimeout(() => setCreditsVisible(true), CREDITS_DELAY_MS)
    return () => clearTimeout(t)
  }, [activeIdx])

  // Preload the next two slides so they're warm in cache
  useEffect(() => {
    for (let i = 1; i <= 2; i++) {
      const idx = (activeIdx + i) % activeSlides.length
      const img = new window.Image()
      img.src = activeSlides[idx].src
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx])

  // Execute the crossfade for `next`. Called by either onSharpLoad or
  // the fallback timeout — the guard ensures it only runs once per advance.
  const startFade = useCallback((next: number) => {
    if (fadeStartedRef.current) return
    fadeStartedRef.current = true

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }

    // Two rAFs ensure incoming renders at opacity 0 before the transition begins
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setIsFading(true))
    )

    setTimeout(() => {
      activeIdxRef.current = next
      setActiveIdx(next)
      setIncomingIdx(null)
      setIsFading(false)
    }, FADE_MS)
  }, [])

  // Auto-advance timer — mounts the incoming slide and waits for it to load
  useEffect(() => {
    const timer = setInterval(() => {
      const next = (activeIdxRef.current + 1) % activeSlides.length

      // Reset fade guard for this advance cycle
      fadeStartedRef.current = false

      setIncomingIdx(next)
      setCreditsVisible(false)

      // Safety fallback: if the image hasn't fired onLoad within MAX_LOAD_WAIT_MS,
      // start the fade anyway so the slideshow never stalls
      fallbackTimerRef.current = setTimeout(() => startFade(next), MAX_LOAD_WAIT_MS)
    }, INTERVAL_MS)

    return () => {
      clearInterval(timer)
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx, startFade])

  const activeSlide   = activeSlides[activeIdx]
  const incomingSlide = incomingIdx !== null ? activeSlides[incomingIdx] : null

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg"
      style={{ aspectRatio: '21/8', minHeight: 220, maxHeight: 480 }}
    >
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

      {/* Incoming slide — rendered at opacity 0, fades in only once its image
          has loaded (onSharpLoad → startFade). Drift from right on entry. */}
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
          <SlideLayer
            slide={incomingSlide}
            creditsVisible={false}
            onSharpLoad={() => startFade(incomingIdx!)}
          />
        </div>
      )}
    </div>
  )
}

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
]

const INTERVAL_MS   = 5000
const TRANSITION_MS = 750  // duration of the slide-in animation

function SlideLayer({ slide, priority = false }: { slide: Slide; priority?: boolean }) {
  return (
    <>
      {/* Blurred fill — covers any letterbox gaps for non-landscape images */}
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
      {/* Sharp image — object-contain so nothing is cropped */}
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
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 45%)' }}
      />
      {/* Credit */}
      <div
        className="absolute bottom-0 right-0 p-4 sm:p-5 text-right"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.75), 0 4px 24px rgba(0,0,0,0.55)' }}
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

// clubName prop kept for API compatibility
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function HeroSlideshow({ clubName }: { clubName: string }) {
  const [activeIdx,    setActiveIdx]    = useState<number | null>(null)
  const [incomingIdx,  setIncomingIdx]  = useState<number | null>(null)
  const [isSliding,    setIsSliding]    = useState(false)
  const activeIdxRef = useRef<number>(0)

  // Pick a random starting slide on mount (avoids SSR hydration mismatch)
  useEffect(() => {
    const initial = Math.floor(Math.random() * SLIDES.length)
    activeIdxRef.current = initial
    setActiveIdx(initial)
  }, [])

  // Auto-advance every INTERVAL_MS
  useEffect(() => {
    if (activeIdx === null) return

    const timer = setInterval(() => {
      const next = (activeIdxRef.current + 1) % SLIDES.length
      setIncomingIdx(next)
      // Two rAF passes ensure the browser paints translateX(100%) before
      // we flip isSliding → true and trigger the CSS transition.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setIsSliding(true))
      )
    }, INTERVAL_MS)

    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx])   // re-arm after first slide is set

  function handleTransitionEnd() {
    if (incomingIdx === null) return
    activeIdxRef.current = incomingIdx
    setActiveIdx(incomingIdx)
    setIncomingIdx(null)
    setIsSliding(false)
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg"
      style={{ aspectRatio: '21/8', minHeight: 220, maxHeight: 480 }}
    >
      {/* Placeholder while JS hydrates */}
      {activeIdx === null && (
        <div className="absolute inset-0" style={{ background: 'var(--surface-1)' }} />
      )}

      {/* Active (current) slide */}
      {activeIdx !== null && (
        <div className="absolute inset-0">
          <SlideLayer slide={SLIDES[activeIdx]} priority />
        </div>
      )}

      {/* Incoming slide — slides in from the right with ease-out */}
      {incomingIdx !== null && (
        <div
          className="absolute inset-0"
          style={{
            transform:  isSliding ? 'translateX(0)' : 'translateX(100%)',
            transition: isSliding
              ? `transform ${TRANSITION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`
              : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          <SlideLayer slide={SLIDES[incomingIdx]} />
        </div>
      )}
    </div>
  )
}

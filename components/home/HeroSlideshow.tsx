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

export default function HeroSlideshow({ clubName }: { clubName: string }) {
  // Pick a random image client-side to avoid hydration mismatch
  const [slide, setSlide] = useState<Slide | null>(null)

  useEffect(() => {
    setSlide(SLIDES[Math.floor(Math.random() * SLIDES.length)])
  }, [])

  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: '21/8', minHeight: 220, maxHeight: 480 }}>

        {slide ? (
          <>
            <Image
              src={slide.src}
              alt={slide.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1152px) 100vw, 1152px"
            />

            {/* Gradient overlays */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: [
                  'linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.10) 45%, transparent 65%)',
                  'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 40%)',
                ].join(', '),
              }}
            />

            {/* Top-left: welcome text */}
            <div className="absolute top-0 left-0 p-5 sm:p-7">
              <p style={{
                fontFamily: 'var(--font-lora, Georgia, serif)',
                fontSize:   18,
                lineHeight: 1.4,
                color:      '#ffffff',
                textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                whiteSpace: 'pre-line',
              }}>
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
          </>
        ) : (
          // Placeholder while client hydrates
          <div className="absolute inset-0" style={{ background: 'var(--surface-1)' }} />
        )}
      </div>
    </div>
  )
}

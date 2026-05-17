'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

type Slide = {
  src:    string
  title:  string
  maker:  string
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

// clubName prop kept for API compatibility
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function HeroSlideshow({ clubName }: { clubName: string }) {
  // Pick a random image client-side to avoid hydration mismatch
  const [slide, setSlide] = useState<Slide | null>(null)

  useEffect(() => {
    setSlide(SLIDES[Math.floor(Math.random() * SLIDES.length)])
  }, [])

  return (
    <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: '21/8', minHeight: 220, maxHeight: 480 }}>
      {slide ? (
        <>
          {/* Layer 1 — blurred fill: same image scaled to cover, blurred + darkened.
              Fills the gutters for non-landscape proportions (squares, portraits, banners). */}
          <Image
            src={slide.src}
            alt=""
            aria-hidden="true"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1152px) 100vw, 1152px"
            style={{ filter: 'blur(18px) brightness(0.55)', transform: 'scale(1.08)' }}
          />

          {/* Layer 2 — sharp image: object-contain so no cropping ever occurs */}
          <Image
            src={slide.src}
            alt={slide.title}
            fill
            className="object-contain"
            priority
            sizes="(max-width: 1152px) 100vw, 1152px"
          />

          {/* Layer 3 — gradient overlay for credit legibility */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 45%)',
            }}
          />

          {/* Layer 4 — image credit */}
          <div className="absolute bottom-0 right-0 p-4 sm:p-5 text-right" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.75), 0 4px 24px rgba(0,0,0,0.55)' }}>
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
      ) : (
        // Placeholder while client hydrates
        <div className="absolute inset-0" style={{ background: 'var(--surface-1)' }} />
      )}
    </div>
  )
}

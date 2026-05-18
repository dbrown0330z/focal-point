import type { ReactNode } from 'react'
import { Instrument_Serif, DM_Sans, DM_Mono, Space_Grotesk } from 'next/font/google'
import { Nav } from '@/components/marketing/Nav'
import { Footer } from '@/components/marketing/Footer'
import './marketing.css'

const instrumentSerif = Instrument_Serif({
  subsets:  ['latin'],
  weight:   ['400'],
  style:    ['normal', 'italic'],
  variable: '--font-instrument-serif',
})
const dmSans = DM_Sans({
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
})
const dmMono = DM_Mono({
  subsets:  ['latin'],
  weight:   ['400', '500'],
  variable: '--font-dm-mono',
})
const spaceGrotesk = Space_Grotesk({
  subsets:  ['latin'],
  weight:   ['500', '600', '700'],
  variable: '--font-space-grotesk',
})

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`marketing-root ${instrumentSerif.variable} ${dmSans.variable} ${dmMono.variable} ${spaceGrotesk.variable}`}
    >
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  )
}

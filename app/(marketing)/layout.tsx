import type { ReactNode } from 'react'
import { Bitter, DM_Sans, DM_Mono, Space_Grotesk } from 'next/font/google'
import { Nav } from '@/components/marketing/Nav'
import { Footer } from '@/components/marketing/Footer'
import './marketing.css'

const bitter = Bitter({
  subsets:  ['latin'],
  style:    ['normal', 'italic'],
  variable: '--font-bitter',
  display:  'swap',
})
const dmSans = DM_Sans({
  subsets:  ['latin'],
  variable: '--font-dm-sans',
  display:  'swap',
})
const dmMono = DM_Mono({
  subsets:  ['latin'],
  variable: '--font-dm-mono',
  display:  'swap',
})
const spaceGrotesk = Space_Grotesk({
  subsets:  ['latin'],
  variable: '--font-space-grotesk',
  display:  'swap',
})

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`marketing-root ${bitter.variable} ${dmSans.variable} ${dmMono.variable} ${spaceGrotesk.variable}`}
    >
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  )
}

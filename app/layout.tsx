import type { Metadata } from 'next'
import { Lora, Nunito, Literata } from 'next/font/google'
import ThemeProvider from '@/components/layout/ThemeProvider'
import { Providers } from '@/src/app/providers'
import './globals.css'

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
})

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-nunito',
})

const literata = Literata({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-literata',
})

export const metadata: Metadata = {
  title: 'Focal Point',
  description: 'Your camera club, online.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full dark ${lora.variable} ${nunito.variable} ${literata.variable}`}>
      <body className="min-h-full antialiased">
        <ThemeProvider>
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}

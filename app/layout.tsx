import type { Metadata } from 'next'
import { Lora, Nunito, Roboto_Mono, Inter } from 'next/font/google'
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

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto-mono',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Focal Point',
  description: 'Your camera club, online.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full dark ${lora.variable} ${nunito.variable} ${robotoMono.variable} ${inter.variable}`}>
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

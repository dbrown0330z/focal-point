import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getClubContext } from '@/lib/club-context'

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/favicon-club.ico', sizes: 'any' },
      { url: '/favicon-club.png', type: 'image/png' },
    ],
    apple: '/apple-touch-icon-club.png',
  },
}

/**
 * Root layout for all club-scoped routes.
 *
 * The middleware resolves the club slug, injects x-club-* headers, and handles
 * auth protection before this layout runs. We just confirm the club was resolved
 * (i.e. the slug is valid) and pass through to child layouts.
 */
export default async function ClubSlugLayout({
  children,
}: {
  children: ReactNode
  params: Promise<{ clubSlug: string }>
}) {
  const ctx = await getClubContext()
  if (!ctx) notFound()

  return <>{children}</>
}

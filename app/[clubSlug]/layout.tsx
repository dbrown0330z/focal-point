import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { getClubContext } from '@/lib/club-context'

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

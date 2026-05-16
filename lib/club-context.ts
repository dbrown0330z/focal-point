/**
 * Club context utilities — server-side only.
 *
 * The middleware resolves the club slug from the request path and injects
 * three request headers that every server component and server action can read:
 *
 *   x-club-id    — the club's UUID
 *   x-club-slug  — the URL slug  (e.g. "portland-camera-club")
 *   x-club-name  — the club's display name
 *
 * Usage in a server component or server action:
 *
 *   import { getClubContext } from '@/lib/club-context'
 *   const { clubId, clubSlug, clubName } = await getClubContext()
 *
 * Usage when club_id is required and absence is a hard error:
 *
 *   const clubId = await requireClubId()
 */

import { headers } from 'next/headers'

export type ClubContext = {
  clubId:   string
  clubSlug: string
  clubName: string
}

/**
 * Returns the club context from request headers, or null if not in a club route.
 * Safe to call from any server component.
 */
export async function getClubContext(): Promise<ClubContext | null> {
  const h = await headers()
  const clubId   = h.get('x-club-id')
  const clubSlug = h.get('x-club-slug')
  const clubName = h.get('x-club-name')

  if (!clubId || !clubSlug) return null

  return { clubId, clubSlug, clubName: clubName ?? '' }
}

/**
 * Returns the club_id, throwing if not in a club route.
 * Use in server actions and pages that should never be accessed outside
 * a club context.
 */
export async function requireClubId(): Promise<string> {
  const ctx = await getClubContext()
  if (!ctx) throw new Error('No club context — request is outside a club route')
  return ctx.clubId
}

/**
 * Returns the club slug, throwing if not in a club route.
 */
export async function requireClubSlug(): Promise<string> {
  const ctx = await getClubContext()
  if (!ctx) throw new Error('No club context — request is outside a club route')
  return ctx.clubSlug
}

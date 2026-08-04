'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId } from '@/lib/club-context'
import type { ContentBlock } from '@/lib/homepage/types'
import type { Json } from '@/types/database'

function countNotes(blocks: ContentBlock[]): number {
  return blocks.reduce((n, b) => n + (b.customContentSettings?.notes?.length ?? 0), 0)
}

function countAffiliations(blocks: ContentBlock[]): number {
  return blocks.reduce((n, b) => n + (b.affiliationsSettings?.affiliations?.length ?? 0), 0)
}

export type SaveDebug = {
  clubId: string
  sentBlocks: number
  sentEnabled: number
  sentNotes: number
  sentAffiliations: number
  savedBlocks: number | null
  savedEnabled: number | null
  savedNotes: number | null
  savedAffiliations: number | null
}

export type SettingsDebug = {
  readClubId: string
  rows: { clubId: string | null; enabledCount: number | null }[]
}

export async function getSettingsDebug(): Promise<SettingsDebug> {
  const supabase = createServiceClient()
  let readClubId = '(no-cookie)'
  try { readClubId = await requireClubId() } catch {}

  const { data } = await supabase.from('club_settings').select('club_id, homepage_blocks')
  const rows = ((data ?? []) as { club_id: string | null; homepage_blocks: unknown }[]).map(r => ({
    clubId:       r.club_id ?? null,
    enabledCount: Array.isArray(r.homepage_blocks)
      ? (r.homepage_blocks as ContentBlock[]).filter(b => b.enabled).length
      : null,
  }))
  return { readClubId, rows }
}

/**
 * Persist the homepage block layout to club_settings.
 * "Publish" also revalidates the member home page.
 */
export async function saveHomepageBlocks(
  blocks:    ContentBlock[],
  publish:   boolean = false,
  clubSlug?: string,
): Promise<{ error?: string; debug?: SaveDebug }> {
  const supabase = createServiceClient()

  let clubId: string
  try {
    clubId = await requireClubId()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No club context' }
  }

  const sentBlocks       = blocks.length
  const sentEnabled      = blocks.filter(b => b.enabled).length
  const sentNotes        = countNotes(blocks)
  const sentAffiliations = countAffiliations(blocks)

  const { error } = await supabase
    .from('club_settings')
    .upsert(
      { club_id: clubId, homepage_blocks: blocks as unknown as Json },
      { onConflict: 'club_id' },
    )

  if (error) return { error: error.message }

  // Read back to verify what was actually stored.
  const { data: rb } = await supabase
    .from('club_settings')
    .select('homepage_blocks')
    .eq('club_id', clubId)
    .single()

  const rbBlocks          = (rb?.homepage_blocks as ContentBlock[] | null) ?? null
  const savedBlocks        = rbBlocks ? rbBlocks.length                    : null
  const savedEnabled       = rbBlocks ? rbBlocks.filter(b => b.enabled).length : null
  const savedNotes         = rbBlocks ? countNotes(rbBlocks)               : null
  const savedAffiliations  = rbBlocks ? countAffiliations(rbBlocks)        : null

  // Revalidate admin editor so server always returns fresh blocks.
  if (clubSlug) revalidatePath(`/${clubSlug}/admin/content/navigation`)

  // Only revalidate the member homepage on explicit publish.
  if (publish) {
    revalidatePath('/', 'layout')
    if (clubSlug) revalidatePath(`/${clubSlug}`)
  }

  return { debug: { clubId, sentBlocks, sentEnabled, sentNotes, sentAffiliations, savedBlocks, savedEnabled, savedNotes, savedAffiliations } }
}

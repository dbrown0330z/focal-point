'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId } from '@/lib/club-context'
import type { ContentBlock } from '@/lib/homepage/types'
import type { Json } from '@/types/database'

/**
 * Persist the homepage block layout to club_settings.
 * "Publish" also revalidates the member home page.
 */
export async function saveHomepageBlocks(
  blocks:    ContentBlock[],
  publish:   boolean = false,
  clubSlug?: string,
): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const clubId   = await requireClubId()

  const { error } = await supabase
    .from('club_settings')
    .update({ homepage_blocks: blocks as unknown as Json })
    .eq('club_id', clubId)

  if (error) return { error: error.message }

  // Revalidate admin editor so server always returns fresh blocks.
  if (clubSlug) revalidatePath(`/${clubSlug}/admin/content/navigation`)

  // Only revalidate the member homepage on explicit publish.
  if (publish) {
    revalidatePath('/', 'layout')
    if (clubSlug) revalidatePath(`/${clubSlug}`)
  }

  return {}
}

'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId } from '@/lib/club-context'
import type { ContentBlock } from '@/lib/homepage/types'
import type { Json } from '@/types/database'

export async function saveHomepageBlocks(
  blocks:    ContentBlock[],
  publish:   boolean = false,
  clubSlug?: string,
): Promise<{ error?: string }> {
  const supabase = createServiceClient()

  let clubId: string
  try {
    clubId = await requireClubId()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No club context' }
  }

  const { error } = await supabase
    .from('club_settings')
    .upsert(
      { club_id: clubId, homepage_blocks: blocks as unknown as Json },
      { onConflict: 'club_id' },
    )

  if (error) return { error: error.message }

  revalidatePath(`/${clubSlug}/admin/content/navigation`)

  if (publish) {
    revalidatePath('/', 'layout')
    if (clubSlug) revalidatePath(`/${clubSlug}`)
  }

  return {}
}

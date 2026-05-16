'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import type { ContentBlock } from '@/lib/homepage/types'
import type { Json } from '@/types/database'

/**
 * Persist the homepage block layout to club_settings.
 * Called by both "Save draft" (revalidates nothing visible to members)
 * and "Publish" (revalidates the member home page).
 */
export async function saveHomepageBlocks(
  blocks:  ContentBlock[],
  publish: boolean = false,
): Promise<{ error?: string }> {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('club_settings')
    .update({ homepage_blocks: blocks as unknown as Json })
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) return { error: error.message }

  // Always revalidate the admin page so the editor reloads fresh state.
  revalidatePath('/admin/content/navigation')

  // Only revalidate the member homepage on explicit publish — not on draft saves.
  if (publish) revalidatePath('/')

  return {}
}

'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId, requireClubSlug } from '@/lib/club-context'

export async function saveJoinPageContent(
  pageId: string | null,
  html: string,
): Promise<{ error?: string; newPageId?: string }> {
  const admin    = createServiceClient()
  const clubId   = await requireClubId()
  const clubSlug = await requireClubSlug()

  if (pageId) {
    const { error } = await admin
      .from('pages')
      .update({ content: html, updated_at: new Date().toISOString() })
      .eq('id', pageId)
    if (error) return { error: error.message }
  } else {
    const { data, error } = await admin
      .from('pages')
      .insert({ slug: 'join-renew', title: 'Join / Renew', content: html, club_id: clubId })
      .select('id')
      .single()
    if (error) return { error: error.message }
    revalidatePath(`/${clubSlug}/admin/content/join`)
    return { newPageId: (data as { id: string }).id }
  }

  revalidatePath(`/${clubSlug}/our-club/join`)
  return {}
}

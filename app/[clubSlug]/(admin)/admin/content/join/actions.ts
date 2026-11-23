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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any
  if (pageId) {
    const { error } = await adminAny
      .from('pages')
      .update({ content: html, updated_at: new Date().toISOString() })
      .eq('id', pageId)
    if (error) return { error: (error as { message: string }).message }
  } else {
    const { data, error } = await adminAny
      .from('pages')
      .insert({ slug: 'join-renew', title: 'Join / Renew', content: html, club_id: clubId })
      .select('id')
      .single()
    if (error) return { error: (error as { message: string }).message }
    revalidatePath(`/${clubSlug}/admin/content/join`)
    return { newPageId: (data as { id: string }).id }
  }

  revalidatePath(`/${clubSlug}/our-club/join`)
  return {}
}

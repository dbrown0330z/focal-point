'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId, requireClubSlug } from '@/lib/club-context'

export async function publishSite(): Promise<{ error?: string }> {
  const clubId   = await requireClubId()
  const clubSlug = await requireClubSlug()
  const admin    = createServiceClient()

  const { error } = await admin
    .from('clubs')
    .update({ is_published: true })
    .eq('id', clubId)

  if (error) return { error: error.message }

  revalidatePath(`/${clubSlug}/admin`, 'layout')
  return {}
}

export async function saveDuesMode(
  mode: 'stripe' | 'paypal' | 'offline',
): Promise<{ error?: string }> {
  const clubId   = await requireClubId()
  const clubSlug = await requireClubSlug()
  const admin    = createServiceClient()

  const { error } = await admin
    .from('clubs')
    .update({ dues_mode: mode })
    .eq('id', clubId)

  if (error) return { error: error.message }

  revalidatePath(`/${clubSlug}/admin`, 'layout')
  return {}
}

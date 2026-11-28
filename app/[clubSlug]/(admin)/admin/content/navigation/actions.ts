'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId } from '@/lib/club-context'

export async function saveNavPageVisibility(
  visibility: Record<string, unknown>
): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const clubId = await requireClubId()

  const { data: existing } = await supabase
    .from('club_settings')
    .select('page_visibility')
    .eq('club_id', clubId)
    .single()

  const current = (existing?.page_visibility as Record<string, unknown> | null) ?? {}
  const { error } = await supabase
    .from('club_settings')
    .update({ page_visibility: { ...current, ...visibility } })
    .eq('club_id', clubId)

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return {}
}

// Called after navigation publish so the member layout re-renders with fresh data.
export async function revalidateNavCache(): Promise<void> {
  revalidatePath('/', 'layout')
}

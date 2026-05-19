'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId, requireClubSlug } from '@/lib/club-context'

export async function saveJudge(data: {
  id?: string
  name: string
  email: string
}) {
  const admin  = createServiceClient()
  const clubId = await requireClubId()
  const slug   = await requireClubSlug()

  if (data.id) {
    await admin
      .from('judge_directory')
      .update({ name: data.name, email: data.email })
      .eq('id', data.id)
      .eq('club_id', clubId)
  } else {
    await admin
      .from('judge_directory')
      .insert({ name: data.name, email: data.email, club_id: clubId })
  }

  revalidatePath(`/${slug}/admin/judges`)
}

export async function deleteJudge(id: string) {
  const admin  = createServiceClient()
  const clubId = await requireClubId()
  const slug   = await requireClubSlug()

  await admin
    .from('judge_directory')
    .delete()
    .eq('id', id)
    .eq('club_id', clubId)

  revalidatePath(`/${slug}/admin/judges`)
}

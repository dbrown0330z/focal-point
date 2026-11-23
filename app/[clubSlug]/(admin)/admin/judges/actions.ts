'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId, requireClubSlug } from '@/lib/club-context'

export type JudgeRow = {
  id:         string
  first_name: string
  last_name:  string
  email:      string
  phone:      string | null
  website:    string | null
}

export async function saveJudge(data: {
  id?:        string
  first_name: string
  last_name:  string
  email:      string
  phone:      string | null
  website:    string | null
}): Promise<JudgeRow> {
  const admin  = createServiceClient()
  const clubId = await requireClubId()
  const slug   = await requireClubSlug()
  const name   = [data.first_name, data.last_name].filter(Boolean).join(' ')

  if (data.id) {
    const { data: row, error } = await admin
      .from('judge_directory')
      .update({ name, first_name: data.first_name, last_name: data.last_name, email: data.email, phone: data.phone || null, website: data.website || null })
      .eq('id', data.id)
      .eq('club_id', clubId)
      .select('id, first_name, last_name, email, phone, website')
      .single()
    if (error || !row) throw new Error(error?.message ?? 'Save failed')
    revalidatePath(`/${slug}/admin/judges`)
    return row as JudgeRow
  } else {
    const { data: row, error } = await admin
      .from('judge_directory')
      .insert({ name, first_name: data.first_name, last_name: data.last_name, email: data.email, phone: data.phone || null, website: data.website || null, club_id: clubId })
      .select('id, first_name, last_name, email, phone, website')
      .single()
    if (error || !row) throw new Error(error?.message ?? 'Save failed')
    revalidatePath(`/${slug}/admin/judges`)
    return row as JudgeRow
  }
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

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type CompetitionStatus = Database['public']['Enums']['competition_status']

export async function createCompetition(formData: FormData) {
  const supabase = await createClient()

  const { data: competition, error } = await supabase
    .from('competitions')
    .insert({
      title: formData.get('title') as string,
      submission_limit: Number(formData.get('submission_limit')),
      opens_at: (formData.get('opens_at') as string) || null,
      closes_at: (formData.get('closes_at') as string) || null,
    })
    .select('id')
    .single()

  if (error || !competition) redirect('/admin/competitions?error=' + encodeURIComponent(error?.message ?? 'Unknown error'))

  // Insert categories
  const categories = formData.getAll('category').map(c => c.toString().trim()).filter(Boolean)
  if (categories.length) {
    await supabase.from('competition_categories').insert(
      categories.map(name => ({ competition_id: competition.id, name }))
    )
  }

  redirect(`/admin/competitions/${competition.id}`)
}

export async function updateCompetition(id: string, formData: FormData) {
  const supabase = await createClient()

  await supabase
    .from('competitions')
    .update({
      title: formData.get('title') as string,
      submission_limit: Number(formData.get('submission_limit')),
      opens_at: (formData.get('opens_at') as string) || null,
      closes_at: (formData.get('closes_at') as string) || null,
    })
    .eq('id', id)

  revalidatePath(`/admin/competitions/${id}`)
}

export async function transitionStatus(id: string, status: CompetitionStatus) {
  const supabase = await createClient()
  await supabase.from('competitions').update({ status }).eq('id', id)
  revalidatePath(`/admin/competitions/${id}`)
  revalidatePath('/admin/competitions')
}

export async function addCategory(competitionId: string, formData: FormData) {
  const name = (formData.get('name') as string).trim()
  if (!name) return

  const supabase = await createClient()
  await supabase.from('competition_categories').insert({ competition_id: competitionId, name })
  revalidatePath(`/admin/competitions/${competitionId}`)
}

export async function removeCategory(categoryId: string, competitionId: string) {
  const supabase = await createClient()
  await supabase.from('competition_categories').delete().eq('id', categoryId)
  revalidatePath(`/admin/competitions/${competitionId}`)
}

export async function addJudge(competitionId: string, formData: FormData) {
  const supabase = await createClient()
  await supabase.from('judge_tokens').insert({
    competition_id: competitionId,
    judge_name: formData.get('judge_name') as string,
    judge_email: formData.get('judge_email') as string,
  })
  revalidatePath(`/admin/competitions/${competitionId}`)
}

export async function removeJudge(judgeTokenId: string, competitionId: string) {
  const supabase = await createClient()
  await supabase.from('judge_tokens').delete().eq('id', judgeTokenId)
  revalidatePath(`/admin/competitions/${competitionId}`)
}

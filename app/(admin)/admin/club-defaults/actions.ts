'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const PATH = '/admin/club-defaults'

export async function saveMemberClassesEnabled(enabled: boolean): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('club_settings')
    .update({ member_classes_enabled: enabled, updated_at: new Date().toISOString() })
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}

export async function saveClubSettings(data: {
  club_name: string
  club_short_name: string
  club_location: string
  timezone: string
  season_start_month: number
  season_end_month: number
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('club_settings')
    .update({ ...data, updated_at: new Date().toISOString() })
    .neq('id', '00000000-0000-0000-0000-000000000000') // matches the single row
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}

export async function updateDefaultLocation(id: string | null): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('club_settings')
    .update({ default_meeting_location_id: id })
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}

export async function uploadClubLogo(formData: FormData): Promise<{ error?: string; url?: string }> {
  const supabase = await createClient()
  const file = formData.get('logo') as File | null
  if (!file) return { error: 'No file provided' }

  const ext = file.name.split('.').pop()
  const path = `logo/club-logo.${ext}`

  const { error: upErr } = await supabase.storage
    .from('club-assets')
    .upload(path, file, { upsert: true })
  if (upErr) return { error: upErr.message }

  const { data: { publicUrl } } = supabase.storage.from('club-assets').getPublicUrl(path)

  await supabase
    .from('club_settings')
    .update({ logo_path: publicUrl })
    .neq('id', '00000000-0000-0000-0000-000000000000')

  revalidatePath(PATH)
  return { url: publicUrl }
}

export async function addMeetingLocation(name: string, address: string | null): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('meeting_locations')
    .insert({ name: name.trim(), address: address?.trim() || null })
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return { id: data.id }
}

export async function deleteMeetingLocation(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('meeting_locations').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}

export async function addMemberClass(name: string, description: string): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('member_classes')
    .insert({ name: name.trim(), description: description.trim() || null })
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return { id: data.id }
}

export async function deleteMemberClass(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('member_classes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}

export async function updateMemberClass(id: string, name: string, description: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('member_classes')
    .update({ name: name.trim(), description: description.trim() || null })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}

export async function addCompetitionDefaultCategory(name: string): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('competition_default_categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  const sort_order = (existing?.sort_order ?? -1) + 1
  const { data, error } = await supabase
    .from('competition_default_categories')
    .insert({ name: name.trim(), sort_order })
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return { id: data.id }
}

export async function deleteCompetitionDefaultCategory(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('competition_default_categories').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}

export async function renameCompetitionDefaultCategory(id: string, name: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('competition_default_categories')
    .update({ name: name.trim() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}

export async function createDefaultMemberClasses(): Promise<{ error?: string; classes?: { id: string; name: string }[] }> {
  const supabase = await createClient()
  const defaults = [
    { name: 'Class A', sort_order: 0 },
    { name: 'Class B', sort_order: 1 },
    { name: 'Class C', sort_order: 2 },
  ]
  const { data, error } = await supabase
    .from('member_classes')
    .insert(defaults)
    .select('id, name')
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return { classes: data }
}

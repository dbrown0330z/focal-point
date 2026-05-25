'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId } from '@/lib/club-context'

const PATH = '/admin/club-defaults'

export async function saveMemberClassesEnabled(enabled: boolean): Promise<{ error?: string }> {
  const supabase = createServiceClient()
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
  contact_email: string
  from_email: string
  timezone: string
  season_start_month: number
  season_end_month: number
  member_directory_visibility: string
}): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const clubId = await requireClubId()

  const { error } = await supabase
    .from('club_settings')
    .update({ ...data, updated_at: new Date().toISOString() })
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return { error: error.message }

  // Keep clubs.name in sync — middleware reads this for the browser tab title
  await supabase.from('clubs').update({ name: data.club_name }).eq('id', clubId)

  revalidatePath(PATH)
  revalidatePath('/')
  revalidatePath('/', 'layout')
  return {}
}

export async function updateDefaultLocation(id: string | null): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('club_settings')
    .update({ default_meeting_location_id: id })
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}

export async function uploadClubLogo(formData: FormData): Promise<{ error?: string; url?: string }> {
  const supabase = createServiceClient()
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
  const supabase = createServiceClient()
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
  const supabase = createServiceClient()
  const { error } = await supabase.from('meeting_locations').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}

export async function addMemberClass(name: string, description: string): Promise<{ error?: string; id?: string }> {
  const supabase = createServiceClient()
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
  const supabase = createServiceClient()
  const { error } = await supabase.from('member_classes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}

export async function updateMemberClass(id: string, name: string, description: string): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('member_classes')
    .update({ name: name.trim(), description: description.trim() || null })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}

export async function addCompetitionDefaultCategory(name: string): Promise<{ error?: string; id?: string }> {
  const supabase = createServiceClient()
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
  const supabase = createServiceClient()
  const { error } = await supabase.from('competition_default_categories').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}

export async function renameCompetitionDefaultCategory(id: string, name: string): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('competition_default_categories')
    .update({ name: name.trim() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}

export async function savePoySettings(data: {
  poy_categories_factor:     boolean
  poy_separate_per_category: boolean
  poy_branch_a_counting:     string
  poy_branch_a_top_n:        number
  poy_branch_a_exclude_n:    number
  poy_b1_counting:           string
  poy_b1_top_n:              number
  poy_b1_exclude_n:          number
  poy_b2_counting:           string
  poy_b2_top_n:              number
  poy_b2_exclude_n:          number
  poy_tiebreaker:            string
  poy_eligibility:           string
  poy_eligibility_min_dur:   string
}): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('club_settings')
    .update({ ...data, updated_at: new Date().toISOString() })
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return { error: error.message }
  revalidatePath('/admin/club-defaults/recognition')
  revalidatePath('/', 'layout') // standings page reads this config
  return {}
}

export async function saveCompetitionDefaults(data: {
  max_entries_per_member:         number
  max_entries_per_category:       number | null
  image_long_edge_preset:         string
  image_long_edge_custom:         number | null
  require_capture_date:           boolean
  capture_date_amount:            number
  capture_date_unit:              string
  image_reuse_rule:               string
  withdrawal_frees_slot:          boolean
  judging_method:                 string
  score_min:                      number
  score_max:                      number
  allow_decimals:                 boolean
  score_aggregation:              string
  hide_member_names:              boolean
  hide_exif_data:                 boolean
  require_judge_comments:         boolean
  judge_comments_min_chars:       number
  score_min_to_publish_enabled:   boolean
  score_min_to_publish:           number
  results_visibility:             string
  results_visibility_delay_hours: number
}): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('competition_defaults')
    .update({ ...data, updated_at: new Date().toISOString() })
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return { error: error.message }
  revalidatePath('/admin/club-defaults/competition')
  return {}
}

export async function createDefaultMemberClasses(): Promise<{ error?: string; classes?: { id: string; name: string }[] }> {
  const supabase = createServiceClient()
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

// ── Membership terms actions ───────────────────────────────────────────────────

/** Mark the default template as reviewed/accepted without editing. */
export async function acceptDefaultTerms(): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('club_settings')
    .update({
      membership_terms_reviewed:   true,
      membership_terms_updated_at: new Date().toISOString(),
    })
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}

/** Save edited default template content (also marks as reviewed). */
export async function saveTermsContent(content: string): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('club_settings')
    .update({
      membership_terms_content:    content,
      membership_terms_reviewed:   true,
      membership_terms_updated_at: new Date().toISOString(),
    })
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return { error: error.message }
  revalidatePath(PATH)
  revalidatePath('/terms')
  return {}
}

/** Upload a custom terms document (PDF or DOCX). Replaces template. */
export async function uploadTermsFile(
  formData: FormData
): Promise<{ error?: string; filePath?: string; fileName?: string }> {
  const supabase = createServiceClient()
  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }

  const MAX_BYTES = 5 * 1024 * 1024
  if (file.size > MAX_BYTES) return { error: 'File must be 5 MB or smaller' }

  const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowed.includes(file.type)) return { error: 'Only PDF and DOCX files are accepted' }

  const ext       = file.name.split('.').pop() ?? 'pdf'
  const timestamp = Date.now()
  const storagePath = `terms/membership-terms-${timestamp}.${ext}`

  const { error: upErr } = await supabase.storage
    .from('club-assets')
    .upload(storagePath, file, { upsert: false })
  if (upErr) return { error: upErr.message }

  const { data: { publicUrl } } = supabase.storage
    .from('club-assets')
    .getPublicUrl(storagePath)

  const { error } = await supabase
    .from('club_settings')
    .update({
      membership_terms_source:     'custom',
      membership_terms_file_path:  publicUrl,
      membership_terms_file_name:  file.name,
      membership_terms_reviewed:   true,
      membership_terms_updated_at: new Date().toISOString(),
    })
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return { error: error.message }

  revalidatePath(PATH)
  revalidatePath('/terms')
  return { filePath: publicUrl, fileName: file.name }
}

/** Remove the custom document and revert to the default template. */
export async function removeTermsFile(): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('club_settings')
    .update({
      membership_terms_source:     'default',
      membership_terms_file_path:  null,
      membership_terms_file_name:  null,
      membership_terms_reviewed:   false,   // re-prompt admin to review default
      membership_terms_updated_at: new Date().toISOString(),
    })
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return { error: error.message }
  revalidatePath(PATH)
  revalidatePath('/terms')
  return {}
}

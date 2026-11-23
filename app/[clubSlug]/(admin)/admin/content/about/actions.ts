'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

export type AboutPanelFields = {
  club_location?:           string | null
  contact_email?:           string | null
  annual_dues?:             string | null
  join_fee?:                string | null
  meeting_schedule?:        string | null
  meeting_notes?:           string | null
  founded_year?:            number | null
  website_url?:             string | null
  facebook_url?:            string | null
  instagram_url?:           string | null
  join_open?:               boolean
  panel_show_founded_year?: boolean
  panel_show_member_count?: boolean
  panel_show_schedule?:     boolean
  panel_show_location?:     boolean
  panel_show_instagram?:    boolean
  panel_show_facebook?:     boolean
  panel_show_join_button?:  boolean
  panel_show_contact?:      boolean
}

export async function saveAboutPanelFields(data: AboutPanelFields): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('club_settings')
    .update({ ...(data as any), updated_at: new Date().toISOString() })
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return { error: error.message }
  revalidatePath('/our-club/about')
  revalidatePath('/', 'layout')
  return {}
}

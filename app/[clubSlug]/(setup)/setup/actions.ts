'use server'

import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'

export async function completeSetup(data: {
  clubId:      string
  clubName:    string
  location:    string
  description: string
  joinOpen:    boolean
}): Promise<{ error?: string }> {
  const admin = createServiceClient()

  // Update clubs row
  const { error: clubErr } = await (admin as any)
    .from('clubs')
    .update({
      name:     data.clubName,
      location: data.location || null,
    })
    .eq('id', data.clubId)
  if (clubErr) return { error: clubErr.message }

  // Update club_settings
  const { error: settingsErr } = await (admin as any)
    .from('club_settings')
    .update({
      club_name:    data.clubName,
      join_open:    data.joinOpen,
      about:        data.description || null,
      setup_complete: true,
    })
    .eq('club_id', data.clubId)
  if (settingsErr) return { error: settingsErr.message }

  // Fetch slug for redirect
  const { data: club } = await (admin as any)
    .from('clubs')
    .select('slug')
    .eq('id', data.clubId)
    .single()

  redirect(`/${club.slug}/admin`)
}

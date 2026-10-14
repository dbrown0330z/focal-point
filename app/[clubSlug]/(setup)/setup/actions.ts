'use server'

import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'

export async function completeSetup(data: {
  clubId:    string
  clubName:  string
  shortName: string
  location:  string
  timezone:  string
  next:      'admin' | 'homepage'
}): Promise<{ error?: string }> {
  const admin = createServiceClient()

  const { error: clubErr } = await admin
    .from('clubs')
    .update({ name: data.clubName, location: data.location || null })
    .eq('id', data.clubId)
  if (clubErr) return { error: clubErr.message }

  const { error: settingsErr } = await (admin as any)
    .from('club_settings')
    .update({
      club_name:       data.clubName,
      club_short_name: data.shortName || null,
      club_location:   data.location  || null,
      timezone:        data.timezone,
      setup_complete:  true,
    })
    .eq('club_id', data.clubId)
  if (settingsErr) return { error: settingsErr.message }

  const { data: club } = await admin
    .from('clubs')
    .select('slug')
    .eq('id', data.clubId)
    .single()

  if (data.next === 'homepage') {
    redirect(`/${club!.slug}`)
  } else {
    redirect(`/${club!.slug}/admin`)
  }
}

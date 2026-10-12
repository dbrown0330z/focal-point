'use server'

import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import type { WelcomeContent } from '@/lib/homepage/types'
import { DEFAULT_BLOCKS } from '@/lib/homepage/types'

export async function completeSetup(data: {
  clubId:      string
  clubName:    string
  shortName:   string
  timezone:    string
  fromEmail:   string
  seasonStart: number
  seasonEnd:   number
  welcome:     WelcomeContent
}): Promise<{ error?: string }> {
  const admin = createServiceClient()

  // Update clubs row
  const { error: clubErr } = await admin
    .from('clubs')
    .update({ name: data.clubName })
    .eq('id', data.clubId)
  if (clubErr) return { error: clubErr.message }

  // Merge welcome content into homepage_blocks
  const blocks = DEFAULT_BLOCKS.map(b =>
    b.id === 'welcome' ? { ...b, welcomeContent: data.welcome } : b
  )

  // Update club_settings
  const { error: settingsErr } = await (admin as any)
    .from('club_settings')
    .update({
      club_name:          data.clubName,
      club_short_name:    data.shortName || null,
      timezone:           data.timezone,
      from_email:         data.fromEmail || null,
      season_start_month: data.seasonStart,
      season_end_month:   data.seasonEnd,
      homepage_blocks:    blocks,
      setup_complete:     true,
    })
    .eq('club_id', data.clubId)
  if (settingsErr) return { error: settingsErr.message }

  // Fetch slug for redirect
  const { data: club } = await admin
    .from('clubs')
    .select('slug')
    .eq('id', data.clubId)
    .single()

  redirect(`/${club!.slug}/admin`)
}

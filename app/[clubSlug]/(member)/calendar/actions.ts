'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type CalendarEventType = 'competition' | 'regular_meeting' | 'board_meeting' | 'field_trip' | 'other' | 'submission_open' | 'submission_closed'

export type CalendarEvent = {
  id: string
  title: string
  description: string | null
  location: string | null
  starts_at: string
  ends_at: string | null
  all_day: boolean
  event_type: CalendarEventType
  created_by: string | null
}

export async function createEvent(data: {
  title: string
  description: string
  location: string
  starts_at: string
  ends_at: string
  all_day: boolean
  event_type: CalendarEventType
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await admin.from('calendar_events').insert({
    title:       data.title,
    description: data.description || null,
    location:    data.location    || null,
    starts_at:   data.starts_at,
    ends_at:     data.ends_at     || null,
    all_day:     data.all_day,
    event_type:  data.event_type,
    created_by:  user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/calendar')
  return {}
}

export async function deleteEvent(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await admin.from('calendar_events').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/calendar')
  return {}
}

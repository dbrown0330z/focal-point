import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CalendarClient from './CalendarClient'
import type { CalendarEvent } from './actions'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: events } = await supabase
    .from('calendar_events')
    .select('id, title, description, location, starts_at, ends_at, all_day, event_type, created_by')
    .order('starts_at', { ascending: true })

  return (
    <CalendarClient
      events={(events ?? []) as CalendarEvent[]}
      isAdmin={profile?.role === 'admin'}
    />
  )
}

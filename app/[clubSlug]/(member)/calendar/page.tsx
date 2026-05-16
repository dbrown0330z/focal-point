import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CalendarClient from './CalendarClient'
import type { CalendarEvent } from './actions'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const [{ data: events }, { data: locationRows }, { data: clubSettings }, { data: competitions }] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('id, title, description, location, starts_at, ends_at, all_day, event_type, created_by')
      .order('starts_at', { ascending: true }),
    supabase
      .from('meeting_locations')
      .select('name, address')
      .order('sort_order')
      .order('created_at'),
    supabase
      .from('club_settings')
      .select('timezone')
      .single(),
    supabase
      .from('competitions')
      .select('id, title, short_title, opens_at, closes_at, results_at')
      .in('status', ['open', 'judging', 'results_pending', 'results_published'])
      .is('archived_at', null)
      .is('deleted_at', null),
  ])

  // Synthesize submission_open / submission_closed events from active competitions
  const competitionEvents: CalendarEvent[] = (competitions ?? []).flatMap(comp => {
    const label = (comp as { short_title: string | null }).short_title ?? comp.title
    const synth: CalendarEvent[] = []
    if (comp.opens_at) {
      synth.push({
        id: `comp-open-${comp.id}`,
        title: `${label} — submissions open`,
        description: null,
        location: null,
        starts_at: comp.opens_at,
        ends_at: null,
        all_day: true,
        event_type: 'submission_open',
        created_by: null,
      })
    }
    if (comp.closes_at) {
      synth.push({
        id: `comp-close-${comp.id}`,
        title: `${label} — submissions close`,
        description: null,
        location: null,
        starts_at: comp.closes_at,
        ends_at: null,
        all_day: true,
        event_type: 'submission_closed',
        created_by: null,
      })
    }
    const resultsAt = (comp as unknown as { results_at: string | null }).results_at
    if (resultsAt) {
      synth.push({
        id: `comp-results-${comp.id}`,
        title: `${label} — results revealed`,
        description: null,
        location: null,
        starts_at: resultsAt,
        ends_at: null,
        all_day: true,
        event_type: 'competition',
        created_by: null,
      })
    }
    return synth
  })

  const allEvents: CalendarEvent[] = [
    ...(events ?? []) as CalendarEvent[],
    ...competitionEvents,
  ].sort((a, b) => a.starts_at.localeCompare(b.starts_at))

  return (
    <CalendarClient
      events={allEvents}
      isAdmin={profile?.role === 'admin'}
      locations={(locationRows ?? []) as { name: string; address: string | null }[]}
      timezone={clubSettings?.timezone ?? 'America/New_York'}
    />
  )
}

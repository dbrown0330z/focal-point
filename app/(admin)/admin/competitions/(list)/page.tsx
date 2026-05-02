import { createServiceClient } from '@/lib/supabase/service'
import CompetitionsListClient from './CompetitionsListClient'
import type { CompetitionConfig } from '@/types/competition'

export const dynamic = 'force-dynamic'

export default async function AdminCompetitionsPage() {
  const supabase = createServiceClient()

  const [
    { data: competitions },
    { data: templates },
    { data: locations },
    { data: judgeTokens },
    { data: submissionRows },
    { data: judgeDirectory },
  ] = await Promise.all([
    supabase
      .from('competitions')
      .select('id, title, status, opens_at, closes_at, judging_at, template_id, archived_at')
      .is('deleted_at', null)
      .order('opens_at', { ascending: false, nullsFirst: false }),
    supabase
      .from('competition_templates')
      .select('id, name, config')
      .order('name', { ascending: true }),
    supabase
      .from('meeting_locations')
      .select('id, name, address')
      .order('sort_order', { ascending: true }),
    supabase
      .from('judge_tokens')
      .select('competition_id, judge_name'),
    supabase
      .from('submissions')
      .select('competition_id'),
    supabase
      .from('judge_directory')
      .select('id, name, email')
      .order('name', { ascending: true }),
  ])

  const templateRows = (templates ?? []).map(t => ({
    id:     t.id,
    name:   t.name,
    config: t.config as unknown as CompetitionConfig,
  }))

  const { data: categoryRows } = await supabase
    .from('competition_default_categories')
    .select('name')
    .order('sort_order', { ascending: true })

  const clubCategories = categoryRows?.map(r => r.name) ?? ['Open', 'Nature', 'Monochrome']

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('membership_status', ['active', 'complimentary'])
    .order('last_name', { ascending: true })

  const memberProfiles = (profiles ?? []).map(p => ({
    id:    p.id,
    name:  [p.first_name, p.last_name].filter(Boolean).join(' ') || '—',
    email: undefined as string | undefined,
  }))

  const directoryJudges = (judgeDirectory ?? []).map(j => ({
    id:    `dir_${j.id}`,
    name:  j.name,
    email: j.email,
  }))

  // Merge: directory judges first (sorted by name), then members not already in directory by email
  const memberEmails = new Set(directoryJudges.map(j => j.email.toLowerCase()))
  const members = [
    ...directoryJudges,
    ...memberProfiles.filter(p => !p.email || !memberEmails.has(p.email.toLowerCase())),
  ]

  const meetingLocations = (locations ?? []).map(l =>
    l.address ? `${l.name} — ${l.address}` : l.name
  )

  // Group judges by competition
  const judgesByComp: Record<string, string[]> = {}
  for (const jt of judgeTokens ?? []) {
    if (!judgesByComp[jt.competition_id]) judgesByComp[jt.competition_id] = []
    judgesByComp[jt.competition_id].push(jt.judge_name)
  }

  // Count submissions by competition
  const submissionsByComp: Record<string, number> = {}
  for (const s of submissionRows ?? []) {
    submissionsByComp[s.competition_id] = (submissionsByComp[s.competition_id] ?? 0) + 1
  }

  const enrichedCompetitions = (competitions ?? [])
    .map(c => ({
      id:               c.id,
      title:            c.title,
      status:           c.status as 'draft' | 'open' | 'judging' | 'judging_on_hold' | 'closed' | 'cancelled' | 'results_pending' | 'results_published',
      opens_at:         c.opens_at,
      closes_at:        c.closes_at,
      judging_at:       c.judging_at,
      judging_opens_at: null as string | null,
      template_id:      c.template_id,
      judges:           judgesByComp[c.id] ?? [],
      submissionCount:  submissionsByComp[c.id] ?? 0,
      archived_at:      c.archived_at ?? null,
    }))
    .sort((a, b) => {
      const aDate = a.judging_at ?? a.closes_at ?? ''
      const bDate = b.judging_at ?? b.closes_at ?? ''
      return bDate.localeCompare(aDate)
    })

  return (
    <CompetitionsListClient
      competitions={enrichedCompetitions}
      templates={templateRows}
      members={members}
      meetingLocations={meetingLocations}
      clubCategories={clubCategories}
    />
  )
}

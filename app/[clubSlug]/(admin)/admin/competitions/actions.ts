'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug } from '@/lib/club-context'
import { sendJudgeInvitation, sendMemberCancellationNotification, sendJudgeCancellationNotification } from '@/lib/email/send'
import type { Database } from '@/types/database'
import type { CompetitionConfig, CompetitionSchedule, CompetitionType } from '@/types/competition'

type CompetitionStatus = Database['public']['Enums']['competition_status']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toTs(date: string, endOfDay = false): string {
  return `${date}T${endOfDay ? '23:59:59' : '00:00:00'}`
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function getOrigin(): Promise<string> {
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host  = h.get('host') ?? 'localhost'
  return `${proto}://${host}`
}

// ─── Competitions ─────────────────────────────────────────────────────────────

export async function createCompetition(formData: FormData) {
  const supabase = createServiceClient()

  const { data: competition, error } = await supabase
    .from('competitions')
    .insert({
      title:            formData.get('title') as string,
      submission_limit: Number(formData.get('submission_limit')),
      opens_at:         (formData.get('opens_at') as string) || null,
      closes_at:        (formData.get('closes_at') as string) || null,
    })
    .select('id')
    .single()

  if (error || !competition) redirect('/admin/competitions?error=' + encodeURIComponent(error?.message ?? 'Unknown error'))

  const categories = formData.getAll('category').map(c => c.toString().trim()).filter(Boolean)
  if (categories.length) {
    await supabase.from('competition_categories').insert(
      categories.map(name => ({ competition_id: competition.id, name }))
    )
  }

  redirect(`/admin/competitions/${competition.id}`)
}

export async function updateCompetition(id: string, formData: FormData) {
  const supabase = createServiceClient()

  await supabase
    .from('competitions')
    .update({
      title:            formData.get('title') as string,
      submission_limit: Number(formData.get('submission_limit')),
      opens_at:         (formData.get('opens_at') as string) || null,
      closes_at:        (formData.get('closes_at') as string) || null,
    })
    .eq('id', id)

  revalidatePath(`/admin/competitions/${id}`)
  revalidatePath('/competitions')
}

export async function transitionStatus(id: string, status: CompetitionStatus) {
  const supabase = createServiceClient()
  const slug = await requireClubSlug()
  await supabase.from('competitions').update({ status }).eq('id', id)
  revalidatePath(`/${slug}/admin/competitions/${id}`)
  revalidatePath(`/${slug}/admin/competitions`)
  revalidatePath(`/${slug}/competitions`)
}

export async function publishCompetition(id: string) {
  const supabase = createServiceClient()
  const slug = await requireClubSlug()
  await supabase.from('competitions').update({ status: 'open' }).eq('id', id)
  revalidatePath(`/${slug}/admin/competitions/${id}`)
  revalidatePath(`/${slug}/admin/competitions`)
  revalidatePath(`/${slug}/competitions`)
}

export async function updateCompetitionTitle(id: string, title: string) {
  const supabase = createServiceClient()
  if (!title.trim()) return
  await supabase.from('competitions').update({ title: title.trim() }).eq('id', id)
  revalidatePath(`/admin/competitions/${id}`)
  revalidatePath('/admin/competitions')
  revalidatePath('/competitions')
}

export async function updateScheduleField(
  id: string,
  field: 'opens_at' | 'closes_at' | 'judging_opens_at' | 'judging_closes_at' | 'results_at' | 'results_event_type',
  value: string | null,
) {
  const supabase = createServiceClient()
  // results_at and results_event_type are added in migration 20260418010000 — silently skip if not yet run
  if (field === 'results_at' || field === 'results_event_type') {
    await supabase.from('competitions').update({ [field]: value }).eq('id', id)
    // ignore error — schema may not have these columns yet
  } else {
    await supabase.from('competitions').update({ [field]: value }).eq('id', id)
  }
  revalidatePath(`/admin/competitions/${id}`)
  revalidatePath('/competitions')
}

export async function addCategory(competitionId: string, formData: FormData) {
  const name = (formData.get('name') as string).trim()
  if (!name) return
  const supabase = createServiceClient()
  await supabase.from('competition_categories').insert({ competition_id: competitionId, name })
  revalidatePath(`/admin/competitions/${competitionId}`)
  revalidatePath('/competitions')
}

export async function removeCategory(categoryId: string, competitionId: string) {
  const supabase = createServiceClient()
  await supabase.from('competition_categories').delete().eq('id', categoryId)
  revalidatePath(`/admin/competitions/${competitionId}`)
  revalidatePath('/competitions')
}

// ─── Judge management ─────────────────────────────────────────────────────────

export async function addJudge(competitionId: string, formData: FormData) {
  const supabase    = createServiceClient()
  const judgeName   = formData.get('judge_name')  as string
  const judgeEmail  = formData.get('judge_email') as string

  const { data: jt, error } = await supabase
    .from('judge_tokens')
    .insert({ competition_id: competitionId, judge_name: judgeName, judge_email: judgeEmail })
    .select('token')
    .single()

  if (error || !jt) {
    revalidatePath(`/admin/competitions/${competitionId}`)
    return
  }

  // Fetch competition details to personalise the invitation email
  const { data: comp } = await supabase
    .from('competitions')
    .select('title, judging_opens_at, judging_closes_at')
    .eq('id', competitionId)
    .single()

  const { data: club } = await supabase.from('club_settings').select('club_name').single()

  if (comp && process.env.RESEND_API_KEY) {
    const origin = await getOrigin()
    try {
      await sendJudgeInvitation({
        judgeEmail,
        judgeFirstName:   judgeName.split(' ')[0],
        competitionName:  comp.title,
        clubName:         club?.club_name ?? 'the club',
        judgingOpenDate:  fmtDate(comp.judging_opens_at),
        judgingCloseDate: fmtDate(comp.judging_closes_at),
        judgingUrl:       `${origin}/judge/${jt.token}`,
      })
      // Mark invitation as sent
      await supabase
        .from('judge_tokens')
        .update({ invitation_sent_at: new Date().toISOString() })
        .eq('token', jt.token)
    } catch (err) {
      console.warn('Judge invitation email failed:', err)
    }
  }

  revalidatePath('/admin/competitions')
  revalidatePath(`/admin/competitions/${competitionId}`)
  revalidatePath('/competitions')
}

export async function addJudgeFromMember(competitionId: string, memberId: string) {
  const supabase = createServiceClient()

  let judgeEmail = ''
  let judgeName  = ''

  if (memberId.startsWith('dir_')) {
    // Judge directory entry
    const dirId = memberId.slice(4)
    const { data: dirEntry } = await supabase
      .from('judge_directory')
      .select('name, email')
      .eq('id', dirId)
      .single()
    if (!dirEntry) throw new Error('Judge not found in directory')
    judgeName  = dirEntry.name
    judgeEmail = dirEntry.email ?? ''
    if (!judgeEmail) throw new Error('Judge has no email address on file')
  } else {
    // Club member from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', memberId)
      .single()
    if (!profile) throw new Error('Member not found')
    const { data: authUser } = await supabase.auth.admin.getUserById(memberId)
    judgeEmail = authUser?.user?.email ?? ''
    judgeName  = [profile.first_name, profile.last_name].filter(Boolean).join(' ')
    if (!judgeEmail) throw new Error('Member has no email address on file')
  }

  const { data: jt, error } = await supabase
    .from('judge_tokens')
    .insert({ competition_id: competitionId, judge_name: judgeName, judge_email: judgeEmail })
    .select('token')
    .single()

  if (error || !jt) {
    revalidatePath(`/admin/competitions/${competitionId}`)
    return
  }

  const { data: comp } = await supabase
    .from('competitions')
    .select('title, judging_opens_at, judging_closes_at')
    .eq('id', competitionId)
    .single()

  const { data: club } = await supabase.from('club_settings').select('club_name').single()

  if (comp && process.env.RESEND_API_KEY) {
    const origin = await getOrigin()
    try {
      await sendJudgeInvitation({
        judgeEmail,
        judgeFirstName:   judgeName.split(' ')[0],
        competitionName:  comp.title,
        clubName:         club?.club_name ?? 'the club',
        judgingOpenDate:  fmtDate(comp.judging_opens_at),
        judgingCloseDate: fmtDate(comp.judging_closes_at),
        judgingUrl:       `${origin}/judge/${jt.token}`,
      })
      await supabase
        .from('judge_tokens')
        .update({ invitation_sent_at: new Date().toISOString() })
        .eq('token', jt.token)
    } catch (err) {
      console.warn('Judge invitation email failed:', err)
    }
  }

  revalidatePath('/admin/competitions')
  revalidatePath(`/admin/competitions/${competitionId}`)
  revalidatePath('/competitions')
}

export async function removeJudge(judgeTokenId: string, competitionId: string) {
  const supabase = createServiceClient()
  await supabase.from('judge_tokens').delete().eq('id', judgeTokenId)
  revalidatePath('/admin/competitions')
  revalidatePath(`/admin/competitions/${competitionId}`)
  revalidatePath('/competitions')
}

// ─── Wizard: create from schedule ─────────────────────────────────────────────

export async function createCompetitionFromSchedule(args: {
  config:          CompetitionConfig
  schedule:        CompetitionSchedule
  competitionType: CompetitionType
  status?:         CompetitionStatus
}) {
  const supabase = createServiceClient()
  const { config, schedule, status = 'draft' } = args

  const { data: competition, error } = await supabase
    .from('competitions')
    .insert({
      title:             schedule.instanceName,
      short_title:       schedule.calendarTitle?.trim() || null,
      submission_limit:  config.maxEntriesPerMember,
      opens_at:          schedule.submissionsOpenDate  ? toTs(schedule.submissionsOpenDate)       : null,
      closes_at:         schedule.submissionsCloseDate ? toTs(schedule.submissionsCloseDate, true) : null,
      status,
      // Judging configuration
      score_min:         config.scoreMin,
      score_max:         config.scoreMax,
      allow_half_points: config.allowDecimals,
      anonymise_members: config.blindHideName,
      anonymise_exif:    config.blindHideMetadata,
      require_feedback:  config.judgeComments === 'required',
      preset:            config.judgingPreset,
      awards_enabled:    config.awardsEnabled,
      award_types:       (config.awardsEnabled ? config.awardTiers : []) as unknown as import('@/types/database').Json,
    })
    .select('id')
    .single()

  if (error || !competition) throw new Error(error?.message ?? 'Failed to create competition')

  // Judging dates — columns added in migration 20260417000000.
  // Silently skipped if migration hasn't run yet.
  if (schedule.judgingOpenDate || schedule.judgingCloseDate) {
    await supabase
      .from('competitions')
      .update({
        judging_opens_at:  schedule.judgingOpenDate  ? toTs(schedule.judgingOpenDate)           : null,
        judging_closes_at: schedule.judgingCloseDate ? toTs(schedule.judgingCloseDate, true)    : null,
      })
      .eq('id', competition.id)
    // ignore error — schema may not have these columns yet
  }

  if (config.categories.length) {
    await supabase.from('competition_categories').insert(
      config.categories.map(name => ({ competition_id: competition.id, name }))
    )
  }

  revalidatePath('/admin/competitions')
  revalidatePath('/admin/competitions/templates')
  revalidatePath('/competitions')
}

// ─── Wizard: update schedule (edit flow) ──────────────────────────────────────

export async function updateCompetitionFromSchedule(id: string, args: {
  schedule: CompetitionSchedule
}) {
  const supabase = createServiceClient()
  const { schedule } = args

  const { error } = await supabase
    .from('competitions')
    .update({
      title:       schedule.instanceName,
      short_title: schedule.calendarTitle?.trim() || null,
      opens_at:    schedule.submissionsOpenDate  ? toTs(schedule.submissionsOpenDate)       : null,
      closes_at:   schedule.submissionsCloseDate ? toTs(schedule.submissionsCloseDate, true) : null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  // Judging dates — columns added in migration 20260417000000.
  // Silently skipped if migration hasn't run yet.
  if (schedule.judgingOpenDate || schedule.judgingCloseDate) {
    await supabase
      .from('competitions')
      .update({
        judging_opens_at:  schedule.judgingOpenDate  ? toTs(schedule.judgingOpenDate)           : null,
        judging_closes_at: schedule.judgingCloseDate ? toTs(schedule.judgingCloseDate, true)    : null,
      })
      .eq('id', id)
    // ignore error — schema may not have these columns yet
  }

  // ── Judge assignment from wizard selection ─────────────────────────────────
  const selectedJudgeIds = (schedule.judgeIds ?? []).filter(Boolean)
  if (selectedJudgeIds.length > 0) {
    // Remove any existing judge tokens first
    await supabase.from('judge_tokens').delete().eq('competition_id', id)

    const { data: comp } = await supabase
      .from('competitions')
      .select('title, judging_opens_at, judging_closes_at')
      .eq('id', id)
      .single()

    const { data: club } = await supabase.from('club_settings').select('club_name').single()
    const origin = await getOrigin()

    for (const memberId of selectedJudgeIds) {
      let judgeName  = ''
      let judgeEmail = ''

      if (memberId.startsWith('dir_')) {
        // Judge directory entry
        const dirId = memberId.slice(4)
        const { data: dirEntry } = await supabase
          .from('judge_directory')
          .select('name, email')
          .eq('id', dirId)
          .single()
        if (!dirEntry) continue
        judgeName  = dirEntry.name
        judgeEmail = dirEntry.email
      } else {
        // Club member profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', memberId)
          .single()
        if (!profile) continue
        const { data: authUser } = await supabase.auth.admin.getUserById(memberId)
        judgeEmail = authUser?.user?.email ?? ''
        judgeName  = [profile.first_name, profile.last_name].filter(Boolean).join(' ')
      }

      if (!judgeEmail) continue

      const { data: jt } = await supabase
        .from('judge_tokens')
        .insert({ competition_id: id, judge_name: judgeName, judge_email: judgeEmail })
        .select('token')
        .single()

      if (jt && comp && process.env.RESEND_API_KEY) {
        try {
          await sendJudgeInvitation({
            judgeEmail,
            judgeFirstName:   judgeName.split(' ')[0],
            competitionName:  comp.title,
            clubName:         club?.club_name ?? 'the club',
            judgingOpenDate:  fmtDate(comp.judging_opens_at),
            judgingCloseDate: fmtDate(comp.judging_closes_at),
            judgingUrl:       `${origin}/judge/${jt.token}`,
          })
          await supabase
            .from('judge_tokens')
            .update({ invitation_sent_at: new Date().toISOString() })
            .eq('token', jt.token)
        } catch (err) {
          console.warn('Judge invitation email failed:', err)
        }
      }
    }
  }

  // ── One-off judge (entered manually in wizard) ────────────────────────────
  const oneOff = schedule.judgeOneOff
  if (oneOff?.email && selectedJudgeIds.length === 0) {
    const judgeName  = [oneOff.firstName, oneOff.lastName].filter(Boolean).join(' ')
    const judgeEmail = oneOff.email.trim()

    if (oneOff.saveToDirectory) {
      await supabase
        .from('judge_directory')
        .upsert({ name: judgeName, email: judgeEmail }, { onConflict: 'email' })
    }

    const { data: comp } = await supabase
      .from('competitions')
      .select('title, judging_opens_at, judging_closes_at')
      .eq('id', id)
      .single()

    const { data: club } = await supabase.from('club_settings').select('club_name').single()
    const origin = await getOrigin()

    const { data: jt } = await supabase
      .from('judge_tokens')
      .insert({ competition_id: id, judge_name: judgeName, judge_email: judgeEmail })
      .select('token')
      .single()

    if (jt && comp && process.env.RESEND_API_KEY) {
      try {
        await sendJudgeInvitation({
          judgeEmail,
          judgeFirstName:   oneOff.firstName,
          competitionName:  comp.title,
          clubName:         club?.club_name ?? 'the club',
          judgingOpenDate:  fmtDate(comp.judging_opens_at),
          judgingCloseDate: fmtDate(comp.judging_closes_at),
          judgingUrl:       `${origin}/judge/${jt.token}`,
        })
        await supabase
          .from('judge_tokens')
          .update({ invitation_sent_at: new Date().toISOString() })
          .eq('token', jt.token)
      } catch (err) {
        console.warn('Judge invitation email failed:', err)
      }
    }
  }

  revalidatePath('/admin/competitions')
  revalidatePath(`/admin/competitions/${id}`)
  revalidatePath('/competitions')
}

// ─── Lifecycle: delete ────────────────────────────────────────────────────────

export async function deleteCompetition(id: string) {
  const supabase = createServiceClient()

  // Guard: no submissions allowed
  const { count } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('competition_id', id)

  if (count && count > 0) throw new Error('Cannot delete a competition that has submissions')

  // Notify judge if one is assigned
  const { data: judges } = await supabase
    .from('judge_tokens')
    .select('judge_name, judge_email')
    .eq('competition_id', id)

  const { data: comp } = await supabase
    .from('competitions')
    .select('title')
    .eq('id', id)
    .single()

  const { data: club } = await supabase.from('club_settings').select('club_name').single()

  if (judges?.length && comp && process.env.RESEND_API_KEY) {
    for (const judge of judges) {
      try {
        await sendJudgeCancellationNotification({
          judgeEmail:     judge.judge_email,
          judgeFirstName: judge.judge_name.split(' ')[0],
          competitionName: comp.title,
          clubName:        club?.club_name ?? 'the club',
        })
      } catch (err) {
        console.warn('Judge cancellation email failed:', err)
      }
    }
  }

  // Soft delete
  await supabase
    .from('competitions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/admin/competitions')
  revalidatePath('/competitions')
  redirect('/admin/competitions')
}

// ─── Lifecycle: cancel ────────────────────────────────────────────────────────

export async function cancelCompetition(id: string, reason: string) {
  const supabase = createServiceClient()

  const { data: comp } = await supabase
    .from('competitions')
    .select('title')
    .eq('id', id)
    .single()

  const { data: club } = await supabase.from('club_settings').select('club_name').single()

  // Notify members who submitted
  if (comp && process.env.RESEND_API_KEY) {
    const { data: submissions } = await supabase
      .from('submissions')
      .select('member_id')
      .eq('competition_id', id)

    const memberIds = [...new Set((submissions ?? []).map(s => s.member_id))]

    for (const memberId of memberIds) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', memberId)
          .single()

        const { data: authUser } = await supabase.auth.admin.getUserById(memberId)
        const email = authUser?.user?.email
        if (!email) continue

        await sendMemberCancellationNotification({
          memberEmail:        email,
          memberFirstName:    profile?.first_name ?? 'Member',
          competitionName:    comp.title,
          cancellationReason: reason,
          clubName:           club?.club_name ?? 'the club',
        })
      } catch (err) {
        console.warn('Member cancellation email failed:', err)
      }
    }

    // Notify judge
    const { data: judges } = await supabase
      .from('judge_tokens')
      .select('judge_name, judge_email')
      .eq('competition_id', id)

    for (const judge of judges ?? []) {
      try {
        await sendJudgeCancellationNotification({
          judgeEmail:      judge.judge_email,
          judgeFirstName:  judge.judge_name.split(' ')[0],
          competitionName: comp.title,
          clubName:        club?.club_name ?? 'the club',
        })
      } catch (err) {
        console.warn('Judge cancellation email failed:', err)
      }
    }
  }

  await supabase
    .from('competitions')
    .update({
      status:              'cancelled',
      cancelled_at:        new Date().toISOString(),
      cancellation_reason: reason,
    })
    .eq('id', id)

  revalidatePath('/admin/competitions')
  revalidatePath(`/admin/competitions/${id}`)
  revalidatePath('/competitions')
}

// ─── Lifecycle: archive / unarchive ──────────────────────────────────────────

export async function archiveCompetition(id: string) {
  const supabase = createServiceClient()

  // If the competition never concluded, release all submitted images back to members
  const { data: comp } = await supabase
    .from('competitions')
    .select('status')
    .eq('id', id)
    .single()

  const concluded = comp?.status === 'results_published' || comp?.status === 'closed'

  if (!concluded) {
    await supabase
      .from('submissions')
      .update({ status: 'withdrawn' })
      .eq('competition_id', id)
      .eq('status', 'submitted')
  }

  await supabase
    .from('competitions')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/admin/competitions')
  revalidatePath(`/admin/competitions/${id}`)
  revalidatePath('/competitions')
}

export async function unarchiveCompetition(id: string) {
  const supabase = createServiceClient()
  await supabase
    .from('competitions')
    .update({ archived_at: null })
    .eq('id', id)
  revalidatePath('/admin/competitions')
  revalidatePath(`/admin/competitions/${id}`)
  revalidatePath('/competitions')
}

// ─── Legacy template-based create ─────────────────────────────────────────────

export async function createCompetitionFromTemplate(args: {
  templateId:      string
  title:           string
  description:     string | null
  opensAt:         string | null
  closesAt:        string | null
  status:          CompetitionStatus
  judgeNames:      string[]
  submissionLimit: number
}) {
  const supabase = createServiceClient()

  const { data: competition, error } = await supabase
    .from('competitions')
    .insert({
      title:            args.title,
      description:      args.description,
      template_id:      args.templateId,
      submission_limit: args.submissionLimit,
      opens_at:         args.opensAt,
      closes_at:        args.closesAt,
      status:           args.status,
    })
    .select('id')
    .single()

  if (error || !competition) throw new Error(error?.message ?? 'Failed to create competition')

  const { data: tpl } = await supabase
    .from('competition_templates')
    .select('config')
    .eq('id', args.templateId)
    .single()

  const config     = tpl?.config as Record<string, unknown> | null
  const categories = (config?.categories as string[] | undefined) ?? []
  if (categories.length) {
    await supabase.from('competition_categories').insert(
      categories.map(name => ({ competition_id: competition.id, name }))
    )
  }

  revalidatePath('/admin/competitions')
  revalidatePath('/competitions')
}

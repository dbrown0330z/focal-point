'use server'

import { createServiceClient } from '@/lib/supabase/service'
import type { ProfileData, HistoryEntry } from '@/app/[clubSlug]/(member)/profile/page'

type AwardTierRaw = { id: string; label: string }

export async function getMemberPublicProfile(memberId: string): Promise<{
  profile:        ProfileData | null
  historyEntries: HistoryEntry[]
  showScores:     boolean
}> {
  const admin = createServiceClient()

  const [{ data: profileRaw }, { data: subsRaw }] = await Promise.all([
    admin
      .from('profiles')
      .select('first_name, last_name, display_name, bio, experience_level, shooting_interests, camera_brands, member_number, membership_class, membership_status, role, avatar_url, created_at, location, phone')
      .eq('id', memberId)
      .single(),
    admin
      .from('submissions')
      .select(`
        id,
        competition_id,
        image_id,
        images(title, storage_path),
        competition_categories(name),
        competitions(id, title, short_title, closes_at, status, award_types),
        scores(score, award_id)
      `)
      .eq('member_id', memberId)
      .eq('status', 'submitted'),
  ])

  if (!profileRaw) return { profile: null, historyEntries: [], showScores: false }

  // Check score visibility preference (default true)
  const showScores = (profileRaw as Record<string, unknown>).pref_show_scores_publicly !== false

  const historyEntries: HistoryEntry[] = (subsRaw ?? []).flatMap(sub => {
    const img    = sub.images as { title: string; storage_path: string } | null
    const cat    = sub.competition_categories as { name: string } | null
    const comp   = sub.competitions as unknown as {
      id: string; title: string; short_title: string | null;
      closes_at: string | null; status: string; award_types: AwardTierRaw[] | null
    } | null
    const scores = (sub.scores as { score: number; award_id: string | null }[] | null) ?? []

    if (!img || !comp) return []

    const avgScore   = scores.length ? scores.reduce((a, b) => a + b.score, 0) / scores.length : null
    const awardId    = scores.find(s => s.award_id)?.award_id ?? null
    const awardTypes = (comp.award_types ?? []) as AwardTierRaw[]
    const awardLabel = awardId ? (awardTypes.find(t => t.id === awardId)?.label ?? null) : null
    const year       = comp.closes_at ? new Date(comp.closes_at).getFullYear() : new Date().getFullYear()
    const publicUrl  = admin.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl

    return [{
      submissionId:     sub.id,
      imageId:          sub.image_id,
      imageTitle:       img.title,
      imageUrl:         publicUrl,
      competitionId:    comp.id,
      competitionTitle: comp.short_title ?? comp.title,
      categoryName:     cat?.name ?? '',
      score:            showScores && avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
      awardId,
      awardLabel,
      seasonYear:       year,
      closedAt:         comp.closes_at,
    }]
  })

  return { profile: profileRaw as ProfileData, historyEntries, showScores }
}

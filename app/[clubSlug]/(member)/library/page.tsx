import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug } from '@/lib/club-context'
import LibraryClient from './LibraryClient'

export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
  const clubSlug = await requireClubSlug()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()
  if (!user) redirect(`/${clubSlug}/login`)

  const { data: images, error } = await supabase
    .from('images')
    .select(`
      id, title, description, storage_path, created_at, exif_data,
      submissions!submissions_image_id_fkey(
        id, status,
        competitions!submissions_competition_id_fkey(title, opens_at, closes_at, archived_at),
        competition_categories!submissions_category_id_fkey(name),
        scores!scores_submission_id_fkey(score)
      )
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) console.error('[library] query error', error.message)

  // Open competition for the upload modal and quick-submit.
  // Only "truly open": opens_at in the past (or null) AND closes_at in the future (or null).
  const nowIso = new Date().toISOString()
  const { data: openCompsRaw } = await supabase
    .from('competitions')
    .select('id, title, opens_at, closes_at, submission_limit, competition_categories(id, name)')
    .eq('status', 'open')
    .is('deleted_at', null)
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  const openCompRaw = (openCompsRaw ?? []).find(c => {
    const cc = c as unknown as { opens_at: string | null; closes_at: string | null }
    return (!cc.opens_at || cc.opens_at <= nowIso) && (!cc.closes_at || cc.closes_at >= nowIso)
  }) ?? null

  let openCompetition = null
  if (openCompRaw) {
    const cats = (openCompRaw.competition_categories as unknown as { id: string; name: string }[]) ?? []
    const subLimit = (openCompRaw as unknown as { submission_limit: number | null }).submission_limit

    // Club-wide submission counts per category
    const { data: catSubsRaw } = await admin
      .from('submissions')
      .select('category_id')
      .eq('competition_id', openCompRaw.id)
      .eq('status', 'submitted')

    const catCounts: Record<string, number> = {}
    for (const s of catSubsRaw ?? []) {
      catCounts[s.category_id] = (catCounts[s.category_id] ?? 0) + 1
    }

    // Member's own submission count for this competition (to check against submission_limit)
    const { count: myCount } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('competition_id', openCompRaw.id)
      .eq('member_id', user.id)
      .eq('status', 'submitted')

    openCompetition = {
      id:               openCompRaw.id,
      title:            openCompRaw.title as string,
      submissionLimit:  subLimit ?? null,
      mySubmissionCount: myCount ?? 0,
      categories: cats.map(cat => ({
        id:    cat.id,
        name:  cat.name,
        count: catCounts[cat.id] ?? 0,
        limit: null as number | null, // per-category cap — null until DB field is added
      })),
    }
  }

  const imagesWithUrls = (images ?? []).map(image => {
    const subs      = Array.isArray(image.submissions) ? image.submissions : []
    const activeSub = subs.find((s: Record<string, unknown>) => {
      if (s.status !== 'submitted') return false
      const comp = s.competitions as { archived_at?: string | null } | null
      return !comp?.archived_at
    }) ?? null

    const rawScores = activeSub
      ? ((activeSub as Record<string, unknown>).scores as { score: number }[] ?? [])
      : []
    const avgScore = rawScores.length > 0
      ? Math.round(rawScores.reduce((a, b) => a + b.score, 0) / rawScores.length * 10) / 10
      : null

    const competition = activeSub
      ? (activeSub as Record<string, unknown>).competitions as { title: string; opens_at: string | null; closes_at: string | null } | null
      : null
    const category = activeSub
      ? (activeSub as Record<string, unknown>).competition_categories as { name: string } | null
      : null

    return {
      id:               image.id,
      title:            image.title,
      description:      image.description,
      storage_path:     image.storage_path,
      created_at:       image.created_at,
      exifData:         (image.exif_data ?? null) as Record<string, unknown> | null,
      publicUrl:        admin.storage.from('images').getPublicUrl(image.storage_path).data.publicUrl,
      isSubmitted:      !!activeSub,
      competitionTitle: competition?.title ?? null,
      competitionDate:  competition?.closes_at ?? competition?.opens_at ?? null,
      categoryName:     category?.name ?? null,
      score:            avgScore,
    }
  })

  return (
    <LibraryClient
      images={imagesWithUrls}
      clubSlug={clubSlug}
      userId={user.id}
      openCompetition={openCompetition}
    />
  )
}

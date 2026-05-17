import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import SubmitClient, { type CompetitionForSubmit, type LibraryImageForSubmit } from './SubmitClient'

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; category?: string }>
}) {
  const { competition: initialCompId, category: initialCatId } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createServiceClient()

  // ── Open competitions with their settings + categories ─────────────────────
  const { data: rawComps } = await admin
    .from('competitions')
    .select(`
      id, title, closes_at, submission_limit,
      competition_categories!competition_categories_competition_id_fkey(id, name)
    `)
    .eq('status', 'open')
    .is('deleted_at', null)
    .order('closes_at', { ascending: true, nullsFirst: false })

  // Fetch new columns separately to avoid TS type errors (types not regenerated yet)
  const compIds = (rawComps ?? []).map(c => c.id)
  const { data: compSettings } = compIds.length > 0
    ? await admin
        .from('competitions')
        .select('id, require_capture_date, capture_date_window_months, image_reuse_rule, withdrawal_frees_slot, max_entries_per_category, allow_notes_to_judge, max_long_edge')
        .in('id', compIds)
    : { data: [] }

  const settingsMap = Object.fromEntries(
    ((compSettings ?? []) as Record<string, unknown>[]).map(s => [s.id as string, s])
  )

  // ── Member's active submissions per competition/category ───────────────────
  const { data: mySubmissions } = await admin
    .from('submissions')
    .select('competition_id, category_id')
    .eq('member_id', user.id)
    .eq('status', 'submitted')

  const entriesByComp: Record<string, number> = {}
  const entriesByCompCat: Record<string, Record<string, number>> = {}
  for (const s of mySubmissions ?? []) {
    entriesByComp[s.competition_id] = (entriesByComp[s.competition_id] ?? 0) + 1
    if (!entriesByCompCat[s.competition_id]) entriesByCompCat[s.competition_id] = {}
    entriesByCompCat[s.competition_id][s.category_id] =
      (entriesByCompCat[s.competition_id][s.category_id] ?? 0) + 1
  }

  const competitions: CompetitionForSubmit[] = (rawComps ?? []).map(c => {
    const settings = settingsMap[c.id] ?? {}
    return {
      id:                       c.id,
      title:                    c.title,
      closesAt:                 c.closes_at,
      submissionLimit:          c.submission_limit,
      maxEntriesPerCategory:    (settings.max_entries_per_category as number | null) ?? null,
      imageReuseRule:           (settings.image_reuse_rule as string) ?? 'unrestricted',
      requireCaptureDate:       (settings.require_capture_date as boolean) ?? false,
      captureDateWindowMonths:  (settings.capture_date_window_months as number | null) ?? null,
      allowNotesToJudge:        (settings.allow_notes_to_judge as boolean) ?? true,
      maxLongEdge:              (settings.max_long_edge as number) ?? 1920,
      withdrawalFreesSlot:      (settings.withdrawal_frees_slot as boolean) ?? true,
      categories:               (c.competition_categories as { id: string; name: string }[]) ?? [],
      entriesUsed:              entriesByComp[c.id] ?? 0,
      entriesByCategory:        entriesByCompCat[c.id] ?? {},
    }
  })

  // ── Library images with active submission status ───────────────────────────
  const { data: rawImages } = await admin
    .from('images')
    .select(`
      id, title, storage_path, created_at, exif_data,
      submissions!submissions_image_id_fkey(
        id, status,
        competitions!submissions_competition_id_fkey(id, title),
        competition_categories!submissions_category_id_fkey(name)
      )
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch new image columns separately
  const imageIds = (rawImages ?? []).map(i => i.id)
  const { data: imageExtras } = imageIds.length > 0
    ? await admin
        .from('images')
        .select('id, file_size, width_px, height_px, exif_unique_id')
        .in('id', imageIds)
    : { data: [] }

  const imageExtrasMap = Object.fromEntries(
    ((imageExtras ?? []) as Record<string, unknown>[]).map(e => [e.id as string, e])
  )

  const libraryImages: LibraryImageForSubmit[] = (rawImages ?? []).map(img => {
    const subs  = Array.isArray(img.submissions) ? img.submissions as Record<string, unknown>[] : []
    const activeSub = subs.find(s => s.status === 'submitted') ?? null
    const extras = imageExtrasMap[img.id] ?? {}

    const exifData = (img.exif_data ?? null) as Record<string, unknown> | null
    const captureRaw = exifData?.DateTimeOriginal
    const captureDate = captureRaw
      ? (captureRaw instanceof Date ? captureRaw.toISOString() : String(captureRaw))
      : null

    return {
      id:           img.id,
      title:        img.title,
      publicUrl:    admin.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl,
      createdAt:    img.created_at,
      fileSize:     (extras.file_size as number | null) ?? null,
      widthPx:      (extras.width_px as number | null) ?? null,
      heightPx:     (extras.height_px as number | null) ?? null,
      exifUniqueId: (extras.exif_unique_id as string | null) ?? null,
      captureDate,
      activeSubmission: activeSub
        ? {
            competitionId:    (activeSub.competitions as Record<string, unknown>)?.id as string,
            competitionTitle: (activeSub.competitions as Record<string, unknown>)?.title as string,
            categoryName:     (activeSub.competition_categories as Record<string, unknown>)?.name as string,
          }
        : null,
    }
  })

  return (
    <SubmitClient
      competitions={competitions}
      libraryImages={libraryImages}
      userId={user.id}
      initialCompetitionId={initialCompId ?? null}
      initialCategoryId={initialCatId ?? null}
    />
  )
}

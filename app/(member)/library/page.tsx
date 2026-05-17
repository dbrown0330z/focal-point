import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import LibraryClient from './LibraryClient'

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createServiceClient()
  const { data: images, error } = await admin
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

  const imagesWithUrls = (images ?? []).map(image => {
    const subs     = Array.isArray(image.submissions) ? image.submissions : []
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

  return <LibraryClient images={imagesWithUrls} />
}

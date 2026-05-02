import { createClient } from '@/lib/supabase/server'
import CompetitionsClient from './CompetitionsClient'

export const dynamic = 'force-dynamic'

export default async function CompetitionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Current competitions: open or judging
  const { data: currentRaw } = await supabase
    .from('competitions')
    .select('id, title, short_title, status, closes_at, results_at, submission_limit, competition_categories(id, name), judge_tokens(judge_name)')
    .in('status', ['open', 'judging'])
    .is('archived_at', null)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // For each current competition, fetch member submissions and club stats
  const currentCompetitions = await Promise.all(
    (currentRaw ?? []).map(async comp => {
      const mySubmissions = user ? await (async () => {
        const { data } = await supabase
          .from('submissions')
          .select('id, image_id, category_id, images(title, storage_path), competition_categories(name)')
          .eq('competition_id', comp.id)
          .eq('member_id', user.id)
          .eq('status', 'submitted')
        return (data ?? []).map(s => {
          const img = s.images as unknown as { title: string; storage_path: string }
          const cat = s.competition_categories as unknown as { name: string }
          return {
            id: s.id,
            imageId: s.image_id,
            categoryId: s.category_id,
            categoryName: cat?.name ?? '',
            imageTitle: img?.title ?? '',
            publicUrl: supabase.storage.from('images').getPublicUrl(img?.storage_path ?? '').data.publicUrl,
          }
        })
      })() : []

      const { data: allSubs } = await supabase
        .from('submissions')
        .select('member_id, category_id, competition_categories(name)')
        .eq('competition_id', comp.id)
        .eq('status', 'submitted')

      const subs = allSubs ?? []
      const totalImages = subs.length
      const memberSet = new Set(subs.map(s => s.member_id))
      const membersEntered = memberSet.size

      const byCat: Record<string, { name: string; count: number }> = {}
      for (const sub of subs) {
        const cat = sub.competition_categories as unknown as { name: string } | null
        const key = sub.category_id
        if (!byCat[key]) byCat[key] = { name: cat?.name ?? 'Unknown', count: 0 }
        byCat[key].count++
      }

      const tokens = comp.judge_tokens as unknown as { judge_name: string }[] | null

      return {
        id: comp.id,
        title: (comp as unknown as { short_title: string | null }).short_title ?? comp.title,
        status: comp.status,
        closes_at: comp.closes_at,
        results_at: (comp as unknown as { results_at: string | null }).results_at ?? null,
        submission_limit: comp.submission_limit,
        categoryLimit: null as number | null, // TODO: add per-category limit to competition_categories table
        categories: (comp.competition_categories as unknown as { id: string; name: string }[]) ?? [],
        judgeName: tokens?.[0]?.judge_name ?? null,
        mySubmissions,
        clubStats: { totalImages, membersEntered, byCat: Object.values(byCat) },
      }
    })
  )

  // Library images: exclude any image already submitted to any active competition
  const allSubmittedImageIds = new Set(
    currentCompetitions.flatMap(c => c.mySubmissions.map(s => s.imageId))
  )

  const libraryImages = user ? await (async () => {
    const { data: imgs } = await supabase
      .from('images')
      .select('id, title, storage_path, created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    return (imgs ?? [])
      .filter(img => !allSubmittedImageIds.has(img.id))
      .map(img => ({
        id: img.id,
        title: img.title,
        storage_path: img.storage_path,
        created_at: img.created_at,
        publicUrl: supabase.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl,
      }))
  })() : []

  // Previous competitions: closed only
  const { data: pastRaw } = await supabase
    .from('competitions')
    .select('id, title, status, closes_at, judge_tokens(judge_name)')
    .eq('status', 'closed')
    .is('deleted_at', null)
    .order('closes_at', { ascending: false })

  const previousCompetitions = await Promise.all(
    (pastRaw ?? []).map(async comp => {
      const { count } = await supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('competition_id', comp.id)
        .eq('status', 'submitted')

      const tokens = comp.judge_tokens as unknown as { judge_name: string }[] | null

      return {
        id: comp.id,
        title: comp.title,
        status: comp.status,
        closes_at: comp.closes_at,
        imageCount: count ?? 0,
        judgeName: tokens?.[0]?.judge_name ?? null,
      }
    })
  )

  return (
    <CompetitionsClient
      userId={user?.id ?? ''}
      currentCompetitions={currentCompetitions}
      previousCompetitions={previousCompetitions}
      libraryImages={libraryImages}
    />
  )
}

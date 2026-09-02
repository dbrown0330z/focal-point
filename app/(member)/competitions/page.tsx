import { createClient } from '@/lib/supabase/server'
import CompetitionsClient from './CompetitionsClient'

export default async function CompetitionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Current open competition with categories and judge
  const { data: compRaw } = await supabase
    .from('competitions')
    .select('id, title, status, closes_at, submission_limit, competition_categories(id, name), judge_tokens(judge_name)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const competition = compRaw ?? null

  // Member's active submissions for current competition
  const mySubmissions = competition && user ? await (async () => {
    const { data } = await supabase
      .from('submissions')
      .select('id, image_id, category_id, images(title, storage_path), competition_categories(name)')
      .eq('competition_id', competition.id)
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

  // Club-wide stats for current competition
  const clubStats = competition ? await (async () => {
    const { data: allSubs } = await supabase
      .from('submissions')
      .select('member_id, category_id, competition_categories(name)')
      .eq('competition_id', competition.id)
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

    return { totalImages, membersEntered, byCat: Object.values(byCat) }
  })() : { totalImages: 0, membersEntered: 0, byCat: [] }

  // Library images available for submission (exclude any already in an active submission)
  const libraryImages = competition && user ? await (async () => {
    const { data: imgs } = await supabase
      .from('images')
      .select('id, title, storage_path, created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    // IDs already submitted anywhere
    const { data: activeSubs } = await supabase
      .from('submissions')
      .select('image_id')
      .eq('member_id', user.id)
      .eq('status', 'submitted')

    const submittedIds = new Set(activeSubs?.map(s => s.image_id) ?? [])

    return (imgs ?? [])
      .filter(img => !submittedIds.has(img.id))
      .map(img => ({
        id: img.id,
        title: img.title,
        storage_path: img.storage_path,
        created_at: img.created_at,
        publicUrl: supabase.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl,
      }))
  })() : []

  // Past competitions (judging / closed) with submission counts and judge names
  const { data: pastRaw } = await supabase
    .from('competitions')
    .select('id, title, status, closes_at, judge_tokens(judge_name)')
    .in('status', ['judging', 'closed'])
    .order('closes_at', { ascending: false })

  const pastCompetitions = await Promise.all(
    (pastRaw ?? []).map(async comp => {
      const { count } = await supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('competition_id', comp.id)
        .eq('status', 'submitted')

      const tokens = comp.judge_tokens as unknown as { judge_name: string }[] | null
      const judgeName = tokens?.[0]?.judge_name ?? null

      return {
        id: comp.id,
        title: comp.title,
        status: comp.status,
        closes_at: comp.closes_at,
        imageCount: count ?? 0,
        judgeName,
      }
    })
  )

  // Normalize competition shape for client
  const currentCompetition = competition ? {
    id: competition.id,
    title: competition.title,
    status: competition.status,
    closes_at: competition.closes_at,
    submission_limit: competition.submission_limit,
    categories: (competition.competition_categories as unknown as { id: string; name: string }[]) ?? [],
    judgeName: ((competition.judge_tokens as unknown as { judge_name: string }[] | null)?.[0]?.judge_name) ?? null,
  } : null

  return (
    <CompetitionsClient
      userId={user?.id ?? ''}
      competition={currentCompetition}
      mySubmissions={mySubmissions}
      clubStats={clubStats}
      libraryImages={libraryImages}
      pastCompetitions={pastCompetitions}
    />
  )
}

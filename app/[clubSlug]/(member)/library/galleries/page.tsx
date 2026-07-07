import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug, getClubContext } from '@/lib/club-context'
import GalleriesClient from './GalleriesClient'

export const dynamic = 'force-dynamic'

export type GalleryData = {
  id:             string
  name:           string
  slug:           string
  visibility:     'public' | 'members_only' | 'private'
  gallery_type:   'standard' | 'dynamic'
  cover_image_id: string | null
  coverImageUrl:  string | null
  imageCount:     number
}

export default async function MyGalleriesPage() {
  const clubSlug = await requireClubSlug()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${clubSlug}/login`)

  const ctx   = await getClubContext()
  const admin = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any

  // ── Member's galleries ────────────────────────────────────────────────────
  let { data: galleriesRaw } = await adminAny
    .from('member_galleries')
    .select('id, name, slug, visibility, gallery_type, cover_image_id, image_ids')
    .eq('member_id', user.id)
    .eq('club_id', ctx!.clubId)
    .order('created_at', { ascending: false })

  // ── Auto-create default gallery on first visit ────────────────────────────
  if (!galleriesRaw || galleriesRaw.length === 0) {
    // 1. Fetch first_name
    const { data: profileRaw } = await admin
      .from('profiles')
      .select('first_name')
      .eq('id', user.id)
      .single()
    const firstName = (profileRaw as { first_name: string | null } | null)?.first_name ?? null

    // 2. Fetch all scored submissions for the user
    const { data: subsRaw } = await adminAny
      .from('submissions')
      .select('image_id, scores(score)')
      .eq('member_id', user.id)
      .eq('status', 'submitted')

    // 3. Build map of image_id → average score
    const avgScoreMap: Record<string, number> = {}
    for (const sub of (subsRaw ?? []) as { image_id: string; scores: { score: number }[] | null }[]) {
      const scores = sub.scores ?? []
      if (scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b.score, 0) / scores.length
        avgScoreMap[sub.image_id] = avg
      }
    }

    // 4. Compute scoreMin: median of average scores, or 5 if none
    const allAvgScores = Object.values(avgScoreMap).sort((a, b) => a - b)
    let scoreMin: number
    if (allAvgScores.length > 0) {
      const medianVal = allAvgScores[Math.floor(allAvgScores.length / 2)]
      scoreMin = Math.round(medianVal)
    } else {
      scoreMin = 5
    }

    // 5. Filter to images with avgScore >= scoreMin
    const defaultImageIds = Object.entries(avgScoreMap)
      .filter(([, avg]) => avg >= scoreMin)
      .map(([id]) => id)

    // 6. Build gallery name
    const galleryName = firstName ? `${firstName}'s Best Images` : 'My Best Images'

    // 7. Slugify and check uniqueness
    let gallerySlug = galleryName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    const { data: existingSlugs } = await adminAny
      .from('member_galleries')
      .select('slug')
      .eq('member_id', user.id)
      .eq('club_id', ctx!.clubId)
    const existingSlugSet = new Set(
      ((existingSlugs ?? []) as { slug: string }[]).map(r => r.slug)
    )
    if (existingSlugSet.has(gallerySlug)) {
      let suffix = 1
      while (existingSlugSet.has(`${gallerySlug}-${suffix}`)) suffix++
      gallerySlug = `${gallerySlug}-${suffix}`
    }

    // 8. Insert the gallery
    await adminAny.from('member_galleries').insert({
      club_id:        ctx!.clubId,
      member_id:      user.id,
      name:           galleryName,
      slug:           gallerySlug,
      visibility:     'private',
      gallery_type:   'dynamic',
      filters:        { scoreMin, scoreMax: 10, categories: [], timeframe: 'all_years' },
      image_ids:      defaultImageIds,
      cover_image_id: defaultImageIds[0] ?? null,
    })

    // 9. Re-fetch galleries after insert
    const { data: refetched } = await adminAny
      .from('member_galleries')
      .select('id, name, slug, visibility, gallery_type, cover_image_id, image_ids')
      .eq('member_id', user.id)
      .eq('club_id', ctx!.clubId)
      .order('created_at', { ascending: false })
    galleriesRaw = refetched
  }

  const galleries: GalleryData[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const g of (galleriesRaw ?? []) as any[]) {
    const ids = (g.image_ids as string[]) ?? []
    let coverUrl: string | null = null
    const coverId = (g.cover_image_id as string | null) ?? ids[0] ?? null
    if (coverId) {
      const { data: img } = await admin.from('images').select('storage_path').eq('id', coverId).single()
      if (img?.storage_path) {
        coverUrl = admin.storage.from('images').getPublicUrl(img.storage_path as string).data.publicUrl
      }
    }
    galleries.push({
      id:             g.id as string,
      name:           g.name as string,
      slug:           g.slug as string,
      visibility:     g.visibility as 'public' | 'members_only' | 'private',
      gallery_type:   (g.gallery_type as 'standard' | 'dynamic') ?? 'standard',
      cover_image_id: g.cover_image_id as string | null,
      coverImageUrl:  coverUrl,
      imageCount:     ids.length,
    })
  }

  // ── Does this member have any library images? ─────────────────────────────
  const { count: imgCount } = await adminAny
    .from('images')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .eq('club_id', ctx!.clubId)
  const hasImages = (imgCount ?? 0) > 0

  return (
    <GalleriesClient
      clubSlug={clubSlug}
      userId={user.id}
      galleries={galleries}
      hasImages={hasImages}
    />
  )
}

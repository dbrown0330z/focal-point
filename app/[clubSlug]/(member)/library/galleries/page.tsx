import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug, getClubContext } from '@/lib/club-context'
import GalleriesClient from './GalleriesClient'

export const dynamic = 'force-dynamic'

export type GalleryImage = {
  id:         string
  title:      string
  publicUrl:  string
  created_at: string
}

export type CompImage = {
  imageId:         string
  title:           string
  publicUrl:       string
  competitionName: string
  categoryName:    string | null
  score:           number | null
}

export type GalleryData = {
  id:             string
  name:           string
  slug:           string
  visibility:     'public' | 'members_only' | 'private'
  cover_image_id: string | null
  coverImageUrl:  string | null
  image_ids:      string[]
  imageCount:     number
}

export type MemberProfile = {
  displayName: string
}

export default async function MyGalleriesPage() {
  const clubSlug = await requireClubSlug()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${clubSlug}/login`)

  const ctx      = await getClubContext()
  const admin    = createServiceClient()

  // ── Member display name ───────────────────────────────────────────────────
  const { data: profile } = await admin
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Member'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any

  // ── Member's galleries ────────────────────────────────────────────────────
  const { data: galleriesRaw } = await adminAny
    .from('member_galleries')
    .select('id, name, slug, visibility, cover_image_id, image_ids')
    .eq('member_id', user.id)
    .eq('club_id', ctx!.clubId)
    .order('created_at', { ascending: false })

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
      cover_image_id: g.cover_image_id as string | null,
      coverImageUrl:  coverUrl,
      image_ids:      ids,
      imageCount:     ids.length,
    })
  }

  // ── Library images (for picker) ───────────────────────────────────────────
  const { data: libRaw } = await admin
    .from('images')
    .select('id, title, storage_path, created_at')
    .eq('owner_id', user.id)
    .eq('club_id', ctx!.clubId)
    .order('created_at', { ascending: false })

  const libraryImages: GalleryImage[] = (libRaw ?? []).map(img => ({
    id:         img.id as string,
    title:      img.title as string,
    publicUrl:  admin.storage.from('images').getPublicUrl(img.storage_path as string).data.publicUrl,
    created_at: img.created_at as string,
  }))

  // ── Competition submission images (for picker) ────────────────────────────
  const { data: subsRaw } = await admin
    .from('submissions')
    .select(`
      image_id,
      images!submissions_image_id_fkey(title, storage_path),
      competitions!submissions_competition_id_fkey(title),
      competition_categories!submissions_category_id_fkey(name),
      scores!scores_submission_id_fkey(score)
    `)
    .eq('member_id', user.id)
    .eq('club_id', ctx!.clubId)
    .order('submitted_at', { ascending: false })

  const seen = new Set<string>()
  const compImages: CompImage[] = []
  for (const s of (subsRaw ?? []) as unknown[]) {
    const sub = s as {
      image_id:               string
      images:                 { title: string; storage_path: string } | null
      competitions:           { title: string } | null
      competition_categories: { name: string } | null
      scores:                 { score: number }[]
    }
    if (!sub.images || seen.has(sub.image_id)) continue
    seen.add(sub.image_id)
    const scores = (sub.scores ?? []).map(r => r.score)
    const avg    = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null
    compImages.push({
      imageId:         sub.image_id,
      title:           sub.images.title,
      publicUrl:       admin.storage.from('images').getPublicUrl(sub.images.storage_path).data.publicUrl,
      competitionName: sub.competitions?.title ?? '',
      categoryName:    sub.competition_categories?.name ?? null,
      score:           avg !== null ? Math.round(avg * 10) / 10 : null,
    })
  }

  return (
    <GalleriesClient
      clubSlug={clubSlug}
      userId={user.id}
      displayName={displayName}
      galleries={galleries}
      libraryImages={libraryImages}
      compImages={compImages}
    />
  )
}

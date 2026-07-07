import { redirect }           from 'next/navigation'
import { createClient }        from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug, getClubContext } from '@/lib/club-context'
import DynamicGalleryPage      from './DynamicGalleryPage'
import type { DynamicFilters } from '../../actions'

export const dynamic = 'force-dynamic'

export type ScoredImage = {
  id:           string
  title:        string
  publicUrl:    string
  score:        number | null
  categoryName: string | null
  createdAt:    string
}

export type DynamicGalleryRecord = {
  id:         string
  name:       string
  slug:       string
  visibility: 'public' | 'members_only' | 'private'
  filters:    DynamicFilters | null
  clubName:   string
}

export default async function DynamicGalleryRoute({
  params,
}: {
  params: Promise<{ clubSlug: string; id: string }>
}) {
  const { id } = await params
  const clubSlug = await requireClubSlug()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${clubSlug}/login`)

  const ctx   = await getClubContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createServiceClient() as any

  // ── Gallery record ────────────────────────────────────────────────────────
  const { data: gallery } = await admin
    .from('member_galleries')
    .select('id, name, slug, visibility, filters')
    .eq('id', id)
    .eq('member_id', user.id)
    .eq('gallery_type', 'dynamic')
    .single()

  if (!gallery) redirect(`/${clubSlug}/library/galleries`)

  // ── All competition submissions by this member with scores + categories ───
  const { data: subsRaw } = await admin
    .from('submissions')
    .select(`
      image_id,
      images!submissions_image_id_fkey(id, title, storage_path, created_at),
      competition_categories!submissions_category_id_fkey(name),
      scores!scores_submission_id_fkey(score)
    `)
    .eq('member_id', user.id)
    .eq('club_id', ctx!.clubId)

  const seen = new Set<string>()
  const images: ScoredImage[] = []

  for (const s of (subsRaw ?? []) as unknown[]) {
    const sub = s as {
      image_id:               string
      images:                 { id: string; title: string; storage_path: string; created_at: string } | null
      competition_categories: { name: string } | null
      scores:                 { score: number }[]
    }
    if (!sub.images || seen.has(sub.image_id)) continue
    seen.add(sub.image_id)

    const scores  = (sub.scores ?? []).map(r => r.score)
    const avg     = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null
    images.push({
      id:           sub.image_id,
      title:        sub.images.title,
      publicUrl:    admin.storage.from('images').getPublicUrl(sub.images.storage_path).data.publicUrl,
      score:        avg !== null ? Math.round(avg * 10) / 10 : null,
      categoryName: sub.competition_categories?.name ?? null,
      createdAt:    sub.images.created_at,
    })
  }

  const galleryRecord: DynamicGalleryRecord = {
    id:         gallery.id as string,
    name:       gallery.name as string,
    slug:       gallery.slug as string,
    visibility: (gallery.visibility as 'public' | 'members_only' | 'private') ?? 'private',
    filters:    (gallery.filters as DynamicFilters | null) ?? null,
    clubName:   ctx?.clubName ?? '',
  }

  return (
    <DynamicGalleryPage
      clubSlug={clubSlug}
      gallery={galleryRecord}
      images={images}
    />
  )
}

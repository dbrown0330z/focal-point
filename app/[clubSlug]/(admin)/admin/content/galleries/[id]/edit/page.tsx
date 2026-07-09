import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug, getClubContext } from '@/lib/club-context'
import AdminDynamicGalleryPage from './AdminDynamicGalleryPage'
import type { AdminGalleryFilters } from '../../actions'

export const dynamic = 'force-dynamic'

export type AdminScoredImage = {
  id:           string
  publicUrl:    string
  title:        string
  score:        number | null
  categoryName: string | null
  memberName:   string
  memberId:     string
  createdAt:    string
}

export type AdminGalleryRecord = {
  id:         string
  name:       string
  slug:       string
  visibility: 'draft' | 'members_only' | 'public'
  filters:    AdminGalleryFilters | null
  imageIds:   string[]
}

export default async function AdminGalleryEditPage({
  params,
}: {
  params: Promise<{ clubSlug: string; id: string }>
}) {
  const { id } = await params
  const clubSlug = await requireClubSlug()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${clubSlug}/login`)

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role?: string } | null)?.role !== 'admin') redirect(`/${clubSlug}/admin`)

  const ctx   = await getClubContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createServiceClient() as any

  // ── Gallery record ─────────────────────────────────────────────────────────
  const { data: galleryRaw } = await admin
    .from('club_galleries')
    .select('id, name, slug, visibility, filters, image_ids')
    .eq('id', id)
    .eq('club_id', ctx!.clubId)
    .single()

  if (!galleryRaw) redirect(`/${clubSlug}/admin/content/navigation`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = galleryRaw as any
  const gallery: AdminGalleryRecord = {
    id:         g.id as string,
    name:       g.name as string,
    slug:       g.slug as string,
    visibility: (g.visibility as 'draft' | 'members_only' | 'public') ?? 'draft',
    filters:    (g.filters as AdminGalleryFilters | null) ?? null,
    imageIds:   (g.image_ids as string[] | null) ?? [],
  }

  // ── All scored submissions for this club ───────────────────────────────────
  const { data: subsRaw } = await admin
    .from('submissions')
    .select(`
      id, member_id,
      images!submissions_image_id_fkey(id, title, storage_path, created_at),
      scores!scores_submission_id_fkey(score),
      competition_categories!submissions_category_id_fkey(name),
      competitions!submissions_competition_id_fkey(title, club_id),
      profiles!submissions_member_id_fkey(display_name, first_name, last_name)
    `)
    .eq('club_id', ctx!.clubId)

  const seen = new Set<string>()
  const images: AdminScoredImage[] = []

  for (const s of ((subsRaw ?? []) as unknown[])) {
    const sub = s as {
      id:                     string
      member_id:              string
      images:                 { id: string; title: string; storage_path: string; created_at: string } | null
      scores:                 { score: number }[]
      competition_categories: { name: string } | null
      competitions:           { title: string; club_id: string } | null
      profiles:               { display_name?: string; first_name?: string; last_name?: string } | null
    }

    if (!sub.images) continue
    // Deduplicate by image id — keep first occurrence (most recent submission)
    const imageId = sub.images.id
    if (seen.has(imageId)) continue
    seen.add(imageId)

    const scores  = (sub.scores ?? []).map(r => r.score)
    const avg     = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null

    const p = sub.profiles
    const memberName = p?.display_name
      ?? [p?.first_name, p?.last_name].filter(Boolean).join(' ')
      ?? 'Member'

    images.push({
      id:           imageId,
      title:        sub.images.title,
      publicUrl:    admin.storage.from('images').getPublicUrl(sub.images.storage_path).data.publicUrl,
      score:        avg !== null ? Math.round(avg * 10) / 10 : null,
      categoryName: sub.competition_categories?.name ?? null,
      memberName,
      memberId:     sub.member_id,
      createdAt:    sub.images.created_at,
    })
  }

  // ── Club members ───────────────────────────────────────────────────────────
  const { data: membershipRows } = await admin
    .from('club_memberships')
    .select('user_id')
    .eq('club_id', ctx!.clubId)
    .eq('membership_status', 'active')

  const memberIds = ((membershipRows ?? []) as { user_id: string }[]).map(m => m.user_id)
  const members: { id: string; displayName: string }[] = []

  if (memberIds.length > 0) {
    const { data: memberProfiles } = await admin
      .from('profiles')
      .select('id, first_name, last_name, display_name')
      .in('id', memberIds)

    for (const p of ((memberProfiles ?? []) as { id: string; first_name?: string; last_name?: string; display_name?: string }[])) {
      members.push({
        id:          p.id,
        displayName: p.display_name
          ?? [p.first_name, p.last_name].filter(Boolean).join(' ')
          ?? 'Member',
      })
    }
  }

  return (
    <AdminDynamicGalleryPage
      clubSlug={clubSlug}
      gallery={gallery}
      images={images}
      members={members}
    />
  )
}

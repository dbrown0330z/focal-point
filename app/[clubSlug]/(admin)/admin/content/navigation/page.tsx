import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import NavigationClient, { type CustomPage, type CustomTab } from './NavigationClient'
import type { ClubGalleryData, SubmissionOption } from '../galleries/ClubGalleriesTab'
import { DEFAULT_BLOCKS, mergeBlocks, type ContentBlock } from '@/lib/homepage/types'

export const dynamic = 'force-dynamic'

export default async function NavigationPage() {
  const supabase = await createClient()
  const admin    = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any
  const ctx      = await getClubContext()

  const [{ data: customPages }, { data: customTabs }, { data: clubSettings }] = await Promise.all([
    admin.from('nav_custom_pages').select('id,title,slug,parent_system,tab_id,page_type,external_url,visibility,status,sort_order,updated_at').order('sort_order'),
    admin.from('nav_custom_tabs').select('*').order('sort_order'),
    admin.from('club_settings').select('homepage_blocks').single(),
  ])

  const saved: ContentBlock[] = (clubSettings?.homepage_blocks as ContentBlock[] | null) ?? DEFAULT_BLOCKS
  const homepageBlocks: ContentBlock[] = mergeBlocks(saved, DEFAULT_BLOCKS)

  // ── Club galleries ──────────────────────────────────────────────────────────
  const { data: galleriesRaw } = await adminAny
    .from('club_galleries')
    .select(`
      id, name, slug, description, visibility,
      featured_on_homepage, archived_at, cover_submission_id,
      cover_sub:submissions!club_galleries_cover_submission_id_fkey(
        images!submissions_image_id_fkey(storage_path)
      ),
      club_gallery_images(
        id, submission_id, sort_order,
        submissions!club_gallery_images_submission_id_fkey(
          images!submissions_image_id_fkey(id, title, storage_path)
        )
      )
    `)
    .eq('club_id', ctx!.clubId)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const galleries: ClubGalleryData[] = ((galleriesRaw ?? []) as any[]).map((g: any) => {
    const raw = g as {
      id: string; name: string; slug: string; description: string | null;
      visibility: string; featured_on_homepage: boolean; archived_at: string | null;
      cover_submission_id: string | null;
      cover_sub?: { images?: { storage_path?: string } | null } | null;
      club_gallery_images?: {
        id: string; submission_id: string; sort_order: number;
        submissions?: { images?: { id: string; title: string; storage_path: string } | null } | null
      }[]
    }
    const coverPath = raw.cover_sub?.images?.storage_path ?? null
    const coverUrl  = coverPath ? admin.storage.from('images').getPublicUrl(coverPath).data.publicUrl : null
    const imgs = (raw.club_gallery_images ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(row => {
        const img = row.submissions?.images
        if (!img) return null
        return {
          galleryImageId: row.id,
          submissionId:   row.submission_id,
          imageUrl:       admin.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl,
          title:          img.title,
          sortOrder:      row.sort_order,
        }
      }).filter(Boolean) as ClubGalleryData['images']
    return {
      id:                   raw.id,
      name:                 raw.name,
      slug:                 raw.slug,
      description:          raw.description,
      visibility:           raw.visibility as 'public' | 'members_only',
      featured_on_homepage: raw.featured_on_homepage,
      archived_at:          raw.archived_at,
      cover_submission_id:  raw.cover_submission_id,
      coverUrl,
      imageCount:           imgs.length,
      images:               imgs,
    }
  })

  // ── All competition submissions (for adding to club galleries) ────────────
  const { data: subsRaw } = await admin
    .from('submissions')
    .select(`
      id,
      images!submissions_image_id_fkey(title, storage_path),
      competitions!submissions_competition_id_fkey(title),
      profiles!submissions_member_id_fkey(display_name)
    `)
    .eq('club_id', ctx!.clubId)
    .order('submitted_at', { ascending: false })

  const submissions: SubmissionOption[] = (subsRaw ?? []).map(s => {
    const sub = s as {
      id: string
      images?: { title: string; storage_path: string } | null
      competitions?: { title: string } | null
      profiles?: { display_name: string } | null
    }
    if (!sub.images) return null
    return {
      id:              sub.id,
      imageUrl:        admin.storage.from('images').getPublicUrl(sub.images.storage_path).data.publicUrl,
      title:           sub.images.title,
      competitionName: sub.competitions?.title ?? '',
      memberName:      sub.profiles?.display_name ?? '',
    }
  }).filter(Boolean) as SubmissionOption[]

  return (
    <NavigationClient
      customPages={(customPages ?? []) as unknown as CustomPage[]}
      customTabs={(customTabs ?? []) as unknown as CustomTab[]}
      initialHomepageBlocks={homepageBlocks}
      initialGalleries={galleries}
      submissions={submissions}
    />
  )
}

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import { Box, Typography } from '@mui/material'
import ClubGalleryCard from './ClubGalleryCard'

export const dynamic = 'force-dynamic'

export default async function ClubGalleriesPage() {
  const ctx      = await getClubContext()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin    = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any

  // Fetch published club galleries (members_only or public)
  const { data: galleriesRaw } = await adminAny
    .from('club_galleries')
    .select('id, name, slug, image_ids, visibility, filters')
    .eq('club_id', ctx!.clubId)
    .in('visibility', user ? ['members_only', 'public'] : ['public'])
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  // Build gallery list with cover URL from first image_id
  const galleries = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((galleriesRaw ?? []) as any[]).map(async (g: any) => {
      const imageIds: string[] = Array.isArray(g.image_ids) ? g.image_ids : []
      let coverUrl: string | null = null

      if (imageIds.length > 0) {
        const { data: imgRow } = await adminAny
          .from('images')
          .select('storage_path')
          .eq('id', imageIds[0])
          .single()
        if (imgRow?.storage_path) {
          coverUrl = admin.storage.from('images').getPublicUrl(imgRow.storage_path as string).data.publicUrl
        }
      }

      return {
        id:         g.id as string,
        name:       g.name as string,
        slug:       g.slug as string,
        imageCount: imageIds.length,
        coverUrl,
        filters:    g.filters ?? null,
      }
    })
  )

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <h1 style={{
          fontFamily:    'var(--font-heading)',
          fontSize:      28,
          fontWeight:    700,
          letterSpacing: '-0.02em',
          color:         'var(--text-primary)',
          margin:        '0 0 4px',
        }}>
          Club Galleries
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
          Curated image collections from our club.
        </p>
      </Box>

      {galleries.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography>No galleries published yet.</Typography>
        </Box>
      ) : (
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap:                 24,
        }}>
          {galleries.map(g => (
            <ClubGalleryCard
              key={g.id}
              gallery={g}
              clubSlug={ctx!.clubSlug}
            />
          ))}
        </div>
      )}
    </Box>
  )
}

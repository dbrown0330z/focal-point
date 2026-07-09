import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import Link from 'next/link'
import { Box, Typography } from '@mui/material'

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
    .select('id, name, slug, description, image_ids, visibility')
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
        id:          g.id as string,
        name:        g.name as string,
        slug:        g.slug as string,
        description: g.description as string | null,
        imageCount:  imageIds.length,
        coverUrl,
        visibility:  g.visibility as string,
      }
    })
  )

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <h1 style={{
          fontFamily: 'var(--font-primary)',
          fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em',
          color: 'var(--text-primary)', margin: '0 0 4px',
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
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24,
        }}>
          {galleries.map(g => (
            <Link
              key={g.id}
              href={`/${ctx!.clubSlug}/our-club/galleries/${g.slug}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid var(--border-default)',
                background: 'var(--surface-1)',
                cursor: 'pointer',
                transition: 'box-shadow 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                {/* Cover */}
                <div style={{ aspectRatio: '3/2', background: 'var(--surface-0)', position: 'relative', overflow: 'hidden' }}>
                  {g.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={g.coverUrl}
                      alt={g.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>No cover</span>
                    </div>
                  )}
                  {/* Members-only badge */}
                  {g.visibility === 'members_only' && (
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      borderRadius: 9999, padding: '3px 10px',
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                      textTransform: 'uppercase', backdropFilter: 'blur(4px)',
                      background: 'rgba(0,0,0,0.55)', color: '#fff',
                    }}>
                      Members only
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', lineHeight: 1.2 }}>
                    {g.name}
                  </p>
                  {g.description && (
                    <p style={{
                      fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 6px',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {g.description}
                    </p>
                  )}
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: 0 }}>
                    {g.imageCount} photo{g.imageCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Box>
  )
}

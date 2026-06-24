import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import Link from 'next/link'
import { Box, Typography, Chip } from '@mui/material'
import PublicIcon      from '@mui/icons-material/Public'
import PeopleIcon from '@mui/icons-material/People'

export const dynamic = 'force-dynamic'

export default async function ClubGalleriesPage() {
  const ctx      = await getClubContext()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin    = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any

  // Fetch non-archived club galleries readable by current user
  let q = adminAny
    .from('club_galleries')
    .select(`
      id, name, slug, description, visibility, featured_on_homepage,
      cover_submission_id,
      submissions!club_galleries_cover_submission_id_fkey(
        images!submissions_image_id_fkey(storage_path)
      )
    `)
    .eq('club_id', ctx!.clubId)
    .is('archived_at', null)
    .order('featured_on_homepage', { ascending: false })
    .order('created_at', { ascending: false })

  if (!user) {
    q = q.eq('visibility', 'public')
  }

  const { data: galleries } = await q

  function coverUrl(g: {
    cover_submission_id: string | null
    submissions?: { images?: { storage_path?: string } | null } | null
  }) {
    const path = g.submissions?.images?.storage_path
    if (!path) return null
    return admin.storage.from('images').getPublicUrl(path).data.publicUrl
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" sx={{
          fontSize:      'var(--text-h1-size)',
          fontWeight:    'var(--text-h1-weight)',
          letterSpacing: 'var(--text-h1-ls)',
          mb:            0.5,
        }}>
          Club galleries
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Curated image collections from our club.
        </Typography>
      </Box>

      {(!galleries || galleries.length === 0) ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography>No galleries published yet.</Typography>
        </Box>
      ) : (
        <Box sx={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap:                 3,
        }}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(galleries as any[]).map((g: any) => {
            const url = coverUrl(g as Parameters<typeof coverUrl>[0])
            return (
              <Link
                key={g.id as string}
                href={`/${ctx!.clubSlug}/our-club/galleries/${g.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <Box sx={{
                  borderRadius: 2,
                  overflow:     'hidden',
                  border:       '1px solid var(--border-default)',
                  bgcolor:      'background.paper',
                  cursor:       'pointer',
                  transition:   'box-shadow 0.15s',
                  '&:hover':    { boxShadow: 3 },
                }}>
                  {/* Cover */}
                  <Box sx={{ aspectRatio: '4/3', bgcolor: 'var(--surface-1)', position: 'relative' }}>
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt={g.name as string} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="caption" color="text.disabled">No cover</Typography>
                      </Box>
                    )}
                    {g.featured_on_homepage && (
                      <Chip label="Featured" size="small" color="primary" sx={{ position: 'absolute', top: 8, left: 8, fontSize: 11 }} />
                    )}
                    {g.visibility === 'members_only' && (
                      <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.55)', borderRadius: 1, px: 0.75, py: 0.25, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PeopleIcon sx={{ fontSize: 12, color: '#fff' }} />
                        <Typography sx={{ fontSize: 11, color: '#fff' }}>Members</Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Info */}
                  <Box sx={{ p: 2 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 15, mb: 0.5 }}>{g.name as string}</Typography>
                    {g.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {g.description as string}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Link>
            )
          })}
        </Box>
      )}
    </Box>
  )
}

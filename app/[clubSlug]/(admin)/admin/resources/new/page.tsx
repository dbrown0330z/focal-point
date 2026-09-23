import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId, requireClubSlug } from '@/lib/club-context'
import { seedDefaultCategories } from '../actions'
import ResourceFormClient from '../ResourceFormClient'
import type { ResourceCategory } from '../actions'
import { Box, Typography } from '@mui/material'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewResourcePage() {
  const [clubId, clubSlug] = await Promise.all([requireClubId(), requireClubSlug()])
  const supabase = createServiceClient()

  await seedDefaultCategories(clubId)

  const [catsResult, countResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('resource_categories')
      .select('*')
      .eq('club_id', clubId)
      .order('sort_order'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('resources')
      .select('id', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('is_pinned', true),
  ])

  const categories: ResourceCategory[] = (catsResult.data as ResourceCategory[]) ?? []
  const pinnedCount: number             = countResult.count ?? 0

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography
          component={Link}
          href={`/${clubSlug}/admin/resources`}
          sx={{ fontSize: 13, color: 'text.secondary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          ← Resources
        </Typography>
        <Typography variant="h1" sx={{ mt: 1, fontSize: 22, fontWeight: 700, letterSpacing: '-0.015em', color: 'text.primary' }}>
          Add resource
        </Typography>
      </Box>

      <ResourceFormClient
        categories={categories}
        pinnedCount={pinnedCount}
        clubSlug={clubSlug}
      />
    </Box>
  )
}

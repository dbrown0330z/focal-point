import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId, requireClubSlug } from '@/lib/club-context'
import ResourceFormClient from '../ResourceFormClient'
import type { ResourceCategory, Resource } from '../actions'
import { Box, Typography } from '@mui/material'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }   = await params
  const [clubId, clubSlug] = await Promise.all([requireClubId(), requireClubSlug()])
  const supabase = createServiceClient()

  const [catsResult, resourceResult, countResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('resource_categories')
      .select('*')
      .eq('club_id', clubId)
      .order('sort_order'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('resources')
      .select('*')
      .eq('id', id)
      .eq('club_id', clubId)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('resources')
      .select('id', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('is_pinned', true),
  ])

  if (!resourceResult.data) notFound()

  const categories: ResourceCategory[] = (catsResult.data as ResourceCategory[]) ?? []
  const resource:   Resource            = resourceResult.data as Resource
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
          Edit resource
        </Typography>
      </Box>

      <ResourceFormClient
        categories={categories}
        existing={resource}
        pinnedCount={pinnedCount}
        clubSlug={clubSlug}
      />
    </Box>
  )
}

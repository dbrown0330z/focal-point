import { Box, Typography } from '@mui/material'
import Link from 'next/link'
import { requireClubSlug } from '@/lib/club-context'

export default async function JudgeStatsPage({ params }: { params: { id: string } }) {
  const clubSlug = await requireClubSlug()
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Link href={`/${clubSlug}/admin/judges`} style={{ fontSize: 13, color: 'inherit', opacity: 0.6 }}>
          ← Back to judges
        </Link>
      </Box>

      <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Judge Stats</h1>
      <p className="mt-1 mb-4 text-sm text-content-secondary">
        Judging history, scores, and competition participation for this judge.
      </p>

      <Box
        sx={{
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 2,
          py: 10,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ fontSize: 14, color: 'text.disabled' }}>
          Judging history will appear here once competitions are wired up.
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.5, fontFamily: 'monospace' }}>
          judge id: {params.id}
        </Typography>
      </Box>
    </Box>
  )
}

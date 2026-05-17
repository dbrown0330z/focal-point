import { Box } from '@mui/material'
import TabNav from './TabNav'
import { requireClubSlug } from '@/lib/club-context'

export default async function ClubDefaultsLayout({ children }: { children: React.ReactNode }) {
  const clubSlug = await requireClubSlug()
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Club Defaults</h1>
        <p className="mt-1 text-sm text-content-secondary">Configure your club's core settings and defaults.</p>
      </Box>
      <TabNav clubSlug={clubSlug} />
      {children}
    </Box>
  )
}

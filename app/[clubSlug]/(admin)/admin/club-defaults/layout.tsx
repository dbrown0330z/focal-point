import { Box } from '@mui/material'
import TabNav from './TabNav'

export default function ClubDefaultsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Club Defaults</h1>
        <p className="mt-1 text-sm text-content-secondary">Configure your club's core settings and defaults.</p>
      </Box>
      <TabNav />
      {children}
    </Box>
  )
}

import { Box } from '@mui/material'

export default function ClubDefaultsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Club Basics</h1>
        <p className="mt-1 text-sm text-content-secondary">Configure your club's core settings.</p>
      </Box>
      {children}
    </Box>
  )
}

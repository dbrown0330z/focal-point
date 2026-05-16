import { Box } from '@mui/material'
import CommunicationTabNav from './TabNav'

export default function CommunicationLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Communication</h1>
        <p className="mt-1 text-sm text-content-secondary">Send emails to members and view message history.</p>
      </Box>
      <CommunicationTabNav />
      {children}
    </Box>
  )
}

'use client'

import { ThemeProvider } from '@mui/material/styles'
import adminTheme from '@/src/theme/admin'

export default function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={adminTheme}>
      {children}
    </ThemeProvider>
  )
}

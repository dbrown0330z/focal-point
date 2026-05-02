'use client'

import { ThemeProvider } from '@mui/material/styles'
import { adminTheme, adminDarkTheme } from '@/src/theme/admin'
import { AdminThemeContextProvider, useAdminTheme } from './AdminThemeContext'

function MuiAdminThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useAdminTheme()
  return (
    <ThemeProvider theme={theme === 'dark' ? adminDarkTheme : adminTheme}>
      {children}
    </ThemeProvider>
  )
}

export default function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeContextProvider>
      <MuiAdminThemeProvider>
        {children}
      </MuiAdminThemeProvider>
    </AdminThemeContextProvider>
  )
}

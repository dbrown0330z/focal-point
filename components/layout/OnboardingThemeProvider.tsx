'use client'

import { ThemeProvider } from '@mui/material'
import { darkTheme } from '@/src/theme/index'

export default function OnboardingThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={darkTheme}>{children}</ThemeProvider>
}

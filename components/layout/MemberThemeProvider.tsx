'use client'

import { ThemeProvider, useMediaQuery } from '@mui/material'
import { theme, darkTheme } from '@/src/theme/index'

export default function MemberThemeProvider({ children }: { children: React.ReactNode }) {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  return <ThemeProvider theme={prefersDark ? darkTheme : theme}>{children}</ThemeProvider>
}

'use client';

import { ThemeProvider } from '@mui/material/styles';
// CssBaseline intentionally omitted — app manages its own global styles
import theme from '@/src/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
}
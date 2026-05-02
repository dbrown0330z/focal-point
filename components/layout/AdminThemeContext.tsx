'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type AdminTheme = 'light' | 'dark'

type AdminThemeContextValue = {
  theme: AdminTheme
  toggle: () => void
}

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null)

export function useAdminTheme() {
  const ctx = useContext(AdminThemeContext)
  if (!ctx) throw new Error('useAdminTheme must be used within AdminThemeProvider')
  return ctx
}

export function AdminThemeContextProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>('light')

  useEffect(() => {
    const stored = localStorage.getItem('admin-theme') as AdminTheme | null
    if (stored === 'dark' || stored === 'light') setTheme(stored)
  }, [])

  function toggle() {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('admin-theme', next)
      return next
    })
  }

  return (
    <AdminThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </AdminThemeContext.Provider>
  )
}

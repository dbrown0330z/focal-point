'use client'

import { createContext, useContext } from 'react'

type AdminThemeContextValue = {
  theme: 'light'
  toggle: () => void
}

const AdminThemeContext = createContext<AdminThemeContextValue>({
  theme: 'light',
  toggle: () => {},
})

export function useAdminTheme() {
  return useContext(AdminThemeContext)
}

export function AdminThemeContextProvider({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeContext.Provider value={{ theme: 'light', toggle: () => {} }}>
      {children}
    </AdminThemeContext.Provider>
  )
}

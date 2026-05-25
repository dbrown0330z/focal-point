'use client'

import { UnsavedChangesProvider } from './UnsavedChangesProvider'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { useAdminTheme } from '@/components/layout/AdminThemeContext'

export default function AdminShell({
  children,
  clubSlug,
  footer,
}: {
  children: React.ReactNode
  clubSlug: string
  footer?: React.ReactNode
}) {
  const { theme } = useAdminTheme()
  return (
    <UnsavedChangesProvider>
      <div className={`admin-context${theme === 'dark' ? ' admin-dark' : ''} flex h-screen overflow-hidden bg-surface-0`}>
        <AdminSidebar clubSlug={clubSlug} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto px-6 py-8">
            <div className="mx-auto w-full max-w-[1200px]">
              {children}
            </div>
            {footer}
          </main>
        </div>
      </div>
    </UnsavedChangesProvider>
  )
}

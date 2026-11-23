'use client'

import { Suspense } from 'react'
import { UnsavedChangesProvider } from './UnsavedChangesProvider'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { useAdminTheme } from '@/components/layout/AdminThemeContext'

function SidebarFallback() {
  return <aside className="flex h-screen w-52 flex-col bg-admin-nav" />
}

export default function AdminShell({
  children,
  clubSlug,
  banner,
  footer,
}: {
  children: React.ReactNode
  clubSlug: string
  banner?:  React.ReactNode
  footer?:  React.ReactNode
}) {
  useAdminTheme()
  return (
    <UnsavedChangesProvider>
      <div className="admin-context flex h-screen overflow-hidden bg-surface-0">
        <Suspense fallback={<SidebarFallback />}>
          <AdminSidebar clubSlug={clubSlug} />
        </Suspense>
        <div className="flex flex-1 flex-col overflow-hidden">
          {banner}
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

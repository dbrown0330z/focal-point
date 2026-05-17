'use client'

import { usePathname } from 'next/navigation'
import { Tabs, Tab } from '@mui/material'
import { useUnsavedChanges } from '@/components/admin/UnsavedChangesProvider'

export default function TabNav({ clubSlug }: { clubSlug: string }) {
  const pathname = usePathname()
  const { navigate } = useUnsavedChanges()

  const tabs = [
    { label: 'Basics',                 href: `/${clubSlug}/admin/club-defaults` },
    { label: 'Competitions',           href: `/${clubSlug}/admin/club-defaults/competition` },
    { label: 'Recognition & Standing', href: `/${clubSlug}/admin/club-defaults/recognition` },
  ]

  const value = tabs.findIndex(t =>
    t.href === `/${clubSlug}/admin/club-defaults`
      ? pathname === t.href
      : pathname.startsWith(t.href)
  )

  return (
    <Tabs
      value={value === -1 ? 0 : value}
      onChange={(_, i) => navigate(tabs[i].href)}
      sx={{ mb: 4, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      {tabs.map(t => <Tab key={t.href} label={t.label} sx={{ textTransform: 'none' }} />)}
    </Tabs>
  )
}

'use client'

import { usePathname } from 'next/navigation'
import { Tabs, Tab } from '@mui/material'
import { useUnsavedChanges } from '@/components/admin/UnsavedChangesProvider'

const TABS = [
  { label: 'Basics',                href: '/admin/club-defaults' },
  { label: 'Competitions',          href: '/admin/club-defaults/competition' },
  { label: 'Recognition & Standing',href: '/admin/club-defaults/recognition' },
]

export default function TabNav() {
  const pathname = usePathname()
  const { navigate } = useUnsavedChanges()

  const value = TABS.findIndex(t =>
    t.href === '/admin/club-defaults'
      ? pathname === t.href
      : pathname.startsWith(t.href)
  )

  return (
    <Tabs
      value={value === -1 ? 0 : value}
      onChange={(_, i) => navigate(TABS[i].href)}
      sx={{ mb: 4, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      {TABS.map(t => <Tab key={t.href} label={t.label} sx={{ textTransform: 'none' }} />)}
    </Tabs>
  )
}

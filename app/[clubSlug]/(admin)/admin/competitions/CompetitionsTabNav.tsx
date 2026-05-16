'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Tabs, Tab } from '@mui/material'

const TABS = [
  { label: 'All Competitions',       href: '/admin/competitions',           exact: true },
  { label: 'Competition Templates', href: '/admin/competitions/templates' },
]

export default function CompetitionsTabNav() {
  const pathname = usePathname()
  const router   = useRouter()

  const value = TABS.findIndex(t =>
    t.exact ? pathname === t.href : pathname.startsWith(t.href)
  )

  return (
    <Tabs
      value={value === -1 ? 0 : value}
      onChange={(_, i) => router.push(TABS[i].href)}
      sx={{ mb: 4, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      {TABS.map(t => <Tab key={t.href} label={t.label} sx={{ textTransform: 'none' }} />)}
    </Tabs>
  )
}

'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Tabs, Tab } from '@mui/material'

export default function CompetitionsTabNav({ clubSlug }: { clubSlug: string }) {
  const pathname = usePathname()
  const router   = useRouter()

  const tabs = [
    { label: 'Competition List',        href: `/${clubSlug}/admin/competitions`,                          exact: true },
    { label: 'Competition Templates',   href: `/${clubSlug}/admin/competitions/templates` },
    { label: 'Competition Defaults',    href: `/${clubSlug}/admin/competitions/competition-defaults` },
    { label: 'Recognition & Standings', href: `/${clubSlug}/admin/competitions/recognition` },
  ]

  const value = tabs.findIndex(t =>
    t.exact ? pathname === t.href : pathname.startsWith(t.href)
  )

  return (
    <Tabs
      value={value === -1 ? 0 : value}
      onChange={(_, i) => router.push(tabs[i].href)}
      sx={{ mb: 4, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      {tabs.map(t => <Tab key={t.href} label={t.label} sx={{ textTransform: 'none' }} />)}
    </Tabs>
  )
}

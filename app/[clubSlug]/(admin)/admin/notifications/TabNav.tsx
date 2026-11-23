'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Tabs, Tab } from '@mui/material'

export default function CommunicationTabNav({ clubSlug }: { clubSlug: string }) {
  const pathname = usePathname()
  const router   = useRouter()

  const tabs = [
    { label: 'Sent Messages', href: `/${clubSlug}/admin/notifications`, exact: true },
    { label: 'Create Email',  href: `/${clubSlug}/admin/notifications/compose` },
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

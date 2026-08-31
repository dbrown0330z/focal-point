'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Tabs, Tab } from '@mui/material'

export default function CompetitionsTabNav({ clubSlug }: { clubSlug: string }) {
  const pathname = usePathname()
  const router   = useRouter()

  const tabs = [
    { label: 'Competitions',           href: `/${clubSlug}/admin/competitions`,                        exact: true,  primary: true  },
    { label: 'Templates',              href: `/${clubSlug}/admin/competitions/templates`,                              primary: false },
    { label: 'Defaults',               href: `/${clubSlug}/admin/competitions/competition-defaults`,                   primary: false },
    { label: 'Recognition & Standings',href: `/${clubSlug}/admin/competitions/recognition`,                            primary: false },
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
      {tabs.map((t, i) => (
        <Tab
          key={t.href}
          label={t.label}
          sx={{
            textTransform: 'none',
            // Primary tab — visually prominent
            ...(t.primary && {
              fontWeight: 600,
              fontSize: 14,
            }),
            // Secondary tabs — subordinate weight and tone
            ...(!t.primary && {
              fontWeight: 400,
              fontSize: 13,
              // Extra gap before the secondary group starts
              ...(i === 1 && { ml: 3 }),
              // Mute unselected state; active state falls through to the normal Tabs indicator
              '&:not(.Mui-selected)': {
                color: 'text.secondary',
                opacity: 0.85,
              },
            }),
          }}
        />
      ))}
    </Tabs>
  )
}

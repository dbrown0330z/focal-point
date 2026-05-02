'use client'

import Link from 'next/link'
import { Box, Paper, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'

const CONTENT_SECTIONS = [
  {
    href:  '/admin/content/about',
    icon:  <InfoOutlinedIcon sx={{ fontSize: 22, color: 'text.secondary' }} />,
    title: 'About our club',
    desc:  'Edit the public-facing About page — introduction, history, and how to join.',
  },
  {
    href:  '/admin/content/navigation',
    icon:  <AccountTreeOutlinedIcon sx={{ fontSize: 22, color: 'text.secondary' }} />,
    title: 'Navigation & pages',
    desc:  'Manage site navigation structure, add custom pages and tabs.',
  },
]

export default function ContentPage() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Content & Pages</h1>
        <p className="mt-1 text-sm text-content-secondary">Manage club pages and public content.</p>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {CONTENT_SECTIONS.map(section => (
          <Paper
            key={section.href}
            variant="outlined"
            component={Link}
            href={section.href}
            sx={{
              px: 3, py: 2.5,
              display: 'flex', alignItems: 'center', gap: 2.5,
              textDecoration: 'none',
              transition: 'border-color 0.15s',
              '&:hover': { borderColor: 'var(--action-primary)' },
            }}
          >
            <Box sx={{ flexShrink: 0 }}>{section.icon}</Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '15px', fontWeight: 600, color: 'text.primary' }}>{section.title}</Typography>
              <Typography sx={{ fontSize: '13px', color: 'text.secondary', mt: 0.25 }}>{section.desc}</Typography>
            </Box>
            <ArrowForwardIosIcon sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }} />
          </Paper>
        ))}
      </Box>
    </Box>
  )
}

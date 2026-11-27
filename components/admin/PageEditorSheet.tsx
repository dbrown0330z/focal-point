'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

export default function PageEditorSheet({
  title,
  backHref,
  backLabel = 'Navigation & Pages',
  headerRight,
  subBar,
  toolbar,
  children,
}: {
  title: string
  backHref: string
  backLabel?: string
  headerRight: React.ReactNode
  subBar?: React.ReactNode
  toolbar: React.ReactNode
  children: React.ReactNode
}) {
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <Box sx={{
      position: 'fixed',
      inset: 0,
      zIndex: 1200,
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      overflow: 'hidden',
      transform: visible ? 'translateY(0)' : 'translateY(100%)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.26s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.18s ease',
    }}>

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <Box sx={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 2,
        px: 3, py: 1.5,
        borderBottom: '1px solid', borderColor: 'divider',
        bgcolor: 'background.paper',
      }}>
        {/* breadcrumb */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, overflow: 'hidden' }}>
          <Box
            component="button"
            onClick={() => router.push(backHref)}
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.75,
              border: 'none', bgcolor: 'transparent', cursor: 'pointer',
              p: '4px 8px', borderRadius: '4px', color: 'text.secondary', flexShrink: 0,
              '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 15 }} />
            <Typography sx={{ fontSize: 13, color: 'inherit', fontFamily: 'inherit' }}>{backLabel}</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }}>/</Typography>
          <Typography sx={{
            fontSize: 13, fontWeight: 500, color: 'text.primary',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title}
          </Typography>
        </Box>

        {/* header actions */}
        <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
          {headerRight}
        </Box>
      </Box>

      {/* ── Optional sub-bar (page metadata, custom pages only) ──────── */}
      {subBar && (
        <Box sx={{
          flexShrink: 0,
          px: 3, py: 1.5,
          borderBottom: '1px solid', borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap',
        }}>
          {subBar}
        </Box>
      )}

      {/* ── Formatting toolbar ───────────────────────────────────────── */}
      <Box sx={{
        flexShrink: 0,
        px: 1.5, py: 0.75,
        display: 'flex', alignItems: 'center', gap: 0.25, flexWrap: 'wrap',
        borderBottom: '1px solid', borderColor: 'divider',
        bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      }}>
        {toolbar}
      </Box>

      {/* ── Scrollable body ──────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {children}
      </Box>

    </Box>
  )
}

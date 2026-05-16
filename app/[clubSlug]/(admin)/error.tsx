'use client'

import { useEffect } from 'react'
import { Box, Button, Typography } from '@mui/material'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin page error:', error)
  }, [error])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, textAlign: 'center' }}>
      <Typography sx={{ fontSize: 17, fontWeight: 600, mb: 1 }}>Something went wrong</Typography>
      <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 3, maxWidth: 400, lineHeight: 1.6 }}>
        {error.message || 'An unexpected error occurred on this page.'}
      </Typography>
      <Button variant="outlined" color="secondary" onClick={reset}>Try again</Button>
    </Box>
  )
}

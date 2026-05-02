'use client'

import { Box, Typography } from '@mui/material'

/** Camera-themed empty state graphic — 100×100 */
function EmptyGraphic() {
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer body */}
      <rect x="8" y="28" width="84" height="56" rx="10" fill="#EDF0F5" stroke="#B0BACA" strokeWidth="2" />
      {/* Viewfinder bump */}
      <rect x="34" y="18" width="32" height="14" rx="5" fill="#EDF0F5" stroke="#B0BACA" strokeWidth="2" />
      {/* Lens outer ring */}
      <circle cx="50" cy="58" r="20" fill="white" stroke="#B0BACA" strokeWidth="2" />
      {/* Lens inner ring */}
      <circle cx="50" cy="58" r="14" fill="#D8DDE7" />
      {/* Lens reflection */}
      <circle cx="50" cy="58" r="8" fill="#B0BACA" />
      <circle cx="45" cy="53" r="2.5" fill="white" opacity="0.6" />
      {/* Shutter button */}
      <circle cx="78" cy="38" r="5" fill="#B0BACA" stroke="#7E8EA3" strokeWidth="1.5" />
      {/* Flash indicator */}
      <rect x="16" y="38" width="12" height="7" rx="2" fill="#D8DDE7" stroke="#B0BACA" strokeWidth="1.5" />
      {/* Dashed aperture lines */}
      <circle cx="50" cy="58" r="18" stroke="#B0BACA" strokeWidth="1" strokeDasharray="3 3" />
    </svg>
  )
}

export default function EmptyState({
  headline,
  body,
  action,
}: {
  headline: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 10 }}>
      <EmptyGraphic />
      <Typography sx={{ mt: 3, fontSize: 17, fontWeight: 600, color: 'text.primary' }}>
        {headline}
      </Typography>
      <Typography sx={{ mt: 1, fontSize: 13, color: 'text.disabled', maxWidth: 340, lineHeight: 1.6 }}>
        {body}
      </Typography>
      {action && <Box sx={{ mt: 3 }}>{action}</Box>}
    </Box>
  )
}

'use client'

import { Box, Typography } from '@mui/material'
import { CompetitionType } from '@/types/competition'

interface Props {
  value:    CompetitionType
  onChange: (v: CompetitionType) => void
  onNext:   (type: CompetitionType) => void
}

export function StepType({ value, onChange, onNext }: Props) {
  const choose = (type: CompetitionType) => {
    if (type === 'print') return  // not yet implemented
    onChange(type)
    onNext(type)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: 'text.primary', mb: 0.75, textAlign: 'center' }}>
        What type of competition is this?
      </Typography>
      <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 4, textAlign: 'center' }}>
        This determines the submission and judging flow.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2.5, width: '100%', maxWidth: 560 }}>
        {/* Digital */}
        <Box
          component="button"
          onClick={() => choose('digital')}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            p: 3.5,
            border: '2px solid',
            borderRadius: 2.5,
            cursor: 'pointer',
            fontFamily: 'inherit',
            bgcolor: value === 'digital' ? 'rgba(30,77,140,0.05)' : 'background.paper',
            borderColor: value === 'digital' ? 'primary.main' : 'divider',
            transition: 'all 0.15s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'rgba(30,77,140,0.04)',
            },
          }}
        >
          <Box sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            bgcolor: 'rgba(30,77,140,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E4D8C" strokeWidth="1.75">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path strokeLinecap="round" d="M8 21h8M12 17v4" />
            </svg>
          </Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary', mb: 1 }}>
            Digital
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
            Members submit images online. Judging happens remotely within the app.
          </Typography>
        </Box>

        {/* Print — disabled */}
        <Box
          component="button"
          disabled
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            p: 3.5,
            border: '2px solid',
            borderRadius: 2.5,
            cursor: 'not-allowed',
            fontFamily: 'inherit',
            bgcolor: '#F7F8FA',
            borderColor: 'divider',
            opacity: 0.55,
          }}
        >
          <Box sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            bgcolor: '#EDF0F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7E8EA3" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 16M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary', mb: 1 }}>
            Print
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
            Members bring physical prints to a meeting. Results are recorded on the night.
          </Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 500, color: 'text.disabled', mt: 1.5 }}>
            Coming soon
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

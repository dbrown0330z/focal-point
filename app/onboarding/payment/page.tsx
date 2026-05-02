'use client'

import Link from 'next/link'
import { Box, Button, Typography } from '@mui/material'
import { completePayment } from '../actions'
import { logout } from '@/app/(auth)/actions'

const T = {
  primary:   'var(--text-primary)',
  secondary: 'var(--text-secondary)',
}

export default function OnboardingPaymentPage() {
  return (
    <Box sx={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>

      {/* Left: Welcome panel */}
      <Box sx={{ width: 460, flexShrink: 0, pt: 1 }}>
        <Typography
          sx={{
            fontFamily: 'var(--font-lora)',
            fontSize: '44px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            color: T.primary,
            mb: 3,
          }}
        >
          {'Almost there '}
          <span style={{ color: T.secondary }}>— one last step.</span>
        </Typography>
        <Typography sx={{ fontSize: 20, lineHeight: 1.7, color: T.secondary }}>
          Complete your membership and you'll be ready to enter your first competition.
        </Typography>
        <Box sx={{ mt: 5 }}>
          <img src="/onboarding-approved.svg" alt="" width={510} height={357} />
        </Box>
      </Box>

      {/* Right: Step indicator + payment */}
      <Box sx={{ flex: 1, minWidth: 0 }}>

        {/* Step indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 24, height: 24, borderRadius: '50%',
              bgcolor: 'var(--status-success-bg)',
              border: '1px solid', borderColor: 'var(--status-success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 5l2.5 2.5 3.5-4" />
              </svg>
            </Box>
            <Typography sx={{ fontSize: 14, color: T.secondary }}>Complete your profile</Typography>
          </Box>
          <Box sx={{ flex: 1, height: '1px', bgcolor: 'var(--border-default)' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 24, height: 24, borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1 }}>2</Typography>
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: T.primary }}>Pay membership fee</Typography>
          </Box>
        </Box>

        {/* Pricing card */}
        <Box sx={{
          borderRadius: 3,
          border: '1px solid', borderColor: 'var(--border-default)',
          bgcolor: 'var(--surface-1)',
          p: 3, mb: 3,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontSize: 14, color: T.secondary }}>Annual membership</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: T.primary }}>$40.00</Typography>
          </Box>
          <Box sx={{ borderTop: '1px solid', borderColor: 'var(--border-subtle)', pt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: 15, fontWeight: 500, color: T.primary }}>Total</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: T.primary }}>$40.00</Typography>
          </Box>
        </Box>

        {/* Demo notice */}
        <Box sx={{
          borderRadius: 2,
          border: '1px solid', borderColor: 'var(--status-warning)',
          bgcolor: 'var(--status-warning-bg)',
          px: 2, py: 1.5, mb: 4,
        }}>
          <Typography sx={{ fontSize: 14, color: 'var(--status-warning-text)' }}>
            <strong>Demo mode:</strong> No real payment will be taken. Click below to activate your membership.
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button variant="outlined" color="secondary" size="small" onClick={() => logout()}>
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" color="secondary" size="small" component={Link} href="/onboarding/profile">
            ← Back
          </Button>
          <Button variant="contained" size="small" onClick={() => completePayment()}>
            Activate membership
          </Button>
        </Box>

      </Box>
    </Box>
  )
}

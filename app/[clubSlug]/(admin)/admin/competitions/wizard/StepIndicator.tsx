'use client'

import { Box, Typography } from '@mui/material'

const STEPS = ['Basics', 'Entries & Submissions', 'Judging', 'Recognition', 'Review', 'Schedule']

export function StepIndicator({
  currentStep,
  completedSteps,
  onStepClick,
}: {
  currentStep: number
  completedSteps: number[]
  onStepClick: (step: number) => void
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STEPS.map((label, idx) => {
        const step      = idx + 1
        const isCurrent   = step === currentStep
        const isCompleted = completedSteps.includes(step)
        const isClickable = isCompleted || step === currentStep

        return (
          <Box
            key={step}
            sx={{ display: 'flex', alignItems: 'center', flex: idx < STEPS.length - 1 ? 1 : undefined }}
          >
            <Box
              component={isClickable && !isCurrent ? 'button' : 'div'}
              onClick={isClickable && !isCurrent ? () => onStepClick(step) : undefined}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: isClickable && !isCurrent ? 'pointer' : 'default',
                bgcolor: 'transparent',
                border: 'none',
                p: 0,
                flexShrink: 0,
              }}
            >
              {/* Circle */}
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  ...(isCurrent
                    ? { bgcolor: 'primary.main' }
                    : isCompleted
                    ? { bgcolor: 'primary.main' }
                    : { border: '1.5px solid', borderColor: 'divider', bgcolor: 'background.paper' }),
                }}
              >
                {isCompleted && !isCurrent ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: isCurrent || isCompleted ? '#fff' : 'text.disabled',
                      lineHeight: 1,
                    }}
                  >
                    {step}
                  </Typography>
                )}
              </Box>

              {/* Label — only show on medium+ */}
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent ? 'text.primary' : isCompleted ? 'primary.main' : 'text.secondary',
                  display: { xs: 'none', sm: 'block' },
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </Typography>
            </Box>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  height: '1px',
                  bgcolor: isCompleted ? 'primary.main' : 'divider',
                  mx: 1,
                  minWidth: 8,
                }}
              />
            )}
          </Box>
        )
      })}
    </Box>
  )
}

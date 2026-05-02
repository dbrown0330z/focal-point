'use client'

import React from 'react'
import {
  Box,
  Button,
  Collapse,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'

// ─── Segmented Control ────────────────────────────────────────────────────────

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = 'small',
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  size?: 'small' | 'medium'
}) {
  return (
    <ToggleButtonGroup
      exclusive
      size={size}
      value={value}
      onChange={(_, v) => { if (v != null) onChange(v as T) }}
      sx={{
        '& .MuiToggleButton-root': {
          textTransform: 'none',
          fontSize: 12,
          fontFamily: 'inherit',
          px: 2,
          py: 0.75,
          color: 'text.secondary',
          borderColor: 'divider',
          '&.Mui-selected': {
            bgcolor: 'primary.main',
            color: '#fff',
            borderColor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
          },
          '&:hover': { bgcolor: 'action.hover' },
        },
      }}
    >
      {options.map(o => (
        <ToggleButton key={String(o.value)} value={o.value}>
          {o.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}

// ─── Form Section ─────────────────────────────────────────────────────────────
// A bordered card with an optional title and divided rows inside.

export function FormSection({
  title,
  accent,
  children,
}: {
  title?: React.ReactNode
  accent?: boolean
  children: React.ReactNode
}) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: accent ? 'primary.main' : 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        overflow: 'hidden',
        opacity: accent ? undefined : undefined,
      }}
    >
      {title && (
        <Box sx={{ px: 2.5, py: 1.75, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: accent ? 'primary.main' : 'divider' }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: 'text.primary' }}>
            {title}
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          '& > *': { px: 2.5, py: 2.5 },
          '& > * + *': {
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 20,
              right: 20,
              height: '1px',
              bgcolor: 'divider',
            },
          },
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

// ─── Setting Row ──────────────────────────────────────────────────────────────
// Label on the left, control flush to the right edge of a fixed 580px box,
// optional hint text to the right of the box. Matches the club-defaults layout.

export function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary' }}>
          {label}
        </Typography>
        {children}
      </Box>
      {description && (
        <Typography sx={{ flex: 1, fontSize: 12, color: 'text.secondary', lineHeight: 1.5 }}>
          {description}
        </Typography>
      )}
    </Box>
  )
}

// ─── Animated Reveal ─────────────────────────────────────────────────────────

export function AnimatedReveal({
  show,
  children,
}: {
  show: boolean
  children: React.ReactNode
}) {
  return (
    <Collapse in={show} timeout={150} unmountOnExit>
      <Box>{children}</Box>
    </Collapse>
  )
}

// ─── Club Default Indicator ───────────────────────────────────────────────────
// Shows a "Reset" link when a value has been changed from the club default.

export function ClubDefaultIndicator({
  currentValue,
  defaultValue,
  onReset,
}: {
  currentValue: unknown
  defaultValue: unknown
  onReset: () => void
}) {
  const isDefault = JSON.stringify(currentValue) === JSON.stringify(defaultValue)
  if (isDefault) return null
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
      <Typography sx={{ fontSize: 11, color: 'warning.main' }}>Modified from club default</Typography>
      <Button
        size="small"
        onClick={onReset}
        sx={{ minWidth: 0, p: 0, fontSize: 11, color: 'primary.main', fontWeight: 500 }}
      >
        Reset
      </Button>
    </Box>
  )
}

// ─── Override Row ─────────────────────────────────────────────────────────────
// Shows a locked default value with an "Override" link. When overridden, shows
// the editable children with a "Reset to default" link.

export function OverrideRow({
  label,
  defaultDisplay,
  isOverridden,
  onOverride,
  onReset,
  children,
  description,
}: {
  label: string
  defaultDisplay: React.ReactNode
  isOverridden: boolean
  onOverride: () => void
  onReset: () => void
  children: React.ReactNode
  description?: string
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary' }}>
            {label}
          </Typography>
          {!isOverridden ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Typography sx={{ fontSize: 13, color: 'text.primary' }}>{defaultDisplay}</Typography>
              <Button
                size="small"
                onClick={onOverride}
                sx={{ minWidth: 0, p: 0, fontSize: 12, color: 'primary.main', fontWeight: 500 }}
              >
                Override
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {children}
            </Box>
          )}
        </Box>
        {isOverridden && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
            <Button
              size="small"
              onClick={onReset}
              sx={{ minWidth: 0, p: 0, fontSize: 11, color: 'primary.main', fontWeight: 500 }}
            >
              Reset to default
            </Button>
          </Box>
        )}
      </Box>
      {description && (
        <Typography sx={{ flex: 1, fontSize: 12, color: 'text.secondary', lineHeight: 1.5 }}>
          {description}
        </Typography>
      )}
    </Box>
  )
}

// ─── Section Label ────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'text.secondary',
        mb: 1.5,
      }}
    >
      {children}
    </Typography>
  )
}

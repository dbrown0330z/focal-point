'use client'

import { useState } from 'react'
import { Box, Button, Chip, MenuItem, Select, Typography } from '@mui/material'
import { AnimatedReveal, FormSection } from './shared'
import type { CompetitionConfig, CompetitionType } from '@/types/competition'

type Template = {
  id:     string
  name:   string
  config: CompetitionConfig
}

interface Props {
  config:             CompetitionConfig
  onChange:           (c: Partial<CompetitionConfig>) => void
  errors:             Record<string, string>
  templates:          Template[]
  selectedTemplateId: string | null
  onSelectTemplate:   (id: string | null, config: CompetitionConfig | null) => void
  competitionType:    CompetitionType
  onTypeChange:       (type: CompetitionType) => void
  onScheduleDirect:   () => void
  onReviewSettings:   () => void
  onScratchMode:      (isScratch: boolean) => void
  clubSlug:           string
}

const PRESET_LABEL: Record<string, string> = {
  'simple-scored': 'Simple scored',
  'salon':         'Salon style',
  'awards-only':   'Awards only',
  'member-vote':   'Member vote',
  'end-of-year':   'End of year',
}

// ─── Summary card helpers ─────────────────────────────────────────────────────

function templateSummaryLines(config: CompetitionConfig): string[] {
  const lines: string[] = []

  const presetLabel = PRESET_LABEL[config.judgingPreset] ?? config.judgingPreset
  if (config.judgingPreset === 'simple-scored') {
    const range    = `${config.scoreMin}–${config.scoreMax} scale`
    const decimals = config.allowDecimals ? ' · Decimals on' : ''
    lines.push(`${presetLabel} · ${range}${decimals}`)
  } else {
    lines.push(presetLabel)
  }

  if (config.categories.length > 0) {
    lines.push(`Categories: ${config.categories.join(', ')}`)
  }

  if (config.awardsEnabled) {
    const tierNames = config.awardTiers?.map(t => t.label).filter(Boolean)
    if (tierNames?.length) {
      lines.push(`Awards: ${tierNames.join(' · ')}`)
    } else {
      lines.push('Awards: On')
    }
  }

  const extras: string[] = []
  if (config.benchmarkEnabled) extras.push('Benchmark on')
  if (config.countTowardPOY)   extras.push('POY on')
  if (extras.length)           lines.push(extras.join(' · '))

  return lines
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <Box sx={{
      width: 16, height: 16, borderRadius: '50%',
      border: '2px solid',
      borderColor: selected ? 'primary.main' : 'divider',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {selected && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />}
    </Box>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StepBasics({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  competitionType,
  onTypeChange,
  onScheduleDirect,
  onReviewSettings,
  onScratchMode,
  clubSlug,
}: Props) {
  const [mode, setMode] = useState<'template' | 'scratch'>('template')

  const pickMode = (m: 'template' | 'scratch') => {
    setMode(m)
    onScratchMode(m === 'scratch')
    if (m === 'scratch') onSelectTemplate(null, null)
  }

  const handleDropdownChange = (val: string) => {
    if (val === '') {
      onSelectTemplate(null, null)
    } else {
      const tpl = templates.find(t => t.id === val)
      if (tpl) onSelectTemplate(tpl.id, tpl.config)
    }
  }

  const activeTpl = selectedTemplateId
    ? templates.find(t => t.id === selectedTemplateId) ?? null
    : null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>

      {/* Competition type */}
      <FormSection title="Competition type">
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TypeCard
            type="digital"
            selected={competitionType === 'digital'}
            onClick={() => onTypeChange('digital')}
            label="Digital"
            description="Members submit images online. Judging happens remotely within the app."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path strokeLinecap="round" d="M8 21h8M12 17v4" />
              </svg>
            }
          />
          <TypeCard
            type="print"
            selected={false}
            disabled
            onClick={() => {}}
            label="Print"
            description="Members bring physical prints to a meeting. Results are recorded on the night."
            comingSoon
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 16M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        </Box>
      </FormSection>

      {/* How to start */}
      <Box>
        <FormSection title="How would you like to start?">

          {/* Option 1: Use an existing template */}
          <Box>
            <Box
              component="button"
              onClick={() => pickMode('template')}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                width: '100%', textAlign: 'left',
                border: 'none', bgcolor: 'transparent', cursor: 'pointer',
                fontFamily: 'inherit', p: 0,
              }}
            >
              <RadioDot selected={mode === 'template'} />
              <Typography sx={{ fontSize: 14, color: mode === 'template' ? 'primary.main' : 'text.primary', fontWeight: mode === 'template' ? 600 : 400 }}>
                Use an existing template
              </Typography>
            </Box>

            <AnimatedReveal show={mode === 'template'}>
              <Box sx={{ mt: 1.5, pl: '28px' }}>
                {templates.length === 0 ? (
                  <Box>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.5 }}>
                      No saved templates yet.
                    </Typography>
                    <Typography
                      component="a"
                      href={`/${clubSlug}/admin/competitions/templates`}
                      sx={{ fontSize: 12, color: 'primary.main', mt: 0.5, display: 'block', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      Create a template ↗
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Select
                      size="small"
                      displayEmpty
                      value={selectedTemplateId ?? ''}
                      onChange={e => handleDropdownChange(e.target.value as string)}
                      renderValue={(val) => {
                        if (!val) return <Typography sx={{ fontSize: 13, color: 'text.disabled', fontFamily: 'inherit' }}>Select…</Typography>
                        const tpl = templates.find(t => t.id === val)
                        if (!tpl) return val
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: 13, fontFamily: 'inherit' }}>{tpl.name}</Typography>
                            {tpl.config?.judgingPreset && (
                              <Chip
                                label={PRESET_LABEL[tpl.config.judgingPreset] ?? tpl.config.judgingPreset}
                                size="small"
                                sx={{ fontSize: 11, height: 18, fontFamily: 'inherit', bgcolor: 'background.default', color: 'text.secondary' }}
                              />
                            )}
                          </Box>
                        )
                      }}
                      sx={{ fontFamily: 'inherit', minWidth: 260 }}
                    >
                      {templates.map(tpl => (
                        <MenuItem key={tpl.id} value={tpl.id} sx={{ fontFamily: 'inherit' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: 13, fontFamily: 'inherit' }}>{tpl.name}</Typography>
                            {tpl.config?.judgingPreset && (
                              <Chip
                                label={PRESET_LABEL[tpl.config.judgingPreset] ?? tpl.config.judgingPreset}
                                size="small"
                                sx={{ fontSize: 11, height: 18, fontFamily: 'inherit', bgcolor: 'background.default', color: 'text.secondary' }}
                              />
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    <Typography
                      component="a"
                      href={`/${clubSlug}/admin/competitions/templates`}
                      sx={{ fontSize: 12, color: 'primary.main', mt: 0.75, display: 'block', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      Manage templates ↗
                    </Typography>
                  </Box>
                )}
              </Box>
            </AnimatedReveal>
          </Box>

          {/* Option 2: Start from scratch */}
          <Box>
            <Box
              component="button"
              onClick={() => pickMode('scratch')}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                width: '100%', textAlign: 'left',
                border: 'none', bgcolor: 'transparent', cursor: 'pointer',
                fontFamily: 'inherit', p: 0,
              }}
            >
              <RadioDot selected={mode === 'scratch'} />
              <Typography sx={{ fontSize: 14, color: mode === 'scratch' ? 'primary.main' : 'text.primary', fontWeight: mode === 'scratch' ? 600 : 400 }}>
                Start from scratch
              </Typography>
            </Box>
          </Box>

        </FormSection>

        {/* Summary card — expands below once a template is selected from the dropdown */}
        <AnimatedReveal show={activeTpl !== null}>
          {activeTpl && (
            <Box sx={{
              mt: 2,
              border: '1.5px solid',
              borderColor: 'primary.main',
              borderRadius: 2,
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(74,127,196,0.08)' : 'rgba(30,77,140,0.03)',
              p: 2.5,
            }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary', mb: 1.5 }}>
                {activeTpl.name}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2.5 }}>
                {templateSummaryLines(activeTpl.config).map((line, i) => (
                  <Typography key={i} sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
                    {line}
                  </Typography>
                ))}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Button
                  size="small"
                  onClick={onReviewSettings}
                  sx={{ p: 0, minWidth: 0, fontSize: 13, color: 'primary.main', fontWeight: 500 }}
                >
                  Review &amp; adjust settings
                </Button>
                <Button
                  variant="contained"
                  onClick={onScheduleDirect}
                  endIcon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  }
                >
                  Schedule this competition
                </Button>
              </Box>
            </Box>
          )}
        </AnimatedReveal>
      </Box>

    </Box>
  )
}

// ─── TypeCard ─────────────────────────────────────────────────────────────────

function TypeCard({
  selected,
  disabled,
  onClick,
  label,
  description,
  icon,
  comingSoon,
}: {
  type:        CompetitionType
  selected:    boolean
  disabled?:   boolean
  onClick:     () => void
  label:       string
  description: string
  icon:        React.ReactNode
  comingSoon?: boolean
}) {
  return (
    <Box
      component="button"
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        p: 3,
        border: '2px solid',
        borderRadius: 2,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        bgcolor: disabled ? 'background.default' : selected ? (t) => t.palette.mode === 'dark' ? 'rgba(74,127,196,0.12)' : 'rgba(30,77,140,0.05)' : 'background.paper',
        borderColor: disabled ? 'divider' : selected ? 'primary.main' : 'divider',
        opacity: disabled ? 0.55 : 1,
        transition: 'all 0.12s',
        '&:hover': disabled ? {} : {
          borderColor: 'primary.main',
          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(74,127,196,0.10)' : selected ? 'rgba(30,77,140,0.07)' : 'rgba(30,77,140,0.03)',
        },
      }}
    >
      <Box sx={{
        width: 40, height: 40, borderRadius: '50%',
        bgcolor: disabled ? 'background.default' : (t) => t.palette.mode === 'dark' ? 'rgba(74,127,196,0.15)' : 'rgba(30,77,140,0.08)',
        color: disabled ? 'text.secondary' : 'primary.main',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        mb: 1.5,
      }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary', mb: 0.75 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.6 }}>
        {description}
      </Typography>
      {comingSoon && (
        <Typography sx={{ fontSize: 11, fontWeight: 500, color: 'text.disabled', mt: 1 }}>
          Coming soon
        </Typography>
      )}
    </Box>
  )
}

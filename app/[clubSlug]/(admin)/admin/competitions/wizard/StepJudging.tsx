'use client'

import {
  Box,
  Button,
  MenuItem,
  OutlinedInput,
  Select,
  Switch,
  Typography,
} from '@mui/material'
import {
  AnimatedReveal,
  ClubDefaultIndicator,
  FormSection,
  SectionLabel,
  SettingRow,
} from './shared'
import {
  CompetitionConfig,
  EoyQualificationSource,
  JudgingPreset,
  PRESET_DEFAULTS,
  ScoreAggregation,
  JudgeCommentsSetting,
  CLUB_DEFAULTS,
} from '@/types/competition'

interface Props {
  config:                    CompetitionConfig
  onChange:                  (c: Partial<CompetitionConfig>) => void
  showPresetChangeWarning?:  boolean
}

const PRESETS: {
  key: JudgingPreset
  title: string
  description: string
  bullets: string[]
  bestFor: string
}[] = [
  {
    key: 'simple-scored',
    title: 'Simple scored',
    description: 'Numeric scores from judges',
    bullets: [
      'A judge scores each image with a number',
      'Members see their score and where they ranked',
    ],
    bestFor: 'Monthly salons, regular club competitions',
  },
  {
    key: 'salon',
    title: 'Salon style',
    description: 'Accepted or declined, not scored',
    bullets: [
      'A judge evaluates each image against an acceptance threshold',
      'Members see accepted or declined — no raw score shown',
    ],
    bestFor: 'Clubs following external salon competition format',
  },
  {
    key: 'awards-only',
    title: 'Awards only',
    description: 'Recognition without ranking',
    bullets: [
      'A judge assigns awards directly — no numeric scoring',
      'Every image is considered but not ranked against others',
    ],
    bestFor: 'Themed competitions, showcases, critique nights',
  },
  {
    key: 'member-vote',
    title: 'Member vote',
    description: 'The club decides together',
    bullets: [
      'Members vote on each other\u2019s images — no designated judge needed',
      'Voting format is configurable: star rating, top 3, single pick, or approval',
    ],
    bestFor: 'People\u2019s choice events, informal or fun competitions',
  },
  {
    key: 'end-of-year',
    title: 'End of year',
    description: 'Celebrate the season\u2019s best',
    bullets: [
      'Draws from the season\u2019s existing results — no new judging required',
      'Showcase images that earned recognition throughout the year',
    ],
    bestFor: 'Annual showcases, end of season retrospectives',
  },
]

export function StepJudging({ config, onChange, showPresetChangeWarning }: Props) {
  const preset = config.judgingPreset

  const selectPreset = (key: JudgingPreset) => {
    onChange({ judgingPreset: key, ...PRESET_DEFAULTS[key], customised: false })
  }

  const updateSetting = (partial: Partial<CompetitionConfig>) => {
    onChange({ ...partial, customised: true })
  }

  const isCustomCount   = config.numberOfJudges > 5
  const judgeCountValue = isCustomCount ? 'custom' : String(config.numberOfJudges)
  const selectedPreset  = PRESETS.find(p => p.key === preset)!

  // ── Dynamic descriptions ─────────────────────────────────────────────────

  const judgeCountDesc = config.numberOfJudges === 1
    ? 'One judge scores all images independently.'
    : `${config.numberOfJudges} judges score images independently.`

  const aggregationDesc =
    config.scoreAggregation === 'sum'
      ? 'When 2+ judges, all scores are added together — totals grow with more judges.'
      : config.scoreAggregation === 'average'
      ? 'When 2+ judges, scores are averaged — totals stay in range regardless of judge count.'
      : 'When 2+ judges, the highest and lowest scores are dropped before averaging.'

  const hideNamesDesc = config.blindHideName
    ? 'Member names are hidden from judges — images are identified by number only.'
    : 'Member names are visible to judges during scoring.'

  const judgeCommentsDesc =
    config.judgeComments === 'none'     ? 'Judges are not asked to write comments.' :
    config.judgeComments === 'optional' ? 'Judges can add comments but are not required to.' :
                                          'A comment must be entered before a score can be submitted.'

  const viewOtherScoresDesc = config.viewOtherJudgesScores
    ? 'Judges can see scores from other judges in real time.'
    : 'Judges cannot see other judges\u2019 scores while scoring.'

  const scoreRangeAtDefault =
    config.scoreMin === CLUB_DEFAULTS.defaultScoreMin &&
    config.scoreMax === CLUB_DEFAULTS.defaultScoreMax

  const scoreRangeDesc = `Judges score each entry from ${config.scoreMin} to ${config.scoreMax}.`

  const minScoreDesc = config.minimumScoreToPublish
    ? `Entries scoring below ${config.minimumScoreToPublishValue} will be withheld from the published results.`
    : 'All entries appear in the published results regardless of their score.'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>

      {/* ── Preset selector: list left, bullets right ── */}
      <Box>
        <SectionLabel>Select a judging preset</SectionLabel>
        <Box sx={{ display: 'flex', border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>

          {/* Left: selectable list */}
          <Box sx={{ width: 210, borderRight: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            {PRESETS.map((p, i) => {
              const selected = preset === p.key
              return (
                <Box
                  key={p.key}
                  component="button"
                  onClick={() => selectPreset(p.key)}
                  sx={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    px: 2.5,
                    py: 2,
                    border: 'none',
                    borderBottom: i < PRESETS.length - 1 ? '1px solid' : 'none',
                    borderColor: selected ? 'primary.dark' : 'divider',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    bgcolor: selected ? 'primary.main' : 'transparent',
                    transition: 'all 0.12s',
                    '&:hover': { bgcolor: selected ? 'primary.dark' : 'action.hover' },
                  }}
                >
                  <Typography sx={{ fontSize: 13, fontWeight: selected ? 600 : 500, color: selected ? '#fff' : 'text.primary', lineHeight: 1.3 }}>
                    {p.title}
                  </Typography>
                </Box>
              )
            })}
          </Box>

          {/* Right: description + bullets of selected preset */}
          <Box sx={{ flex: 1, px: 3, py: 2.5, bgcolor: 'background.default' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'primary.main', mb: 0.5 }}>
              {selectedPreset.title}
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1.5, lineHeight: 1.5 }}>
              {selectedPreset.description}
            </Typography>
            <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {selectedPreset.bullets.map((b, i) => (
                <Box key={i} component="li" sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0, mt: '6px' }} />
                  <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>{b}</Typography>
                </Box>
              ))}
            </Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 1.5, lineHeight: 1.5 }}>
              <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>Best for: </Box>
              {selectedPreset.bestFor}
            </Typography>
            {config.customised && (
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'warning.main', mt: 2 }}>
                Settings customised from preset defaults
              </Typography>
            )}
          </Box>

        </Box>
      </Box>

      {/* Preset change warning — shown when editing a used template */}
      {showPresetChangeWarning && (
        <Box sx={{
          mt: 1.5, px: 2.5, py: 2, borderRadius: 1.5,
          bgcolor: t => t.palette.mode === 'dark' ? 'rgba(166,124,0,0.10)' : '#FFFBE6',
          border: t => `1px solid ${t.palette.mode === 'dark' ? 'rgba(212,168,0,0.30)' : '#F0D060'}`,
        }}>
          <Typography sx={{ fontSize: 13, lineHeight: 1.6, color: t => t.palette.mode === 'dark' ? '#FAD84A' : '#6B5000' }}>
            ⚠ Changing the judging method will affect how new competitions using this template are set up. Existing competitions using this template are unaffected.
          </Typography>
        </Box>
      )}

      {/* ── Number of judges ── */}
      <AnimatedReveal show={preset !== 'member-vote' && preset !== 'end-of-year'}>
        <FormSection>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>
                Number of judges
              </Typography>
              <Box>
                <Select
                  size="small"
                  value={judgeCountValue}
                  onChange={e => {
                    const v = e.target.value
                    if (v === 'custom') onChange({ numberOfJudges: Math.max(6, config.numberOfJudges) })
                    else onChange({ numberOfJudges: Number(v) })
                  }}
                  sx={{ fontSize: 13, fontFamily: 'inherit', minWidth: 160 }}
                >
                  <MenuItem value="1" sx={{ fontSize: 13, fontFamily: 'inherit' }}>1</MenuItem>
                  <MenuItem value="2" sx={{ fontSize: 13, fontFamily: 'inherit' }}>2</MenuItem>
                  <MenuItem value="3" sx={{ fontSize: 13, fontFamily: 'inherit' }}>3</MenuItem>
                  <MenuItem value="4" sx={{ fontSize: 13, fontFamily: 'inherit' }}>4</MenuItem>
                  <MenuItem value="5" sx={{ fontSize: 13, fontFamily: 'inherit' }}>5</MenuItem>
                  <MenuItem value="custom" sx={{ fontSize: 13, fontFamily: 'inherit' }}>Custom…</MenuItem>
                </Select>
                <AnimatedReveal show={isCustomCount}>
                  <Box sx={{ mt: 1.5 }}>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.75 }}>Enter number</Typography>
                    <OutlinedInput
                      size="small"
                      type="number"
                      slotProps={{ input: { min: 1 } as any }}
                      value={config.numberOfJudges}
                      onChange={e => onChange({ numberOfJudges: Math.max(1, parseInt(e.target.value) || 1) })}
                      sx={{ width: 80 }}
                    />
                  </Box>
                </AnimatedReveal>
              </Box>
            </Box>
            <Typography sx={{ flex: 1, fontSize: 12, color: 'text.secondary', lineHeight: 1.6 }}>
              {judgeCountDesc}
            </Typography>
          </Box>
          <AnimatedReveal show={config.numberOfJudges >= 2 && (preset === 'simple-scored' || preset === 'salon')}>
            <Box>
              <SettingRow
                label="Score aggregation"
                description={aggregationDesc}
              >
                <Select
                  size="small"
                  value={config.scoreAggregation}
                  onChange={e => updateSetting({ scoreAggregation: e.target.value as ScoreAggregation })}
                  sx={{ fontSize: 13, fontFamily: 'inherit', minWidth: 180 }}
                >
                  <MenuItem value="sum"           sx={{ fontSize: 13, fontFamily: 'inherit' }}>Sum</MenuItem>
                  <MenuItem value="average"       sx={{ fontSize: 13, fontFamily: 'inherit' }}>Average</MenuItem>
                  <MenuItem value="drop-high-low" sx={{ fontSize: 13, fontFamily: 'inherit' }}>Drop high + low</MenuItem>
                </Select>
              </SettingRow>
              <ClubDefaultIndicator currentValue={config.scoreAggregation} defaultValue={CLUB_DEFAULTS.defaultScoreAggregation} onReset={() => updateSetting({ scoreAggregation: CLUB_DEFAULTS.defaultScoreAggregation })} />
            </Box>
          </AnimatedReveal>
          <AnimatedReveal show={config.numberOfJudges >= 2}>
            <Box>
              <SettingRow
                label="View other judges' scores"
                description={viewOtherScoresDesc}
              >
                <Switch size="small" checked={config.viewOtherJudgesScores} onChange={e => updateSetting({ viewOtherJudgesScores: e.target.checked })} />
              </SettingRow>
            </Box>
          </AnimatedReveal>
        </FormSection>
      </AnimatedReveal>

      {/* ── Judge experience ── */}
      <AnimatedReveal show={preset !== 'member-vote' && preset !== 'end-of-year'}>
        <FormSection title="Judge experience">

          {/* Score range — simple-scored only */}
          <AnimatedReveal show={preset === 'simple-scored'}>
            <Box>
              <SettingRow
                label="Score range"
                description={scoreRangeDesc}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <OutlinedInput size="small" type="number" sx={{ width: 70 }} value={config.scoreMin} onChange={e => updateSetting({ scoreMin: +e.target.value })} />
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>to</Typography>
                  <OutlinedInput size="small" type="number" sx={{ width: 70 }} value={config.scoreMax} onChange={e => updateSetting({ scoreMax: +e.target.value })} />
                </Box>
              </SettingRow>
              <Box sx={{ mt: 0.75 }}>
                {scoreRangeAtDefault ? (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1, py: 0.25, borderRadius: '4px', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(74,127,196,0.15)' : 'rgba(30,77,140,0.08)' }}>
                    <Typography sx={{ fontSize: 11, color: 'primary.main', fontWeight: 500 }}>Default</Typography>
                  </Box>
                ) : (
                  <Button
                    size="small"
                    onClick={() => updateSetting({ scoreMin: CLUB_DEFAULTS.defaultScoreMin, scoreMax: CLUB_DEFAULTS.defaultScoreMax })}
                    sx={{ minWidth: 0, p: 0, fontSize: 11, color: 'primary.main', fontWeight: 500 }}
                  >
                    Restore to default
                  </Button>
                )}
              </Box>
            </Box>
          </AnimatedReveal>

          {/* Hide member names */}
          <Box>
            <SettingRow
              label="Hide member names during judging"
              description={hideNamesDesc}
            >
              <Switch size="small" checked={config.blindHideName} onChange={e => updateSetting({ blindHideName: e.target.checked })} />
            </SettingRow>
            <ClubDefaultIndicator
              currentValue={config.blindHideName}
              defaultValue={CLUB_DEFAULTS.defaultBlindHideName}
              onReset={() => updateSetting({ blindHideName: CLUB_DEFAULTS.defaultBlindHideName })}
            />
          </Box>

          {/* Written comments */}
          <Box>
            <SettingRow
              label="Require written feedback from judges"
              description={judgeCommentsDesc}
            >
              <Select
                size="small"
                value={config.judgeComments}
                onChange={e => updateSetting({ judgeComments: e.target.value as JudgeCommentsSetting })}
                sx={{ fontSize: 13, fontFamily: 'inherit', minWidth: 140 }}
              >
                <MenuItem value="none"     sx={{ fontSize: 13, fontFamily: 'inherit' }}>None</MenuItem>
                <MenuItem value="optional" sx={{ fontSize: 13, fontFamily: 'inherit' }}>Optional</MenuItem>
                <MenuItem value="required" sx={{ fontSize: 13, fontFamily: 'inherit' }}>Required…</MenuItem>
              </Select>
            </SettingRow>
            <ClubDefaultIndicator
              currentValue={config.judgeComments}
              defaultValue={CLUB_DEFAULTS.defaultJudgeComments}
              onReset={() => updateSetting({ judgeComments: CLUB_DEFAULTS.defaultJudgeComments })}
            />
            <AnimatedReveal show={config.judgeComments === 'required'}>
              <Box sx={{ mt: 1.5 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', mb: 0.75 }}>
                  Minimum character count
                </Typography>
                <OutlinedInput
                  size="small"
                  type="number"
                  slotProps={{ input: { min: 1 } as any }}
                  sx={{ width: 80 }}
                  value={config.minCommentLength}
                  onChange={e => updateSetting({ minCommentLength: +e.target.value })}
                />
                <ClubDefaultIndicator
                  currentValue={config.minCommentLength}
                  defaultValue={CLUB_DEFAULTS.defaultMinCommentLength}
                  onReset={() => updateSetting({ minCommentLength: CLUB_DEFAULTS.defaultMinCommentLength })}
                />
              </Box>
            </AnimatedReveal>
          </Box>

          {/* Minimum score to publish — simple-scored only */}
          <AnimatedReveal show={preset === 'simple-scored'}>
            <Box>
              <SettingRow
                label="Minimum score to publish results"
                description={minScoreDesc}
              >
                <Switch size="small" checked={config.minimumScoreToPublish} onChange={e => updateSetting({ minimumScoreToPublish: e.target.checked })} />
              </SettingRow>
              <Box sx={{ mt: 0.75 }}>
                {config.minimumScoreToPublish === CLUB_DEFAULTS.defaultMinimumScoreToPublish ? (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1, py: 0.25, borderRadius: '4px', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(74,127,196,0.15)' : 'rgba(30,77,140,0.08)' }}>
                    <Typography sx={{ fontSize: 11, color: 'primary.main', fontWeight: 500 }}>Default</Typography>
                  </Box>
                ) : (
                  <Button
                    size="small"
                    onClick={() => updateSetting({ minimumScoreToPublish: CLUB_DEFAULTS.defaultMinimumScoreToPublish, minimumScoreToPublishValue: CLUB_DEFAULTS.defaultMinimumScoreToPublishValue })}
                    sx={{ minWidth: 0, p: 0, fontSize: 11, color: 'primary.main', fontWeight: 500 }}
                  >
                    Restore to default
                  </Button>
                )}
              </Box>
              <AnimatedReveal show={config.minimumScoreToPublish}>
                <Box sx={{ mt: 1.5 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', mb: 0.75 }}>Minimum score</Typography>
                  <OutlinedInput size="small" type="number" sx={{ width: 80 }} value={config.minimumScoreToPublishValue} onChange={e => updateSetting({ minimumScoreToPublishValue: +e.target.value })} />
                </Box>
              </AnimatedReveal>
            </Box>
          </AnimatedReveal>

        </FormSection>
      </AnimatedReveal>

      {/* ── End of year settings ── */}
      <AnimatedReveal show={preset === 'end-of-year'}>
        <EoyPanel config={config} onChange={onChange} />
      </AnimatedReveal>

    </Box>
  )
}

// ─── End of Year Panel ────────────────────────────────────────────────────────

const EOY_QUALIFICATION_OPTIONS: { value: EoyQualificationSource; label: string }[] = [
  { value: 'top-scores',     label: 'Top scoring images from the season' },
  { value: 'award-winners',  label: 'Award winners only'                 },
  { value: 'both',           label: 'Both'                               },
]

function EoyPanel({ config, onChange }: {
  config:   CompetitionConfig
  onChange: (c: Partial<CompetitionConfig>) => void
}) {
  const qualificationDesc =
    config.eoyQualificationSource === 'top-scores'    ? 'Images with the highest season scores are invited to the showcase.' :
    config.eoyQualificationSource === 'award-winners' ? 'Only images that received awards during the season qualify.' :
                                                        'Award winners and top-scoring images are both included.'

  const imagesPerMemberDesc = `Each member can have up to ${config.eoyImagesPerMember} ${config.eoyImagesPerMember === 1 ? 'image' : 'images'} featured in the showcase.`

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
      <FormSection>

        {/* Qualification source */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', mb: 1.25 }}>
                Qualification source
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {EOY_QUALIFICATION_OPTIONS.map(opt => {
                  const selected = config.eoyQualificationSource === opt.value
                  return (
                    <Box
                      key={opt.value}
                      component="button"
                      onClick={() => onChange({ eoyQualificationSource: opt.value })}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        border: 'none',
                        bgcolor: 'transparent',
                        cursor: 'pointer',
                        p: 0,
                        textAlign: 'left',
                        fontFamily: 'inherit',
                      }}
                    >
                      <Box sx={{
                        width: 16, height: 16, borderRadius: '50%',
                        border: '2px solid', borderColor: selected ? 'primary.main' : 'divider',
                        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'background.paper',
                      }}>
                        {selected && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.main' }} />}
                      </Box>
                      <Typography sx={{ fontSize: 13, color: selected ? 'primary.main' : 'text.primary', fontWeight: selected ? 500 : 400 }}>
                        {opt.label}
                      </Typography>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          </Box>
          <Typography sx={{ flex: 1, fontSize: 12, color: 'text.secondary', lineHeight: 1.6 }}>
            {qualificationDesc}
          </Typography>
        </Box>

        {/* Images per member */}
        <SettingRow
          label="Images per member"
          description={imagesPerMemberDesc}
        >
          <OutlinedInput
            size="small"
            type="number"
            slotProps={{ input: { min: 1 } as any }}
            value={config.eoyImagesPerMember}
            onChange={e => onChange({ eoyImagesPerMember: Math.max(1, parseInt(e.target.value) || 1) })}
            sx={{ width: 80 }}
          />
        </SettingRow>

      </FormSection>
    </Box>
  )
}

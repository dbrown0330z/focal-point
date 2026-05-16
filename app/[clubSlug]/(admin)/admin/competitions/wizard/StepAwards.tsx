'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  OutlinedInput,
  Switch,
  Typography,
} from '@mui/material'
import { AnimatedReveal, FormSection } from './shared'
import {
  CompetitionConfig,
  RecognitionAward,
  RecognitionDefaults,
  BenchmarkConfig,
  POYConfig,
  CLUB_DEFAULTS,
  JudgingPreset,
} from '@/types/competition'

interface Props {
  config:     CompetitionConfig
  onChange:   (c: Partial<CompetitionConfig>) => void
  onBlocked?: (blocked: boolean) => void
}

interface SectionSharedProps {
  config:           CompetitionConfig
  onChange:         (c: Partial<CompetitionConfig>) => void
  defaults:         RecognitionDefaults | null
  loading:          boolean
  fetchError:       boolean
  justResolved:     boolean
  onRetry:          () => void
  onConfigureClick: () => void
}

// ─── Info banner ───────────────────────────────────────────────────────────────

const BANNER_TEXT: Record<JudgingPreset, string> = {
  'simple-scored': 'These settings are suggested based on your choice of Simple scored judging. You can change anything here — adjustments apply to this competition only and won\'t affect your club defaults.',
  'salon':         'These settings are suggested based on your choice of Salon style judging. You can change anything here — adjustments apply to this competition only and won\'t affect your club defaults.',
  'awards-only':   'Awards are required for this judging preset. Benchmark and POY are not shown — they rely on numeric scores which Awards only doesn\'t produce.',
  'member-vote':   'These settings are suggested based on Member vote. Benchmark and POY are not shown — community votes don\'t produce the numeric scores they rely on.',
  'end-of-year':   'End of year draws from existing season results — no new scoring happens. Benchmark and POY are not shown as this competition type doesn\'t produce new scores.',
}

function InfoBanner({ preset }: { preset: JudgingPreset }) {
  return (
    <Box sx={{
      p: 2.5, borderRadius: 2,
      border: t => `1px solid ${t.palette.mode === 'dark' ? 'rgba(0,151,167,0.35)' : '#9DD9C5'}`,
      bgcolor: t => t.palette.mode === 'dark' ? 'rgba(0,151,167,0.10)' : '#F0FAF7',
    }}>
      <Typography sx={{ fontSize: 13, lineHeight: 1.6, color: t => t.palette.mode === 'dark' ? '#4ECDE6' : '#0A5742' }}>
        {BANNER_TEXT[preset]}
      </Typography>
    </Box>
  )
}

// ─── Toggle row ────────────────────────────────────────────────────────────────

function ToggleRow({ label, isOn, onChange, tag, offDescription }: {
  label:          string
  isOn:           boolean
  onChange:       (v: boolean) => void
  tag?:           string
  offDescription: string
}) {
  const highlighted = isOn && tag === 'Suggested for this preset'
  const showTag     = isOn && !!tag
  return (
    <Box sx={{
      px: highlighted ? 2 : 0,
      py: highlighted ? 1.5 : 0,
      borderRadius: highlighted ? 1.5 : 0,
      bgcolor: highlighted ? (t => t.palette.mode === 'dark' ? 'rgba(0,151,167,0.10)' : '#F0FAF7') : 'transparent',
      border: highlighted ? (t => `1px solid ${t.palette.mode === 'dark' ? 'rgba(0,151,167,0.35)' : '#9DD9C5'}`) : 'none',
      transition: 'background-color 0.2s, border-color 0.2s',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>
            {label}
          </Typography>
          {showTag && (
            <Typography sx={{ fontSize: 12, color: highlighted ? (t => t.palette.mode === 'dark' ? '#4ECDE6' : '#0A5742') : 'text.secondary', whiteSpace: 'nowrap' }}>
              · {tag}
            </Typography>
          )}
        </Box>
        <Switch size="small" checked={isOn} onChange={e => onChange(e.target.checked)} />
      </Box>
      {!isOn && (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          {offDescription}
        </Typography>
      )}
    </Box>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function StepAwards({ config, onChange, onBlocked }: Props) {
  const preset = config.judgingPreset

  const [defaults,     setDefaults]     = useState<RecognitionDefaults | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [fetchError,   setFetchError]   = useState(false)
  const [justResolved, setJustResolved] = useState(false)

  const [configureWarning, setConfigureWarning] = useState(false)
  const clubDefaultsTabRef = useRef(false)
  const lastPresetRef      = useRef<JudgingPreset | null>(null)
  const onChangeRef        = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })

  // ── Pre-select on preset change ──────────────────────────────────────────
  useEffect(() => {
    if (lastPresetRef.current === preset) return
    lastPresetRef.current = preset

    if (preset === 'simple-scored' || preset === 'salon') {
      onChangeRef.current({ awardsEnabled: false, benchmarkEnabled: true, countTowardPOY: true })
    } else if (preset === 'awards-only') {
      onChangeRef.current({ awardsEnabled: true, benchmarkEnabled: false, countTowardPOY: false })
    } else {
      onChangeRef.current({ awardsEnabled: false, benchmarkEnabled: false, countTowardPOY: false })
    }
  }, [preset])

  // ── Fetch defaults ────────────────────────────────────────────────────────
  const loadDefaults = useCallback((fromTabReturn = false) => {
    setLoading(true)
    setFetchError(false)
    Promise.resolve(CLUB_DEFAULTS.recognitionDefaults)
      .then(data => {
        setDefaults(data)
        setLoading(false)
        if (fromTabReturn) {
          setJustResolved(true)
          setTimeout(() => setJustResolved(false), 1500)
        }
      })
      .catch(() => { setFetchError(true); setLoading(false) })
  }, [])

  useEffect(() => { loadDefaults() }, [loadDefaults])

  // ── Auto-resolve on tab return ───────────────────────────────────────────
  const handleConfigureClick = useCallback(() => {
    setConfigureWarning(true)
  }, [])

  function executeConfigureOpen() {
    setConfigureWarning(false)
    clubDefaultsTabRef.current = true
    window.open('/admin/club-defaults/recognition', '_blank')
  }

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && clubDefaultsTabRef.current) {
        clubDefaultsTabRef.current = false
        loadDefaults(true)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [loadDefaults])

  const awardsRequired = preset === 'awards-only'
  const showBenchmark  = preset === 'simple-scored' || preset === 'salon'
  const showPOY        = preset === 'simple-scored' || preset === 'salon'

  const shared: SectionSharedProps = {
    config, onChange, defaults, loading, fetchError, justResolved,
    onRetry: () => loadDefaults(),
    onConfigureClick: handleConfigureClick,
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
        <FormSection title="Recognition">
          <AwardsSection {...shared} required={awardsRequired} preset={preset} onBlocked={onBlocked} />
          {showBenchmark && <BenchmarkSection {...shared} />}
          {showPOY       && <POYSection {...shared} />}
        </FormSection>
      </Box>

      {/* Warning before opening Club Defaults */}
      <Dialog
        open={configureWarning}
        onClose={() => setConfigureWarning(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        <DialogTitle sx={{ pb: 0.5 }}>Edit recognition settings?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.7 }}>
            These are club-wide settings. Any changes you make will affect all competitions —
            not just this one. Benchmark classifications and season standings may be recalculated.
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.7, mt: 1.5 }}>
            Club Defaults will open in a new tab. Return here when you&apos;re done and the settings
            will refresh automatically.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" color="secondary" onClick={() => setConfigureWarning(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={executeConfigureOpen}>
            Open Club Defaults ↗
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// ─── Awards section ────────────────────────────────────────────────────────────

function AwardsSection({
  config, onChange, defaults, loading, fetchError, justResolved, onRetry, onConfigureClick,
  required, preset, onBlocked,
}: SectionSharedProps & { required: boolean; preset: JudgingPreset; onBlocked?: (v: boolean) => void }) {
  const [showOneOffForm, setShowOneOffForm] = useState(false)
  const [oneOffName,     setOneOffName]     = useState('')
  const [oneOffDesc,     setOneOffDesc]     = useState('')
  const [saveToLibrary,  setSaveToLibrary]  = useState(false)
  const [confirmOff,     setConfirmOff]     = useState(false)

  const isOn         = required || config.awardsEnabled
  const oneOffAwards = config.oneOffAwards ?? []
  const libAwards    = defaults?.awards ?? []
  const poyEnabled   = defaults?.poy?.configured ?? false
  const hasAnyAwards = libAwards.length > 0 || oneOffAwards.length > 0

  // Notify parent of blocking state (awards-only requires at least one award)
  useEffect(() => {
    if (required) onBlocked?.(!hasAnyAwards && !loading)
    else          onBlocked?.(false)
  }, [required, hasAnyAwards, loading, onBlocked])

  const handleToggleOff = () => {
    if (oneOffAwards.length > 0) { setConfirmOff(true); return }
    onChange({ awardsEnabled: false })
  }

  const executeOff = () => {
    onChange({ awardsEnabled: false, oneOffAwards: [] })
    setConfirmOff(false)
  }

  const addOneOff = () => {
    if (!oneOffName.trim()) return
    const award: RecognitionAward = {
      id:               Date.now().toString(),
      name:             oneOffName.trim(),
      description:      oneOffDesc.trim() || undefined,
      contributesToPOY: false,
      isOneOff:         true,
    }
    onChange({ oneOffAwards: [...oneOffAwards, award] })
    setOneOffName(''); setOneOffDesc(''); setSaveToLibrary(false); setShowOneOffForm(false)
  }

  const removeOneOff = (id: string) =>
    onChange({ oneOffAwards: oneOffAwards.filter(a => a.id !== id) })

  return (
    <Box>
      {required ? (
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>Awards</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.25 }}>
            Required for this judging preset.
          </Typography>
        </Box>
      ) : (
        <ToggleRow
          label="Awards"
          isOn={config.awardsEnabled}
          onChange={v => v ? onChange({ awardsEnabled: true }) : handleToggleOff()}
          tag="Optional for this preset"
          offDescription="No awards will be given. Images are scored and ranked only."
        />
      )}

      {/* Inline confirmation when toggling off with one-offs present */}
      {confirmOff && (
        <Box sx={{ mt: 1.5, p: 1.75, borderRadius: 1.5, bgcolor: 'warning.light', border: '1px solid', borderColor: t => t.palette.mode === 'dark' ? 'rgba(212,168,0,0.35)' : 'rgba(166,124,0,0.25)' }}>
          <Typography sx={{ fontSize: 12, color: 'warning.contrastText', lineHeight: 1.6, mb: 1.25 }}>
            Remove awards from this competition? Any one-off awards you've added will be lost.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Button size="small" variant="outlined" onClick={executeOff}
              sx={{ fontSize: 12, borderColor: 'warning.main', color: 'warning.contrastText', '&:hover': { bgcolor: t => t.palette.mode === 'dark' ? 'rgba(212,168,0,0.10)' : 'rgba(166,124,0,0.06)', borderColor: 'warning.main' } }}>
              Remove awards
            </Button>
            <Button size="small" onClick={() => setConfirmOff(false)}
              sx={{ fontSize: 12, color: 'warning.contrastText', p: 0, minWidth: 0, opacity: 0.7 }}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      <AnimatedReveal show={isOn && !confirmOff}>
        <Box sx={{ mt: 1.5, ml: '20px', display: 'flex', flexDirection: 'column', gap: 1.5 }}>

          {loading && <LoadingCard />}
          {!loading && fetchError && <ErrorCard onRetry={onRetry} />}

          {!loading && !fetchError && (hasAnyAwards ? (
            <AwardsSummaryCard
              libAwards={libAwards}
              oneOffAwards={oneOffAwards}
              onRemoveOneOff={removeOneOff}
              poyEnabled={poyEnabled}
              justResolved={justResolved}
              onConfigureClick={onConfigureClick}
              required={required}
            />
          ) : (
            <WarningCard
              message={required
                ? 'Awards only competitions require at least one award type before you can continue.'
                : 'Add awards in Club Defaults or create a one-off award for this competition.'
              }
              onConfigure={onConfigureClick}
              onRefresh={onRetry}
            />
          ))}

          {!loading && !fetchError && (showOneOffForm ? (
            <OneOffAwardForm
              name={oneOffName}
              desc={oneOffDesc}
              saveToLibrary={saveToLibrary}
              onNameChange={setOneOffName}
              onDescChange={setOneOffDesc}
              onSaveToLibraryChange={setSaveToLibrary}
              onAdd={addOneOff}
              onCancel={() => { setShowOneOffForm(false); setOneOffName(''); setOneOffDesc('') }}
            />
          ) : (
            <Button
              size="small"
              onClick={() => setShowOneOffForm(true)}
              sx={{ alignSelf: 'flex-start', minWidth: 0, p: 0, fontSize: 12, color: 'primary.main', fontWeight: 500 }}
            >
              + Add a one-off award for this competition only
            </Button>
          ))}

        </Box>
      </AnimatedReveal>
    </Box>
  )
}

// ─── Benchmark section ─────────────────────────────────────────────────────────

function BenchmarkSection({ config, onChange, defaults, loading, fetchError, justResolved, onRetry, onConfigureClick }: SectionSharedProps) {
  const isOn        = config.benchmarkEnabled
  const benchConfig = defaults?.benchmark

  return (
    <Box>
      <ToggleRow
        label="Benchmark"
        isOn={isOn}
        onChange={v => onChange({ benchmarkEnabled: v })}
        tag="Suggested for this preset"
        offDescription="Scores will not contribute to classification bands."
      />
      <AnimatedReveal show={isOn}>
        <Box sx={{ mt: 1.5, ml: '20px' }}>
          {loading  && <LoadingCard />}
          {!loading && fetchError && <ErrorCard onRetry={onRetry} />}
          {!loading && !fetchError && (benchConfig?.configured ? (
            <BenchmarkSummaryCard benchmark={benchConfig} justResolved={justResolved} onConfigureClick={onConfigureClick} />
          ) : (
            <WarningCard
              message="Scores will be recorded but classifications won't apply until bands are defined."
              onConfigure={onConfigureClick}
              onRefresh={onRetry}
            />
          ))}
        </Box>
      </AnimatedReveal>
    </Box>
  )
}

// ─── POY section ──────────────────────────────────────────────────────────────

function POYSection({ config, onChange, defaults, loading, fetchError, justResolved, onRetry, onConfigureClick }: SectionSharedProps) {
  const isOn      = config.countTowardPOY
  const poyConfig = defaults?.poy

  return (
    <Box>
      <ToggleRow
        label="Photographer of the Year"
        isOn={isOn}
        onChange={v => onChange({ countTowardPOY: v })}
        tag="Suggested for this preset"
        offDescription={'Scores will not contribute to season standings.\nMember rankings will not be affected.'}
      />
      <AnimatedReveal show={isOn}>
        <Box sx={{ mt: 1.5, ml: '20px' }}>
          {loading  && <LoadingCard />}
          {!loading && fetchError && <ErrorCard onRetry={onRetry} />}
          {!loading && !fetchError && (poyConfig?.configured ? (
            <POYSummaryCard poy={poyConfig} justResolved={justResolved} onConfigureClick={onConfigureClick} />
          ) : (
            <WarningCard
              message="Scores will be recorded but season standings won't calculate until POY is set up in Club Defaults."
              onConfigure={onConfigureClick}
              onRefresh={onRetry}
            />
          ))}
        </Box>
      </AnimatedReveal>
    </Box>
  )
}

// ─── Awards summary card ───────────────────────────────────────────────────────

function AwardsSummaryCard({ libAwards, oneOffAwards, onRemoveOneOff, poyEnabled, justResolved, onConfigureClick, required }: {
  libAwards:        RecognitionAward[]
  oneOffAwards:     RecognitionAward[]
  onRemoveOneOff:   (id: string) => void
  poyEnabled:       boolean
  justResolved:     boolean
  onConfigureClick: () => void
  required:         boolean
}) {
  const allAwards = [...libAwards, ...oneOffAwards]

  const introText = required
    ? 'Judges assign awards directly. No numeric scoring.'
    : 'Judges assign awards to standout images.'

  const footerNote = required
    ? 'At least one award required to publish.'
    : 'Awards appear on member profiles and in competition results when published.'

  return (
    <Box sx={{
      border: '1px solid',
      borderColor: justResolved ? 'success.main' : 'divider',
      borderRadius: 1.5,
      overflow: 'hidden',
      transition: 'border-color 0.4s',
    }}>
      <Box sx={{ px: 2, py: 1.75 }}>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6, mb: 1.25 }}>
          {introText}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {allAwards.map(award => {
            const mainParts = [award.name, award.visualIndicator].filter(Boolean)
            const mainLine  = mainParts.join(' — ')

            const meta: string[] = []
            if (award.isOneOff && award.description) meta.push(award.description)

            return (
              <Box key={award.id} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: 13, color: 'text.primary' }}>· {mainLine}</Typography>
                    {award.isOneOff && (
                      <Typography sx={{ fontSize: 11, color: 'text.secondary', bgcolor: 'background.default', px: 0.75, py: 0.125, borderRadius: 0.5, lineHeight: 1.6 }}>
                        This competition only
                      </Typography>
                    )}
                  </Box>
                  {meta.length > 0 && (
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', ml: 1.5 }}>
                      {meta.join(' · ')}
                    </Typography>
                  )}
                </Box>
                {award.isOneOff && (
                  <Button size="small" onClick={() => onRemoveOneOff(award.id)}
                    sx={{ fontSize: 11, color: 'error.main', p: 0, minWidth: 0, flexShrink: 0, mt: 0.25 }}>
                    Remove
                  </Button>
                )}
              </Box>
            )
          })}
        </Box>

        <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 1.5, lineHeight: 1.6 }}>
          {footerNote}
        </Typography>
      </Box>

      {libAwards.length > 0 && <SummaryCardFooter onConfigureClick={onConfigureClick} />}
    </Box>
  )
}

// ─── Benchmark summary card ────────────────────────────────────────────────────

function BenchmarkSummaryCard({ benchmark, justResolved, onConfigureClick }: {
  benchmark:        BenchmarkConfig
  justResolved:     boolean
  onConfigureClick: () => void
}) {
  return (
    <Box sx={{
      border: '1px solid',
      borderColor: justResolved ? 'success.main' : 'divider',
      borderRadius: 1.5,
      overflow: 'hidden',
      transition: 'border-color 0.4s',
    }}>
      <Box sx={{ px: 2, py: 1.75 }}>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6, mb: 1.25 }}>
          Images will be classified against your club&apos;s bands when results are published:
        </Typography>

        {benchmark.bands && benchmark.bands.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.25 }}>
            {benchmark.bands.map((band, i) => (
              <Typography key={i} sx={{ fontSize: 13, color: 'text.primary' }}>
                · {band}
              </Typography>
            ))}
          </Box>
        )}

        <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.6 }}>
          Classifications update on member profiles when results are published.
        </Typography>
      </Box>
      <SummaryCardFooter onConfigureClick={onConfigureClick} />
    </Box>
  )
}

// ─── POY summary card ──────────────────────────────────────────────────────────

function poySummaryLine(poy: POYConfig): string {
  if (!poy.categoriesFactor) {
    const counting = poy.branchACounting ?? 'all'
    if (counting === 'top_n') {
      const n = poy.branchATopN ?? 5
      return `Only the best ${n} score${n === 1 ? '' : 's'} from the season count toward a member's standing.`
    }
    if (counting === 'exclude_lowest') {
      const n = poy.branchAExcludeN ?? 1
      return `All scores except the lowest ${n} from the season count toward a member's standing.`
    }
    return "All scores from the season count toward a member's standing."
  }
  if (poy.separatePerCategory) {
    const counting = poy.b1Counting ?? 'top_n'
    if (counting === 'top_n') {
      const n = poy.b1TopN ?? 3
      return `The best ${n} score${n === 1 ? '' : 's'} from each category count. Each category has its own POY winner.`
    }
    if (counting === 'exclude_lowest') {
      const n = poy.b1ExcludeN ?? 1
      return `All scores except the lowest ${n} from each category count. Each category has its own POY winner.`
    }
    return 'All scores within each category count. Each category has its own POY winner.'
  }
  const counting = poy.b2Counting ?? 'top_n'
  if (counting === 'top_n') {
    const n = poy.b2TopN ?? 4
    return `The best ${n} score${n === 1 ? '' : 's'} from each category contribute to a combined standing.`
  }
  const n = poy.b2ExcludeN ?? 1
  return `All scores except the lowest ${n} from each category contribute to a combined standing.`
}

function POYSummaryCard({ poy, justResolved, onConfigureClick }: {
  poy:              POYConfig
  justResolved:     boolean
  onConfigureClick: () => void
}) {
  return (
    <Box sx={{
      border: '1px solid',
      borderColor: justResolved ? 'success.main' : 'divider',
      borderRadius: 1.5,
      overflow: 'hidden',
      transition: 'border-color 0.4s',
    }}>
      <Box sx={{ px: 2, py: 1.75 }}>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6, mb: 1.25 }}>
          Results will feed into the {poy.season ? `${poy.season} ` : ''}POY standings:
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography sx={{ fontSize: 13, color: 'text.primary' }}>
            · {poySummaryLine(poy)}
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.primary' }}>
            · Rankings update across all members when results are published
          </Typography>
        </Box>
      </Box>
      <SummaryCardFooter onConfigureClick={onConfigureClick} />
    </Box>
  )
}

// ─── Summary card footer ───────────────────────────────────────────────────────

function SummaryCardFooter({ onConfigureClick }: { onConfigureClick: () => void }) {
  return (
    <Box sx={{
      px: 2, py: 1.25,
      bgcolor: 'background.default',
      borderTop: '1px solid', borderColor: 'divider',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        Configured in Club Defaults
      </Typography>
      <Button size="small" onClick={onConfigureClick}
        sx={{ fontSize: 12, color: 'primary.main', p: 0, minWidth: 0, fontWeight: 500 }}>
        Edit in defaults ↗
      </Button>
    </Box>
  )
}

// ─── Warning card ──────────────────────────────────────────────────────────────

function WarningCard({ message, onConfigure, onRefresh }: {
  message:     string
  onConfigure: () => void
  onRefresh:   () => void
}) {
  return (
    <Box sx={{ p: 2, bgcolor: 'warning.light', border: '1px solid', borderColor: t => t.palette.mode === 'dark' ? 'rgba(212,168,0,0.35)' : 'rgba(166,124,0,0.25)', borderRadius: 1.5 }}>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 1.5 }}>
        <Box sx={{ flexShrink: 0, mt: '2px', color: 'warning.main' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </Box>
        <Typography sx={{ fontSize: 12, color: 'warning.contrastText', lineHeight: 1.6 }}>
          {message}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button size="small" variant="outlined" onClick={onConfigure}
          sx={{
            fontSize: 12,
            borderColor: 'warning.main',
            color: 'warning.contrastText',
            '&:hover': { bgcolor: t => t.palette.mode === 'dark' ? 'rgba(212,168,0,0.10)' : 'rgba(166,124,0,0.06)', borderColor: 'warning.main' },
          }}>
          Configure in Club Defaults ↗
        </Button>
        <Button size="small" onClick={onRefresh}
          sx={{ fontSize: 12, color: 'warning.contrastText', p: 0, minWidth: 0, fontWeight: 400, opacity: 0.7, '&:hover': { opacity: 1, bgcolor: 'transparent' } }}>
          Refresh ↻
        </Button>
      </Box>
    </Box>
  )
}

// ─── Loading card ──────────────────────────────────────────────────────────────

function LoadingCard() {
  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <CircularProgress size={14} />
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Loading configuration…</Typography>
    </Box>
  )
}

// ─── Error card ────────────────────────────────────────────────────────────────

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'error.main', borderRadius: 1.5, bgcolor: 'error.light' }}>
      <Typography sx={{ fontSize: 12, color: 'error.contrastText', mb: 1.25 }}>
        Couldn't load Club Defaults configuration.
      </Typography>
      <Button size="small" onClick={onRetry}
        sx={{ fontSize: 12, color: 'primary.main', p: 0, minWidth: 0, fontWeight: 500 }}>
        Try again
      </Button>
    </Box>
  )
}

// ─── One-off award form ────────────────────────────────────────────────────────

function OneOffAwardForm({ name, desc, saveToLibrary, onNameChange, onDescChange, onSaveToLibraryChange, onAdd, onCancel }: {
  name:                  string
  desc:                  string
  saveToLibrary:         boolean
  onNameChange:          (v: string) => void
  onDescChange:          (v: string) => void
  onSaveToLibraryChange: (v: boolean) => void
  onAdd:                 () => void
  onCancel:              () => void
}) {
  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', mb: 1.5 }}>
        Add a one-off award
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', mb: 0.75 }}>Award name</Typography>
          <OutlinedInput
            size="small" autoFocus
            value={name}
            onChange={e => onNameChange(e.target.value)}
            placeholder="e.g. Best in Show"
            onKeyDown={e => {
              if (e.key === 'Enter')  { e.preventDefault(); onAdd() }
              if (e.key === 'Escape') onCancel()
            }}
            sx={{ width: 240 }}
          />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', mb: 0.75 }}>
            Description{' '}
            <Typography component="span" sx={{ fontSize: 12, fontWeight: 400 }}>(optional)</Typography>
          </Typography>
          <OutlinedInput
            size="small"
            value={desc}
            onChange={e => onDescChange(e.target.value)}
            placeholder="Brief description…"
            sx={{ width: 320 }}
          />
        </Box>
        <FormControlLabel
          control={<Checkbox size="small" checked={saveToLibrary} onChange={e => onSaveToLibraryChange(e.target.checked)} />}
          label={<Typography sx={{ fontSize: 12 }}>Save to club library for future use</Typography>}
          sx={{ m: 0 }}
        />
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button size="small" variant="contained" onClick={onAdd} disabled={!name.trim()} sx={{ fontSize: 12 }}>
            Add award
          </Button>
          <Button size="small" variant="outlined" color="secondary" onClick={onCancel} sx={{ fontSize: 12 }}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

'use client'

import { useState } from 'react'
import { Box, Button, Checkbox, Collapse, FormControlLabel, OutlinedInput, Typography } from '@mui/material'
import { CLUB_DEFAULTS, CompetitionConfig } from '@/types/competition'

interface Props {
  config:               CompetitionConfig
  onEdit:               (step: number) => void
  saveAsTemplate:       boolean
  onSaveAsTemplate:     (v: boolean) => void
  templateName:         string
  onTemplateName:       (v: string) => void
  selectedTemplateId:   string | null
  /** When true, always shows the name input without the "Save as template?" checkbox.
   *  Used in the dedicated create-template wizard where saving is always the intent. */
  hideTemplateCheckbox?: boolean
}

// ─── Shared icon ──────────────────────────────────────────────────────────────

const EDIT_ICON = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

// ─── Summary components ───────────────────────────────────────────────────────

function Section({ title, step, onEdit, children }: {
  title:    string
  step:     number
  onEdit:   (s: number) => void
  children: React.ReactNode
}) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', letterSpacing: '0.01em' }}>
          {title}
        </Typography>
        <Button
          size="small"
          onClick={() => onEdit(step)}
          sx={{ fontSize: 12, color: 'primary.main', p: 0, minWidth: 0 }}
        >
          Edit
        </Button>
      </Box>
      <Box sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {children}
      </Box>
    </Box>
  )
}

function Bullet({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
      <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6, flexShrink: 0 }}>·</Typography>
      <Box>
        <Typography sx={{ fontSize: 13, color: 'text.primary', lineHeight: 1.6 }}>{children}</Typography>
        {sub && (
          <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5 }}>{sub}</Typography>
        )}
      </Box>
    </Box>
  )
}

// ─── Detail panel sub-components ─────────────────────────────────────────────

function ReviewCard({ title, step, onEdit, children }: {
  title:    string
  step:     number
  onEdit:   (s: number) => void
  children: React.ReactNode
}) {
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{title}</Typography>
        <Button size="small" onClick={() => onEdit(step)} startIcon={EDIT_ICON} sx={{ fontSize: 12, color: 'primary.main', p: 0, minWidth: 0 }}>Edit</Button>
      </Box>
      <Box sx={{ '& > *': { px: 2.5, py: 1.1 }, '& > * + *': { borderTop: '1px solid', borderColor: 'divider' } }}>
        {children}
      </Box>
    </Box>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{value}</Typography>
    </Box>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StepReview({
  config, onEdit,
  saveAsTemplate, onSaveAsTemplate, templateName, onTemplateName,
  selectedTemplateId, hideTemplateCheckbox,
}: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const preset               = config.judgingPreset
  const showBenchmarkAndPOY  = preset === 'simple-scored' || preset === 'salon'

  // ── Entries & submissions ──────────────────────────────────────────────────

  const catCount  = config.categories.length
  const n         = config.maxEntriesPerMember
  const imagesLine = config.maxEntriesPerCategory
    ? `${n} image${n === 1 ? '' : 's'} total, ${config.maxEntriesPerCategory} max per category`
    : `${n} image${n === 1 ? '' : 's'} total`

  const longEdgeValue = config.imageLongEdgePreset === 'custom'
    ? `${config.imageLongEdgeCustom ?? '—'}px long edge`
    : `${config.imageLongEdgePreset}px long edge`

  // ── Judging ────────────────────────────────────────────────────────────────

  const judgesLine = preset !== 'member-vote'
    ? `${config.numberOfJudges} judge${config.numberOfJudges !== 1 ? 's' : ''}`
    : null

  const aggregationLine = config.numberOfJudges >= 2 && preset !== 'member-vote' && preset !== 'end-of-year'
    ? config.scoreAggregation === 'sum'     ? `Scores summed across ${config.numberOfJudges} judges`
    : config.scoreAggregation === 'average' ? `Scores averaged across ${config.numberOfJudges} judges`
    : `High and low scores dropped, remainder averaged`
    : null

  const scoredPreset  = preset === 'simple-scored' || preset === 'salon'
  const scoreRangeLine = scoredPreset
    ? `Judges score each image on a scale of ${config.scoreMin} to ${config.scoreMax}`
    : null

  const VOTE_METHOD_LABEL: Record<string, string> = {
    'star-rating': 'Star rating (1–5)',
    'single-pick': 'Single pick',
    'top-3':       'Top 3 picks',
    'approval':    'Approval voting',
  }

  const TIE_LABEL: Record<string, string> = {
    'show-tied':      'Show as tied',
    'reopen-voting':  'Reopen voting',
    'admin-decides':  'Admin decides',
  }

  const EOY_QUAL_LABEL: Record<string, string> = {
    'top-scores':    'Top scoring images',
    'award-winners': 'Award winners only',
    'both':          'Top scores and award winners',
  }

  // ── Recognition ────────────────────────────────────────────────────────────

  let awardsLine: string
  let awardsSubText: string | undefined
  if (preset === 'awards-only') {
    awardsLine    = 'Awards required'
    awardsSubText = 'Assigned directly by judges'
  } else if (config.awardsEnabled) {
    awardsLine    = 'Awards: on'
    awardsSubText = config.numberOfJudges === 1 ? 'Assigned by judge' : 'Assigned by judges'
  } else {
    awardsLine = 'No awards for this competition'
  }

  const benchmarkLine = showBenchmarkAndPOY
    ? (config.benchmarkEnabled
        ? 'Scores will contribute to benchmark classification'
        : 'Scores will not contribute to benchmark classification')
    : null

  const poySeason    = CLUB_DEFAULTS.recognitionDefaults.poy.season
  const poyLine = showBenchmarkAndPOY
    ? (config.countTowardPOY
        ? `Scores will contribute to Photographer of the Year${poySeason ? ` — ${poySeason} season` : ''}`
        : 'Scores will not contribute to POY standings')
    : null

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Heading */}
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: 'text.primary' }}>
        Here&rsquo;s what you&rsquo;ve set up
      </Typography>

      {/* ── Entries & submissions ── */}
      <Section title="Entries & submissions" step={2} onEdit={onEdit}>
        {catCount === 0 ? (
          <Bullet>No categories selected</Bullet>
        ) : (
          <Bullet sub={config.categories.join(', ')}>
            {catCount} {catCount === 1 ? 'category' : 'categories'}, judged separately
          </Bullet>
        )}
        <Bullet>{imagesLine}</Bullet>
      </Section>

      {/* ── Judging ── */}
      <Section title="Judging" step={3} onEdit={onEdit}>
        {judgesLine      && <Bullet>{judgesLine}</Bullet>}
        {scoreRangeLine  && <Bullet>{scoreRangeLine}</Bullet>}
        {aggregationLine && <Bullet>{aggregationLine}</Bullet>}
      </Section>

      {/* ── Recognition ── */}
      <Section title="Recognition" step={4} onEdit={onEdit}>
        <Bullet sub={awardsSubText}>{awardsLine}</Bullet>
        {benchmarkLine && <Bullet>{benchmarkLine}</Bullet>}
        {poyLine       && <Bullet>{poyLine}</Bullet>}
      </Section>

      {/* ── Full settings (collapsible) ── */}
      <Box>
        <Box
          component="button"
          onClick={() => setDetailsOpen(o => !o)}
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', px: 2.5, py: 1.5,
            border: '1px solid', borderColor: 'divider',
            borderRadius: detailsOpen ? '8px 8px 0 0' : 2,
            bgcolor: 'background.paper', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'border-radius 0s 0.1s',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
            Full settings
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', transform: detailsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </Box>
        </Box>

        <Collapse in={detailsOpen} timeout={200}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderTop: 'none', borderRadius: '0 0 8px 8px', p: 3, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

              {/* ── Step 2: Entries & submissions ── */}
              <ReviewCard title="Entries & submissions" step={2} onEdit={onEdit}>
                <Row label="Categories"           value={config.categories.length > 0 ? config.categories.join(', ') : 'None'} />
                {config.categories.length >= 2 &&
                  <Row label="Judged separately"  value={config.judgeSeparateCategories ? 'Yes' : 'No'} />}
                <Row label="Max entries / member" value={config.maxEntriesPerMember} />
                {config.maxEntriesPerCategory &&
                  <Row label="Max entries / category" value={config.maxEntriesPerCategory} />}
                <Row label="Image long edge"      value={config.imageLongEdgePreset === 'custom' ? `${config.imageLongEdgeCustom ?? '—'}px` : `${config.imageLongEdgePreset}px`} />
                {config.imageFileSizeMaxMB &&
                  <Row label="Max file size"      value={`${config.imageFileSizeMaxMB}MB`} />}
                <Row label="Capture date"         value={config.requireCaptureDate ? `Last ${config.captureDateAmount} ${config.captureDateUnit}` : 'Not required'} />
                <Row label="Image reuse"          value={config.imageReusePolicy.replace(/-/g, ' ')} />
                <Row label="Withdrawals"          value={config.allowWithdrawals ? 'Allowed' : 'Not allowed'} />
              </ReviewCard>

              {/* ── Step 3: Judging & scoring ── */}
              <ReviewCard title="Judging & scoring" step={3} onEdit={onEdit}>
                <Row label="Preset" value={<span style={{ textTransform: 'capitalize' }}>{preset.replace(/-/g, ' ')}{config.customised ? ' (customised)' : ''}</span>} />

                {/* Judge count — all judged presets */}
                {preset !== 'member-vote' && preset !== 'end-of-year' &&
                  <Row label="Judges" value={config.numberOfJudges} />}

                {/* Simple scored */}
                {preset === 'simple-scored' && <>
                  <Row label="Score range"    value={`${config.scoreMin} – ${config.scoreMax}`} />
                  {config.allowDecimals      && <Row label="Half points"           value="Allowed" />}
                  {config.numberOfJudges >= 2 && <Row label="Score aggregation"    value={config.scoreAggregation} />}
                  {config.minimumScoreToPublish && <Row label="Min score to publish" value={config.minimumScoreToPublishValue} />}
                </>}

                {/* Salon */}
                {preset === 'salon' && <>
                  <Row label="Acceptance method" value={config.acceptanceMethod.replace(/-/g, ' ')} />
                  {config.acceptanceMethod === 'score-threshold' && <Row label="Threshold"    value={`≥ ${config.acceptanceThreshold}`} />}
                  {config.acceptanceMethod === 'percentage'      && <Row label="Accept top"   value={`${config.acceptTopPercentage}%`} />}
                  <Row label="Acceptance rule"   value={config.acceptanceRule} />
                </>}

                {/* Awards only */}
                {preset === 'awards-only' &&
                  <Row label="Mode" value="Awards assigned directly by judges" />}

                {/* Member vote */}
                {preset === 'member-vote' && <>
                  <Row label="Voting method"      value={VOTE_METHOD_LABEL[config.votingMethod] ?? config.votingMethod} />
                  <Row label="Who can vote"        value={config.voterEligibility === 'active-members' ? 'Active members' : 'All members'} />
                  <Row label="Min votes required"  value={config.minimumVotesRequired} />
                  <Row label="Self-vote"           value={config.selfVoteBlocked ? 'Blocked' : 'Allowed'} />
                  <Row label="Show vote counts"    value={config.showVoteCountsDuringVoting ? 'During voting' : 'After results'} />
                  <Row label="Tie handling"        value={TIE_LABEL[config.tieHandling] ?? config.tieHandling} />
                </>}

                {/* End of year */}
                {preset === 'end-of-year' && <>
                  <Row label="Qualification source" value={EOY_QUAL_LABEL[config.eoyQualificationSource] ?? config.eoyQualificationSource} />
                  <Row label="Images per member"    value={config.eoyImagesPerMember} />
                </>}

                {/* Judge experience — judged presets only */}
                {preset !== 'member-vote' && preset !== 'end-of-year' && <>
                  <Row label="Member names"          value={config.blindHideName ? 'Anonymised' : 'Visible'} />
                  <Row label="Image metadata"        value={config.blindHideMetadata ? 'Hidden from judges' : 'Visible to judges'} />
                  <Row label="Written comments"      value={config.judgeComments === 'none' ? 'Not required' : config.judgeComments === 'optional' ? 'Optional' : `Required (min ${config.minCommentLength} chars)`} />
                  {config.numberOfJudges > 1 && <>
                    <Row label="View other judges' scores"    value={config.viewOtherJudgesScores ? 'Yes' : 'No'} />
                    <Row label="Individual scores in results" value={config.showIndividualScores ? 'Shown' : 'Hidden'} />
                  </>}
                </>}

                {/* People's Choice */}
                {config.peoplesChoiceEnabled && <>
                  <Row label="People's Choice"              value={config.peoplesChoiceLabel} />
                  <Row label="People's Choice — hide names" value={config.peoplesChoiceHideNames ? 'Yes' : 'No'} />
                </>}
              </ReviewCard>

              {/* ── Step 4: Recognition ── */}
              <ReviewCard title="Recognition" step={4} onEdit={onEdit}>
                <Row label="Awards"       value={config.awardsEnabled || preset === 'awards-only' ? 'Enabled' : 'Disabled'} />
                {showBenchmarkAndPOY && <Row label="Benchmark"    value={config.benchmarkEnabled ? 'Enabled' : 'Disabled'} />}
                {showBenchmarkAndPOY && <Row label="POY"          value={config.countTowardPOY ? `Enabled — ${poySeason ?? ''} season` : 'Disabled'} />}
              </ReviewCard>

            </Box>
          </Box>
        </Collapse>
      </Box>

      {/* ── Save as template ── */}
      {selectedTemplateId === null && (
        <Box sx={{ border: '1px solid', borderColor: 'primary.main', borderRadius: 2, bgcolor: 'rgba(30,77,140,0.03)', p: 2.5 }}>
          {hideTemplateCheckbox ? (
            /* Template-create mode: name is always required, no checkbox */
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>Name this template</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 2, lineHeight: 1.5 }}>
                Give this template a name so you can find and reuse it later.
              </Typography>
              <OutlinedInput
                size="small"
                autoFocus
                value={templateName}
                onChange={e => onTemplateName(e.target.value)}
                placeholder="e.g. Monthly Scored Competition"
                sx={{ width: 360 }}
              />
            </Box>
          ) : (
            /* Competition-create mode: optional, behind a checkbox */
            <>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>Save as a template?</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 2, lineHeight: 1.5 }}>
                Templates let you reuse this configuration for future competitions without re-entering all the settings.
              </Typography>
              <FormControlLabel
                control={<Checkbox size="small" checked={saveAsTemplate} onChange={e => onSaveAsTemplate(e.target.checked)} />}
                label={<Typography sx={{ fontSize: 13 }}>Save these settings as a reusable template</Typography>}
                sx={{ ml: 0, mb: saveAsTemplate ? 1.5 : 0 }}
              />
              {saveAsTemplate && (
                <Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', mb: 0.75 }}>Template name</Typography>
                  <OutlinedInput
                    size="small"
                    value={templateName}
                    onChange={e => onTemplateName(e.target.value)}
                    placeholder="e.g. Monthly Scored Competition"
                    sx={{ width: 360 }}
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      )}

    </Box>
  )
}

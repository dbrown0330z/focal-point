'use client'

import { Box, OutlinedInput, Switch, Typography } from '@mui/material'
import {
  AnimatedReveal,
  ClubDefaultIndicator,
  FormSection,
  SegmentedControl,
  SettingRow,
} from './shared'
import {
  CompetitionConfig,
  JudgeCommentsSetting,
  ResultsVisibility,
  CLUB_DEFAULTS,
} from '@/types/competition'

interface Props {
  config: CompetitionConfig
  onChange: (c: Partial<CompetitionConfig>) => void
}

export function StepJudgesVisibility({ config, onChange }: Props) {
  const isMemberVote = config.judgingPreset === 'member-vote'

  if (isMemberVote) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
        <Box sx={{ display: 'flex', gap: 2, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#F7F8FA' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A6C82" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
          </svg>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>Member vote competitions don't require judge assignment</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5 }}>
              All eligible club members vote directly — there are no appointed judges. The settings below control voter anonymity and how results are shared.
            </Typography>
          </Box>
        </Box>

        <FormSection title="Voter privacy">
          <Box>
            <SettingRow
              label="Hide member names from voters"
              description="Member names will be hidden during voting so choices aren't influenced by who submitted."
            >
              <Switch size="small" checked={config.blindHideName} onChange={e => onChange({ blindHideName: e.target.checked })} />
            </SettingRow>
            <ClubDefaultIndicator
              currentValue={config.blindHideName}
              defaultValue={CLUB_DEFAULTS.defaultBlindHideName}
              onReset={() => onChange({ blindHideName: CLUB_DEFAULTS.defaultBlindHideName })}
            />
          </Box>
        </FormSection>

        <FormSection title="Results visibility">
          <SettingRow label="Who can see results">
            <SegmentedControl
              value={config.resultsVisibility}
              onChange={v => onChange({ resultsVisibility: v })}
              options={[
                { value: 'members' as ResultsVisibility, label: 'Members only' },
                { value: 'public' as ResultsVisibility, label: 'Public' },
                { value: 'hidden' as ResultsVisibility, label: 'Hidden' },
              ]}
            />
          </SettingRow>
          <ClubDefaultIndicator
            currentValue={config.resultsVisibility}
            defaultValue={CLUB_DEFAULTS.defaultResultsVisibility}
            onReset={() => onChange({ resultsVisibility: CLUB_DEFAULTS.defaultResultsVisibility })}
          />
        </FormSection>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>

      {/* Judge permissions */}
      <FormSection title="Judge permissions">
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 0.5 }}>
            {config.numberOfJudges} judge{config.numberOfJudges !== 1 ? 's' : ''} configured
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            These are template-level defaults. You can override per-judge settings when creating a competition instance.
          </Typography>
        </Box>

        <Box>
          <SettingRow
            label="Written comments"
            description={
              config.judgeComments === 'none'     ? 'Judges can only enter scores — no written feedback is recorded.' :
              config.judgeComments === 'optional' ? 'Judges can optionally add written comments alongside their scores.' :
              'Judges must provide written feedback for every entry before submitting.'
            }
          >
            <SegmentedControl
              value={config.judgeComments}
              onChange={v => onChange({ judgeComments: v })}
              options={[
                { value: 'none' as JudgeCommentsSetting, label: 'None' },
                { value: 'optional' as JudgeCommentsSetting, label: 'Optional' },
                { value: 'required' as JudgeCommentsSetting, label: 'Required' },
              ]}
            />
          </SettingRow>
          <ClubDefaultIndicator
            currentValue={config.judgeComments}
            defaultValue={CLUB_DEFAULTS.defaultRequireComments ? 'required' : 'none'}
            onReset={() => onChange({ judgeComments: CLUB_DEFAULTS.defaultRequireComments ? 'required' : 'none' })}
          />

          <AnimatedReveal show={config.judgeComments === 'required'}>
            <Box sx={{ mt: 1.5 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', mb: 0.75 }}>
                Minimum character count
              </Typography>
              <OutlinedInput
                size="small"
                type="number"
                inputProps={{ min: 1 }}
                sx={{ width: 80 }}
                value={config.minCommentLength}
                onChange={e => onChange({ minCommentLength: +e.target.value })}
              />
              <ClubDefaultIndicator
                currentValue={config.minCommentLength}
                defaultValue={CLUB_DEFAULTS.defaultMinCommentLength}
                onReset={() => onChange({ minCommentLength: CLUB_DEFAULTS.defaultMinCommentLength })}
              />
            </Box>
          </AnimatedReveal>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <SettingRow
              label="Hide member names"
              description="Member names will be hidden from judges during judging."
            >
              <Switch size="small" checked={config.blindHideName} onChange={e => onChange({ blindHideName: e.target.checked })} />
            </SettingRow>
            <ClubDefaultIndicator
              currentValue={config.blindHideName}
              defaultValue={CLUB_DEFAULTS.defaultBlindHideName}
              onReset={() => onChange({ blindHideName: CLUB_DEFAULTS.defaultBlindHideName })}
            />
          </Box>

          <SettingRow
            label="Hide image metadata"
            description="EXIF and file metadata will be stripped from images shown to judges."
          >
            <Switch size="small" checked={config.blindHideMetadata} onChange={e => onChange({ blindHideMetadata: e.target.checked })} />
          </SettingRow>
        </Box>

        {config.numberOfJudges > 1 && (
          <SettingRow
            label="View other judges' scores"
            description="Allow judges to see scores from other judges in real time."
          >
            <Switch size="small" checked={config.viewOtherJudgesScores} onChange={e => onChange({ viewOtherJudgesScores: e.target.checked })} />
          </SettingRow>
        )}
      </FormSection>

      {/* Results visibility */}
      <FormSection title="Results visibility">
        <Box>
          <SettingRow label="Who can see results">
            <SegmentedControl
              value={config.resultsVisibility}
              onChange={v => onChange({ resultsVisibility: v })}
              options={[
                { value: 'members' as ResultsVisibility, label: 'Members only' },
                { value: 'public' as ResultsVisibility, label: 'Public' },
                { value: 'hidden' as ResultsVisibility, label: 'Hidden' },
              ]}
            />
          </SettingRow>
          <ClubDefaultIndicator
            currentValue={config.resultsVisibility}
            defaultValue={CLUB_DEFAULTS.defaultResultsVisibility}
            onReset={() => onChange({ resultsVisibility: CLUB_DEFAULTS.defaultResultsVisibility })}
          />
        </Box>

        {config.numberOfJudges > 1 && (
          <SettingRow label="Show individual judge scores in results">
            <Switch size="small" checked={config.showIndividualScores} onChange={e => onChange({ showIndividualScores: e.target.checked })} />
          </SettingRow>
        )}
      </FormSection>

      {/* People's Choice voting settings — only shown if enabled in step 3 */}
      <AnimatedReveal show={config.peoplesChoiceEnabled}>
        <FormSection title="People's Choice voting">
          <Box>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>People's Choice voting</Typography>
              <Box sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: '#EDF0F5' }}>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Enabled in Awards</Typography>
              </Box>
            </Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Controls how the parallel People's Choice vote runs alongside official judging.
            </Typography>
          </Box>

          <SettingRow
            label="Hide member names from voters"
            description="Member names will be hidden during People's Choice voting."
          >
            <Switch size="small" checked={config.peoplesChoiceHideNames ?? true} onChange={e => onChange({ peoplesChoiceHideNames: e.target.checked })} />
          </SettingRow>
        </FormSection>
      </AnimatedReveal>

    </Box>
  )
}

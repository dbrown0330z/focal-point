'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import {
  Box,
  Button,
  Chip,
  MenuItem,
  OutlinedInput,
  Select,
  Switch,
  Typography,
} from '@mui/material'
import {
  AnimatedReveal,
  FormSection,
  OverrideRow,
  SettingRow,
} from './shared'
import {
  CompetitionConfig,
  ImageLongEdgePreset,
  ImageReusePolicy,
  CLUB_DEFAULTS,
} from '@/types/competition'
import { addCompetitionDefaultCategory } from '@/app/(admin)/admin/club-defaults/actions'

interface Props {
  config:              CompetitionConfig
  onChange:            (c: Partial<CompetitionConfig>) => void
  clubCategories:      string[]
  onAddClubCategory:   (name: string) => void
}

interface OverrideState {
  maxEntriesPerMember:  boolean
  maxEntriesPerCat:     boolean
  imageLongEdge:        boolean
  requireCaptureDate:   boolean
  imageReusePolicy:     boolean
  allowWithdrawals:     boolean
}

export function StepCategories({ config, onChange, clubCategories, onAddClubCategory }: Props) {
  const [overrides, setOverrides] = useState<OverrideState>({
    maxEntriesPerMember:  false,
    maxEntriesPerCat:     false,
    imageLongEdge:        false,
    requireCaptureDate:   false,
    imageReusePolicy:     false,
    allowWithdrawals:     false,
  })

  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategory,    setNewCategory]    = useState('')
  const [saving,         startSave]         = useTransition()

  // Keep a ref so the cleanup effect can read current config without being a dependency
  const configRef = useRef(config)
  configRef.current = config

  // Strip any selected categories that no longer exist in club defaults
  useEffect(() => {
    if (clubCategories.length === 0) return
    const current = configRef.current.categories
    const valid   = current.filter(c => clubCategories.includes(c))
    if (valid.length < current.length) {
      onChange({ categories: valid.length > 0 ? valid : [clubCategories[0]] })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubCategories])

  const override = (key: keyof OverrideState) =>
    setOverrides(prev => ({ ...prev, [key]: true }))

  const reset = (key: keyof OverrideState, defaults: Partial<CompetitionConfig>) => {
    setOverrides(prev => ({ ...prev, [key]: false }))
    onChange(defaults)
  }

  const toggleCategory = (cat: string) => {
    const selected = config.categories.includes(cat)
    if (selected) {
      if (config.categories.length > 1) onChange({ categories: config.categories.filter(c => c !== cat) })
    } else {
      onChange({ categories: [...config.categories, cat] })
    }
  }

  const addNewCategory = () => {
    const cat = newCategory.trim()
    if (!cat || clubCategories.includes(cat)) return
    startSave(async () => {
      const { id, error } = await addCompetitionDefaultCategory(cat)
      if (!error && id) {
        onAddClubCategory(cat)
        onChange({ categories: [...config.categories, cat] })
        setNewCategory('')
        setAddingCategory(false)
      }
    })
  }

  // ── Dynamic right-column descriptions ────────────────────────────────────
  const categoriesDesc = config.categories.length === 1
    ? `Members will enter in the ${config.categories[0]} category only.`
    : `Members can enter across ${config.categories.length} categories: ${config.categories.join(', ')}.`

  const reusePolicyLabel: Record<ImageReusePolicy, string> = {
    'once-per-type':   'Once per competition type',
    'once-per-season': 'Once per season',
    'once-ever':       'Once ever',
    'unrestricted':    'Unrestricted',
  }

  const maxPerMemberDesc = overrides.maxEntriesPerMember
    ? `Members can submit up to ${config.maxEntriesPerMember} ${config.maxEntriesPerMember === 1 ? 'entry' : 'entries'} to this competition.`
    : `Up to ${CLUB_DEFAULTS.defaultMaxEntriesPerMember} entries per member — the club default.`

  const maxPerCatDesc = overrides.maxEntriesPerCat
    ? config.maxEntriesPerCategory !== undefined
      ? `Members can submit up to ${config.maxEntriesPerCategory} ${config.maxEntriesPerCategory === 1 ? 'entry' : 'entries'} per category.`
      : 'No per-category limit for this competition.'
    : `Up to ${CLUB_DEFAULTS.defaultMaxEntriesPerCategory} entries per category — the club default.`

  const longEdgeDesc =
    config.imageLongEdgePreset === '1920' ? 'Matches standard HD projector resolution.' :
    config.imageLongEdgePreset === '1400' ? 'Matches legacy 4:3 projector resolution.' :
    config.imageLongEdgePreset === '3840' ? 'Matches 4K display resolution.' :
    config.imageLongEdgeCustom            ? `${config.imageLongEdgeCustom} px custom limit.` : 'Set a custom pixel limit.'

  const captureDateDesc = config.requireCaptureDate
    ? `Images must have been taken within the last ${config.captureDateAmount} ${config.captureDateUnit}.`
    : 'Images of any age can be submitted.'

  const reuseDesc =
    config.imageReusePolicy === 'once-per-type'   ? 'An image can be re-entered in a different competition type, but not the same one.' :
    config.imageReusePolicy === 'once-per-season' ? 'An image can only be entered once across all competitions this season.' :
    config.imageReusePolicy === 'once-ever'       ? 'An image can only be entered into a competition once, ever.' :
                                                    'The same image can be entered into any competition multiple times.'

  const withdrawalsDesc = config.allowWithdrawals
    ? 'Members can pull their entry back before submissions close.'
    : 'Entries cannot be withdrawn once submitted.'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>

      {/* Categories */}
      <FormSection title="Categories">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Left: chip toggles + custom + add */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {clubCategories.map(cat => {
                const selected = config.categories.includes(cat)
                return (
                  <Chip
                    key={cat}
                    label={cat}
                    size="small"
                    onClick={() => toggleCategory(cat)}
                    sx={{
                      fontFamily: 'inherit',
                      fontSize: 12,
                      cursor: 'pointer',
                      ...(selected
                        ? { bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } }
                        : { bgcolor: 'transparent', color: 'text.secondary', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }
                      ),
                    }}
                  />
                )
              })}
            </Box>

            {/* Add category */}
            {addingCategory ? (
              <Box sx={{ mt: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <OutlinedInput
                    size="small"
                    autoFocus
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="Category name…"
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); addNewCategory() }
                      if (e.key === 'Escape') { setAddingCategory(false); setNewCategory('') }
                    }}
                    sx={{ width: 200 }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    onClick={addNewCategory}
                    disabled={!newCategory.trim() || saving}
                  >
                    {saving ? 'Saving…' : 'Add'}
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    color="secondary"
                    onClick={() => { setAddingCategory(false); setNewCategory('') }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </Box>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.75, lineHeight: 1.5 }}>
                  This will be added to your club&apos;s default categories and available in all future competitions. Adding ad-hoc categories mid-season can affect benchmark and POY score aggregation.
                </Typography>
              </Box>
            ) : (
              <Button
                size="small"
                onClick={() => setAddingCategory(true)}
                sx={{ mt: 1.5, minWidth: 0, p: 0, fontSize: 12, color: '#1A6FC4', fontWeight: 500 }}
              >
                + Add a new category
              </Button>
            )}
          </Box>

          {/* Right: helper text */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.6 }}>
              {categoriesDesc}
            </Typography>
          </Box>
        </Box>

        <AnimatedReveal show={config.categories.length >= 2}>
          <SettingRow
            label="Judge categories separately"
            description={config.judgeSeparateCategories
              ? 'Each category is judged independently — results are not compared across categories.'
              : 'All categories are judged together in a single pool.'
            }
          >
            <Switch
              size="small"
              checked={config.judgeSeparateCategories}
              onChange={e => onChange({ judgeSeparateCategories: e.target.checked })}
            />
          </SettingRow>
        </AnimatedReveal>

      </FormSection>

      {/* Entry limits */}
      <FormSection title="Entry limits">
        <OverrideRow
          label="Max entries per member"
          defaultDisplay={CLUB_DEFAULTS.defaultMaxEntriesPerMember}
          isOverridden={overrides.maxEntriesPerMember}
          onOverride={() => override('maxEntriesPerMember')}
          onReset={() => reset('maxEntriesPerMember', { maxEntriesPerMember: CLUB_DEFAULTS.defaultMaxEntriesPerMember })}
          description={maxPerMemberDesc}
        >
          <OutlinedInput
            size="small"
            type="number"
            inputProps={{ min: 1 }}
            value={config.maxEntriesPerMember}
            onChange={e => onChange({ maxEntriesPerMember: parseInt(e.target.value) || 1 })}
            sx={{ width: 80 }}
          />
        </OverrideRow>

        <AnimatedReveal show={config.categories.length > 1}>
          <OverrideRow
            label="Max entries per category"
            defaultDisplay={CLUB_DEFAULTS.defaultMaxEntriesPerCategory ?? 'No limit'}
            isOverridden={overrides.maxEntriesPerCat}
            onOverride={() => override('maxEntriesPerCat')}
            onReset={() => reset('maxEntriesPerCat', { maxEntriesPerCategory: CLUB_DEFAULTS.defaultMaxEntriesPerCategory })}
            description={maxPerCatDesc}
          >
            <OutlinedInput
              size="small"
              type="number"
              inputProps={{ min: 1 }}
              value={config.maxEntriesPerCategory ?? ''}
              onChange={e => onChange({ maxEntriesPerCategory: parseInt(e.target.value) || undefined })}
              placeholder="No limit"
              sx={{ width: 80 }}
            />
          </OverrideRow>
        </AnimatedReveal>
      </FormSection>

      {/* Image requirements */}
      <FormSection title="Image requirements">
        <OverrideRow
          label="Long edge maximum"
          defaultDisplay={`${CLUB_DEFAULTS.defaultImageLongEdgePreset} px`}
          isOverridden={overrides.imageLongEdge}
          onOverride={() => override('imageLongEdge')}
          onReset={() => reset('imageLongEdge', {
            imageLongEdgePreset:  CLUB_DEFAULTS.defaultImageLongEdgePreset,
            imageLongEdgeCustom:  undefined,
          })}
          description={longEdgeDesc}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Select
              size="small"
              value={config.imageLongEdgePreset}
              onChange={e => onChange({ imageLongEdgePreset: e.target.value as ImageLongEdgePreset, imageLongEdgeCustom: undefined })}
              sx={{ fontSize: 13, fontFamily: 'inherit', minWidth: 100 }}
            >
              <MenuItem value="1400" sx={{ fontSize: 13, fontFamily: 'inherit' }}>1400 px</MenuItem>
              <MenuItem value="1920" sx={{ fontSize: 13, fontFamily: 'inherit' }}>1920 px</MenuItem>
              <MenuItem value="3840" sx={{ fontSize: 13, fontFamily: 'inherit' }}>3840 px</MenuItem>
              <MenuItem value="custom" sx={{ fontSize: 13, fontFamily: 'inherit' }}>Custom…</MenuItem>
            </Select>
            <AnimatedReveal show={config.imageLongEdgePreset === 'custom'}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <OutlinedInput
                  size="small"
                  type="number"
                  inputProps={{ min: 400, max: 10000 }}
                  value={config.imageLongEdgeCustom ?? ''}
                  onChange={e => onChange({ imageLongEdgeCustom: parseInt(e.target.value) || undefined })}
                  placeholder="px"
                  sx={{ width: 90 }}
                />
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>px</Typography>
              </Box>
            </AnimatedReveal>
          </Box>
        </OverrideRow>
      </FormSection>

      {/* Submission rules */}
      <FormSection title="Submission rules">
        <OverrideRow
          label="Restrict by when image was taken"
          defaultDisplay={CLUB_DEFAULTS.defaultRequireCaptureDate ? 'Required' : 'Not required'}
          isOverridden={overrides.requireCaptureDate}
          onOverride={() => override('requireCaptureDate')}
          onReset={() => reset('requireCaptureDate', { requireCaptureDate: CLUB_DEFAULTS.defaultRequireCaptureDate })}
          description={captureDateDesc}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Switch
              size="small"
              checked={config.requireCaptureDate}
              onChange={e => onChange({ requireCaptureDate: e.target.checked })}
            />
            <AnimatedReveal show={config.requireCaptureDate}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <OutlinedInput
                  size="small"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={config.captureDateAmount}
                  onChange={e => onChange({ captureDateAmount: parseInt(e.target.value) || 1 })}
                  sx={{ width: 60 }}
                />
                <Select
                  size="small"
                  value={config.captureDateUnit}
                  onChange={e => onChange({ captureDateUnit: e.target.value as 'years' | 'months' })}
                  sx={{ fontSize: 13, fontFamily: 'inherit' }}
                >
                  <MenuItem value="years" sx={{ fontSize: 13, fontFamily: 'inherit' }}>years</MenuItem>
                  <MenuItem value="months" sx={{ fontSize: 13, fontFamily: 'inherit' }}>months</MenuItem>
                </Select>
              </Box>
            </AnimatedReveal>
          </Box>
        </OverrideRow>

        <OverrideRow
          label="Image reuse policy"
          defaultDisplay={reusePolicyLabel[CLUB_DEFAULTS.defaultImageReusePolicy]}
          isOverridden={overrides.imageReusePolicy}
          onOverride={() => override('imageReusePolicy')}
          onReset={() => reset('imageReusePolicy', { imageReusePolicy: CLUB_DEFAULTS.defaultImageReusePolicy })}
          description={reuseDesc}
        >
          <Select
            size="small"
            value={config.imageReusePolicy}
            onChange={e => onChange({ imageReusePolicy: e.target.value as ImageReusePolicy })}
            sx={{ fontSize: 13, fontFamily: 'inherit', minWidth: 200 }}
          >
            <MenuItem value="once-per-type" sx={{ fontSize: 13, fontFamily: 'inherit' }}>Once per competition type</MenuItem>
            <MenuItem value="once-per-season" sx={{ fontSize: 13, fontFamily: 'inherit' }}>Once per season</MenuItem>
            <MenuItem value="once-ever" sx={{ fontSize: 13, fontFamily: 'inherit' }}>Once ever</MenuItem>
            <MenuItem value="unrestricted" sx={{ fontSize: 13, fontFamily: 'inherit' }}>Unrestricted</MenuItem>
          </Select>
        </OverrideRow>

        <OverrideRow
          label="Allow withdrawals"
          defaultDisplay={CLUB_DEFAULTS.defaultAllowWithdrawals ? 'Allowed' : 'Not allowed'}
          isOverridden={overrides.allowWithdrawals}
          onOverride={() => override('allowWithdrawals')}
          onReset={() => reset('allowWithdrawals', { allowWithdrawals: CLUB_DEFAULTS.defaultAllowWithdrawals })}
          description={withdrawalsDesc}
        >
          <Switch
            size="small"
            checked={config.allowWithdrawals}
            onChange={e => onChange({ allowWithdrawals: e.target.checked })}
          />
        </OverrideRow>
      </FormSection>

    </Box>
  )
}

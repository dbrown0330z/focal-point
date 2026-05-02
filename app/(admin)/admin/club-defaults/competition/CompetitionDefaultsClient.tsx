'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import {
  Alert,
  Box,
  Button,
  Divider,
  FormHelperText,
  FormLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { TrashBtn } from '@/components/ui/TrashBtn'
import { useUnsavedChanges } from '@/components/admin/UnsavedChangesProvider'
import {
  addCompetitionDefaultCategory,
  deleteCompetitionDefaultCategory,
  renameCompetitionDefaultCategory,
} from '../actions'

// ─── Types ────────────────────────────────────────────────────────────────────

type CompetitionDefaults = {
  // Entries & submissions
  max_entries_per_member:   number
  max_entries_per_category: number | null
  image_long_edge_preset:   '1920' | '1400' | '3840' | 'custom'
  image_long_edge_custom:   number | ''
  require_capture_date:     boolean
  capture_date_amount:      number
  capture_date_unit:        'years' | 'months'
  image_reuse_rule:         'unrestricted' | 'once_per_type' | 'once_per_season' | 'once_ever'
  withdrawal_frees_slot:    boolean

  // Scoring
  judging_method:    'simple-scored' | 'salon' | 'awards-only' | 'member-vote' | 'end-of-year'
  score_min:         number
  score_max:         number
  allow_decimals:    boolean
  score_aggregation: 'sum' | 'average' | 'drop_high_low'

  // Judge experience
  hide_member_names:        boolean
  hide_exif_data:           boolean
  require_judge_comments:   boolean
  judge_comments_min_chars: number

  // Kept for other sections (not shown here)
  score_min_to_publish_enabled: boolean
  score_min_to_publish:         number
  results_visibility:             'members-only' | 'members-first' | 'public-same-time'
  results_visibility_delay_hours: number
}

type Category = { id: string; name: string }

// ─── Inline-editable category row ────────────────────────────────────────────

function CategoryRow({ cat, onRename, onDelete, disabled }: {
  cat:      Category
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  disabled: boolean
}) {
  const [name, setName] = useState(cat.name)

  function handleBlur() {
    const trimmed = name.trim()
    if (!trimmed) { setName(cat.name); return }
    if (trimmed !== cat.name) onRename(cat.id, trimmed)
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <TextField
        size="small"
        value={name}
        onChange={e => setName(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        sx={{ width: 220, fontSize: 13 }}
      />
      <TrashBtn onClick={() => onDelete(cat.id)} disabled={disabled} />
    </Box>
  )
}

// ─── Shared layout components ─────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 17, fontWeight: 600, color: 'text.primary', mb: 1.5, mt: '15px' }}>
      {children}
    </Typography>
  )
}

/** Label + control in left 480px column, optional hint on the right. */
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 480, flexShrink: 0 }}>
        <FormLabel sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>{label}</FormLabel>
        <Box>{children}</Box>
      </Box>
      {hint !== undefined && (
        <FormHelperText sx={{ flex: 1, mx: 0, lineHeight: 1.5, color: 'text.disabled', maxWidth: 380 }}>
          {hint}
        </FormHelperText>
      )}
    </Box>
  )
}

/** Toggle row with optional description line below the label. */
function ToggleRow({ label, description, hint, checked, onChange, children }: {
  label:       string
  description?: string
  hint?:       string
  checked:     boolean
  onChange:    (v: boolean) => void
  children?:   React.ReactNode   // expanded content when toggled on
}) {
  const expanded = checked && !!children
  return (
    <Box sx={{ display: 'flex', alignItems: expanded ? 'flex-start' : 'center', gap: 6 }}>
      <Box sx={{ width: 480, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <FormLabel sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>{label}</FormLabel>
          <Switch size="small" checked={checked} onChange={e => onChange(e.target.checked)} />
        </Box>
        {description && (
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5, lineHeight: 1.5 }}>
            {description}
          </Typography>
        )}
        {checked && children && <Box sx={{ mt: 1.5 }}>{children}</Box>}
      </Box>
      {hint !== undefined && (
        <FormHelperText sx={{ flex: 1, mx: 0, lineHeight: 1.5, color: 'text.disabled', maxWidth: 380 }}>
          {hint}
        </FormHelperText>
      )}
    </Box>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL: CompetitionDefaults = {
  max_entries_per_member:   4,
  max_entries_per_category: 2,
  image_long_edge_preset:   '1920',
  image_long_edge_custom:   '',
  require_capture_date:     false,
  capture_date_amount:      2,
  capture_date_unit:        'years',
  image_reuse_rule:         'once_per_type',
  withdrawal_frees_slot:    true,

  judging_method:    'simple-scored',
  score_min:         1,
  score_max:         30,
  allow_decimals:    false,
  score_aggregation: 'sum',

  hide_member_names:        true,
  hide_exif_data:           false,
  require_judge_comments:   false,
  judge_comments_min_chars: 20,

  score_min_to_publish_enabled: false,
  score_min_to_publish:         10,
  results_visibility:             'members-only',
  results_visibility_delay_hours: 24,
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CompetitionDefaultsClient({
  initial = INITIAL,
  initialCategories = [],
}: {
  initial?:           CompetitionDefaults
  initialCategories?: Category[]
}) {
  const [s, setS]               = useState<CompetitionDefaults>(initial)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [savePending, startSave] = useTransition()
  const { isDirty, markDirty, markClean, registerSave } = useUnsavedChanges()
  const handleSaveRef = useRef<() => void>(() => {})

  function set<K extends keyof CompetitionDefaults>(key: K, value: CompetitionDefaults[K]) {
    setS(prev => ({ ...prev, [key]: value }))
    setSaveStatus('idle')
    markDirty()
  }

  function handleSave() {
    startSave(async () => {
      // wired up once competition_defaults table exists
      setSaveStatus('saved')
      markClean()
    })
  }

  handleSaveRef.current = handleSave
  useEffect(() => { registerSave(() => handleSaveRef.current()) }, [registerSave])

  // ── Categories state ─────────────────────────────────────────────────────
  const DEFAULT_CATEGORIES: Category[] = [{ id: 'default-open', name: 'Open' }]
  const [categories, setCategories] = useState<Category[]>(
    initialCategories.length ? initialCategories : DEFAULT_CATEGORIES
  )
  const [catAdding,  setCatAdding]  = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [catPending, startCat]      = useTransition()

  function handleAddCategory() {
    const name = newCatName.trim()
    if (!name) return
    startCat(async () => {
      const { id, error } = await addCompetitionDefaultCategory(name)
      if (!error && id) {
        setCategories(prev => [...prev, { id, name }])
        setNewCatName('')
        setCatAdding(false)
      }
    })
  }

  function handleRenameCategory(id: string, name: string) {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c))
    startCat(async () => { await renameCompetitionDefaultCategory(id, name) })
  }

  function handleDeleteCategory(id: string) {
    startCat(async () => {
      const { error } = await deleteCompetitionDefaultCategory(id)
      if (!error) setCategories(prev => prev.filter(c => c.id !== id))
    })
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const catLimitError =
    s.max_entries_per_category !== null &&
    s.max_entries_per_category > s.max_entries_per_member
      ? 'Per category limit cannot be higher than the total entries allowed per member.'
      : null

  const longEdgeHint =
    s.image_long_edge_preset === '1920' ? 'Matches standard HD projector resolution' :
    s.image_long_edge_preset === '1400' ? 'Matches legacy 4:3 projector resolution'  :
    s.image_long_edge_preset === '3840' ? 'Matches 4K display resolution'            : ''

  const reuseHint =
    s.image_reuse_rule === 'unrestricted'    ? 'The same image can be entered into any competition multiple times.' :
    s.image_reuse_rule === 'once_per_type'   ? 'An image can be re-entered in a different competition type, but not the same one.' :
    s.image_reuse_rule === 'once_per_season' ? 'An image can only be entered once across all competitions this season.' :
                                               'An image can only be entered into a competition once, ever.'

  const catLimitHint = s.max_entries_per_category === null
    ? 'No per-category limit — members can place all their entries in one category.'
    : `Limits members to ${s.max_entries_per_category} ${s.max_entries_per_category === 1 ? 'entry' : 'entries'} per category.`

  const withdrawalsHint = s.withdrawal_frees_slot
    ? undefined
    : 'Entries are locked once submitted — members cannot withdraw after the deadline.'

  const hideNamesHint = s.hide_member_names
    ? 'Member names are hidden from judges. Images are identified by number only.'
    : 'Member names are visible to judges during scoring.'

  const hideExifHint = s.hide_exif_data
    ? 'Camera make, lens, and shooting data are hidden from judges during scoring.'
    : 'Judges can see camera, lens, and shooting data when scoring.'

  const scoreRangeHint = `Judges score each entry from ${s.score_min} to ${s.score_max}.`

  const feedbackHint = s.require_judge_comments
    ? 'Judges must enter a comment before their score can be submitted.'
    : 'Comments are optional — judges can score without typing feedback.'

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Box sx={{ pb: '80px' }}>

      {/* ── Section 1: Competition categories ────────────────────────────── */}
      <SectionTitle>Competition categories</SectionTitle>
      <Typography sx={{ fontSize: 13, color: 'text.disabled', lineHeight: 1.6, mb: 1.5, maxWidth: 700 }}>
        Define all the categories your club uses across competitions. When creating a competition
        you&rsquo;ll select which of these apply.
      </Typography>
      <Paper variant="outlined" sx={{ mb: 6, px: 3, py: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <Box sx={{ width: 480, flexShrink: 0 }}>
            {categories.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {categories.map((cat, i) => (
                  <Box key={cat.id}>
                    {i > 0 && <Divider sx={{ my: '20px' }} />}
                    <CategoryRow
                      cat={cat}
                      onRename={handleRenameCategory}
                      onDelete={handleDeleteCategory}
                      disabled={catPending || categories.length <= 1}
                    />
                  </Box>
                ))}
                <Divider sx={{ my: '20px' }} />
              </Box>
            )}

            {catAdding ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  size="small" fullWidth placeholder="Category name" autoFocus
                  value={newCatName} onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                  disabled={catPending}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" size="small"
                    disabled={!newCatName.trim() || catPending} onClick={handleAddCategory}>
                    Save
                  </Button>
                  <Button variant="outlined" color="secondary" size="small"
                    disabled={catPending} onClick={() => { setNewCatName(''); setCatAdding(false) }}>
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <Button variant="outlined" color="secondary" size="small" onClick={() => setCatAdding(true)}>
                + Add category
              </Button>
            )}
          </Box>

          <FormHelperText sx={{ flex: 1, mx: 0, mt: 0.5, lineHeight: 1.5, color: 'text.disabled', maxWidth: 380 }}>
            Categories can be renamed at any time — changes apply everywhere including past competition
            records. At least one category is always required.
          </FormHelperText>
        </Box>
      </Paper>

      {/* ── Section 2: Entries & submissions ─────────────────────────────── */}
      <SectionTitle>Entries &amp; submissions</SectionTitle>
      <Typography sx={{ fontSize: 13, color: 'text.disabled', lineHeight: 1.6, mb: 1.5, maxWidth: 700 }}>
        Sets the default rules for what members can submit and how. All values here are inherited by
        every new competition and can be overridden per competition in step 2 of the creation wizard.
      </Typography>
      <Paper variant="outlined" sx={{ mb: 6, px: 3, py: '20px' }}>

        {/* Entry limits */}
        <Row label="Max entries per member">
          <TextField
            size="small" type="number" slotProps={{ htmlInput: { min: 1 } }}
            value={s.max_entries_per_member}
            onChange={e => set('max_entries_per_member', Math.max(1, Number(e.target.value) || 1))}
            sx={{ width: 90 }}
          />
        </Row>
        <Divider sx={{ my: '20px' }} />

        <Box sx={{ display: 'flex', alignItems: catLimitError ? 'flex-start' : 'center', gap: 6 }}>
          <Box sx={{ width: 480, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FormLabel sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
                Max entries per category
              </FormLabel>
              <TextField
                size="small" type="number" slotProps={{ htmlInput: { min: 1 } }}
                placeholder="No limit"
                value={s.max_entries_per_category ?? ''}
                onChange={e => set('max_entries_per_category', e.target.value === '' ? null : Math.max(1, Number(e.target.value) || 1))}
                sx={{ width: 90 }}
                error={!!catLimitError}
              />
            </Box>
            {catLimitError && (
              <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.5, lineHeight: 1.5 }}>
                {catLimitError}
              </Typography>
            )}
          </Box>
          <FormHelperText sx={{ flex: 1, mx: 0, lineHeight: 1.5, color: 'text.disabled', maxWidth: 380 }}>
            {catLimitHint}
          </FormHelperText>
        </Box>
        <Divider sx={{ my: '20px' }} />

        {/* Long edge */}
        <Box sx={{ display: 'flex', alignItems: s.image_long_edge_preset === 'custom' ? 'flex-start' : 'center', gap: 6 }}>
          <Box sx={{ width: 480, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FormLabel sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
                Long edge maximum
              </FormLabel>
              <Select
                size="small"
                value={s.image_long_edge_preset}
                onChange={e => set('image_long_edge_preset', e.target.value as CompetitionDefaults['image_long_edge_preset'])}
                sx={{ fontSize: 14, minWidth: 180 }}
              >
                <MenuItem value="1920" sx={{ fontSize: 14 }}>1920 px</MenuItem>
                <MenuItem value="1400" sx={{ fontSize: 14 }}>1400 px</MenuItem>
                <MenuItem value="3840" sx={{ fontSize: 14 }}>3840 px</MenuItem>
                <MenuItem value="custom" sx={{ fontSize: 14 }}>Custom…</MenuItem>
              </Select>
            </Box>
            {s.image_long_edge_preset === 'custom' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                <TextField
                  size="small" type="number" slotProps={{ htmlInput: { min: 1 } }}
                  placeholder="e.g. 2400"
                  value={s.image_long_edge_custom}
                  onChange={e => set('image_long_edge_custom', e.target.value === '' ? '' : Number(e.target.value))}
                  sx={{ width: 140 }}
                />
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>px</Typography>
              </Box>
            )}
          </Box>
          <FormHelperText sx={{ flex: 1, mx: 0, lineHeight: 1.5, color: 'text.disabled', maxWidth: 380 }}>
            {longEdgeHint}
          </FormHelperText>
        </Box>
        <Divider sx={{ my: '20px' }} />

        {/* Capture date */}
        <ToggleRow
          label="Restrict by when image was taken"
          hint={s.require_capture_date
            ? 'Capture date is read from image EXIF data. Images without EXIF data will be flagged for manual review.'
            : 'Images of any age accepted'}
          checked={s.require_capture_date}
          onChange={v => set('require_capture_date', v)}
        >
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1 }}>
            Images must have been captured within the last
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              size="small" type="number" slotProps={{ htmlInput: { min: 1 } }}
              value={s.capture_date_amount ?? 2}
              onChange={e => set('capture_date_amount', Math.max(1, Number(e.target.value) || 2))}
              sx={{ width: 90 }}
            />
            <Select
              size="small"
              value={s.capture_date_unit}
              onChange={e => set('capture_date_unit', e.target.value as 'years' | 'months')}
              sx={{ fontSize: 14, minWidth: 120 }}
            >
              <MenuItem value="years"  sx={{ fontSize: 14 }}>Years</MenuItem>
              <MenuItem value="months" sx={{ fontSize: 14 }}>Months</MenuItem>
            </Select>
          </Box>
        </ToggleRow>
        <Divider sx={{ my: '20px' }} />

        {/* Image reuse */}
        <Row label="Image reuse policy" hint={reuseHint}>
          <Select
            size="small"
            value={s.image_reuse_rule}
            onChange={e => set('image_reuse_rule', e.target.value as CompetitionDefaults['image_reuse_rule'])}
            sx={{ fontSize: 14, minWidth: 200 }}
          >
            <MenuItem value="unrestricted"    sx={{ fontSize: 14 }}>No restrictions</MenuItem>
            <MenuItem value="once_per_type"   sx={{ fontSize: 14 }}>Once per competition type</MenuItem>
            <MenuItem value="once_per_season" sx={{ fontSize: 14 }}>Once per season</MenuItem>
            <MenuItem value="once_ever"       sx={{ fontSize: 14 }}>Once ever</MenuItem>
          </Select>
        </Row>
        <Divider sx={{ my: '20px' }} />

        {/* Withdrawals */}
        <ToggleRow
          label="Allow entry withdrawals"
          hint={withdrawalsHint}
          checked={s.withdrawal_frees_slot}
          onChange={v => set('withdrawal_frees_slot', v)}
          description={s.withdrawal_frees_slot ? 'Members can withdraw an entry after submissions have closed. The slot is not returned and cannot be reused.' : undefined}
        />

      </Paper>

      {/* ── Section 3: Scoring defaults ───────────────────────────────────── */}
      <SectionTitle>Scoring defaults</SectionTitle>
      <Typography sx={{ fontSize: 13, color: 'text.disabled', lineHeight: 1.6, mb: 1.5, maxWidth: 700 }}>
        Sets the default judging configuration inherited by every new competition. All values can be
        overridden per competition in step 3 of the creation wizard.
      </Typography>
      <Paper variant="outlined" sx={{ mb: 6, px: 3, py: '20px' }}>

        {/* Judging method */}
        <Row label="Judging method">
          <Select
            size="small"
            value={s.judging_method}
            onChange={e => set('judging_method', e.target.value as CompetitionDefaults['judging_method'])}
            sx={{ fontSize: 14, minWidth: 200 }}
          >
            <MenuItem value="simple-scored" sx={{ fontSize: 14 }}>Simple scored</MenuItem>
            <MenuItem value="salon"         sx={{ fontSize: 14 }}>Salon style</MenuItem>
            <MenuItem value="awards-only"   sx={{ fontSize: 14 }}>Awards only</MenuItem>
            <MenuItem value="member-vote"   sx={{ fontSize: 14 }}>Member vote</MenuItem>
            <MenuItem value="end-of-year"   sx={{ fontSize: 14 }}>End-of-year</MenuItem>
          </Select>
        </Row>

        {/* Score range — only for simple-scored and salon */}
        {(s.judging_method === 'simple-scored' || s.judging_method === 'salon') && (
          <>
            <Divider sx={{ my: '20px' }} />
            <Row label="Score range" hint={scoreRangeHint}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  size="small" type="number" slotProps={{ htmlInput: { min: 0 } }}
                  value={s.score_min}
                  onChange={e => set('score_min', Number(e.target.value))}
                  sx={{ width: 70 }}
                />
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>to</Typography>
                <TextField
                  size="small" type="number" slotProps={{ htmlInput: { min: 1 } }}
                  value={s.score_max}
                  onChange={e => set('score_max', Number(e.target.value))}
                  sx={{ width: 70 }}
                />
              </Box>
            </Row>
            <Divider sx={{ my: '20px' }} />
            <Row label="Allow half points">
              <Switch
                size="small"
                checked={s.allow_decimals}
                onChange={e => set('allow_decimals', e.target.checked)}
              />
            </Row>
          </>
        )}

        {/* Judge experience sub-section */}
        <Divider sx={{ my: '20px' }} />
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: '14px' }}>
          Judge experience
        </Typography>

        <ToggleRow
          label="Anonymise member names during judging"
          hint={hideNamesHint}
          checked={s.hide_member_names}
          onChange={v => set('hide_member_names', v)}
        />
        <Divider sx={{ my: '20px' }} />

        <ToggleRow
          label="Anonymise EXIF data during judging"
          hint={hideExifHint}
          checked={s.hide_exif_data}
          onChange={v => set('hide_exif_data', v)}
        />
        <Divider sx={{ my: '20px' }} />

        <ToggleRow
          label="Require written feedback from judges"
          hint={feedbackHint}
          checked={s.require_judge_comments}
          onChange={v => set('require_judge_comments', v)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              size="small" type="number" slotProps={{ htmlInput: { min: 1 } }}
              value={s.judge_comments_min_chars}
              onChange={e => set('judge_comments_min_chars', Math.max(1, Number(e.target.value) || 1))}
              sx={{ width: 90 }}
            />
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>minimum characters</Typography>
          </Box>
        </ToggleRow>

      </Paper>

      {/* ── Save bar ─────────────────────────────────────────────────────── */}
      <Box sx={{
        position: 'fixed', bottom: 0, left: 224, right: 0,
        px: 8, py: 2,
        bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider',
        zIndex: 100, display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <Box sx={{ mx: 'auto', width: '100%', maxWidth: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Button variant="contained" size="small" disabled={savePending || !isDirty} onClick={handleSave} sx={{ fontSize: '18px' }}>
            {savePending ? 'Saving…' : 'Save changes'}
          </Button>
          {saveStatus === 'saved' && <Alert severity="success" sx={{ py: 0, px: 1.5 }}>Settings saved</Alert>}
          {saveStatus === 'error'  && <Alert severity="error"   sx={{ py: 0, px: 1.5 }}>Save failed — please try again</Alert>}
        </Box>
      </Box>

    </Box>
  )
}

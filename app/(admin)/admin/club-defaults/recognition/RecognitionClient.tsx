'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TrashBtn } from '@/components/ui/TrashBtn'
import { useUnsavedChanges } from '@/components/admin/UnsavedChangesProvider'

// ─── Types ────────────────────────────────────────────────────────────────────

type AwardTier          = { id: string; name: string; color: string }
type ClassificationBand = { id: string; name: string; color: string; minScore: number | '' }
type BenchmarkLevel     = { imagesRequired: number; cumulative: boolean }

type Settings = {
  poy_categories_factor:     boolean
  poy_separate_per_category: boolean
  poy_branch_a_counting:     'all' | 'top_n' | 'exclude_lowest'
  poy_branch_a_top_n:        number
  poy_branch_a_exclude_n:    number
  poy_b1_counting:           'all' | 'top_n' | 'exclude_lowest'
  poy_b1_top_n:              number
  poy_b1_exclude_n:          number
  poy_b2_counting:           'top_n' | 'exclude_lowest'
  poy_b2_top_n:              number
  poy_b2_exclude_n:          number
  poy_tiebreaker:            'next_highest' | 'most_images' | 'admin_decision'
  poy_eligibility:           'active_members' | 'all_members' | 'min_duration'
  poy_eligibility_min_dur:   '1_month' | '3_months' | '6_months' | '1_year'
  bench_levels:              Record<string, BenchmarkLevel>
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Typography sx={{ fontSize: 17, fontWeight: 600, color: 'text.primary', mb: 0.75, mt: '20px' }}>
      {title}
    </Typography>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Box sx={{ width: 480, flexShrink: 0 }}>
        <FormLabel sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', display: 'block', mb: 0.75 }}>
          {label}
        </FormLabel>
        {children}
      </Box>
      {hint && (
        <FormHelperText sx={{ flex: 1, mx: 0, lineHeight: 1.5, color: 'text.disabled', maxWidth: 380 }}>
          {hint}
        </FormHelperText>
      )}
    </Box>
  )
}

function RowField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 480, flexShrink: 0 }}>
        <FormLabel sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>{label}</FormLabel>
        {children}
      </Box>
      {hint && (
        <FormHelperText sx={{ flex: 1, mx: 0, lineHeight: 1.5, color: 'text.disabled', maxWidth: 380 }}>
          {hint}
        </FormHelperText>
      )}
    </Box>
  )
}

// ─── Sortable tier row ────────────────────────────────────────────────────────

function TierRow({ tier, onUpdate, onDelete, disabled }: {
  tier:     AwardTier
  onUpdate: (id: string, patch: Partial<AwardTier>) => void
  onDelete: (id: string) => void
  disabled: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tier.id })

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <Box ref={setNodeRef} style={style} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, maxWidth: 480, py: 0.5 }}>
      <Box {...attributes} {...listeners} sx={{ color: 'text.disabled', cursor: isDragging ? 'grabbing' : 'grab', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 2a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0zM7 18a2 2 0 11-4 0 2 2 0 014 0zM17 2a2 2 0 11-4 0 2 2 0 014 0zM17 10a2 2 0 11-4 0 2 2 0 014 0zM17 18a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
      </Box>

      {/* Color chip */}
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <Box
          component="input"
          type="color"
          value={tier.color}
          onChange={e => onUpdate(tier.id, { color: e.target.value })}
          disabled={disabled}
          sx={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', inset: 0 }}
        />
        <Box sx={{ width: 22, height: 22, borderRadius: '4px', bgcolor: tier.color, border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer' }} />
      </Box>

      <TextField
        size="small" fullWidth
        value={tier.name}
        onChange={e => onUpdate(tier.id, { name: e.target.value })}
        disabled={disabled}
        sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: 13 } }}
      />
      <TrashBtn onClick={() => onDelete(tier.id)} disabled={disabled} />
    </Box>
  )
}

// ─── Sortable band row ────────────────────────────────────────────────────────

function BandRow({ band, onUpdate, onDelete, disabled, scoreMaxError }: {
  band:          ClassificationBand
  onUpdate:      (id: string, patch: Partial<ClassificationBand>) => void
  onDelete:      (id: string) => void
  disabled:      boolean
  scoreMaxError: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: band.id })

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <Box ref={setNodeRef} style={style} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, maxWidth: 560, py: 0.5 }}>
      <Box {...attributes} {...listeners} sx={{ color: 'text.disabled', cursor: isDragging ? 'grabbing' : 'grab', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 2a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0zM7 18a2 2 0 11-4 0 2 2 0 014 0zM17 2a2 2 0 11-4 0 2 2 0 014 0zM17 10a2 2 0 11-4 0 2 2 0 014 0zM17 18a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
      </Box>

      {/* Color chip */}
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <Box
          component="input"
          type="color"
          value={band.color}
          onChange={e => onUpdate(band.id, { color: e.target.value })}
          disabled={disabled}
          sx={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', inset: 0 }}
        />
        <Box sx={{ width: 22, height: 22, borderRadius: '4px', bgcolor: band.color, border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer' }} />
      </Box>

      <TextField
        size="small"
        value={band.name}
        onChange={e => onUpdate(band.id, { name: e.target.value })}
        disabled={disabled}
        sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: 13 } }}
      />

      <TextField
        size="small" type="number" slotProps={{ input: { min: 0 } as any }}
        value={band.minScore}
        onChange={e => onUpdate(band.id, { minScore: e.target.value === '' ? '' : Number(e.target.value) })}
        disabled={disabled}
        placeholder="—"
        error={scoreMaxError}
        sx={{ width: 90, '& .MuiInputBase-input': { fontSize: 13 } }}
      />
      {scoreMaxError && (
        <Typography sx={{ fontSize: 11, color: 'error.main', mt: 0.25, lineHeight: 1.3, textAlign: 'right' }}>
          Exceeds max
        </Typography>
      )}

      <TrashBtn onClick={() => onDelete(band.id)} disabled={disabled} />
    </Box>
  )
}

function LockedBandRow() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, maxWidth: 560, py: 0.5 }}>
      <Box sx={{ color: 'text.disabled', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
        </svg>
      </Box>
      <Box sx={{ width: 22, height: 22, borderRadius: '4px', bgcolor: '#A0A0A0', border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
      <TextField size="small" defaultValue="Accepted" sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: 13 } }} />
      <Box sx={{ width: 90, height: 36, display: 'flex', alignItems: 'center', px: 0.5 }}>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>All other</Typography>
      </Box>
      <Box sx={{ width: 30, flexShrink: 0 }} />
    </Box>
  )
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_TIERS: AwardTier[] = [
  { id: 'default-gold',   name: 'Gold',              color: '#F5C518' },
  { id: 'default-silver', name: 'Silver',            color: '#94A3B8' },
  { id: 'default-bronze', name: 'Bronze',            color: '#D97706' },
  { id: 'default-hm',     name: 'Honorable Mention', color: '#0EA5E9' },
]

const DEFAULT_BANDS: ClassificationBand[] = [
  { id: 'default-band-l3', name: 'Excellence',       color: '#5B82A6', minScore: 9.5 },
  { id: 'default-band-l2', name: 'Highly Commended', color: '#3D8A9A', minScore: 8.5 },
  { id: 'default-band-l1', name: 'Commended',        color: '#4A7A52', minScore: 7.0 },
]

const INITIAL: Settings = {
  poy_categories_factor:     false,
  poy_separate_per_category: false,
  poy_branch_a_counting:     'all',
  poy_branch_a_top_n:        5,
  poy_branch_a_exclude_n:    1,
  poy_b1_counting:           'top_n',
  poy_b1_top_n:              3,
  poy_b1_exclude_n:          1,
  poy_b2_counting:           'top_n',
  poy_b2_top_n:              4,
  poy_b2_exclude_n:          1,
  poy_tiebreaker:            'next_highest',
  poy_eligibility:           'active_members',
  poy_eligibility_min_dur:   '6_months',
  bench_levels: {
    'default-band-l3': { imagesRequired: 3, cumulative: true },
    'default-band-l2': { imagesRequired: 5, cumulative: true },
    'default-band-l1': { imagesRequired: 3, cumulative: true },
  },
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RecognitionClient({
  initial = INITIAL,
  initialTiers = [],
  initialBands = [],
  scoreMax,
}: {
  initial?:      Settings
  initialTiers?: AwardTier[]
  initialBands?: ClassificationBand[]
  scoreMax?:     number
}) {
  const [s, setS]                   = useState<Settings>(initial)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [savePending, startSave]    = useTransition()
  const { isDirty, markDirty, markClean, registerSave } = useUnsavedChanges()
  const handleSaveRef = useRef<() => void>(() => {})

  // ── High-risk confirmation modal ─────────────────────────────────────────
  const [confirmModal, setConfirmModal] = useState<'benchmark' | 'poy' | null>(null)

  // Track initial values to detect high-risk changes
  const initialBandsRef    = useRef(initialBands.length ? initialBands : DEFAULT_BANDS)
  const initialSettingsRef = useRef(initial)

  function benchmarkChanged() {
    return (
      JSON.stringify(bands)         !== JSON.stringify(initialBandsRef.current) ||
      JSON.stringify(s.bench_levels) !== JSON.stringify(initialSettingsRef.current.bench_levels)
    )
  }

  const POY_KEYS = [
    'poy_categories_factor', 'poy_separate_per_category',
    'poy_branch_a_counting', 'poy_branch_a_top_n', 'poy_branch_a_exclude_n',
    'poy_b1_counting', 'poy_b1_top_n', 'poy_b1_exclude_n',
    'poy_b2_counting', 'poy_b2_top_n', 'poy_b2_exclude_n',
    'poy_tiebreaker', 'poy_eligibility', 'poy_eligibility_min_dur',
  ] as const

  function poyChanged() {
    return POY_KEYS.some(k => JSON.stringify(s[k]) !== JSON.stringify(initialSettingsRef.current[k]))
  }

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS(prev => ({ ...prev, [key]: value }))
    setSaveStatus('idle')
    markDirty()
  }

  function setLevel(bandId: string, patch: Partial<BenchmarkLevel>) {
    setS(prev => ({
      ...prev,
      bench_levels: { ...prev.bench_levels, [bandId]: { ...prev.bench_levels[bandId], ...patch } },
    }))
    setSaveStatus('idle')
    markDirty()
  }

  function executeSave() {
    startSave(async () => {
      // TODO: persist s, tiers, bands to DB
      setSaveStatus('saved')
      markClean()
      // Update initial refs so re-saves don't re-trigger modals
      initialBandsRef.current    = bands
      initialSettingsRef.current = s
    })
  }

  function handleSave() {
    if (benchmarkChanged()) { setConfirmModal('benchmark'); return }
    if (poyChanged())       { setConfirmModal('poy');       return }
    executeSave()
  }

  function handleConfirmedSave() {
    setConfirmModal(null)
    executeSave()
  }

  // ── Award tiers ──────────────────────────────────────────────────────────
  const [tiers,       setTiers]      = useState<AwardTier[]>(initialTiers.length ? initialTiers : DEFAULT_TIERS)
  const [tierAdding,  setTierAdding] = useState(false)
  const [newTierName, setNewTierName] = useState('')
  const [tierPending, startTier]     = useTransition()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setTiers(prev => {
        const oldIndex = prev.findIndex(t => t.id === active.id)
        const newIndex = prev.findIndex(t => t.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
      markDirty()
    }
  }

  function handleUpdateTier(id: string, patch: Partial<AwardTier>) {
    setTiers(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
    markDirty()
  }

  function handleAddTier() {
    const name = newTierName.trim()
    if (!name) return
    startTier(async () => {
      setTiers(prev => [...prev, { id: crypto.randomUUID(), name, color: '#A0A0A0' }])
      setNewTierName('')
      setTierAdding(false)
      markDirty()
    })
  }

  function handleDeleteTier(id: string) {
    startTier(async () => { setTiers(prev => prev.filter(t => t.id !== id)); markDirty() })
  }

  // ── Classification bands ─────────────────────────────────────────────────
  const [bands,        setBands]        = useState<ClassificationBand[]>(initialBands.length ? initialBands : DEFAULT_BANDS)
  const [bandAdding,   setBandAdding]   = useState(false)
  const [newBandName,  setNewBandName]  = useState('')
  const [newBandScore, setNewBandScore] = useState<number | ''>('')
  const [bandPending,  startBand]       = useTransition()

  const hasBandScoreError = scoreMax !== undefined && bands.some(
    b => b.minScore !== '' && Number(b.minScore) > scoreMax
  )

  handleSaveRef.current = handleSave
  useEffect(() => { registerSave(() => { if (!hasBandScoreError) handleSaveRef.current() }) }, [registerSave, hasBandScoreError])

  function handleBandDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setBands(prev => {
        const oldIndex = prev.findIndex(b => b.id === active.id)
        const newIndex = prev.findIndex(b => b.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
      markDirty()
    }
  }

  function handleUpdateBand(id: string, patch: Partial<ClassificationBand>) {
    setBands(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
    markDirty()
  }

  function handleAddBand() {
    const name = newBandName.trim()
    if (!name) return
    startBand(async () => {
      const id = crypto.randomUUID()
      setBands(prev => [...prev, { id, name, color: '#A0A0A0', minScore: newBandScore }])
      setS(prev => ({
        ...prev,
        bench_levels: { ...prev.bench_levels, [id]: { imagesRequired: 10, cumulative: true } },
      }))
      setNewBandName('')
      setNewBandScore('')
      setBandAdding(false)
      markDirty()
    })
  }

  function handleDeleteBand(id: string) {
    startBand(async () => {
      setBands(prev => prev.filter(b => b.id !== id))
      setS(prev => {
        const levels = { ...prev.bench_levels }
        delete levels[id]
        return { ...prev, bench_levels: levels }
      })
      markDirty()
    })
  }

  // ── Derived hints ────────────────────────────────────────────────────────
  const q1Hint = s.poy_categories_factor
    ? '· Categories factor into how scores are counted or which members compete for the season title.'
    : '· All competition scores combine into a single standing.\n  One overall POY winner per season.'

  const q2Hint = s.poy_separate_per_category
    ? '· Each category produces its own standings and POY winner.'
    : '· A combined standing totals scores across all categories.\n  One overall POY winner per season.'

  function buildExplanation(): string {
    if (!s.poy_categories_factor) {
      if (s.poy_branch_a_counting === 'all')
        return "Each member's total is the sum of every score they earn across all competitions and categories in the season."
      if (s.poy_branch_a_counting === 'top_n')
        return `Each member's total is their ${s.poy_branch_a_top_n} highest score${s.poy_branch_a_top_n === 1 ? '' : 's'} from across the entire season, regardless of category.`
      return `Each member's total is the sum of all their scores for the season, with their ${s.poy_branch_a_exclude_n === 1 ? 'single lowest score' : `${s.poy_branch_a_exclude_n} lowest scores`} removed.`
    }
    if (s.poy_separate_per_category) {
      if (s.poy_b1_counting === 'all')
        return "Each category produces its own standings. Every score a member earns in a category counts toward that category's ranking."
      if (s.poy_b1_counting === 'top_n')
        return `Each category produces its own standings, calculated from each member's top ${s.poy_b1_top_n} score${s.poy_b1_top_n === 1 ? '' : 's'} in that category.`
      return `Each category produces its own standings, calculated from each member's scores in that category with their ${s.poy_b1_exclude_n === 1 ? 'single lowest score' : `${s.poy_b1_exclude_n} lowest scores`} removed.`
    }
    if (s.poy_b2_counting === 'top_n')
      return `Each member's total is built from their top ${s.poy_b2_top_n} score${s.poy_b2_top_n === 1 ? '' : 's'} in each category, added together across the season.`
    return `Each member's total is built from all their scores in each category except their ${s.poy_b2_exclude_n === 1 ? 'single lowest' : `${s.poy_b2_exclude_n} lowest`}, added together across the season.`
  }

  const tiebreakerHint =
    s.poy_tiebreaker === 'next_highest' ? 'The member with the next higher individual score in any competition wins the tie.' :
    s.poy_tiebreaker === 'most_images'  ? 'The member who entered more competitions during the season wins the tie.' :
                                          'Tied members are ranked manually by a club administrator.'

  const durLabel: Record<string, string> = {
    '1_month': '1 month', '3_months': '3 months', '6_months': '6 months', '1_year': '1 year',
  }
  const eligibilityHint =
    s.poy_eligibility === 'active_members' ? 'Only members with an active membership status at season end are eligible.' :
    s.poy_eligibility === 'all_members'    ? 'All members who entered at least one competition during the season are eligible.' :
    `Members must have been registered for at least ${durLabel[s.poy_eligibility_min_dur]} to be eligible.`

  return (
    <Box sx={{ pb: '80px' }}>

      {/* ── 1. Awards ─────────────────────────────────────────────────────── */}
      <SectionHeader title="Awards" />
      <Typography sx={{ fontSize: 13, color: 'text.disabled', lineHeight: 1.6, mb: 1.5, maxWidth: 700 }}>
        <strong>Manually assigned</strong> by judges during or after a competition. Define the award types available.
      </Typography>
      <Paper variant="outlined" sx={{ mb: 6, px: 3, py: '20px' }}>

          {tiers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={tiers.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <Stack spacing={0.5}>
                    {tiers.map(tier => (
                      <TierRow key={tier.id} tier={tier} onUpdate={handleUpdateTier} onDelete={handleDeleteTier} disabled={tierPending} />
                    ))}
                  </Stack>
                </SortableContext>
              </DndContext>
              <Divider sx={{ my: '20px' }} />
            </Box>
          )}

          {tierAdding ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 480 }}>
              <TextField
                size="small" fullWidth placeholder="Award name e.g. Gold" autoFocus
                value={newTierName} onChange={e => setNewTierName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTier())}
                disabled={tierPending}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" size="small" disabled={!newTierName.trim() || tierPending} onClick={handleAddTier}>
                  Save
                </Button>
                <Button variant="outlined" color="secondary" size="small" disabled={tierPending} onClick={() => { setNewTierName(''); setTierAdding(false) }}>
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Button variant="outlined" color="secondary" size="small" onClick={() => setTierAdding(true)}>
              Add award
            </Button>
          )}

        </Paper>

      {/* ── 2. Benchmark ──────────────────────────────────────────────────── */}

      <Box sx={{ mt: 6 }}>
        <SectionHeader title="Scoring bands" />
      </Box>
      <Box sx={{
        p: 2, mb: 1.5, borderRadius: 1.5,
        border: t => `1px solid ${t.palette.mode === 'dark' ? 'rgba(0,151,167,0.35)' : '#9DD9C5'}`,
        bgcolor: t => t.palette.mode === 'dark' ? 'rgba(0,151,167,0.10)' : '#F0FAF7',
      }}>
        <Typography sx={{ fontSize: 13, lineHeight: 1.6, color: t => t.palette.mode === 'dark' ? '#4ECDE6' : '#0A5742' }}>
          Automatically calculated — but only <strong>images from competitions with Scoring Bands enabled</strong> count toward a member&apos;s band achievement.
        </Typography>
      </Box>
        <Paper variant="outlined" sx={{ mb: 6, px: 3, py: '20px' }}>

          <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary', mb: 0.75 }}>
            Band definitions
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.disabled', lineHeight: 1.6, mb: 1.5, maxWidth: 560 }}>
            Define the score thresholds that determine how an image is classified. Any image that doesn&apos;t meet a higher band is automatically classified as Accepted.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, maxWidth: 560, mb: 0.5, pl: '22px' }}>
            <Box sx={{ width: 22 }} />
            <Typography sx={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', ml: 0.5 }}>
              Band name
            </Typography>
            <Typography sx={{ width: 90, fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Min score
            </Typography>
            <Box sx={{ width: 30 }} />
          </Box>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBandDragEnd}>
            <SortableContext items={bands.map(b => b.id)} strategy={verticalListSortingStrategy}>
              <Stack spacing={0.5}>
                {bands.map(band => (
                  <BandRow
                    key={band.id} band={band}
                    onUpdate={handleUpdateBand} onDelete={handleDeleteBand}
                    disabled={bandPending}
                    scoreMaxError={scoreMax !== undefined && band.minScore !== '' && Number(band.minScore) > scoreMax}
                  />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>

          <LockedBandRow />
          <Divider sx={{ my: '16px', maxWidth: 560 }} />

          {bandAdding ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 560 }}>
              <Stack direction="row" spacing={1.5}>
                <TextField
                  size="small" fullWidth placeholder="Band name e.g. Merit" autoFocus
                  value={newBandName} onChange={e => setNewBandName(e.target.value)}
                  disabled={bandPending}
                />
                <TextField
                  size="small" type="number" slotProps={{ input: { min: 0 } as any }} placeholder="Min score"
                  value={newBandScore}
                  onChange={e => setNewBandScore(e.target.value === '' ? '' : Number(e.target.value))}
                  sx={{ width: 120 }}
                  disabled={bandPending}
                />
              </Stack>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" size="small" disabled={!newBandName.trim() || bandPending} onClick={handleAddBand}>
                  Save
                </Button>
                <Button variant="outlined" color="secondary" size="small" disabled={bandPending} onClick={() => { setNewBandName(''); setNewBandScore(''); setBandAdding(false) }}>
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Button variant="outlined" color="secondary" size="small" onClick={() => setBandAdding(true)}>
              Add band
            </Button>
          )}

          {/* Rank qualification */}
          <Divider sx={{ my: '20px' }} />
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary', mb: 0.75 }}>
            Advancement criteria
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.disabled', lineHeight: 1.6, mb: 2, maxWidth: 560 }}>
            Set the number of qualifying results a member needs to move up to the next skill level. For example, achieving Highly Commended three times moves a member from Intermediate to Advanced. Progress is tracked automatically across all competitions in the season.
          </Typography>

          {bands.map((band, i) => {
            const level = s.bench_levels[band.id] ?? { imagesRequired: 10, cumulative: true }
            const showCumulative = i > 0
            return (
              <Box key={band.id}>
                {i > 0 && <Divider sx={{ my: '20px' }} />}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', maxWidth: 480 }}>
                  <Box>
                    <FormLabel sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', display: 'block', mb: 0.75 }}>
                      {band.name}
                    </FormLabel>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <TextField
                        size="small" type="number" slotProps={{ input: { min: 1 } as any }}
                        value={level.imagesRequired}
                        onChange={e => setLevel(band.id, { imagesRequired: Number(e.target.value) || 1 })}
                        sx={{ width: 90 }}
                      />
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>images required</Typography>
                    </Stack>
                  </Box>
                  {showCumulative && (
                    <Box sx={{ textAlign: 'right' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={level.cumulative}
                            onChange={e => setLevel(band.id, { cumulative: e.target.checked })}
                          />
                        }
                        label={<Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Cumulative</Typography>}
                        labelPlacement="start"
                        sx={{ m: 0, gap: 1 }}
                      />
                      <FormHelperText sx={{ mx: 0, mt: 0.5, fontSize: 11, lineHeight: 1.5, color: 'text.disabled', maxWidth: 220, textAlign: 'right' }}>
                        When on, images from higher bands count toward this rank.
                      </FormHelperText>
                    </Box>
                  )}
                </Box>
              </Box>
            )
          })}

        </Paper>

      {/* ── 3. Photographer of the Year ───────────────────────────────────── */}
      <Box sx={{ mt: 6 }}>
        <SectionHeader title="Photographer of the Year" />
      </Box>
      <Box sx={{
        p: 2, mb: 1.5, borderRadius: 1.5,
        border: t => `1px solid ${t.palette.mode === 'dark' ? 'rgba(0,151,167,0.35)' : '#9DD9C5'}`,
        bgcolor: t => t.palette.mode === 'dark' ? 'rgba(0,151,167,0.10)' : '#F0FAF7',
      }}>
        <Typography sx={{ fontSize: 13, lineHeight: 1.6, color: t => t.palette.mode === 'dark' ? '#4ECDE6' : '#0A5742' }}>
          Automatically calculated across the season — but only <strong>images from competitions with POY enabled</strong> count toward year-end standings.
        </Typography>
      </Box>
        <Paper variant="outlined" sx={{ mb: 6, px: 3, py: '20px' }}>

          {/* Q1 */}
          <RowField label="Factor categories into POY calculation" hint={q1Hint}>
            <Switch size="small" checked={s.poy_categories_factor} onChange={e => set('poy_categories_factor', e.target.checked)} />
          </RowField>
          <Divider sx={{ my: '20px' }} />

          {/* Branch A — Q1 = No */}
          {!s.poy_categories_factor && (
            <>
              <Box sx={{ width: 480 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <FormLabel sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
                    Scores counted from each category
                  </FormLabel>
                  <Select size="small" value={s.poy_branch_a_counting}
                    onChange={e => set('poy_branch_a_counting', e.target.value as Settings['poy_branch_a_counting'])}
                    sx={{ fontSize: 14, minWidth: 220 }}
                  >
                    <MenuItem value="all"            sx={{ fontSize: 14 }}>Sum of all scores</MenuItem>
                    <MenuItem value="top_n"          sx={{ fontSize: 14 }}>Top scores only</MenuItem>
                    <MenuItem value="exclude_lowest" sx={{ fontSize: 14 }}>Exclude lowest</MenuItem>
                  </Select>
                </Box>
                {s.poy_branch_a_counting === 'top_n' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5, justifyContent: 'flex-end' }}>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Best</Typography>
                    <TextField size="small" type="number"
                      slotProps={{ input: { min: 1, step: 1 } as any }}
                      value={s.poy_branch_a_top_n}
                      onChange={e => set('poy_branch_a_top_n', Math.max(1, Math.floor(parseInt(e.target.value, 10) || 1)))}
                      sx={{ width: 60 }}
                    />
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>scores from the season</Typography>
                  </Box>
                )}
                {s.poy_branch_a_counting === 'exclude_lowest' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5, justifyContent: 'flex-end' }}>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Exclude</Typography>
                    <TextField size="small" type="number"
                      slotProps={{ input: { min: 1, step: 1 } as any }}
                      value={s.poy_branch_a_exclude_n}
                      onChange={e => set('poy_branch_a_exclude_n', Math.max(1, Math.floor(parseInt(e.target.value, 10) || 1)))}
                      sx={{ width: 60 }}
                    />
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>lowest scores from the season</Typography>
                  </Box>
                )}
              </Box>
              <Divider sx={{ my: '20px' }} />
            </>
          )}

          {/* Q2 + Branch B1/B2 — Q1 = Yes */}
          {s.poy_categories_factor && (
            <>
              <RowField label="Separate POY winner per category" hint={q2Hint}>
                <Switch size="small" checked={s.poy_separate_per_category} onChange={e => set('poy_separate_per_category', e.target.checked)} />
              </RowField>
              <Divider sx={{ my: '20px' }} />

              {/* Branch B1 — Q2 = Yes */}
              {s.poy_separate_per_category && (
                <Box sx={{ width: 480 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <FormLabel sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
                      Scores counted from each category
                    </FormLabel>
                    <Select size="small" value={s.poy_b1_counting}
                      onChange={e => set('poy_b1_counting', e.target.value as Settings['poy_b1_counting'])}
                      sx={{ fontSize: 14, minWidth: 220 }}
                    >
                      <MenuItem value="all"            sx={{ fontSize: 14 }}>All scores in the category</MenuItem>
                      <MenuItem value="top_n"          sx={{ fontSize: 14 }}>Top scores only</MenuItem>
                      <MenuItem value="exclude_lowest" sx={{ fontSize: 14 }}>Exclude lowest</MenuItem>
                    </Select>
                  </Box>
                  {s.poy_b1_counting === 'top_n' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5, justifyContent: 'flex-end' }}>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Best</Typography>
                      <TextField size="small" type="number"
                        slotProps={{ input: { min: 1, step: 1 } as any }}
                        value={s.poy_b1_top_n}
                        onChange={e => set('poy_b1_top_n', Math.max(1, Math.floor(parseInt(e.target.value, 10) || 1)))}
                        sx={{ width: 60 }}
                      />
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>scores in each category</Typography>
                    </Box>
                  )}
                  {s.poy_b1_counting === 'exclude_lowest' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5, justifyContent: 'flex-end' }}>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Exclude</Typography>
                      <TextField size="small" type="number"
                        slotProps={{ input: { min: 1, step: 1 } as any }}
                        value={s.poy_b1_exclude_n}
                        onChange={e => set('poy_b1_exclude_n', Math.max(1, Math.floor(parseInt(e.target.value, 10) || 1)))}
                        sx={{ width: 60 }}
                      />
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>lowest scores in each category</Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Branch B2 — Q2 = No */}
              {!s.poy_separate_per_category && (
                <Box sx={{ width: 480 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <FormLabel sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
                      Scores counted from each category
                    </FormLabel>
                    <Select size="small" value={s.poy_b2_counting}
                      onChange={e => set('poy_b2_counting', e.target.value as Settings['poy_b2_counting'])}
                      sx={{ fontSize: 14, minWidth: 220 }}
                    >
                      <MenuItem value="top_n"          sx={{ fontSize: 14 }}>Top scores only</MenuItem>
                      <MenuItem value="exclude_lowest" sx={{ fontSize: 14 }}>Exclude lowest</MenuItem>
                    </Select>
                  </Box>
                  {s.poy_b2_counting === 'top_n' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5, justifyContent: 'flex-end' }}>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Best</Typography>
                      <TextField size="small" type="number"
                        slotProps={{ input: { min: 1, step: 1 } as any }}
                        value={s.poy_b2_top_n}
                        onChange={e => set('poy_b2_top_n', Math.max(1, Math.floor(parseInt(e.target.value, 10) || 1)))}
                        sx={{ width: 60 }}
                      />
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>scores from each category</Typography>
                    </Box>
                  )}
                  {s.poy_b2_counting === 'exclude_lowest' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5, justifyContent: 'flex-end' }}>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Exclude</Typography>
                      <TextField size="small" type="number"
                        slotProps={{ input: { min: 1, step: 1 } as any }}
                        value={s.poy_b2_exclude_n}
                        onChange={e => set('poy_b2_exclude_n', Math.max(1, Math.floor(parseInt(e.target.value, 10) || 1)))}
                        sx={{ width: 60 }}
                      />
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>lowest scores from each category</Typography>
                    </Box>
                  )}
                </Box>
              )}
              <Divider sx={{ my: '20px' }} />
            </>
          )}

          {/* Config explanation */}
          <Box sx={{ textAlign: 'center', pt: '30px', pb: '30px' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 0.75 }}>
              Summary of POY calculation
            </Typography>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.7 }}>
              {buildExplanation()}
            </Typography>
          </Box>
          <Divider sx={{ my: '20px' }} />

          <RowField label="Tiebreaker rule" hint={tiebreakerHint}>
            <Select size="small" value={s.poy_tiebreaker} onChange={e => set('poy_tiebreaker', e.target.value as Settings['poy_tiebreaker'])} sx={{ fontSize: 14, minWidth: 180 }}>
              <MenuItem value="next_highest"   sx={{ fontSize: 14 }}>Next highest score</MenuItem>
              <MenuItem value="most_images"    sx={{ fontSize: 14 }}>Most images entered</MenuItem>
              <MenuItem value="admin_decision" sx={{ fontSize: 14 }}>Admin decision</MenuItem>
            </Select>
          </RowField>
          <Divider sx={{ my: '20px' }} />

          <RowField label="POY eligibility" hint={eligibilityHint}>
            <Select size="small" value={s.poy_eligibility} onChange={e => set('poy_eligibility', e.target.value as Settings['poy_eligibility'])} sx={{ fontSize: 14, minWidth: 220 }}>
              <MenuItem value="active_members" sx={{ fontSize: 14 }}>Active members only</MenuItem>
              <MenuItem value="all_members"    sx={{ fontSize: 14 }}>All members</MenuItem>
              <MenuItem value="min_duration"   sx={{ fontSize: 14 }}>Minimum membership duration</MenuItem>
            </Select>
          </RowField>
          {s.poy_eligibility === 'min_duration' && (
            <Box sx={{ mt: 1.5, maxWidth: 480 }}>
              <Select size="small" fullWidth value={s.poy_eligibility_min_dur} onChange={e => set('poy_eligibility_min_dur', e.target.value as Settings['poy_eligibility_min_dur'])} sx={{ fontSize: 14 }}>
                <MenuItem value="1_month"  sx={{ fontSize: 14 }}>1 month</MenuItem>
                <MenuItem value="3_months" sx={{ fontSize: 14 }}>3 months</MenuItem>
                <MenuItem value="6_months" sx={{ fontSize: 14 }}>6 months</MenuItem>
                <MenuItem value="1_year"   sx={{ fontSize: 14 }}>1 year</MenuItem>
              </Select>
            </Box>
          )}

        </Paper>

      {/* ── Save bar ──────────────────────────────────────────────────────── */}
      <Box sx={{
        position: 'fixed', bottom: 0, left: 224, right: 0,
        px: 8, py: 2, bgcolor: 'background.default',
        borderTop: '1px solid', borderColor: 'divider', zIndex: 100,
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <Box sx={{ mx: 'auto', width: '100%', maxWidth: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Button variant="contained" size="small" disabled={savePending || !isDirty || hasBandScoreError} onClick={handleSave} sx={{ fontSize: '18px' }}>
            {savePending ? 'Saving…' : 'Save changes'}
          </Button>
          {hasBandScoreError && (
            <Typography sx={{ fontSize: 13, color: 'error.main' }}>
              One or more band minimum scores exceed the scoring range maximum ({scoreMax}).
            </Typography>
          )}
          {saveStatus === 'saved' && <Alert severity="success" sx={{ py: 0, px: 1.5 }}>Settings saved</Alert>}
          {saveStatus === 'error'  && <Alert severity="error"   sx={{ py: 0, px: 1.5 }}>Save failed — please try again</Alert>}
        </Box>
      </Box>

      {/* ── High-risk confirmation modals ────────────────────────────────── */}
      <Dialog
        open={confirmModal !== null}
        onClose={() => setConfirmModal(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        <DialogTitle sx={{ pb: 0.5 }}>
          {confirmModal === 'benchmark'
            ? 'Update benchmark settings?'
            : 'Update Photographer of the Year settings?'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.7 }}>
            {confirmModal === 'benchmark'
              ? 'Changing these settings will affect past competitions. Benchmark classifications and member ranks will be recalculated across the entire season using the new values.'
              : 'Changing these settings will affect the current season. POY standings will be recalculated for all members using the new values.'}
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.7, mt: 1.5, fontWeight: 600 }}>
            This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" color="secondary" onClick={() => setConfirmModal(null)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleConfirmedSave}>
            Update and recalculate
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  )
}

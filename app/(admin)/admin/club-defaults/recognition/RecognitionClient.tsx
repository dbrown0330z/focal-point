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
  poy_standings:           'combined' | 'per_category'
  poy_top_n:               number | ''
  poy_drop_lowest_n:       number
  poy_drop_lowest_on:      boolean
  poy_tiebreaker:          'next_highest' | 'most_images' | 'admin_decision'
  poy_eligibility:         'active_members' | 'all_members' | 'min_duration'
  poy_eligibility_min_dur: '1_month' | '3_months' | '6_months' | '1_year'
  bench_levels:            Record<string, BenchmarkLevel>
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Typography sx={{ fontSize: 17, fontWeight: 600, color: 'text.primary', mb: 0.75, mt: '15px' }}>
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
        size="small" type="number" slotProps={{ htmlInput: { min: 0 } }}
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
  { id: 'default-gold',   name: 'Gold',              color: '#C9A84C' },
  { id: 'default-silver', name: 'Silver',            color: '#A8A8A8' },
  { id: 'default-bronze', name: 'Bronze',            color: '#B87333' },
  { id: 'default-hm',     name: 'Honorable Mention', color: '#6C47D4' },
]

const DEFAULT_BANDS: ClassificationBand[] = [
  { id: 'default-band-l3', name: 'Level 3', color: '#6C47D4', minScore: 26 },
  { id: 'default-band-l2', name: 'Level 2', color: '#0097A7', minScore: 23 },
  { id: 'default-band-l1', name: 'Level 1', color: '#2E7D32', minScore: 20 },
]

const INITIAL: Settings = {
  poy_standings:           'combined',
  poy_top_n:               '',
  poy_drop_lowest_n:       4,
  poy_drop_lowest_on:      false,
  poy_tiebreaker:          'next_highest',
  poy_eligibility:         'active_members',
  poy_eligibility_min_dur: '6_months',
  bench_levels: {
    'default-band-l3': { imagesRequired: 10, cumulative: true },
    'default-band-l2': { imagesRequired: 10, cumulative: true },
    'default-band-l1': { imagesRequired: 10, cumulative: true },
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

  const POY_KEYS = ['poy_standings', 'poy_top_n', 'poy_drop_lowest_n', 'poy_drop_lowest_on',
                    'poy_tiebreaker', 'poy_eligibility', 'poy_eligibility_min_dur'] as const

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
  const poyStandingsHint = s.poy_standings === 'combined'
    ? 'One leaderboard ranks all members by their total score across all categories.'
    : 'Separate standings for each category — members compete within their chosen category only.'

  const topNHint = s.poy_top_n === '' || s.poy_top_n === 0
    ? 'All competition scores count toward the season total.'
    : `Only each member's top ${s.poy_top_n} score${Number(s.poy_top_n) === 1 ? '' : 's'} per category count toward their season total.`

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

  const dropLowestHint = s.poy_drop_lowest_on
    ? `Each member's ${s.poy_drop_lowest_n} lowest score${s.poy_drop_lowest_n === 1 ? '' : 's'} are excluded from their season total.`
    : "All scores count — no scores are dropped from a member's season total."

  return (
    <Box sx={{ pb: '80px' }}>

      {/* ── Intro info box ─────────────────────────────────────────────────── */}
      <Box sx={{
        display: 'flex', gap: 0, mb: 5,
        bgcolor: '#F0FAF7', border: '1px solid #9DD9C5', borderRadius: 2, overflow: 'hidden',
      }}>
        <Box sx={{ flex: 1, px: 2.5, py: 2, borderRight: '1px solid #9DD9C5' }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#0A5742', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
            Manually assigned
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Typography sx={{ fontSize: 12, lineHeight: 1.6, color: '#0A5742' }}>
              <strong>Awards</strong> — judges assign these during each competition
            </Typography>
            <Typography sx={{ fontSize: 12, lineHeight: 1.6, color: '#0A5742' }}>
              <strong>Skill levels</strong> — administrators assign these to member profiles{' '}
              <Typography component="span" sx={{ fontSize: 12, color: '#0A5742', opacity: 0.7 }}>
                (managed in the Members area)
              </Typography>
            </Typography>
          </Box>
        </Box>
        <Box sx={{ flex: 1, px: 2.5, py: 2 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#0A5742', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
            Calculated automatically
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Typography sx={{ fontSize: 12, lineHeight: 1.6, color: '#0A5742' }}>
              <strong>Benchmark</strong> — updated after each competition based on image scores
            </Typography>
            <Typography sx={{ fontSize: 12, lineHeight: 1.6, color: '#0A5742' }}>
              <strong>Photographer of the Year</strong> — updated throughout the season as scores accumulate
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── 1. Awards ─────────────────────────────────────────────────────── */}
      <SectionHeader title="Awards" />
      <Typography sx={{ fontSize: 13, color: 'text.disabled', lineHeight: 1.6, mb: 1.5, maxWidth: 700 }}>
        Manually assigned by judges during or after a competition. Define the award types available.
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
        <SectionHeader title="Benchmark" />
      </Box>
      <Typography sx={{ fontSize: 13, color: 'text.disabled', lineHeight: 1.6, mb: 1.5, maxWidth: 700 }}>
        Automatically calculated. Define the score thresholds that determine image classification bands and rank qualification.
      </Typography>
        <Paper variant="outlined" sx={{ mb: 6, px: 3, py: '20px' }}>

          <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary', mb: 0.75 }}>
            Classification Bands
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
                  size="small" type="number" slotProps={{ htmlInput: { min: 0 } }} placeholder="Min score"
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
            Rank qualification
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.disabled', lineHeight: 1.6, mb: 2, maxWidth: 560 }}>
            Define the criteria that determine when a member qualifies for a higher rank. Qualification is assessed automatically at the end of each competition using the band classifications above.
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
                        size="small" type="number" slotProps={{ htmlInput: { min: 1 } }}
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
      <Typography sx={{ fontSize: 13, color: 'text.disabled', lineHeight: 1.6, mb: 1.5, maxWidth: 700 }}>
        Automatically calculated. Define how points are accumulated across the season and how the final standing is determined.
      </Typography>
        <Paper variant="outlined" sx={{ mb: 6, px: 3, py: '20px' }}>

          <RowField label="POY standings" hint={poyStandingsHint}>
            <Select size="small" value={s.poy_standings} onChange={e => set('poy_standings', e.target.value as Settings['poy_standings'])} sx={{ fontSize: 14, minWidth: 220 }}>
              <MenuItem value="combined"     sx={{ fontSize: 14 }}>Combined across all categories</MenuItem>
              <MenuItem value="per_category" sx={{ fontSize: 14 }}>Separate per category</MenuItem>
            </Select>
          </RowField>
          <Divider sx={{ my: '20px' }} />

          <RowField label="Top N scores per category to count" hint={topNHint}>
            <TextField
              size="small" type="number" slotProps={{ htmlInput: { min: 1 } }} placeholder="All scores"
              value={s.poy_top_n}
              onChange={e => set('poy_top_n', e.target.value === '' ? '' : Number(e.target.value))}
              sx={{ width: 140 }}
            />
          </RowField>
          <Divider sx={{ my: '20px' }} />

          <RowField label="Drop lowest N scores" hint={dropLowestHint}>
            <Switch size="small" checked={s.poy_drop_lowest_on} onChange={e => set('poy_drop_lowest_on', e.target.checked)} />
          </RowField>
          {s.poy_drop_lowest_on && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5, maxWidth: 480 }}>
              <TextField
                size="small" type="number" slotProps={{ htmlInput: { min: 1 } }}
                value={s.poy_drop_lowest_n}
                onChange={e => set('poy_drop_lowest_n', Number(e.target.value) || 1)}
                sx={{ width: 90 }}
              />
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>scores</Typography>
            </Box>
          )}
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

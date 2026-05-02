'use client'

import { Fragment, useRef, useState } from 'react'
import {
  Box,
  Button,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Divider,
  FormControl, InputLabel,
  IconButton,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon              from '@mui/icons-material/Add'
import DeleteOutlineIcon    from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon     from '@mui/icons-material/EditOutlined'
import LockOutlinedIcon     from '@mui/icons-material/LockOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import RichTextEditor       from '@/components/admin/RichTextEditor'

// ── Types ──────────────────────────────────────────────────────────────────────

type GallerySource = 'competition-winners' | 'recent-uploads' | 'member-picks' | 'portrait' | 'landscape'

interface WelcomeContent {
  heading: string; body: string; ctaLabel: string; ctaLink: string
}
interface LargeImageSettings {
  gallerySource: GallerySource; intervalSeconds: number
}
interface Grid6Settings {
  gallerySource: GallerySource; criteria: 'latest' | 'top-rated' | 'competition-winners'
}
interface Strip8Settings {
  gallerySource: GallerySource; criteria: 'latest' | 'top-rated' | 'competition-winners'
}
interface SpotlightSettings {
  mode: 'automatic' | 'manual'; memberName: string
}
interface EventsSettings {
  count: number
}
interface ContentNote {
  id: string; heading: string; body: string // body is HTML from RTF editor
}
interface CustomContentSettings {
  columns: 1 | 2 | 3; previewLines: number; notes: ContentNote[]
}
interface Affiliation {
  id: string; name: string; url: string
}
interface AffiliationsSettings {
  maxColumns: number; affiliations: Affiliation[]
}

interface ContentBlock {
  id:                      string
  name:                    string
  label?:                  string   // user-editable display name
  type:                    string
  enabled:                 boolean
  fixed?:                  boolean
  welcomeContent?:         WelcomeContent
  largeImageSettings?:     LargeImageSettings
  grid6Settings?:          Grid6Settings
  strip8Settings?:         Strip8Settings
  spotlightSettings?:      SpotlightSettings
  eventsSettings?:         EventsSettings
  customContentSettings?:  CustomContentSettings
  affiliationsSettings?:   AffiliationsSettings
}

// ── Default blocks ─────────────────────────────────────────────────────────────

const MAX_CUSTOM_CONTENT = 4

const DEFAULT_BLOCKS: ContentBlock[] = [
  {
    id: 'welcome', name: 'Welcome', type: 'welcome', enabled: true, fixed: true,
    welcomeContent: {
      heading:  'Welcome to our camera club',
      body:     'A community of passionate photographers since 1978. We meet twice monthly for critique nights, competitions, and workshops. All skill levels welcome.',
      ctaLabel: 'Apply for membership',
      ctaLink:  '/apply',
    },
  },
  {
    id: 'large-image', name: 'Large image', type: 'large-image', enabled: true,
    largeImageSettings: { gallerySource: 'competition-winners', intervalSeconds: 5 },
  },
  {
    id: 'custom-content-1', name: 'Custom content', type: 'custom-content', enabled: true,
    customContentSettings: { columns: 3, previewLines: 4, notes: [] },
  },
  {
    id: 'grid-6', name: '6-image grid', type: 'grid-6', enabled: true,
    grid6Settings: { gallerySource: 'competition-winners', criteria: 'top-rated' },
  },
  {
    id: 'strip-8', name: '8-image strip', type: 'strip-8', enabled: true,
    strip8Settings: { gallerySource: 'recent-uploads', criteria: 'latest' },
  },
  {
    id: 'upcoming-events', name: 'Upcoming events', type: 'upcoming-events', enabled: true,
    eventsSettings: { count: 5 },
  },
  {
    id: 'member-spotlight', name: 'Member spotlight', type: 'member-spotlight', enabled: true,
    spotlightSettings: { mode: 'automatic', memberName: '' },
  },
  {
    id: 'affiliations', name: 'Affiliations & links', type: 'affiliations', enabled: true,
    affiliationsSettings: { maxColumns: 6, affiliations: [] },
  },
]

// ── Modal metadata ─────────────────────────────────────────────────────────────

const MODAL_META: Record<string, { title: string; description: string }> = {
  'welcome': {
    title:       'Welcome block',
    description: 'Controls the hero section visitors see on first arrival. Logged-in members see a compact greeting instead of the full hero — no config needed for that state.',
  },
  'large-image': {
    title:       'Large image',
    description: 'A full-width rotating slideshow pulled from one of your image galleries. Configure which gallery to draw from and how quickly images cycle.',
  },
  'grid-6': {
    title:       '6-image grid',
    description: 'A 3×2 grid of square images. Choose the gallery and the order in which images are selected.',
  },
  'strip-8': {
    title:       '8-image strip',
    description: 'A horizontal strip of 8 thumbnail images in a single row. Choose the gallery and the order in which images are selected.',
  },
  'member-spotlight': {
    title:       'Member spotlight',
    description: 'Highlights a member with their featured image and key statistics. Set to automatic to rotate members on each visit, or pin it to a specific person.',
  },
  'upcoming-events': {
    title:       'Upcoming events',
    description: 'Lists your next calendar events in chronological order. Set how many events appear.',
  },
  'custom-content': {
    title:       'Custom content',
    description: 'Free-form content you write and format yourself. Choose how many columns to display (1–3), how many lines to show before a "Read more" prompt, and add rich text to each column.',
  },
  'affiliations': {
    title:       'Affiliations & links',
    description: 'A row of logo badges linking to affiliated organisations, member societies, and social media accounts. Add up to 6 entries.',
  },
}

// ── Hook ───────────────────────────────────────────────────────────────────────

function useHomepageEditor() {
  const [blocks,      setBlocks]      = useState<ContentBlock[]>(DEFAULT_BLOCKS)
  const [hasChanges,  setHasChanges]  = useState(false)
  const [showPublish, setShowPublish] = useState(false)

  const toggleBlock = (id: string) => {
    setBlocks(bs => bs.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b))
    setHasChanges(true)
  }

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    setBlocks(bs => bs.map(b => b.id === id ? { ...b, ...updates } : b))
    setHasChanges(true)
  }

  const reorderBlocks = (from: number, to: number) => {
    setBlocks(bs => {
      const next = [...bs]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setHasChanges(true)
  }

  const addCustomContent = () => {
    const existing = blocks.filter(b => b.type === 'custom-content')
    if (existing.length >= MAX_CUSTOM_CONTENT) return
    const num = existing.length + 1
    setBlocks(bs => [...bs, {
      id:    `custom-content-${Date.now()}`,
      name:  'Custom content',
      label: num === 1 ? undefined : `Custom content ${num}`,
      type:  'custom-content',
      enabled: true,
      customContentSettings: { columns: 1, previewLines: 4, notes: [] },
    }])
    setHasChanges(true)
  }

  const removeBlock = (id: string) => {
    setBlocks(bs => bs.filter(b => b.id !== id))
    setHasChanges(true)
  }

  const saveDraft = () => setHasChanges(false)
  const publish   = () => { setShowPublish(false); setHasChanges(false) }

  const customContentCount = blocks.filter(b => b.type === 'custom-content').length

  return {
    blocks, hasChanges, showPublish, setShowPublish,
    toggleBlock, updateBlock, reorderBlocks,
    addCustomContent, removeBlock, customContentCount,
    saveDraft, publish,
  }
}

// ── Shared editor primitives ───────────────────────────────────────────────────

function DragGrip({ disabled }: { disabled?: boolean }) {
  return (
    <span style={{
      color: 'var(--text-tertiary)', opacity: disabled ? 0.3 : 1,
      cursor: disabled ? 'default' : 'grab', flexShrink: 0,
      display: 'flex', alignItems: 'center',
    }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5.5" cy="3.5"   r="1.4" /><circle cx="10.5" cy="3.5"  r="1.4" />
        <circle cx="5.5" cy="8"     r="1.4" /><circle cx="10.5" cy="8"    r="1.4" />
        <circle cx="5.5" cy="12.5"  r="1.4" /><circle cx="10.5" cy="12.5" r="1.4" />
      </svg>
    </span>
  )
}

function InsertionLine() {
  return (
    <div style={{ position: 'relative', height: 2, margin: '2px 0', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--action-primary)', borderRadius: 1 }} />
      <div style={{ position: 'absolute', left: -1, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: 'var(--action-primary)' }} />
    </div>
  )
}

const GALLERY_OPTIONS: { value: GallerySource; label: string }[] = [
  { value: 'competition-winners', label: 'Competition winners' },
  { value: 'recent-uploads',      label: 'Recent uploads' },
  { value: 'member-picks',        label: 'Member picks' },
  { value: 'portrait',            label: 'Portrait collection' },
  { value: 'landscape',           label: 'Landscape collection' },
]

const inputSx = { '& .MuiInputBase-root': { fontSize: 13 }, '& .MuiInputBase-input': { py: '7px', px: '10px' } }

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary' }}>
        {label}
      </Typography>
      {children}
    </Box>
  )
}

function GallerySelect({ value, onChange }: { value: GallerySource; onChange: (v: GallerySource) => void }) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel sx={{ fontSize: 13 }}>Gallery source</InputLabel>
      <Select value={value} label="Gallery source" onChange={e => onChange(e.target.value as GallerySource)} sx={{ fontSize: 13 }}>
        {GALLERY_OPTIONS.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: 13 }}>{o.label}</MenuItem>)}
      </Select>
    </FormControl>
  )
}

function CriteriaSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel sx={{ fontSize: 13 }}>Selection order</InputLabel>
      <Select value={value} label="Selection order" onChange={e => onChange(e.target.value)} sx={{ fontSize: 13 }}>
        <MenuItem value="top-rated"           sx={{ fontSize: 13 }}>Top rated</MenuItem>
        <MenuItem value="latest"              sx={{ fontSize: 13 }}>Most recent</MenuItem>
        <MenuItem value="competition-winners" sx={{ fontSize: 13 }}>Competition winners</MenuItem>
      </Select>
    </FormControl>
  )
}

// ── Block modal — settings panels per type ─────────────────────────────────────

function WelcomeModalBody({ block, onChange }: { block: ContentBlock; onChange: (u: Partial<ContentBlock>) => void }) {
  const c = block.welcomeContent!
  const set = (k: keyof WelcomeContent, v: string) => onChange({ welcomeContent: { ...c, [k]: v } })
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ p: 1.5, background: 'rgba(30,77,140,0.05)', borderRadius: '4px', border: '1px solid rgba(30,77,140,0.12)' }}>
        <Typography sx={{ fontSize: 12, color: 'var(--action-primary)', fontWeight: 500 }}>
          Logged-in members see a compact "Welcome back" greeting automatically — no separate config needed.
        </Typography>
      </Box>
      <FieldRow label="Headline">
        <TextField size="small" fullWidth value={c.heading} onChange={e => set('heading', e.target.value)} sx={inputSx} />
      </FieldRow>
      <FieldRow label="Body">
        <TextField size="small" fullWidth multiline minRows={3} value={c.body} onChange={e => set('body', e.target.value)} sx={inputSx} />
      </FieldRow>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <FieldRow label="CTA label">
          <TextField size="small" fullWidth value={c.ctaLabel} onChange={e => set('ctaLabel', e.target.value)} sx={inputSx} />
        </FieldRow>
        <FieldRow label="CTA link">
          <TextField size="small" fullWidth value={c.ctaLink}  onChange={e => set('ctaLink',  e.target.value)} placeholder="/apply" sx={inputSx} />
        </FieldRow>
      </Box>
    </Box>
  )
}

function LargeImageModalBody({ block, onChange }: { block: ContentBlock; onChange: (u: Partial<ContentBlock>) => void }) {
  const s = block.largeImageSettings!
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <GallerySelect value={s.gallerySource} onChange={v => onChange({ largeImageSettings: { ...s, gallerySource: v } })} />
      <FieldRow label="Slide interval (seconds)">
        <TextField size="small" type="number" value={s.intervalSeconds}
          onChange={e => onChange({ largeImageSettings: { ...s, intervalSeconds: Number(e.target.value) } })}
          sx={{ ...inputSx, width: 110 }} slotProps={{ htmlInput: { min: 2, max: 30 } }} />
      </FieldRow>
    </Box>
  )
}

function Grid6ModalBody({ block, onChange }: { block: ContentBlock; onChange: (u: Partial<ContentBlock>) => void }) {
  const s = block.grid6Settings!
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <GallerySelect value={s.gallerySource} onChange={v => onChange({ grid6Settings: { ...s, gallerySource: v } })} />
      <CriteriaSelect value={s.criteria} onChange={v => onChange({ grid6Settings: { ...s, criteria: v as Grid6Settings['criteria'] } })} />
    </Box>
  )
}

function Strip8ModalBody({ block, onChange }: { block: ContentBlock; onChange: (u: Partial<ContentBlock>) => void }) {
  const s = block.strip8Settings!
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <GallerySelect value={s.gallerySource} onChange={v => onChange({ strip8Settings: { ...s, gallerySource: v } })} />
      <CriteriaSelect value={s.criteria} onChange={v => onChange({ strip8Settings: { ...s, criteria: v as Strip8Settings['criteria'] } })} />
    </Box>
  )
}

function SpotlightModalBody({ block, onChange }: { block: ContentBlock; onChange: (u: Partial<ContentBlock>) => void }) {
  const s = block.spotlightSettings!
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <FieldRow label="Member selection">
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(['automatic', 'manual'] as SpotlightSettings['mode'][]).map(m => (
            <button key={m} onClick={() => onChange({ spotlightSettings: { ...s, mode: m } })} style={{
              flex: 1, padding: '7px 0', cursor: 'pointer', borderRadius: 4,
              border: `1px solid ${s.mode === m ? 'var(--action-primary)' : 'var(--border-default)'}`,
              background: s.mode === m ? 'rgba(30,77,140,0.07)' : 'var(--surface-2)',
              color: s.mode === m ? 'var(--action-primary)' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 500, textTransform: 'capitalize', transition: 'all 0.1s',
            }}>{m}</button>
          ))}
        </Box>
      </FieldRow>
      {s.mode === 'automatic' && (
        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>
          A member is automatically selected on each page load, rotating through active members.
        </Typography>
      )}
      {s.mode === 'manual' && (
        <FieldRow label="Member name">
          <TextField size="small" fullWidth value={s.memberName}
            onChange={e => onChange({ spotlightSettings: { ...s, memberName: e.target.value } })}
            placeholder="Start typing a name…" sx={inputSx} />
        </FieldRow>
      )}
    </Box>
  )
}

function EventsModalBody({ block, onChange }: { block: ContentBlock; onChange: (u: Partial<ContentBlock>) => void }) {
  const s = block.eventsSettings!
  return (
    <FieldRow label="Number of events to show">
      <TextField size="small" type="number" value={s.count}
        onChange={e => onChange({ eventsSettings: { count: Number(e.target.value) } })}
        sx={{ ...inputSx, width: 100 }} slotProps={{ htmlInput: { min: 1, max: 20 } }} />
    </FieldRow>
  )
}

function CustomContentModalBody({ block, onChange }: { block: ContentBlock; onChange: (u: Partial<ContentBlock>) => void }) {
  const s = block.customContentSettings!

  const updateNote = (id: string, k: keyof ContentNote, v: string) =>
    onChange({ customContentSettings: { ...s, notes: s.notes.map(n => n.id === id ? { ...n, [k]: v } : n) } })

  const addNote = () => {
    if (s.notes.length >= s.columns) return
    onChange({ customContentSettings: { ...s, notes: [...s.notes, { id: crypto.randomUUID(), heading: '', body: '' }] } })
  }

  const removeNote = (id: string) =>
    onChange({ customContentSettings: { ...s, notes: s.notes.filter(n => n.id !== id) } })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Block label */}
      <FieldRow label="Block label (shown in editor list)">
        <TextField size="small" fullWidth value={block.label ?? block.name}
          onChange={e => onChange({ label: e.target.value })} sx={inputSx}
          placeholder="Custom content" />
      </FieldRow>

      <Divider />

      {/* Layout */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <FieldRow label="Columns">
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {([1, 2, 3] as (1 | 2 | 3)[]).map(n => (
              <button key={n} onClick={() => onChange({ customContentSettings: { ...s, columns: n } })} style={{
                width: 36, height: 30, cursor: 'pointer', borderRadius: 4,
                border: `1px solid ${s.columns === n ? 'var(--action-primary)' : 'var(--border-default)'}`,
                background: s.columns === n ? 'rgba(30,77,140,0.07)' : 'var(--surface-2)',
                color: s.columns === n ? 'var(--action-primary)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600, transition: 'all 0.1s',
              }}>{n}</button>
            ))}
          </Box>
        </FieldRow>
        <FieldRow label="Preview lines before 'Read more'">
          <TextField size="small" type="number" value={s.previewLines}
            onChange={e => onChange({ customContentSettings: { ...s, previewLines: Number(e.target.value) } })}
            sx={{ ...inputSx, width: 80 }} slotProps={{ htmlInput: { min: 1, max: 20 } }} />
        </FieldRow>
      </Box>

      <Divider />

      {/* Content blocks */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
            Content ({s.notes.length} / {s.columns} {s.columns === 1 ? 'column' : 'columns'})
          </Typography>
          {s.notes.length < s.columns && (
            <Button startIcon={<AddIcon />} size="small" variant="outlined" color="secondary"
              onClick={addNote} sx={{ textTransform: 'none', fontSize: 12 }}>
              Add {s.columns === 1 ? 'content' : `column ${s.notes.length + 1}`}
            </Button>
          )}
        </Box>

        {s.notes.length === 0 && (
          <Box sx={{ py: 3, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: '6px' }}>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1 }}>No content yet.</Typography>
            <Button startIcon={<AddIcon />} size="small" variant="outlined" color="secondary"
              onClick={addNote} sx={{ textTransform: 'none', fontSize: 13 }}>
              Add {s.columns === 1 ? 'content' : 'first column'}
            </Button>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {s.notes.map((note, i) => (
            <Box key={note.id}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'text.secondary' }}>
                  {s.columns === 1 ? 'Content' : `Column ${i + 1}`}
                </Typography>
                <IconButton size="small" onClick={() => removeNote(note.id)} sx={{ color: 'text.secondary' }}>
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              <TextField size="small" fullWidth value={note.heading}
                onChange={e => updateNote(note.id, 'heading', e.target.value)}
                placeholder="Heading (optional)" sx={{ ...inputSx, mb: 1.5 }} />
              <RichTextEditor
                key={note.id}
                initialContent={note.body}
                onChange={html => updateNote(note.id, 'body', html)}
                minHeight={180}
                placeholder="Write your content here…"
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

function AffiliationsModalBody({ block, onChange }: { block: ContentBlock; onChange: (u: Partial<ContentBlock>) => void }) {
  const s = block.affiliationsSettings!
  const addItem = () =>
    onChange({ affiliationsSettings: { ...s, affiliations: [...s.affiliations, { id: crypto.randomUUID(), name: '', url: '' }] } })
  const setItem = (id: string, k: keyof Affiliation, v: string) =>
    onChange({ affiliationsSettings: { ...s, affiliations: s.affiliations.map(a => a.id === id ? { ...a, [k]: v } : a) } })
  const removeItem = (id: string) =>
    onChange({ affiliationsSettings: { ...s, affiliations: s.affiliations.filter(a => a.id !== id) } })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <FieldRow label="Max columns (1–6)">
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          {[1,2,3,4,5,6].map(n => (
            <button key={n} onClick={() => onChange({ affiliationsSettings: { ...s, maxColumns: n } })} style={{
              width: 32, height: 30, cursor: 'pointer', borderRadius: 4,
              border: `1px solid ${s.maxColumns === n ? 'var(--action-primary)' : 'var(--border-default)'}`,
              background: s.maxColumns === n ? 'rgba(30,77,140,0.07)' : 'var(--surface-2)',
              color: s.maxColumns === n ? 'var(--action-primary)' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 600, transition: 'all 0.1s',
            }}>{n}</button>
          ))}
        </Box>
      </FieldRow>

      <Box>
        <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary', mb: 1.5 }}>
          Entries ({s.affiliations.length} / {s.maxColumns})
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {s.affiliations.map((a, i) => (
            <Box key={a.id} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography sx={{ fontSize: 11, color: 'text.tertiary', minWidth: 18, textAlign: 'right' }}>{i + 1}</Typography>
              <TextField size="small" value={a.name} onChange={e => setItem(a.id, 'name', e.target.value)}
                placeholder="Name (e.g. PSA)" sx={{ ...inputSx, flex: '0 0 120px' }} />
              <TextField size="small" value={a.url} onChange={e => setItem(a.id, 'url', e.target.value)}
                placeholder="https://…" sx={{ ...inputSx, flex: 1 }} />
              <IconButton size="small" onClick={() => removeItem(a.id)} sx={{ color: 'text.secondary', flexShrink: 0 }}>
                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ))}
          {s.affiliations.length < s.maxColumns && (
            <Button startIcon={<AddIcon />} size="small" variant="outlined" color="secondary"
              onClick={addItem} sx={{ alignSelf: 'flex-start', textTransform: 'none', fontSize: 13, mt: 0.5 }}>
              Add entry
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  )
}

// ── Block edit modal ───────────────────────────────────────────────────────────

function BlockEditModal({
  block, onClose, onUpdate, onRemove,
}: {
  block:    ContentBlock | null
  onClose:  () => void
  onUpdate: (u: Partial<ContentBlock>) => void
  onRemove?: () => void
}) {
  if (!block) return null
  const meta = MODAL_META[block.type] ?? { title: block.label ?? block.name, description: '' }
  const isCustom = block.type === 'custom-content'
  const displayLabel = block.label ?? block.name

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth={isCustom ? 'md' : 'sm'}
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ pb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{meta.title}</Typography>
            {isCustom && block.label && (
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>"{displayLabel}"</Typography>
            )}
          </Box>
          {onRemove && (
            <Tooltip title="Remove this block">
              <IconButton size="small" onClick={onRemove} sx={{ color: 'text.secondary' }}>
                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2.5, lineHeight: 1.55 }}>
          {meta.description}
        </Typography>

        {block.type === 'welcome'          && <WelcomeModalBody          block={block} onChange={onUpdate} />}
        {block.type === 'large-image'      && <LargeImageModalBody       block={block} onChange={onUpdate} />}
        {block.type === 'grid-6'           && <Grid6ModalBody            block={block} onChange={onUpdate} />}
        {block.type === 'strip-8'          && <Strip8ModalBody           block={block} onChange={onUpdate} />}
        {block.type === 'member-spotlight' && <SpotlightModalBody        block={block} onChange={onUpdate} />}
        {block.type === 'upcoming-events'  && <EventsModalBody           block={block} onChange={onUpdate} />}
        {block.type === 'custom-content'   && <CustomContentModalBody    block={block} onChange={onUpdate} />}
        {block.type === 'affiliations'     && <AffiliationsModalBody     block={block} onChange={onUpdate} />}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="contained" onClick={onClose} sx={{ textTransform: 'none', fontSize: 13 }}>Done</Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Block subtitle ─────────────────────────────────────────────────────────────

const CRITERIA_LABEL: Record<string, string> = {
  'top-rated':           'Top rated',
  'latest':              'Most recent',
  'competition-winners': 'Competition winners',
}

function getBlockSubtitle(block: ContentBlock): string | null {
  const gl = (src: GallerySource) => GALLERY_OPTIONS.find(o => o.value === src)?.label ?? src
  const cl = (c: string) => CRITERIA_LABEL[c] ?? c

  switch (block.type) {
    case 'large-image': {
      const s = block.largeImageSettings; if (!s) return null
      return `${gl(s.gallerySource)} · every ${s.intervalSeconds}s`
    }
    case 'grid-6': {
      const s = block.grid6Settings; if (!s) return null
      return `${gl(s.gallerySource)} · ${cl(s.criteria)}`
    }
    case 'strip-8': {
      const s = block.strip8Settings; if (!s) return null
      return `${gl(s.gallerySource)} · ${cl(s.criteria)}`
    }
    case 'member-spotlight': {
      const s = block.spotlightSettings; if (!s) return null
      return s.mode === 'manual' && s.memberName ? `Pinned: ${s.memberName}` : 'Auto-rotates each visit'
    }
    case 'upcoming-events': {
      const s = block.eventsSettings; if (!s) return null
      return `Next ${s.count} event${s.count === 1 ? '' : 's'}`
    }
    case 'custom-content': {
      const s = block.customContentSettings; if (!s) return null
      const cols = `${s.columns} col${s.columns === 1 ? '' : 's'}`
      const items = s.notes.length > 0 ? `${s.notes.length} item${s.notes.length === 1 ? '' : 's'}` : 'no content yet'
      return `${cols} · ${items}`
    }
    case 'affiliations': {
      const s = block.affiliationsSettings; if (!s) return null
      return s.affiliations.length > 0
        ? `${s.affiliations.length} entr${s.affiliations.length === 1 ? 'y' : 'ies'}`
        : 'no entries yet'
    }
    default: return null
  }
}

// ── BlockCard ──────────────────────────────────────────────────────────────────

function BlockCard({
  block, onToggle, onEdit, onRemove, onDragStart, onDragOver,
}: {
  block:       ContentBlock
  onToggle:    () => void
  onEdit:      () => void
  onRemove?:   () => void
  onDragStart: () => void
  onDragOver:  (e: React.DragEvent) => void
}) {
  const configOnly = ['large-image','grid-6','strip-8','upcoming-events','member-spotlight'].includes(block.type)
  const displayName = block.label ?? block.name
  const subtitle    = getBlockSubtitle(block)

  return (
    <Box
      draggable={!block.fixed}
      onDragStart={block.fixed ? undefined : e => { e.stopPropagation(); onDragStart() }}
      onDragOver={block.fixed  ? undefined : onDragOver}
      sx={{
        border: '1px solid var(--border-default)',
        borderRadius: '6px',
        background: 'var(--surface-2)',
        opacity: block.enabled ? 1 : 0.55,
        transition: 'opacity 0.15s',
      }}
    >
      <Box sx={{ px: 1.5, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {block.fixed
          ? <Tooltip title="Locked — always first"><span style={{ display: 'flex', color: 'var(--text-tertiary)', opacity: 0.5, flexShrink: 0 }}><LockOutlinedIcon sx={{ fontSize: 14 }} /></span></Tooltip>
          : <DragGrip />
        }
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>
            {displayName}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={configOnly ? 'Settings' : 'Edit content'}>
            <IconButton size="small" onClick={onEdit} sx={{ color: 'text.secondary' }}>
              {configOnly ? <SettingsOutlinedIcon sx={{ fontSize: 16 }} /> : <EditOutlinedIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
          {onRemove && (
            <Tooltip title="Remove block">
              <IconButton size="small" onClick={onRemove} sx={{ color: 'text.secondary' }}>
                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
          <Switch checked={block.enabled} onChange={onToggle} size="small" sx={{ ml: 0.5 }} />
        </Box>
      </Box>
      {block.fixed && (
        <Box sx={{ px: 1.5, pb: 1 }}>
          <Typography sx={{ fontSize: 11, color: 'text.tertiary', fontStyle: 'italic' }}>Locked — always shown first</Typography>
        </Box>
      )}
    </Box>
  )
}

// ── Validation ─────────────────────────────────────────────────────────────────

type IssueSeverity = 'warning' | 'info'

interface ValidationIssue {
  blockId:  string
  label:    string
  severity: IssueSeverity
  message:  string
  fix:      string
}

function getValidationIssues(blocks: ContentBlock[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const b of blocks.filter(b => b.enabled)) {
    const lbl = b.label ?? b.name

    switch (b.type) {
      case 'welcome': {
        if (!b.welcomeContent?.heading?.trim())
          issues.push({ blockId: b.id, label: lbl, severity: 'warning',
            message: 'Welcome block has no headline',
            fix: 'Open block settings and add a headline.' })
        break
      }
      case 'large-image':
      case 'grid-6':
      case 'strip-8': {
        const src = (b.largeImageSettings ?? b.grid6Settings ?? b.strip8Settings)?.gallerySource
        const gLabel = GALLERY_OPTIONS.find(o => o.value === src)?.label ?? src
        if (gLabel)
          issues.push({ blockId: b.id, label: lbl, severity: 'info',
            message: `Pulls from "${gLabel}"`,
            fix: 'Make sure this gallery has images. If it\'s empty the block will not appear on the homepage.' })
        break
      }
      case 'member-spotlight': {
        if (b.spotlightSettings?.mode === 'manual' && !b.spotlightSettings.memberName?.trim())
          issues.push({ blockId: b.id, label: lbl, severity: 'warning',
            message: 'No member selected (manual mode)',
            fix: 'Open block settings and enter a member name, or switch to automatic.' })
        break
      }
      case 'custom-content': {
        const s = b.customContentSettings
        if (!s || s.notes.length === 0)
          issues.push({ blockId: b.id, label: lbl, severity: 'warning',
            message: 'No content added yet',
            fix: 'Open block settings and add at least one content column.' })
        break
      }
      case 'affiliations': {
        if (!b.affiliationsSettings || b.affiliationsSettings.affiliations.length === 0)
          issues.push({ blockId: b.id, label: lbl, severity: 'warning',
            message: 'No entries configured',
            fix: 'Open block settings and add logos and links.' })
        break
      }
    }
  }

  return issues
}

// ── Preview theme tokens (member site, from design-tokens.md) ──────────────────

type ColorMode      = 'light' | 'dark'
type AudienceFilter = 'visitor' | 'member'
type DeviceMode     = 'desktop' | 'mobile'

interface PreviewTheme {
  surface0: string; surface1: string; surface2: string
  textPrimary: string; textSecondary: string; textTertiary: string
  actionPrimary: string; borderSubtle: string; borderDefault: string
  fontSerif: string; fontSans: string; radius: string
}

const MEMBER_DARK: PreviewTheme = {
  surface0: '#141414', surface1: '#1E1E1E', surface2: '#292929',
  textPrimary: '#E8E8E8', textSecondary: '#9E9E9E', textTertiary: '#737373',
  actionPrimary: '#4A90D4', borderSubtle: 'rgba(255,255,255,0.07)', borderDefault: 'rgba(255,255,255,0.12)',
  fontSerif: 'var(--font-lora, Lora, Georgia, serif)', fontSans: 'var(--font-inter, Inter, system-ui, sans-serif)', radius: '8px',
}

const MEMBER_LIGHT: PreviewTheme = {
  surface0: '#F5F5F5', surface1: '#ECECEC', surface2: '#FFFFFF',
  textPrimary: '#1A1A1A', textSecondary: '#696969', textTertiary: '#737373',
  actionPrimary: '#1A6FC4', borderSubtle: 'rgba(0,0,0,0.08)', borderDefault: 'rgba(0,0,0,0.14)',
  fontSerif: 'var(--font-lora, Lora, Georgia, serif)', fontSans: 'var(--font-inter, Inter, system-ui, sans-serif)', radius: '8px',
}

const PHOTO_GRADIENTS = [
  'linear-gradient(160deg, #87CEEB 45%, #4A7C44 45%)',
  'linear-gradient(180deg, #FF6B35 0%, #C84B11 40%, #1A0A00 100%)',
  'linear-gradient(135deg, #2c3e50 0%, #7f8c8d 100%)',
  'linear-gradient(160deg, #1a2a1a 0%, #2d5a27 50%, #4a8c3f 100%)',
  'linear-gradient(135deg, #3a1c71 0%, #d76d77 50%, #ffaf7b 100%)',
  'linear-gradient(160deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
]

const picsum      = (seed: string, w: number, h: number) => `https://picsum.photos/seed/${seed}/${w}/${h}`
const LARGE_IMG   = picsum('fp-large', 1200, 600)
const GRID_IMGS   = [1,2,3,4,5,6].map(i => picsum(`fp-g${i}`,  400, 400))
const STRIP_IMGS  = [11,22,33,44,55,66,77,88].map(n => picsum(String(n), 300, 300))
const SPOT_IMG    = picsum('fp-portrait', 600, 600)
const AFFILIATION_COLORS = ['#6C47D4','#0097A7','#E65100','#AD1457','#00796B','#7B6B38']

// ── Placeholder image (compact mode) ──────────────────────────────────────────
// Eight muted landscape schemes — conveys "image goes here" without bright colours

const PH_SCHEMES = [
  { sky: '#B8C8D4', hill: '#8A9EA8', peak: '#6C8390', sun: '#D4C090' },
  { sky: '#C4BBB0', hill: '#9E8E82', peak: '#7E6E64', sun: '#D8BE8A' },
  { sky: '#B4C2B0', hill: '#7C8E7A', peak: '#5E7260', sun: '#D8C890' },
  { sky: '#C0BAC8', hill: '#8A809A', peak: '#6C6280', sun: '#E0D0A0' },
  { sky: '#C8C2B8', hill: '#988C80', peak: '#786C62', sun: '#DCC490' },
  { sky: '#AEBEC8', hill: '#6E7E8E', peak: '#506070', sun: '#D0BC88' },
  { sky: '#C2B8B8', hill: '#967E7E', peak: '#786060', sun: '#DEC8A0' },
  { sky: '#B2C2BC', hill: '#7A8E88', peak: '#5C726C', sun: '#D2C08C' },
]

function PlaceholderImg({ idx, style }: { idx: number; style?: React.CSSProperties }) {
  const { sky, hill, peak, sun } = PH_SCHEMES[idx % PH_SCHEMES.length]
  return (
    <svg
      viewBox="0 0 200 150"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
    >
      {/* sky */}
      <rect width="200" height="150" fill={sky} />
      {/* sun */}
      <circle cx="152" cy="36" r="15" fill={sun} opacity="0.72" />
      {/* back hill */}
      <polygon points="0,150 70,72 140,150" fill={hill} opacity="0.42" />
      {/* main peak */}
      <polygon points="65,150 140,40 215,150" fill={peak} opacity="0.68" />
      {/* foreground ground */}
      <rect x="0" y="125" width="200" height="25" fill={hill} opacity="0.38" />
    </svg>
  )
}

const DUMMY_EVENTS = [
  { date: 'Tue 6 May',  title: 'Event title placeholder',         time: '7:30 pm' },
  { date: 'Sat 10 May', title: 'Another event name here',         time: '8:00 am' },
  { date: 'Tue 20 May', title: 'Third event placeholder',         time: '7:30 pm' },
  { date: 'Sat 7 Jun',  title: 'Fourth event title',              time: '8:00 pm' },
  { date: 'Tue 3 Jun',  title: 'Fifth event name',                time: '7:00 pm' },
]

// ── Preview blocks ─────────────────────────────────────────────────────────────

function PbSection({ children, t, noBorder }: { children: React.ReactNode; t: PreviewTheme; noBorder?: boolean }) {
  return <div style={{ padding: '20px', borderBottom: noBorder ? undefined : `1px solid ${t.borderSubtle}`, fontFamily: t.fontSans }}>{children}</div>
}

function PbHeading({ children, t }: { children: React.ReactNode; t: PreviewTheme }) {
  return <div style={{ fontFamily: t.fontSerif, fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', color: t.textPrimary, marginBottom: 14, lineHeight: 1.3 }}>{children}</div>
}

// Read-more note card (HTML body)
function CustomNotePreview({ note, previewLines, t }: { note: ContentNote; previewLines: number; t: PreviewTheme }) {
  const [open, setOpen] = useState(false)
  const hasBody = !!note.body && note.body !== '<p><br></p>' && note.body.trim() !== ''
  const maxH = previewLines * 1.6 * 14 // approx px

  return (
    <div style={{ background: t.surface1, borderRadius: t.radius, padding: '14px 16px' }}>
      {note.heading && (
        <div style={{ fontFamily: t.fontSerif, fontSize: 14, fontWeight: 700, color: t.textPrimary, marginBottom: 6 }}>
          {note.heading}
        </div>
      )}
      {hasBody ? (
        <>
          <div
            style={{
              fontFamily: t.fontSans, fontSize: 13, color: t.textSecondary, lineHeight: 1.6,
              maxHeight: open ? 'none' : maxH, overflow: open ? 'visible' : 'hidden',
            }}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: note.body }}
          />
          {!open && (
            <button onClick={() => setOpen(true)} style={{
              marginTop: 8, cursor: 'pointer', border: 'none', background: 'none', padding: 0,
              fontSize: 12, color: t.actionPrimary, fontFamily: t.fontSans, fontWeight: 500,
            }}>
              Read more…
            </button>
          )}
        </>
      ) : (
        <div style={{ fontFamily: t.fontSans, fontSize: 12, color: t.textTertiary, fontStyle: 'italic' }}>No content yet.</div>
      )}
    </div>
  )
}

function Strip8Preview({ block, t, compact }: { block: ContentBlock; t: PreviewTheme; compact: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) =>
    scrollRef.current?.scrollBy({ left: dir * 400, behavior: 'smooth' })

  const navBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 26, height: 26, borderRadius: '50%', cursor: 'pointer',
    border: `1px solid ${t.borderDefault}`, background: t.surface2,
    color: t.textSecondary, fontSize: 18, lineHeight: '1', flexShrink: 0,
    fontFamily: t.fontSans,
  }

  const s = block.strip8Settings!
  const subtitle = `${GALLERY_OPTIONS.find(o => o.value === s.gallerySource)?.label} · ${CRITERIA_LABEL[s.criteria] ?? s.criteria}`

  return (
    <PbSection t={t}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ flex: 1, fontFamily: t.fontSerif, fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', color: t.textPrimary }}>
          8-image strip
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: t.textTertiary, fontFamily: t.fontSans }}>1–8 of 32</span>
          <button onClick={() => scroll(-1)} style={navBtn}>‹</button>
          <button onClick={() => scroll(1)}  style={navBtn}>›</button>
        </div>
      </div>
      <div style={{ fontSize: 11, color: t.textTertiary, fontFamily: t.fontSans, marginBottom: 10 }}>{subtitle}</div>
      <div ref={scrollRef} style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {compact
          ? [0,1,2,3,4,5,6,7].map(i => (
              <div key={i} style={{ flexShrink: 0, width: 130, height: 130, borderRadius: 8, overflow: 'hidden' }}>
                <PlaceholderImg idx={i + 2} />
              </div>
            ))
          : STRIP_IMGS.map((src, i) => (
              <div key={i} style={{ flexShrink: 0, width: 130, height: 130, borderRadius: 8, overflow: 'hidden' }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ))
        }
      </div>
    </PbSection>
  )
}

function PreviewBlock({ block, audience, t, compact }: { block: ContentBlock; audience: AudienceFilter; t: PreviewTheme; compact: boolean }) {
  if (!block.enabled) return null

  const ctaBtn: React.CSSProperties = {
    display: 'inline-block', fontFamily: t.fontSans, fontSize: 13, fontWeight: 500,
    padding: '8px 20px', borderRadius: t.radius, background: t.actionPrimary, color: '#fff', cursor: 'default', marginTop: 12,
  }
  const bodyText: React.CSSProperties = { fontFamily: t.fontSans, fontSize: 13, color: t.textSecondary, lineHeight: 1.6 }

  switch (block.type) {

    case 'welcome': {
      const c = block.welcomeContent!
      if (audience === 'member') {
        return (
          <div style={{ padding: '14px 20px', background: t.surface1, borderBottom: `1px solid ${t.borderSubtle}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: PHOTO_GRADIENTS[4] }} />
            <div style={{ fontFamily: t.fontSerif, fontSize: 14, fontWeight: 700, color: t.textPrimary }}>Welcome back, Jane 👋</div>
          </div>
        )
      }
      return (
        <div style={{ background: `linear-gradient(160deg, ${t.surface1} 0%, ${t.surface0} 100%)`, borderBottom: `1px solid ${t.borderSubtle}`, padding: '44px 24px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: `radial-gradient(${t.textPrimary} 1px, transparent 1px)`, backgroundSize: '18px 18px', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontFamily: t.fontSerif, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: t.textPrimary, marginBottom: 10 }}>{c.heading}</div>
            <div style={{ ...bodyText, maxWidth: 500, margin: '0 auto' }}>{c.body}</div>
            <div style={ctaBtn}>{c.ctaLabel}</div>
          </div>
        </div>
      )
    }

    case 'large-image': {
      const s = block.largeImageSettings!
      const overlay = (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.45) 100%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '12px 14px' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0,1,2,3].map(i => <div key={i} style={{ width: i === 0 ? 18 : 6, height: 6, borderRadius: 3, background: i === 0 ? '#fff' : 'rgba(255,255,255,0.4)' }} />)}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: t.fontSans }}>
            Slides every {s.intervalSeconds}s · {GALLERY_OPTIONS.find(o => o.value === s.gallerySource)?.label}
          </div>
        </div>
      )
      return (
        <div style={{ position: 'relative', borderBottom: `1px solid ${t.borderSubtle}` }}>
          {compact
            ? <div style={{ width: '100%', aspectRatio: '16/7', overflow: 'hidden' }}><PlaceholderImg idx={0} /></div>
            : <img src={LARGE_IMG} alt="" style={{ width: '100%', display: 'block', aspectRatio: '16/7', objectFit: 'cover' }} />
          }
          {overlay}
        </div>
      )
    }

    case 'grid-6': {
      const gs = block.grid6Settings!
      const srcLabel = GALLERY_OPTIONS.find(o => o.value === gs.gallerySource)?.label
      const crtLabel = CRITERIA_LABEL[gs.criteria]
      return (
        <PbSection t={t}>
          <PbHeading t={t}>6-image grid</PbHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {compact
              ? [0,1,2,3,4,5].map(i => (
                  <div key={i} style={{ aspectRatio: '1', borderRadius: 6, overflow: 'hidden' }}>
                    <PlaceholderImg idx={i} />
                  </div>
                ))
              : GRID_IMGS.map((src, i) => (
                  <div key={i} style={{ aspectRatio: '1', borderRadius: 6, overflow: 'hidden' }}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))
            }
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: t.textTertiary, fontFamily: t.fontSans }}>
            {srcLabel} · {crtLabel}
          </div>
        </PbSection>
      )
    }

    case 'strip-8':
      return <Strip8Preview block={block} t={t} compact={compact} />

    case 'member-spotlight': {
      const ss = block.spotlightSettings!
      const name = ss.mode === 'manual' && ss.memberName ? ss.memberName : 'Member name'
      const keyStats = [
        { label: 'Member since',     value: 'Month YYYY' },
        { label: 'Skill level',      value: 'Advanced'   },
        { label: 'Images submitted', value: '–'          },
        { label: 'Competition wins', value: '–'          },
      ]
      const detailStats = [
        { label: 'By category', value: 'Landscape – · Portrait – · Nature –' },
        { label: 'Camera',      value: '–' },
        { label: 'Subjects',    value: '–' },
      ]
      return (
        <PbSection t={t}>
          <PbHeading t={t}>Member spotlight</PbHeading>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

            {/* Image — 1/3 width, highest scoring image of the year */}
            <div style={{ position: 'relative', flexShrink: 0, width: '33%', borderRadius: t.radius, overflow: 'hidden', aspectRatio: '1' }}>
              {compact
                ? <PlaceholderImg idx={4} />
                : <img src={SPOT_IMG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              }
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 10px 8px', background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)', fontFamily: t.fontSans, fontWeight: 600 }}>★ Highest scoring image</span>
              </div>
            </div>

            {/* Stats — 2/3 width */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: t.fontSerif, fontSize: 16, fontWeight: 700, color: t.textPrimary, marginBottom: 2 }}>{name}</div>
              <div style={{ fontSize: 12, color: t.textTertiary, fontFamily: t.fontSans, marginBottom: 12 }}>
                {ss.mode === 'automatic' ? 'Auto-selected · rotates each visit' : 'Featured member'}
              </div>

              {/* 2×2 key stat tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                {keyStats.map(st => (
                  <div key={st.label} style={{ background: t.surface1, borderRadius: 6, padding: '7px 10px' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: t.textTertiary, fontFamily: t.fontSans, marginBottom: 2 }}>{st.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.textPrimary, fontFamily: t.fontSerif }}>{st.value}</div>
                  </div>
                ))}
              </div>

              {/* Label-value detail rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: `1px solid ${t.borderSubtle}`, paddingTop: 10 }}>
                {detailStats.map(st => (
                  <div key={st.label} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: t.textTertiary, fontFamily: t.fontSans, flexShrink: 0, minWidth: 76 }}>{st.label}</span>
                    <span style={{ fontSize: 12, color: t.textSecondary, fontFamily: t.fontSans, lineHeight: 1.5 }}>{st.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </PbSection>
      )
    }

    case 'upcoming-events': {
      const count  = Math.min(block.eventsSettings?.count ?? 5, DUMMY_EVENTS.length)
      return (
        <PbSection t={t}>
          <PbHeading t={t}>Upcoming events</PbHeading>
          {DUMMY_EVENTS.slice(0, count).map((ev, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: i < count - 1 ? `1px solid ${t.borderSubtle}` : 'none' }}>
              <div style={{ minWidth: 44, textAlign: 'center', background: t.surface1, borderRadius: 6, padding: '4px 6px', flexShrink: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.actionPrimary, fontFamily: t.fontSans }}>
                  {ev.date.replace(/\d/g,'').trim().replace(/\s+/,'').slice(0,3)}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.textPrimary, lineHeight: 1.1, fontFamily: t.fontSerif }}>
                  {ev.date.replace(/\D/g,'').trim().slice(0,2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary, fontFamily: t.fontSans }}>{ev.title}</div>
                <div style={{ fontSize: 11, color: t.textTertiary, marginTop: 2, fontFamily: t.fontSans }}>{ev.time}</div>
              </div>
            </div>
          ))}
        </PbSection>
      )
    }

    case 'custom-content': {
      const s = block.customContentSettings!
      const displayLabel = block.label ?? block.name
      const placeholderNotes: ContentNote[] = s.notes.length > 0 ? s.notes : Array.from({ length: s.columns }, (_, i) => ({
        id: `ph${i}`,
        heading: i === 0 ? 'Headline' : i === 1 ? 'Headline' : 'Headline',
        body: i === 0 ? '<p>Body copy goes here. This is placeholder text showing how your content will appear once you add it in the block settings.</p>'
              : i === 1 ? '<p>Second column body copy. Replace this by editing the block and adding your own text and formatting.</p>'
              : '<p>Third column content appears here. Use the rich text editor to add headings, links, and other formatting.</p>',
      }))
      const isEmpty = s.notes.length === 0

      return (
        <PbSection t={t}>
          {isEmpty && (
            <div style={{ fontFamily: t.fontSerif, fontSize: 12, color: t.textTertiary, fontStyle: 'italic', marginBottom: 12 }}>
              {displayLabel} — showing sample content
            </div>
          )}
          {!isEmpty && <PbHeading t={t}>{displayLabel}</PbHeading>}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${s.columns}, 1fr)`, gap: 12 }}>
            {placeholderNotes.map(note => (
              <CustomNotePreview key={note.id} note={note} previewLines={s.previewLines} t={t} />
            ))}
          </div>
        </PbSection>
      )
    }

    case 'affiliations': {
      const s = block.affiliationsSettings!
      const items = s.affiliations.length > 0 ? s.affiliations : [
        { id: 'p1', name: 'PSA',       url: '' },
        { id: 'p2', name: 'NZIPP',     url: '' },
        { id: 'p3', name: 'Instagram', url: '' },
        { id: 'p4', name: 'Facebook',  url: '' },
      ].slice(0, s.maxColumns)

      return (
        <PbSection t={t} noBorder>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {items.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 72 }}>
                <div style={{ width: 48, height: 48, borderRadius: t.radius, background: AFFILIATION_COLORS[i % AFFILIATION_COLORS.length] + '22', border: `1px solid ${AFFILIATION_COLORS[i % AFFILIATION_COLORS.length]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: t.fontSans, fontSize: 10, fontWeight: 700, color: AFFILIATION_COLORS[i % AFFILIATION_COLORS.length], letterSpacing: '0.04em' }}>
                  {a.name.slice(0, 4).toUpperCase()}
                </div>
                <div style={{ fontSize: 10, color: t.textTertiary, fontFamily: t.fontSans, textAlign: 'center' }}>{a.name}</div>
              </div>
            ))}
          </div>
          {s.affiliations.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: t.textTertiary, fontFamily: t.fontSans, fontStyle: 'italic' }}>
              Showing sample entries — add your own in settings
            </div>
          )}
        </PbSection>
      )
    }

    default: return null
  }
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function SunIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0zM7.05 18.36l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0z"/></svg> }
function MoonIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg> }

// ── Issue display ──────────────────────────────────────────────────────────────

function IssueStrip({ issues, compact }: { issues: ValidationIssue[]; compact: boolean }) {
  const warnings = issues.filter(i => i.severity === 'warning')
  const infos    = issues.filter(i => i.severity === 'info')
  const shown    = compact ? warnings : issues          // mini: warnings only; full: all
  if (shown.length === 0) return null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 0.5 : 1, mb: compact ? 1 : 2 }}>
      {!compact && warnings.length > 0 && (
        <Box sx={{ px: 2, py: 1.25, borderRadius: '6px', background: 'var(--status-warning-bg)', border: '1px solid rgba(166,124,0,0.22)' }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'var(--status-warning-text)', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ⚠ {warnings.length} issue{warnings.length > 1 ? 's' : ''} to fix before publishing
          </Typography>
          {warnings.map(w => (
            <Box key={w.blockId} sx={{ mb: 0.5 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'var(--status-warning-text)' }}>{w.label} — {w.message}</Typography>
              <Typography sx={{ fontSize: 11, color: 'var(--status-warning-text)', opacity: 0.85 }}>{w.fix}</Typography>
            </Box>
          ))}
        </Box>
      )}
      {compact && warnings.length > 0 && (
        <Box sx={{ px: 1.5, py: 1, borderRadius: '6px', background: 'var(--status-warning-bg)', border: '1px solid rgba(166,124,0,0.22)', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'var(--status-warning-text)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            ⚠ {warnings.length} issue{warnings.length > 1 ? 's' : ''} need attention
          </Typography>
          {warnings.map(w => (
            <Typography key={w.blockId} sx={{ fontSize: 11, color: 'var(--status-warning-text)', opacity: 0.9 }}>
              · <strong>{w.label}</strong>: {w.message}
            </Typography>
          ))}
        </Box>
      )}
      {!compact && infos.length > 0 && (
        <Box sx={{ px: 2, py: 1.25, borderRadius: '6px', background: 'rgba(30,77,140,0.05)', border: '1px solid rgba(30,77,140,0.15)' }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'var(--action-primary)', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ℹ Image gallery sources
          </Typography>
          {infos.map(i => (
            <Box key={i.blockId} sx={{ mb: 0.5 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'var(--action-primary)' }}>{i.label} — {i.message}</Typography>
              <Typography sx={{ fontSize: 11, color: 'var(--text-secondary)' }}>{i.fix}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

// ── LivePreview ────────────────────────────────────────────────────────────────

function LivePreview({ blocks, fullscreen = false }: { blocks: ContentBlock[]; fullscreen?: boolean }) {
  const [audience,  setAudience]  = useState<AudienceFilter>('visitor')
  const [device,    setDevice]    = useState<DeviceMode>('desktop')
  const [colorMode, setColorMode] = useState<ColorMode>('dark')

  const effectiveMode: ColorMode = audience === 'visitor' ? 'dark' : colorMode
  const t       = effectiveMode === 'dark' ? MEMBER_DARK : MEMBER_LIGHT
  const issues  = getValidationIssues(blocks)
  const compact = !fullscreen

  // Use individual border properties instead of the `border` shorthand so we can
  // suppress the left border on the right segment without mixing shorthand/longhand.
  const segBtn = (active: boolean, noLeft = false): React.CSSProperties => {
    const bc = active ? '#556070' : 'var(--border-default)'
    return {
      fontFamily: 'var(--font-inter, system-ui)', fontSize: 12, fontWeight: 500,
      padding: '4px 12px', cursor: 'pointer',
      borderTop: `1px solid ${bc}`, borderRight: `1px solid ${bc}`,
      borderBottom: `1px solid ${bc}`, borderLeft: noLeft ? 'none' : `1px solid ${bc}`,
      background: active ? '#556070' : 'var(--surface-2)',
      color: active ? '#fff' : 'var(--text-secondary)',
      transition: 'all 0.1s',
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: fullscreen ? 1 : undefined }}>
      {!fullscreen && <IssueStrip issues={issues} compact />}
      <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex' }}>
          {(['visitor','member'] as AudienceFilter[]).map((a, i) => (
            <button key={a} onClick={() => setAudience(a)} style={{ ...segBtn(audience === a, i === 1), borderRadius: i === 0 ? '6px 0 0 6px' : '0 6px 6px 0' }}>
              {a === 'visitor' ? 'Visitor' : 'Member'}
            </button>
          ))}
        </Box>
        {audience === 'member' ? (
          <Tooltip title={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <button onClick={() => setColorMode(m => m === 'dark' ? 'light' : 'dark')} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', border: '1px solid var(--border-default)', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-secondary)', padding: '4px 10px', fontSize: 12, fontWeight: 500, transition: 'border-color 0.1s' }}>
              {colorMode === 'dark' ? <MoonIcon /> : <SunIcon />}
              {colorMode === 'dark' ? 'Dark' : 'Light'}
            </button>
          </Tooltip>
        ) : (
          <Tooltip title="Visitor view is always dark mode">
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, border: '1px solid var(--border-subtle)', borderRadius: 6, background: 'var(--surface-1)', color: 'var(--text-tertiary)', padding: '4px 10px', fontSize: 12, fontWeight: 500, opacity: 0.7, cursor: 'default' }}>
              <MoonIcon /> Dark
            </span>
          </Tooltip>
        )}
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Desktop"><IconButton size="small" onClick={() => setDevice('desktop')} sx={{ color: device === 'desktop' ? 'var(--action-primary)' : 'text.secondary' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 2H3a2 2 0 00-2 2v12a2 2 0 002 2h7v2H8v2h8v-2h-2v-2h7a2 2 0 002-2V4a2 2 0 00-2-2zm0 14H3V4h18v12z"/></svg>
          </IconButton></Tooltip>
          <Tooltip title="Mobile"><IconButton size="small" onClick={() => setDevice('mobile')} sx={{ color: device === 'mobile' ? 'var(--action-primary)' : 'text.secondary' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>
          </IconButton></Tooltip>
        </Box>
      </Box>
      {fullscreen && <IssueStrip issues={issues} compact={false} />}
      {compact ? (
        /* Compact: no fixed height — blocks render inline and page scrolls */
        <Box sx={{ border: '1px solid var(--border-default)', borderRadius: '8px', overflow: 'hidden', background: t.surface2, display: 'flex', justifyContent: device === 'mobile' ? 'center' : undefined }}>
          <Box sx={{ width: device === 'mobile' ? 375 : '100%', background: t.surface2 }}>
            {blocks.map(b => <PreviewBlock key={b.id} block={b} audience={audience} t={t} compact={compact} />)}
          </Box>
        </Box>
      ) : (
        /* Fullscreen: full-height browser chrome with internal scroll */
        <Box sx={{ border: '1px solid var(--border-default)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Box sx={{ px: 1.5, py: 0.875, flexShrink: 0, background: effectiveMode === 'dark' ? '#1C1C1E' : '#E8E8ED', borderBottom: `1px solid ${effectiveMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)'}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', gap: '5px' }}>
              {['#FF5F57','#FFBD2E','#28CA41'].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'block' }} />)}
            </Box>
            <Box sx={{ flex: 1, borderRadius: '5px', px: 1.5, py: '3px', fontSize: 11, textAlign: 'center', fontFamily: 'var(--font-inter, system-ui)', background: effectiveMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', color: effectiveMode === 'dark' ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.40)' }}>
              focalpoint.club
            </Box>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', background: t.surface0, display: 'flex', justifyContent: device === 'mobile' ? 'center' : undefined }}>
            <Box sx={{ width: device === 'mobile' ? 375 : '100%', minHeight: '100%', background: t.surface2 }}>
              {blocks.map(b => <PreviewBlock key={b.id} block={b} audience={audience} t={t} compact={compact} />)}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  )
}

// ── Main HomepageEditor ────────────────────────────────────────────────────────

export default function HomepageEditor() {
  const {
    blocks, hasChanges, showPublish, setShowPublish,
    toggleBlock, updateBlock, reorderBlocks,
    addCustomContent, removeBlock, customContentCount,
    saveDraft, publish,
  } = useHomepageEditor()

  const [fullscreen,     setFullscreen]     = useState(false)
  const [editingBlock,   setEditingBlock]   = useState<ContentBlock | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const dragIdx  = useRef<number | null>(null)
  const [insertAt, setInsertAt] = useState<number | null>(null)

  const requestDelete = (id: string) => setConfirmDeleteId(id)
  const confirmDelete = () => {
    if (confirmDeleteId) {
      if (editingBlock?.id === confirmDeleteId) setEditingBlock(null)
      removeBlock(confirmDeleteId)
    }
    setConfirmDeleteId(null)
  }

  const handleDragStart = (i: number) => { dragIdx.current = i }
  const handleDragOver  = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    const from = dragIdx.current
    if (from === null || from === i) { setInsertAt(null); return }
    setInsertAt(Math.max(1, from < i ? i + 1 : i))
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const from = dragIdx.current
    if (from !== null && insertAt !== null) {
      const to = insertAt > from ? insertAt - 1 : insertAt
      if (to !== from && to >= 1) reorderBlocks(from, to)
    }
    dragIdx.current = null; setInsertAt(null)
  }
  const handleDragEnd = () => { dragIdx.current = null; setInsertAt(null) }

  // Keep editingBlock in sync with blocks state
  const syncedEditBlock = editingBlock ? blocks.find(b => b.id === editingBlock.id) ?? null : null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" size="small" onClick={() => setFullscreen(true)} sx={{ textTransform: 'none', fontSize: 13, borderColor: 'var(--border-default)', color: 'text.secondary', '&:hover': { borderColor: 'var(--border-strong)' }, mr: '10px' }}>Preview</Button>
        <Button variant="outlined" color="secondary" size="small" onClick={saveDraft} sx={{ textTransform: 'none', fontSize: 13 }}>Save draft</Button>
        <Button variant="contained" size="small" disabled={!hasChanges} onClick={() => setShowPublish(true)} sx={{ textTransform: 'none', fontSize: 13, ml: 1.5 }}>Publish changes</Button>
      </Box>

      {/* Two-column layout */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 670px', gap: 3, alignItems: 'start' }}>

        {/* Editor rail */}
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary', mb: 1.5 }}>
            Content blocks
          </Typography>

          <Box onDrop={handleDrop} onDragOver={e => e.preventDefault()} sx={{ display: 'flex', flexDirection: 'column' }}>
            {blocks.map((block, i) => (
              <Fragment key={block.id}>
                {insertAt === i && dragIdx.current !== null && i >= 1 && <InsertionLine />}
                <Box sx={{ mb: 1 }}>
                  <BlockCard
                    block={block}
                    onToggle={() => toggleBlock(block.id)}
                    onEdit={() => setEditingBlock(block)}
                    onRemove={block.type === 'custom-content' ? () => requestDelete(block.id) : undefined}
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={e => handleDragOver(e, i)}
                  />
                </Box>
              </Fragment>
            ))}
            {insertAt === blocks.length && dragIdx.current !== null && <InsertionLine />}
          </Box>

          {/* Drop zone at bottom */}
          <Box onDragOver={e => { e.preventDefault(); if (dragIdx.current !== null) setInsertAt(blocks.length) }} onDrop={handleDrop} sx={{ height: 24 }} />

          {/* Add custom content button */}
          {customContentCount < MAX_CUSTOM_CONTENT && (
            <Button startIcon={<AddIcon />} size="small" variant="outlined" color="secondary"
              onClick={addCustomContent}
              sx={{ textTransform: 'none', fontSize: 13, mt: 1, width: '100%' }}>
              Add custom content block
              <Typography component="span" sx={{ fontSize: 11, color: 'text.tertiary', ml: 1 }}>
                ({customContentCount}/{MAX_CUSTOM_CONTENT})
              </Typography>
            </Button>
          )}
          {customContentCount >= MAX_CUSTOM_CONTENT && (
            <Typography sx={{ fontSize: 12, color: 'text.tertiary', textAlign: 'center', mt: 1, fontStyle: 'italic' }}>
              Maximum of {MAX_CUSTOM_CONTENT} custom content blocks reached.
            </Typography>
          )}
        </Box>

        {/* Live preview — capped at 670px so it doesn't stretch on wider screens */}
        <Box sx={{ position: 'sticky', top: 24, maxWidth: 670, width: '100%' }}>
          <LivePreview blocks={blocks} />
        </Box>
      </Box>

      {/* Block edit modal */}
      <BlockEditModal
        block={syncedEditBlock}
        onClose={() => setEditingBlock(null)}
        onUpdate={u => { if (editingBlock) updateBlock(editingBlock.id, u) }}
        onRemove={syncedEditBlock?.type === 'custom-content' ? () => requestDelete(syncedEditBlock.id) : undefined}
      />

      {/* Publish dialog */}
      {(() => {
        const pubIssues  = getValidationIssues(blocks)
        const pubWarnings = pubIssues.filter(i => i.severity === 'warning')
        const hasGalleryBlocks = blocks.some(b => b.enabled && ['large-image', 'grid-6', 'strip-8'].includes(b.type))
        return (
          <Dialog open={showPublish} onClose={() => setShowPublish(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>Publish homepage?</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
                <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.6 }}>
                  Your current layout and configured content will become visible on the public-facing portal immediately.
                </Typography>

                {pubWarnings.length > 0 && (
                  <Box sx={{ p: 2, borderRadius: '6px', background: 'var(--status-warning-bg)', border: '1px solid rgba(166,124,0,0.22)' }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'var(--status-warning-text)', mb: 1 }}>
                      ⚠ {pubWarnings.length} block{pubWarnings.length > 1 ? 's have' : ' has'} no content configured
                    </Typography>
                    {pubWarnings.map(w => (
                      <Typography key={w.blockId} sx={{ fontSize: 12, color: 'var(--status-warning-text)', mb: 0.5, lineHeight: 1.5 }}>
                        · <strong>{w.label}</strong> — will display with sample placeholder content until you update it and republish.
                      </Typography>
                    ))}
                  </Box>
                )}

                {hasGalleryBlocks && (
                  <Box sx={{ p: 2, borderRadius: '6px', background: 'rgba(30,77,140,0.05)', border: '1px solid rgba(30,77,140,0.15)' }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'var(--action-primary)', mb: 0.5 }}>
                      ℹ Gallery blocks
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.55 }}>
                      If a selected gallery doesn't currently have any images, that block won't appear on the homepage until at least one image has been added to it.
                    </Typography>
                  </Box>
                )}

                {pubWarnings.length === 0 && (
                  <Box sx={{ px: 2, py: 1.25, borderRadius: '6px', background: 'var(--status-success-bg)', border: '1px solid rgba(46,125,50,0.20)' }}>
                    <Typography sx={{ fontSize: 13, color: 'var(--status-success-text)', fontWeight: 500 }}>
                      ✓ All blocks are configured and ready to publish.
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button variant="outlined" color="secondary" onClick={() => setShowPublish(false)} sx={{ textTransform: 'none', fontSize: 13 }}>Cancel</Button>
              <Button variant="contained" onClick={publish} sx={{ textTransform: 'none', fontSize: 13 }}>Publish now</Button>
            </DialogActions>
          </Dialog>
        )
      })()}

      {/* Delete custom content confirmation */}
      {(() => {
        const target = confirmDeleteId ? blocks.find(b => b.id === confirmDeleteId) : null
        const label  = target?.label ?? target?.name ?? 'this block'
        const hasContent = (target?.customContentSettings?.notes.length ?? 0) > 0
        return (
          <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>Remove "{label}"?</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.6 }}>
                  This block will be removed from the homepage layout.
                </Typography>
                {hasContent && (
                  <Box sx={{ px: 2, py: 1.5, borderRadius: '6px', background: 'var(--status-warning-bg)', border: '1px solid rgba(166,124,0,0.22)' }}>
                    <Typography sx={{ fontSize: 13, color: 'var(--status-warning-text)', lineHeight: 1.55 }}>
                      ⚠ Any content you have written in this block will be permanently deleted and cannot be recovered.
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button variant="outlined" color="secondary" onClick={() => setConfirmDeleteId(null)} sx={{ textTransform: 'none', fontSize: 13 }}>Cancel</Button>
              <Button variant="contained" color="error" onClick={confirmDelete} sx={{ textTransform: 'none', fontSize: 13 }}>Remove block</Button>
            </DialogActions>
          </Dialog>
        )
      })()}

      {/* Full-screen preview */}
      <Dialog open={fullscreen} onClose={() => setFullscreen(false)} fullScreen>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 3, background: 'var(--surface-0)' }}>
          <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="outlined" color="secondary" size="small" onClick={() => setFullscreen(false)} sx={{ textTransform: 'none', fontSize: 13 }}>Close preview</Button>
            </Box>
            <LivePreview blocks={blocks} fullscreen />
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}

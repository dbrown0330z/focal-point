'use client'

import { Fragment, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
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
import RichTextEditor       from '@/components/admin/RichTextEditor'
import { saveHomepageBlocks, type SaveDebug } from './homepageActions'
import {
  DEFAULT_BLOCKS,
  type ContentBlock,
  type GallerySource,
  type WelcomeContent,
  type LargeImageSettings,
  type Grid6Settings,
  type Strip8Settings,
  type GalleryPreviewSettings,
  type ClubGalleriesSettings,
  type SpotlightSettings,
  type EventsSettings,
  type ContentNote,
  type CustomContentSettings,
  type Affiliation,
  type AffiliationType,
  type AffiliationsSettings,
  type DualPanelSettings,
  type CompetitionsSettings,
} from '@/lib/homepage/types'
import type { AdminGalleryData, ClubMember } from '@/app/[clubSlug]/(admin)/admin/content/galleries/ClubGalleriesTab'

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_CUSTOM_CONTENT = 4

// ── Modal metadata ─────────────────────────────────────────────────────────────

const MODAL_META: Record<string, { title: string; description: string }> = {
  'welcome': {
    title:       'Welcome',
    description: 'First thing every visitor sees — headline, intro, and a join or sign-in prompt',
  },
  'large-image': {
    title:       'Hero slideshow',
    description: 'Full-width rotating images that set the visual tone of the homepage',
  },
  'dual-panel': {
    title:       'Events & competitions (2 columns)',
    description: 'Upcoming events and open competitions, side by side',
  },
  'custom-content': {
    title:       'Custom content',
    description: 'A flexible block for announcements, links, or anything else',
  },
  'gallery-preview': {
    title:       'Gallery preview',
    description: 'Images from a single club gallery — links to the full gallery',
  },
  'club-galleries': {
    title:       'Gallery showcase',
    description: 'Clickable thumbnails linking to multiple club galleries',
  },
  'member-spotlight': {
    title:       'Member spotlight',
    description: 'Highlights a member — rotates on each visit',
  },
  'affiliations': {
    title:       'Affiliations & links',
    description: 'External links to partner organizations and social media',
  },
  'upcoming-events': {
    title:       'Events (full width)',
    description: 'Full-width list of upcoming club events',
  },
  'competitions': {
    title:       'Competitions (full width)',
    description: 'Full-width view of open competitions and recent results',
  },
}

// ── Hook ───────────────────────────────────────────────────────────────────────

const REMOVED_BLOCK_TYPES = ['grid-6', 'strip-8']

function useHomepageEditor(initialBlocks: ContentBlock[], clubSlug: string, router: ReturnType<typeof useRouter>) {
  const [blocks,      setBlocks]      = useState<ContentBlock[]>(() => {
    const filtered = initialBlocks.filter(b => !REMOVED_BLOCK_TYPES.includes(b.type))
    // Ensure enabled blocks always precede disabled blocks (sort by enabled desc, fixed first)
    const fixed    = filtered.filter(b => b.fixed)
    const enabled  = filtered.filter(b => !b.fixed && b.enabled)
    const disabled = filtered.filter(b => !b.fixed && !b.enabled)
    return [...fixed, ...enabled, ...disabled]
  })
  const [hasChanges,  setHasChanges]  = useState(false)
  const [showPublish, setShowPublish] = useState(false)
  const [saveStatus,  setSaveStatus]  = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [debugInfo,   setDebugInfo]   = useState<SaveDebug | null>(null)
  const [isPending,   startTransition] = useTransition()

  const toggleBlock = (id: string) => {
    setBlocks(bs => {
      const block = bs.find(b => b.id === id)
      if (!block) return bs
      const newEnabled = !block.enabled
      const others     = bs.filter(b => b.id !== id)
      const toggled    = { ...block, enabled: newEnabled }
      if (!newEnabled) {
        return [...others, toggled]
      }
      const firstDisabledIdx = others.findIndex(b => !b.enabled && !b.fixed)
      return firstDisabledIdx === -1 ? [...others, toggled] : [...others.slice(0, firstDisabledIdx), toggled, ...others.slice(firstDisabledIdx)]
    })
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

  const addCustomContent = (): ContentBlock | null => {
    const existing = blocks.filter(b => b.type === 'custom-content')
    if (existing.length >= MAX_CUSTOM_CONTENT) return null
    const num = existing.length + 1
    const newBlock: ContentBlock = {
      id:    `custom-content-${Date.now()}`,
      name:  'Custom content',
      label: num === 1 ? undefined : `Custom content ${num}`,
      type:  'custom-content',
      enabled: true,
      customContentSettings: { columns: 1, previewLines: 4, notes: [] },
    }
    setBlocks(bs => {
      const firstDisabledIdx = bs.findIndex(b => !b.enabled && !b.fixed)
      return firstDisabledIdx === -1 ? [...bs, newBlock] : [...bs.slice(0, firstDisabledIdx), newBlock, ...bs.slice(firstDisabledIdx)]
    })
    setHasChanges(true)
    return newBlock
  }

  const removeBlock = (id: string) => {
    setBlocks(bs => bs.filter(b => b.id !== id))
    setHasChanges(true)
  }

  const publish = (currentBlocks: ContentBlock[]) => {
    setShowPublish(false)
    setSaveStatus('saving')
    startTransition(async () => {
      const { error, debug } = await saveHomepageBlocks(currentBlocks, true, clubSlug)
      setSaveStatus(error ? 'error' : 'saved')
      if (debug) setDebugInfo(debug)
      if (!error) {
        setHasChanges(false)
        router.refresh()
      }
      setTimeout(() => setSaveStatus('idle'), 3000)
    })
  }

  const customContentCount = blocks.filter(b => b.type === 'custom-content').length

  return {
    blocks, hasChanges, showPublish, setShowPublish,
    saveStatus, debugInfo, isPending,
    toggleBlock, updateBlock, reorderBlocks,
    addCustomContent, removeBlock, customContentCount,
    publish,
  }
}

// ── Shared editor primitives ───────────────────────────────────────────────────

function DragGrip({ disabled }: { disabled?: boolean }) {
  return (
    <span style={{
      color: 'var(--text-tertiary)', opacity: disabled ? 0.25 : 0.55,
      cursor: disabled ? 'default' : 'grab', flexShrink: 0,
      display: 'flex', alignItems: 'center',
    }}>
      <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5.5" cy="3.5"   r="1.4" /><circle cx="10.5" cy="3.5"  r="1.4" />
        <circle cx="5.5" cy="8"     r="1.4" /><circle cx="10.5" cy="8"    r="1.4" />
        <circle cx="5.5" cy="12.5"  r="1.4" /><circle cx="10.5" cy="12.5" r="1.4" />
      </svg>
    </span>
  )
}

function IconTrash() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
    </svg>
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

function LargeImageGallerySelect({
  value,
  onChange,
  galleries,
}: {
  value:     string
  onChange:  (v: string) => void
  galleries: AdminGalleryData[]
}) {
  const clubGalleries = galleries.filter(g => g.visibility !== 'draft')
  return (
    <FormControl size="small" fullWidth>
      <InputLabel sx={{ fontSize: 13 }}>Gallery source</InputLabel>
      <Select value={value} label="Gallery source" onChange={e => onChange(e.target.value)} sx={{ fontSize: 13 }}>
        <MenuItem disabled sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary', opacity: '1 !important', py: 0.5 }}>
          Abstract sources
        </MenuItem>
        {GALLERY_OPTIONS.map(o => (
          <MenuItem key={o.value} value={o.value} sx={{ fontSize: 13, pl: 2.5 }}>{o.label}</MenuItem>
        ))}
        {clubGalleries.length > 0 && [
          <MenuItem key="__sep" disabled sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary', opacity: '1 !important', py: 0.5, mt: 0.5 }}>
            Club galleries
          </MenuItem>,
          ...clubGalleries.map(g => (
            <MenuItem key={g.id} value={`club:${g.id}`} sx={{ fontSize: 13, pl: 2.5 }}>
              {g.name}
              <Typography component="span" sx={{ fontSize: 11, color: 'text.tertiary', ml: 1 }}>
                ({g.imageCount} photos)
              </Typography>
            </MenuItem>
          )),
        ]}
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

function LargeImageModalBody({ block, onChange, galleries }: { block: ContentBlock; onChange: (u: Partial<ContentBlock>) => void; galleries: AdminGalleryData[] }) {
  const s = block.largeImageSettings!
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <LargeImageGallerySelect
        value={s.gallerySource}
        onChange={v => onChange({ largeImageSettings: { ...s, gallerySource: v } })}
        galleries={galleries}
      />
      <FieldRow label="Slide interval (seconds)">
        <TextField size="small" type="number" value={s.intervalSeconds}
          onChange={e => onChange({ largeImageSettings: { ...s, intervalSeconds: Number(e.target.value) } })}
          sx={{ ...inputSx, width: 110 }} slotProps={{ input: { min: 2, max: 30 } as any }} />
      </FieldRow>
    </Box>
  )
}

function GalleryPreviewModalBody({ block, onChange, galleries }: { block: ContentBlock; onChange: (u: Partial<ContentBlock>) => void; galleries: AdminGalleryData[] }) {
  const s = block.galleryPreviewSettings ?? { galleryId: '', gallerySlug: '', galleryName: '' }
  const publicGalleries = galleries.filter(g => g.visibility !== 'draft')
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <FieldRow label="Gallery">
        <FormControl size="small" fullWidth>
          <InputLabel sx={{ fontSize: 13 }}>Select a gallery</InputLabel>
          <Select
            value={s.galleryId}
            label="Select a gallery"
            onChange={e => {
              const selected = galleries.find(g => g.id === e.target.value)
              onChange({ galleryPreviewSettings: {
                galleryId:   selected?.id   ?? '',
                gallerySlug: selected?.slug ?? '',
                galleryName: selected?.name ?? '',
              }})
            }}
            sx={{ fontSize: 13 }}
          >
            {publicGalleries.length === 0 && (
              <MenuItem disabled sx={{ fontSize: 13 }}>No published galleries yet</MenuItem>
            )}
            {publicGalleries.map(g => (
              <MenuItem key={g.id} value={g.id} sx={{ fontSize: 13 }}>
                {g.name}
                <Typography component="span" sx={{ fontSize: 11, color: 'text.tertiary', ml: 1 }}>
                  ({g.imageCount} photos)
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FieldRow>
      {s.galleryId && (
        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>
          Shows name, photo count, first 4 images, and a link to the full gallery.
        </Typography>
      )}
    </Box>
  )
}

function ClubGalleriesModalBody({ block, onChange, galleries }: { block: ContentBlock; onChange: (u: Partial<ContentBlock>) => void; galleries: AdminGalleryData[] }) {
  const s = block.clubGalleriesSettings ?? { galleryIds: [] }
  const publicGalleries = galleries.filter(g => g.visibility !== 'draft')
  const MAX = 3

  const toggle = (id: string) => {
    const current = s.galleryIds
    const next = current.includes(id)
      ? current.filter(x => x !== id)
      : current.length < MAX ? [...current, id] : current
    onChange({ clubGalleriesSettings: { galleryIds: next } })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        Select up to {MAX} galleries to feature. They appear as thumbnail cards identical to the Our Club &gt; Galleries page.
      </Typography>
      {publicGalleries.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontStyle: 'italic' }}>No published galleries yet.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {publicGalleries.map(g => {
            const checked = s.galleryIds.includes(g.id)
            const disabled = !checked && s.galleryIds.length >= MAX
            return (
              <Box
                key={g.id}
                onClick={() => !disabled && toggle(g.id)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 1.5, py: 1, borderRadius: '6px',
                  border: `1px solid ${checked ? 'var(--action-primary)' : 'var(--border-default)'}`,
                  background: checked ? 'rgba(30,77,140,0.05)' : 'var(--surface-2)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.45 : 1,
                  transition: 'all 0.1s',
                }}
              >
                <Box sx={{
                  width: 16, height: 16, borderRadius: '3px', flexShrink: 0,
                  border: `2px solid ${checked ? 'var(--action-primary)' : 'var(--border-default)'}`,
                  background: checked ? 'var(--action-primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', lineHeight: 1.3 }}>{g.name}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{g.imageCount} photos</Typography>
                </Box>
              </Box>
            )
          })}
        </Box>
      )}
      <Typography sx={{ fontSize: 11, color: 'text.tertiary' }}>
        {s.galleryIds.length}/{MAX} selected
      </Typography>
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

function SpotlightModalBody({ block, onChange, members }: {
  block:    ContentBlock
  onChange: (u: Partial<ContentBlock>) => void
  members:  ClubMember[]
}) {
  const s = block.spotlightSettings!
  const sorted = [...members].sort((a, b) => a.displayName.localeCompare(b.displayName))
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
        <FieldRow label="Member">
          {sorted.length > 0 ? (
            <FormControl size="small" fullWidth>
              <Select
                value={s.memberName ?? ''}
                onChange={e => onChange({ spotlightSettings: { ...s, memberName: e.target.value } })}
                displayEmpty
                sx={{ fontFamily: 'inherit', fontSize: 14 }}
              >
                <MenuItem value="" disabled sx={{ fontSize: 13, fontStyle: 'italic', color: 'text.disabled' }}>
                  Select a member…
                </MenuItem>
                {sorted.map(m => (
                  <MenuItem key={m.id} value={m.displayName} sx={{ fontSize: 14, fontFamily: 'inherit' }}>
                    {m.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField size="small" fullWidth value={s.memberName ?? ''}
              onChange={e => onChange({ spotlightSettings: { ...s, memberName: e.target.value } })}
              placeholder="No members found — enter a name manually" sx={inputSx} />
          )}
        </FieldRow>
      )}
    </Box>
  )
}

function DualPanelModalBody({ block, onChange }: { block: ContentBlock; onChange: (u: Partial<ContentBlock>) => void }) {
  const s = block.dualPanelSettings ?? { eventCount: 4 as const }
  return (
    <FieldRow label="Number of events to show">
      <Box sx={{ display: 'flex', gap: 0.75 }}>
        {([3, 4, 5, 6] as const).map(n => (
          <button key={n} onClick={() => onChange({ dualPanelSettings: { eventCount: n } })} style={{
            width: 32, height: 30, cursor: 'pointer', borderRadius: 4,
            border: `1px solid ${s.eventCount === n ? 'var(--action-primary)' : 'var(--border-default)'}`,
            background: s.eventCount === n ? 'rgba(30,77,140,0.07)' : 'var(--surface-2)',
            color: s.eventCount === n ? 'var(--action-primary)' : 'var(--text-secondary)',
            fontSize: 13, fontWeight: 600, transition: 'all 0.1s',
          }}>{n}</button>
        ))}
      </Box>
    </FieldRow>
  )
}

function EventsModalBody({ block, onChange }: { block: ContentBlock; onChange: (u: Partial<ContentBlock>) => void }) {
  const s = block.eventsSettings!
  return (
    <FieldRow label="Number of events to show">
      <TextField size="small" type="number" value={s.count}
        onChange={e => onChange({ eventsSettings: { count: Number(e.target.value) } })}
        sx={{ ...inputSx, width: 100 }} slotProps={{ input: { min: 1, max: 20 } as any }} />
    </FieldRow>
  )
}

function CustomContentModalBody({ block, onChange }: { block: ContentBlock; onChange: (u: Partial<ContentBlock>) => void }) {
  const s = block.customContentSettings!
  const MAX_ARTICLES = 4

  const updateNote = (id: string, k: keyof ContentNote, v: string) =>
    onChange({ customContentSettings: { ...s, notes: s.notes.map(n => n.id === id ? { ...n, [k]: v } : n) } })

  const addNote = () => {
    if (s.notes.length >= MAX_ARTICLES) return
    onChange({ customContentSettings: { ...s, notes: [...s.notes, { id: crypto.randomUUID(), heading: '', body: '' }] } })
  }

  const removeNote = (id: string) =>
    onChange({ customContentSettings: { ...s, notes: s.notes.filter(n => n.id !== id) } })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Section heading */}
      <Box>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', mb: 0.75 }}>
          Section heading <Typography component="span" sx={{ fontSize: 12, fontWeight: 400, color: 'text.disabled' }}>(shown above articles on the homepage)</Typography>
        </Typography>
        <TextField size="small" fullWidth value={block.label ?? block.name}
          onChange={e => onChange({ label: e.target.value })} sx={inputSx}
          placeholder="e.g. News & Notes, Club Updates, Latest from the committee" />
      </Box>

      <Divider />

      {/* Preview lines */}
      <FieldRow label="Preview lines before 'Read more'">
        <TextField size="small" type="number" value={s.previewLines}
          onChange={e => onChange({ customContentSettings: { ...s, previewLines: Number(e.target.value) } })}
          sx={{ ...inputSx, width: 80 }} slotProps={{ input: { min: 1, max: 20 } as any }} />
      </FieldRow>

      <Divider />

      {/* Articles */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
              Articles
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25 }}>
              {s.notes.length} of {MAX_ARTICLES} — displayed in a responsive grid
            </Typography>
          </Box>
          {s.notes.length < MAX_ARTICLES && (
            <Button startIcon={<AddIcon />} size="small" variant="outlined" color="secondary"
              onClick={addNote} sx={{ textTransform: 'none', fontSize: 12 }}>
              Add article
            </Button>
          )}
        </Box>

        {s.notes.length === 0 && (
          <Box sx={{ py: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: '8px' }}>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1.5 }}>
              No articles yet. Add up to {MAX_ARTICLES}.
            </Typography>
            <Button startIcon={<AddIcon />} size="small" variant="outlined" color="secondary"
              onClick={addNote} sx={{ textTransform: 'none', fontSize: 13 }}>
              Add first article
            </Button>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {s.notes.map((note, i) => (
            <Box key={note.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' }}>
                  Article {i + 1}
                </Typography>
                <IconButton size="small" onClick={() => removeNote(note.id)} sx={{ color: 'text.secondary' }}>
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              <TextField size="small" fullWidth value={note.heading}
                onChange={e => updateNote(note.id, 'heading', e.target.value)}
                placeholder="Article heading (optional)" sx={{ ...inputSx, mb: 1.5 }} />
              <RichTextEditor
                key={note.id}
                initialContent={note.body}
                onChange={html => updateNote(note.id, 'body', html)}
                minHeight={320}
                placeholder="Write your article content here…"
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

const AFFILIATION_TYPE_LABELS: Record<string, string> = {
  PSA: 'PSA', facebook: 'Facebook', instagram: 'Instagram',
  youtube: 'YouTube', flickr: 'Flickr', '500px': '500px',
  twitter: 'X / Twitter', vimeo: 'Vimeo', other: 'Other',
}

function AffiliationsModalBody({ block, onChange }: { block: ContentBlock; onChange: (u: Partial<ContentBlock>) => void }) {
  const s = block.affiliationsSettings!

  const addItem = () =>
    onChange({ affiliationsSettings: { ...s, affiliations: [...s.affiliations, { id: crypto.randomUUID(), type: 'other' as AffiliationType, name: '', url: '' }] } })

  const setItem = (id: string, updates: Partial<Affiliation>) =>
    onChange({ affiliationsSettings: { ...s, affiliations: s.affiliations.map(a => a.id === id ? { ...a, ...updates } : a) } })

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
          {s.affiliations.map((a, i) => {
            const aff = a as Affiliation & { type?: AffiliationType }
            const currentType: AffiliationType = aff.type ?? 'other'
            return (
              <Box key={a.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Typography sx={{ fontSize: 11, color: 'text.tertiary', minWidth: 18, textAlign: 'right', mt: 1 }}>{i + 1}</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, flex: '0 0 160px' }}>
                  <Select
                    size="small"
                    value={currentType}
                    onChange={e => {
                      const t = e.target.value as AffiliationType
                      const autoName = t !== 'other' ? (AFFILIATION_TYPE_LABELS[t] ?? '') : ''
                      setItem(a.id, { type: t, name: t !== 'other' ? autoName : '' })
                    }}
                    sx={{ ...inputSx, fontSize: 13 }}
                  >
                    <MenuItem value="PSA" sx={{ fontSize: 13 }}>PSA</MenuItem>
                    <Divider />
                    <MenuItem value="facebook"  sx={{ fontSize: 13 }}>Facebook</MenuItem>
                    <MenuItem value="instagram" sx={{ fontSize: 13 }}>Instagram</MenuItem>
                    <MenuItem value="youtube"   sx={{ fontSize: 13 }}>YouTube</MenuItem>
                    <MenuItem value="flickr"    sx={{ fontSize: 13 }}>Flickr</MenuItem>
                    <MenuItem value="500px"     sx={{ fontSize: 13 }}>500px</MenuItem>
                    <MenuItem value="twitter"   sx={{ fontSize: 13 }}>X / Twitter</MenuItem>
                    <MenuItem value="vimeo"     sx={{ fontSize: 13 }}>Vimeo</MenuItem>
                    <Divider />
                    <MenuItem value="other"     sx={{ fontSize: 13, fontStyle: 'italic' }}>Other…</MenuItem>
                  </Select>
                  {currentType === 'other' && (
                    <TextField size="small" value={a.name} onChange={e => setItem(a.id, { name: e.target.value })}
                      placeholder="Display name" sx={{ ...inputSx }} />
                  )}
                </Box>
                <TextField size="small" value={a.url} onChange={e => setItem(a.id, { url: e.target.value })}
                  placeholder="https://…" sx={{ ...inputSx, flex: 1, mt: currentType === 'other' ? 0 : 0 }} />
                <IconButton size="small" onClick={() => removeItem(a.id)} sx={{ color: 'text.secondary', flexShrink: 0, mt: 0.25 }}>
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            )
          })}
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

function CompetitionsModalBody({ block, onChange }: { block: ContentBlock; onChange: (u: Partial<ContentBlock>) => void }) {
  const s = block.competitionsSettings!
  const set = <K extends keyof CompetitionsSettings>(k: K, v: CompetitionsSettings[K]) =>
    onChange({ competitionsSettings: { ...s, [k]: v } })

  const ToggleRow = ({ label, hint, field }: { label: string; hint?: string; field: keyof CompetitionsSettings }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary' }}>{label}</Typography>
        {hint && <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>{hint}</Typography>}
      </Box>
      <Switch
        size="small"
        checked={!!s[field]}
        onChange={e => set(field, e.target.checked as CompetitionsSettings[typeof field])}
        sx={{ flexShrink: 0 }}
      />
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <FieldRow label="Heading">
        <TextField size="small" fullWidth value={s.heading}
          onChange={e => set('heading', e.target.value)}
          placeholder="Competitions" sx={inputSx} />
      </FieldRow>

      <Divider />

      <ToggleRow label="Show score distribution chart" field="showScoreChart" />
      <ToggleRow label="Show top images per category" field="showTopImages" />

      {s.showTopImages && (
        <FieldRow label="Categories shown (top images)">
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {([2, 3, 4] as (2 | 3 | 4)[]).map(n => (
              <button key={n} onClick={() => set('topImageCount', n)} style={{
                width: 36, height: 30, cursor: 'pointer', borderRadius: 4,
                border: `1px solid ${s.topImageCount === n ? 'var(--action-primary)' : 'var(--border-default)'}`,
                background: s.topImageCount === n ? 'rgba(30,77,140,0.07)' : 'var(--surface-2)',
                color: s.topImageCount === n ? 'var(--action-primary)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600, transition: 'all 0.1s',
              }}>{n}</button>
            ))}
          </Box>
        </FieldRow>
      )}

      <ToggleRow
        label="Show member's own result"
        hint="Shows the logged-in member their personal result from the most recent competition"
        field="showMemberResult"
      />

      <Divider />

      <ToggleRow label='Show "Coming soon" competitions' field="showComingSoon" />

      <FieldRow label="Maximum open competitions shown">
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          {([1, 2, 3] as (1 | 2 | 3)[]).map(n => (
            <button key={n} onClick={() => set('maxOpenShown', n)} style={{
              width: 36, height: 30, cursor: 'pointer', borderRadius: 4,
              border: `1px solid ${s.maxOpenShown === n ? 'var(--action-primary)' : 'var(--border-default)'}`,
              background: s.maxOpenShown === n ? 'rgba(30,77,140,0.07)' : 'var(--surface-2)',
              color: s.maxOpenShown === n ? 'var(--action-primary)' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 600, transition: 'all 0.1s',
            }}>{n}</button>
          ))}
        </Box>
      </FieldRow>
    </Box>
  )
}

// ── Block edit modal ───────────────────────────────────────────────────────────

function BlockEditModal({
  block, onClose, onCancel, onUpdate, onRemove, galleries, members,
}: {
  block:     ContentBlock | null
  onClose:   () => void
  onCancel:  () => void
  onUpdate:  (u: Partial<ContentBlock>) => void
  onRemove?: () => void
  galleries: AdminGalleryData[]
  members:   ClubMember[]
}) {
  if (!block) return null
  const meta = MODAL_META[block.type] ?? { title: block.label ?? block.name, description: '' }
  const isCustom = block.type === 'custom-content'
  const displayLabel = block.label ?? block.name

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth={isCustom ? 'lg' : 'sm'}
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ pb: 0.5 }}>
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{meta.title}</Typography>
          {isCustom && block.label && (
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>"{displayLabel}"</Typography>
          )}
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2.5, lineHeight: 1.55 }}>
          {meta.description}
        </Typography>

        {block.type === 'welcome'           && <WelcomeModalBody          block={block} onChange={onUpdate} />}
        {block.type === 'large-image'      && <LargeImageModalBody       block={block} onChange={onUpdate} galleries={galleries} />}
        {block.type === 'gallery-preview'  && <GalleryPreviewModalBody   block={block} onChange={onUpdate} galleries={galleries} />}
        {block.type === 'club-galleries'   && <ClubGalleriesModalBody    block={block} onChange={onUpdate} galleries={galleries} />}
        {block.type === 'grid-6'           && <Grid6ModalBody            block={block} onChange={onUpdate} />}
        {block.type === 'strip-8'          && <Strip8ModalBody           block={block} onChange={onUpdate} />}
        {block.type === 'member-spotlight' && <SpotlightModalBody        block={block} onChange={onUpdate} members={members} />}
        {block.type === 'dual-panel'       && <DualPanelModalBody        block={block} onChange={onUpdate} />}
        {block.type === 'upcoming-events'  && <EventsModalBody           block={block} onChange={onUpdate} />}
        {block.type === 'custom-content'   && <CustomContentModalBody    block={block} onChange={onUpdate} />}
        {block.type === 'affiliations'     && <AffiliationsModalBody     block={block} onChange={onUpdate} />}
        {block.type === 'competitions'     && <CompetitionsModalBody     block={block} onChange={onUpdate} />}
      </DialogContent>

      {/* Visibility footer — shown for all non-fixed blocks */}
      {!block.fixed && (
        <Box sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider', background: 'var(--surface-1)' }}>
          <Box
            component="label"
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', userSelect: 'none' }}
          >
            <input
              type="checkbox"
              checked={block.visibleToAnonymous !== false}
              onChange={e => onUpdate({ visibleToAnonymous: e.target.checked })}
              style={{ width: 15, height: 15, accentColor: 'var(--action-primary)', cursor: 'pointer', flexShrink: 0 }}
            />
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', lineHeight: 1.2 }}>
                Visible to visitors (not logged in)
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25 }}>
                When unchecked, only logged-in members see this block
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      <DialogActions sx={{ px: 3, py: 2, gap: 1, display: 'flex', alignItems: 'center' }}>
        <Typography sx={{ flex: 1, fontSize: 11, color: 'text.tertiary', lineHeight: 1.4 }}>
          Click <strong>Publish changes</strong> in the toolbar to save to the live site.
        </Typography>
        <Button variant="outlined" color="secondary" onClick={onCancel} sx={{ textTransform: 'none', fontSize: 13 }}>Cancel</Button>
        <Button variant="contained" onClick={onClose} sx={{ textTransform: 'none', fontSize: 13 }}>Done</Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Block display names (overrides stale saved names in DB) ───────────────────

const BLOCK_DISPLAY_NAMES: Record<string, string> = {
  'large-image':      'Hero slideshow',
  'dual-panel':       'Events & competitions (2 columns)',
  'upcoming-events':  'Events (full width)',
  'gallery-preview':  'Gallery preview',
  'club-galleries':   'Gallery showcase',
  'competitions':     'Competitions (full width)',
  'member-spotlight': 'Member spotlight',
  'affiliations':     'Affiliations & links',
}

// ── Block subtitle ─────────────────────────────────────────────────────────────

const CRITERIA_LABEL: Record<string, string> = {
  'top-rated':           'Top rated',
  'latest':              'Most recent',
  'competition-winners': 'Competition winners',
}

function getBlockSubtitle(block: ContentBlock): string | null {
  return MODAL_META[block.type]?.description ?? null
}

// ── BlockCard ──────────────────────────────────────────────────────────────────

function BlockCard({
  block, onToggle, onEdit, onRemove, onDragStart, onDragOver, galleries,
}: {
  block:       ContentBlock
  onToggle:    () => void
  onEdit:      () => void
  onRemove?:   () => void
  onDragStart: () => void
  onDragOver:  (e: React.DragEvent) => void
  galleries?:  AdminGalleryData[]
}) {
  const displayName = block.label ?? BLOCK_DISPLAY_NAMES[block.type] ?? block.name
  const subtitle    = getBlockSubtitle(block)

  return (
    <Box
      draggable={!block.fixed && block.enabled}
      onDragStart={block.fixed || !block.enabled ? undefined : e => { e.stopPropagation(); onDragStart() }}
      onDragOver={block.fixed  || !block.enabled ? undefined : onDragOver}
      sx={{
        border: '1px solid var(--border-default)',
        borderRadius: '6px',
        background: 'var(--surface-2)',
        opacity: block.enabled ? 1 : 0.6,
        transition: 'opacity 0.15s',
        '&:hover': { borderColor: 'var(--border-strong)' },
      }}
    >
      <Box sx={{ px: 1.5, py: 1.25, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        {block.fixed
          ? <span style={{ display: 'flex', color: 'var(--text-tertiary)', opacity: 0.45, flexShrink: 0, paddingTop: 1 }}><LockOutlinedIcon sx={{ fontSize: 15 }} /></span>
          : <Box sx={{ flexShrink: 0, pt: '1px', opacity: block.enabled ? 1 : 0.3, pointerEvents: block.enabled ? 'auto' : 'none' }}><DragGrip /></Box>
        }
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, flexWrap: 'wrap' }}>
            {block.type === 'custom-content' && (
              <Typography component="span" sx={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--action-primary)', background: 'rgba(26,111,196,0.10)', borderRadius: '3px', px: '5px', py: '1px', flexShrink: 0, lineHeight: '16px' }}>
                Custom
              </Typography>
            )}
            <Typography component="span" sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>
              {displayName}
            </Typography>
          </Box>
          {subtitle && (
            <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.4, lineHeight: 1.45 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, flexShrink: 0 }}>
          {onRemove && (
            <Tooltip title="Remove block">
              <IconButton size="small" onClick={onRemove} sx={{ color: 'var(--text-tertiary)', mt: '-2px', '&:hover': { color: 'var(--status-error)' } }}>
                <IconTrash />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <IconButton size="small" onClick={onEdit} sx={{ color: 'text.secondary', mt: '-2px' }}>
              <EditOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          {!block.fixed && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', ml: 0.5 }}>
              <Switch checked={block.enabled} onChange={onToggle} size="small" />
              <Typography sx={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', color: block.enabled ? 'var(--action-primary)' : 'var(--text-tertiary)', lineHeight: 1 }}>
                {block.enabled ? 'ON' : 'OFF'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
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
      case 'large-image': {
        if (!b.largeImageSettings?.gallerySource)
          issues.push({ blockId: b.id, label: lbl, severity: 'info',
            message: 'No gallery source configured',
            fix: 'Open block settings and select a gallery source.' })
        break
      }
      case 'gallery-preview': {
        if (!b.galleryPreviewSettings?.galleryId)
          issues.push({ blockId: b.id, label: lbl, severity: 'warning',
            message: 'No gallery selected',
            fix: 'Open block settings and select a gallery to preview.' })
        break
      }
      case 'club-galleries': {
        if (!b.clubGalleriesSettings?.galleryIds?.length)
          issues.push({ blockId: b.id, label: lbl, severity: 'warning',
            message: 'No galleries selected',
            fix: 'Open block settings and select at least one gallery.' })
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
const GRID_IMGS   = [1,2,3,4,5,6,7,8].map(i => picsum(`fp-g${i}`,  400, 400))
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

function PreviewBlock({ block, audience, t, compact, galleries }: { block: ContentBlock; audience: AudienceFilter; t: PreviewTheme; compact: boolean; galleries?: AdminGalleryData[] }) {
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
      const srcLabel = s.gallerySource.startsWith('club:')
        ? (galleries?.find(g => g.id === s.gallerySource.slice(5))?.name ?? 'Club gallery')
        : (GALLERY_OPTIONS.find(o => o.value === s.gallerySource)?.label ?? s.gallerySource)
      const overlay = (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.45) 100%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '12px 14px' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0,1,2,3].map(i => <div key={i} style={{ width: i === 0 ? 18 : 6, height: 6, borderRadius: 3, background: i === 0 ? '#fff' : 'rgba(255,255,255,0.4)' }} />)}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: t.fontSans }}>
            Slides every {s.intervalSeconds}s · {srcLabel}
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

    case 'gallery-preview': {
      const s = block.galleryPreviewSettings
      const name = s?.galleryName || 'Gallery name'
      return (
        <PbSection t={t}>
          <PbHeading t={t}>Gallery showcase</PbHeading>
          <div style={{ fontSize: 10, color: t.textSecondary, fontFamily: t.fontSans, marginTop: -6, marginBottom: 10 }}>
            {name} · N photos
          </div>
          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[0,1,2,3,4,5,6].map(i => (
              <div key={i} style={{ flexShrink: 0, width: 72, height: 72, borderRadius: 6, overflow: 'hidden' }}>
                <PlaceholderImg idx={i} />
              </div>
            ))}
            <div style={{
              flexShrink:     0,
              width:          72,
              height:         72,
              borderRadius:   6,
              border:         `1px solid ${t.borderDefault}`,
              background:     t.surface1,
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            3,
            }}>
              <span style={{ fontSize: 14, color: t.actionPrimary, lineHeight: 1 }}>→</span>
              <span style={{ fontSize: 8, fontWeight: 500, color: t.actionPrimary, fontFamily: t.fontSans, textAlign: 'center', lineHeight: 1.3 }}>View full</span>
            </div>
          </div>
        </PbSection>
      )
    }

    case 'club-galleries': {
      const s = block.clubGalleriesSettings
      const count = s?.galleryIds?.length ?? 0
      return (
        <PbSection t={t}>
          <PbHeading t={t}>Club galleries</PbHeading>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count > 0 ? Math.min(count, 3) : 2}, 1fr)`, gap: 10 }}>
            {(count > 0
              ? galleries?.filter(g => s?.galleryIds.includes(g.id)).slice(0, 3) ?? []
              : [{id:'a',name:'Gallery 1'},{id:'b',name:'Gallery 2'}]
            ).map((g, i) => (
              <div key={g.id ?? i} style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${t.borderSubtle}`, background: t.surface1 }}>
                <div style={{ aspectRatio: '3/2', overflow: 'hidden' }}>
                  <PlaceholderImg idx={i + 1} />
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.textPrimary, fontFamily: t.fontSans }}>{g.name}</div>
                  <div style={{ fontSize: 10, color: t.textTertiary, fontFamily: t.fontSans, marginTop: 2 }}>{(g as AdminGalleryData).imageCount ?? 0} photos</div>
                </div>
              </div>
            ))}
          </div>
        </PbSection>
      )
    }

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

    case 'dual-panel': {
      const eventCount = Math.min(block.dualPanelSettings?.eventCount ?? 4, DUMMY_EVENTS.length)
      const phaseOpen    = 'rgba(46,125,50,0.07)'
      const openBorder   = '#2E7D32'
      const judgeBorder  = '#A67C00'
      const greenText    = '#2E7D32'
      return (
        <PbSection t={t} noBorder>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, minHeight: 200 }}>

            {/* ── Left: Events ── */}
            <div style={{ paddingRight: 20, borderRight: `1px solid ${t.borderSubtle}` }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontFamily: t.fontSerif, fontSize: 15, fontWeight: 700, color: t.textPrimary }}>Next {eventCount} Events</div>
                <span style={{ fontSize: 11, color: t.actionPrimary, fontFamily: t.fontSans }}>Calendar →</span>
              </div>
              {DUMMY_EVENTS.slice(0, eventCount).map((ev, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: i < eventCount - 1 ? `1px solid ${t.borderSubtle}` : 'none' }}>
                  <div style={{ minWidth: 40, textAlign: 'center', background: t.surface1, borderRadius: 6, padding: '3px 5px', flexShrink: 0 }}>
                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.actionPrimary, fontFamily: t.fontSans }}>
                      {ev.date.replace(/\d/g,'').trim().replace(/\s+/,'').slice(0,3)}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary, lineHeight: 1.1, fontFamily: t.fontSerif }}>
                      {ev.date.replace(/\D/g,'').trim().slice(0,2)}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: t.textPrimary, fontFamily: t.fontSans, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                    <div style={{ fontSize: 10, color: t.textTertiary, marginTop: 1, fontFamily: t.fontSans }}>{ev.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Right: Competition activity ── */}
            <div style={{ paddingLeft: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontFamily: t.fontSerif, fontSize: 15, fontWeight: 700, color: t.textPrimary }}>Competition activity</div>
                <span style={{ fontSize: 11, color: t.actionPrimary, fontFamily: t.fontSans }}>View all →</span>
              </div>

              {/* Open competition card */}
              <div style={{ borderRadius: 8, border: `1px solid ${t.borderDefault}`, marginBottom: 8, overflow: 'hidden' }}>
                <div style={{ background: phaseOpen, borderLeft: `3px solid ${openBorder}`, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: openBorder, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.textPrimary, fontFamily: t.fontSans }}>Monthly Salon</span>
                  </div>
                  <div style={{ fontSize: 10, color: greenText, marginTop: 3, fontFamily: t.fontSans, fontWeight: 600 }}>
                    Submissions open · Closes Jun 5 · 16 days left
                  </div>
                </div>
                <div style={{ padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${t.borderSubtle}` }}>
                  <span style={{ fontSize: 10, color: t.textSecondary, fontFamily: t.fontSans }}>0 entries · 0 of 3 submitted</span>
                  <span style={{ fontSize: 10, color: t.actionPrimary, fontFamily: t.fontSans, fontWeight: 600 }}>Submit an image →</span>
                </div>
              </div>

              {/* Judging row */}
              <div style={{ borderRadius: 8, border: `1px solid ${t.borderSubtle}`, borderLeft: `3px solid ${judgeBorder}`, padding: '7px 10px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={judgeBorder}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4-8c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4z"/></svg>
                  <span style={{ fontSize: 12, fontWeight: 600, color: t.textPrimary, fontFamily: t.fontSans }}>May 2026</span>
                </div>
                <span style={{ fontSize: 10, color: t.textTertiary, fontFamily: t.fontSans }}>Judging in progress</span>
              </div>

              {/* Coming soon row */}
              <div style={{ borderRadius: 8, border: `1px solid ${t.borderSubtle}`, padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', border: `1.5px solid ${t.textTertiary}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: t.textSecondary, fontFamily: t.fontSans }}>Monthly Salon – July</span>
                </div>
                <span style={{ fontSize: 10, color: t.textTertiary, fontFamily: t.fontSans }}>Opens Jul 22</span>
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
        { id: 'p1', type: 'PSA' as AffiliationType,       name: 'PSA',       url: '' },
        { id: 'p2', type: 'instagram' as AffiliationType, name: 'Instagram', url: '' },
        { id: 'p3', type: 'facebook' as AffiliationType,  name: 'Facebook',  url: '' },
        { id: 'p4', type: 'twitter' as AffiliationType,   name: 'X / Twitter', url: '' },
      ].slice(0, s.maxColumns)

      return (
        <PbSection t={t} noBorder>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {items.map((a) => {
              const aff = a as { id: string; type?: AffiliationType; name: string; url: string }
              return (
                <div key={a.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 64 }}>
                  <div style={{ width: 48, height: 48, borderRadius: t.radius, background: t.surface1, border: `1px solid ${t.borderDefault}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textSecondary }}>
                    <AffiliationLogoPreview type={aff.type ?? 'other'} name={aff.name} />
                  </div>
                  <div style={{ fontSize: 10, color: t.textTertiary, fontFamily: t.fontSans, textAlign: 'center', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{aff.name || '—'}</div>
                </div>
              )
            })}
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

// ── Brand logo SVGs ────────────────────────────────────────────────────────────

function FacebookSvg({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  )
}
function InstagramSvg({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}
function YouTubeSvg({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
    </svg>
  )
}
function FlickrSvg({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="7" cy="12" r="4.5"/>
      <circle cx="17" cy="12" r="4.5" opacity="0.45"/>
    </svg>
  )
}
function FiveHundredSvg({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.5 3C7.25 3 3 7.25 3 12.5S7.25 22 12.5 22 22 17.75 22 12.5 17.75 3 12.5 3zm.5 13.5c-2.21 0-4-1.79-4-4s1.79-4 4-4c1.1 0 2.09.45 2.81 1.17L14.5 11H17V8.5l-.83.83A5.47 5.47 0 0 0 13 8c-3.04 0-5.5 2.46-5.5 5.5S9.96 19 13 19c2.72 0 4.99-1.97 5.43-4.57h-1.53c-.43 1.73-1.99 3.07-3.9 3.07z"/>
    </svg>
  )
}
function TwitterXSvg({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.733-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}
function VimeoSvg({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.396 7.164c-.093 2.026-1.507 4.799-4.242 8.32C15.322 19.04 12.93 20.8 10.97 20.8c-1.202 0-2.22-1.137-3.055-3.41L6.49 12.69C5.83 10.42 5.125 9.285 4.37 9.285c-.165 0-.74.348-1.726.98L2 9.01c1.386-.617 2.66-1.793 3.835-3.498C7.17 3.93 8.06 3.077 8.587 3.001c1.232-.119 1.99.72 2.277 2.514.304 1.917.515 3.109.632 3.578.35 1.593.737 2.39 1.158 2.39.327 0 .819-.516 1.475-1.547.654-1.032 1.004-1.815 1.052-2.35.094-1.12-.324-1.68-1.254-1.68-.447 0-.908.104-1.38.31.917-3.003 2.666-4.462 5.252-4.377 1.914.057 2.816 1.297 2.597 3.325z"/>
    </svg>
  )
}

function AffiliationLogoPreview({ type, name }: { type: AffiliationType; name: string }) {
  const sz = 20
  switch (type) {
    case 'PSA': return <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '-0.01em' }}>PSA</span>
    case 'facebook':  return <FacebookSvg size={sz} />
    case 'instagram': return <InstagramSvg size={sz} />
    case 'youtube':   return <YouTubeSvg size={sz} />
    case 'flickr':    return <FlickrSvg size={sz} />
    case '500px':     return <FiveHundredSvg size={sz} />
    case 'twitter':   return <TwitterXSvg size={sz} />
    case 'vimeo':     return <VimeoSvg size={sz} />
    default: return <span style={{ fontSize: 9, fontWeight: 700, textAlign: 'center', wordBreak: 'break-all', maxWidth: 40, lineHeight: 1.2 }}>{name.slice(0, 6)}</span>
  }
}

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

function LivePreview({ blocks, fullscreen = false, galleries }: { blocks: ContentBlock[]; fullscreen?: boolean; galleries?: AdminGalleryData[] }) {
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
            {blocks.map(b => <PreviewBlock key={b.id} block={b} audience={audience} t={t} compact={compact} galleries={galleries} />)}
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
              {blocks.map(b => <PreviewBlock key={b.id} block={b} audience={audience} t={t} compact={compact} galleries={galleries} />)}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  )
}

// ── Main HomepageEditor ────────────────────────────────────────────────────────

export default function HomepageEditor({ initialBlocks, galleries = [], members = [] }: { initialBlocks?: ContentBlock[]; galleries?: AdminGalleryData[]; members?: ClubMember[] }) {
  const pathname = usePathname()
  const router   = useRouter()
  const clubSlug = pathname?.split('/')[1] ?? ''

  const {
    blocks, hasChanges, showPublish, setShowPublish,
    saveStatus, debugInfo, isPending,
    toggleBlock, updateBlock, reorderBlocks,
    addCustomContent, removeBlock, customContentCount,
    publish,
  } = useHomepageEditor(initialBlocks ?? DEFAULT_BLOCKS, clubSlug, router)

  const [editingBlock,    setEditingBlock]    = useState<ContentBlock | null>(null)
  const [editOriginal,    setEditOriginal]    = useState<ContentBlock | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const openModal = (block: ContentBlock) => {
    setEditingBlock(block)
    setEditOriginal(block)
  }
  const cancelModal = () => {
    if (editOriginal) updateBlock(editOriginal.id, editOriginal)
    setEditingBlock(null)
    setEditOriginal(null)
  }
  const closeModal = () => {
    setEditingBlock(null)
    setEditOriginal(null)
  }
  const handleAddCustomContent = () => {
    const newBlock = addCustomContent()
    if (newBlock) openModal(newBlock)
  }

  const dragIdx  = useRef<number | null>(null)
  const [insertAt, setInsertAt] = useState<number | null>(null)

  const requestDelete = (id: string) => setConfirmDeleteId(id)
  const confirmDelete = () => {
    if (confirmDeleteId) {
      if (editingBlock?.id === confirmDeleteId) closeModal()
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.015em', lineHeight: 1.2 }}>
            Homepage
          </Typography>
          {saveStatus === 'saving' && (
            <Typography sx={{ fontSize: 11, color: 'text.secondary', fontStyle: 'italic', mt: 0.25 }}>Saving…</Typography>
          )}
          {saveStatus === 'saved' && debugInfo && (
            <Typography sx={{ fontSize: 11, color: 'var(--status-success-text)', mt: 0.25 }}>
              ✓ sent {debugInfo.sentBlocks}blk/{debugInfo.sentEnabled}on · saved {debugInfo.savedBlocks}blk/{debugInfo.savedEnabled}on · {debugInfo.clubId.slice(0, 8)}
            </Typography>
          )}
          {saveStatus === 'saved' && !debugInfo && (
            <Typography sx={{ fontSize: 11, color: 'var(--status-success-text)', mt: 0.25 }}>✓ Published</Typography>
          )}
          {saveStatus === 'error' && (
            <Typography sx={{ fontSize: 11, color: 'var(--status-error)', mt: 0.25 }}>Save failed — please try again.</Typography>
          )}
          {saveStatus === 'idle' && hasChanges && (
            <Typography sx={{ fontSize: 11, color: 'var(--status-warning)', mt: 0.25 }}>Unpublished changes — click Publish changes to go live.</Typography>
          )}
        </Box>
        <Button variant="outlined" size="small"
          onClick={() => window.open(`/${clubSlug}`, '_blank')}
          sx={{ textTransform: 'none', fontSize: 13, borderColor: 'var(--border-default)', color: 'text.secondary', '&:hover': { borderColor: 'var(--border-strong)' } }}>
          Preview
        </Button>
        <Button variant="contained" size="small" disabled={!hasChanges || isPending} onClick={() => setShowPublish(true)}
          sx={{
            textTransform: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 0.75,
            ...(hasChanges ? {
              background: 'var(--action-primary)',
              boxShadow: '0 0 0 3px rgba(26,111,196,0.25)',
              '&:hover': { background: 'var(--action-primary-hover)', boxShadow: '0 0 0 3px rgba(26,111,196,0.35)' },
            } : {}),
          }}>
          {hasChanges && <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#FFCC00', flexShrink: 0 }} />}
          {hasChanges ? 'Publish changes ↑' : 'Publish changes'}
        </Button>
      </Box>

      {/* Two-column layout */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 670px', gap: 3, alignItems: 'start' }}>

        {/* Editor rail */}
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'text.secondary', mb: 0.5 }}>
            Content blocks
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.tertiary', mb: 1.5 }}>
            Drag to reorder · click Publish to make changes live
          </Typography>

          {/* Single drop zone containing all sections so DnD works across them */}
          <Box onDrop={handleDrop} onDragOver={e => e.preventDefault()} sx={{ display: 'flex', flexDirection: 'column' }}>
            {(() => {
              const firstHiddenIdx = blocks.findIndex(b => !b.fixed && !b.enabled)
              const activeBlocks   = firstHiddenIdx === -1 ? blocks : blocks.slice(0, firstHiddenIdx)
              const hiddenBlocks   = firstHiddenIdx === -1 ? [] : blocks.slice(firstHiddenIdx)

              return (
                <>
                  {/* ── Active blocks (one unified list, no section dividers) ── */}
                  {activeBlocks.map((block, localI) => {
                    const i = localI
                    return (
                      <Fragment key={block.id}>
                        {insertAt === i && dragIdx.current !== null && i >= 1 && <InsertionLine />}
                        <Box sx={{ my: '5px' }}>
                          <BlockCard
                            block={block}
                            onToggle={() => toggleBlock(block.id)}
                            onEdit={() => openModal(block)}
                            onRemove={block.type === 'custom-content' ? () => requestDelete(block.id) : undefined}
                            onDragStart={() => handleDragStart(i)}
                            onDragOver={e => handleDragOver(e, i)}
                            galleries={galleries}
                          />
                        </Box>
                      </Fragment>
                    )
                  })}

                  {/* ── Add custom content — between active and hidden ── */}
                  <Box sx={{ my: 2, pt: 0.5 }}>
                    {customContentCount < MAX_CUSTOM_CONTENT ? (
                      <Button
                        startIcon={<AddIcon />}
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={handleAddCustomContent}
                        sx={{ textTransform: 'none', fontSize: 13, width: '100%' }}
                      >
                        Add custom content block
                        <Typography component="span" sx={{ fontSize: 11, color: 'text.tertiary', ml: 1 }}>
                          ({customContentCount}/{MAX_CUSTOM_CONTENT})
                        </Typography>
                      </Button>
                    ) : (
                      <Typography sx={{ fontSize: 11, color: 'text.tertiary', textAlign: 'center', fontStyle: 'italic' }}>
                        Maximum of {MAX_CUSTOM_CONTENT} custom content blocks reached.
                      </Typography>
                    )}
                  </Box>

                  {/* ── Hidden blocks ── */}
                  {hiddenBlocks.length > 0 && (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <Box sx={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                        <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                          Hidden
                        </Typography>
                        <Box sx={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                      </Box>
                      {hiddenBlocks.map((block, localJ) => {
                        const i = firstHiddenIdx + localJ
                        return (
                          <Fragment key={block.id}>
                            {insertAt === i && dragIdx.current !== null && <InsertionLine />}
                            <Box sx={{ mb: 1 }}>
                              <BlockCard
                                block={block}
                                onToggle={() => toggleBlock(block.id)}
                                onEdit={() => openModal(block)}
                                onRemove={block.type === 'custom-content' ? () => requestDelete(block.id) : undefined}
                                onDragStart={() => handleDragStart(i)}
                                onDragOver={e => handleDragOver(e, i)}
                                galleries={galleries}
                              />
                            </Box>
                          </Fragment>
                        )
                      })}
                    </>
                  )}

                  {insertAt === blocks.length && dragIdx.current !== null && <InsertionLine />}
                </>
              )
            })()}
          </Box>

          {/* Drop zone at bottom */}
          <Box onDragOver={e => { e.preventDefault(); if (dragIdx.current !== null) setInsertAt(blocks.length) }} onDrop={handleDrop} sx={{ height: 24 }} />
        </Box>

        {/* Live preview — capped at 670px so it doesn't stretch on wider screens */}
        <Box sx={{ position: 'sticky', top: 24, maxWidth: 670, width: '100%' }}>
          <LivePreview blocks={blocks} galleries={galleries} />
        </Box>
      </Box>

      {/* Block edit modal */}
      <BlockEditModal
        block={syncedEditBlock}
        onClose={closeModal}
        onCancel={cancelModal}
        onUpdate={u => { if (editingBlock) updateBlock(editingBlock.id, u) }}
        onRemove={syncedEditBlock?.type === 'custom-content' ? () => requestDelete(syncedEditBlock.id) : undefined}
        galleries={galleries}
        members={members}
      />

      {/* Publish dialog */}
      {(() => {
        const pubIssues  = getValidationIssues(blocks)
        const pubWarnings = pubIssues.filter(i => i.severity === 'warning')
        const hasGalleryBlocks = blocks.some(b => b.enabled && ['large-image', 'gallery-preview', 'club-galleries'].includes(b.type))
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
              <Button variant="contained" onClick={() => publish(blocks)} sx={{ textTransform: 'none', fontSize: 13 }}>Publish now</Button>
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

    </Box>
  )
}

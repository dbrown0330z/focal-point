'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, TextField, Select, MenuItem, FormControl, InputLabel,
  Stepper, Step, StepLabel, Tabs, Tab, Chip, Tooltip, CircularProgress,
  Alert,
} from '@mui/material'
import AddIcon         from '@mui/icons-material/Add'
import DeleteIcon         from '@mui/icons-material/Delete'
import EditOutlinedIcon  from '@mui/icons-material/EditOutlined'
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import CheckCircleIcon   from '@mui/icons-material/CheckCircle'
import PublicIcon        from '@mui/icons-material/Public'
import PeopleIcon        from '@mui/icons-material/People'
import LockOutlinedIcon  from '@mui/icons-material/LockOutlined'
import type { GalleryData, GalleryImage, CompImage } from './page'
import {
  createGallery,
  updateGalleryMeta,
  deleteGallery,
  updateGalleryImages,
  setCoverImage,
} from './actions'

const GALLERY_LIMIT = 3

// ─── Helpers ─────────────────────────────────────────────────────────────────

function VisibilityIcon({ v }: { v: string }) {
  if (v === 'public')       return <PublicIcon sx={{ fontSize: 14 }} />
  if (v === 'members_only') return <PeopleIcon sx={{ fontSize: 14 }} />
  return <LockOutlinedIcon sx={{ fontSize: 14 }} />
}

function visibilityLabel(v: string) {
  if (v === 'public')       return 'Public'
  if (v === 'members_only') return 'Members only'
  return 'Private'
}

// ─── Picker grid (shared between steps) ──────────────────────────────────────

function PickerGrid({
  items,
  selectedIds,
  onToggle,
  emptyMsg,
}: {
  items:       { id: string; title: string; publicUrl: string; sub?: string }[]
  selectedIds: Set<string>
  onToggle:    (id: string) => void
  emptyMsg:    string
}) {
  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
        <Typography variant="body2">{emptyMsg}</Typography>
      </Box>
    )
  }
  return (
    <Box sx={{
      display:             'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
      gap:                 1.5,
    }}>
      {items.map(item => {
        const selected = selectedIds.has(item.id)
        return (
          <Box
            key={item.id}
            onClick={() => onToggle(item.id)}
            sx={{
              position:     'relative',
              aspectRatio:  '1',
              borderRadius: 2,
              overflow:     'hidden',
              cursor:       'pointer',
              border:       selected ? '2.5px solid' : '2.5px solid transparent',
              borderColor:  selected ? 'primary.main' : 'transparent',
              outline:      selected ? '2px solid' : 'none',
              outlineColor: selected ? 'rgba(26,111,196,0.25)' : 'transparent',
              transition:   'border-color 0.1s',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.publicUrl}
              alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <Box sx={{
              position:   'absolute',
              inset:      0,
              background: selected ? 'rgba(26,111,196,0.18)' : 'rgba(0,0,0,0)',
              transition: 'background 0.1s',
            }} />
            {selected && (
              <CheckCircleIcon sx={{
                position:  'absolute',
                top:       6,
                right:     6,
                fontSize:  18,
                color:     'primary.main',
                bgcolor:   'white',
                borderRadius: '50%',
              }} />
            )}
            <Box sx={{
              position:   'absolute',
              bottom:     0,
              left:       0,
              right:      0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
              px:         1,
              py:         0.75,
            }}>
              <Typography sx={{ fontSize: 11, color: '#fff', lineHeight: 1.3, fontWeight: 500 }} noWrap>
                {item.title}
              </Typography>
              {item.sub && (
                <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', lineHeight: 1.2 }} noWrap>
                  {item.sub}
                </Typography>
              )}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

// ─── Cover picker ─────────────────────────────────────────────────────────────

function CoverPicker({
  imageIds,
  libraryImages,
  compImages,
  coverId,
  onSelect,
}: {
  imageIds:      string[]
  libraryImages: GalleryImage[]
  compImages:    CompImage[]
  coverId:       string | null
  onSelect:      (id: string) => void
}) {
  const libMap  = useMemo(() => new Map(libraryImages.map(i => [i.id, i])),  [libraryImages])
  const compMap = useMemo(() => new Map(compImages.map(i => [i.imageId, i])), [compImages])

  const items = imageIds.map(id => {
    const lib  = libMap.get(id)
    if (lib) return { id: lib.id, title: lib.title, publicUrl: lib.publicUrl }
    const comp = compMap.get(id)
    if (comp) return { id: comp.imageId, title: comp.title, publicUrl: comp.publicUrl }
    return null
  }).filter(Boolean) as { id: string; title: string; publicUrl: string }[]

  if (items.length === 0) return null

  return (
    <Box sx={{
      display:             'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
      gap:                 1.5,
    }}>
      {items.map(item => {
        const selected = coverId === item.id
        return (
          <Box
            key={item.id}
            onClick={() => onSelect(item.id)}
            sx={{
              position:    'relative',
              aspectRatio: '1',
              borderRadius: 2,
              overflow:    'hidden',
              cursor:      'pointer',
              border:      selected ? '2.5px solid' : '2.5px solid transparent',
              borderColor: selected ? 'primary.main' : 'transparent',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.publicUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {selected && (
              <CheckCircleIcon sx={{ position: 'absolute', top: 6, right: 6, fontSize: 18, color: 'primary.main', bgcolor: 'white', borderRadius: '50%' }} />
            )}
            <Box sx={{
              position:   'absolute',
              bottom:     0,
              left:       0,
              right:      0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
              px:         1,
              py:         0.75,
            }}>
              <Typography sx={{ fontSize: 11, color: '#fff', lineHeight: 1.3, fontWeight: 500 }} noWrap>
                {item.title}
              </Typography>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

// ─── Create wizard ────────────────────────────────────────────────────────────

const STEP_LABELS = ['Name & privacy', 'Select images', 'Cover image']

function CreateWizard({
  open,
  onClose,
  libraryImages,
  compImages,
}: {
  open:          boolean
  onClose:       () => void
  libraryImages: GalleryImage[]
  compImages:    CompImage[]
}) {
  const router = useRouter()

  const [step,        setStep]        = useState(0)
  const [name,        setName]        = useState('')
  const [visibility,  setVisibility]  = useState<'public' | 'members_only' | 'private'>('private')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [coverId,     setCoverId]     = useState<string | null>(null)
  const [pickerTab,   setPickerTab]   = useState(0)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  function reset() {
    setStep(0); setName(''); setVisibility('private')
    setSelectedIds(new Set()); setCoverId(null); setPickerTab(0)
    setError(null)
  }

  function handleClose() { reset(); onClose() }

  function toggleId(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id); if (coverId === id) setCoverId(null) }
      else next.add(id)
      return next
    })
  }

  function handleCoverSelect(id: string) { setCoverId(id) }

  async function handleCreate() {
    setSaving(true); setError(null)
    const ids = [...selectedIds]
    const res = await createGallery({
      name,
      visibility,
      imageIds: ids,
      coverId:  coverId ?? ids[0] ?? null,
    })
    setSaving(false)
    if (res.error) { setError(res.error); return }
    reset(); onClose(); router.refresh()
  }

  const libItems  = libraryImages.map(i => ({ id: i.id, title: i.title, publicUrl: i.publicUrl }))
  const compItems = compImages.map(i => ({ id: i.imageId, title: i.title, publicUrl: i.publicUrl, sub: i.competitionName }))

  const canAdvance0 = name.trim().length > 0
  const canAdvance1 = selectedIds.size > 0
  const orderedIds  = [...selectedIds]
  const defaultCover = coverId ?? orderedIds[0] ?? null

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth sx={{ '& .MuiPaper-root': { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Create gallery</Typography>
      </DialogTitle>

      <Box sx={{ px: 3 }}>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          {STEP_LABELS.map(label => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent sx={{ pt: 0, minHeight: 380 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Step 0: Name & visibility */}
        {step === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 480 }}>
            <TextField
              label="Gallery name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              fullWidth
              slotProps={{ htmlInput: { maxLength: 80 } }}
              helperText={`${name.length}/80`}
            />
            <FormControl fullWidth>
              <InputLabel>Visibility</InputLabel>
              <Select
                value={visibility}
                label="Visibility"
                onChange={e => setVisibility(e.target.value as 'public' | 'members_only' | 'private')}
              >
                <MenuItem value="public">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PublicIcon fontSize="small" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Public</Typography>
                      <Typography variant="caption" color="text.secondary">Anyone with the link can view</Typography>
                    </Box>
                  </Box>
                </MenuItem>
                <MenuItem value="members_only">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon fontSize="small" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Members only</Typography>
                      <Typography variant="caption" color="text.secondary">Only signed-in club members can view</Typography>
                    </Box>
                  </Box>
                </MenuItem>
                <MenuItem value="private">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LockOutlinedIcon fontSize="small" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Private</Typography>
                      <Typography variant="caption" color="text.secondary">Only visible to you</Typography>
                    </Box>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Step 1: Pick images */}
        {step === 1 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {selectedIds.size} image{selectedIds.size !== 1 ? 's' : ''} selected
              </Typography>
            </Box>
            <Tabs value={pickerTab} onChange={(_, v) => setPickerTab(v)} sx={{ mb: 2 }}>
              <Tab label={`My library (${libraryImages.length})`} />
              <Tab label={`Competition images (${compImages.length})`} />
            </Tabs>
            {pickerTab === 0 && (
              <PickerGrid
                items={libItems}
                selectedIds={selectedIds}
                onToggle={toggleId}
                emptyMsg="No images in your library yet."
              />
            )}
            {pickerTab === 1 && (
              <PickerGrid
                items={compItems}
                selectedIds={selectedIds}
                onToggle={toggleId}
                emptyMsg="No competition submissions yet."
              />
            )}
          </Box>
        )}

        {/* Step 2: Cover */}
        {step === 2 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose a cover image for your gallery. The first image is selected by default.
            </Typography>
            <CoverPicker
              imageIds={orderedIds}
              libraryImages={libraryImages}
              compImages={compImages}
              coverId={defaultCover}
              onSelect={handleCoverSelect}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="outlined" color="secondary" onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        {step > 0 && (
          <Button variant="outlined" color="secondary" onClick={() => setStep(s => s - 1)} disabled={saving}>
            Back
          </Button>
        )}
        {step < 2 && (
          <Button
            variant="contained"
            disabled={(step === 0 && !canAdvance0) || (step === 1 && !canAdvance1)}
            onClick={() => setStep(s => s + 1)}
          >
            Next
          </Button>
        )}
        {step === 2 && (
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {saving ? 'Creating…' : 'Create gallery'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

// ─── Edit meta dialog ─────────────────────────────────────────────────────────

function EditMetaDialog({
  gallery,
  onClose,
}: {
  gallery: GalleryData | null
  onClose: () => void
}) {
  const router = useRouter()
  const [name,       setName]       = useState(gallery?.name ?? '')
  const [visibility, setVisibility] = useState<'public' | 'members_only' | 'private'>(gallery?.visibility ?? 'private')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  if (!gallery) return null

  async function handleSave() {
    if (!gallery) return
    setSaving(true); setError(null)
    const res = await updateGalleryMeta(gallery.id, { name, visibility })
    setSaving(false)
    if (res.error) { setError(res.error); return }
    onClose(); router.refresh()
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth sx={{ '& .MuiPaper-root': { borderRadius: 3 } }}>
      <DialogTitle>Edit gallery</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <TextField
            label="Gallery name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            fullWidth
            slotProps={{ htmlInput: { maxLength: 80 } }}
          />
          <FormControl fullWidth>
            <InputLabel>Visibility</InputLabel>
            <Select
              value={visibility}
              label="Visibility"
              onChange={e => setVisibility(e.target.value as 'public' | 'members_only' | 'private')}
            >
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="members_only">Members only</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" color="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!name.trim() || saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteDialog({
  gallery,
  onClose,
}: {
  gallery: GalleryData | null
  onClose: () => void
}) {
  const router  = useRouter()
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  if (!gallery) return null

  async function handleDelete() {
    if (!gallery) return
    setSaving(true); setError(null)
    const res = await deleteGallery(gallery.id)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    onClose(); router.refresh()
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth sx={{ '& .MuiPaper-root': { borderRadius: 3 } }}>
      <DialogTitle>Delete gallery?</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2" color="text.secondary">
          <strong>&ldquo;{gallery.name}&rdquo;</strong> will be permanently deleted. The images themselves will not be deleted.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" color="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {saving ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Gallery card ─────────────────────────────────────────────────────────────

function GalleryCard({
  gallery,
  clubSlug,
  onEdit,
  onDelete,
  onShare,
}: {
  gallery:  GalleryData
  clubSlug: string
  onEdit:   (g: GalleryData) => void
  onDelete: (g: GalleryData) => void
  onShare:  (g: GalleryData) => void
}) {
  return (
    <Box
      sx={{
        borderRadius:  2,
        overflow:      'hidden',
        bgcolor:       'background.paper',
        border:        '1px solid var(--border-default)',
        display:       'flex',
        flexDirection: 'column',
      }}
    >
      {/* Cover */}
      <Box
        sx={{
          aspectRatio: '4/3',
          bgcolor:     'var(--surface-1)',
          position:    'relative',
          overflow:    'hidden',
        }}
      >
        {gallery.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gallery.coverImageUrl}
            alt={gallery.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="caption" color="text.disabled">No images</Typography>
          </Box>
        )}
        <Box sx={{
          position:        'absolute',
          bottom:          8,
          right:           8,
          bgcolor:         'rgba(0,0,0,0.55)',
          borderRadius:    1,
          px:              1,
          py:              0.25,
        }}>
          <Typography sx={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>
            {gallery.imageCount} image{gallery.imageCount !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </Box>

      {/* Info */}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Typography sx={{ fontWeight: 600, fontSize: 15, flex: 1, lineHeight: 1.3 }}>
            {gallery.name}
          </Typography>
          <Chip
            icon={<VisibilityIcon v={gallery.visibility} />}
            label={visibilityLabel(gallery.visibility)}
            size="small"
            sx={{ fontSize: 11, height: 22 }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, mt: 'auto', pt: 1 }}>
          <Tooltip title="Edit name & visibility">
            <IconButton size="small" onClick={() => onEdit(gallery)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {gallery.visibility !== 'private' && (
            <Tooltip title="Share gallery">
              <IconButton size="small" onClick={() => onShare(gallery)}>
                <ShareOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Box sx={{ flex: 1 }} />
          <Tooltip title="Delete gallery">
            <IconButton size="small" color="error" onClick={() => onDelete(gallery)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  )
}

// ─── Share dialog ─────────────────────────────────────────────────────────────

function ShareDialog({
  gallery,
  clubSlug,
  userId,
  onClose,
}: {
  gallery:  GalleryData | null
  clubSlug: string
  userId:   string
  onClose:  () => void
}) {
  const [copied, setCopied] = useState(false)
  if (!gallery) return null

  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/${clubSlug}/gallery/${userId}/${gallery.slug}`

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth sx={{ '& .MuiPaper-root': { borderRadius: 3 } }}>
      <DialogTitle>Share gallery</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {gallery.visibility === 'public'
            ? 'Anyone with this link can view your gallery.'
            : 'Club members with this link can view your gallery.'}
        </Typography>
        <Box sx={{
          display:    'flex',
          gap:        1,
          bgcolor:    'var(--surface-1)',
          borderRadius: 2,
          p:          1.5,
          alignItems: 'center',
        }}>
          <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 12 }}>
            {url}
          </Typography>
          <Button variant="contained" size="small" onClick={handleCopy} sx={{ flexShrink: 0 }}>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" color="secondary" onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function GalleriesClient({
  clubSlug,
  userId,
  galleries,
  libraryImages,
  compImages,
}: {
  clubSlug:      string
  userId:        string
  galleries:     GalleryData[]
  libraryImages: GalleryImage[]
  compImages:    CompImage[]
}) {
  const [createOpen,  setCreateOpen]  = useState(false)
  const [editGallery, setEditGallery] = useState<GalleryData | null>(null)
  const [delGallery,  setDelGallery]  = useState<GalleryData | null>(null)
  const [shareGallery, setShareGallery] = useState<GalleryData | null>(null)

  const atLimit = galleries.length >= GALLERY_LIMIT

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h1" sx={{ fontSize: 'var(--text-h1-size)', fontWeight: 'var(--text-h1-weight)', letterSpacing: 'var(--text-h1-ls)', mb: 0.5 }}>
            My galleries
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Curate and share collections of your work.
            {atLimit ? ` You've reached the ${GALLERY_LIMIT}-gallery limit.` : ` ${galleries.length} of ${GALLERY_LIMIT} used.`}
          </Typography>
        </Box>
        <Tooltip title={atLimit ? `Maximum ${GALLERY_LIMIT} galleries allowed` : ''}>
          <span>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={atLimit}
              onClick={() => setCreateOpen(true)}
            >
              New gallery
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* Gallery grid */}
      {galleries.length === 0 ? (
        <Box sx={{
          textAlign: 'center',
          py:        8,
          border:    '1px dashed var(--border-default)',
          borderRadius: 3,
        }}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>No galleries yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first gallery to share curated collections of your photos.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Create gallery
          </Button>
        </Box>
      ) : (
        <Box sx={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap:                 3,
        }}>
          {galleries.map(g => (
            <GalleryCard
              key={g.id}
              gallery={g}
              clubSlug={clubSlug}
              onEdit={setEditGallery}
              onDelete={setDelGallery}
              onShare={setShareGallery}
            />
          ))}
        </Box>
      )}

      {/* Dialogs */}
      <CreateWizard
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        libraryImages={libraryImages}
        compImages={compImages}
      />
      <EditMetaDialog
        gallery={editGallery}
        onClose={() => setEditGallery(null)}
      />
      <DeleteDialog
        gallery={delGallery}
        onClose={() => setDelGallery(null)}
      />
      <ShareDialog
        gallery={shareGallery}
        clubSlug={clubSlug}
        userId={userId}
        onClose={() => setShareGallery(null)}
      />
    </Box>
  )
}

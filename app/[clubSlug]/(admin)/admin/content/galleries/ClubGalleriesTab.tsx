'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip, IconButton,
  Tooltip, Alert, CircularProgress, Switch, FormControlLabel,
} from '@mui/material'
import AddIcon                   from '@mui/icons-material/Add'
import EditOutlinedIcon          from '@mui/icons-material/EditOutlined'
import ArchiveOutlinedIcon       from '@mui/icons-material/ArchiveOutlined'
import DeleteIcon                from '@mui/icons-material/Delete'
import StarBorderIcon            from '@mui/icons-material/StarBorder'
import StarIcon                  from '@mui/icons-material/Star'
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined'
import CheckCircleIcon           from '@mui/icons-material/CheckCircle'
import {
  createClubGallery,
  updateClubGalleryMeta,
  archiveClubGallery,
  deleteClubGallery,
  addImagesToClubGallery,
  removeFromClubGallery,
} from './actions'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ClubGalleryData = {
  id:                   string
  name:                 string
  slug:                 string
  description:          string | null
  visibility:           'public' | 'members_only'
  featured_on_homepage: boolean
  archived_at:          string | null
  cover_submission_id:  string | null
  coverUrl:             string | null
  imageCount:           number
  images: {
    galleryImageId: string
    submissionId:   string
    imageUrl:       string
    title:          string
    sortOrder:      number
  }[]
}

export type SubmissionOption = {
  id:              string
  imageUrl:        string
  title:           string
  competitionName: string
  memberName:      string
}

// ─── Create/Edit dialog ────────────────────────────────────────────────────────

function GalleryMetaDialog({
  gallery,
  open,
  onClose,
}: {
  gallery: ClubGalleryData | null
  open:    boolean
  onClose: () => void
}) {
  const router = useRouter()
  const isEdit = Boolean(gallery)

  const [name,        setName]        = useState(gallery?.name ?? '')
  const [description, setDescription] = useState(gallery?.description ?? '')
  const [visibility,  setVisibility]  = useState<'public' | 'members_only'>(gallery?.visibility ?? 'public')
  const [featured,    setFeatured]    = useState(gallery?.featured_on_homepage ?? false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  function handleClose() { setError(null); onClose() }

  async function handleSave() {
    setSaving(true); setError(null)
    let res
    if (isEdit && gallery) {
      res = await updateClubGalleryMeta(gallery.id, { name, description, visibility, featured_on_homepage: featured })
    } else {
      res = await createClubGallery({ name, description, visibility })
    }
    setSaving(false)
    if (res.error) { setError(res.error); return }
    handleClose(); router.refresh()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit gallery' : 'New club gallery'}</DialogTitle>
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
          <TextField
            label="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
          <FormControl fullWidth>
            <InputLabel>Visibility</InputLabel>
            <Select
              value={visibility}
              label="Visibility"
              onChange={e => setVisibility(e.target.value as 'public' | 'members_only')}
            >
              <MenuItem value="public">Public — anyone can view</MenuItem>
              <MenuItem value="members_only">Members only — signed-in members only</MenuItem>
            </Select>
          </FormControl>
          {isEdit && (
            <FormControlLabel
              control={<Switch checked={featured} onChange={e => setFeatured(e.target.checked)} />}
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>Feature on homepage</Typography>
                  <Typography variant="caption" color="text.secondary">Only one gallery can be featured at a time</Typography>
                </Box>
              }
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" color="secondary" onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!name.trim() || saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {saving ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save' : 'Create gallery')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Add images dialog ─────────────────────────────────────────────────────────

function AddImagesDialog({
  gallery,
  submissions,
  onClose,
}: {
  gallery:     ClubGalleryData
  submissions: SubmissionOption[]
  onClose:     () => void
}) {
  const router = useRouter()
  const existingIds = new Set(gallery.images.map(i => i.submissionId))
  const available   = submissions.filter(s => !existingIds.has(s.id))

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search,   setSearch]   = useState('')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const filtered = search.trim()
    ? available.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.memberName.toLowerCase().includes(search.toLowerCase()) ||
        s.competitionName.toLowerCase().includes(search.toLowerCase())
      )
    : available

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function handleAdd() {
    if (!selected.size) return
    setSaving(true); setError(null)
    const res = await addImagesToClubGallery(gallery.id, [...selected])
    setSaving(false)
    if (res.error) { setError(res.error); return }
    onClose(); router.refresh()
  }

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add images to &ldquo;{gallery.name}&rdquo;</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ mb: 2 }}>
          <TextField
            placeholder="Search by title, member, or competition…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            fullWidth
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          {selected.size} selected · {available.length} available
        </Typography>
        {filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <Typography variant="body2">{search ? 'No results.' : 'No unselected submissions available.'}</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1.5 }}>
            {filtered.map(s => {
              const sel = selected.has(s.id)
              return (
                <Box
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  sx={{
                    position:    'relative',
                    aspectRatio: '1',
                    borderRadius: 2,
                    overflow:    'hidden',
                    cursor:      'pointer',
                    border:      sel ? '2.5px solid' : '2.5px solid transparent',
                    borderColor: sel ? 'primary.main' : 'transparent',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.imageUrl} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {sel && <CheckCircleIcon sx={{ position: 'absolute', top: 6, right: 6, fontSize: 18, color: 'primary.main', bgcolor: 'white', borderRadius: '50%' }} />}
                  <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', px: 1, py: 0.75 }}>
                    <Typography sx={{ fontSize: 11, color: '#fff', fontWeight: 500, lineHeight: 1.2 }} noWrap>{s.title}</Typography>
                    <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', lineHeight: 1.2 }} noWrap>{s.memberName}</Typography>
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" color="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={!selected.size || saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {saving ? 'Adding…' : `Add ${selected.size || ''} image${selected.size !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Archive/Delete dialog ─────────────────────────────────────────────────────

function ArchiveDeleteDialog({
  gallery,
  onClose,
}: {
  gallery: ClubGalleryData | null
  onClose: () => void
}) {
  const router = useRouter()
  const [mode,   setMode]   = useState<'archive' | 'delete'>('archive')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  if (!gallery) return null

  async function handleConfirm() {
    if (!gallery) return
    setSaving(true); setError(null)
    const res = mode === 'archive' ? await archiveClubGallery(gallery.id) : await deleteClubGallery(gallery.id)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    onClose(); router.refresh()
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Remove gallery</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            What would you like to do with <strong>&ldquo;{gallery.name}&rdquo;</strong>?
          </Typography>
          <Box
            onClick={() => setMode('archive')}
            sx={{
              p: 2, borderRadius: 2, cursor: 'pointer',
              border: mode === 'archive' ? '2px solid' : '1px solid',
              borderColor: mode === 'archive' ? 'primary.main' : 'divider',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Archive</Typography>
            <Typography variant="caption" color="text.secondary">Hidden from members but can be restored later.</Typography>
          </Box>
          <Box
            onClick={() => setMode('delete')}
            sx={{
              p: 2, borderRadius: 2, cursor: 'pointer',
              border: mode === 'delete' ? '2px solid' : '1px solid',
              borderColor: mode === 'delete' ? 'error.main' : 'divider',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>Delete permanently</Typography>
            <Typography variant="caption" color="text.secondary">Cannot be undone. Submitted images are not deleted.</Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" color="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          color={mode === 'delete' ? 'error' : 'primary'}
          onClick={handleConfirm}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {saving ? 'Working…' : mode === 'archive' ? 'Archive' : 'Delete permanently'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Gallery detail view ───────────────────────────────────────────────────────

function GalleryDetail({
  gallery,
  submissions,
  onEdit,
  onRemove,
  onBack,
}: {
  gallery:     ClubGalleryData
  submissions: SubmissionOption[]
  onEdit:      () => void
  onRemove:    () => void
  onBack:      () => void
}) {
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)

  async function handleRemoveImage(galleryImageId: string) {
    await removeFromClubGallery(galleryImageId)
    router.refresh()
  }

  return (
    <Box>
      {/* Breadcrumb */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button variant="text" size="small" onClick={onBack} sx={{ color: 'text.secondary', p: 0, minWidth: 0 }}>
          Club galleries
        </Button>
        <Typography color="text.secondary" sx={{ fontSize: 13 }}>›</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{gallery.name}</Typography>
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 18 }}>{gallery.name}</Typography>
            {gallery.featured_on_homepage && (
              <Chip icon={<StarIcon sx={{ fontSize: 12 }} />} label="Featured" size="small" color="primary" sx={{ fontSize: 11, height: 22 }} />
            )}
            <Chip
              label={gallery.visibility === 'public' ? 'Public' : 'Members only'}
              size="small"
              sx={{ fontSize: 11, height: 22 }}
            />
          </Box>
          {gallery.description && (
            <Typography variant="body2" color="text.secondary">{gallery.description}</Typography>
          )}
          <Typography variant="caption" color="text.secondary">{gallery.imageCount} image{gallery.imageCount !== 1 ? 's' : ''}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="secondary" size="small" startIcon={<AddPhotoAlternateOutlinedIcon />} onClick={() => setAddOpen(true)}>
            Add images
          </Button>
          <Tooltip title="Edit gallery details">
            <IconButton size="small" onClick={onEdit}><EditOutlinedIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Archive or delete">
            <IconButton size="small" color="error" onClick={onRemove}><ArchiveOutlinedIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Images */}
      {gallery.images.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, border: '1px dashed var(--border-default)', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No images in this gallery yet.</Typography>
          <Button variant="contained" size="small" startIcon={<AddPhotoAlternateOutlinedIcon />} onClick={() => setAddOpen(true)}>
            Add images
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1.5 }}>
          {gallery.images.map(img => (
            <Box
              key={img.galleryImageId}
              sx={{
                position:    'relative',
                aspectRatio: '1',
                borderRadius: 2,
                overflow:    'hidden',
                '&:hover .remove-btn': { opacity: 1 },
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.imageUrl} alt={img.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.65))', px: 1, py: 0.75 }}>
                <Typography sx={{ fontSize: 11, color: '#fff', fontWeight: 500, lineHeight: 1.2 }} noWrap>{img.title}</Typography>
              </Box>
              <IconButton
                className="remove-btn"
                size="small"
                onClick={() => handleRemoveImage(img.galleryImageId)}
                sx={{
                  position: 'absolute', top: 4, right: 4,
                  bgcolor: 'rgba(0,0,0,0.6)', color: 'white',
                  opacity: 0, transition: 'opacity 0.15s',
                  '&:hover': { bgcolor: 'rgba(200,50,50,0.8)' },
                }}
              >
                <DeleteIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {addOpen && (
        <AddImagesDialog gallery={gallery} submissions={submissions} onClose={() => setAddOpen(false)} />
      )}
    </Box>
  )
}

// ─── Main exported tab component ──────────────────────────────────────────────

export default function ClubGalleriesTab({
  galleries,
  submissions,
}: {
  galleries:   ClubGalleryData[]
  submissions: SubmissionOption[]
}) {
  const [createOpen,   setCreateOpen]   = useState(false)
  const [editGallery,  setEditGallery]  = useState<ClubGalleryData | null>(null)
  const [delGallery,   setDelGallery]   = useState<ClubGalleryData | null>(null)
  const [detailId,     setDetailId]     = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const active   = galleries.filter(g => !g.archived_at)
  const archived = galleries.filter(g => g.archived_at)
  const detail   = detailId ? galleries.find(g => g.id === detailId) ?? null : null

  if (detail) {
    return (
      <GalleryDetail
        gallery={detail}
        submissions={submissions}
        onEdit={() => setEditGallery(detail)}
        onRemove={() => setDelGallery(detail)}
        onBack={() => setDetailId(null)}
      />
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Club galleries</Typography>
          <Typography variant="body2" color="text.secondary">
            Curated collections published to members and the public.
          </Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          New gallery
        </Button>
      </Box>

      {/* Active galleries */}
      {active.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, border: '1px dashed var(--border-default)', borderRadius: 2, mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No galleries yet.</Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Create first gallery
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 2, mb: 3 }}>
          {active.map(g => (
            <Box
              key={g.id}
              sx={{
                border: '1px solid var(--border-default)',
                borderRadius: 2,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'box-shadow 0.15s',
                '&:hover': { boxShadow: 2 },
              }}
              onClick={() => setDetailId(g.id)}
            >
              <Box sx={{ aspectRatio: '3/2', bgcolor: 'var(--surface-1)', position: 'relative' }}>
                {g.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.coverUrl} alt={g.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" color="text.disabled">No images</Typography>
                  </Box>
                )}
                {g.featured_on_homepage && (
                  <StarIcon sx={{ position: 'absolute', top: 8, left: 8, fontSize: 16, color: '#FFC107' }} />
                )}
              </Box>
              <Box sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, flex: 1 }} noWrap>{g.name}</Typography>
                  <Box onClick={e => e.stopPropagation()} sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => setEditGallery(g)}><EditOutlinedIcon sx={{ fontSize: 14 }} /></IconButton>
                    </Tooltip>
                    <Tooltip title="Archive or delete">
                      <IconButton size="small" onClick={() => setDelGallery(g)}><ArchiveOutlinedIcon sx={{ fontSize: 14 }} /></IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {g.imageCount} image{g.imageCount !== 1 ? 's' : ''} · {g.visibility === 'public' ? 'Public' : 'Members'}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Archived section */}
      {archived.length > 0 && (
        <Box>
          <Button
            size="small"
            variant="text"
            color="secondary"
            onClick={() => setShowArchived(v => !v)}
            sx={{ mb: 1 }}
          >
            {showArchived ? 'Hide' : 'Show'} archived ({archived.length})
          </Button>
          {showArchived && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 2, opacity: 0.6 }}>
              {archived.map(g => (
                <Box key={g.id} sx={{ border: '1px solid var(--border-default)', borderRadius: 2, p: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 14, flex: 1 }} noWrap>{g.name}</Typography>
                    <Tooltip title="Delete permanently">
                      <IconButton size="small" color="error" onClick={() => setDelGallery(g)}>
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="caption" color="text.secondary">Archived</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Dialogs */}
      <GalleryMetaDialog gallery={null} open={createOpen} onClose={() => setCreateOpen(false)} />
      {editGallery && <GalleryMetaDialog gallery={editGallery} open onClose={() => setEditGallery(null)} />}
      <ArchiveDeleteDialog gallery={delGallery} onClose={() => setDelGallery(null)} />
    </Box>
  )
}

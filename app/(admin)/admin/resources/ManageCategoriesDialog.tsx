'use client'

import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import {
  Lock,
  DragHandle,
  MoreHoriz,
  KeyboardArrowUp,
  KeyboardArrowDown,
} from '@mui/icons-material'
import type { ResourceCategory, ResourceCategoryLayout, Resource } from './actions'
import {
  upsertCategory,
  deleteCategory,
  reorderCategories,
} from './actions'

export default function ManageCategoriesDialog({
  open,
  onClose,
  categories:     initialCategories,
  resources,
  onCategoriesChange,
}: {
  open:               boolean
  onClose:            () => void
  categories:         ResourceCategory[]
  resources:          Resource[]
  onCategoriesChange: (cats: ResourceCategory[]) => void
}) {
  const [cats, setCats]       = useState(initialCategories)
  const [newName, setNewName] = useState('')
  const [adding, setAdding]   = useState(false)
  const [editId, setEditId]   = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  function countInCategory(catId: string) {
    return resources.filter(r => r.category_id === catId).length
  }

  async function handleAdd() {
    if (!newName.trim()) return
    setAdding(true)
    const { error } = await upsertCategory({ name: newName.trim() })
    if (!error) {
      window.location.reload()
    }
    setAdding(false)
  }

  async function handleRename(cat: ResourceCategory) {
    if (!editName.trim() || editName.trim() === cat.name) {
      setEditId(null)
      return
    }
    await upsertCategory({ id: cat.id, name: editName.trim() })
    window.location.reload()
  }

  async function handleLayoutChange(cat: ResourceCategory, layout: ResourceCategoryLayout) {
    await upsertCategory({ id: cat.id, name: cat.name, layout })
    const updated = cats.map(c => c.id === cat.id ? { ...c, layout } : c)
    setCats(updated)
    onCategoriesChange(updated)
  }

  async function handleVisibilityChange(cat: ResourceCategory, visible: boolean) {
    await upsertCategory({ id: cat.id, name: cat.name, is_visible: visible })
    const updated = cats.map(c => c.id === cat.id ? { ...c, is_visible: visible } : c)
    setCats(updated)
    onCategoriesChange(updated)
  }

  async function handleDelete(cat: ResourceCategory, moveToId?: string) {
    await deleteCategory(cat.id, moveToId)
    window.location.reload()
  }

  async function moveUp(index: number) {
    if (index <= 1) return // index 0 is system "Start here", can't move above it
    const newCats = [...cats]
    ;[newCats[index - 1], newCats[index]] = [newCats[index], newCats[index - 1]]
    setCats(newCats)
    onCategoriesChange(newCats)
    await reorderCategories(newCats.map(c => c.id))
  }

  async function moveDown(index: number) {
    if (index >= cats.length - 1) return
    if (cats[index].is_system) return // system category stays at top
    const newCats = [...cats]
    ;[newCats[index], newCats[index + 1]] = [newCats[index + 1], newCats[index]]
    setCats(newCats)
    onCategoriesChange(newCats)
    await reorderCategories(newCats.map(c => c.id))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Manage categories</DialogTitle>
      <DialogContent sx={{ px: 0, pb: 0 }}>
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          {/* Header row */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr 80px 180px 80px 48px',
            px: 2, py: 1,
            bgcolor: 'background.default',
          }}>
            {['', 'Category', 'Items', 'Layout', 'Visible', ''].map((h, i) => (
              <Typography key={i} sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {h}
              </Typography>
            ))}
          </Box>

          {cats.map((cat, index) => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              index={index}
              total={cats.length}
              itemCount={countInCategory(cat.id)}
              otherCats={cats.filter(c => c.id !== cat.id && !c.is_system)}
              isEditingName={editId === cat.id}
              editName={editName}
              onStartEdit={() => { setEditId(cat.id); setEditName(cat.name) }}
              onEditNameChange={setEditName}
              onCommitRename={() => handleRename(cat)}
              onLayoutChange={layout => handleLayoutChange(cat, layout)}
              onVisibilityChange={visible => handleVisibilityChange(cat, visible)}
              onDelete={moveToId => handleDelete(cat, moveToId)}
              onMoveUp={() => moveUp(index)}
              onMoveDown={() => moveDown(index)}
            />
          ))}
        </Box>

        {/* Add category */}
        <Box sx={{ px: 2, py: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="New category name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            disabled={!newName.trim() || adding}
            onClick={handleAdd}
          >
            Add
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Category row ──────────────────────────────────────────────────────────────

function CategoryRow({
  cat,
  index,
  total,
  itemCount,
  otherCats,
  isEditingName,
  editName,
  onStartEdit,
  onEditNameChange,
  onCommitRename,
  onLayoutChange,
  onVisibilityChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  cat:              ResourceCategory
  index:            number
  total:            number
  itemCount:        number
  otherCats:        ResourceCategory[]
  isEditingName:    boolean
  editName:         string
  onStartEdit:      () => void
  onEditNameChange: (v: string) => void
  onCommitRename:   () => void
  onLayoutChange:   (layout: ResourceCategoryLayout) => void
  onVisibilityChange: (visible: boolean) => void
  onDelete:         (moveToId?: string) => void
  onMoveUp:         () => void
  onMoveDown:       () => void
}) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [moveTo, setMoveTo]         = useState('')

  const LAYOUTS: Array<{ value: ResourceCategoryLayout; label: string }> = [
    { value: 'auto',           label: 'Auto' },
    { value: 'list',           label: 'List' },
    { value: 'video_grid',     label: 'Video grid' },
    { value: 'link_cards',     label: 'Link cards' },
    { value: 'featured_cards', label: 'Featured cards' },
  ]

  const isFirst = index === 0
  const isLast  = index === total - 1

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '36px 1fr 80px 180px 80px 48px',
          alignItems: 'center',
          px: 2,
          py: 0.75,
          minHeight: 52,
          borderBottom: '1px solid',
          borderColor: 'divider',
          '&:last-child': { borderBottom: 0 },
          bgcolor: cat.is_system ? 'action.selected' : undefined,
          opacity: cat.is_visible ? 1 : 0.65,
        }}
      >
        {/* Handle / lock */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {cat.is_system ? (
            <Lock sx={{ fontSize: 16, color: 'text.disabled' }} />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <IconButton size="small" disabled={isFirst || cats_isSecond(index)} onClick={onMoveUp} aria-label="Move category up" sx={{ p: 0.25 }}>
                <KeyboardArrowUp fontSize="small" />
              </IconButton>
              <IconButton size="small" disabled={isLast} onClick={onMoveDown} aria-label="Move category down" sx={{ p: 0.25 }}>
                <KeyboardArrowDown fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Name */}
        <Box>
          {cat.is_system ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{cat.name}</Typography>
              <Chip label="System" size="small" sx={{ fontSize: 10 }} />
            </Box>
          ) : isEditingName ? (
            <TextField
              size="small"
              value={editName}
              autoFocus
              onChange={e => onEditNameChange(e.target.value)}
              onBlur={onCommitRename}
              onKeyDown={e => {
                if (e.key === 'Enter') onCommitRename()
                if (e.key === 'Escape') onEditNameChange(cat.name)
              }}
              sx={{ '& .MuiInputBase-input': { fontSize: 14 } }}
            />
          ) : (
            <Typography
              sx={{ fontSize: 14, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
              onClick={onStartEdit}
            >
              {cat.name}
            </Typography>
          )}
        </Box>

        {/* Item count */}
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{itemCount}</Typography>

        {/* Layout */}
        <FormControl size="small" disabled={cat.is_system}>
          <Select
            value={cat.is_system ? 'featured_cards' : cat.layout}
            onChange={e => onLayoutChange(e.target.value as ResourceCategoryLayout)}
            sx={{ fontSize: 13 }}
          >
            {LAYOUTS.map(l => (
              <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Visible switch */}
        <Switch
          size="small"
          checked={cat.is_visible}
          disabled={cat.is_system}
          onChange={e => onVisibilityChange(e.target.checked)}
          slotProps={{ input: { 'aria-label': `${cat.name} visibility` } }}
        />

        {/* Actions */}
        <Box>
          {!cat.is_system && (
            <>
              <IconButton
                size="small"
                aria-label={`${cat.name} options`}
                onClick={e => setMenuAnchor(e.currentTarget)}
              >
                <MoreHoriz fontSize="small" />
              </IconButton>
              <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                <MenuItem onClick={() => { setMenuAnchor(null); onStartEdit() }}>Rename</MenuItem>
                <MenuItem
                  sx={{ color: 'error.main' }}
                  onClick={() => { setMenuAnchor(null); setDeleteOpen(true) }}
                >
                  Delete
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Box>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete &ldquo;{cat.name}&rdquo;?</DialogTitle>
        <DialogContent>
          {itemCount > 0 ? (
            <Box>
              <Typography sx={{ fontSize: 14, mb: 1.5 }}>
                This category has {itemCount} resource{itemCount > 1 ? 's' : ''}. Move them to another category before deleting.
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Move items to</InputLabel>
                <Select
                  value={moveTo}
                  label="Move items to"
                  onChange={e => setMoveTo(e.target.value)}
                >
                  {otherCats.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          ) : (
            <Typography sx={{ fontSize: 14 }}>
              Are you sure? This cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={itemCount > 0 && !moveTo}
            onClick={() => { setDeleteOpen(false); onDelete(moveTo || undefined) }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// Helper to check if index is the second item (first non-system)
function cats_isSecond(index: number) {
  return index === 1
}

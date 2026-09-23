'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import {
  Add,
  PictureAsPdf,
  Description,
  PlayCircle,
  Link as LinkIcon,
  KeyboardArrowDown,
  KeyboardArrowRight,
  MoreHoriz,
  PushPin,
  Search,
  WarningAmber,
  Public,
  Group,
  AdminPanelSettings,
} from '@mui/icons-material'
import type { ResourceCategory, Resource, ResourceSourceType } from './actions'
import {
  publishResource,
  unpublishResource,
  deleteResource,
  pinResource,
  unpinResource,
} from './actions'
import ManageCategoriesDialog from './ManageCategoriesDialog'

// ── Types ────────────────────────────────────────────────────────────────────

type Filter = {
  search:   string
  category: string
  type:     string
  status:   string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function mimeToType(resource: Resource): string {
  if (resource.source_type === 'video') return 'Video'
  if (resource.source_type === 'link')  return 'Link'
  const mime = resource.file_mime ?? ''
  if (mime.includes('pdf'))           return 'PDF'
  if (mime.includes('word') || mime.includes('opentext') || mime.endsWith('.doc') || mime.endsWith('.docx')) return 'Word'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'PowerPoint'
  return 'File'
}

function TypeIcon({ resource }: { resource: Resource }) {
  const t = mimeToType(resource)
  const sx = { fontSize: 18 }
  if (t === 'PDF')        return <PictureAsPdf sx={{ ...sx, color: '#D32F2F' }} />
  if (t === 'Video')      return <PlayCircle   sx={{ ...sx, color: '#1565C0' }} />
  if (t === 'Link')       return <LinkIcon     sx={{ ...sx, color: '#00796B' }} />
  return <Description sx={{ ...sx, color: '#5A6C82' }} />
}

function VisibilityIcon({ vis }: { vis: Resource['visibility'] }) {
  if (vis === 'public') return <Public sx={{ fontSize: 14, color: 'text.secondary' }} />
  if (vis === 'board')  return <AdminPanelSettings sx={{ fontSize: 14, color: 'text.secondary' }} />
  return <Group sx={{ fontSize: 14, color: 'text.secondary' }} />
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

// ── Resource row actions menu ─────────────────────────────────────────────

function ResourceRowMenu({
  resource,
  pinnedCount,
  onRefresh,
  clubSlug,
}: {
  resource:    Resource
  pinnedCount: number
  onRefresh:   () => void
  clubSlug:    string
}) {
  const [anchor, setAnchor]     = useState<null | HTMLElement>(null)
  const [delOpen, setDelOpen]   = useState(false)
  const [loading, setLoading]   = useState(false)

  function close() { setAnchor(null) }

  async function run(fn: () => Promise<{ error: string | null }>) {
    setLoading(true)
    close()
    await fn()
    setLoading(false)
    onRefresh()
  }

  const canPin = !resource.is_pinned && pinnedCount < 3

  return (
    <>
      <IconButton
        size="small"
        aria-label="Resource actions"
        onClick={e => setAnchor(e.currentTarget)}
        disabled={loading}
        sx={{ color: 'text.secondary' }}
      >
        <MoreHoriz fontSize="small" />
      </IconButton>

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        <MenuItem component={Link} href={`/${clubSlug}/admin/resources/${resource.id}`} onClick={close}>
          Edit
        </MenuItem>

        {resource.status === 'published' ? (
          <MenuItem onClick={() => run(() => unpublishResource(resource.id))}>
            Unpublish
          </MenuItem>
        ) : (
          <MenuItem onClick={() => run(() => publishResource(resource.id))}>
            Publish
          </MenuItem>
        )}

        {resource.is_pinned ? (
          <MenuItem onClick={() => run(() => unpinResource(resource.id))}>
            Unpin from Start here
          </MenuItem>
        ) : (
          <MenuItem disabled={!canPin} onClick={() => run(() => pinResource(resource.id))}>
            Pin to Start here {!canPin && !resource.is_pinned ? '(max 3)' : ''}
          </MenuItem>
        )}

        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => { close(); setDelOpen(true) }}
        >
          Delete
        </MenuItem>
      </Menu>

      {/* Delete confirmation */}
      <Dialog open={delOpen} onClose={() => setDelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete resource?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete &ldquo;{resource.title}&rdquo;? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="secondary" onClick={() => setDelOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              setDelOpen(false)
              run(() => deleteResource(resource.id))
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// ── Status chip ───────────────────────────────────────────────────────────────

function StatusChip({ resource }: { resource: Resource }) {
  const today = new Date().toISOString().split('T')[0]
  const reviewDue = resource.review_on && resource.review_on <= today

  if (resource.link_status === 'broken') {
    return <Chip label="Link broken" size="small" sx={{ bgcolor: 'error.light', color: 'error.contrastText', fontSize: 11 }} />
  }
  if (reviewDue) {
    return <Chip label="Review due" size="small" sx={{ bgcolor: 'warning.light', color: 'warning.contrastText', fontSize: 11 }} />
  }
  if (resource.status === 'published') {
    return <Chip label="Published" size="small" sx={{ bgcolor: 'success.light', color: 'success.contrastText', fontSize: 11 }} />
  }
  return <Chip label="Draft" size="small" sx={{ bgcolor: 'background.default', color: 'text.secondary', fontSize: 11 }} />
}

// ── Main component ────────────────────────────────────────────────────────────

const COL_HEAD: object = {
  fontSize: 11, fontWeight: 600, color: 'text.secondary',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  py: 1, px: 1.5, whiteSpace: 'nowrap',
}

const COL_CELL: object = {
  fontSize: 13, py: 1, px: 1.5,
  borderBottom: '1px solid',
  borderColor: 'divider',
}

export default function ResourcesClient({
  categories: initialCategories,
  resources:  initialResources,
  clubSlug,
}: {
  categories: ResourceCategory[]
  resources:  Resource[]
  clubSlug:   string
}) {
  const [categories, setCategories] = useState(initialCategories)
  const [resources,  setResources]  = useState(initialResources)
  const [filter,     setFilter]     = useState<Filter>({ search: '', category: '', type: '', status: '' })
  const [collapsed,  setCollapsed]  = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem('resources-collapsed') ?? '{}') } catch { return {} }
  })
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [attentionOnly, setAttentionOnly] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const pinnedCount = resources.filter(r => r.is_pinned).length

  // Attention items
  const brokenCount = resources.filter(r => r.link_status === 'broken').length
  const reviewCount = resources.filter(r => r.review_on && r.review_on <= today).length
  const attentionCount = brokenCount + reviewCount

  function needsAttention(r: Resource) {
    return r.link_status === 'broken' || (!!r.review_on && r.review_on <= today)
  }

  // Filter
  const filtered = useMemo(() => {
    let list = [...resources]
    if (attentionOnly) list = list.filter(needsAttention)
    if (filter.search) {
      const q = filter.search.toLowerCase()
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.url_host?.toLowerCase().includes(q)
      )
    }
    if (filter.category) list = list.filter(r => r.category_id === filter.category)
    if (filter.type) list = list.filter(r => mimeToType(r) === filter.type)
    if (filter.status === 'Published')    list = list.filter(r => r.status === 'published')
    if (filter.status === 'Draft')        list = list.filter(r => r.status === 'draft')
    if (filter.status === 'Review due')   list = list.filter(r => r.review_on && r.review_on <= today)
    if (filter.status === 'Link broken')  list = list.filter(r => r.link_status === 'broken')
    return list
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resources, filter, attentionOnly])

  // Group by category
  const pinned = filtered.filter(r => r.is_pinned).sort((a, b) => (a.pinned_order ?? 0) - (b.pinned_order ?? 0))

  function toggleCollapse(id: string) {
    setCollapsed(prev => {
      const next = { ...prev, [id]: !prev[id] }
      try { localStorage.setItem('resources-collapsed', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  const handleRefresh = useCallback(() => {
    // Reload the page to get fresh data
    window.location.reload()
  }, [])

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h1" sx={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.015em', color: 'text.primary' }}>
            Resources
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: 13, color: 'text.secondary' }}>
            Order here is the order members see.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setCatDialogOpen(true)}
          >
            Manage categories
          </Button>
          <Button
            variant="contained"
            component={Link}
            href={`/${clubSlug}/admin/resources/new`}
            startIcon={<Add />}
          >
            Add resource
          </Button>
        </Box>
      </Box>

      {/* Attention banner */}
      {attentionCount > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 2, fontSize: 13 }}
          action={
            <Button
              size="small"
              color="inherit"
              onClick={() => setAttentionOnly(v => !v)}
              sx={{ fontSize: 12, whiteSpace: 'nowrap' }}
            >
              {attentionOnly ? 'Show all' : 'Show only these'}
            </Button>
          }
        >
          <strong>{attentionCount} items need attention</strong>
          {brokenCount > 0 && ` · ${brokenCount} broken link${brokenCount > 1 ? 's' : ''}`}
          {reviewCount > 0 && ` · ${reviewCount} past review date`}
        </Alert>
      )}

      {/* Search + filters */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search resources…"
          value={filter.search}
          onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 220 }}
        />
        <Select
          size="small"
          displayEmpty
          value={filter.category}
          onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
          sx={{ minWidth: 160, fontSize: 13 }}
        >
          <MenuItem value="">All categories</MenuItem>
          {categories.map(c => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          displayEmpty
          value={filter.type}
          onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
          sx={{ minWidth: 130, fontSize: 13 }}
        >
          <MenuItem value="">All types</MenuItem>
          {['PDF', 'Word', 'PowerPoint', 'Video', 'Link'].map(t => (
            <MenuItem key={t} value={t}>{t}</MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          displayEmpty
          value={filter.status}
          onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          sx={{ minWidth: 130, fontSize: 13 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {['Published', 'Draft', 'Review due', 'Link broken'].map(s => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </Select>
      </Box>

      {/* Table */}
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>

        {/* Start here (pinned) */}
        {pinned.length > 0 && (
          <Box>
            <Box sx={{
              display: 'grid', gridTemplateColumns: '1fr auto',
              px: 2, py: 1, bgcolor: 'background.default',
              borderBottom: '1px solid', borderColor: 'divider',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PushPin sx={{ fontSize: 15, color: 'text.secondary' }} />
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Start here
                </Typography>
                <Chip label={`${pinned.length} pinned`} size="small" sx={{ fontSize: 11 }} />
              </Box>
            </Box>
            {pinned.map(r => (
              <ResourceRow key={r.id} resource={r} pinnedCount={pinnedCount} onRefresh={handleRefresh} clubSlug={clubSlug} />
            ))}
          </Box>
        )}

        {/* Category groups */}
        {categories.filter(c => !c.is_system).map(cat => {
          const items   = filtered.filter(r => r.category_id === cat.id)
          const isOpen  = !collapsed[cat.id]
          const layoutLabel = cat.layout === 'auto' ? 'Auto' :
            cat.layout === 'list'           ? 'List' :
            cat.layout === 'video_grid'     ? 'Video grid' :
            cat.layout === 'link_cards'     ? 'Link cards' : 'Featured cards'

          return (
            <Box key={cat.id}>
              <Box
                sx={{
                  display: 'grid', gridTemplateColumns: '1fr auto',
                  px: 2, py: 1,
                  bgcolor: 'background.default',
                  borderBottom: '1px solid', borderColor: 'divider',
                  cursor: 'pointer',
                  opacity: cat.is_visible ? 1 : 0.6,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => toggleCollapse(cat.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isOpen ? (
                    <KeyboardArrowDown sx={{ fontSize: 16, color: 'text.secondary' }} />
                  ) : (
                    <KeyboardArrowRight sx={{ fontSize: 16, color: 'text.secondary' }} />
                  )}
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {cat.name}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </Typography>
                  {!cat.is_visible && (
                    <Chip label="Hidden" size="small" sx={{ fontSize: 10 }} />
                  )}
                </Box>
                <Typography sx={{ fontSize: 12, color: 'text.disabled', alignSelf: 'center' }}>
                  Shown as: {layoutLabel}
                </Typography>
              </Box>

              {isOpen && (
                <>
                  {items.length === 0 ? (
                    <Box sx={{ px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography sx={{ fontSize: 13, color: 'text.disabled', fontStyle: 'italic' }}>
                        No resources yet
                      </Typography>
                    </Box>
                  ) : (
                    items.map(r => (
                      <ResourceRow key={r.id} resource={r} pinnedCount={pinnedCount} onRefresh={handleRefresh} clubSlug={clubSlug} />
                    ))
                  )}
                </>
              )}
            </Box>
          )
        })}

        {categories.length === 0 && (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>No categories yet</Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>
              Click &ldquo;Manage categories&rdquo; to get started.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Column headers (hidden row for accessibility) */}

      {/* Manage categories dialog */}
      <ManageCategoriesDialog
        open={catDialogOpen}
        onClose={() => setCatDialogOpen(false)}
        categories={categories}
        resources={resources}
        onCategoriesChange={setCategories}
      />
    </Box>
  )
}

// ── Resource row ──────────────────────────────────────────────────────────────

function ResourceRow({
  resource,
  pinnedCount,
  onRefresh,
  clubSlug,
}: {
  resource:    Resource
  pinnedCount: number
  onRefresh:   () => void
  clubSlug:    string
}) {
  const typeName = mimeToType(resource)

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 80px 90px 110px 90px 50px 48px',
        alignItems: 'center',
        px: 1.5,
        minHeight: 44,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:hover': { bgcolor: 'action.hover' },
        '&:last-child': { borderBottom: 0 },
      }}
    >
      {/* Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden', py: 0.75 }}>
        <TypeIcon resource={resource} />
        <Box sx={{ overflow: 'hidden' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {resource.title}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {resource.url_host ?? resource.file_name ?? ''}
            {resource.file_size ? ` · ${formatBytes(resource.file_size)}` : ''}
          </Typography>
        </Box>
      </Box>

      {/* Type */}
      <Box sx={COL_CELL}>
        <Chip label={typeName} size="small" sx={{ fontSize: 11 }} />
      </Box>

      {/* Visibility */}
      <Box sx={{ ...COL_CELL, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <VisibilityIcon vis={resource.visibility} />
        <Typography sx={{ fontSize: 12, color: 'text.secondary', textTransform: 'capitalize' }}>
          {resource.visibility}
        </Typography>
      </Box>

      {/* Status */}
      <Box sx={COL_CELL}>
        <StatusChip resource={resource} />
      </Box>

      {/* Updated */}
      <Box sx={COL_CELL}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>
          {new Date(resource.updated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
        </Typography>
      </Box>

      {/* Views */}
      <Box sx={{ ...COL_CELL, textAlign: 'right' }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          {resource.view_count}
        </Typography>
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
        <ResourceRowMenu resource={resource} pinnedCount={pinnedCount} onRefresh={onRefresh} clubSlug={clubSlug} />
      </Box>
    </Box>
  )
}

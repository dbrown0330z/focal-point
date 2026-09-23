'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  CircularProgress,
  Chip,
} from '@mui/material'
import {
  UploadFile,
  Link as LinkIcon,
  PlayCircle,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material'
import { createClient } from '@/lib/supabase/client'
import type { ResourceCategory, Resource } from './actions'
import {
  createResource,
  updateResource,
  publishResource,
  unpublishResource,
  getUploadUrl,
  fetchOgData,
  fetchVideoMeta,
} from './actions'

// ── Types ────────────────────────────────────────────────────────────────────

type SourceType = 'file' | 'link' | 'video'
type Visibility = 'public' | 'members' | 'board'

type FormState = {
  sourceType:    SourceType
  title:         string
  description:   string
  categoryId:    string
  author:        string
  visibility:    Visibility
  isPinned:      boolean
  showNewBadge:  boolean
  reviewOn:      string
  // file
  filePath:      string
  fileName:      string
  fileMime:      string
  fileSize:      number | null
  // link
  url:           string
  urlHost:       string
  // video
  videoProvider: string
  videoId:       string
  thumbnailUrl:  string
}

const ACCEPT_MIME = '.pdf,.doc,.docx,.ppt,.pptx'
const MAX_BYTES   = 25 * 1024 * 1024 // 25 MB

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractHost(url: string): string {
  try { return new URL(url).hostname } catch { return '' }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ResourceFormClient({
  categories,
  existing,
  pinnedCount,
}: {
  categories:  ResourceCategory[]
  existing?:   Resource
  pinnedCount: number
}) {
  const router = useRouter()

  const [form, setForm] = useState<FormState>(() => ({
    sourceType:    (existing?.source_type as SourceType) ?? 'file',
    title:         existing?.title         ?? '',
    description:   existing?.description   ?? '',
    categoryId:    existing?.category_id   ?? '',
    author:        existing?.author        ?? '',
    visibility:    (existing?.visibility as Visibility) ?? 'members',
    isPinned:      existing?.is_pinned     ?? false,
    showNewBadge:  existing?.show_new_badge ?? true,
    reviewOn:      existing?.review_on     ?? '',
    filePath:      existing?.file_path     ?? '',
    fileName:      existing?.file_name     ?? '',
    fileMime:      existing?.file_mime     ?? '',
    fileSize:      existing?.file_size     ?? null,
    url:           existing?.url           ?? '',
    urlHost:       existing?.url_host      ?? '',
    videoProvider: existing?.video_provider ?? '',
    videoId:       existing?.video_id      ?? '',
    thumbnailUrl:  existing?.thumbnail_url ?? '',
  }))

  const [uploadState, setUploadState]   = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [uploadError, setUploadError]   = useState<string | null>(null)
  const [ogLoading, setOgLoading]       = useState(false)
  const [videoMeta, setVideoMeta]       = useState<string | null>(null)
  const [videoMetaError, setVideoMetaError] = useState<string | null>(null)
  const [saving, setSaving]             = useState(false)
  const [saveError, setSaveError]       = useState<string | null>(null)
  const [newCatName, setNewCatName]     = useState('')
  const [addingCat, setAddingCat]       = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // ── File upload ─────────────────────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_BYTES) {
      setUploadError(`File is too large (max 25 MB). This file is ${(file.size / 1048576).toFixed(1)} MB.`)
      return
    }

    setUploadState('uploading')
    setUploadError(null)

    const { path, token, error } = await getUploadUrl(file.name)
    if (error || !path) {
      setUploadState('error')
      setUploadError(error ?? 'Failed to get upload URL')
      return
    }

    const supabase = createClient()
    const { error: uploadErr } = await supabase.storage
      .from('resources')
      .uploadToSignedUrl(path, token, file)

    if (uploadErr) {
      setUploadState('error')
      setUploadError(uploadErr.message)
      return
    }

    setUploadState('done')
    setForm(f => ({
      ...f,
      filePath: path,
      fileName: file.name,
      fileMime: file.type,
      fileSize: file.size,
      title:    f.title || file.name.replace(/\.[^.]+$/, ''),
    }))
  }

  // ── OG prefill ─────────────────────────────────────────────────────────

  async function handleUrlBlur() {
    if (!form.url) return
    set('urlHost', extractHost(form.url))
    if (form.title && form.description) return // don't overwrite filled fields
    setOgLoading(true)
    const { title, description } = await fetchOgData(form.url)
    setOgLoading(false)
    setForm(f => ({
      ...f,
      title:       f.title || title || f.title,
      description: f.description || description || f.description,
    }))
  }

  // ── Video meta ─────────────────────────────────────────────────────────

  async function handleVideoUrlBlur() {
    if (!form.url) return
    setVideoMeta(null)
    setVideoMetaError(null)
    const result = await fetchVideoMeta(form.url)
    if (result.error) {
      setVideoMetaError(result.error)
      return
    }
    setVideoMeta(result.title ? `Found on ${result.provider === 'youtube' ? 'YouTube' : 'Vimeo'} · "${result.title}"` : null)
    setForm(f => ({
      ...f,
      videoProvider: result.provider ?? f.videoProvider,
      videoId:       result.videoId  ?? f.videoId,
      thumbnailUrl:  result.thumbnail ?? f.thumbnailUrl,
      title:         f.title || result.title || f.title,
    }))
  }

  // ── Save ────────────────────────────────────────────────────────────────

  async function save(publish: boolean) {
    if (!form.title.trim() || !form.categoryId) {
      setSaveError('Title and category are required.')
      return
    }
    if (form.sourceType === 'file' && !form.filePath) {
      setSaveError('Please upload a file.')
      return
    }
    if ((form.sourceType === 'link' || form.sourceType === 'video') && !form.url) {
      setSaveError('Please enter a URL.')
      return
    }

    setSaving(true)
    setSaveError(null)

    const payload: Partial<Resource> = {
      source_type:   form.sourceType,
      title:         form.title.trim(),
      description:   form.description.trim() || null,
      category_id:   form.categoryId,
      author:        form.author.trim() || null,
      visibility:    form.visibility,
      is_pinned:     form.isPinned,
      show_new_badge: form.showNewBadge,
      review_on:     form.reviewOn || null,
      file_path:     form.filePath || null,
      file_name:     form.fileName || null,
      file_mime:     form.fileMime || null,
      file_size:     form.fileSize,
      url:           form.url || null,
      url_host:      form.urlHost || null,
      video_provider: (form.videoProvider as Resource['video_provider']) || null,
      video_id:      form.videoId || null,
      thumbnail_url: form.thumbnailUrl || null,
      status:        publish ? 'published' : 'draft',
      published_at:  publish ? new Date().toISOString() : (existing?.published_at ?? null),
    }

    let id = existing?.id
    if (id) {
      const { error } = await updateResource(id, payload)
      if (error) { setSaving(false); setSaveError(error); return }
    } else {
      const { id: newId, error } = await createResource(payload)
      if (error || !newId) { setSaving(false); setSaveError(error ?? 'Failed to create resource'); return }
      id = newId
    }

    setSaving(false)
    router.push('/admin/resources')
  }

  async function handleUnpublish() {
    if (!existing?.id) return
    setSaving(true)
    await unpublishResource(existing.id)
    setSaving(false)
    router.push('/admin/resources')
  }

  const canPin = form.isPinned || pinnedCount < 3

  return (
    <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
      {/* Main form */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>

        {saveError && (
          <Alert severity="error" onClose={() => setSaveError(null)}>{saveError}</Alert>
        )}

        {/* Section 1: Source */}
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 2 }}>Source</Typography>

          <RadioGroup
            row
            value={form.sourceType}
            onChange={e => set('sourceType', e.target.value as SourceType)}
            sx={{ gap: 1.5, mb: 2 }}
          >
            {([
              { value: 'file',  label: 'File upload',    Icon: UploadFile },
              { value: 'link',  label: 'Web link',       Icon: LinkIcon   },
              { value: 'video', label: 'Video (YouTube / Vimeo)', Icon: PlayCircle },
            ] as const).map(({ value, label, Icon }) => (
              <FormControlLabel
                key={value}
                value={value}
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Icon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography sx={{ fontSize: 14 }}>{label}</Typography>
                  </Box>
                }
                sx={{
                  border: '1px solid',
                  borderColor: form.sourceType === value ? 'primary.main' : 'divider',
                  borderRadius: 1.5,
                  m: 0,
                  px: 1.5,
                  py: 0.75,
                  flex: 1,
                }}
              />
            ))}
          </RadioGroup>

          {/* File upload */}
          {form.sourceType === 'file' && (
            <Box>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_MIME}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              {form.filePath ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{form.fileName}</Typography>
                    {form.fileSize && (
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                        {(form.fileSize / 1048576).toFixed(1)} MB
                      </Typography>
                    )}
                  </Box>
                  <Button size="small" variant="outlined" color="secondary" onClick={() => fileInputRef.current?.click()}>
                    Replace file
                  </Button>
                </Box>
              ) : (
                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: uploadState === 'error' ? 'error.main' : 'divider',
                    borderRadius: 1.5,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadState === 'uploading' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={24} />
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Uploading…</Typography>
                    </Box>
                  ) : (
                    <Box>
                      <UploadFile sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                      <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                        Click to choose a file
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                        PDF, Word, PowerPoint · max 25 MB
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              {uploadError && (
                <Alert severity="error" sx={{ mt: 1, fontSize: 13 }}>{uploadError}</Alert>
              )}
            </Box>
          )}

          {/* Link */}
          {form.sourceType === 'link' && (
            <Box>
              <TextField
                fullWidth
                size="small"
                label="URL"
                placeholder="https://…"
                value={form.url}
                onChange={e => set('url', e.target.value)}
                onBlur={handleUrlBlur}
                slotProps={{
                  input: {
                    endAdornment: ogLoading ? <CircularProgress size={16} /> : undefined,
                  },
                }}
              />
              {ogLoading && (
                <Typography sx={{ mt: 0.75, fontSize: 12, color: 'text.secondary' }}>
                  Fetching page info…
                </Typography>
              )}
            </Box>
          )}

          {/* Video */}
          {form.sourceType === 'video' && (
            <Box>
              <TextField
                fullWidth
                size="small"
                label="YouTube or Vimeo URL"
                placeholder="https://www.youtube.com/watch?v=…"
                value={form.url}
                onChange={e => set('url', e.target.value)}
                onBlur={handleVideoUrlBlur}
              />
              {videoMeta && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{videoMeta}</Typography>
                </Box>
              )}
              {videoMetaError && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} />
                  <Typography sx={{ fontSize: 13, color: 'error.main' }}>{videoMetaError}</Typography>
                </Box>
              )}
            </Box>
          )}
        </Paper>

        {/* Section 2: Details */}
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 2 }}>Details</Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Title *"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              slotProps={{ htmlInput: { maxLength: 120 } }}
            />

            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Short description"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                slotProps={{ htmlInput: { maxLength: 160 } }}
              />
              <Typography sx={{ fontSize: 11, color: form.description.length >= 150 ? 'warning.main' : 'text.disabled', position: 'absolute', bottom: 6, right: 8 }}>
                {form.description.length}/160
              </Typography>
            </Box>

            <FormControl size="small" required>
              <InputLabel>Category *</InputLabel>
              <Select
                value={form.categoryId}
                label="Category *"
                onChange={e => {
                  if (e.target.value === '__new__') {
                    setAddingCat(true)
                    return
                  }
                  set('categoryId', e.target.value)
                }}
              >
                {categories.filter(c => !c.is_system).map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
                <MenuItem value="__new__" sx={{ fontStyle: 'italic', color: 'primary.main' }}>
                  New category…
                </MenuItem>
              </Select>
            </FormControl>

            {addingCat && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 1 }}>
                <TextField
                  size="small"
                  label="New category name"
                  value={newCatName}
                  autoFocus
                  onChange={e => setNewCatName(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={async () => {
                    if (!newCatName.trim()) return
                    const { upsertCategory } = await import('./actions')
                    const { error } = await upsertCategory({ name: newCatName.trim() })
                    if (!error) window.location.reload()
                    setAddingCat(false)
                  }}
                >
                  Add
                </Button>
                <Button size="small" variant="outlined" color="secondary" onClick={() => setAddingCat(false)}>
                  Cancel
                </Button>
              </Box>
            )}

            <TextField
              fullWidth
              size="small"
              label="Author (optional)"
              value={form.author}
              onChange={e => set('author', e.target.value)}
            />
          </Box>
        </Paper>

        {/* Section 3: Visibility */}
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <FormLabel component="legend" sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary', mb: 1.5 }}>
            Visibility
          </FormLabel>
          <RadioGroup
            row
            value={form.visibility}
            onChange={e => set('visibility', e.target.value as Visibility)}
            sx={{ gap: 1.5 }}
          >
            {([
              { value: 'public',  label: 'Public',         sub: 'Anyone can see' },
              { value: 'members', label: 'Members',         sub: 'Logged-in members only' },
              { value: 'board',   label: 'Board',           sub: 'Board members only' },
            ] as const).map(({ value, label, sub }) => (
              <FormControlLabel
                key={value}
                value={value}
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{sub}</Typography>
                  </Box>
                }
                sx={{
                  border: '1px solid',
                  borderColor: form.visibility === value ? 'primary.main' : 'divider',
                  borderRadius: 1.5,
                  m: 0,
                  px: 1.5,
                  py: 1,
                  flex: 1,
                }}
              />
            ))}
          </RadioGroup>
        </Paper>

        {/* Section 4: Options */}
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 2 }}>Options</Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={form.isPinned}
                  disabled={!canPin}
                  onChange={e => set('isPinned', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontSize: 14 }}>Pin to Start here</Typography>
                  {!canPin && (
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                      Maximum 3 resources can be pinned
                    </Typography>
                  )}
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={form.showNewBadge}
                  onChange={e => set('showNewBadge', e.target.checked)}
                />
              }
              label={<Typography sx={{ fontSize: 14 }}>Show &ldquo;New&rdquo; badge</Typography>}
            />

            <Box>
              <Typography sx={{ fontSize: 14, mb: 0.75 }}>Review reminder</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  type="date"
                  value={form.reviewOn}
                  onChange={e => set('reviewOn', e.target.value)}
                  sx={{ width: 160 }}
                  slotProps={{ htmlInput: { 'aria-label': 'Review reminder date' } }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    const d = new Date()
                    d.setMonth(d.getMonth() + 6)
                    set('reviewOn', d.toISOString().split('T')[0])
                  }}
                >
                  6 months
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    const d = new Date()
                    d.setFullYear(d.getFullYear() + 1)
                    set('reviewOn', d.toISOString().split('T')[0])
                  }}
                >
                  1 year
                </Button>
                {form.reviewOn && (
                  <Button size="small" color="secondary" onClick={() => set('reviewOn', '')}>
                    Clear
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Footer actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 4 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => router.push('/admin/resources')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {existing?.status === 'published' && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleUnpublish}
                disabled={saving}
              >
                Unpublish
              </Button>
            )}
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => save(false)}
              disabled={saving}
            >
              {saving ? <CircularProgress size={18} /> : (existing ? 'Save changes' : 'Save draft')}
            </Button>
            <Button
              variant="contained"
              onClick={() => save(true)}
              disabled={saving}
            >
              {existing?.status === 'published' ? 'Save & keep published' : 'Publish'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Right sidebar summary */}
      <Box sx={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
            Summary
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <SummaryRow label="Type" value={form.sourceType === 'file' ? 'File upload' : form.sourceType === 'video' ? 'Video' : 'Link'} />
            <SummaryRow label="Visibility" value={form.visibility} />
            <SummaryRow
              label="Status"
              value={
                existing?.status === 'published' ? (
                  <Chip label="Published" size="small" sx={{ bgcolor: 'success.light', color: 'success.contrastText', fontSize: 11 }} />
                ) : (
                  <Chip label="Draft" size="small" sx={{ bgcolor: 'background.default', color: 'text.secondary', fontSize: 11 }} />
                )
              }
            />
            {form.isPinned && <SummaryRow label="Pinned" value="Yes" />}
            {form.reviewOn && <SummaryRow label="Review on" value={form.reviewOn} />}
            {existing && <SummaryRow label="Views" value={String(existing.view_count)} />}
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{label}</Typography>
      {typeof value === 'string' ? (
        <Typography sx={{ fontSize: 12, fontWeight: 500, textTransform: 'capitalize' }}>{value}</Typography>
      ) : value}
    </Box>
  )
}

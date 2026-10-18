'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
} from '@mui/material'
import {
  CheckCircle,
  Error as ErrorIcon,
  Link as LinkIcon,
  UploadFile,
} from '@mui/icons-material'
import { createClient } from '@/lib/supabase/client'
import type { ResourceCategory, Resource } from './actions'
import {
  createResource,
  updateResource,
  unpublishResource,
  getUploadUrl,
  fetchOgData,
  fetchVideoMeta,
} from './actions'

// ── Types ────────────────────────────────────────────────────────────────────

type SourceType = 'file' | 'link'
type Visibility = 'public' | 'members' | 'board'

type FormState = {
  sourceType:    SourceType
  title:         string
  description:   string
  categoryId:    string
  visibility:    Visibility
  // file
  filePath:      string
  fileName:      string
  fileMime:      string
  fileSize:      number | null
  // link (covers web links + videos)
  url:           string
  urlHost:       string
  isVideo:       boolean
  videoProvider: string
  videoId:       string
  thumbnailUrl:  string
}

const ACCEPT_MIME = '.pdf,.doc,.docx,.ppt,.pptx'
const MAX_BYTES   = 25 * 1024 * 1024

function extractHost(url: string): string {
  try { return new URL(url).hostname } catch { return '' }
}

function looksLikeVideo(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url)
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ResourceFormClient({
  categories,
  existing,
  pinnedCount: _pinnedCount,
  clubSlug,
  initialCategoryId,
  onClose,
}: {
  categories:         ResourceCategory[]
  existing?:          Resource
  pinnedCount:        number
  clubSlug:           string
  initialCategoryId?: string
  onClose?:           () => void
}) {
  const router = useRouter()

  const existingSourceType: SourceType =
    existing?.source_type === 'video' || existing?.source_type === 'link' ? 'link' : 'file'

  const [form, setForm] = useState<FormState>(() => ({
    sourceType:    existingSourceType,
    title:         existing?.title         ?? '',
    description:   existing?.description   ?? '',
    categoryId:    existing?.category_id   ?? initialCategoryId ?? '',
    visibility:    (existing?.visibility as Visibility) ?? 'members',
    filePath:      existing?.file_path     ?? '',
    fileName:      existing?.file_name     ?? '',
    fileMime:      existing?.file_mime     ?? '',
    fileSize:      existing?.file_size     ?? null,
    url:           existing?.url           ?? '',
    urlHost:       existing?.url_host      ?? '',
    isVideo:       existing?.source_type   === 'video',
    videoProvider: existing?.video_provider ?? '',
    videoId:       existing?.video_id      ?? '',
    thumbnailUrl:  existing?.thumbnail_url ?? '',
  }))

  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [urlLoading,  setUrlLoading]  = useState(false)
  const [urlStatus,   setUrlStatus]   = useState<{ ok: boolean; msg: string } | null>(
    // for edit mode, show the URL host immediately
    existing?.url_host ? { ok: true, msg: existing.url_host } : null
  )
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function switchSource(type: SourceType) {
    setForm(f => ({
      ...f,
      sourceType: type,
      url: '', urlHost: '', isVideo: false, videoProvider: '', videoId: '', thumbnailUrl: '',
    }))
    setUrlStatus(null)
  }

  // ── File upload ─────────────────────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_BYTES) {
      setUploadError(`File too large (max 25 MB). This file is ${(file.size / 1048576).toFixed(1)} MB.`)
      return
    }
    setUploadState('uploading')
    setUploadError(null)
    const { path, token, error } = await getUploadUrl(file.name)
    if (error || !path) { setUploadState('error'); setUploadError(error ?? 'Failed to get upload URL'); return }
    const supabase = createClient()
    const { error: uploadErr } = await supabase.storage.from('resources').uploadToSignedUrl(path, token, file)
    if (uploadErr) { setUploadState('error'); setUploadError(uploadErr.message); return }
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

  // ── URL processing (auto-detects video vs link) ─────────────────────────

  async function handleUrlBlur() {
    const url = form.url.trim()
    if (!url) return
    const host = extractHost(url)
    set('urlHost', host)
    setUrlLoading(true)
    setUrlStatus(null)

    if (looksLikeVideo(url)) {
      const result = await fetchVideoMeta(url)
      setUrlLoading(false)
      if (result.error) {
        setUrlStatus({ ok: false, msg: result.error })
      } else {
        const providerLabel = result.provider === 'youtube' ? 'YouTube' : 'Vimeo'
        setUrlStatus({ ok: true, msg: providerLabel })
        setForm(f => ({
          ...f,
          isVideo:       true,
          videoProvider: result.provider   ?? f.videoProvider,
          videoId:       result.videoId    ?? f.videoId,
          thumbnailUrl:  result.thumbnail  ?? f.thumbnailUrl,
          title:         f.title || result.title || f.title,
          urlHost:       host,
        }))
      }
    } else {
      const { title, description } = await fetchOgData(url)
      setUrlLoading(false)
      setUrlStatus({ ok: true, msg: host })
      setForm(f => ({
        ...f,
        isVideo:     false,
        title:       f.title       || title       || f.title,
        description: f.description || description || f.description,
        urlHost:     host,
      }))
    }
  }

  // ── Save (always publishes) ─────────────────────────────────────────────

  async function save() {
    if (!form.title.trim() || !form.categoryId) {
      setSaveError('Title and category are required.')
      return
    }
    if (form.sourceType === 'file' && !form.filePath) {
      setSaveError('Please upload a file first.')
      return
    }
    if (form.sourceType === 'link' && !form.url) {
      setSaveError('Please enter a URL.')
      return
    }

    setSaving(true)
    setSaveError(null)

    const dbSourceType = form.isVideo ? 'video' : form.sourceType

    const payload: Partial<Resource> = {
      source_type:    dbSourceType,
      title:          form.title.trim(),
      description:    form.description.trim() || null,
      category_id:    form.categoryId,
      author:         existing?.author ?? null,
      visibility:     form.visibility,
      is_pinned:      existing?.is_pinned      ?? false,
      show_new_badge: existing?.show_new_badge ?? true,
      review_on:      existing?.review_on      ?? null,
      file_path:      form.filePath  || null,
      file_name:      form.fileName  || null,
      file_mime:      form.fileMime  || null,
      file_size:      form.fileSize,
      url:            form.url       || null,
      url_host:       form.urlHost   || null,
      video_provider: (form.videoProvider as Resource['video_provider']) || null,
      video_id:       form.videoId   || null,
      thumbnail_url:  form.thumbnailUrl || null,
      status:         'published',
      published_at:   existing?.published_at ?? new Date().toISOString(),
    }

    if (existing?.id) {
      const { error } = await updateResource(existing.id, payload)
      if (error) { setSaving(false); setSaveError(error); return }
    } else {
      const { id: _newId, error } = await createResource(payload)
      if (error) { setSaving(false); setSaveError(error ?? 'Failed to create resource'); return }
    }

    setSaving(false)
    if (onClose) { onClose() } else { router.push(`/${clubSlug}/admin/resources`) }
  }

  async function handleUnpublish() {
    if (!existing?.id) return
    setSaving(true)
    await unpublishResource(existing.id)
    setSaving(false)
    if (onClose) { onClose() } else { router.push(`/${clubSlug}/admin/resources`) }
  }

  // Whether to show the title/description section
  const showFileDetails = form.sourceType === 'file' && !!form.filePath
  const showLinkDetails = form.sourceType === 'link' && (!!form.urlHost || !!existing)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {saveError && <Alert severity="error" onClose={() => setSaveError(null)}>{saveError}</Alert>}

      {/* ── Source type ───────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <RadioGroup row value={form.sourceType} onChange={e => switchSource(e.target.value as SourceType)} sx={{ gap: 1.5 }}>
          {([
            { value: 'file' as const, label: 'File upload',     Icon: UploadFile },
            { value: 'link' as const, label: 'Link or video',   Icon: LinkIcon   },
          ]).map(({ value, label, Icon }) => (
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
                borderRadius: 1.5, m: 0, px: 1.5, py: 0.75, flex: 1,
              }}
            />
          ))}
        </RadioGroup>
      </Paper>

      {/* ── File upload ───────────────────────────────────────────────────── */}
      {form.sourceType === 'file' && (
        <Paper variant="outlined" sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <input ref={fileInputRef} type="file" accept={ACCEPT_MIME} style={{ display: 'none' }} onChange={handleFileChange} />

          {form.filePath ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{form.fileName}</Typography>
                {form.fileSize && (
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {(form.fileSize / 1048576).toFixed(1)} MB
                  </Typography>
                )}
              </Box>
              <Button size="small" variant="outlined" color="secondary" onClick={() => fileInputRef.current?.click()}>
                Replace
              </Button>
            </Box>
          ) : (
            <Box
              sx={{
                border: '2px dashed',
                borderColor: uploadState === 'error' ? 'error.main' : 'divider',
                borderRadius: 1.5, p: 3, textAlign: 'center', cursor: 'pointer',
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
                <>
                  <UploadFile sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>Click to choose a file</Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    PDF, Word, PowerPoint · max 25 MB
                  </Typography>
                </>
              )}
            </Box>
          )}

          {uploadError && <Alert severity="error" sx={{ fontSize: 13 }}>{uploadError}</Alert>}

          {showFileDetails && (
            <>
              <TextField
                fullWidth size="small" label="Title"
                value={form.title} onChange={e => set('title', e.target.value)}
                slotProps={{ htmlInput: { maxLength: 120 } }}
              />
              <Box sx={{ position: 'relative' }}>
                <TextField
                  fullWidth size="small" multiline rows={2} label="Short description (optional)"
                  value={form.description} onChange={e => set('description', e.target.value)}
                  slotProps={{ htmlInput: { maxLength: 160 } }}
                />
                <Typography sx={{ fontSize: 11, color: form.description.length >= 150 ? 'warning.main' : 'text.disabled', position: 'absolute', bottom: 6, right: 8 }}>
                  {form.description.length}/160
                </Typography>
              </Box>
            </>
          )}
        </Paper>
      )}

      {/* ── Link / video ──────────────────────────────────────────────────── */}
      {form.sourceType === 'link' && (
        <Paper variant="outlined" sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <TextField
              fullWidth size="small" label="URL" placeholder="https://…"
              value={form.url}
              onChange={e => { set('url', e.target.value); setUrlStatus(null) }}
              onBlur={handleUrlBlur}
              slotProps={{ input: { endAdornment: urlLoading ? <CircularProgress size={16} /> : undefined } }}
            />
            {!urlLoading && !urlStatus && (
              <Typography sx={{ mt: 0.75, fontSize: 12, color: 'text.secondary' }}>
                YouTube and Vimeo links are detected automatically.
              </Typography>
            )}
            {urlStatus && (
              <Box sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {urlStatus.ok
                  ? <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
                  : <ErrorIcon sx={{ fontSize: 14, color: 'error.main' }} />}
                <Typography sx={{ fontSize: 12, color: urlStatus.ok ? 'text.secondary' : 'error.main' }}>
                  {urlStatus.msg}
                </Typography>
              </Box>
            )}
          </Box>

          {showLinkDetails && !urlLoading && (
            <>
              {/* Preview — mirrors the exact VideoCard / LinkCard from the member view */}
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
                  Preview
                </Typography>
                <Box sx={{ maxWidth: 320 }}>
                  {form.isVideo ? (
                    /* VideoCard */
                    <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-default)', background: 'var(--surface-1)', width: '100%' }}>
                      <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--surface-0)', overflow: 'hidden' }}>
                        {form.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={form.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: 'var(--text-tertiary)' }}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {form.title || 'Untitled'}
                          </span>
                          {/* Always show NEW badge on new resources */}
                          {!existing && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 9999, padding: '2px 8px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--status-success)', background: 'rgba(46,125,50,0.10)', whiteSpace: 'nowrap' }}>
                              New
                            </span>
                          )}
                        </div>
                        {form.description && (
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                            {form.description}
                          </p>
                        )}
                        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-tertiary)' }}>
                          {form.videoProvider === 'youtube' ? 'YouTube' : 'Vimeo'}
                          {form.title && ' · '}
                          {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* LinkCard */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderRadius: 12, border: '1px solid var(--border-default)', background: 'var(--surface-1)', padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {form.title || 'Untitled'}
                        </span>
                        {!existing && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 9999, padding: '2px 8px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--status-success)', background: 'rgba(46,125,50,0.10)', whiteSpace: 'nowrap' }}>
                            New
                          </span>
                        )}
                      </div>
                      {form.description && (
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {form.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-tertiary)' }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        <span>{form.urlHost || 'External link'}</span>
                      </div>
                    </div>
                  )}
                </Box>
              </Box>

              {/* Editable fields */}
              <TextField
                fullWidth size="small" label="Title"
                value={form.title} onChange={e => set('title', e.target.value)}
                slotProps={{ htmlInput: { maxLength: 120 } }}
              />
              <Box sx={{ position: 'relative' }}>
                <TextField
                  fullWidth size="small" multiline rows={2} label="Short description (optional)"
                  value={form.description} onChange={e => set('description', e.target.value)}
                  slotProps={{ htmlInput: { maxLength: 160 } }}
                />
                <Typography sx={{ fontSize: 11, color: form.description.length >= 150 ? 'warning.main' : 'text.disabled', position: 'absolute', bottom: 6, right: 8 }}>
                  {form.description.length}/160
                </Typography>
              </Box>
            </>
          )}
        </Paper>
      )}

      {/* ── Category + Visibility ─────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <FormControl size="small" required>
          <InputLabel>Category *</InputLabel>
          <Select
            value={form.categoryId}
            label="Category *"
            onChange={e => set('categoryId', e.target.value)}
          >
            {categories.filter(c => !c.is_system).map(c => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box>
          <FormLabel sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.25 }}>
            Who can see this
          </FormLabel>
          <RadioGroup row value={form.visibility} onChange={e => set('visibility', e.target.value as Visibility)} sx={{ gap: 1.5 }}>
            {([
              { value: 'public'  as const, label: 'Public',     sub: 'Anyone' },
              { value: 'members' as const, label: 'Members',    sub: 'Logged-in only' },
              { value: 'board'   as const, label: 'Admin only', sub: 'Admins only' },
            ]).map(({ value, label, sub }) => (
              <FormControlLabel
                key={value}
                value={value}
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{sub}</Typography>
                  </Box>
                }
                sx={{
                  border: '1px solid',
                  borderColor: form.visibility === value ? 'primary.main' : 'divider',
                  borderRadius: 1.5, m: 0, px: 1.5, py: 0.75, flex: 1,
                }}
              />
            ))}
          </RadioGroup>
        </Box>
      </Paper>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Button
          variant="outlined" color="secondary" disabled={saving}
          onClick={() => onClose ? onClose() : router.push(`/${clubSlug}/admin/resources`)}
        >
          Cancel
        </Button>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {existing?.status === 'published' && (
            <Button variant="outlined" color="secondary" onClick={handleUnpublish} disabled={saving}>
              Unpublish
            </Button>
          )}
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : (existing ? 'Save changes' : 'Add resource')}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

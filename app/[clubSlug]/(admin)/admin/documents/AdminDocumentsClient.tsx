'use client'

import { useRef, useState, useTransition } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import DescriptionIcon from '@mui/icons-material/Description'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { TrashBtn } from '@/components/ui/TrashBtn'
import { createClient } from '@/lib/supabase/client'
import type { AdminDocumentRow, CategoryRow } from './page'

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AdminDocumentsClient({
  documents: initial,
  categories,
}: {
  documents:  AdminDocumentRow[]
  categories: CategoryRow[]
}) {
  const [documents, setDocuments] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState<string | null>(null)
  const [deleteId, setDeleteId]   = useState<string | null>(null)
  const [, startTransition]       = useTransition()

  // Upload dialog state
  const [uploadOpen, setUploadOpen]  = useState(false)
  const [file, setFile]              = useState<File | null>(null)
  const [title, setTitle]            = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId]  = useState('')
  const [visibility, setVisibility]  = useState<'members' | 'public'>('members')
  const fileRef = useRef<HTMLInputElement>(null)

  function resetUploadForm() {
    setFile(null)
    setTitle('')
    setDescription('')
    setCategoryId('')
    setVisibility('members')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleUpload() {
    if (!file || !title.trim()) return
    setUploading(true)
    setError(null)
    const supabase = createClient()

    // Upload to storage
    const ext  = file.name.split('.').pop() ?? 'bin'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('documents')
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadErr) {
      setError(`Upload failed: ${uploadErr.message}`)
      setUploading(false)
      return
    }

    // Insert DB record
    const { data: inserted, error: dbErr } = await supabase
      .from('documents')
      .insert({
        title:       title.trim(),
        description: description.trim() || null,
        file_path:   path,
        file_name:   file.name,
        file_size:   file.size,
        mime_type:   file.type || null,
        category_id: categoryId || null,
        visibility,
      })
      .select('id, title, description, file_name, file_size, mime_type, file_path, visibility, sort_order, uploaded_at, category_id, document_categories(id, name)')
      .single()

    if (dbErr || !inserted) {
      // Try to clean up storage
      await supabase.storage.from('documents').remove([path])
      setError(`Database error: ${dbErr?.message}`)
      setUploading(false)
      return
    }

    const cat = (inserted as unknown as { document_categories: { id: string; name: string } | null }).document_categories
    const newDoc: AdminDocumentRow = {
      id:          inserted.id,
      title:       inserted.title,
      description: inserted.description ?? null,
      file_name:   inserted.file_name,
      file_size:   inserted.file_size ?? null,
      mime_type:   inserted.mime_type ?? null,
      file_path:   inserted.file_path,
      visibility:  inserted.visibility,
      sort_order:  inserted.sort_order,
      uploaded_at: inserted.uploaded_at,
      category:    cat ? { id: cat.id, name: cat.name } : null,
    }

    setDocuments(prev => [newDoc, ...prev])
    setSuccess(`"${inserted.title}" uploaded successfully.`)
    setUploadOpen(false)
    resetUploadForm()
    setUploading(false)
  }

  async function handleDelete(id: string) {
    setDeleteId(null)
    const doc = documents.find(d => d.id === id)
    if (!doc) return

    const supabase = createClient()

    // Soft-delete in DB
    const { error: dbErr } = await supabase
      .from('documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (dbErr) {
      setError(`Delete failed: ${dbErr.message}`)
      return
    }

    setDocuments(prev => prev.filter(d => d.id !== id))
    setSuccess(`"${doc.title}" removed.`)
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Documents</h1>
          <p className="mt-1 text-sm text-content-secondary">Upload and manage club documents for members.</p>
        </Box>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => { setError(null); setSuccess(null); setUploadOpen(true) }}
        >
          Upload document
        </Button>
      </Box>

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {documents.length === 0 ? (
        <Paper variant="outlined" sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <DescriptionIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
            No documents uploaded yet
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Upload PDFs, forms, and club reference materials for members.
          </Typography>
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            sx={{ mt: 0.5 }}
            onClick={() => setUploadOpen(true)}
          >
            Upload document
          </Button>
        </Paper>
      ) : (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Title', 'Category', 'Visibility', 'Size', 'Uploaded', ''].map((h, i) => (
                  <TableCell key={i} align={i === 5 ? 'right' : 'left'} sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default', fontFamily: 'inherit' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map(doc => (
                <TableRow key={doc.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider', fontFamily: 'inherit' }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary' }}>
                      {doc.title}
                    </Typography>
                    {doc.description && (
                      <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>
                        {doc.description}
                      </Typography>
                    )}
                    <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.25 }}>
                      {doc.file_name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider', fontFamily: 'inherit' }}>
                    {doc.category ? (
                      <Chip label={doc.category.name} size="small" variant="outlined" />
                    ) : (
                      <Typography sx={{ fontSize: 14, color: 'text.disabled' }}>—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider', fontFamily: 'inherit' }}>
                    <Chip
                      label={doc.visibility === 'members' ? 'Members' : 'Public'}
                      size="small"
                      sx={doc.visibility === 'public'
                        ? { bgcolor: 'success.light', color: 'success.contrastText', fontFamily: 'inherit', fontSize: 11 }
                        : { bgcolor: 'background.default', color: 'text.secondary', fontFamily: 'inherit', fontSize: 11 }
                      }
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider', fontSize: 14, color: 'text.secondary', fontFamily: 'inherit' }}>
                    {formatBytes(doc.file_size)}
                  </TableCell>
                  <TableCell sx={{ py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider', fontSize: 14, color: 'text.secondary', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    {formatDate(doc.uploaded_at)}
                  </TableCell>
                  <TableCell align="right" sx={{ py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider', fontFamily: 'inherit', width: 48 }}>
                    <Tooltip title="Delete document">
                      <span>
                        <TrashBtn onClick={() => setDeleteId(doc.id)} />
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Upload dialog */}
      <Dialog
        open={uploadOpen}
        onClose={() => { if (!uploading) { setUploadOpen(false); resetUploadForm() } }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Upload document</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>

            {/* File picker */}
            <Box>
              <FormLabel sx={{ display: 'block', mb: 0.75, fontSize: '13px', fontWeight: 500 }}>
                File
              </FormLabel>
              <Box
                onClick={() => fileRef.current?.click()}
                sx={{
                  border: '2px dashed var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                  '&:hover': { borderColor: 'var(--action-primary)' },
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                  onChange={e => {
                    const f = e.target.files?.[0] ?? null
                    setFile(f)
                    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ''))
                  }}
                />
                {file ? (
                  <>
                    <Typography sx={{ fontSize: '14px', fontWeight: 500, color: 'text.primary' }}>
                      {file.name}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: 'text.secondary', mt: 0.5 }}>
                      {formatBytes(file.size)}
                    </Typography>
                  </>
                ) : (
                  <>
                    <CloudUploadIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                    <Typography sx={{ fontSize: '13px', color: 'text.secondary' }}>
                      Click to select a file
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: 'text.disabled', mt: 0.5 }}>
                      PDF, Word, Excel, PowerPoint, ZIP
                    </Typography>
                  </>
                )}
              </Box>
            </Box>

            {/* Title */}
            <Box>
              <FormLabel required sx={{ display: 'block', mb: 0.75, fontSize: '13px', fontWeight: 500 }}>
                Title
              </FormLabel>
              <OutlinedInput
                fullWidth
                placeholder="e.g. Club Constitution 2024"
                value={title}
                onChange={e => setTitle(e.target.value)}
                size="small"
              />
            </Box>

            {/* Description */}
            <Box>
              <FormLabel sx={{ display: 'block', mb: 0.75, fontSize: '13px', fontWeight: 500 }}>
                Description <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(optional)</span>
              </FormLabel>
              <OutlinedInput
                fullWidth
                multiline
                minRows={2}
                placeholder="Brief description of this document"
                value={description}
                onChange={e => setDescription(e.target.value)}
                size="small"
              />
            </Box>

            {/* Category */}
            <Box>
              <FormLabel sx={{ display: 'block', mb: 0.75, fontSize: '13px', fontWeight: 500 }}>
                Category <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(optional)</span>
              </FormLabel>
              <Select
                fullWidth
                displayEmpty
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                size="small"
                input={<OutlinedInput />}
              >
                <MenuItem value=""><em>No category</em></MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </Box>

            {/* Visibility */}
            <Box>
              <FormLabel sx={{ display: 'block', mb: 0.75, fontSize: '13px', fontWeight: 500 }}>
                Visibility
              </FormLabel>
              <Select
                fullWidth
                value={visibility}
                onChange={e => setVisibility(e.target.value as 'members' | 'public')}
                size="small"
                input={<OutlinedInput />}
              >
                <MenuItem value="members">Members only</MenuItem>
                <MenuItem value="public">Public</MenuItem>
              </Select>
            </Box>

          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => { setUploadOpen(false); resetUploadForm() }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading || !file || !title.trim()}
            startIcon={uploading ? undefined : <CloudUploadIcon />}
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Remove document?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '14px', color: 'text.secondary' }}>
            This will remove the document from the member library. The file will be kept in storage.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" color="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteId && handleDelete(deleteId)}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

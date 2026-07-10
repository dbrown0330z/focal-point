'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, CircularProgress, Alert, TextField,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import {
  createAdminGallery,
  updateAdminGalleryMeta,
  deleteAdminGallery,
} from './actions'
import type { AdminGalleryFilters } from './actions'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AdminGalleryData = {
  id:         string
  name:       string
  slug:       string
  visibility: 'draft' | 'members_only' | 'public'
  filters:    AdminGalleryFilters | null
  imageIds:   string[]
  coverUrl:   string | null
  imageCount: number
}

export type ClubMember = {
  id:          string
  displayName: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function IconX({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  )
}

function visibilityLabel(v: string): string {
  if (v === 'public')       return 'Public'
  if (v === 'members_only') return 'Members only'
  return 'Draft'
}

function visibilityBadgeStyle(v: string): React.CSSProperties {
  if (v === 'public')       return { background: 'rgba(26,111,196,0.82)', color: '#fff' }
  if (v === 'members_only') return { background: 'rgba(0,0,0,0.55)',      color: '#fff' }
  return { background: 'rgba(80,80,80,0.70)', color: 'rgba(255,255,255,0.80)' }
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onChange, id }: { on: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={on}
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: on ? 'var(--action-primary)' : 'var(--border-strong)',
        border: 'none', padding: 0, cursor: 'pointer',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: on ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

// ─── Admin Share Modal ────────────────────────────────────────────────────────

function deriveVisibility(members: boolean, pub: boolean): 'draft' | 'members_only' | 'public' {
  if (pub || members) return pub ? 'public' : 'members_only'
  return 'draft'
}

function getAdminStatusText(members: boolean, pub: boolean): string {
  if (members && pub) return 'Visible to members and anyone with the link'
  if (members)        return 'Visible to club members'
  if (pub)            return 'Anyone with the link can view this'
  return 'Draft — not published'
}

function AdminShareModal({
  open,
  onClose,
  gallery,
  clubSlug,
  onSave,
}: {
  open:     boolean
  onClose:  () => void
  gallery:  AdminGalleryData | null
  clubSlug: string
  onSave:   (v: 'draft' | 'members_only' | 'public') => void
}) {
  const [membersOn, setMembersOn] = useState(false)
  const [publicOn,  setPublicOn]  = useState(false)
  const [copied,    setCopied]    = useState(false)
  const [saving,    setSaving]    = useState(false)
  const prevId = useRef<string | null>(null)

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const [statusOpacity,   setStatusOpacity]   = useState(1)
  const [displayedStatus, setDisplayedStatus] = useState(() => getAdminStatusText(membersOn, publicOn))

  useEffect(() => {
    setStatusOpacity(0)
    const t = setTimeout(() => {
      setDisplayedStatus(getAdminStatusText(membersOn, publicOn))
      setStatusOpacity(1)
    }, 120)
    return () => clearTimeout(t)
  }, [membersOn, publicOn])

  if (gallery && gallery.id !== prevId.current) {
    const v = gallery.visibility
    setMembersOn(v === 'members_only' || v === 'public')
    setPublicOn(v === 'public')
    setDisplayedStatus(getAdminStatusText(v === 'members_only' || v === 'public', v === 'public'))
    setStatusOpacity(1)
    prevId.current = gallery.id
  }
  if (!gallery) prevId.current = null

  if (!open || !gallery) return null

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/${clubSlug}/our-club/galleries/${gallery.slug}`
    : `/${clubSlug}/our-club/galleries/${gallery.slug}`

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  async function handleDone() {
    const v = deriveVisibility(membersOn, publicOn)
    setSaving(true)
    const res = await updateAdminGalleryMeta(gallery!.id, { name: gallery!.name, visibility: v })
    setSaving(false)
    if (!res.error) { onSave(v); onClose() }
  }

  const isDraft = !membersOn && !publicOn

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1300,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : 24,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : 480,
          borderRadius: isMobile ? '20px 20px 0 0' : 20,
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          padding: '28px 24px 24px',
          paddingBottom: isMobile ? 'max(24px, env(safe-area-inset-bottom, 16px))' : 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
          <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', margin: 0 }}>
            Share &ldquo;{gallery.name}&rdquo;
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none', flexShrink: 0,
              background: 'var(--surface-2)', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <IconX size={14} />
          </button>
        </div>

        <p
          aria-live="polite"
          style={{
            fontSize: 14,
            color:      isDraft ? 'var(--action-primary)' : 'var(--text-secondary)',
            fontWeight: isDraft ? 600 : 400,
            margin: '12px 0 20px', lineHeight: 1.4,
            transition: 'opacity 0.15s ease, color 0.2s ease',
            opacity: statusOpacity,
          }}
        >
          {displayedStatus}
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0 }} />

        {/* Members toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 0' }}>
          <label htmlFor="admin-toggle-members" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
            Share with members
          </label>
          <Toggle id="admin-toggle-members" on={membersOn} onChange={v => { setMembersOn(v); if (!v) setPublicOn(false) }} />
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
          Visible on the Club Galleries page and available for homepage blocks.
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0 }} />

        {/* Public toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 0' }}>
          <label htmlFor="admin-toggle-public" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
            Share with a public link
          </label>
          <Toggle id="admin-toggle-public" on={publicOn} onChange={v => { setPublicOn(v); if (v) setMembersOn(true) }} />
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
          Anyone with the link can view this gallery — no login required.
        </p>

        {/* Animated link field */}
        <div style={{
          overflow: 'hidden',
          maxHeight: publicOn ? 72 : 0,
          opacity: publicOn ? 1 : 0,
          transition: 'max-height 0.25s ease, opacity 0.2s ease',
          marginTop: publicOn ? 0 : 0,
        }}>
          <div style={{
            display: 'flex',
            background: 'var(--surface-2)',
            border: '1.5px solid var(--border-default)',
            borderRadius: 10,
            overflow: 'hidden',
            marginBottom: 16,
          }}>
            <input
              readOnly
              value={url}
              style={{
                flex: 1, padding: '10px 12px',
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: 12, color: 'var(--text-secondary)',
                fontFamily: 'var(--font-code)',
              }}
            />
            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: '10px 16px',
                background: 'var(--surface-1)', border: 'none',
                borderLeft: '1.5px solid var(--border-default)',
                fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                color: copied ? 'var(--status-success)' : 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {copied ? '✓ Copied' : 'Copy link'}
            </button>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0 }} />

        <button
          type="button"
          onClick={handleDone}
          disabled={saving}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 10,
            fontSize: 15, fontWeight: 700,
            background: saving ? 'var(--border-default)' : 'var(--action-primary)',
            color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            marginTop: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {saving && <CircularProgress size={14} color="inherit" />}
          {saving ? 'Saving…' : 'Done'}
        </button>
      </div>
    </div>
  )
}

// ─── New Gallery Modal ────────────────────────────────────────────────────────

function NewGalleryModal({
  open,
  onClose,
  clubSlug,
}: {
  open:     boolean
  onClose:  () => void
  clubSlug: string
}) {
  const router = useRouter()
  const [name,   setName]   = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  function handleClose() { setName(''); setError(null); onClose() }

  async function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true); setError(null)
    const res = await createAdminGallery({
      name:     trimmed,
      filters:  { memberIds: 'all', scoreMin: 0, categories: [], timeframe: 'all_years' },
      imageIds: [],
      coverId:  null,
    })
    setSaving(false)
    if (res.error) { setError(res.error); return }
    handleClose()
    router.push(`/${clubSlug}/admin/content/galleries/${res.id}/edit`)
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
      }}
      onClick={handleClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          borderRadius: 20,
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          padding: '28px 28px 24px',
        }}
      >
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--action-primary)',
          margin: '0 0 16px',
        }}>
          New Gallery
        </p>

        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) handleCreate() }}
          placeholder="Gallery name"
          maxLength={80}
          style={{
            width: '100%', padding: '13px 16px',
            borderRadius: 10, border: '1.5px solid var(--action-primary)',
            background: 'var(--surface-2)', fontSize: 16, fontWeight: 500,
            color: 'var(--text-primary)', outline: 'none',
            boxSizing: 'border-box', marginBottom: 20,
          }}
        />

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
          You&apos;ll set up filters to curate photos from competition submissions.
        </p>

        {error && (
          <p style={{ fontSize: 13, color: 'var(--status-error)', marginBottom: 16 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || saving}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 10,
              fontSize: 15, fontWeight: 700,
              background: !name.trim() || saving ? 'var(--border-default)' : 'var(--action-primary)',
              color: '#fff', border: 'none',
              cursor: !name.trim() || saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {saving && <CircularProgress size={14} color="inherit" />}
            {saving ? 'Creating…' : 'Create'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            style={{
              padding: '12px 22px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              background: 'var(--surface-2)', color: 'var(--text-secondary)',
              border: '1.5px solid var(--border-default)', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteDialog({
  gallery,
  onClose,
}: {
  gallery: AdminGalleryData | null
  onClose: () => void
}) {
  const router  = useRouter()
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  if (!gallery) return null

  async function handleDelete() {
    if (!gallery) return
    setSaving(true); setError(null)
    const res = await deleteAdminGallery(gallery.id)
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
          <strong>&ldquo;{gallery.name}&rdquo;</strong> will be permanently deleted. Images in the library will not be deleted.
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

// ─── Gallery Card ─────────────────────────────────────────────────────────────

function GalleryCard({
  gallery,
  clubSlug,
  onDelete,
  onShare,
}: {
  gallery:  AdminGalleryData
  clubSlug: string
  onDelete: (g: AdminGalleryData) => void
  onShare:  (g: AdminGalleryData) => void
}) {
  const editUrl = `/${clubSlug}/admin/content/galleries/${gallery.id}/edit`

  return (
    <div style={{
      borderRadius: 16,
      overflow:     'hidden',
      background:   'var(--surface-2)',
      border:       '1px solid var(--border-default)',
      display:      'flex',
      flexDirection: 'column',
    }}>
      {/* Cover image — clicking navigates to edit */}
      <a
        href={editUrl}
        style={{ display: 'block', position: 'relative', aspectRatio: '3/2', overflow: 'hidden', flexShrink: 0 }}
      >
        {gallery.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gallery.coverUrl}
            alt={gallery.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.25s ease' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--surface-0)',
          }}>
            <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>No images</span>
          </div>
        )}
        {/* Visibility badge */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          borderRadius: 9999, padding: '3px 10px',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
          textTransform: 'uppercase', backdropFilter: 'blur(4px)',
          ...visibilityBadgeStyle(gallery.visibility),
        }}>
          {visibilityLabel(gallery.visibility)}
        </div>
      </a>

      {/* Info + actions */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div>
          <a href={editUrl} style={{ textDecoration: 'none' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, margin: 0 }}>
              {gallery.name}
            </p>
          </a>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: 5 }}>
            {gallery.imageCount} photo{gallery.imageCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 'auto' }}>
          <a
            href={editUrl}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'transparent', border: '1.5px solid var(--border-default)',
              color: 'var(--text-primary)', cursor: 'pointer', textDecoration: 'none',
              textAlign: 'center', display: 'block',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface-1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            Edit
          </a>
          <button
            type="button"
            onClick={() => onShare(gallery)}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'transparent', border: '1.5px solid var(--border-default)',
              color: 'var(--text-primary)', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--surface-1)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'transparent' }}
          >
            Share
          </button>
          <button
            type="button"
            onClick={() => onDelete(gallery)}
            title="Delete gallery"
            style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'transparent', border: '1.5px solid var(--border-default)',
              color: 'var(--status-error)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--status-error-bg)'; e.currentTarget.style.borderColor = 'var(--status-error)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-default)' }}
          >
            <IconX size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main exported tab component ──────────────────────────────────────────────

export default function ClubGalleriesTab({
  galleries,
  members,
  clubSlug,
}: {
  galleries: AdminGalleryData[]
  members:   ClubMember[]
  clubSlug:  string
}) {
  void members // available for future filter previews

  const [createOpen,   setCreateOpen]   = useState(false)
  const [delGallery,   setDelGallery]   = useState<AdminGalleryData | null>(null)
  const [shareGallery, setShareGallery] = useState<AdminGalleryData | null>(null)
  const [shareOpen,    setShareOpen]    = useState(false)

  // Local visibility overrides after share saves
  const [visibilityOverrides, setVisibilityOverrides] = useState<Record<string, AdminGalleryData['visibility']>>({})

  function handleShareOpen(g: AdminGalleryData) {
    setShareGallery(g)
    setShareOpen(true)
  }

  function handleVisibilitySaved(id: string, v: 'draft' | 'members_only' | 'public') {
    setVisibilityOverrides(prev => ({ ...prev, [id]: v }))
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 0.5 }}>Club galleries</Typography>
          <Typography variant="body2" color="text.secondary">
            Dynamic galleries curated from competition submissions and published to members or the public.
          </Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          New gallery
        </Button>
      </Box>

      {/* Gallery grid */}
      {galleries.length === 0 ? (
        <Box sx={{
          textAlign: 'center', py: 8,
          border: '1px dashed var(--border-default)',
          borderRadius: 3, mb: 3,
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No galleries yet.</Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Create first gallery
          </Button>
        </Box>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24,
          marginBottom: 24,
        }}>
          {galleries.map(g => (
            <GalleryCard
              key={g.id}
              gallery={{ ...g, visibility: visibilityOverrides[g.id] ?? g.visibility }}
              clubSlug={clubSlug}
              onDelete={setDelGallery}
              onShare={handleShareOpen}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <NewGalleryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        clubSlug={clubSlug}
      />
      <DeleteDialog
        gallery={delGallery}
        onClose={() => setDelGallery(null)}
      />
      <AdminShareModal
        open={shareOpen}
        onClose={() => { setShareOpen(false); setShareGallery(null) }}
        gallery={shareGallery}
        clubSlug={clubSlug}
        onSave={v => { if (shareGallery) handleVisibilitySaved(shareGallery.id, v) }}
      />
    </Box>
  )
}

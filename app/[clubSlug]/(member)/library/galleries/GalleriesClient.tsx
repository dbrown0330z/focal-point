'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Tooltip, CircularProgress, Alert,
} from '@mui/material'
// (Dialog/DialogTitle/DialogContent/DialogActions/Typography kept for DeleteDialog)
import AddIcon from '@mui/icons-material/Add'
import type { GalleryData } from './page'
import { createGallery, deleteGallery, updateGalleryMeta } from './actions'

const GALLERY_LIMIT = 3

function IconX({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function visibilityLabel(v: string) {
  if (v === 'public')       return 'Public'
  if (v === 'members_only') return 'Members only'
  return 'Private'
}

function visibilityBadgeStyle(v: string): React.CSSProperties {
  if (v === 'public')       return { background: 'rgba(26,111,196,0.82)', color: '#fff' }
  if (v === 'members_only') return { background: 'rgba(0,0,0,0.55)',      color: '#fff' }
  return                           { background: 'rgba(0,0,0,0.55)',      color: 'rgba(255,255,255,0.75)' }
}

// ─── New Gallery modal ────────────────────────────────────────────────────────

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
  const [type,   setType]   = useState<'standard' | 'dynamic'>('standard')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  function handleClose() {
    setName(''); setType('standard'); setError(null); onClose()
  }

  async function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true); setError(null)
    const res = await createGallery({
      name:         trimmed,
      visibility:   'private',
      imageIds:     [],
      coverId:      null,
      gallery_type: type,
    })
    setSaving(false)
    if (res.error) { setError(res.error); return }
    handleClose()
    if (res.gallery_type === 'dynamic') {
      router.push(`/${clubSlug}/library/galleries/${res.id}/dynamic`)
    } else {
      router.push(`/${clubSlug}/library/galleries/${res.id}/edit`)
    }
  }

  if (!open) return null

  const subtext = type === 'standard'
    ? "You'll pick photos from your uploads next."
    : "You'll set up filters to auto-populate photos from your competition history."

  return (
    <div
      style={{
        position:       'fixed', inset: 0, zIndex: 1300,
        display:        'flex', alignItems: 'center', justifyContent: 'center',
        padding:        24,
        background:     'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:        '100%',
          maxWidth:     480,
          borderRadius: 20,
          background:   'var(--surface-1)',
          border:       '1px solid var(--border-default)',
          padding:      '28px 28px 24px',
        }}
      >
        {/* Header */}
        <p style={{
          fontSize:      11,
          fontWeight:    700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color:         'var(--action-primary)',
          margin:        '0 0 16px',
        }}>
          New Gallery
        </p>

        {/* Name input */}
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) handleCreate() }}
          placeholder="Gallery name"
          maxLength={80}
          style={{
            width:        '100%',
            padding:      '13px 16px',
            borderRadius: 10,
            border:       '1.5px solid var(--action-primary)',
            background:   'var(--surface-2)',
            fontSize:     16,
            fontWeight:   500,
            color:        'var(--text-primary)',
            outline:      'none',
            boxSizing:    'border-box',
            marginBottom: 20,
          }}
        />

        {/* Standard / Dynamic toggle */}
        <div style={{
          display:      'grid',
          gridTemplateColumns: '1fr 1fr',
          borderRadius: 10,
          overflow:     'hidden',
          border:       '1.5px solid var(--border-default)',
          marginBottom: 14,
        }}>
          {(['standard', 'dynamic'] as const).map((opt, i) => {
            const active = type === opt
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setType(opt)}
                style={{
                  padding:     '12px 0',
                  fontSize:    15,
                  fontWeight:  700,
                  border:      'none',
                  borderLeft:  i === 1 ? '1.5px solid var(--border-default)' : 'none',
                  background:  active ? 'var(--action-primary)' : 'var(--surface-2)',
                  color:       active ? '#fff' : 'var(--text-secondary)',
                  cursor:      'pointer',
                  transition:  'background 0.15s, color 0.15s',
                  textTransform: 'capitalize',
                }}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {/* Subtext */}
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
          {subtext}
        </p>

        {error && (
          <p style={{ fontSize: 13, color: 'var(--status-error)', marginBottom: 16 }}>{error}</p>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || saving}
            style={{
              flex:         1,
              padding:      '12px 0',
              borderRadius: 10,
              fontSize:     15,
              fontWeight:   700,
              background:   !name.trim() || saving ? 'var(--border-default)' : 'var(--action-primary)',
              color:        '#fff',
              border:       'none',
              cursor:       !name.trim() || saving ? 'not-allowed' : 'pointer',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              gap:          8,
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
              padding:      '12px 22px',
              borderRadius: 10,
              fontSize:     15,
              fontWeight:   600,
              background:   'var(--surface-2)',
              color:        'var(--text-secondary)',
              border:       '1.5px solid var(--border-default)',
              cursor:       'pointer',
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

// ─── Share / visibility modal ─────────────────────────────────────────────────

function deriveVisibility(club: boolean, pub: boolean): 'private' | 'members_only' | 'public' {
  if (pub)  return 'public'
  if (club) return 'members_only'
  return 'private'
}

function getStatusText(club: boolean, pub: boolean): string {
  if (club && pub)  return 'Visible to club members and anyone with the link'
  if (club)         return 'Visible to club members on your profile'
  if (pub)          return 'Anyone with the link can view this'
  return 'Private — only visible to you'
}

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

function ShareDialog({
  gallery,
  clubSlug,
  userId,
  onClose,
  onSaved,
}: {
  gallery:   GalleryData | null
  clubSlug:  string
  userId:    string
  onClose:   () => void
  onSaved:   (id: string, visibility: 'private' | 'members_only' | 'public') => void
}) {
  const [clubOn,   setClubOn]   = useState(false)
  const [publicOn, setPublicOn] = useState(false)
  const [copied,   setCopied]   = useState(false)
  const [saving,   setSaving]   = useState(false)
  const prevId = useRef<string | null>(null)

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const [statusOpacity,   setStatusOpacity]   = useState(1)
  const [displayedStatus, setDisplayedStatus] = useState(() => getStatusText(clubOn, publicOn))

  useEffect(() => {
    setStatusOpacity(0)
    const t = setTimeout(() => {
      setDisplayedStatus(getStatusText(clubOn, publicOn))
      setStatusOpacity(1)
    }, 120)
    return () => clearTimeout(t)
  }, [clubOn, publicOn])

  if (gallery && gallery.id !== prevId.current) {
    const v = gallery.visibility
    setClubOn(v !== 'private')
    setPublicOn(v === 'public')
    setDisplayedStatus(getStatusText(v !== 'private', v === 'public'))
    setStatusOpacity(1)
    prevId.current = gallery.id
  }
  if (!gallery) prevId.current = null

  if (!gallery) return null

  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/${clubSlug}/gallery/${userId}/${gallery.slug}`

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  async function handleDone() {
    const v = deriveVisibility(clubOn, publicOn)
    setSaving(true)
    await updateGalleryMeta(gallery!.id, { name: gallery!.name, visibility: v })
    setSaving(false)
    onSaved(gallery!.id, v)
    onClose()
  }

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
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 22, fontWeight: 400,
            color: 'var(--text-primary)',
            margin: 0,
          }}>
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
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-0)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}
          >
            <IconX size={14} />
          </button>
        </div>

        <p
          aria-live="polite"
          style={{
            fontSize: 14,
            color:      !clubOn && !publicOn ? 'var(--action-primary)' : 'var(--text-secondary)',
            fontWeight: !clubOn && !publicOn ? 600 : 400,
            margin: '12px 0 20px', lineHeight: 1.4,
            transition: 'opacity 0.15s ease, color 0.2s ease',
            opacity: statusOpacity,
          }}
        >
          {displayedStatus}
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0 }} />

        {/* Club members row */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 16,
          padding: '16px 0',
        }}>
          <label htmlFor="toggle-club" style={{
            fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer',
          }}>
            Share with club members
          </label>
          <Toggle id="toggle-club" on={clubOn} onChange={setClubOn} />
        </div>

        <p style={{
          fontSize: 13, color: 'var(--text-secondary)',
          margin: '0 0 16px', lineHeight: 1.5,
        }}>
          Visible on your member profile page to other logged-in members.
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0 }} />

        {/* Public link row */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 16,
          padding: '16px 0',
        }}>
          <label htmlFor="toggle-public" style={{
            fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer',
          }}>
            Share with a public link
          </label>
          <Toggle id="toggle-public" on={publicOn} onChange={setPublicOn} />
        </div>

        <p style={{
          fontSize: 13, color: 'var(--text-secondary)',
          margin: '0 0 16px', lineHeight: 1.5,
        }}>
          Anyone with the link can view this gallery — no login required.
        </p>

        {/* Animated link field */}
        <div style={{
          overflow: 'hidden',
          maxHeight: publicOn ? 72 : 0,
          opacity: publicOn ? 1 : 0,
          transition: 'max-height 0.25s ease, opacity 0.2s ease',
          marginTop: publicOn ? 12 : 0,
        }}>
          <div style={{
            display: 'flex',
            background: 'var(--surface-2)',
            border: '1.5px solid var(--border-default)',
            borderRadius: 10,
            overflow: 'hidden',
            marginBottom: 4,
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
          }}
        >
          {saving ? 'Saving…' : 'Done'}
        </button>
      </div>
    </div>
  )
}

// ─── Gallery card ─────────────────────────────────────────────────────────────

function GalleryCard({
  gallery,
  clubSlug,
  userId,
  onDelete,
  onShare,
}: {
  gallery:  GalleryData
  clubSlug: string
  userId:   string
  onDelete: (g: GalleryData) => void
  onShare:  (g: GalleryData) => void
}) {
  const galleryUrl = `/${clubSlug}/gallery/${userId}/${gallery.slug}`
  const editUrl    = gallery.gallery_type === 'dynamic'
    ? `/${clubSlug}/library/galleries/${gallery.id}/dynamic`
    : `/${clubSlug}/library/galleries/${gallery.id}/edit`

  return (
    <div style={{
      borderRadius:  14,
      overflow:      'hidden',
      background:    'var(--surface-1)',
      border:        '1px solid var(--border-default)',
      display:       'flex',
      flexDirection: 'column',
    }}>
      {/* Cover image */}
      <a
        href={galleryUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', position: 'relative', aspectRatio: '4/3', overflow: 'hidden', flexShrink: 0 }}
      >
        {gallery.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gallery.coverImageUrl}
            alt={gallery.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.25s ease' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-0)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>No cover image</span>
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
        {/* Dynamic badge */}
        {gallery.gallery_type === 'dynamic' && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            borderRadius: 9999, padding: '3px 10px',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
            textTransform: 'uppercase', backdropFilter: 'blur(4px)',
            background: 'rgba(108,71,212,0.82)', color: '#fff',
          }}>
            Dynamic
          </div>
        )}
      </a>

      {/* Info + actions */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, margin: 0 }}>
            {gallery.name}
          </p>
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
              color: 'var(--text-primary)', cursor: 'pointer',
              textAlign: 'center', textDecoration: 'none', display: 'block',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLAnchorElement).style.background = 'var(--surface-2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
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
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--surface-2)' }}
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function GalleriesClient({
  clubSlug,
  userId,
  galleries,
  hasImages,
}: {
  clubSlug:  string
  userId:    string
  galleries: GalleryData[]
  hasImages: boolean
}) {
  const [createOpen,   setCreateOpen]   = useState(false)
  const [delGallery,   setDelGallery]   = useState<GalleryData | null>(null)
  const [shareGallery, setShareGallery] = useState<GalleryData | null>(null)
  // Track visibility overrides locally after saves (avoids full page reload)
  const [visibilityOverrides, setVisibilityOverrides] = useState<Record<string, GalleryData['visibility']>>({})

  function handleVisibilitySaved(id: string, v: 'private' | 'members_only' | 'public') {
    setVisibilityOverrides(prev => ({ ...prev, [id]: v }))
  }

  const atLimit = galleries.length >= GALLERY_LIMIT

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <h1 className="font-[family-name:var(--font-lora)] text-[28px] font-bold leading-tight tracking-[-0.02em] text-content-primary">
          My Galleries
        </h1>
        {galleries.length > 0 && (
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Up to 3 galleries, shared however you like
          </p>
        )}
      </Box>

      {/* Empty state */}
      {galleries.length === 0 && (
        <div className="flex flex-col items-center justify-center pb-16 pt-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/no-images-library.svg" alt="" width={510} className="-mb-4 opacity-70 dark:invert" />
          <p className="text-[22px] font-bold tracking-[-0.01em]"
            style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-secondary)' }}>
            Every photographer has a story to tell
          </p>
          <p className="mt-2 text-[15px]" style={{ color: 'var(--text-secondary)' }}>
            Your gallery is where you tell yours — curate your best work and share it with the world.
          </p>
          <Tooltip title={!hasImages ? "You can create a gallery once you've uploaded your first image" : ''}>
            <span>
              <Button
                variant="contained"
                onClick={() => setCreateOpen(true)}
                disabled={!hasImages}
                sx={{ mt: 4 }}
              >
                + Create your first gallery
              </Button>
            </span>
          </Tooltip>
        </div>
      )}

      {/* Gallery grid */}
      {galleries.length > 0 && (
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap:                 24,
        }}>
          {galleries.map(g => (
            <GalleryCard
              key={g.id}
              gallery={{ ...g, visibility: visibilityOverrides[g.id] ?? g.visibility }}
              clubSlug={clubSlug}
              userId={userId}
              onDelete={setDelGallery}
              onShare={setShareGallery}
            />
          ))}

          {/* New Gallery placeholder */}
          {!atLimit && (
            <Tooltip title={!hasImages ? "Upload images to your library first" : ''}>
              <button
                type="button"
                onClick={() => { if (hasImages) setCreateOpen(true) }}
                disabled={!hasImages}
                style={{
                  borderRadius:   14,
                  border:         '2px dashed var(--border-default)',
                  background:     'transparent',
                  cursor:         hasImages ? 'pointer' : 'not-allowed',
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            10,
                  minHeight:      260,
                  opacity:        hasImages ? 1 : 0.5,
                  transition:     'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { if (hasImages) { e.currentTarget.style.borderColor = 'var(--action-primary)'; e.currentTarget.style.background = 'rgba(26,111,196,0.04)' } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  border: '1.5px dashed var(--border-strong)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-tertiary)',
                }}>
                  <AddIcon sx={{ fontSize: 22 }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  New Gallery
                </span>
              </button>
            </Tooltip>
          )}
        </div>
      )}

      <NewGalleryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        clubSlug={clubSlug}
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
        onSaved={handleVisibilitySaved}
      />
    </Box>
  )
}

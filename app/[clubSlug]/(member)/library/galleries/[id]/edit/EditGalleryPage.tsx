'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Tooltip } from '@mui/material'
import { updateGalleryFull } from '../../actions'
import type { GalleryItem, EditableGallery } from './page'

// ─── SVG icons ────────────────────────────────────────────────────────────────

function IconStar({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={filled ? 0 : 2}
      strokeLinecap="round" strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

function IconX({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  )
}

function IconCheck({ size = 13 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  )
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
      <path d="M12 5v14M5 12h14"/>
    </svg>
  )
}

// ─── Visibility chip (inline beside title) ────────────────────────────────────

const VISIBILITY_CHIP_LABEL: Record<string, string> = {
  public:       'Public',
  members_only: 'Members only',
  private:      'Private',
}

function VisibilityChip({ value }: { value: string }) {
  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      padding:        '3px 11px',
      borderRadius:   9999,
      fontSize:       11,
      fontWeight:     600,
      letterSpacing:  '0.05em',
      textTransform:  'uppercase',
      background:     'rgba(255,255,255,0.10)',
      backdropFilter: 'blur(6px)',
      border:         '1px solid var(--border-default)',
      color:          'var(--text-secondary)',
      whiteSpace:     'nowrap',
    }}>
      {VISIBILITY_CHIP_LABEL[value] ?? value}
    </span>
  )
}

// ─── Share modal ──────────────────────────────────────────────────────────────

function deriveVisibility(club: boolean, pub: boolean): 'private' | 'members_only' | 'public' {
  if (pub)  return 'public'
  if (club) return 'members_only'
  return 'private'
}

function ShareModal({
  open,
  onClose,
  galleryName,
  clubName,
  currentVisibility,
  galleryUrl,
  onSave,
}: {
  open:              boolean
  onClose:           () => void
  galleryName:       string
  clubName:          string
  currentVisibility: 'public' | 'members_only' | 'private'
  galleryUrl:        string
  onSave:            (v: 'public' | 'members_only' | 'private') => void
}) {
  const [clubChecked,   setClubChecked]   = useState(currentVisibility !== 'private')
  const [publicChecked, setPublicChecked] = useState(currentVisibility === 'public')
  const [copied,        setCopied]        = useState(false)

  const prevOpen = useRef(false)
  if (open && !prevOpen.current) {
    setClubChecked(currentVisibility !== 'private')
    setPublicChecked(currentVisibility === 'public')
    prevOpen.current = true
  }
  if (!open) prevOpen.current = false

  function handleCopy() {
    navigator.clipboard.writeText(galleryUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!open) return null

  const checkStyle = (checked: boolean): React.CSSProperties => ({
    display:        'flex',
    alignItems:     'flex-start',
    gap:            14,
    padding:        '16px 18px',
    borderRadius:   12,
    border:         checked ? '1.5px solid var(--action-primary)' : '1.5px solid var(--border-default)',
    background:     checked ? 'rgba(26,111,196,0.08)' : 'var(--surface-2)',
    cursor:         'pointer',
    textAlign:      'left',
    transition:     'border-color 0.12s, background 0.12s',
    userSelect:     'none',
  })

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          borderRadius: 20,
          background: 'var(--surface-1)', border: '1px solid var(--border-default)',
          padding: '28px 28px 24px',
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
          Share &ldquo;{galleryName}&rdquo;
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
          Choose who can see this gallery
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {/* Club card */}
          <label style={checkStyle(clubChecked)}>
            <input
              type="checkbox"
              checked={clubChecked}
              onChange={e => setClubChecked(e.target.checked)}
              style={{ width: 17, height: 17, accentColor: 'var(--action-primary)', flexShrink: 0, marginTop: 1, cursor: 'pointer' }}
            />
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Club members
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '2px 0 0', lineHeight: 1.4 }}>
                Visible on your member profile page — {clubName} members only
              </p>
            </div>
          </label>

          {/* Public card */}
          <label style={checkStyle(publicChecked)}>
            <input
              type="checkbox"
              checked={publicChecked}
              onChange={e => setPublicChecked(e.target.checked)}
              style={{ width: 17, height: 17, accentColor: 'var(--action-primary)', flexShrink: 0, marginTop: 1, cursor: 'pointer' }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Anyone with the link
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '2px 0 0', lineHeight: 1.4 }}>
                Visible publicly — share via the link below
              </p>
            </div>
          </label>
        </div>

        {/* URL row — only when public */}
        {publicChecked && (
          <div style={{
            display: 'flex', marginBottom: 20,
            background: 'var(--surface-2)', border: '1.5px solid var(--border-default)',
            borderRadius: 10, overflow: 'hidden',
          }}>
            <input
              readOnly
              value={galleryUrl}
              style={{
                flex: 1, padding: '10px 14px',
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-code)',
              }}
            />
            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: '10px 18px',
                background: 'var(--surface-1)', border: 'none',
                borderLeft: '1.5px solid var(--border-default)',
                fontSize: 13, fontWeight: 700,
                color: copied ? 'var(--status-success)' : 'var(--text-primary)',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}

        {!clubChecked && !publicChecked && (
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 20px', fontStyle: 'italic' }}>
            Gallery will be private — only visible to you.
          </p>
        )}

        <button
          type="button"
          onClick={() => { onSave(deriveVisibility(clubChecked, publicChecked)); onClose() }}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 10,
            fontSize: 15, fontWeight: 700,
            background: 'var(--action-primary)', color: '#fff',
            border: 'none', cursor: 'pointer',
          }}
        >
          Done
        </button>
      </div>
    </div>
  )
}

// ─── Sortable tile ────────────────────────────────────────────────────────────

function SortableTile({
  item,
  isCover,
  onSetCover,
  onRemove,
}: {
  item:       GalleryItem
  isCover:    boolean
  onSetCover: () => void
  onRemove:   () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform:   CSS.Transform.toString(transform),
    transition,
    zIndex:      isDragging ? 50 : 1,
    opacity:     isDragging ? 0.85 : 1,
    position:    'relative',
    aspectRatio: '1',
    borderRadius: 10,
    overflow:    'hidden',
    border:      isCover ? '2.5px solid var(--action-primary)' : '2px solid var(--border-default)',
    cursor:      isDragging ? 'grabbing' : 'grab',
    boxShadow:   isDragging ? '0 8px 24px rgba(0,0,0,0.35)' : 'none',
  }

  return (
    // Entire tile is the drag target
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.publicUrl}
        alt={item.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', userSelect: 'none', pointerEvents: 'none' }}
        draggable={false}
      />

      {/* Bottom gradient + title */}
      <div style={{
        position:      'absolute',
        bottom:        0,
        left:          0,
        right:         0,
        padding:       '24px 8px 8px',
        background:    'linear-gradient(transparent, rgba(0,0,0,0.72))',
        pointerEvents: 'none',
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title}
        </p>
      </div>

      {/* Star — top right (needs pointer-events so clicks work through the drag listener) */}
      <Tooltip title="Set as cover image" placement="top">
        <button
          type="button"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onSetCover() }}
          style={{
            position:      'absolute',
            top:           6,
            right:         6,
            width:         28,
            height:        28,
            borderRadius:  6,
            background:    isCover ? 'var(--action-primary)' : 'rgba(255,255,255,0.72)',
            backdropFilter:'blur(4px)',
            border:        'none',
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
            color:         isCover ? '#fff' : 'rgba(0,0,0,0.55)',
            cursor:        'pointer',
          }}
        >
          <IconStar filled={isCover} />
        </button>
      </Tooltip>

      {/* Remove — bottom right */}
      <button
        type="button"
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onRemove() }}
        title="Remove from gallery"
        style={{
          position:      'absolute',
          bottom:        6,
          right:         6,
          width:         24,
          height:        24,
          borderRadius:  6,
          background:    'rgba(211,47,47,0.85)',
          backdropFilter:'blur(4px)',
          border:        'none',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          color:         '#fff',
          cursor:        'pointer',
        }}
      >
        <IconX size={11} />
      </button>
    </div>
  )
}

// ─── Add Photos modal ─────────────────────────────────────────────────────────

type SortKey = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date-desc', label: 'Date added (new–old)' },
  { value: 'date-asc',  label: 'Date added (old–new)' },
  { value: 'name-asc',  label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
]

function applySortAndFilter(images: GalleryItem[], search: string, sort: SortKey): GalleryItem[] {
  const q = search.toLowerCase()
  const filtered = q ? images.filter(i => i.title.toLowerCase().includes(q)) : images
  return [...filtered].sort((a, b) => {
    switch (sort) {
      case 'date-desc': return b.created_at.localeCompare(a.created_at)
      case 'date-asc':  return a.created_at.localeCompare(b.created_at)
      case 'name-asc':  return a.title.localeCompare(b.title)
      case 'name-desc': return b.title.localeCompare(a.title)
    }
  })
}

function AddPhotosModal({
  open,
  onClose,
  libraryImages,
  currentIds,
  onConfirm,
}: {
  open:          boolean
  onClose:       () => void
  libraryImages: GalleryItem[]
  currentIds:    Set<string>
  onConfirm:     (newIds: Set<string>) => void
}) {
  // `selected` tracks only NEW additions — existing gallery images are locked
  const [search,   setSearch]   = useState('')
  const [sort,     setSort]     = useState<SortKey>('date-desc')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const displayed = useMemo(
    () => applySortAndFilter(libraryImages, search, sort),
    [libraryImages, search, sort],
  )

  // Only non-gallery images can be selected
  const selectableImages = useMemo(
    () => libraryImages.filter(i => !currentIds.has(i.id)),
    [libraryImages, currentIds],
  )

  function toggle(id: string) {
    if (currentIds.has(id)) return // locked
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  if (!open) return null

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         1200,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '5vh 24px',
        background:     'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:         '100%',
          maxWidth:      800,
          height:        '90vh',           // fixed height — never jumps
          borderRadius:  18,
          background:    'var(--surface-1)',
          border:        '1px solid var(--border-default)',
          display:       'flex',
          flexDirection: 'column',
          overflow:      'hidden',
        }}
      >
        {/* ── Header ── */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Add Photos</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                From your uploads&nbsp;·&nbsp;{libraryImages.length} available
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none',
                background: 'var(--surface-2)', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <IconX size={14} />
            </button>
          </div>

          {/* Search + sort + bulk actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your photos…"
              autoFocus
              style={{
                flex: 1, height: 38, borderRadius: 8,
                border: '1.5px solid var(--border-default)',
                background: 'var(--surface-2)', color: 'var(--text-primary)',
                padding: '0 12px', fontSize: 14, outline: 'none',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--action-primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border-default)')}
            />
            {/* Sort dropdown */}
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              style={{
                height: 38, borderRadius: 8, padding: '0 10px',
                border: '1.5px solid var(--border-default)',
                background: 'var(--surface-2)', color: 'var(--text-primary)',
                fontSize: 13, outline: 'none', cursor: 'pointer',
              }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSelected(new Set(selectableImages.map(i => i.id)))}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--surface-2)', border: '1.5px solid var(--border-default)',
                color: 'var(--text-primary)', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--surface-2)', border: '1.5px solid var(--border-default)',
                color: 'var(--text-primary)', cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* ── Image grid (scrollable, fixed height) ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', scrollbarWidth: 'thin' }}>
          {displayed.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14, padding: '40px 0' }}>
              No photos match your search.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, alignContent: 'start' }}>
              {displayed.map(img => {
                const inGallery  = currentIds.has(img.id)
                const isSelected = selected.has(img.id)

                return (
                  <div
                    key={img.id}
                    onClick={() => toggle(img.id)}
                    style={{
                      position:    'relative',
                      aspectRatio: '1',
                      borderRadius: 8,
                      overflow:    'hidden',
                      cursor:      inGallery ? 'default' : 'pointer',
                      border:      inGallery
                        ? '2px solid var(--action-primary)'
                        : isSelected
                        ? '2px solid var(--action-primary)'
                        : '2px solid var(--border-default)',
                      boxShadow:   isSelected && !inGallery ? '0 0 0 3px rgba(26,111,196,0.20)' : 'none',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.publicUrl}
                      alt={img.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />

                    {/* Newly selected checkmark */}
                    {isSelected && !inGallery && (
                      <div style={{
                        position: 'absolute', top: 5, left: 5,
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'var(--action-primary)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <IconCheck size={11} />
                      </div>
                    )}

                    {/* Already-in-gallery: frosted overlay + badge */}
                    {inGallery && (
                      <>
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'rgba(26,111,196,0.22)',
                        }} />
                        <div style={{
                          position:       'absolute',
                          bottom:         0, left: 0, right: 0,
                          padding:        '14px 6px 6px',
                          background:     'linear-gradient(transparent, rgba(26,111,196,0.70))',
                          display:        'flex',
                          justifyContent: 'center',
                        }}>
                          <span style={{
                            fontSize: 9, fontWeight: 700, color: '#fff',
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                          }}>
                            In gallery
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding:        '14px 24px 20px',
          borderTop:      '1px solid var(--border-subtle)',
          display:        'flex',
          gap:            10,
          justifyContent: 'flex-end',
          flexShrink:     0,
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
              background: 'var(--surface-2)', border: '1.5px solid var(--border-default)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selected)}
            style={{
              padding: '8px 22px', borderRadius: 8, fontSize: 14, fontWeight: 700,
              background: 'var(--action-primary)', border: 'none',
              color: '#fff', cursor: 'pointer',
            }}
          >
            {selected.size > 0 ? `Add ${selected.size} Photo${selected.size !== 1 ? 's' : ''}` : 'Add Photos'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EditGalleryPage({
  clubSlug,
  userId,
  gallery,
  initialItems,
  libraryImages,
}: {
  clubSlug:      string
  userId:        string
  gallery:       EditableGallery
  initialItems:  GalleryItem[]
  libraryImages: GalleryItem[]
}) {
  const router = useRouter()

  const [items,       setItems]       = useState<GalleryItem[]>(initialItems)
  const [coverId,     setCoverId]     = useState<string | null>(gallery.cover_image_id)
  const [name,        setName]        = useState(gallery.name)
  const [visibility,  setVisibility]  = useState(gallery.visibility)
  const [editingName, setEditingName] = useState(false)
  const [addOpen,     setAddOpen]     = useState(false)
  const [shareOpen,   setShareOpen]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setItems(prev => {
        const oldIndex = prev.findIndex(i => i.id === active.id)
        const newIndex = prev.findIndex(i => i.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    if (coverId === id) {
      const remaining = items.filter(i => i.id !== id)
      setCoverId(remaining[0]?.id ?? null)
    }
  }

  function handleAddConfirm(newSelected: Set<string>) {
    const libraryMap = new Map(libraryImages.map(i => [i.id, i]))
    const newOnes = libraryImages.filter(i => newSelected.has(i.id))
    setItems(prev => [...prev, ...newOnes.filter(n => !prev.some(p => p.id === n.id))])
    void libraryMap
    setAddOpen(false)
  }

  async function handleSave() {
    setSaving(true); setError(null)
    const ids   = items.map(i => i.id)
    const cover = coverId && ids.includes(coverId) ? coverId : ids[0] ?? null
    const res   = await updateGalleryFull(gallery.id, { name: name.trim() || gallery.name, visibility, imageIds: ids, coverId: cover })
    setSaving(false)
    if (res.error) { setError(res.error); return }
    router.push(`/${clubSlug}/library/galleries`)
    router.refresh()
  }

  const galleryUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${clubSlug}/gallery/${userId}/${gallery.slug}`
    : `/${clubSlug}/gallery/${userId}/${gallery.slug}`

  const currentIds = useMemo(() => new Set(items.map(i => i.id)), [items])
  const effectiveCover = coverId ?? items[0]?.id ?? null

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Top bar ── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        gap:            12,
        marginBottom:   32,
        flexWrap:       'wrap',
      }}>
        <Link
          href={`/${clubSlug}/library/galleries`}
          style={{
            fontSize:    14,
            fontWeight:  500,
            color:       'var(--text-secondary)',
            textDecoration: 'none',
            display:     'flex',
            alignItems:  'center',
            gap:         4,
          }}
        >
          ← Back to Galleries
        </Link>

        <div style={{ flex: 1 }} />

        {/* Add Photos button */}
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'var(--surface-2)', border: '1.5px solid var(--border-default)',
            color: 'var(--text-primary)', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
        >
          <IconPlus />
          Add Photos
        </button>

        <button
          type="button"
          onClick={() => setShareOpen(true)}
          style={{
            padding: '6px 16px', borderRadius: 9999, fontSize: 13, fontWeight: 600,
            background: 'var(--surface-2)', border: '1.5px solid var(--border-default)',
            color: 'var(--text-primary)', cursor: 'pointer',
          }}
        >
          Share
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding:    '7px 20px',
            borderRadius: 9999,
            fontSize:   13,
            fontWeight: 700,
            background: saving ? 'var(--border-default)' : 'var(--action-primary)',
            color:      '#fff',
            border:     'none',
            cursor:     saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Done'}
        </button>
      </div>

      {/* ── Title (editable) ── */}
      <div style={{ marginBottom: 6 }}>
        {editingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingName(false) }}
            autoFocus
            maxLength={80}
            style={{
              fontSize:   32,
              fontWeight: 700,
              fontFamily: 'var(--font-lora)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              color:      'var(--text-primary)',
              background: 'transparent',
              border:     'none',
              borderBottom: '2px solid var(--action-primary)',
              outline:    'none',
              width:      '100%',
              padding:    '2px 0',
            }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Tooltip title="Click to rename" placement="right">
              <h1
                onClick={() => setEditingName(true)}
                style={{
                  fontSize:     32,
                  fontWeight:   700,
                  fontFamily:   'var(--font-lora)',
                  letterSpacing:'-0.02em',
                  lineHeight:   1.2,
                  color:        'var(--text-primary)',
                  margin:       0,
                  cursor:       'text',
                  display:      'inline-block',
                }}
              >
                {name}
              </h1>
            </Tooltip>
            <VisibilityChip value={visibility} />
          </div>
        )}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 28px' }}>
        {items.length} photo{items.length !== 1 ? 's' : ''}&nbsp;·&nbsp;drag to reorder&nbsp;·&nbsp;click the star to set cover
      </p>

      {/* ── Error ── */}
      {error && (
        <div style={{
          marginBottom: 20,
          padding:      '10px 16px',
          borderRadius: 8,
          background:   'var(--status-error-bg)',
          border:       '1px solid var(--status-error)',
          color:        'var(--status-error-text)',
          fontSize:     14,
        }}>
          {error}
        </div>
      )}

      {/* ── Sortable grid ── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap:                 12,
          }}>
            {items.map(item => (
              <SortableTile
                key={item.id}
                item={item}
                isCover={item.id === effectiveCover}
                onSetCover={() => setCoverId(item.id)}
                onRemove={() => removeItem(item.id)}
              />
            ))}

            {/* Add Photos placeholder slot */}
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              style={{
                aspectRatio:    '1',
                borderRadius:   10,
                border:         '2px dashed var(--border-default)',
                background:     'transparent',
                cursor:         'pointer',
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            8,
                color:          'var(--text-tertiary)',
                transition:     'border-color 0.15s, background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--action-primary)'
                e.currentTarget.style.color       = 'var(--action-primary)'
                e.currentTarget.style.background  = 'rgba(26,111,196,0.04)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-default)'
                e.currentTarget.style.color       = 'var(--text-tertiary)'
                e.currentTarget.style.background  = 'transparent'
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '1.5px dashed currentColor',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconPlus />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Add Photos</span>
            </button>
          </div>
        </SortableContext>
      </DndContext>

      {/* ── Add Photos modal ── */}
      <AddPhotosModal
        key={addOpen ? 'open' : 'closed'}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        libraryImages={libraryImages}
        currentIds={currentIds}
        onConfirm={handleAddConfirm}
      />

      {/* ── Share modal ── */}
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        galleryName={name}
        clubName={gallery.clubName}
        currentVisibility={visibility}
        galleryUrl={galleryUrl}
        onSave={setVisibility}
      />
    </div>
  )
}

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

function IconDragHandle() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}>
      <path d="M7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm6 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 10a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm6 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 16a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm6 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
    </svg>
  )
}

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

// ─── Visibility helpers ───────────────────────────────────────────────────────

const VISIBILITY_CYCLE: Array<'public' | 'members_only' | 'private'> = ['public', 'members_only', 'private']

const VISIBILITY_CONFIG = {
  public:       { label: 'Public',       color: '#fff', bg: 'var(--action-primary)' },
  members_only: { label: 'Members only', color: '#fff', bg: '#5A7A96' },
  private:      { label: 'Private',      color: 'var(--text-secondary)', bg: 'var(--surface-2)' },
}

function VisibilityToggle({
  value,
  onChange,
}: {
  value:    'public' | 'members_only' | 'private'
  onChange: (v: 'public' | 'members_only' | 'private') => void
}) {
  const cfg   = VISIBILITY_CONFIG[value]
  const cycle = () => {
    const idx = VISIBILITY_CYCLE.indexOf(value)
    onChange(VISIBILITY_CYCLE[(idx + 1) % VISIBILITY_CYCLE.length])
  }
  return (
    <Tooltip title="Click to change visibility">
      <button
        type="button"
        onClick={cycle}
        style={{
          padding:      '5px 14px',
          borderRadius: 9999,
          fontSize:     11,
          fontWeight:   700,
          letterSpacing:'0.07em',
          textTransform:'uppercase',
          background:   cfg.bg,
          color:        cfg.color,
          border:       value === 'private' ? '1.5px solid var(--border-default)' : 'none',
          cursor:       'pointer',
          whiteSpace:   'nowrap',
        }}
      >
        {cfg.label}
      </button>
    </Tooltip>
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
    transform:  CSS.Transform.toString(transform),
    transition,
    zIndex:     isDragging ? 50 : 1,
    opacity:    isDragging ? 0.85 : 1,
    position:   'relative',
    aspectRatio: '1',
    borderRadius: 10,
    overflow:   'hidden',
    border:     isCover ? '2.5px solid var(--action-primary)' : '2px solid var(--border-default)',
    cursor:     isDragging ? 'grabbing' : 'default',
    boxShadow:  isDragging ? '0 8px 24px rgba(0,0,0,0.35)' : 'none',
  }

  return (
    <div ref={setNodeRef} style={style}>
      {/* Cover image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.publicUrl}
        alt={item.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', userSelect: 'none' }}
        draggable={false}
      />

      {/* Bottom gradient + title */}
      <div style={{
        position:   'absolute',
        bottom:     0,
        left:       0,
        right:      0,
        padding:    '24px 8px 8px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.72))',
        pointerEvents: 'none',
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title}
        </p>
      </div>

      {/* Drag handle — top left */}
      <div
        {...attributes}
        {...listeners}
        style={{
          position:   'absolute',
          top:        6,
          left:       6,
          width:      28,
          height:     28,
          borderRadius: 6,
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(4px)',
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color:      '#fff',
          cursor:     'grab',
        }}
        title="Drag to reorder"
      >
        <IconDragHandle />
      </div>

      {/* Star — top right */}
      <Tooltip title="Set as cover image" placement="top">
        <button
          type="button"
          onClick={onSetCover}
          style={{
            position:   'absolute',
            top:        6,
            right:      6,
            width:      28,
            height:     28,
            borderRadius: 6,
            background: isCover ? 'var(--action-primary)' : 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(4px)',
            border:     'none',
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color:      isCover ? '#fff' : 'rgba(255,255,255,0.85)',
            cursor:     'pointer',
          }}
        >
          <IconStar filled={isCover} />
        </button>
      </Tooltip>

      {/* Remove — bottom right */}
      <button
        type="button"
        onClick={onRemove}
        title="Remove from gallery"
        style={{
          position:   'absolute',
          bottom:     6,
          right:      6,
          width:      24,
          height:     24,
          borderRadius: 6,
          background: 'rgba(211,47,47,0.85)',
          backdropFilter: 'blur(4px)',
          border:     'none',
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color:      '#fff',
          cursor:     'pointer',
        }}
      >
        <IconX size={11} />
      </button>
    </div>
  )
}

// ─── Add Photos modal ─────────────────────────────────────────────────────────

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
  onConfirm:     (selected: Set<string>) => void
}) {
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set(currentIds))
  const inputRef = useRef<HTMLInputElement>(null)

  // Re-sync when modal opens
  const prevOpenRef = useRef(false)
  if (open && !prevOpenRef.current) {
    // reset on open
    prevOpenRef.current = true
    // (useState initialiser ran; need effect-like reset — handled via key on modal below)
  }
  if (!open && prevOpenRef.current) prevOpenRef.current = false

  const filtered = useMemo(
    () => libraryImages.filter(img => img.title.toLowerCase().includes(search.toLowerCase())),
    [libraryImages, search],
  )

  function toggle(id: string) {
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
        position:   'fixed',
        inset:      0,
        zIndex:     1200,
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding:    24,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:        '100%',
          maxWidth:     760,
          maxHeight:    'calc(100vh - 48px)',
          borderRadius: 18,
          background:   'var(--surface-1)',
          border:       '1px solid var(--border-default)',
          display:      'flex',
          flexDirection:'column',
          overflow:     'hidden',
        }}
      >
        {/* Header */}
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

          {/* Search + bulk actions row */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your photos…"
              autoFocus
              style={{
                flex:         1,
                height:       38,
                borderRadius: 8,
                border:       '1.5px solid var(--border-default)',
                background:   'var(--surface-2)',
                color:        'var(--text-primary)',
                padding:      '0 12px',
                fontSize:     14,
                outline:      'none',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--action-primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border-default)')}
            />
            <button
              type="button"
              onClick={() => setSelected(new Set(libraryImages.map(i => i.id)))}
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

        {/* Image grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', scrollbarWidth: 'thin' }}>
          {filtered.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14, padding: '40px 0' }}>
              No photos match your search.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
              {filtered.map(img => {
                const inGallery  = currentIds.has(img.id)
                const isSelected = selected.has(img.id)
                // "In gallery but deselected" means user is removing it
                const removing = inGallery && !isSelected

                return (
                  <div
                    key={img.id}
                    onClick={() => toggle(img.id)}
                    style={{
                      position:    'relative',
                      aspectRatio: '1',
                      borderRadius: 8,
                      overflow:    'hidden',
                      cursor:      'pointer',
                      border:      isSelected
                        ? '2px solid var(--action-primary)'
                        : removing
                        ? '2px solid var(--status-error)'
                        : '2px solid var(--border-default)',
                      boxShadow: isSelected ? '0 0 0 3px rgba(26,111,196,0.20)' : 'none',
                      opacity:   removing ? 0.45 : 1,
                      transition: 'opacity 0.15s, border-color 0.15s',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.publicUrl}
                      alt={img.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {/* Selected checkmark */}
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: 5, left: 5,
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'var(--action-primary)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <IconCheck size={11} />
                      </div>
                    )}
                    {/* "In gallery" badge for already-included images */}
                    {inGallery && isSelected && (
                      <div style={{
                        position:     'absolute',
                        bottom:       4,
                        left:         4,
                        right:        4,
                        background:   'rgba(0,0,0,0.58)',
                        borderRadius: 4,
                        padding:      '2px 5px',
                        textAlign:    'center',
                      }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          In gallery
                        </span>
                      </div>
                    )}
                    {/* Removing indicator */}
                    {removing && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(211,47,47,0.15)',
                      }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--status-error)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          Removing
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding:      '14px 24px 20px',
          borderTop:    '1px solid var(--border-subtle)',
          display:      'flex',
          gap:          10,
          justifyContent: 'flex-end',
          flexShrink:   0,
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
            Add Photos {selected.size > 0 && `(${selected.size})`}
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
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [copied,      setCopied]      = useState(false)
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

  function handleAddConfirm(selected: Set<string>) {
    const libraryMap = new Map(libraryImages.map(i => [i.id, i]))
    const currentIds = new Set(items.map(i => i.id))
    const kept    = items.filter(i => selected.has(i.id))
    const newOnes = libraryImages.filter(i => selected.has(i.id) && !currentIds.has(i.id))
    const next    = [...kept, ...newOnes]
    setItems(next)
    if (coverId && !selected.has(coverId)) {
      setCoverId(next[0]?.id ?? null)
    }
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

  function handleShare() {
    if (visibility === 'private') return
    const url = `${window.location.origin}/${clubSlug}/gallery/${userId}/${gallery.slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

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

        <VisibilityToggle value={visibility} onChange={setVisibility} />

        {visibility !== 'private' && (
          <button
            type="button"
            onClick={handleShare}
            style={{
              padding: '6px 16px', borderRadius: 9999, fontSize: 13, fontWeight: 600,
              background: 'var(--surface-2)', border: '1.5px solid var(--border-default)',
              color: 'var(--text-primary)', cursor: 'pointer',
            }}
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
        )}

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
    </div>
  )
}

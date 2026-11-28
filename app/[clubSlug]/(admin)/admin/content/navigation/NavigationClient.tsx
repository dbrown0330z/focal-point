'use client'

import Link from 'next/link'
import { Fragment, useEffect, useRef, useState, useTransition } from 'react'
import {
  Alert, Button, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  FormControl, FormControlLabel, FormLabel,
  MenuItem, Radio, RadioGroup,
  Select, Switch, TextField,
} from '@mui/material'
import AddIcon           from '@mui/icons-material/Add'
import ChevronRightIcon   from '@mui/icons-material/ChevronRight'
import DeleteOutlineIcon  from '@mui/icons-material/DeleteOutlined'
import { useParams }   from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { publishNavSettings } from './actions'
import { createPortal } from 'react-dom'
import { type AdminGalleryData, type ClubMember } from '../galleries/ClubGalleriesTab'
import { DndContext, DragOverlay, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'

// ── Types ─────────────────────────────────────────────────────────────────────

type PageType     = 'rich_text' | 'document_link' | 'external_link'
type Visibility   = 'all_members' | 'members_only' | 'hidden'
type BuiltinVis   = 'members_only' | 'public'
type PageStatus   = 'draft' | 'published'
type ParentSystem = 'calendar' | 'images' | 'competitions' | 'our-club'

export type BuiltinPageVisibility = {
  about:            BuiltinVis
  calendar:         BuiltinVis
  resourcesEnabled: boolean
  galleriesEnabled: boolean
}

export type CustomPage = {
  id:            string
  title:         string
  slug:          string
  parent_system: ParentSystem | null
  tab_id:        string | null
  page_type:     PageType
  external_url:  string | null
  visibility:    Visibility
  status:        PageStatus
  sort_order:    number
  updated_at:    string | null
}

export type CustomTab = {
  id:         string
  name:       string
  slug:       string
  sort_order: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SYS_CHILD_COUNTS: Record<string, number> = { images: 2, competitions: 3, 'our-club': 5 }
const SLOT_LABEL: Record<ParentSystem, string>  = {
  calendar: 'Calendar', images: 'Images', competitions: 'Competitions', 'our-club': 'Our Club',
}
const NAV_MAX_SLOTS  = 6
const MAX_CUSTOM_TABS = 2
const GRID_COLS  = '28px minmax(0,1fr) 120px 150px 70px 130px'
const GRID_GAP   = '24px'
const GRID_PAD   = '0 20px 0 12px'
const TAB_HDR_BG = '#EEF0F4'

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── Builtin page definitions ──────────────────────────────────────────────────

type EditSlot = 'edit' | 'manage' | 'auto-generated' | 'user-generated' | null

type BuiltinPageDef = {
  key:       string
  title:     string
  tooltip:   string
  viewPath?: string
  editPath?: string
  editSlot:  EditSlot
  hasDrag:      boolean
  alwaysPublic?: boolean
  visKey?:   'about' | 'calendar' | 'galleries' | 'join'
  enableKey?: 'resources' | 'galleries'
}

type SortableItem =
  | { sortId: string; kind: 'builtin'; page: BuiltinPageDef }
  | { sortId: string; kind: 'custom';  page: CustomPage }

const HOME_PAGES: BuiltinPageDef[] = [{
  key: 'homepage', title: 'Homepage', hasDrag: false, alwaysPublic: true,
  tooltip:  'Visible to everyone. Anonymous visitors see the public landing page; signed-in members see the activity hub and news feed.',
  viewPath: '/', editPath: '/admin/content/homepage', editSlot: 'edit',
}]

const CALENDAR_PAGES: BuiltinPageDef[] = [{
  key: 'calendar-main', title: 'Calendar', hasDrag: false, alwaysPublic: true,
  tooltip: 'The club calendar. Always visible to everyone, including public visitors.',
  viewPath: '/calendar', editSlot: null,
}]

const IMAGES_PAGES: BuiltinPageDef[] = [
  { key: 'my-images',    title: 'My images',    hasDrag: true, viewPath: '/library',           tooltip: 'Each member sees their own library. Always on.', editSlot: 'user-generated' },
  { key: 'my-galleries', title: 'My galleries', hasDrag: true, viewPath: '/library/galleries', tooltip: 'Each member sees their own library. Always on.', editSlot: 'user-generated' },
]

const COMPETITIONS_PAGES: BuiltinPageDef[] = [
  { key: 'comp-current',   title: 'Current',   hasDrag: true, viewPath: '/competitions',                 tooltip: 'Competitions currently open for entries.',     editSlot: 'auto-generated' },
  { key: 'comp-results',   title: 'Results',   hasDrag: true, viewPath: '/competitions/results',         tooltip: 'Scores and winners from past competitions.',   editSlot: 'auto-generated' },
  { key: 'comp-standings', title: 'Standings', hasDrag: true, viewPath: '/our-club/members/standings',   tooltip: 'Cumulative member rankings across the season.', editSlot: 'auto-generated' },
]

const OUR_CLUB_PAGES: BuiltinPageDef[] = [
  { key: 'about',            title: 'About our club',   hasDrag: true, visKey: 'about',    editSlot: 'edit',   viewPath: '/our-club/about',    editPath: '/admin/content/about',
    tooltip: 'Customizable content page for describing your club.' },
  { key: 'member-directory', title: 'Member directory', hasDrag: true, viewPath: '/our-club/members', editSlot: 'auto-generated',
    tooltip: 'List of club members and their contact details.' },
  { key: 'resources',        title: 'Resources',        hasDrag: true, alwaysPublic: true, enableKey: 'resources', editSlot: 'manage', viewPath: '/our-club/resources', editPath: '/admin/resources',
    tooltip: 'Documents, downloads, and links. Page is public by default — toggle to hide it from navigation. Set visibility on individual items.' },
  { key: 'club-galleries',   title: 'Club galleries',   hasDrag: true, enableKey: 'galleries', visKey: 'galleries', editSlot: 'manage', viewPath: '/our-club/galleries', editPath: '/admin/galleries',
    tooltip: 'Curated photo galleries created by admins.' },
  { key: 'join',             title: 'Join / Renew',     hasDrag: true, visKey: 'join',     editSlot: 'edit',   viewPath: '/our-club/join',     editPath: '/admin/content/join',
    tooltip: 'Membership information and payment instructions.' },
]

// ── Icons ─────────────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function HorizGrip() {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" aria-hidden="true">
      {([3, 10, 17] as number[]).flatMap(cx => ([2, 8] as number[]).map(cy =>
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" fill="currentColor" opacity="0.70"/>
      ))}
    </svg>
  )
}

function VertGrip() {
  return (
    <svg width="10" height="20" viewBox="0 0 10 20" aria-hidden="true">
      {([2, 8] as number[]).flatMap(cx => ([3, 10, 17] as number[]).map(cy =>
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" fill="currentColor" opacity="0.70"/>
      ))}
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}

// ── InfoTooltip ───────────────────────────────────────────────────────────────

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const show = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ x: r.left + r.width / 2, y: r.top })
    }
    setOpen(true)
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <button ref={btnRef}
        type="button" aria-label="More information"
        onMouseEnter={show} onMouseLeave={() => setOpen(false)}
        onFocus={show} onBlur={() => setOpen(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#7E8EA3', display: 'inline-flex', lineHeight: 1 }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12.01" y2="8"/><polyline points="11 12 12 12 12 16"/>
        </svg>
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <span role="tooltip" style={{
          position: 'fixed', top: pos.y - 8, left: pos.x,
          transform: 'translateX(-50%) translateY(-100%)',
          background: '#1F2733', color: '#fff', fontSize: 12,
          borderRadius: 6, padding: '6px 10px', width: 220, whiteSpace: 'normal',
          zIndex: 9999, pointerEvents: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', lineHeight: 1.5,
        }}>
          {text}
        </span>,
        document.body
      )}
    </span>
  )
}

// ── CUSTOM chip ───────────────────────────────────────────────────────────────

function CustomChip() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 6px',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      background: '#F1F3F6', color: '#5A6C82',
      border: '1px solid #C9CED6', borderRadius: 4, flexShrink: 0,
    }}>Custom</span>
  )
}

// ── Visibility selects ────────────────────────────────────────────────────────

const selSx = {
  height: 32, fontSize: 13, bgcolor: '#fff', width: '100%',
  '& .MuiOutlinedInput-notchedOutline': { borderRadius: '6px', borderColor: '#C4C4C4' },
}

function BuiltinVisSelect({ value, onChange }: { value: BuiltinVis; onChange: (v: BuiltinVis) => void }) {
  return (
    <Select size="small" value={value} onChange={e => onChange(e.target.value as BuiltinVis)} sx={selSx}>
      <MenuItem value="public"       sx={{ fontSize: 13 }}>Public</MenuItem>
      <MenuItem value="members_only" sx={{ fontSize: 13 }}>Members only</MenuItem>
    </Select>
  )
}

function CustomVisSelect({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  return (
    <Select size="small" value={value} onChange={e => onChange(e.target.value as Visibility)} sx={selSx}>
      <MenuItem value="all_members"  sx={{ fontSize: 13 }}>Public</MenuItem>
      <MenuItem value="members_only" sx={{ fontSize: 13 }}>Members only</MenuItem>
    </Select>
  )
}

// ── Builtin page row ──────────────────────────────────────────────────────────

function BuiltinPageRow({
  page, clubSlug, builtinVis, onChangeVis, onChangeEnabled, pending, dragHandleProps,
}: {
  page:            BuiltinPageDef
  clubSlug:        string
  builtinVis:      BuiltinPageVisibility
  onChangeVis:     (key: 'about' | 'calendar', v: BuiltinVis) => void
  onChangeEnabled: (key: 'resources' | 'galleries', v: boolean) => void
  pending:         boolean
  dragHandleProps?: Record<string, unknown>
}) {
  const enabled = page.enableKey === 'resources' ? builtinVis.resourcesEnabled
    : page.enableKey === 'galleries' ? builtinVis.galleriesEnabled
    : true
  const dimmed = !!page.enableKey && !enabled

  const visValue: BuiltinVis =
    page.visKey === 'about'    ? builtinVis.about :
    page.visKey === 'calendar' ? builtinVis.calendar :
    'members_only'

  const hasBuiltinVisSelect = page.visKey === 'about' || page.visKey === 'galleries'

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: GRID_COLS, gap: GRID_GAP, padding: '12px 20px 12px 12px',
      alignItems: 'center', minHeight: 60, borderTop: '1px solid #D8DDE7',
      background: dimmed ? '#F3F4F6' : '#fff',
    }}>
      {/* Drag handle */}
      <div style={{ display: 'flex', justifyContent: 'center', color: '#5A6C82', opacity: page.hasDrag ? 1 : 0 }}>
        <span {...((dragHandleProps ?? {}) as React.HTMLAttributes<HTMLSpanElement>)}
          style={{ touchAction: 'none', cursor: page.hasDrag ? 'grab' : 'default', display: 'flex' }}>
          <VertGrip />
        </span>
      </div>
      {/* Name + tooltip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, opacity: dimmed ? 0.45 : 1 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: '#131F2E' }}>{page.title}</span>
        <InfoTooltip text={page.tooltip} />
      </div>
      {/* Col 3 — On/Off */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: dimmed ? 0.45 : 1 }}>
        {page.enableKey ? (
          <>
            <Switch size="small" checked={enabled}
              onChange={e => onChangeEnabled(page.enableKey!, e.target.checked)}
              disabled={pending} />
            <span style={{ fontSize: 12, color: enabled ? '#5A6C82' : '#B0BACA', whiteSpace: 'nowrap' }}>
              {enabled ? 'Visible' : 'Hidden'}
            </span>
          </>
        ) : page.editSlot === 'user-generated' ? (
          <span style={{ fontSize: 12, color: '#7E8EA3', whiteSpace: 'nowrap' }}>Always on</span>
        ) : null}
      </div>
      {/* Col 4 — Visibility */}
      <div style={{ opacity: dimmed ? 0.45 : 1, pointerEvents: dimmed ? 'none' : 'auto' }}>
        {page.alwaysPublic ? (
          <span style={{ fontSize: 14, color: '#5A6C82' }}>Public</span>
        ) : hasBuiltinVisSelect ? (
          <BuiltinVisSelect value={visValue} onChange={v => onChangeVis(page.visKey as 'about' | 'calendar', v)} />
        ) : page.visKey === 'join' ? (
          <BuiltinVisSelect value="public" onChange={() => {}} />
        ) : (
          <span style={{ fontSize: 14, color: '#5A6C82' }}>Members only</span>
        )}
      </div>
      {/* Col 5 — View link */}
      <div style={{ opacity: dimmed ? 0.45 : 1, pointerEvents: dimmed ? 'none' : 'auto' }}>
        {page.viewPath && (
          <a href={`/${clubSlug}${page.viewPath}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, color: '#1E4D8C', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            View <ExternalIcon />
          </a>
        )}
      </div>
      {/* Col 6 — Edit / Manage / status */}
      <div style={{ opacity: dimmed ? 0.45 : 1, pointerEvents: dimmed ? 'none' : 'auto' }}>
        {(page.editSlot === 'edit' || page.editSlot === 'manage') && page.editPath ? (
          <Button component={Link} href={`/${clubSlug}${page.editPath}`}
            variant="outlined" color="primary" size="small"
            sx={{ fontSize: 12, py: 0.5 }}>
            {page.editSlot === 'manage' ? 'Manage' : 'Edit'}
          </Button>
        ) : page.editSlot === 'auto-generated' ? (
          <span style={{ fontSize: 12, fontStyle: 'italic', color: '#7E8EA3' }}>Auto-generated</span>
        ) : page.editSlot === 'user-generated' ? (
          <span style={{ fontSize: 12, fontStyle: 'italic', color: '#7E8EA3' }}>User generated</span>
        ) : page.editSlot === null ? (
          <span style={{ fontSize: 12, fontStyle: 'italic', color: '#7E8EA3' }}>Admin managed</span>
        ) : null}
      </div>
    </div>
  )
}

// ── Custom page row ───────────────────────────────────────────────────────────

function CustomPageRow({
  page, clubSlug, onDelete, onChangeVis, pending, dragHandleProps,
}: {
  page:          CustomPage
  clubSlug:      string
  onDelete:      (id: string) => void
  onChangeVis:   (id: string, v: Visibility) => void
  pending:       boolean
  dragHandleProps?: Record<string, unknown>
}) {
  const isHidden = page.visibility === 'hidden'
  return (
    <div style={{
        display: 'grid', gridTemplateColumns: GRID_COLS, gap: GRID_GAP, padding: '12px 20px 12px 12px',
        alignItems: 'center', minHeight: 60, borderTop: '1px solid #D8DDE7',
        background: isHidden ? '#F3F4F6' : '#fff',
      }}>
      {/* Col 1 — drag */}
      <div style={{ display: 'flex', justifyContent: 'center', color: '#5A6C82', opacity: isHidden ? 0.4 : 1 }}>
        <span {...(dragHandleProps as React.HTMLAttributes<HTMLSpanElement>)}
          aria-label="Drag to reorder" style={{ touchAction: 'none', cursor: 'grab', display: 'flex' }}>
          <VertGrip />
        </span>
      </div>
      {/* Col 2 — name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, opacity: isHidden ? 0.4 : 1 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: '#131F2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {page.title}
        </span>
        <InfoTooltip text="Admin-created page." />
        <CustomChip />
      </div>
      {/* Col 3 — On/Off toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Switch size="small" checked={!isHidden}
          onChange={e => onChangeVis(page.id, e.target.checked ? 'members_only' : 'hidden')}
          disabled={pending} />
        <span style={{ fontSize: 12, color: isHidden ? '#B0BACA' : '#5A6C82', whiteSpace: 'nowrap' }}>
          {isHidden ? 'Hidden' : 'Visible'}
        </span>
      </div>
      {/* Col 4 — visibility */}
      <div style={{ opacity: isHidden ? 0.4 : 1, pointerEvents: isHidden ? 'none' : 'auto' }}>
        {!isHidden && <CustomVisSelect value={page.visibility} onChange={v => onChangeVis(page.id, v)} />}
      </div>
      {/* Col 5 — view link */}
      <div style={{ opacity: isHidden ? 0.4 : 1, pointerEvents: isHidden ? 'none' : 'auto' }}>
        <a href={`/${clubSlug}/our-club/${page.slug}`} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 13, color: '#1E4D8C', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          View <ExternalIcon />
        </a>
      </div>
      {/* Col 6 — edit + delete */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: isHidden ? 0.4 : 1, pointerEvents: isHidden ? 'none' : 'auto' }}>
        <Button component={Link} href={`/${clubSlug}/admin/content/navigation/${page.id}`}
          variant="outlined" color="primary" size="small"
          sx={{ fontSize: 12, py: 0.5, minWidth: 56 }}>Edit</Button>
        <Button variant="text" color="error" size="small"
          onClick={() => onDelete(page.id)} disabled={pending}
          sx={{ minWidth: 0, px: 0.5, py: 0.5 }}>
          <DeleteOutlineIcon sx={{ fontSize: 18 }} />
        </Button>
      </div>
    </div>
  )
}

// ── Add page footer ───────────────────────────────────────────────────────────

function AddPageFooter({ tabName, onClick }: { tabName: string; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
        background: 'none', border: 'none', borderTop: '1px solid #D8DDE7',
        cursor: 'pointer', color: '#1E4D8C', fontSize: 13, fontWeight: 500,
        width: '100%', textAlign: 'left',
      }}
    >
      <AddIcon sx={{ fontSize: 16 }} /> Add page to {tabName}
    </button>
  )
}

// ── Sortable tab wrapper (dnd-kit) ────────────────────────────────────────────
function SortableTab({ id, disabled = false, children }: {
  id: string
  disabled?: boolean
  children: (handleProps: Record<string, unknown>) => React.ReactNode
}) {
  const { setNodeRef, attributes, listeners, isDragging } = useSortable({ id, disabled })
  return (
    <div ref={setNodeRef} style={{ opacity: isDragging ? 0 : 1 }}>
      {children(disabled ? {} : { ...attributes, ...listeners })}
    </div>
  )
}

function TabGhost({ label }: { label: string }) {
  return (
    <div style={{
      border: '1px solid #B0BACA', borderRadius: 10,
      background: '#fff',
      boxShadow: '0 8px 24px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
      padding: '10px 16px', opacity: 0.92,
      transform: 'rotate(1deg)', cursor: 'grabbing',
      display: 'flex', alignItems: 'center', gap: 8,
      color: '#131F2E', fontSize: 14, fontWeight: 500,
    }}>
      <HorizGrip />{label}
    </div>
  )
}

function DropLine() {
  return <div style={{ height: 3, background: '#2E7D32', borderRadius: 2, margin: '2px 8px' }} />
}

// ── Sortable page + page group (dnd-kit) ─────────────────────────────────────
function SortablePage({ id, children }: {
  id: string
  children: (handleProps: Record<string, unknown>) => React.ReactNode
}) {
  const { setNodeRef, attributes, listeners, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef} style={{ opacity: isDragging ? 0 : 1 }}>
      {children({ ...attributes, ...listeners })}
    </div>
  )
}

function PageGhost({ title }: { title: string }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 8,
      boxShadow: '0 8px 24px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
      padding: '8px 16px', opacity: 0.92,
      transform: 'rotate(0.5deg)', cursor: 'grabbing',
      display: 'flex', alignItems: 'center', gap: 8,
      color: '#131F2E', fontSize: 14, fontWeight: 500,
    }}>
      <VertGrip />{title}
    </div>
  )
}

function getGroupItems(
  group:       string,
  builtinDefs: BuiltinPageDef[],
  customPages: CustomPage[],
  pageOrders:  Record<string, string[]>,
): SortableItem[] {
  const order = pageOrders[group]
  if (!order) {
    const items: SortableItem[] = builtinDefs.map(p => ({ sortId: `builtin:${p.key}`, kind: 'builtin' as const, page: p }))
    customPages.slice().sort((a, b) => a.sort_order - b.sort_order)
      .forEach(p => items.push({ sortId: p.id, kind: 'custom' as const, page: p }))
    return items
  }
  const bMap = Object.fromEntries(builtinDefs.map(p => [`builtin:${p.key}`, p]))
  const cMap = Object.fromEntries(customPages.map(p => [p.id, p]))
  const items: SortableItem[] = []
  for (const sortId of order) {
    if (sortId.startsWith('builtin:')) {
      const bp = bMap[sortId]; if (bp) items.push({ sortId, kind: 'builtin', page: bp })
    } else {
      const cp = cMap[sortId]; if (cp) items.push({ sortId, kind: 'custom', page: cp })
    }
  }
  for (const cp of customPages) {
    if (!order.includes(cp.id)) items.push({ sortId: cp.id, kind: 'custom', page: cp })
  }
  return items
}

function SortablePageGroup({ items, clubSlug, onDeleteCustom, onChangeVis, pending, activeDragId, overDragId, builtinRowProps }: {
  items:          SortableItem[]
  clubSlug:       string
  onDeleteCustom: (id: string) => void
  onChangeVis:    (id: string, v: Visibility) => void
  pending:        boolean
  activeDragId:   string | null
  overDragId:     string | null
  builtinRowProps?: {
    builtinVis:      BuiltinPageVisibility
    onChangeVis:     (key: 'about' | 'calendar', v: BuiltinVis) => void
    onChangeEnabled: (key: 'resources' | 'galleries', v: boolean) => void
  }
}) {
  const ids = items.map(i => i.sortId)
  const proj = (activeDragId && overDragId && activeDragId !== overDragId && ids.includes(activeDragId) && ids.includes(overDragId))
    ? arrayMove(ids, ids.indexOf(activeDragId), ids.indexOf(overDragId))
    : null
  const activeNewIdx = proj ? proj.indexOf(activeDragId!) : -1
  if (items.length === 0) return null
  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      {items.map((item, sortIdx) => {
        const showLineBefore = proj !== null && activeNewIdx === 0 && sortIdx === 0
        const showLineAfter  = proj !== null && activeNewIdx > 0 && proj[activeNewIdx - 1] === item.sortId
        return (
          <SortablePage key={item.sortId} id={item.sortId}>
            {hProps => (<>
              {showLineBefore && <DropLine />}
              {item.kind === 'builtin'
                ? <BuiltinPageRow page={item.page} clubSlug={clubSlug}
                    builtinVis={builtinRowProps!.builtinVis}
                    onChangeVis={builtinRowProps!.onChangeVis}
                    onChangeEnabled={builtinRowProps!.onChangeEnabled}
                    pending={pending} dragHandleProps={hProps} />
                : <CustomPageRow page={item.page} clubSlug={clubSlug} onDelete={onDeleteCustom}
                    onChangeVis={onChangeVis} pending={pending} dragHandleProps={hProps} />}
              {showLineAfter && <DropLine />}
            </>)}
          </SortablePage>
        )
      })}
    </SortableContext>
  )
}

// ── Tab block (builtin) ───────────────────────────────────────────────────────

function TabBlock({
  label, note, isLocked, isCalendar, isCustom, pageCount,
  expanded, onToggle, headerRightContent, dragHandleEl, children, footerEl,
  onDragOver, onDrop, dragOverStyle,
}: {
  label:               string
  note?:               string
  isLocked?:           boolean
  isCalendar?:         boolean
  isCustom?:           boolean
  pageCount:           number
  expanded:            boolean
  onToggle:            () => void
  headerRightContent?: React.ReactNode
  dragHandleEl?:       React.ReactNode
  children?:           React.ReactNode
  footerEl?:           React.ReactNode
  onDragOver?:         (e: React.DragEvent) => void
  onDrop?:             () => void
  dragOverStyle?:      React.CSSProperties
}) {
  const pageWord = pageCount === 1 ? 'page' : 'pages'
  return (
    <div onDragOver={onDragOver} onDrop={onDrop}
      style={{
        border: '1px solid #B0BACA', borderRadius: 10, overflow: 'hidden',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        ...(dragOverStyle ?? {}),
      }}>
      <div style={{
        display: 'grid', gridTemplateColumns: GRID_COLS, gap: GRID_GAP, padding: GRID_PAD,
        alignItems: 'center', minHeight: 56, background: TAB_HDR_BG,
        borderBottom: expanded && !isCalendar ? '1px solid #B0BACA' : 'none',
        borderRadius: expanded && !isCalendar ? '10px 10px 0 0' : 10,
        position: 'relative',
      }}>
        {/* Col 1 — caret / lock */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {isLocked ? (
            <span style={{ color: '#7E8EA3', display: 'flex', opacity: 0.6 }}><LockIcon /></span>
          ) : !isCalendar ? (
            <button type="button" onClick={onToggle} aria-label={expanded ? 'Collapse' : 'Expand'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#7E8EA3', display: 'flex', alignItems: 'center', borderRadius: 4 }}>
              <ChevronRightIcon sx={{ fontSize: 18, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
            </button>
          ) : null}
        </div>
        {/* Col 2 — name + count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#131F2E', whiteSpace: 'nowrap' }}>{label}</span>
          {!isCalendar && (
            <span style={{ fontSize: 14, color: '#7E8EA3', fontWeight: 400 }}>
              ({pageCount} {pageWord})
            </span>
          )}
          {isCustom && <CustomChip />}
          {note && <span style={{ fontSize: 13, fontStyle: 'italic', color: '#7E8EA3' }}>{note}</span>}
        </div>
        {/* Centered drag handle */}
        {dragHandleEl && (
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', color: '#5A6C82', display: 'flex', cursor: 'grab' }}>
            {dragHandleEl}
          </div>
        )}
        {/* Col 3 — on/off (empty in header) */}
        <div />
        {/* Col 4 — visibility */}
        <div>{headerRightContent}</div>
        {/* Col 5 — view (empty in header) */}
        <div />
        {/* Col 6 — manage (empty in header) */}
        <div />
      </div>
      {expanded && children}
      {expanded && footerEl}
    </div>
  )
}

// ── Custom tab block ──────────────────────────────────────────────────────────

function CustomTabBlock({
  tab, items, clubSlug, onDelete, onDeletePage, onChangeVis, onAddPage,
  pending, dragHandleEl, dragOverStyle, onDragOver, onDrop, activeDragId, overDragId, builtinRowProps,
}: {
  tab:           CustomTab
  items:         SortableItem[]
  clubSlug:      string
  onDelete:      (id: string) => void
  onDeletePage:  (id: string) => void
  onChangeVis:   (id: string, v: Visibility) => void
  onAddPage:     () => void
  pending:       boolean
  dragHandleEl:      React.ReactNode
  dragOverStyle?:    React.CSSProperties
  onDragOver?:   (e: React.DragEvent) => void
  onDrop?:       () => void
  activeDragId?: string | null
  overDragId?:   string | null
  builtinRowProps?: {
    builtinVis:      BuiltinPageVisibility
    onChangeVis:     (key: 'about' | 'calendar', v: BuiltinVis) => void
    onChangeEnabled: (key: 'resources' | 'galleries', v: boolean) => void
  }
}) {
  const [expanded, setExpanded] = useState(true)
  const count = items.length
  return (
    <div onDragOver={onDragOver} onDrop={onDrop}
      style={{ border: '1px solid #B0BACA', borderRadius: 10, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', ...(dragOverStyle ?? {}) }}>
      <div style={{
        display: 'grid', gridTemplateColumns: GRID_COLS, gap: GRID_GAP, padding: GRID_PAD,
        alignItems: 'center', minHeight: 56, background: TAB_HDR_BG,
        borderBottom: expanded ? '1px solid #B0BACA' : 'none',
        borderRadius: expanded ? '10px 10px 0 0' : 10, position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button type="button" onClick={() => setExpanded(e => !e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#7E8EA3', display: 'flex', alignItems: 'center', borderRadius: 4 }}>
            <ChevronRightIcon sx={{ fontSize: 18, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#131F2E' }}>{tab.name}</span>
          <span style={{ fontSize: 14, color: '#7E8EA3', fontWeight: 400 }}>
            ({count} {count === 1 ? 'page' : 'pages'})
          </span>
          <CustomChip />
        </div>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', color: '#5A6C82', display: 'flex' }}>
          {dragHandleEl}
        </div>
        <div />
        <div />
        <div />
        <div>
          <Button variant="outlined" color="secondary" size="small" onClick={() => onDelete(tab.id)} disabled={pending} sx={{ fontSize: 12, py: 0.5 }}>
            Delete
          </Button>
        </div>
      </div>
      {expanded && (
        <SortablePageGroup items={items} clubSlug={clubSlug}
          onDeleteCustom={onDeletePage} onChangeVis={onChangeVis}
          pending={pending}
          activeDragId={activeDragId ?? null} overDragId={overDragId ?? null}
          builtinRowProps={builtinRowProps} />
      )}
      {expanded && count === 0 && (
        <div style={{
          padding: '32px 20px', textAlign: 'center', borderTop: '1px solid #B0BACA',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        }}>
          <Button variant="outlined" color="primary" size="small"
            startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
            onClick={onAddPage}>
            Add a page
          </Button>
          <span style={{ fontSize: 13, color: '#7E8EA3', maxWidth: 340, lineHeight: 1.6 }}>
            This tab won&apos;t appear in navigation until it has at least one page.
            One page → clicking the tab goes straight there.
            Multiple pages → clicking the tab opens a dropdown list.
          </span>
        </div>
      )}
      {expanded && count > 0 && <AddPageFooter tabName={tab.name} onClick={onAddPage} />}
    </div>
  )
}

// ── Column header row ─────────────────────────────────────────────────────────

function ColumnHeaders() {
  const lbl = { fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#7E8EA3' }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: GRID_COLS, gap: GRID_GAP, padding: '0 20px 0 12px', alignItems: 'center', marginBottom: 8 }}>
      <div />
      <span style={lbl}>Tab / Page</span>
      <span style={lbl}>On / Off</span>
      <span style={lbl}>Visibility</span>
      <span style={lbl}>View</span>
      <span style={lbl}>Manage</span>
    </div>
  )
}

// ── NewPageDialogFull ─────────────────────────────────────────────────────────

function NewPageDialogFull({
  open, tabs, pages, clubId, onPageCreated, onClose,
}: {
  open:          boolean
  tabs:          CustomTab[]
  pages:         CustomPage[]
  clubId:        string
  onPageCreated: (page: CustomPage) => void
  onClose:       () => void
}) {
  const sysTabOptions = (['images', 'competitions', 'our-club'] as ParentSystem[]).map(key => ({
    value: key, label: SLOT_LABEL[key],
    total: (SYS_CHILD_COUNTS[key] ?? 0) + pages.filter(p => p.parent_system === key).length,
  }))
  const customTabOptions = tabs.map(t => ({
    value: t.id, label: t.name, total: pages.filter(p => p.tab_id === t.id).length,
  }))
  const allOptions = [...sysTabOptions, ...customTabOptions]
  const defaultSection = allOptions.find(o => o.total < NAV_MAX_SLOTS)?.value ?? allOptions[0]?.value ?? ''

  const [section, setSection] = useState(defaultSection)
  const [title,   setTitle]   = useState('')
  const [type,    setType]    = useState<PageType>('rich_text')
  const [url,     setUrl]     = useState('https://')
  const [vis,     setVis]     = useState<Visibility>('all_members')
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSection(allOptions.find(o => o.total < NAV_MAX_SLOTS)?.value ?? allOptions[0]?.value ?? '')
      setTitle(''); setType('rich_text'); setUrl('https://'); setVis('all_members'); setErr(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function handleCreate() {
    if (!title.trim() || !section) return
    setSaving(true); setErr(null)
    const supabase = createClient()
    const isSystem = (['images', 'competitions', 'our-club'] as string[]).includes(section)
    const { data, error } = await supabase.from('nav_custom_pages').insert({
      club_id: clubId, title: title.trim(), slug: slugify(title),
      page_type: type, visibility: vis, status: vis === 'hidden' ? 'draft' : 'published',
      external_url: type === 'external_link' ? url : null,
      sort_order: pages.filter(p => isSystem ? p.parent_system === section : p.tab_id === section).length,
      ...(isSystem ? { parent_system: section, tab_id: null } : { parent_system: null, tab_id: section }),
    }).select().single()
    setSaving(false)
    if (error) { setErr(error.message); return }
    onPageCreated(data as CustomPage)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>New page</DialogTitle>
      <DialogContent sx={{ pt: '16px !important', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {err && <p className="text-[12px] m-0" style={{ color: '#D32F2F' }}>{err}</p>}
        <FormControl size="small" fullWidth>
          <FormLabel sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Tab</FormLabel>
          <Select value={section} onChange={e => setSection(e.target.value)} sx={{ fontSize: 13 }}>
            {allOptions.map(o => (
              <MenuItem key={o.value} value={o.value} disabled={o.total >= NAV_MAX_SLOTS} sx={{ fontSize: 13 }}>
                {o.label}{o.total >= NAV_MAX_SLOTS ? ' (full)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField label="Page title" size="small" fullWidth autoFocus
          slotProps={{ htmlInput: { maxLength: 40 } }}
          value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && title.trim() && !saving && handleCreate()} />
        <FormControl>
          <FormLabel sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Page type</FormLabel>
          <RadioGroup value={type} onChange={e => setType(e.target.value as PageType)}>
            <FormControlLabel value="rich_text"     control={<Radio size="small" />} sx={{ alignItems: 'center', mb: 0.5 }}
              label={<span><strong style={{ fontSize: 13 }}>Rich text</strong> <span style={{ fontSize: 12, color: '#5A6C82' }}>— formatted content</span></span>} />
            <FormControlLabel value="document_link" control={<Radio size="small" />} sx={{ alignItems: 'center', mb: 0.5 }}
              label={<span><strong style={{ fontSize: 13 }}>Document link</strong> <span style={{ fontSize: 12, color: '#5A6C82' }}>— links to a file in Resources</span></span>} />
            <FormControlLabel value="external_link" control={<Radio size="small" />} sx={{ alignItems: 'center' }}
              label={<span><strong style={{ fontSize: 13 }}>External link</strong> <span style={{ fontSize: 12, color: '#5A6C82' }}>— opens in a new tab</span></span>} />
          </RadioGroup>
        </FormControl>
        {type === 'external_link' && (
          <TextField label="URL" size="small" fullWidth value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" />
        )}
        <FormControl size="small" fullWidth>
          <FormLabel sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Visibility</FormLabel>
          <Select value={vis} onChange={e => setVis(e.target.value as Visibility)} sx={{ fontSize: 13 }}>
            <MenuItem value="all_members"  sx={{ fontSize: 13 }}>Public</MenuItem>
            <MenuItem value="members_only" sx={{ fontSize: 13 }}>Private</MenuItem>
            <MenuItem value="hidden"       sx={{ fontSize: 13 }}>Hidden — do not show in navigation</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" color="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!title.trim() || !section || saving} onClick={handleCreate}>
          {saving ? 'Creating…' : 'Create page'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── NewTabDialog ──────────────────────────────────────────────────────────────

function NewTabDialog({
  open, tabs, clubId, onTabCreated, onClose,
}: {
  open:         boolean
  tabs:         CustomTab[]
  clubId:       string
  onTabCreated: (tab: CustomTab) => void
  onClose:      () => void
}) {
  const [tabName, setTabName] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState<string | null>(null)
  const atMax = tabs.length >= MAX_CUSTOM_TABS

  useEffect(() => {
    if (open) { setTabName(''); setErr(null) }
  }, [open])

  async function handleCreate() {
    if (!tabName.trim() || atMax) return
    setSaving(true); setErr(null)
    const supabase = createClient()
    const { data, error } = await supabase.from('nav_custom_tabs').insert({
      club_id: clubId, name: tabName.trim(), slug: slugify(tabName), sort_order: tabs.length,
    }).select().single()
    setSaving(false)
    if (error) { setErr(error.message); return }
    onTabCreated(data as CustomTab)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>New tab</DialogTitle>
      <DialogContent sx={{ pt: '16px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {err && <p className="text-[12px] m-0" style={{ color: '#D32F2F' }}>{err}</p>}
        {atMax ? (
          <p className="text-[13px] m-0" style={{ color: '#5A6C82' }}>
            Maximum of {MAX_CUSTOM_TABS} custom tabs reached. Add pages to an existing tab instead.
          </p>
        ) : (
          <>
            <TextField label="Tab name" size="small" fullWidth autoFocus
              slotProps={{ htmlInput: { maxLength: 20 } }}
              value={tabName} onChange={e => setTabName(e.target.value.slice(0, 20))}
              helperText={`${tabName.length}/20 — shown in the main navigation bar`}
              onKeyDown={e => e.key === 'Enter' && tabName.trim() && !saving && handleCreate()} />
            <p className="text-[12px] m-0" style={{ color: '#5A6C82' }}>
              The new tab won&apos;t be visible to members until you add at least one published page to it.
            </p>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" color="secondary" onClick={onClose}>{atMax ? 'Close' : 'Cancel'}</Button>
        {!atMax && (
          <Button variant="contained" disabled={!tabName.trim() || saving} onClick={handleCreate}>
            {saving ? 'Creating…' : 'Create tab'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NavigationClient({
  customPages: initialPages,
  customTabs:  initialTabs,
  initialGalleries = [],
  members      = [],
  clubId,
  clubName     = '',
  initialBuiltinVisibility = { about: 'members_only', calendar: 'members_only', resourcesEnabled: true, galleriesEnabled: true },
}: {
  customPages:               CustomPage[]
  customTabs:                CustomTab[]
  initialGalleries?:         AdminGalleryData[]
  members?:                  ClubMember[]
  clubId:                    string
  clubName?:                 string
  initialBuiltinVisibility?: BuiltinPageVisibility
}) {
  // suppress unused-var lint for props kept for API compatibility
  void initialGalleries; void members; void clubName

  const params   = useParams()
  const clubSlug = typeof params.clubSlug === 'string' ? params.clubSlug : ''

  const [pages,      setPages]    = useState<CustomPage[]>(initialPages)
  const [tabs,       setTabs]     = useState<CustomTab[]>(initialTabs)
  const [builtinVis, setBV]       = useState<BuiltinPageVisibility>(initialBuiltinVisibility)
  const [pending,    startTrans]  = useTransition()
  const [err,        setErr]      = useState<string | null>(null)
  const [newPageOpen, setNewPageOpen] = useState(false)
  const [newTabOpen,  setNewTabOpen]  = useState(false)

  // Unified tab order (built-in + custom), persisted in localStorage
  const BUILTIN_IDS = ['home', 'calendar', 'images', 'competitions', 'our-club']
  const [tabOrder, setTabOrder] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [...BUILTIN_IDS, ...initialTabs.map(t => t.id)]
    try {
      const saved = JSON.parse(localStorage.getItem(`fp_nav_tabs_${clubId}`) ?? 'null')
      if (Array.isArray(saved)) {
        const all = new Set([...BUILTIN_IDS, ...initialTabs.map(t => t.id)])
        const extra = [...all].filter(id => !saved.includes(id))
        return [...saved.filter((id: string) => all.has(id)), ...extra]
      }
    } catch {}
    return [...BUILTIN_IDS, ...initialTabs.map(t => t.id)]
  })
  // Sync when custom tabs are added/deleted
  useEffect(() => {
    setTabOrder(prev => {
      const tabIds = tabs.map(t => t.id)
      const validCustom = new Set(tabIds)
      const filtered = prev.filter(id => BUILTIN_IDS.includes(id) || validCustom.has(id))
      const toAdd = tabIds.filter(id => !prev.includes(id))
      return toAdd.length > 0 ? [...filtered, ...toAdd] : filtered
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.length])

  // Combined page order per group (builtin + custom sortIds), deferred until publish
  const [pageOrders, setPageOrders] = useState<Record<string, string[]>>(() => {
    const tryLS = (key: string): string[] | null => {
      if (typeof window === 'undefined') return null
      try { return JSON.parse(localStorage.getItem(key) ?? 'null') } catch { return null }
    }
    const result: Record<string, string[]> = {}
    const groups: Array<[string, BuiltinPageDef[]]> = [
      ['calendar', CALENDAR_PAGES],
      ['images', IMAGES_PAGES],
      ['competitions', COMPETITIONS_PAGES],
      ['our-club', OUR_CLUB_PAGES],
    ]
    for (const [group, builtins] of groups) {
      const saved = tryLS(`fp_nav_page_order_${clubId}_${group}`)
      if (saved) { result[group] = saved; continue }
      const customs = initialPages.filter(p => p.parent_system === (group as ParentSystem))
        .sort((a, b) => a.sort_order - b.sort_order).map(p => p.id)
      result[group] = [...builtins.map(p => `builtin:${p.key}`), ...customs]
    }
    for (const tab of initialTabs) {
      const saved = tryLS(`fp_nav_page_order_${clubId}_${tab.id}`)
      if (saved) { result[tab.id] = saved; continue }
      result[tab.id] = initialPages.filter(p => p.tab_id === tab.id)
        .sort((a, b) => a.sort_order - b.sort_order).map(p => p.id)
    }
    return result
  })
  const [isDirty,        setIsDirty]        = useState(false)
  const [isPublishing,   setIsPublishing]   = useState(false)
  const [publishedAt,    setPublishedAt]    = useState<Date | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Warn before unload when draft changes are pending
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (isDirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // Unified drag state (tabs and pages share one DndContext)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [overDragId, setOverDragId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string)
  }
  function handleDragOver(event: DragOverEvent) {
    setOverDragId(event.over?.id as string ?? null)
  }
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    const aId = active.id as string
    const oId = over?.id as string ?? null
    setActiveDragId(null); setOverDragId(null)
    if (!oId || aId === oId) return
    const sortableIds = tabOrder.filter(id => id !== 'home')
    // Tab drag
    if (sortableIds.includes(aId)) {
      if (!sortableIds.includes(oId)) return
      const fi = sortableIds.indexOf(aId); const ti = sortableIds.indexOf(oId)
      setTabOrder(['home', ...arrayMove(sortableIds, fi, ti)])
      setIsDirty(true)
      return
    }
    // Page drag (sortId can be 'builtin:key' or UUID)
    let aGroup: string | null = null
    for (const [group, order] of Object.entries(pageOrders)) {
      if (order.includes(aId)) { aGroup = group; break }
    }
    let oGroup: string | null = null
    for (const [group, order] of Object.entries(pageOrders)) {
      if (order.includes(oId)) { oGroup = group; break }
    }
    if (!aGroup || aGroup !== oGroup) return
    const currentOrder = pageOrders[aGroup]
    const fi = currentOrder.indexOf(aId); const ti = currentOrder.indexOf(oId)
    if (fi === -1 || ti === -1) return
    setPageOrders(prev => ({ ...prev, [aGroup!]: arrayMove(currentOrder, fi, ti) }))
    setIsDirty(true)
  }
  function changeBuiltinVis(key: 'about' | 'calendar', value: BuiltinVis) {
    setBV(prev => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  function changePageEnabled(key: 'resources' | 'galleries', enabled: boolean) {
    const stateKey = key === 'resources' ? 'resourcesEnabled' : 'galleriesEnabled'
    setBV(prev => ({ ...prev, [stateKey]: enabled }))
    setIsDirty(true)
  }

  function changeCustomPageVis(id: string, v: Visibility) {
    setPages(prev => prev.map(p => p.id === id ? { ...p, visibility: v } : p))
    setIsDirty(true)
  }

  function deletePage(id: string) {
    startTrans(async () => {
      await createClient().from('nav_custom_pages').delete().eq('id', id)
      setPages(prev => prev.filter(p => p.id !== id))
      setPageOrders(prev => {
        const u = { ...prev }
        for (const g of Object.keys(u)) u[g] = u[g].filter(s => s !== id)
        return u
      })
    })
  }

  function deleteTab(id: string) {
    startTrans(async () => {
      await createClient().from('nav_custom_tabs').delete().eq('id', id)
      setTabs(prev => prev.filter(t => t.id !== id))
      setPages(prev => prev.filter(p => p.tab_id !== id))
      setPageOrders(prev => { const u = { ...prev }; delete u[id]; return u })
      setTabOrder(prev => prev.filter(t => t !== id))
    })
  }

  async function publishChanges() {
    setIsPublishing(true); setErr(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = createClient() as any

      // 1. Builtin visibility + page orders + tab order — via server action (handles revalidation)
      const result = await publishNavSettings({
        pageVisibilityPatch: {
          about:             builtinVis.about,
          calendar:          builtinVis.calendar,
          resources_enabled: builtinVis.resourcesEnabled,
          galleries_enabled: builtinVis.galleriesEnabled,
          nav_page_order:    pageOrders,
          nav_tab_order:     tabOrder,
        },
      })
      if (result.error) throw new Error(result.error)

      // 2. Custom page visibility + derived sort_order
      const pageUpdates: { id: string; sort_order: number; visibility: Visibility; status: string }[] = []
      for (const order of Object.values(pageOrders)) {
        const customIds = order.filter((id: string) => !id.startsWith('builtin:'))
        customIds.forEach((id: string, i: number) => {
          const page = pages.find(p => p.id === id)
          if (page) pageUpdates.push({ id: page.id, sort_order: i, visibility: page.visibility,
            status: page.visibility === 'hidden' ? 'draft' : 'published' })
        })
      }
      if (pageUpdates.length) await Promise.all(pageUpdates.map(u =>
        sb.from('nav_custom_pages').update({ sort_order: u.sort_order, visibility: u.visibility, status: u.status }).eq('id', u.id)
      ))

      // 3. Custom tab sort_order
      const sortableTabIds = tabOrder.filter(id => id !== 'home')
      const customTabSet = new Set(tabs.map(t => t.id))
      const customTabOrder = sortableTabIds.filter(id => customTabSet.has(id))
      if (customTabOrder.length) await Promise.all(customTabOrder.map((id, i) =>
        sb.from('nav_custom_tabs').update({ sort_order: i }).eq('id', id)
      ))

      // 4. Mirror to localStorage for optimistic reads
      localStorage.setItem(`fp_nav_tabs_${clubId}`, JSON.stringify(tabOrder))
      for (const [group, order] of Object.entries(pageOrders)) {
        localStorage.setItem(`fp_nav_page_order_${clubId}_${group}`, JSON.stringify(order))
      }

      setIsDirty(false); setPublishedAt(new Date())
    } catch {
      setErr('Failed to publish. Please try again.')
    } finally {
      setIsPublishing(false)
    }
  }

  const pagesFor = (ps: ParentSystem) => pages.filter(p => p.parent_system === ps)
  const pagesForTab = (tabId: string) => pages.filter(p => p.tab_id === tabId)

  const builtinRowProps = { clubSlug, builtinVis, onChangeVis: changeBuiltinVis, onChangeEnabled: changePageEnabled, pending }

  // ── Builtin tab expanded states ───────────────────────────────────────────

  const [calendarOpen,     setCalendarOpen]     = useState(true)
  const [imagesOpen,       setImagesOpen]       = useState(true)
  const [competitionsOpen, setCompetitionsOpen] = useState(true)
  const [ourClubOpen,      setOurClubOpen]      = useState(true)

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Site Pages &amp; Navigation</h1>
          <p className="mt-1 text-[13px] text-content-secondary" style={{ maxWidth: 560 }}>
            Each block is a tab in the top bar. Drag tabs and pages to reorder. Changes are saved as a draft — click Publish to make them live for members.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outlined" color="secondary" size="small"
            startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
            onClick={() => setNewTabOpen(true)}>
            New tab
          </Button>
        </div>
      </div>

      {err && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErr(null)}>{err}</Alert>}

      {(isDirty || publishedAt) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          padding: '10px 16px', marginBottom: 16,
          background: isDirty ? '#FFF8E1' : '#E8F5E9',
          border: `1px solid ${isDirty ? '#FFE082' : '#A5D6A7'}`,
          borderRadius: 8,
        }}>
          <span style={{ fontSize: 13, color: isDirty ? '#5D4037' : '#2E7D32', lineHeight: 1.5 }}>
            {isDirty
              ? <>All changes are saved automatically — click <strong>Publish changes</strong> to make them live for members.</>
              : `Published · ${publishedAt!.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
          </span>
          {isDirty && (
            <Button variant="contained" size="small" onClick={publishChanges} disabled={isPublishing}
              sx={{
                flexShrink: 0, textTransform: 'none', fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 0.75,
                background: '#1E4D8C',
                boxShadow: '0 0 0 3px rgba(26,111,196,0.25)',
                '&:hover': { background: '#163A6B', boxShadow: '0 0 0 3px rgba(26,111,196,0.35)' },
              }}>
              {isPublishing
                ? <CircularProgress size={14} sx={{ color: '#fff' }} />
                : <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFCC00', flexShrink: 0 }} />}
              {isPublishing ? 'Publishing…' : 'Publish changes ↑'}
            </Button>
          )}
        </div>
      )}

      <ColumnHeaders />

      {(() => {
        const sortableIds = tabOrder.filter(id => id !== 'home')
        const proj = (activeDragId && overDragId && activeDragId !== overDragId
          && sortableIds.includes(activeDragId) && sortableIds.includes(overDragId))
          ? arrayMove(sortableIds, sortableIds.indexOf(activeDragId), sortableIds.indexOf(overDragId))
          : null
        const activeNewIdx = proj ? proj.indexOf(activeDragId!) : -1
        const grip = (hProps: Record<string, unknown>) => (
          <span {...(hProps as React.HTMLAttributes<HTMLSpanElement>)}
            style={{ touchAction: 'none', cursor: 'grab', display: 'flex', color: '#5A6C82' }}>
            <HorizGrip />
          </span>
        )
        const getLabel = (id: string) => {
          if (id === 'calendar') return 'Calendar'
          if (id === 'images') return 'Images'
          if (id === 'competitions') return 'Competitions'
          if (id === 'our-club') return 'Our Club'
          return tabs.find(t => t.id === id)?.name ?? id
        }
        return (
          <DndContext sensors={sensors} collisionDetection={closestCenter}
            onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <TabBlock label="Home" pageCount={1} isLocked expanded onToggle={() => {}} note="Always first"
                  dragHandleEl={<span style={{ opacity: 0.3, display: 'flex' }}><LockIcon /></span>}>
                  {HOME_PAGES.map(p => <BuiltinPageRow key={p.key} page={p} {...builtinRowProps} />)}
                </TabBlock>
                {sortableIds.map((tabId, sortIdx) => {
                  const showLineBefore = proj !== null && activeNewIdx === 0 && sortIdx === 0
                  const showLineAfter  = proj !== null && activeNewIdx > 0 && proj[activeNewIdx - 1] === tabId
                  if (tabId === 'calendar') {
                    const calCustom = pagesFor('calendar')
                    return (
                      <SortableTab key="calendar" id="calendar">
                        {hProps => (<>
                          {showLineBefore && <DropLine />}
                          <TabBlock label="Calendar" pageCount={CALENDAR_PAGES.length + calCustom.length}
                            dragHandleEl={grip(hProps)}
                            expanded={calendarOpen} onToggle={() => setCalendarOpen(o => !o)}
                            footerEl={<AddPageFooter tabName="Calendar" onClick={() => setNewPageOpen(true)} />}>
                            <SortablePageGroup items={getGroupItems('calendar', CALENDAR_PAGES, calCustom, pageOrders)} clubSlug={clubSlug}
                              onDeleteCustom={id => setDeleteConfirmId(id)} onChangeVis={changeCustomPageVis}
                              pending={pending} activeDragId={activeDragId} overDragId={overDragId}
                              builtinRowProps={builtinRowProps} />
                          </TabBlock>
                          {showLineAfter && <DropLine />}
                        </>)}
                      </SortableTab>
                    )
                  }
                  if (tabId === 'images') {
                    const custom = pagesFor('images')
                    return (
                      <SortableTab key="images" id="images">
                        {hProps => (<>
                          {showLineBefore && <DropLine />}
                          <TabBlock label="Images" pageCount={IMAGES_PAGES.length + custom.length}
                            dragHandleEl={grip(hProps)}
                            expanded={imagesOpen} onToggle={() => setImagesOpen(o => !o)}
                            footerEl={<AddPageFooter tabName="Images" onClick={() => setNewPageOpen(true)} />}>
                            <SortablePageGroup items={getGroupItems('images', IMAGES_PAGES, custom, pageOrders)} clubSlug={clubSlug}
                              onDeleteCustom={id => setDeleteConfirmId(id)} onChangeVis={changeCustomPageVis}
                              pending={pending} activeDragId={activeDragId} overDragId={overDragId}
                              builtinRowProps={builtinRowProps} />
                          </TabBlock>
                          {showLineAfter && <DropLine />}
                        </>)}
                      </SortableTab>
                    )
                  }
                  if (tabId === 'competitions') {
                    const custom = pagesFor('competitions')
                    return (
                      <SortableTab key="competitions" id="competitions">
                        {hProps => (<>
                          {showLineBefore && <DropLine />}
                          <TabBlock label="Competitions" pageCount={COMPETITIONS_PAGES.length + custom.length}
                            dragHandleEl={grip(hProps)}
                            expanded={competitionsOpen} onToggle={() => setCompetitionsOpen(o => !o)}
                            footerEl={<AddPageFooter tabName="Competitions" onClick={() => setNewPageOpen(true)} />}>
                            <SortablePageGroup items={getGroupItems('competitions', COMPETITIONS_PAGES, custom, pageOrders)} clubSlug={clubSlug}
                              onDeleteCustom={id => setDeleteConfirmId(id)} onChangeVis={changeCustomPageVis}
                              pending={pending} activeDragId={activeDragId} overDragId={overDragId}
                              builtinRowProps={builtinRowProps} />
                          </TabBlock>
                          {showLineAfter && <DropLine />}
                        </>)}
                      </SortableTab>
                    )
                  }
                  if (tabId === 'our-club') {
                    const custom = pagesFor('our-club')
                    return (
                      <SortableTab key="our-club" id="our-club">
                        {hProps => (<>
                          {showLineBefore && <DropLine />}
                          <TabBlock label="Our Club" pageCount={OUR_CLUB_PAGES.length + custom.length}
                            dragHandleEl={grip(hProps)}
                            expanded={ourClubOpen} onToggle={() => setOurClubOpen(o => !o)}
                            footerEl={<AddPageFooter tabName="Our Club" onClick={() => setNewPageOpen(true)} />}>
                            <SortablePageGroup items={getGroupItems('our-club', OUR_CLUB_PAGES, custom, pageOrders)} clubSlug={clubSlug}
                              onDeleteCustom={id => setDeleteConfirmId(id)} onChangeVis={changeCustomPageVis}
                              pending={pending} activeDragId={activeDragId} overDragId={overDragId}
                              builtinRowProps={builtinRowProps} />
                          </TabBlock>
                          {showLineAfter && <DropLine />}
                        </>)}
                      </SortableTab>
                    )
                  }
                  const tab = tabs.find(t => t.id === tabId)
                  if (!tab) return null
                  return (
                    <SortableTab key={tab.id} id={tab.id}>
                      {hProps => (<>
                        {showLineBefore && <DropLine />}
                        <CustomTabBlock
                          tab={tab} items={getGroupItems(tab.id, [], pagesForTab(tab.id), pageOrders)} clubSlug={clubSlug}
                          onDelete={deleteTab} onDeletePage={id => setDeleteConfirmId(id)} onChangeVis={changeCustomPageVis}
                          onAddPage={() => setNewPageOpen(true)} pending={pending}
                          dragHandleEl={grip(hProps)}
                          activeDragId={activeDragId} overDragId={overDragId}
                        />
                        {showLineAfter && <DropLine />}
                      </>)}
                    </SortableTab>
                  )
                })}
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
              {activeDragId && sortableIds.includes(activeDragId)
                ? <TabGhost label={getLabel(activeDragId)} />
                : activeDragId?.startsWith('builtin:')
                ? <PageGhost title={[...CALENDAR_PAGES, ...IMAGES_PAGES, ...COMPETITIONS_PAGES, ...OUR_CLUB_PAGES]
                    .find(p => p.key === activeDragId.replace('builtin:', ''))?.title ?? ''} />
                : activeDragId
                ? <PageGhost title={pages.find(p => p.id === activeDragId)?.title ?? ''} />
                : null}
            </DragOverlay>
          </DndContext>
        )
      })()}

      {/* Delete confirmation */}
      <Dialog open={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 600 }}>Delete this page?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14 }}>
            The page and all its content will be permanently removed. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmId(null)} variant="outlined" color="secondary" size="small">Cancel</Button>
          <Button color="error" variant="contained" size="small"
            onClick={() => { if (deleteConfirmId) deletePage(deleteConfirmId); setDeleteConfirmId(null) }}>
            Delete page
          </Button>
        </DialogActions>
      </Dialog>

      <NewPageDialogFull
        open={newPageOpen} tabs={tabs} pages={pages} clubId={clubId}
        onPageCreated={page => {
          setPages(prev => [...prev, page])
          const group = page.tab_id ?? page.parent_system ?? ''
          if (group) setPageOrders(prev => ({ ...prev, [group]: [...(prev[group] ?? []), page.id] }))
          setIsDirty(true)
        }}
        onClose={() => setNewPageOpen(false)}
      />
      <NewTabDialog
        open={newTabOpen} tabs={tabs} clubId={clubId}
        onTabCreated={tab => {
          setTabs(prev => [...prev, tab])
          setPageOrders(prev => ({ ...prev, [tab.id]: [] }))
          setIsDirty(true)
        }}
        onClose={() => setNewTabOpen(false)}
      />
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, FormLabel,
  MenuItem, Radio, RadioGroup,
  Select, Tab, Tabs, TextField, Tooltip, Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import HomepageEditor from './HomepageEditor'
import type { ContentBlock } from '@/lib/homepage/types'
import AboutPageEditor from '../about/AboutPageEditor'
import CustomPageEditorComponent from './[pageId]/CustomPageEditor'
import ClubGalleriesTab, { type AdminGalleryData, type ClubMember } from '../galleries/ClubGalleriesTab'

// ── Types ─────────────────────────────────────────────────────────────────────

type PageType          = 'rich_text' | 'document_link' | 'external_link'
type Visibility        = 'all_members' | 'members_only' | 'hidden'
type BuiltinVisibility = 'members_only' | 'public'
type PageStatus        = 'draft' | 'published'
type ParentSystem      = 'calendar' | 'images' | 'competitions' | 'our-club'
type MainTab           = 'navigation' | 'homepage' | 'pages' | 'galleries'

export type BuiltinPageVisibility = {
  about:    BuiltinVisibility
  calendar: BuiltinVisibility
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

// ── Static nav structure ──────────────────────────────────────────────────────

type SysItem = {
  label:     string
  href:      string
  editHref?: string
  dynamic?:  boolean
  children?: SysItem[]
  parentKey?: ParentSystem
}

const SYSTEM_NAV: SysItem[] = [
  { label: 'Home',     href: '/',         dynamic: true },
  { label: 'Calendar', href: '/calendar', dynamic: true },
  {
    label: 'Images', href: '/library', dynamic: true, parentKey: 'images',
    children: [
      { label: 'My images',    href: '/library',           dynamic: true },
      { label: 'My galleries', href: '/library/galleries', dynamic: true },
    ],
  },
  {
    label: 'Competitions', href: '/competitions', dynamic: true, parentKey: 'competitions',
    children: [
      { label: 'Current',   href: '/competitions',           dynamic: true },
      { label: 'Results',   href: '/competitions/results',   dynamic: true },
      { label: 'Standings', href: '/competitions/standings', dynamic: true },
    ],
  },
  {
    label: 'Our Club', href: '/our-club', dynamic: true, parentKey: 'our-club',
    children: [
      { label: 'About our club',   href: '/our-club/about',     editHref: '/admin/content/about' },
      { label: 'Member directory', href: '/our-club/members',   dynamic: true },
      { label: 'Documents',        href: '/our-club/documents', dynamic: true },
      { label: 'Club galleries',   href: '/our-club/galleries', dynamic: true },
    ],
  },
]

// Number of system-defined children per parentKey (for slot calculation)
const SYS_CHILD_COUNTS: Record<string, number> = {
  images: 2, competitions: 3, 'our-club': 4,
}
const NAV_MAX_SLOTS = 6   // total sub-pages per tab (system + custom)
const MAX_CUSTOM_TABS = 2

const SLOT_LABEL: Record<ParentSystem, string> = {
  calendar:     'Calendar',
  images:       'Images',
  competitions: 'Competitions',
  'our-club':   'Our Club',
}

// key: used for page_visibility lookup; null = visibility is fixed
type BuiltinPageRow = {
  title:       string
  url:         string
  menuLocation: string
  visKey:      'about' | 'calendar' | null  // null = fixed, not editable
  fixedVis:    string | null                 // shown when visKey is null
  editAction:  'about' | 'homepage' | null
}

const BUILTIN_PAGES: BuiltinPageRow[] = [
  { title: 'Home',                 url: '/',                        menuLocation: 'Fixed — top level', visKey: null,       fixedVis: 'Members + public', editAction: 'homepage' },
  { title: 'Calendar',             url: '/calendar',                menuLocation: 'Fixed — top level', visKey: 'calendar', fixedVis: null,               editAction: null        },
  { title: 'My images',            url: '/library',                 menuLocation: 'Images',            visKey: null,       fixedVis: 'Members only',     editAction: null        },
  { title: 'Galleries',            url: '/library/galleries',       menuLocation: 'Images',            visKey: null,       fixedVis: 'Members only',     editAction: null        },
  { title: 'Current competitions', url: '/competitions',            menuLocation: 'Competitions',      visKey: null,       fixedVis: 'Members only',     editAction: null        },
  { title: 'Results',              url: '/competitions/results',    menuLocation: 'Competitions',      visKey: null,       fixedVis: 'Members only',     editAction: null        },
  { title: 'Standings',            url: '/competitions/standings',  menuLocation: 'Competitions',      visKey: null,       fixedVis: 'Members only',     editAction: null        },
  { title: 'About our club',       url: '/our-club/about',          menuLocation: 'Our Club',          visKey: 'about',    fixedVis: null,               editAction: 'about'     },
  { title: 'Member directory',     url: '/our-club/members',        menuLocation: 'Our Club',          visKey: null,       fixedVis: 'Members only',     editAction: null        },
  { title: 'Documents',            url: '/our-club/documents',      menuLocation: 'Our Club',          visKey: null,       fixedVis: 'Members only',     editAction: null        },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0)  return 'Today'
  if (days === 1)  return 'Yesterday'
  if (days < 7)   return `${days}d ago`
  if (days < 30)  return `${Math.floor(days / 7)}w ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function visibilityLabel(v: Visibility): string {
  if (v === 'all_members')  return 'Members + public'
  if (v === 'members_only') return 'Members only'
  return 'Hidden'
}

function menuLocationLabel(page: CustomPage, tabs: CustomTab[]): string {
  if (page.parent_system) return SLOT_LABEL[page.parent_system]
  if (page.tab_id)        return tabs.find(t => t.id === page.tab_id)?.name ?? '—'
  return ''
}

// ── Small shared components ───────────────────────────────────────────────────

function BuiltinChip() {
  return (
    <Tooltip title="Built-in pages are always present and cannot be removed." placement="top">
      <span className="inline-flex cursor-default select-none items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
        style={{ background: 'var(--surface-1)', color: 'var(--text-tertiary)', border: '1px solid var(--border-default)' }}>
        Built-in
      </span>
    </Tooltip>
  )
}

function PencilIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function CustomChip() {
  return (
    <Tooltip title="Custom tab — added by an admin" placement="top">
      <span className="inline-flex cursor-default select-none items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
        style={{ background: 'rgba(0,151,167,0.10)', color: '#0097A7', border: '1px solid rgba(0,151,167,0.30)' }}>
        Custom
      </span>
    </Tooltip>
  )
}

function LiveBadge() {
  return (
    <Box component="span" sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.625,
      borderRadius: '999px', px: 1, py: 0.375,
      fontSize: 11, fontWeight: 600, lineHeight: 1,
      bgcolor: 'rgba(46,125,50,0.10)', color: '#174A1A',
    }}>
      <Box component="span" sx={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, bgcolor: '#2E7D32' }} />
      Live
    </Box>
  )
}

function NotLiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ border: '1px solid var(--border-default)', color: 'var(--text-tertiary)' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0, display: 'inline-block' }} />
      Not live
    </span>
  )
}

function DraftBadge() {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
      Draft
    </span>
  )
}

function DragHandle({ disabled = false }: { disabled?: boolean }) {
  return (
    <span className={`flex-shrink-0 ${disabled ? 'cursor-default opacity-25' : 'cursor-grab active:cursor-grabbing'}`}
      style={{ color: 'var(--text-tertiary)', touchAction: 'none' }}>
      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5.5" cy="3.5"  r="1.4" />
        <circle cx="10.5" cy="3.5" r="1.4" />
        <circle cx="5.5" cy="8"    r="1.4" />
        <circle cx="10.5" cy="8"   r="1.4" />
        <circle cx="5.5" cy="12.5" r="1.4" />
        <circle cx="10.5" cy="12.5" r="1.4" />
      </svg>
    </span>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
      style={{ color: 'var(--text-tertiary)' }}
      fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

// ── Navigation tab: system sub-item row ───────────────────────────────────────

function SysSubRow({ item }: { item: SysItem }) {
  return (
    <div className="flex items-center gap-3 py-2 pl-10 pr-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <span className="flex-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
      {item.dynamic ? (
        <span className="text-[11px] italic" style={{ color: 'var(--text-tertiary)' }}>Auto-generated</span>
      ) : item.editHref ? (
        <Link href={item.editHref} className="text-[11px] font-medium hover:underline" style={{ color: 'var(--action-primary)' }}>
          Edit content →
        </Link>
      ) : null}
      <BuiltinChip />
    </div>
  )
}

// ── Navigation tab: custom sub-item row ───────────────────────────────────────

function CustomSubRow({
  page, onDelete, onEdit, pending,
  onDragStart, onDragOver, onDrop, onDragEnd, isDragOver,
}: {
  page:        CustomPage
  onDelete:    (id: string) => void
  onEdit:      (page: CustomPage) => void
  pending:     boolean
  onDragStart: () => void
  onDragOver:  (e: React.DragEvent) => void
  onDrop:      () => void
  onDragEnd:   () => void
  isDragOver:  boolean
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        className="flex items-center gap-3 py-2 pl-10 pr-4"
        style={{ borderTop: isDragOver ? '2px solid var(--action-primary)' : '1px solid var(--border-subtle)' }}
      >
        <DragHandle />
        <span className="flex-1 min-w-0 text-[13px]" style={{ color: 'var(--text-primary)' }}>
          {page.title}
          <span className="ml-1.5 font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>/{page.slug}</span>
        </span>

        {page.visibility === 'hidden' ? (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: 'var(--surface-1)', color: 'var(--text-tertiary)', border: '1px solid var(--border-default)' }}>
            Hidden
          </span>
        ) : page.status === 'draft' ? (
          <DraftBadge />
        ) : null}

        {page.page_type === 'rich_text' && (
          <button onClick={() => onEdit(page)} className="flex-shrink-0 text-[12px] font-medium hover:underline" style={{ color: 'var(--action-primary)' }}>
            Edit
          </button>
        )}

        <Tooltip title="Delete page">
          <button disabled={pending} onClick={() => setConfirmOpen(true)}
            className="flex-shrink-0 rounded p-1 transition-colors hover:bg-surface-1" style={{ color: 'var(--text-tertiary)' }}>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </Tooltip>

        <CustomChip />
      </div>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle component="div" sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, bgcolor: 'rgba(211,47,47,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: 16, height: 16, color: '#D32F2F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Box>
            <Box sx={{ fontSize: 15, fontWeight: 600 }}>Delete &ldquo;{page.title}&rdquo;?</Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
            <Box sx={{ mb: 1.5 }}>All content will be permanently lost and <strong>cannot be undone</strong>.</Box>
            <Box sx={{ bgcolor: 'rgba(166,124,0,0.07)', border: '1px solid rgba(166,124,0,0.25)', borderRadius: 1.5, px: 1.75, py: 1.25, fontSize: 12, color: '#6B5000' }}>
              💡 Consider setting visibility to <strong>Hidden</strong> instead — the page is preserved but hidden from all visitors.
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" color="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={pending} onClick={() => { setConfirmOpen(false); onDelete(page.id) }}
            sx={{ bgcolor: '#D32F2F', '&:hover': { bgcolor: '#B71C1C' } }}>
            Delete page
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// ── Navigation tab: system top-level accordion row ────────────────────────────

function SysNavRow({
  item,
  customSubPages,
  onDeletePage,
  onEditPage,
  pending,
}: {
  item:           SysItem
  customSubPages: CustomPage[]
  onDeletePage:   (id: string) => void
  onEditPage:     (page: CustomPage) => void
  pending:        boolean
}) {
  const [open, setOpen] = useState(false)
  const [localCustom, setLocalCustom] = useState<CustomPage[]>(customSubPages)
  const dragIdx = useRef<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  useEffect(() => setLocalCustom(customSubPages), [customSubPages])

  const sysCount   = item.children?.length ?? 0
  const totalCount = sysCount + localCustom.length
  const canExpand  = totalCount > 0

  const onCustomDragStart = (idx: number) => { dragIdx.current = idx }
  const onCustomDragOver  = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx) }
  const onCustomDragEnd   = () => { dragIdx.current = null; setDragOverIdx(null) }
  const onCustomDrop      = async (toIdx: number) => {
    const fromIdx = dragIdx.current
    dragIdx.current = null; setDragOverIdx(null)
    if (fromIdx === null || fromIdx === toIdx) return
    const reordered = [...localCustom]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    setLocalCustom(reordered)
    const supabase = createClient()
    await Promise.all(reordered.map((p, i) =>
      supabase.from('nav_custom_pages').update({ sort_order: i }).eq('id', p.id)
    ))
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div
        onClick={() => canExpand && setOpen(o => !o)}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-1 ${!canExpand ? 'cursor-default' : 'cursor-pointer'}`}
      >
        {canExpand ? <ChevronIcon open={open} /> : <span className="h-4 w-4 flex-shrink-0" />}
        <span className="flex-1 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {item.label}
          {totalCount > 0 && (
            <span className="ml-1.5 text-[13px] font-normal" style={{ color: 'var(--text-tertiary)' }}>({totalCount})</span>
          )}
        </span>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <BuiltinChip />
        </div>
      </div>

      {open && (
        <div>
          {item.children?.map(child => <SysSubRow key={child.href} item={child} />)}
          {localCustom.map((page, idx) => (
            <CustomSubRow
              key={page.id} page={page} onDelete={onDeletePage} onEdit={onEditPage} pending={pending}
              onDragStart={() => onCustomDragStart(idx)}
              onDragOver={e => onCustomDragOver(e, idx)}
              onDrop={() => onCustomDrop(idx)}
              onDragEnd={onCustomDragEnd}
              isDragOver={dragOverIdx === idx}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Navigation tab: custom tab accordion row ──────────────────────────────────

function CustomTabRow({
  tab,
  customSubPages,
  onDeletePage,
  onEditPage,
  onDeleteTab,
  pending,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragOver,
  successMessage,
}: {
  tab:            CustomTab
  customSubPages: CustomPage[]
  onDeletePage:   (id: string) => void
  onEditPage:     (page: CustomPage) => void
  onDeleteTab:    (id: string) => void
  pending:        boolean
  onDragStart:    () => void
  onDragOver:     (e: React.DragEvent) => void
  onDrop:         () => void
  onDragEnd:      () => void
  isDragOver:     boolean
  successMessage?: string
}) {
  const [open, setOpen] = useState(false)
  const [localPages, setLocalPages] = useState<CustomPage[]>(customSubPages)
  const dragIdx = useRef<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  useEffect(() => setLocalPages(customSubPages), [customSubPages])

  const hasLivePage = localPages.some(p => p.status === 'published' && p.visibility !== 'hidden')

  const onSubDragStart = (idx: number) => { dragIdx.current = idx }
  const onSubDragOver  = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx) }
  const onSubDragEnd   = () => { dragIdx.current = null; setDragOverIdx(null) }
  const onSubDrop      = async (toIdx: number) => {
    const fromIdx = dragIdx.current
    dragIdx.current = null; setDragOverIdx(null)
    if (fromIdx === null || fromIdx === toIdx) return
    const reordered = [...localPages]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    setLocalPages(reordered)
    const supabase = createClient()
    await Promise.all(reordered.map((p, i) =>
      supabase.from('nav_custom_pages').update({ sort_order: i }).eq('id', p.id)
    ))
  }

  return (
    <div
      draggable
      onDragStart={e => { e.stopPropagation(); onDragStart() }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        borderTop: isDragOver ? '2px solid var(--action-primary)' : undefined,
      }}
    >
      <div
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-1 cursor-pointer"
      >
        <DragHandle />
        <ChevronIcon open={open} />
        <span className="flex-1 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {tab.name}
          {localPages.length > 0 && (
            <span className="ml-1.5 text-[13px] font-normal" style={{ color: 'var(--text-tertiary)' }}>({localPages.length})</span>
          )}
        </span>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {hasLivePage ? <LiveBadge /> : <NotLiveBadge />}
          <CustomChip />
          <Tooltip title="Delete tab and all its pages">
            <button
              disabled={pending}
              onClick={e => { e.stopPropagation(); onDeleteTab(tab.id) }}
              className="rounded p-1 transition-colors hover:bg-surface-1"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Tooltip>
        </div>
      </div>

      {successMessage && (
        <div className="px-4 py-2.5 flex items-center gap-2 text-[13px]"
          style={{ borderTop: '1px solid var(--border-subtle)', background: 'rgba(46,125,50,0.06)', color: '#174A1A' }}>
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}

      {open && (
        <div>
          {localPages.map((page, idx) => (
            <CustomSubRow
              key={page.id} page={page} onDelete={onDeletePage} onEdit={onEditPage} pending={pending}
              onDragStart={() => onSubDragStart(idx)}
              onDragOver={e => onSubDragOver(e, idx)}
              onDrop={() => onSubDrop(idx)}
              onDragEnd={onSubDragEnd}
              isDragOver={dragOverIdx === idx}
            />
          ))}
          {localPages.length === 0 && (
            <div className="py-3 pl-10 pr-4 text-[13px] italic" style={{ color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-subtle)' }}>
              No pages yet — not visible to members until a page is published here.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Add page or tab — inline panel ────────────────────────────────────────────

type AddPanelStep = 'where' | 'page' | 'tab'

function AddPanel({
  tabs,
  pages,
  clubId,
  onPageCreated,
  onTabCreated,
  onClose,
}: {
  tabs:           CustomTab[]
  pages:          CustomPage[]
  clubId:         string
  onPageCreated:  (page: CustomPage) => void
  onTabCreated:   (tab: CustomTab) => void
  onClose:        () => void
}) {
  const [step,     setStep]     = useState<AddPanelStep>('where')
  const [mode,     setMode]     = useState<'existing' | 'new'>('existing')
  const [tabId,    setTabId]    = useState('')
  const [title,    setTitle]    = useState('')
  const [type,     setType]     = useState<PageType>('rich_text')
  const [url,      setUrl]      = useState('https://')
  const [vis,      setVis]      = useState<Visibility>('all_members')
  const [tabName,  setTabName]  = useState('')
  const [saving,   setSaving]   = useState(false)
  const [err,      setErr]      = useState<string | null>(null)

  // Build slot info for dropdown
  const sysTabOptions = (['images', 'competitions', 'our-club'] as ParentSystem[]).map(key => {
    const sysCount    = SYS_CHILD_COUNTS[key] ?? 0
    const customCount = pages.filter(p => p.parent_system === key).length
    const total       = sysCount + customCount
    return { value: key, label: SLOT_LABEL[key], total, isFull: total >= NAV_MAX_SLOTS }
  })
  const customTabOptions = tabs.map(t => {
    const count = pages.filter(p => p.tab_id === t.id).length
    return { value: t.id, label: t.name, total: count, isFull: count >= NAV_MAX_SLOTS }
  })
  const allTabOptions = [...sysTabOptions, ...customTabOptions]

  // Set default tab selection
  useEffect(() => {
    if (!tabId) {
      const first = allTabOptions.find(o => !o.isFull)
      if (first) setTabId(first.value)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canContinue = mode === 'new' || (mode === 'existing' && !!tabId)
  const canCreate   = step === 'page' ? title.trim().length > 0 : tabName.trim().length > 0

  function handleContinue() {
    if (mode === 'existing') setStep('page')
    else setStep('tab')
  }

  async function handleCreatePage() {
    if (!title.trim()) return
    setSaving(true); setErr(null)
    const supabase   = createClient()
    const slug       = slugify(title)
    const isSystem   = (['images', 'competitions', 'our-club'] as string[]).includes(tabId)
    const { data, error } = await supabase.from('nav_custom_pages').insert({
      club_id:      clubId,
      title:        title.trim(),
      slug,
      page_type:    type,
      visibility:   vis,
      status:       vis === 'hidden' ? 'draft' : 'published',
      external_url: type === 'external_link' ? url : null,
      sort_order:   pages.filter(p => isSystem ? p.parent_system === tabId : p.tab_id === tabId).length,
      ...(isSystem ? { parent_system: tabId, tab_id: null } : { parent_system: null, tab_id: tabId }),
    }).select().single()
    setSaving(false)
    if (error) { setErr(error.message); return }
    onPageCreated(data as CustomPage)
    onClose()
  }

  async function handleCreateTab() {
    if (!tabName.trim()) return
    setSaving(true); setErr(null)
    const supabase = createClient()
    const { data, error } = await supabase.from('nav_custom_tabs').insert({
      club_id:    clubId,
      name:       tabName.trim(),
      slug:       slugify(tabName),
      sort_order: tabs.length,
    }).select().single()
    setSaving(false)
    if (error) { setErr(error.message); return }
    onTabCreated(data as CustomTab)
    onClose()
  }

  const selectedTabLabel = allTabOptions.find(o => o.value === tabId)?.label ?? ''

  return (
    <div className="mt-3 rounded-[10px] overflow-hidden" style={{ border: '1px solid var(--border-default)', background: 'var(--surface-2)' }}>
      {/* Panel header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {step === 'where' && 'Add page or tab'}
          {step === 'page'  && `New page in ${selectedTabLabel}`}
          {step === 'tab'   && 'New tab'}
        </span>
        {step !== 'where' && (
          <button onClick={() => { setStep('where'); setErr(null) }} className="text-[12px] hover:underline" style={{ color: 'var(--text-tertiary)' }}>
            ← Back
          </button>
        )}
      </div>

      <div className="px-4 py-4">
        {err && <p className="mb-3 text-[12px]" style={{ color: 'var(--status-error)' }}>{err}</p>}

        {/* Step 1 — where */}
        {step === 'where' && (
          <div className="flex flex-col gap-4">
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Where should this page live?</p>

            <div className="flex flex-col gap-2">
              {/* Option A — existing tab */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="addMode" value="existing" checked={mode === 'existing'}
                  onChange={() => setMode('existing')} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                    Add to an existing tab
                  </span>
                  <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5"
                    style={{ background: 'rgba(26,111,196,0.10)', color: 'var(--action-primary)' }}>
                    Recommended
                  </span>
                  {mode === 'existing' && (
                    <div className="mt-2">
                      <select
                        value={tabId}
                        onChange={e => setTabId(e.target.value)}
                        className="w-full rounded-[6px] px-3 py-2 text-[13px]"
                        style={{ border: 'var(--input-border)', background: 'var(--surface-2)', color: 'var(--text-primary)' }}
                      >
                        <option value="">Select a tab…</option>
                        {allTabOptions.map(o => (
                          <option key={o.value} value={o.value} disabled={o.isFull}>
                            {o.label}  ({o.total} of {NAV_MAX_SLOTS} slots used{o.isFull ? ' — full' : ''})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </label>

              {/* Option B — new tab */}
              {tabs.length < MAX_CUSTOM_TABS && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="addMode" value="new" checked={mode === 'new'}
                    onChange={() => setMode('new')} className="mt-0.5 flex-shrink-0" />
                  <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>Create a new tab</span>
                </label>
              )}
              {tabs.length >= MAX_CUSTOM_TABS && (
                <p className="ml-6 text-[12px] italic" style={{ color: 'var(--text-tertiary)' }}>
                  Maximum of {MAX_CUSTOM_TABS} custom tabs reached — add pages to an existing tab instead.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 justify-end pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <Button variant="outlined" color="secondary" size="small" onClick={onClose}>Cancel</Button>
              <Button variant="contained" size="small" disabled={!canContinue} onClick={handleContinue}>Continue →</Button>
            </div>
          </div>
        )}

        {/* Step 2a — page form */}
        {step === 'page' && (
          <div className="flex flex-col gap-4">
            <TextField
              label="Page name" size="small" fullWidth autoFocus
              slotProps={{ htmlInput: { maxLength: 40 } }}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canCreate && !saving && handleCreatePage()}
            />

            <FormControl>
              <FormLabel sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Page type</FormLabel>
              <RadioGroup value={type} onChange={e => setType(e.target.value as PageType)}>
                <FormControlLabel value="rich_text" control={<Radio size="small" />}
                  label={<span><strong style={{ fontSize: 13 }}>Rich text page</strong> <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>— formatted content</span></span>}
                  sx={{ alignItems: 'center', mb: 0.5 }} />
                <FormControlLabel value="document_link" control={<Radio size="small" />}
                  label={<span><strong style={{ fontSize: 13 }}>Document link</strong> <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>— links to a file in Documents</span></span>}
                  sx={{ alignItems: 'center', mb: 0.5 }} />
                <FormControlLabel value="external_link" control={<Radio size="small" />}
                  label={<span><strong style={{ fontSize: 13 }}>External link</strong> <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>— opens in a new tab</span></span>}
                  sx={{ alignItems: 'center' }} />
              </RadioGroup>
            </FormControl>

            {type === 'external_link' && (
              <TextField label="URL" size="small" fullWidth value={url}
                onChange={e => setUrl(e.target.value)} placeholder="https://example.com" />
            )}

            <FormControl size="small" fullWidth>
              <FormLabel sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Visibility</FormLabel>
              <Select value={vis} onChange={e => setVis(e.target.value as Visibility)} sx={{ fontSize: 13 }}>
                <MenuItem value="all_members"  sx={{ fontSize: 13 }}>Members + public</MenuItem>
                <MenuItem value="members_only" sx={{ fontSize: 13 }}>Members only</MenuItem>
                <MenuItem value="hidden"       sx={{ fontSize: 13 }}>Hidden</MenuItem>
              </Select>
            </FormControl>

            <div className="flex items-center gap-2 justify-end pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <Button variant="outlined" color="secondary" size="small" onClick={onClose}>Cancel</Button>
              <Button variant="contained" size="small" disabled={!canCreate || saving} onClick={handleCreatePage}>
                {saving ? 'Creating…' : 'Create page →'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2b — tab form */}
        {step === 'tab' && (
          <div className="flex flex-col gap-4">
            <TextField
              label="Tab name" size="small" fullWidth autoFocus
              slotProps={{ htmlInput: { maxLength: 20 } }}
              value={tabName}
              onChange={e => setTabName(e.target.value.slice(0, 20))}
              helperText={`${tabName.length}/20 characters — shown in the main navigation bar`}
              onKeyDown={e => e.key === 'Enter' && canCreate && !saving && handleCreateTab()}
            />
            <p className="text-[12px] m-0" style={{ color: 'var(--text-secondary)' }}>
              The tab appears in the navigation tree immediately. It won&apos;t be visible to members until you add at least one published page to it.
            </p>
            <div className="flex items-center gap-2 justify-end pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <Button variant="outlined" color="secondary" size="small" onClick={onClose}>Cancel</Button>
              <Button variant="contained" size="small" disabled={!canCreate || saving} onClick={handleCreateTab}>
                {saving ? 'Creating…' : 'Create tab →'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Pages tab — "New page" dialog (simplified, no nav placement) ──────────────

function NewPageDialog({
  open,
  onClose,
  onSave,
  pending,
}: {
  open:    boolean
  onClose: () => void
  onSave:  (title: string, type: PageType, url: string, vis: Visibility) => void
  pending: boolean
}) {
  const [title, setTitle] = useState('')
  const [type,  setType]  = useState<PageType>('rich_text')
  const [url,   setUrl]   = useState('https://')
  const [vis,   setVis]   = useState<Visibility>('all_members')

  function handleSave() {
    if (!title.trim()) return
    onSave(title, type, url, vis)
    setTitle(''); setType('rich_text'); setUrl('https://'); setVis('all_members')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>New page</DialogTitle>
      <DialogContent sx={{ pt: '16px !important', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField label="Page title" size="small" fullWidth autoFocus
          value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()} />

        <FormControl>
          <FormLabel sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Page type</FormLabel>
          <RadioGroup value={type} onChange={e => setType(e.target.value as PageType)}>
            <FormControlLabel value="rich_text" control={<Radio size="small" />}
              label={<span><strong style={{ fontSize: 13 }}>Rich text page</strong> <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>— formatted content with headings, images, and links</span></span>}
              sx={{ alignItems: 'center', mb: 0.5 }} />
            <FormControlLabel value="document_link" control={<Radio size="small" />}
              label={<span><strong style={{ fontSize: 13 }}>Document link</strong> <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>— link to a file in the Documents library</span></span>}
              sx={{ alignItems: 'center', mb: 0.5 }} />
            <FormControlLabel value="external_link" control={<Radio size="small" />}
              label={<span><strong style={{ fontSize: 13 }}>External link</strong> <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>— opens an external URL in a new tab</span></span>}
              sx={{ alignItems: 'center' }} />
          </RadioGroup>
        </FormControl>

        {type === 'external_link' && (
          <TextField label="URL" size="small" fullWidth value={url}
            onChange={e => setUrl(e.target.value)} placeholder="https://example.com" />
        )}

        <FormControl size="small" fullWidth>
          <FormLabel sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Visibility</FormLabel>
          <Select value={vis} onChange={e => setVis(e.target.value as Visibility)} sx={{ fontSize: 13 }}>
            <MenuItem value="all_members"  sx={{ fontSize: 13 }}>Members + public</MenuItem>
            <MenuItem value="members_only" sx={{ fontSize: 13 }}>Members only</MenuItem>
            <MenuItem value="hidden"       sx={{ fontSize: 13 }}>Hidden — do not show in navigation</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" color="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!title.trim() || pending} onClick={handleSave}>Create page</Button>
      </DialogActions>
    </Dialog>
  )
}

// Shared column layout for both tables:
// Title | URL | Visibility | Menu location | Last updated | (edit icon) | Live
const TABLE_COL = 'grid-cols-[minmax(0,1.6fr)_minmax(160px,1fr)_130px_130px_80px_36px_56px]'

const TABLE_HEADERS = ['Title', 'URL', 'Visibility', 'Menu location', 'Last updated', '', '']

// ── Built-in pages table ──────────────────────────────────────────────────────

function BuiltinPagesTable({
  builtinVisibility,
  onChangeVisibility,
  onEditAbout,
  onGoHomepageBuilder,
}: {
  builtinVisibility:  BuiltinPageVisibility
  onChangeVisibility: (key: 'about' | 'calendar', value: BuiltinVisibility) => void
  onEditAbout:        () => void
  onGoHomepageBuilder: () => void
}) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
        Built-in pages
      </p>
      <div className="rounded-[10px] overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
        <div className={`grid ${TABLE_COL} gap-3 px-4 py-2.5`}
          style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--surface-1)' }}>
          {TABLE_HEADERS.map((h, i) => (
            <span key={i} className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{h}</span>
          ))}
        </div>

        {BUILTIN_PAGES.map((row, i) => {
          const visValue: string = row.visKey
            ? (builtinVisibility[row.visKey] === 'public' ? 'Members + public' : 'Members only')
            : (row.fixedVis ?? 'Members only')

          return (
            <div key={row.url}
              className={`grid ${TABLE_COL} items-center gap-3 px-4 py-2.5`}
              style={{ borderBottom: i < BUILTIN_PAGES.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
              {/* Title */}
              <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{row.title}</span>

              {/* URL — full, no truncation */}
              <span className="font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>{row.url}</span>

              {/* Visibility — dropdown for about/calendar, static otherwise */}
              {row.visKey ? (
                <select
                  value={builtinVisibility[row.visKey]}
                  onChange={e => onChangeVisibility(row.visKey!, e.target.value as BuiltinVisibility)}
                  className="rounded-[6px] px-2 py-1.5 text-[12px] w-full"
                  style={{ border: 'var(--input-border)', background: 'var(--surface-2)', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  <option value="members_only">Members only</option>
                  <option value="public">Members + public</option>
                </select>
              ) : (
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{visValue}</span>
              )}

              {/* Menu location */}
              <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{row.menuLocation}</span>

              {/* Last updated — always — for built-ins */}
              <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>—</span>

              {/* Edit action */}
              {row.editAction === 'about' ? (
                <Tooltip title="Edit page content">
                  <button onClick={onEditAbout}
                    className="flex items-center justify-center rounded p-1 transition-colors hover:bg-surface-1"
                    style={{ color: 'var(--text-tertiary)' }}>
                    <PencilIcon />
                  </button>
                </Tooltip>
              ) : row.editAction === 'homepage' ? (
                <Tooltip title="Edit homepage blocks">
                  <button onClick={onGoHomepageBuilder}
                    className="flex items-center justify-center rounded p-1 transition-colors hover:bg-surface-1"
                    style={{ color: 'var(--text-tertiary)' }}>
                    <PencilIcon />
                  </button>
                </Tooltip>
              ) : (
                <span />
              )}

              {/* Live — always live for built-ins */}
              <LiveBadge />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Custom pages table ────────────────────────────────────────────────────────

function PagesTable({
  pages,
  tabs,
  onEditPage,
  onDeletePage,
  onGoToNavigation,
  pending,
}: {
  pages:            CustomPage[]
  tabs:             CustomTab[]
  onEditPage:       (page: CustomPage) => void
  onDeletePage:     (id: string) => void
  onGoToNavigation: () => void
  pending:          boolean
}) {
  function menuCell(page: CustomPage) {
    const location = menuLocationLabel(page, tabs)
    if (location) {
      return <span className="text-[13px] truncate" style={{ color: 'var(--text-secondary)' }}>{location}</span>
    }
    if (page.status === 'draft') {
      return <span className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>—</span>
    }
    if (page.visibility === 'hidden') {
      return <span className="text-[13px] italic" style={{ color: 'var(--text-tertiary)' }}>Hidden</span>
    }
    return (
      <button
        onClick={onGoToNavigation}
        className="flex items-center gap-1 text-[12px] font-medium hover:underline text-left"
        style={{ color: 'var(--status-warning)' }}
      >
        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Not in navigation
      </button>
    )
  }

  return (
    <div className="rounded-[10px] overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
      <div className={`grid ${TABLE_COL} gap-3 px-4 py-2.5`}
        style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--surface-1)' }}>
        {TABLE_HEADERS.map((h, i) => (
          <span key={i} className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{h}</span>
        ))}
      </div>

      {pages.length === 0 ? (
        <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          No custom pages yet. Click <strong>New page</strong> to create one.
        </div>
      ) : (
        pages.map((page, i) => (
          <div key={page.id}
            className={`grid ${TABLE_COL} items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-1`}
            style={{ borderBottom: i < pages.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
            {/* Title */}
            <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{page.title}</span>

            {/* URL */}
            <span className="font-mono text-[12px] truncate" style={{ color: 'var(--text-secondary)' }}>/{page.slug}</span>

            {/* Visibility */}
            <span className="text-[13px] truncate" style={{ color: 'var(--text-secondary)' }}>{visibilityLabel(page.visibility)}</span>

            {/* Menu location */}
            {menuCell(page)}

            {/* Last updated */}
            <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              {page.updated_at ? timeAgo(page.updated_at) : '—'}
            </span>

            {/* Edit icon — only for rich_text pages */}
            {page.page_type === 'rich_text' ? (
              <Tooltip title="Edit page content">
                <button onClick={() => onEditPage(page)}
                  className="flex items-center justify-center rounded p-1 transition-colors hover:bg-surface-1"
                  style={{ color: 'var(--text-tertiary)' }}>
                  <PencilIcon />
                </button>
              </Tooltip>
            ) : <span />}

            {/* Status — far right */}
            <span>{page.status === 'published' ? <LiveBadge /> : <DraftBadge />}</span>
          </div>
        ))
      )}
    </div>
  )
}

// ── Mobile nav preview ────────────────────────────────────────────────────────

function MobileNavPreview({ tabs }: { tabs: CustomTab[] }) {
  const navItems = ['Home', 'Calendar', 'Images', 'Competitions', 'Our Club', ...tabs.map(t => t.name)]
  return (
    <div className="sticky top-6">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
        Mobile preview
      </p>
      <div className="mx-auto rounded-[24px] overflow-hidden" style={{ width: 220, border: '2px solid var(--border-default)', background: 'var(--surface-1)', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
        <div className="px-4 pt-3 pb-1 flex justify-between items-center" style={{ background: 'var(--surface-2)' }}>
          <span className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>9:41</span>
          <div className="flex gap-1">
            {[0,1,2].map(i => <div key={i} className="rounded-full" style={{ width: 4, height: 4, background: 'var(--text-tertiary)' }} />)}
          </div>
        </div>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-subtle)' }}>
          <span className="text-[13px] font-semibold" style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}>Club</span>
          <svg className="h-4 w-4" style={{ color: 'var(--text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
        <div style={{ background: 'var(--surface-0)' }}>
          {navItems.map((item, i) => (
            <div key={item} className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: i < navItems.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
              <span className="text-[13px]" style={{ color: i === 0 ? 'var(--action-primary)' : 'var(--text-primary)', fontWeight: i === 0 ? 600 : 400 }}>
                {item}
              </span>
              <svg className="h-3 w-3" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
        <div className="h-4" style={{ background: 'var(--surface-2)' }} />
      </div>
      <p className="mt-3 text-center text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Approximate mobile layout</p>
    </div>
  )
}

// ── Place page in nav dialog ──────────────────────────────────────────────────

function PlacePageDialog({
  page,
  tabs,
  onClose,
  onSave,
  pending,
}: {
  page:    CustomPage
  tabs:    CustomTab[]
  onClose: () => void
  onSave:  (parent: ParentSystem | string) => void
  pending: boolean
}) {
  const parentOptions = [
    { value: 'our-club',     label: 'Our Club' },
    { value: 'images',       label: 'Images' },
    { value: 'competitions', label: 'Competitions' },
    ...tabs.map(t => ({ value: t.id, label: t.name })),
  ]
  const [parent, setParent] = useState(parentOptions[0]?.value ?? '')
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>Add to navigation</DialogTitle>
      <DialogContent sx={{ pt: '12px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p className="text-[13px] m-0" style={{ color: 'var(--text-secondary)' }}>
          Choose where <strong>&ldquo;{page.title}&rdquo;</strong> should appear in the navigation.
        </p>
        <FormControl size="small" fullWidth>
          <FormLabel sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Menu location</FormLabel>
          <Select value={parent} onChange={e => setParent(e.target.value)} sx={{ fontSize: 13 }}>
            {parentOptions.map(o => (
              <MenuItem key={o.value} value={o.value} sx={{ fontSize: 13 }}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button variant="outlined" color="secondary" onClick={onClose}>Not yet</Button>
        <Button variant="contained" disabled={pending} onClick={() => onSave(parent)}>
          Add to {parentOptions.find(o => o.value === parent)?.label ?? 'navigation'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NavigationClient({
  customPages: initialPages,
  customTabs:  initialTabs,
  initialHomepageBlocks,
  initialGalleries = [],
  members = [],
  clubId,
  initialBuiltinVisibility = { about: 'members_only', calendar: 'members_only' },
}: {
  customPages:                CustomPage[]
  customTabs:                 CustomTab[]
  initialHomepageBlocks?:     ContentBlock[]
  initialGalleries?:          AdminGalleryData[]
  members?:                   ClubMember[]
  clubId:                     string
  initialBuiltinVisibility?:  BuiltinPageVisibility
}) {
  const params      = useParams()
  const searchParams = useSearchParams()
  const clubSlug    = typeof params.clubSlug === 'string' ? params.clubSlug : ''

  const [activeTab, setActiveTab] = useState<MainTab>(
    (searchParams.get('tab') as MainTab | null) ?? 'homepage'
  )
  const [pages,             setPages]             = useState<CustomPage[]>(initialPages)
  const [tabs,              setTabs]              = useState<CustomTab[]>(initialTabs)
  const [builtinVisibility, setBuiltinVisibility] = useState<BuiltinPageVisibility>(initialBuiltinVisibility)
  const [pending, startTrans] = useTransition()
  const [err,     setErr]     = useState<string | null>(null)

  // ── Custom tab drag/drop ──────────────────────────────────────────────────
  const tabDragIdx = useRef<number | null>(null)
  const [tabDragOverIdx, setTabDragOverIdx] = useState<number | null>(null)
  const onTabDragStart = (idx: number) => { tabDragIdx.current = idx }
  const onTabDragOver  = (e: React.DragEvent, idx: number) => { e.preventDefault(); setTabDragOverIdx(idx) }
  const onTabDragEnd   = () => { tabDragIdx.current = null; setTabDragOverIdx(null) }
  const onTabDrop      = async (toIdx: number) => {
    const fromIdx = tabDragIdx.current
    tabDragIdx.current = null; setTabDragOverIdx(null)
    if (fromIdx === null || fromIdx === toIdx) return
    const reordered = [...tabs]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    setTabs(reordered)
    const supabase = createClient()
    await Promise.all(reordered.map((t, i) =>
      supabase.from('nav_custom_tabs').update({ sort_order: i }).eq('id', t.id)
    ))
  }

  // ── About page inline editor ──────────────────────────────────────────────
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false)
  const [aboutLoading,    setAboutLoading]    = useState(false)
  const [aboutPageData,   setAboutPageData]   = useState<{ id: string | null; content: string } | null>(null)

  // ── Custom page inline editor ─────────────────────────────────────────────
  const [editingCustomPage, setEditingCustomPage] = useState<CustomPage | null>(null)
  const [customPageContent, setCustomPageContent] = useState('')
  const [customPageLoading, setCustomPageLoading] = useState(false)

  // ── Navigation tab inline add panel ──────────────────────────────────────
  const [addPanelOpen,   setAddPanelOpen]   = useState(false)
  const [newTabSuccessId, setNewTabSuccessId] = useState<string | null>(null)

  // ── Pages tab post-creation prompt ────────────────────────────────────────
  const [newPageOpen,     setNewPageOpen]     = useState(false)
  const [pagesTabNewPage, setPagesTabNewPage] = useState<CustomPage | null>(null)
  const [placePageFor,    setPlacePageFor]    = useState<CustomPage | null>(null)

  async function openAboutEditor() {
    setAboutDialogOpen(true)
    if (aboutPageData) return
    setAboutLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('pages').select('id, content').eq('slug', 'about').maybeSingle()
    setAboutPageData({ id: data?.id ?? null, content: data?.content ?? '' })
    setAboutLoading(false)
  }

  async function openCustomPageEditor(page: CustomPage) {
    setEditingCustomPage(page)
    setCustomPageLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('nav_custom_pages').select('content').eq('id', page.id).maybeSingle()
    setCustomPageContent((data as unknown as { content?: string } | null)?.content ?? '')
    setCustomPageLoading(false)
  }

  async function changeBuiltinVisibility(key: 'about' | 'calendar', value: BuiltinVisibility) {
    setBuiltinVisibility(prev => ({ ...prev, [key]: value }))
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    const { data: existing } = await sb
      .from('club_settings')
      .select('page_visibility')
      .eq('club_id', clubId)
      .single()
    const current = (existing?.page_visibility as Record<string, string> | null) ?? {}
    await sb
      .from('club_settings')
      .update({ page_visibility: { ...current, [key]: value } })
      .eq('club_id', clubId)
  }

  // Creates a new page from Pages tab — orphaned draft
  function savePagesTabPage(title: string, type: PageType, url: string, vis: Visibility) {
    const slug = slugify(title)
    setNewPageOpen(false)
    setErr(null)
    startTrans(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('nav_custom_pages').insert({
        club_id:      clubId,
        title:        title.trim(),
        slug,
        page_type:    type,
        visibility:   vis,
        status:       'draft',
        external_url: type === 'external_link' ? url : null,
        sort_order:   pages.length,
      }).select().single()
      if (error) { setErr(error.message); return }
      setPages(prev => [...prev, data as CustomPage])
      setPagesTabNewPage(data as CustomPage)
    })
  }

  function savePageNavPlacement(parent: ParentSystem | string, page: CustomPage) {
    setPlacePageFor(null)
    setPagesTabNewPage(null)
    setErr(null)
    startTrans(async () => {
      const supabase = createClient()
      const isSystem = (['images', 'competitions', 'our-club'] as string[]).includes(parent)
      await supabase.from('nav_custom_pages').update({
        ...(isSystem ? { parent_system: parent, tab_id: null } : { parent_system: null, tab_id: parent }),
      }).eq('id', page.id)
      setPages(prev => prev.map(p => p.id === page.id
        ? { ...p, ...(isSystem ? { parent_system: parent as ParentSystem, tab_id: null } : { parent_system: null, tab_id: parent }) }
        : p
      ))
    })
  }

  function deletePage(id: string) {
    startTrans(async () => {
      const supabase = createClient()
      await supabase.from('nav_custom_pages').delete().eq('id', id)
      setPages(prev => prev.filter(p => p.id !== id))
      if (pagesTabNewPage?.id === id) setPagesTabNewPage(null)
    })
  }

  function deleteTab(id: string) {
    startTrans(async () => {
      const supabase = createClient()
      await supabase.from('nav_custom_tabs').delete().eq('id', id)
      setTabs(prev => prev.filter(t => t.id !== id))
      setPages(prev => prev.filter(p => p.tab_id !== id))
    })
  }

  const pagesFor = (parent: ParentSystem | string) =>
    pages.filter(p =>
      (['calendar', 'images', 'competitions', 'our-club'] as string[]).includes(parent)
        ? p.parent_system === parent
        : p.tab_id === parent
    )

  const MAIN_TABS = [
    { key: 'homepage'   as MainTab, label: 'Homepage' },
    { key: 'pages'      as MainTab, label: 'Pages' },
    { key: 'navigation' as MainTab, label: 'Navigation' },
    { key: 'galleries'  as MainTab, label: 'Club galleries' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Navigation &amp; Pages</h1>
        <p className="mt-1 text-[13px] text-content-secondary">Manage site structure and custom pages.</p>
      </div>

      {err && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErr(null)}>{err}</Alert>}

      <Tabs
        value={MAIN_TABS.findIndex(t => t.key === activeTab)}
        onChange={(_, i) => setActiveTab(MAIN_TABS[i].key)}
        sx={{ mb: 4, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        {MAIN_TABS.map(t => (
          <Tab key={t.key} label={t.label} sx={{ textTransform: 'none' }} />
        ))}
      </Tabs>

      {/* ── Navigation tab ──────────────────────────────────────────────── */}
      {activeTab === 'navigation' && (
        <div className="flex gap-8 items-start">
          <div className="flex-1 min-w-0">
            {/* Nav tree */}
            <div className="rounded-[10px] overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
              {SYSTEM_NAV.map(item => (
                <SysNavRow
                  key={item.href}
                  item={item}
                  customSubPages={item.parentKey ? pagesFor(item.parentKey) : []}
                  onDeletePage={deletePage}
                  onEditPage={openCustomPageEditor}
                  pending={pending}
                />
              ))}
              {tabs.map((tab, tabIdx) => (
                <CustomTabRow
                  key={tab.id}
                  tab={tab}
                  customSubPages={pagesFor(tab.id)}
                  onDeletePage={deletePage}
                  onEditPage={openCustomPageEditor}
                  onDeleteTab={deleteTab}
                  pending={pending}
                  onDragStart={() => onTabDragStart(tabIdx)}
                  onDragOver={e => onTabDragOver(e, tabIdx)}
                  onDrop={() => onTabDrop(tabIdx)}
                  onDragEnd={onTabDragEnd}
                  isDragOver={tabDragOverIdx === tabIdx}
                  successMessage={newTabSuccessId === tab.id
                    ? `"${tab.name}" created — add pages to it using the button below`
                    : undefined}
                />
              ))}
            </div>

            {/* Single add button / inline panel */}
            <div className="mt-4">
              {!addPanelOpen ? (
                <button
                  onClick={() => { setAddPanelOpen(true); setNewTabSuccessId(null) }}
                  className="flex items-center gap-2 rounded-[8px] border px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-surface-1"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add page or tab
                </button>
              ) : (
                <AddPanel
                  tabs={tabs}
                  pages={pages}
                  clubId={clubId}
                  onPageCreated={page => {
                    setPages(prev => [...prev, page])
                    setAddPanelOpen(false)
                  }}
                  onTabCreated={tab => {
                    setTabs(prev => [...prev, tab])
                    setNewTabSuccessId(tab.id)
                    setAddPanelOpen(false)
                  }}
                  onClose={() => setAddPanelOpen(false)}
                />
              )}
            </div>
          </div>

          {/* Mobile preview */}
          <div className="w-56 flex-shrink-0 hidden lg:block">
            <MobileNavPreview tabs={tabs} />
          </div>
        </div>
      )}

      {/* ── Homepage tab ─────────────────────────────────────────────────── */}
      {activeTab === 'homepage' && (
        <HomepageEditor initialBlocks={initialHomepageBlocks} galleries={initialGalleries} />
      )}

      {/* ── Pages tab ────────────────────────────────────────────────────── */}
      {activeTab === 'pages' && (
        <div>
          {/* Post-creation prompt */}
          {pagesTabNewPage && (
            <div className="mb-4 rounded-[8px] px-4 py-3 flex items-center gap-3"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)' }}>
              <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--action-primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="flex-1 text-[13px]" style={{ color: 'var(--text-primary)' }}>
                <strong>&ldquo;{pagesTabNewPage.title}&rdquo;</strong> created as a draft. Want to add it to your navigation?
              </span>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                sx={{ textTransform: 'none', fontSize: 12, flexShrink: 0 }}
                onClick={() => setPlacePageFor(pagesTabNewPage)}
              >
                Add to navigation →
              </Button>
              <button
                onClick={() => setPagesTabNewPage(null)}
                className="flex-shrink-0 text-[12px] hover:underline"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Not yet
              </button>
            </div>
          )}

          <BuiltinPagesTable
            builtinVisibility={builtinVisibility}
            onChangeVisibility={changeBuiltinVisibility}
            onEditAbout={openAboutEditor}
            onGoHomepageBuilder={() => setActiveTab('homepage')}
          />
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
              Custom pages
            </p>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
              onClick={() => setNewPageOpen(true)}
            >
              New page
            </Button>
          </div>
          <PagesTable
            pages={pages}
            tabs={tabs}
            onEditPage={openCustomPageEditor}
            onDeletePage={deletePage}
            onGoToNavigation={() => {
              setPagesTabNewPage(null)
              setActiveTab('navigation')
              setAddPanelOpen(true)
            }}
            pending={pending}
          />
        </div>
      )}

      {/* ── Club galleries tab ─────────────────────────────────────────── */}
      {activeTab === 'galleries' && (
        <ClubGalleriesTab galleries={initialGalleries} members={members} clubSlug={clubSlug} />
      )}

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}

      {/* New page (Pages tab flow) */}
      <NewPageDialog
        open={newPageOpen}
        onClose={() => setNewPageOpen(false)}
        onSave={savePagesTabPage}
        pending={pending}
      />

      {/* Place orphaned page in nav (after Pages tab post-creation prompt) */}
      {placePageFor && (
        <PlacePageDialog
          page={placePageFor}
          tabs={tabs}
          onClose={() => setPlacePageFor(null)}
          onSave={parent => savePageNavPlacement(parent, placePageFor)}
          pending={pending}
        />
      )}

      {/* About page inline editor */}
      <Dialog open={aboutDialogOpen} onClose={() => setAboutDialogOpen(false)} fullScreen>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            <Button startIcon={<CloseIcon sx={{ fontSize: 16 }} />} variant="text" color="secondary" size="small"
              onClick={() => setAboutDialogOpen(false)}>
              Back to Pages
            </Button>
          </Box>
          {aboutLoading || !aboutPageData ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <AboutPageEditor pageId={aboutPageData.id} initialContent={aboutPageData.content} />
            </Box>
          )}
        </Box>
      </Dialog>

      {/* Custom page inline editor */}
      {editingCustomPage && (
        <Dialog open onClose={() => setEditingCustomPage(null)} fullScreen>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
              <Button startIcon={<CloseIcon sx={{ fontSize: 16 }} />} variant="text" color="secondary" size="small"
                onClick={() => setEditingCustomPage(null)}>
                Back to Pages
              </Button>
            </Box>
            {customPageLoading ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <CustomPageEditorComponent
                  pageId={editingCustomPage.id}
                  menuLabel={menuLocationLabel(editingCustomPage, tabs)}
                  initialTitle={editingCustomPage.title}
                  initialContent={customPageContent}
                  initialVisibility={editingCustomPage.visibility}
                  initialStatus={editingCustomPage.status}
                  slug={editingCustomPage.slug}
                  clubSlug={clubSlug}
                />
              </Box>
            )}
          </Box>
        </Dialog>
      )}
    </div>
  )
}

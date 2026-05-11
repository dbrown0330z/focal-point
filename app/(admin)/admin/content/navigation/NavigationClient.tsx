'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import {
  Box,
  Button,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, FormLabel,
  MenuItem, Radio, RadioGroup,
  Select, Tab, Tabs, TextField, Tooltip, Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { createClient } from '@/lib/supabase/client'
import HomepageEditor from './HomepageEditor'
import type { ContentBlock } from '@/lib/homepage/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type PageType     = 'rich_text' | 'document_link' | 'external_link'
type Visibility   = 'all_members' | 'members_only' | 'hidden'
type PageStatus   = 'draft' | 'published'
type ParentSystem = 'calendar' | 'images' | 'competitions' | 'our-club'
type MainTab      = 'navigation' | 'homepage' | 'pages'

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
  editHref?: string   // link to edit this page in admin
  dynamic?:  boolean  // content auto-generated, not editable
  children?: SysItem[]
  parentKey?: ParentSystem  // which slot to attach custom sub-pages to
}

const SYSTEM_NAV: SysItem[] = [
  { label: 'Home',     href: '/',          dynamic: true },
  { label: 'Calendar', href: '/calendar',  dynamic: true, parentKey: 'calendar' },
  {
    label: 'Images', href: '/library', dynamic: true, parentKey: 'images',
    children: [
      { label: 'My images', href: '/library',           dynamic: true },
      { label: 'Galleries', href: '/library/galleries', dynamic: true },
    ],
  },
  {
    label: 'Competitions', href: '/competitions', dynamic: true, parentKey: 'competitions',
    children: [
      { label: 'Current competitions', href: '/competitions',         dynamic: true },
      { label: 'Results',              href: '/competitions/results', dynamic: true },
    ],
  },
  {
    label: 'Our Club', href: '/our-club', dynamic: true, parentKey: 'our-club',
    children: [
      { label: 'About our club',   href: '/our-club/about',             editHref: '/admin/content/about' },
      { label: 'Member directory', href: '/our-club/members',           dynamic: true },
      { label: 'Standings',        href: '/our-club/members/standings', dynamic: true },
      { label: 'Documents',        href: '/our-club/documents',         dynamic: true },
    ],
  },
]

const SLOT_LABEL: Record<ParentSystem, string> = {
  calendar:     'Calendar',
  images:       'Images',
  competitions: 'Competitions',
  'our-club':   'Our Club',
}

// System pages shown in the Custom Pages table
const STATIC_TABLE_ROWS = [
  { title: 'Home', url: '/', audience: 'Split: Public + Members', menuLocation: 'Fixed' },
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

function audienceLabel(v: Visibility): string {
  if (v === 'all_members')  return 'All members'
  if (v === 'members_only') return 'Members only'
  return 'Hidden'
}

function menuLocationLabel(page: CustomPage, tabs: CustomTab[]): string {
  if (page.parent_system) return SLOT_LABEL[page.parent_system]
  if (page.tab_id)        return tabs.find(t => t.id === page.tab_id)?.name ?? '—'
  return '—'
}

// ── Small shared components ───────────────────────────────────────────────────

function SystemChip() {
  return (
    <Tooltip
      title="System tabs are part of the site's default structure and cannot be removed or renamed."
      placement="top"
    >
      <span
        className="inline-flex cursor-default select-none items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
        style={{ background: 'var(--surface-1)', color: 'var(--text-tertiary)', border: '1px solid var(--border-default)' }}
      >
        System
      </span>
    </Tooltip>
  )
}

function CustomChip() {
  return (
    <Tooltip title="Custom tab — added by an admin" placement="top">
      <span
        className="inline-flex cursor-default select-none items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
        style={{ background: 'rgba(0,151,167,0.10)', color: '#0097A7', border: '1px solid rgba(0,151,167,0.30)' }}
      >
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
      bgcolor: t => t.palette.mode === 'dark' ? 'rgba(150,196,89,0.18)' : 'rgba(46,125,50,0.10)',
      color:   t => t.palette.mode === 'dark' ? '#B5D96A'              : '#174A1A',
    }}>
      <Box component="span" sx={{
        width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
        bgcolor: t => t.palette.mode === 'dark' ? '#B5D96A' : '#2E7D32',
      }} />
      Live
    </Box>
  )
}

function DraftBadge() {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
    >
      Draft
    </span>
  )
}

function StatusBadge({ status }: { status: 'live' | 'draft' }) {
  return status === 'live' ? <LiveBadge /> : <DraftBadge />
}

function SubPageCount({ count, onAddOne }: { count: number; onAddOne: () => void }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
      {count} sub page{count !== 1 ? 's' : ''}
      {count === 0 && (
        <button
          onClick={e => { e.stopPropagation(); onAddOne() }}
          className="font-medium hover:underline"
          style={{ color: 'var(--action-primary)' }}
        >
          — Add one
        </button>
      )}
    </span>
  )
}

function DragHandle({ disabled = false }: { disabled?: boolean }) {
  return (
    <span
      className={`flex-shrink-0 ${disabled ? 'cursor-default opacity-25' : 'cursor-grab active:cursor-grabbing'}`}
      style={{ color: 'var(--text-tertiary)', touchAction: 'none' }}
    >
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
    <svg
      className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
      style={{ color: 'var(--text-tertiary)' }}
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function AddSubPageButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 py-2 text-[12px] font-medium transition-colors hover:underline"
      style={{ color: 'var(--action-primary)' }}
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </button>
  )
}

// ── Navigation tab: system sub-item row ───────────────────────────────────────

function SysSubRow({ item }: { item: SysItem }) {
  return (
    <div
      className="flex items-center gap-3 py-2.5 pl-4 pr-4"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <DragHandle disabled />
      <span className="flex-1 text-[13px]" style={{ color: 'var(--text-primary)' }}>
        {item.label}
      </span>
      {item.dynamic ? (
        <span className="text-[11px] italic" style={{ color: 'var(--text-tertiary)' }}>
          Content added dynamically
        </span>
      ) : item.editHref ? (
        <Link
          href={item.editHref}
          className="text-[11px] font-medium hover:underline"
          style={{ color: 'var(--action-primary)' }}
        >
          Edit content →
        </Link>
      ) : null}
      <SystemChip />
      <LiveBadge />
    </div>
  )
}

// ── Navigation tab: custom sub-item row ───────────────────────────────────────

function CustomSubRow({
  page, onDelete, pending,
  onDragStart, onDragOver, onDrop, onDragEnd, isDragOver,
}: {
  page: CustomPage
  onDelete: (id: string) => void
  pending: boolean
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragEnd: () => void
  isDragOver: boolean
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
        className="flex items-center gap-3 py-2.5 pl-4 pr-4"
        style={{
          borderTop: isDragOver ? '2px solid var(--action-primary)' : '1px solid var(--border-subtle)',
          opacity: 1,
        }}
      >
        <DragHandle />
        <span className="flex-1 min-w-0 text-[13px]" style={{ color: 'var(--text-primary)' }}>
          {page.title}
          <span className="ml-1.5 font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            /{page.slug}
          </span>
        </span>

        {/* Edit */}
        {page.page_type === 'rich_text' && (
          <Link
            href={`/admin/content/navigation/${page.id}`}
            className="flex-shrink-0 text-[12px] font-medium hover:underline"
            style={{ color: 'var(--action-primary)' }}
          >
            Edit
          </Link>
        )}

        {/* Trash */}
        <Tooltip title="Delete page">
          <button
            disabled={pending}
            onClick={() => setConfirmOpen(true)}
            className="flex-shrink-0 rounded p-1 transition-colors hover:bg-surface-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {/* Trash icon */}
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </Tooltip>

        {/* CUSTOM chip */}
        <CustomChip />

        {/* Status */}
        <StatusBadge status={page.status === 'published' ? 'live' : 'draft'} />
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle component="div" sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              bgcolor: 'rgba(211,47,47,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
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
            <Box sx={{ mb: 1.5 }}>
              All content will be permanently lost and <strong>cannot be undone</strong>.
            </Box>
            <Box sx={{
              bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,193,7,0.08)' : 'rgba(166,124,0,0.07)',
              border: '1px solid',
              borderColor: t => t.palette.mode === 'dark' ? 'rgba(255,193,7,0.25)' : 'rgba(166,124,0,0.25)',
              borderRadius: 1.5, px: 1.75, py: 1.25, fontSize: 12,
              color: t => t.palette.mode === 'dark' ? '#FAD84A' : '#6B5000',
            }}>
              💡 If you&apos;re unsure, consider setting the page status to <strong>Draft</strong> instead — it will be hidden from all visitors but preserved for later.
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" color="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={pending}
            onClick={() => { setConfirmOpen(false); onDelete(page.id) }}
            sx={{ bgcolor: '#D32F2F', '&:hover': { bgcolor: '#B71C1C' } }}
          >
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
  onAddSubPage,
  onDeletePage,
  pending,
}: {
  item:           SysItem
  customSubPages: CustomPage[]
  onAddSubPage:   (parentKey: ParentSystem) => void
  onDeletePage:   (id: string) => void
  pending:        boolean
}) {
  const [open, setOpen] = useState(false)
  const [localCustom, setLocalCustom] = useState<CustomPage[]>(customSubPages)
  const dragIdx = useRef<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  useEffect(() => setLocalCustom(customSubPages), [customSubPages])

  const sysCount    = item.children?.length ?? 0
  const customCount = localCustom.length
  const totalCount  = sysCount + customCount
  const isHome      = item.href === '/'
  const canExpand   = totalCount > 0

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any
    await Promise.all(reordered.map((p, i) =>
      supabase.from('nav_custom_pages').update({ sort_order: i }).eq('id', p.id)
    ))
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      {/* Header row — div not button so nested interactive elements are valid HTML */}
      <div
        onClick={() => canExpand && setOpen(o => !o)}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-1 ${!canExpand ? 'cursor-default' : 'cursor-pointer'}`}
      >
        {/* Chevron or same-width spacer to keep label aligned */}
        {canExpand
          ? <ChevronIcon open={open} />
          : <span className="h-4 w-4 flex-shrink-0" />
        }
        <span className="flex-1 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {item.label}
        </span>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {item.parentKey && (
            <SubPageCount count={totalCount} onAddOne={() => { setOpen(true); onAddSubPage(item.parentKey!) }} />
          )}
          <SystemChip />
          <LiveBadge />
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div>
          {item.children?.map(child => (
            <SysSubRow key={child.href} item={child} />
          ))}
          {localCustom.map((page, idx) => (
            <CustomSubRow
              key={page.id} page={page} onDelete={onDeletePage} pending={pending}
              onDragStart={() => onCustomDragStart(idx)}
              onDragOver={e => onCustomDragOver(e, idx)}
              onDrop={() => onCustomDrop(idx)}
              onDragEnd={onCustomDragEnd}
              isDragOver={dragOverIdx === idx}
            />
          ))}
          {/* Add sub page */}
          {item.parentKey && (
            <div className="pl-4 pr-4 pb-2.5 pt-1.5" style={{ borderTop: customCount + sysCount > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
              <AddSubPageButton
                label={`Add sub page to ${item.label}`}
                onClick={() => onAddSubPage(item.parentKey!)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Navigation tab: custom tab accordion row ──────────────────────────────────

function CustomTabRow({
  tab,
  customSubPages,
  onAddSubPage,
  onDeletePage,
  onDeleteTab,
  pending,
}: {
  tab:            CustomTab
  customSubPages: CustomPage[]
  onAddSubPage:   (tabId: string) => void
  onDeletePage:   (id: string) => void
  onDeleteTab:    (id: string) => void
  pending:        boolean
}) {
  const [open, setOpen] = useState(false)
  const [localPages, setLocalPages] = useState<CustomPage[]>(customSubPages)
  const dragIdx = useRef<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  useEffect(() => setLocalPages(customSubPages), [customSubPages])

  const onDragStart = (idx: number) => { dragIdx.current = idx }
  const onDragOver  = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx) }
  const onDragEnd   = () => { dragIdx.current = null; setDragOverIdx(null) }
  const onDrop      = async (toIdx: number) => {
    const fromIdx = dragIdx.current
    dragIdx.current = null; setDragOverIdx(null)
    if (fromIdx === null || fromIdx === toIdx) return
    const reordered = [...localPages]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    setLocalPages(reordered)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any
    await Promise.all(reordered.map((p, i) =>
      supabase.from('nav_custom_pages').update({ sort_order: i }).eq('id', p.id)
    ))
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      {/* Header row — div not button so nested interactive elements are valid HTML */}
      <div
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-1 cursor-pointer"
      >
        <ChevronIcon open={open} />
        <span className="flex-1 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {tab.name}
        </span>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <SubPageCount count={localPages.length} onAddOne={() => { setOpen(true); onAddSubPage(tab.id) }} />
          <CustomChip />
          <LiveBadge />
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

      {open && (
        <div>
          {localPages.map((page, idx) => (
            <CustomSubRow
              key={page.id} page={page} onDelete={onDeletePage} pending={pending}
              onDragStart={() => onDragStart(idx)}
              onDragOver={e => onDragOver(e, idx)}
              onDrop={() => onDrop(idx)}
              onDragEnd={onDragEnd}
              isDragOver={dragOverIdx === idx}
            />
          ))}
          {localPages.length === 0 && (
            <div className="py-3 pl-4 pr-4 text-[13px] italic" style={{ color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-subtle)' }}>
              No sub pages yet.
            </div>
          )}
          <div className="pl-4 pr-4 pb-2.5 pt-1.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <AddSubPageButton label="Add sub page" onClick={() => onAddSubPage(tab.id)} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Custom Pages tab: table ───────────────────────────────────────────────────

function PagesTable({
  pages,
  tabs,
  onAddPage,
  onDeletePage,
  pending,
}: {
  pages:       CustomPage[]
  tabs:        CustomTab[]
  onAddPage:   () => void
  onDeletePage: (id: string) => void
  pending:     boolean
}) {
  const liveCount  = pages.filter(p => p.status === 'published').length
  const draftCount = pages.filter(p => p.status === 'draft').length

  const COL = 'grid-cols-[1.8fr_5.5rem_8rem_8rem_8rem_6rem_2.5rem]'

  return (
    <div>
      {/* Stats + action bar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-semibold text-content-primary">{pages.length}</span> total
          <span className="mx-2" style={{ color: 'var(--border-default)' }}>·</span>
          <span className="font-semibold" style={{ color: 'var(--action-primary)' }}>{liveCount}</span> live
          <span className="mx-2" style={{ color: 'var(--border-default)' }}>·</span>
          <span className="font-semibold text-content-secondary">{draftCount}</span> draft
        </p>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
          onClick={onAddPage}
        >
          New page
        </Button>
      </div>

      {/* Table */}
      <div
        className="rounded-[10px] overflow-hidden"
        style={{ border: '1px solid var(--border-default)' }}
      >
        {/* Header */}
        <div
          className={`grid ${COL} gap-3 px-4 py-2.5`}
          style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--surface-1)' }}
        >
          {['Title', 'Status', 'URL', 'Audience', 'Menu location', 'Last updated', ''].map(h => (
            <span key={h} className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
              {h}
            </span>
          ))}
        </div>

        {/* Static system rows */}
        {STATIC_TABLE_ROWS.map(row => (
          <div
            key={row.url}
            className={`grid ${COL} items-center gap-3 px-4 py-3`}
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {row.title}
              </span>
              <SystemChip />
            </div>
            <LiveBadge />
            <span className="font-mono text-[12px] truncate" style={{ color: 'var(--text-secondary)' }}>{row.url}</span>
            <span className="text-[13px] truncate" style={{ color: 'var(--text-secondary)' }}>{row.audience}</span>
            <span className="text-[13px] italic truncate" style={{ color: 'var(--text-tertiary)' }}>{row.menuLocation}</span>
            <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>—</span>
            <span />
          </div>
        ))}

        {/* Custom page rows */}
        {pages.length === 0 ? (
          <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            No custom pages yet. Click <strong>New page</strong> to create one.
          </div>
        ) : (
          pages.map((page, i) => (
            <div
              key={page.id}
              className={`grid ${COL} items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-1`}
              style={{ borderBottom: i < pages.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
            >
              <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {page.title}
              </span>
              <StatusBadge status={page.status === 'published' ? 'live' : 'draft'} />
              <span className="font-mono text-[12px] truncate" style={{ color: 'var(--text-secondary)' }}>/{page.slug}</span>
              <span className="text-[13px] truncate" style={{ color: 'var(--text-secondary)' }}>
                {audienceLabel(page.visibility)}
              </span>
              <span className="text-[13px] truncate" style={{ color: 'var(--text-secondary)' }}>
                {menuLocationLabel(page, tabs)}
              </span>
              <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                {page.updated_at ? timeAgo(page.updated_at) : '—'}
              </span>
              {page.page_type === 'rich_text' && (
                <Tooltip title="Edit page content">
                  <Link
                    href={`/admin/content/navigation/${page.id}`}
                    className="flex items-center justify-center rounded p-1 transition-colors hover:bg-surface-1"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                </Tooltip>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── Dialogs ───────────────────────────────────────────────────────────────────

function AddPageDialog({
  open,
  parentLabel,
  onClose,
  onSave,
  pending,
}: {
  open:        boolean
  parentLabel: string
  onClose:     () => void
  onSave:      (title: string, type: PageType, url: string, vis: Visibility) => void
  pending:     boolean
}) {
  const [title,   setTitle]   = useState('')
  const [type,    setType]    = useState<PageType>('rich_text')
  const [url,     setUrl]     = useState('https://')
  const [vis,     setVis]     = useState<Visibility>('all_members')

  function handleSave() {
    if (!title.trim()) return
    onSave(title, type, url, vis)
    setTitle(''); setType('rich_text'); setUrl('https://'); setVis('all_members')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>
        Add page {parentLabel ? `to ${parentLabel}` : ''}
      </DialogTitle>
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

        <FormControl>
          <FormLabel sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Visibility</FormLabel>
          <Select size="small" value={vis} onChange={e => setVis(e.target.value as Visibility)} sx={{ fontSize: 13 }}>
            <MenuItem value="all_members"  sx={{ fontSize: 13 }}>All members</MenuItem>
            <MenuItem value="members_only" sx={{ fontSize: 13 }}>Members only (not public)</MenuItem>
            <MenuItem value="hidden"       sx={{ fontSize: 13 }}>Hidden — draft, do not show in navigation</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" color="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!title.trim() || pending} onClick={handleSave}>
          Create page
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function AddTabDialog({
  open,
  onClose,
  onSave,
  pending,
}: {
  open:    boolean
  onClose: () => void
  onSave:  (name: string) => void
  pending: boolean
}) {
  const [name, setName] = useState('')

  function handleSave() {
    if (!name.trim() || name.length > 20) return
    onSave(name)
    setName('')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>New top-level tab</DialogTitle>
      <DialogContent sx={{ pt: '16px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Tab name" size="small" fullWidth autoFocus
          value={name}
          onChange={e => setName(e.target.value.slice(0, 20))}
          helperText={`${name.length}/20 characters — shown in the main navigation bar`}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <p className="text-[12px]" style={{ color: 'var(--text-secondary)', margin: 0 }}>
          After creating the tab you can add sub pages to it from the Navigation editor.
        </p>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" color="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!name.trim() || name.length > 20 || pending} onClick={handleSave}>
          Create tab
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
}: {
  customPages:            CustomPage[]
  customTabs:             CustomTab[]
  initialHomepageBlocks?: ContentBlock[]
}) {
  const [activeTab, setActiveTab] = useState<MainTab>('navigation')
  const [pages,     setPages]     = useState<CustomPage[]>(initialPages)
  const [tabs,      setTabs]      = useState<CustomTab[]>(initialTabs)
  const [pending, startTrans]     = useTransition()
  const [err,       setErr]       = useState<string | null>(null)

  // ── Add page state ────────────────────────────────────────────────────────
  const [addPageOpen,   setAddPageOpen]   = useState(false)
  const [addPageParent, setAddPageParent] = useState<ParentSystem | string>('our-club')
  const [addPageLabel,  setAddPageLabel]  = useState('')

  function openAddPage(parent: ParentSystem | string, label = '') {
    setAddPageParent(parent)
    setAddPageLabel(label)
    setAddPageOpen(true)
  }

  function saveAddPage(title: string, type: PageType, url: string, vis: Visibility) {
    const slug = slugify(title)
    setAddPageOpen(false)
    setErr(null)
    startTrans(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any
      const isSystem = (['images','competitions','our-club'] as string[]).includes(addPageParent)
      const { data, error } = await supabase.from('nav_custom_pages').insert({
        title: title.trim(), slug,
        page_type:    type,
        visibility:   vis,
        status:       vis === 'hidden' ? 'draft' : 'draft',
        external_url: type === 'external_link' ? url : null,
        sort_order:   pages.filter(p =>
          isSystem ? p.parent_system === addPageParent : p.tab_id === addPageParent
        ).length,
        ...(isSystem
          ? { parent_system: addPageParent, tab_id: null }
          : { parent_system: null, tab_id: addPageParent }),
      }).select().single()
      if (error) { setErr(error.message); return }
      setPages(prev => [...prev, data as CustomPage])
    })
  }

  function deletePage(id: string) {
    startTrans(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any
      await supabase.from('nav_custom_pages').delete().eq('id', id)
      setPages(prev => prev.filter(p => p.id !== id))
    })
  }

  // ── Add tab state ─────────────────────────────────────────────────────────
  const [addTabOpen, setAddTabOpen] = useState(false)

  function saveAddTab(name: string) {
    setAddTabOpen(false)
    startTrans(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any
      const { data, error } = await supabase.from('nav_custom_tabs')
        .insert({ name: name.trim(), slug: slugify(name), sort_order: tabs.length })
        .select().single()
      if (error) { setErr(error.message); return }
      setTabs(prev => [...prev, data as CustomTab])
    })
  }

  function deleteTab(id: string) {
    startTrans(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any
      await supabase.from('nav_custom_tabs').delete().eq('id', id)
      setTabs(prev => prev.filter(t => t.id !== id))
      setPages(prev => prev.filter(p => p.tab_id !== id))
    })
  }

  const pagesFor = (parent: ParentSystem | string) =>
    pages.filter(p =>
      (['calendar','images','competitions','our-club'] as string[]).includes(parent)
        ? p.parent_system === parent
        : p.tab_id === parent
    )

  const MAIN_TABS = [
    { key: 'navigation' as MainTab, label: 'Navigation' },
    { key: 'homepage'   as MainTab, label: 'Homepage' },
    { key: 'pages'      as MainTab, label: 'Custom Pages' },
  ]

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Navigation &amp; Pages</h1>
        <p className="mt-1 text-[13px] text-content-secondary">Manage site structure and custom pages.</p>
      </div>

      {err && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErr(null)}>{err}</Alert>
      )}

      {/* Main tab bar */}
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
        <div>
          <div
            className="rounded-[10px] overflow-hidden"
            style={{ border: '1px solid var(--border-default)' }}
          >
            {/* System nav rows */}
            {SYSTEM_NAV.map(item => (
              <SysNavRow
                key={item.href}
                item={item}
                customSubPages={item.parentKey ? pagesFor(item.parentKey) : []}
                onAddSubPage={key => openAddPage(key, SLOT_LABEL[key])}
                onDeletePage={deletePage}
                pending={pending}
              />
            ))}

            {/* Custom tab rows */}
            {tabs.map(tab => (
              <CustomTabRow
                key={tab.id}
                tab={tab}
                customSubPages={pagesFor(tab.id)}
                onAddSubPage={id => openAddPage(id, tab.name)}
                onDeletePage={deletePage}
                onDeleteTab={deleteTab}
                pending={pending}
              />
            ))}
          </div>

          {/* Add top-level tab */}
          <div className="mt-4">
            {tabs.length < 2 ? (
              <button
                onClick={() => setAddTabOpen(true)}
                className="flex items-center gap-2 rounded-[8px] border px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-surface-1"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add top-level tab
              </button>
            ) : (
              <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                Maximum of 2 custom tabs reached. Consider adding pages under an existing menu.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Homepage tab ─────────────────────────────────────────────────── */}
      {activeTab === 'homepage' && (
        <HomepageEditor initialBlocks={initialHomepageBlocks} />
      )}

      {/* ── Custom Pages tab ─────────────────────────────────────────────── */}
      {activeTab === 'pages' && (
        <PagesTable
          pages={pages}
          tabs={tabs}
          onAddPage={() => openAddPage('our-club', 'Our Club')}
          onDeletePage={deletePage}
          pending={pending}
        />
      )}

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
      <AddPageDialog
        open={addPageOpen}
        parentLabel={addPageLabel}
        onClose={() => setAddPageOpen(false)}
        onSave={saveAddPage}
        pending={pending}
      />
      <AddTabDialog
        open={addTabOpen}
        onClose={() => setAddTabOpen(false)}
        onSave={saveAddTab}
        pending={pending}
      />
    </div>
  )
}

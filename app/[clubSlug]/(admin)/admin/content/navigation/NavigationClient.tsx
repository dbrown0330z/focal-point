'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import {
  Alert, Button,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, FormLabel,
  MenuItem, Radio, RadioGroup,
  Select, TextField,
} from '@mui/material'
import AddIcon         from '@mui/icons-material/Add'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useParams }   from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type AdminGalleryData, type ClubMember } from '../galleries/ClubGalleriesTab'

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
const GRID_COLS  = '32px minmax(0,1fr) 160px 320px'
const GRID_GAP   = '20px'
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
  hasDrag:   boolean
  visKey?:   'about' | 'calendar' | 'galleries' | 'join'
  enableKey?: 'resources' | 'galleries'
}

const HOME_PAGES: BuiltinPageDef[] = [{
  key: 'homepage', title: 'Homepage', hasDrag: false,
  tooltip:  'The landing page for signed-in members, with customizable content blocks.',
  viewPath: '/', editPath: '/admin/content/homepage', editSlot: 'edit',
}]

const IMAGES_PAGES: BuiltinPageDef[] = [
  { key: 'my-images',    title: 'My images',    hasDrag: true, tooltip: 'Each member sees their own library. Always on.', editSlot: 'user-generated' },
  { key: 'my-galleries', title: 'My galleries', hasDrag: true, tooltip: 'Each member sees their own library. Always on.', editSlot: 'user-generated' },
]

const COMPETITIONS_PAGES: BuiltinPageDef[] = [
  { key: 'comp-current',   title: 'Current',   hasDrag: true, tooltip: 'Competitions currently open for entries.',              editSlot: 'auto-generated' },
  { key: 'comp-results',   title: 'Results',   hasDrag: true, tooltip: 'Scores and winners from past competitions.',            editSlot: 'auto-generated' },
  { key: 'comp-standings', title: 'Standings', hasDrag: true, tooltip: 'Cumulative member rankings across the season.',         editSlot: 'auto-generated' },
]

const OUR_CLUB_PAGES: BuiltinPageDef[] = [
  { key: 'about',            title: 'About our club',   hasDrag: true, visKey: 'about',    editSlot: 'edit',   viewPath: '/our-club/about',    editPath: '/admin/content/about',
    tooltip: 'Customizable content page for describing your club.' },
  { key: 'member-directory', title: 'Member directory', hasDrag: true,                     editSlot: 'auto-generated',
    tooltip: 'List of club members and their contact details.' },
  { key: 'resources',        title: 'Resources',        hasDrag: true, enableKey: 'resources', editSlot: 'manage', viewPath: '/our-club/resources', editPath: '/admin/resources',
    tooltip: 'Members-only documents, downloads, and links organized by category.' },
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
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" fill="currentColor" opacity="0.45"/>
      ))}
    </svg>
  )
}

function VertGrip() {
  return (
    <svg width="10" height="20" viewBox="0 0 10 20" aria-hidden="true">
      {([2, 8] as number[]).flatMap(cx => ([3, 10, 17] as number[]).map(cy =>
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" fill="currentColor" opacity="0.45"/>
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
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button" aria-label="More information"
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-tertiary)', display: 'inline-flex', lineHeight: 1 }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12.01" y2="8"/><polyline points="11 12 12 12 12 16"/>
        </svg>
      </button>
      {open && (
        <span role="tooltip" style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          marginBottom: 8, background: '#1F2733', color: '#fff', fontSize: 12,
          borderRadius: 6, padding: '6px 10px', maxWidth: 260, whiteSpace: 'normal',
          zIndex: 9999, pointerEvents: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', lineHeight: 1.5,
        }}>
          {text}
        </span>
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
      background: '#F1F3F6', color: 'var(--text-secondary)',
      border: '1px solid #C9CED6', borderRadius: 4, flexShrink: 0,
    }}>Custom</span>
  )
}

// ── ToggleSwitch ──────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const navy = '#24467F'
  const off  = '#B4BAC4'
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: disabled ? 'default' : 'pointer' }}>
      <span style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, flexShrink: 0 }}>
        <input type="checkbox" role="switch" aria-label={checked ? 'Visible' : 'Hidden'}
          checked={checked} disabled={disabled}
          onChange={e => onChange(e.target.checked)}
          style={{ opacity: 0, position: 'absolute', inset: 0, margin: 0, zIndex: 1, width: '100%', height: '100%', cursor: disabled ? 'default' : 'pointer' }} />
        <span style={{ display: 'block', borderRadius: 11, height: '100%', background: checked ? navy : off, transition: 'background .2s' }} />
        <span style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: checked ? navy : off, minWidth: 44, lineHeight: 1 }}>
        {checked ? 'Visible' : 'Hidden'}
      </span>
    </label>
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
      <MenuItem value="members_only" sx={{ fontSize: 13 }}>Members only</MenuItem>
      <MenuItem value="public"       sx={{ fontSize: 13 }}>Public</MenuItem>
    </Select>
  )
}

function CustomVisSelect({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  return (
    <Select size="small" value={value} onChange={e => onChange(e.target.value as Visibility)} sx={selSx}>
      <MenuItem value="all_members"  sx={{ fontSize: 13 }}>Members + public</MenuItem>
      <MenuItem value="members_only" sx={{ fontSize: 13 }}>Members only</MenuItem>
      <MenuItem value="hidden"       sx={{ fontSize: 13 }}>Hidden</MenuItem>
    </Select>
  )
}

// ── Actions cluster ───────────────────────────────────────────────────────────

function ActionsCluster({
  toggleEl, viewPath, editPath, editSlot, clubSlug, dimmed,
}: {
  toggleEl?: React.ReactNode
  viewPath?: string
  editPath?: string
  editSlot:  EditSlot
  clubSlug:  string
  dimmed?:   boolean
}) {
  const dim: React.CSSProperties = dimmed ? { opacity: 0.45, pointerEvents: 'none' } : {}
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
      {/* Toggle slot — 116px */}
      <div style={{ width: 116, display: 'flex', justifyContent: 'flex-start' }}>
        {toggleEl}
      </div>
      {/* View slot — 84px */}
      <div style={{ width: 84, ...dim }}>
        {viewPath && (
          <Button
            component="a" href={`/${clubSlug}${viewPath}`} target="_blank" rel="noopener noreferrer"
            variant="outlined" color="secondary" size="small" fullWidth
            endIcon={<ExternalIcon />}
            sx={{ fontSize: 12, py: 0.5, '& .MuiButton-endIcon': { ml: 0.5 } }}
          >View</Button>
        )}
      </div>
      {/* Edit slot — 104px */}
      <div style={{ width: 104, display: 'flex', alignItems: 'center', justifyContent: 'center', ...dim }}>
        {(editSlot === 'edit' || editSlot === 'manage') && editPath ? (
          <Button component={Link} href={`/${clubSlug}${editPath}`}
            variant="outlined" color="primary" size="small" fullWidth
            sx={{ fontSize: 12, py: 0.5 }}>
            {editSlot === 'manage' ? 'Manage' : 'Edit'}
          </Button>
        ) : editSlot === 'auto-generated' ? (
          <span style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--text-tertiary)', textAlign: 'center', display: 'block', whiteSpace: 'nowrap' }}>
            Auto-generated
          </span>
        ) : editSlot === 'user-generated' ? (
          <span style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--text-tertiary)', textAlign: 'center', display: 'block', whiteSpace: 'nowrap' }}>
            User generated
          </span>
        ) : null}
      </div>
    </div>
  )
}

// ── Builtin page row ──────────────────────────────────────────────────────────

function BuiltinPageRow({
  page, clubSlug, builtinVis, onChangeVis, onChangeEnabled, pending,
}: {
  page:            BuiltinPageDef
  clubSlug:        string
  builtinVis:      BuiltinPageVisibility
  onChangeVis:     (key: 'about' | 'calendar', v: BuiltinVis) => void
  onChangeEnabled: (key: 'resources' | 'galleries', v: boolean) => void
  pending:         boolean
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
      alignItems: 'center', minHeight: 60, borderTop: '1px solid var(--border-subtle)',
      background: dimmed ? '#F3F4F6' : '#fff',
    }}>
      {/* Drag handle */}
      <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-tertiary)', opacity: page.hasDrag ? (dimmed ? 0.4 : 1) : 0, cursor: page.hasDrag ? 'grab' : 'default' }}>
        {page.hasDrag && <span aria-label="Drag to reorder"><VertGrip /></span>}
      </div>
      {/* Name + tooltip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, opacity: dimmed ? 0.45 : 1 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{page.title}</span>
        <InfoTooltip text={page.tooltip} />
      </div>
      {/* Visibility */}
      <div style={{ opacity: dimmed ? 0.45 : 1, pointerEvents: dimmed ? 'none' : 'auto' }}>
        {hasBuiltinVisSelect ? (
          <BuiltinVisSelect value={visValue} onChange={v => onChangeVis(page.visKey as 'about' | 'calendar', v)} />
        ) : page.visKey === 'join' ? (
          <BuiltinVisSelect value="public" onChange={() => {}} />
        ) : (
          <span style={{ fontSize: 14, color: 'var(--text-secondary)', paddingLeft: 9 }}>Members only</span>
        )}
      </div>
      {/* Actions */}
      <ActionsCluster
        editSlot={page.editSlot} viewPath={page.viewPath} editPath={page.editPath}
        clubSlug={clubSlug} dimmed={dimmed}
        toggleEl={page.enableKey ? (
          <ToggleSwitch
            checked={enabled}
            onChange={v => onChangeEnabled(page.enableKey!, v)}
            disabled={pending}
          />
        ) : undefined}
      />
    </div>
  )
}

// ── Custom page row ───────────────────────────────────────────────────────────

function CustomPageRow({
  page, clubSlug, onDelete, onChangeVis, pending,
}: {
  page:        CustomPage
  clubSlug:    string
  onDelete:    (id: string) => void
  onChangeVis: (id: string, v: Visibility) => void
  pending:     boolean
}) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: GRID_COLS, gap: GRID_GAP, padding: '12px 20px 12px 12px',
      alignItems: 'center', minHeight: 60, borderTop: '1px solid var(--border-subtle)', background: '#fff',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-tertiary)', cursor: 'grab' }}>
        <span aria-label="Drag to reorder"><VertGrip /></span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {page.title}
        </span>
        <InfoTooltip text="Admin-created page." />
        <CustomChip />
      </div>
      <CustomVisSelect value={page.visibility} onChange={v => onChangeVis(page.id, v)} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
        <div style={{ width: 116 }} />
        <div style={{ width: 84 }}>
          <Button
            component="a" href={`/${clubSlug}/our-club/${page.slug}`} target="_blank" rel="noopener noreferrer"
            variant="outlined" color="secondary" size="small" fullWidth
            sx={{ fontSize: 12, py: 0.5 }}
          >View</Button>
        </div>
        <div style={{ width: 104, display: 'flex', gap: 4 }}>
          <Button
            component={Link} href={`/${clubSlug}/admin/content/navigation/${page.id}`}
            variant="outlined" color="primary" size="small" sx={{ fontSize: 12, py: 0.5, flex: 1 }}
          >Edit</Button>
          <Button
            variant="text" color="error" size="small"
            onClick={() => onDelete(page.id)} disabled={pending}
            sx={{ minWidth: 0, px: 0.75, py: 0.5, fontSize: 14, lineHeight: 1 }}
          >×</Button>
        </div>
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
        background: 'none', border: 'none', borderTop: '1px solid var(--border-subtle)',
        cursor: 'pointer', color: 'var(--action-primary)', fontSize: 13, fontWeight: 500,
        width: '100%', textAlign: 'left',
      }}
    >
      <AddIcon sx={{ fontSize: 16 }} /> Add page to {tabName}
    </button>
  )
}

// ── Tab block (builtin) ───────────────────────────────────────────────────────

function TabBlock({
  label, note, isLocked, isCalendar, isCustom, pageCount,
  expanded, onToggle, headerRightContent, dragHandleEl, children, footerEl,
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
}) {
  const pageWord = pageCount === 1 ? 'page' : 'pages'
  return (
    <div style={{
      border: '1px solid var(--border-default)', borderRadius: 10, overflow: 'visible',
      background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: GRID_COLS, gap: GRID_GAP, padding: GRID_PAD,
        alignItems: 'center', minHeight: 56, background: TAB_HDR_BG,
        borderBottom: expanded && !isCalendar ? '1px solid var(--border-default)' : 'none',
        borderRadius: expanded && !isCalendar ? '10px 10px 0 0' : 10,
        position: 'relative',
      }}>
        {/* Col 1 — caret / lock */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {isLocked ? (
            <span style={{ color: 'var(--text-tertiary)', display: 'flex', opacity: 0.6 }}><LockIcon /></span>
          ) : !isCalendar ? (
            <button type="button" onClick={onToggle} aria-label={expanded ? 'Collapse' : 'Expand'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', borderRadius: 4 }}>
              <ChevronRightIcon sx={{ fontSize: 18, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
            </button>
          ) : null}
        </div>
        {/* Col 2 — name + count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{label}</span>
          {!isCalendar && (
            <span style={{ fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 400 }}>
              ({pageCount} {pageWord})
            </span>
          )}
          {isCustom && <CustomChip />}
          {note && <span style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-tertiary)' }}>{note}</span>}
        </div>
        {/* Centered drag handle */}
        {dragHandleEl && (
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', color: 'var(--text-tertiary)', display: 'flex', cursor: 'grab' }}>
            {dragHandleEl}
          </div>
        )}
        {/* Col 3 — visibility */}
        <div>{headerRightContent}</div>
        {/* Col 4 — empty */}
        <div />
      </div>
      {expanded && children}
      {expanded && footerEl}
    </div>
  )
}

// ── Custom tab block ──────────────────────────────────────────────────────────

function CustomTabBlock({
  tab, pages, clubSlug, onDelete, onDeletePage, onChangeVis, onAddPage,
  pending, dragHandleEl, dragOverStyle, onDragStart, onDragOver, onDragEnd, onDrop,
}: {
  tab:           CustomTab
  pages:         CustomPage[]
  clubSlug:      string
  onDelete:      (id: string) => void
  onDeletePage:  (id: string) => void
  onChangeVis:   (id: string, v: Visibility) => void
  onAddPage:     () => void
  pending:       boolean
  dragHandleEl:  React.ReactNode
  dragOverStyle: React.CSSProperties
  onDragStart:   () => void
  onDragOver:    (e: React.DragEvent) => void
  onDragEnd:     () => void
  onDrop:        () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const count = pages.length
  return (
    <div draggable onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDrop={onDrop}
      style={{ border: '1px solid var(--border-default)', borderRadius: 10, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', ...dragOverStyle }}>
      <div style={{
        display: 'grid', gridTemplateColumns: GRID_COLS, gap: GRID_GAP, padding: GRID_PAD,
        alignItems: 'center', minHeight: 56, background: TAB_HDR_BG,
        borderBottom: expanded ? '1px solid var(--border-default)' : 'none',
        borderRadius: expanded ? '10px 10px 0 0' : 10, position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button type="button" onClick={() => setExpanded(e => !e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', borderRadius: 4 }}>
            <ChevronRightIcon sx={{ fontSize: 18, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{tab.name}</span>
          <span style={{ fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 400 }}>
            ({count} {count === 1 ? 'page' : 'pages'})
          </span>
          <CustomChip />
        </div>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', color: 'var(--text-tertiary)', cursor: 'grab', display: 'flex' }}>
          {dragHandleEl}
        </div>
        <div />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outlined" color="secondary" size="small" onClick={() => onDelete(tab.id)} disabled={pending} sx={{ fontSize: 12, py: 0.5 }}>
            Delete
          </Button>
        </div>
      </div>
      {expanded && pages.map(p => (
        <CustomPageRow key={p.id} page={p} clubSlug={clubSlug} onDelete={onDeletePage} onChangeVis={onChangeVis} pending={pending} />
      ))}
      {expanded && count === 0 && (
        <div style={{ padding: '24px 20px', textAlign: 'center', borderTop: '1px dashed var(--border-default)', color: 'var(--text-tertiary)', fontSize: 13 }}>
          No pages yet. Add one below — empty tabs are hidden from members.
        </div>
      )}
      {expanded && <AddPageFooter tabName={tab.name} onClick={onAddPage} />}
    </div>
  )
}

// ── Column header row ─────────────────────────────────────────────────────────

function ColumnHeaders() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: GRID_COLS, gap: GRID_GAP, padding: '0 20px 0 12px', alignItems: 'center', marginBottom: 8 }}>
      <div />
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Tab / Page</span>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Visibility</span>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', textAlign: 'right' }}>Actions</span>
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
        {err && <p className="text-[12px] m-0" style={{ color: 'var(--status-error)' }}>{err}</p>}
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
              label={<span><strong style={{ fontSize: 13 }}>Rich text</strong> <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>— formatted content</span></span>} />
            <FormControlLabel value="document_link" control={<Radio size="small" />} sx={{ alignItems: 'center', mb: 0.5 }}
              label={<span><strong style={{ fontSize: 13 }}>Document link</strong> <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>— links to a file in Resources</span></span>} />
            <FormControlLabel value="external_link" control={<Radio size="small" />} sx={{ alignItems: 'center' }}
              label={<span><strong style={{ fontSize: 13 }}>External link</strong> <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>— opens in a new tab</span></span>} />
          </RadioGroup>
        </FormControl>
        {type === 'external_link' && (
          <TextField label="URL" size="small" fullWidth value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" />
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
        {err && <p className="text-[12px] m-0" style={{ color: 'var(--status-error)' }}>{err}</p>}
        {atMax ? (
          <p className="text-[13px] m-0" style={{ color: 'var(--text-secondary)' }}>
            Maximum of {MAX_CUSTOM_TABS} custom tabs reached. Add pages to an existing tab instead.
          </p>
        ) : (
          <>
            <TextField label="Tab name" size="small" fullWidth autoFocus
              slotProps={{ htmlInput: { maxLength: 20 } }}
              value={tabName} onChange={e => setTabName(e.target.value.slice(0, 20))}
              helperText={`${tabName.length}/20 — shown in the main navigation bar`}
              onKeyDown={e => e.key === 'Enter' && tabName.trim() && !saving && handleCreate()} />
            <p className="text-[12px] m-0" style={{ color: 'var(--text-secondary)' }}>
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

  // Tab drag state
  const tabDragIdx = useRef<number | null>(null)
  const [tabDragOver, setTabDragOver] = useState<number | null>(null)

  const onTabDragStart = (idx: number) => { tabDragIdx.current = idx }
  const onTabDragOver  = (e: React.DragEvent, idx: number) => { e.preventDefault(); setTabDragOver(idx) }
  const onTabDragEnd   = () => { tabDragIdx.current = null; setTabDragOver(null) }
  const onTabDrop      = async (toIdx: number) => {
    const fromIdx = tabDragIdx.current
    tabDragIdx.current = null; setTabDragOver(null)
    if (fromIdx === null || fromIdx === toIdx) return
    const reordered = [...tabs]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    setTabs(reordered)
    const sb = createClient()
    await Promise.all(reordered.map((t, i) => sb.from('nav_custom_tabs').update({ sort_order: i }).eq('id', t.id)))
  }

  // DB operations
  async function changeBuiltinVis(key: 'about' | 'calendar', value: BuiltinVis) {
    setBV(prev => ({ ...prev, [key]: value }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createClient() as any
    const { data: existing } = await sb.from('club_settings').select('page_visibility').eq('club_id', clubId).single()
    const current = (existing?.page_visibility as Record<string, unknown> | null) ?? {}
    await sb.from('club_settings').update({ page_visibility: { ...current, [key]: value } }).eq('club_id', clubId)
  }

  async function changePageEnabled(key: 'resources' | 'galleries', enabled: boolean) {
    const stateKey = key === 'resources' ? 'resourcesEnabled' : 'galleriesEnabled'
    setBV(prev => ({ ...prev, [stateKey]: enabled }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createClient() as any
    const { data: existing } = await sb.from('club_settings').select('page_visibility').eq('club_id', clubId).single()
    const current = (existing?.page_visibility as Record<string, unknown> | null) ?? {}
    await sb.from('club_settings').update({ page_visibility: { ...current, [`${key}_enabled`]: enabled } }).eq('club_id', clubId)
  }

  async function changeCustomPageVis(id: string, v: Visibility) {
    setPages(prev => prev.map(p => p.id === id ? { ...p, visibility: v } : p))
    const sb = createClient()
    await sb.from('nav_custom_pages').update({ visibility: v, status: v === 'hidden' ? 'draft' : 'published' }).eq('id', id)
  }

  function deletePage(id: string) {
    startTrans(async () => {
      await createClient().from('nav_custom_pages').delete().eq('id', id)
      setPages(prev => prev.filter(p => p.id !== id))
    })
  }

  function deleteTab(id: string) {
    startTrans(async () => {
      await createClient().from('nav_custom_tabs').delete().eq('id', id)
      setTabs(prev => prev.filter(t => t.id !== id))
      setPages(prev => prev.filter(p => p.tab_id !== id))
    })
  }

  const pagesFor = (ps: ParentSystem) => pages.filter(p => p.parent_system === ps)
  const pagesForTab = (tabId: string) => pages.filter(p => p.tab_id === tabId)

  const builtinRowProps = { clubSlug, builtinVis, onChangeVis: changeBuiltinVis, onChangeEnabled: changePageEnabled, pending }

  // ── Builtin tab expanded states ───────────────────────────────────────────

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
            Each block is a tab in the top bar. Drag a tab by its handle to reorder. Use the toggle on Resources and Club Galleries to show or hide them.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outlined" color="secondary" size="small"
            startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
            onClick={() => setNewTabOpen(true)}>
            New tab
          </Button>
          <Button variant="contained" size="small"
            startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
            onClick={() => setNewPageOpen(true)}>
            New page
          </Button>
        </div>
      </div>

      {err && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErr(null)}>{err}</Alert>}

      <ColumnHeaders />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Home (locked, always first) ── */}
        <TabBlock label="Home" pageCount={1} isLocked expanded onToggle={() => {}}
          note="Always first"
          dragHandleEl={<span style={{ opacity: 0.3 }}><LockIcon /></span>}
        >
          {HOME_PAGES.map(p => <BuiltinPageRow key={p.key} page={p} {...builtinRowProps} />)}
        </TabBlock>

        {/* ── Calendar (single-page tab) ── */}
        <TabBlock
          label="Calendar" pageCount={0} isCalendar expanded onToggle={() => {}}
          note="Single-page tab"
          dragHandleEl={<HorizGrip />}
          headerRightContent={
            <BuiltinVisSelect value={builtinVis.calendar} onChange={v => changeBuiltinVis('calendar', v)} />
          }
        />

        {/* ── Images ── */}
        {(() => {
          const custom = pagesFor('images')
          return (
            <TabBlock label="Images" pageCount={IMAGES_PAGES.length + custom.length}
              dragHandleEl={<HorizGrip />} expanded={imagesOpen} onToggle={() => setImagesOpen(o => !o)}
              footerEl={<AddPageFooter tabName="Images" onClick={() => setNewPageOpen(true)} />}
            >
              {IMAGES_PAGES.map(p => <BuiltinPageRow key={p.key} page={p} {...builtinRowProps} />)}
              {custom.map(p => <CustomPageRow key={p.id} page={p} clubSlug={clubSlug} onDelete={deletePage} onChangeVis={changeCustomPageVis} pending={pending} />)}
            </TabBlock>
          )
        })()}

        {/* ── Competitions ── */}
        {(() => {
          const custom = pagesFor('competitions')
          return (
            <TabBlock label="Competitions" pageCount={COMPETITIONS_PAGES.length + custom.length}
              dragHandleEl={<HorizGrip />} expanded={competitionsOpen} onToggle={() => setCompetitionsOpen(o => !o)}
              footerEl={<AddPageFooter tabName="Competitions" onClick={() => setNewPageOpen(true)} />}
            >
              {COMPETITIONS_PAGES.map(p => <BuiltinPageRow key={p.key} page={p} {...builtinRowProps} />)}
              {custom.map(p => <CustomPageRow key={p.id} page={p} clubSlug={clubSlug} onDelete={deletePage} onChangeVis={changeCustomPageVis} pending={pending} />)}
            </TabBlock>
          )
        })()}

        {/* ── Our Club ── */}
        {(() => {
          const custom = pagesFor('our-club')
          return (
            <TabBlock label="Our Club" pageCount={OUR_CLUB_PAGES.length + custom.length}
              dragHandleEl={<HorizGrip />} expanded={ourClubOpen} onToggle={() => setOurClubOpen(o => !o)}
              footerEl={<AddPageFooter tabName="Our Club" onClick={() => setNewPageOpen(true)} />}
            >
              {OUR_CLUB_PAGES.map(p => <BuiltinPageRow key={p.key} page={p} {...builtinRowProps} />)}
              {custom.map(p => <CustomPageRow key={p.id} page={p} clubSlug={clubSlug} onDelete={deletePage} onChangeVis={changeCustomPageVis} pending={pending} />)}
            </TabBlock>
          )
        })()}

        {/* ── Custom tabs ── */}
        {tabs.map((tab, tabIdx) => (
          <CustomTabBlock
            key={tab.id} tab={tab} pages={pagesForTab(tab.id)} clubSlug={clubSlug}
            onDelete={deleteTab} onDeletePage={deletePage} onChangeVis={changeCustomPageVis}
            onAddPage={() => setNewPageOpen(true)} pending={pending}
            dragHandleEl={<HorizGrip />}
            dragOverStyle={tabDragOver === tabIdx ? { outline: '2px solid var(--action-primary)', outlineOffset: 2 } : {}}
            onDragStart={() => onTabDragStart(tabIdx)}
            onDragOver={e => onTabDragOver(e, tabIdx)}
            onDragEnd={onTabDragEnd}
            onDrop={() => onTabDrop(tabIdx)}
          />
        ))}
      </div>

      <NewPageDialogFull
        open={newPageOpen} tabs={tabs} pages={pages} clubId={clubId}
        onPageCreated={page => setPages(prev => [...prev, page])}
        onClose={() => setNewPageOpen(false)}
      />
      <NewTabDialog
        open={newTabOpen} tabs={tabs} clubId={clubId}
        onTabCreated={tab => setTabs(prev => [...prev, tab])}
        onClose={() => setNewTabOpen(false)}
      />
    </div>
  )
}

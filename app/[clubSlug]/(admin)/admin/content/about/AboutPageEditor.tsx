'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Menu,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import FormatBoldIcon         from '@mui/icons-material/FormatBold'
import FormatItalicIcon       from '@mui/icons-material/FormatItalic'
import FormatUnderlinedIcon   from '@mui/icons-material/FormatUnderlined'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import FormatClearIcon        from '@mui/icons-material/FormatClear'
import FormatColorTextIcon    from '@mui/icons-material/FormatColorText'
import LinkIcon               from '@mui/icons-material/Link'
import LinkOffIcon            from '@mui/icons-material/LinkOff'
import UndoIcon               from '@mui/icons-material/Undo'
import RedoIcon               from '@mui/icons-material/Redo'
import KeyboardArrowDownIcon  from '@mui/icons-material/KeyboardArrowDown'
import EditIcon               from '@mui/icons-material/Edit'
import LocationOnIcon         from '@mui/icons-material/LocationOn'
import EmailOutlinedIcon      from '@mui/icons-material/EmailOutlined'
import CalendarMonthIcon      from '@mui/icons-material/CalendarMonth'
import GroupsIcon             from '@mui/icons-material/Groups'
import PublicIcon             from '@mui/icons-material/Public'
import PaidOutlinedIcon       from '@mui/icons-material/PaidOutlined'
import { Popover }            from '@mui/material'
import { createClient }       from '@/lib/supabase/client'
import { saveAboutPanelFields, type AboutPanelFields } from './actions'
import PageEditorSheet        from '@/components/admin/PageEditorSheet'
import SocialAccountsModal    from '@/components/admin/SocialAccountsModal'
import { updatePanelShownSocials, addSocialAccount } from '@/lib/social-accounts/actions'
import { platformLabel, PLATFORM_LIST, type SocialAccount, type SocialPlatform } from '@/lib/social-accounts/types'

// ── Font stacks ───────────────────────────────────────────────────────────────
const EXEC_FONT_LORA   = 'Lora'
const EXEC_FONT_NUNITO = 'Nunito'
const CSS_FONT_LORA    = "var(--font-lora, 'Lora', Georgia, serif)"
const CSS_FONT_NUNITO  = "var(--font-lora, 'Lora', Georgia, serif)"

// ── Constants ─────────────────────────────────────────────────────────────────

const TEXT_STYLES = [
  { label: 'Normal text', tag: 'p',  sx: { fontSize: 13, fontFamily: CSS_FONT_NUNITO } },
  { label: 'Heading 1',   tag: 'h1', sx: { fontSize: 20, fontWeight: 700, fontFamily: CSS_FONT_LORA } },
  { label: 'Heading 2',   tag: 'h2', sx: { fontSize: 16, fontWeight: 600, fontFamily: CSS_FONT_LORA } },
  { label: 'Heading 3',   tag: 'h3', sx: { fontSize: 14, fontWeight: 600, fontFamily: CSS_FONT_LORA } },
]

const FONT_FAMILIES = [
  { label: 'Lora',      value: EXEC_FONT_LORA },
  { label: 'Nunito',    value: EXEC_FONT_NUNITO },
  { label: 'Monospace', value: 'Courier New' },
]

const COLOR_PALETTE = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#ffffff',
  '#d32f2f', '#e65100', '#f9a825', '#2e7d32', '#0277bd', '#1565c0', '#6a1b9a', '#ad1457',
]

const MENU_FOCUS_PROPS = {
  disableAutoFocus: true,
  disableEnforceFocus: true,
  disableRestoreFocus: true,
} as const

const btnSx = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '4px', border: 'none', bgcolor: 'transparent', cursor: 'pointer',
  color: 'text.secondary', flexShrink: 0,
  '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
} as const

// ── Public site token sets ────────────────────────────────────────────────────

const SITE_LIGHT = {
  bg:              '#F5F5F5',
  textPrimary:     '#1A1A1A',
  textSecondary:   '#696969',
  actionPrimary:   '#1A6FC4',
  actionSecondary: '#5A7A96',
  borderDefault:   'rgba(0,0,0,0.14)',
  surface1:        '#ECECEC',
}
const SITE_DARK = {
  bg:              '#141414',
  textPrimary:     '#E8E8E8',
  textSecondary:   '#9E9E9E',
  actionPrimary:   '#4A90D4',
  actionSecondary: '#6EA8D8',
  borderDefault:   'rgba(255,255,255,0.12)',
  surface1:        '#1E1E1E',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ToolbarBtn({
  title, onMouseDown, active, disabled, children,
}: {
  title: string; onMouseDown: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode
}) {
  return (
    <Tooltip title={title} placement="top">
      <Box component="button" disabled={disabled} onMouseDown={e => { e.preventDefault(); onMouseDown() }}
        sx={{
          ...btnSx, width: 28, height: 28,
          ...(active   ? { bgcolor: 'action.selected', color: 'text.primary' } : {}),
          ...(disabled ? { opacity: 0.38, cursor: 'default', pointerEvents: 'none' } : {}),
        }}>
        {children}
      </Box>
    </Tooltip>
  )
}

function DropdownBtn({ label, title, onMouseDown }: {
  label: string; title: string
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <Tooltip title={title} placement="top">
      <Box component="button" onMouseDown={onMouseDown} sx={{ ...btnSx, gap: 0.25, height: 28, px: 1 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'inherit', lineHeight: 1 }}>{label}</Typography>
        <KeyboardArrowDownIcon sx={{ fontSize: 14 }} />
      </Box>
    </Tooltip>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ClubInfo = {
  club_name:              string
  club_location:          string | null
  contact_email:          string | null
  website_url:            string | null
  annual_dues:            string | null
  join_fee:               string | null
  meeting_schedule:       string | null
  meeting_notes:          string | null
  founded_year:           number | null
  member_count_actual:    number | null
  join_open:              boolean
  panel_show_founded_year: boolean
  panel_show_member_count: boolean
  panel_show_schedule:     boolean
  panel_show_location:     boolean
  panel_show_instagram:    boolean
  panel_show_facebook:     boolean
  panel_show_join_button:  boolean
  panel_show_contact:      boolean
  panel_shown_social_ids:  string[]
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AboutPageEditor({
  pageId,
  initialContent,
  clubInfo,
  socialAccounts: initialSocialAccounts,
  clubSlug,
}: {
  pageId:          string | null
  initialContent:  string
  clubInfo:        ClubInfo | null
  socialAccounts:  SocialAccount[]
  clubSlug:        string
}) {
  const router = useRouter()

  const editorRef     = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)

  const [, startSave]  = useTransition()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isDirty, setIsDirty] = useState(false)
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>(initialSocialAccounts)
  const [socialModalOpen, setSocialModalOpen] = useState(false)
  const [panelShownIds, setPanelShownIds] = useState<string[]>(clubInfo?.panel_shown_social_ids ?? [])

  const [panelInfo, setPanelInfo] = useState<ClubInfo>(clubInfo ?? {
    club_name: '', club_location: null, contact_email: null,
    website_url: null,
    annual_dues: null, join_fee: null, meeting_schedule: null,
    meeting_notes: null, founded_year: null, member_count_actual: null,
    join_open: true,
    panel_show_founded_year: false, panel_show_member_count: false,
    panel_show_schedule: false, panel_show_location: false,
    panel_show_instagram: false, panel_show_facebook: false,
    panel_show_join_button: true, panel_show_contact: true,
    panel_shown_social_ids: [],
  })
  const [panelEditOpen, setPanelEditOpen] = useState(false)
  const [panelForm, setPanelForm] = useState<AboutPanelFields>({})
  const [panelSaving, setPanelSaving] = useState(false)
  const [panelSaveError, setPanelSaveError] = useState<string | null>(null)
  const [addSocialPlatform, setAddSocialPlatform] = useState<SocialPlatform>('instagram')
  const [addSocialUrl, setAddSocialUrl]           = useState('')
  const [addSocialLabel, setAddSocialLabel]       = useState('')
  const [addSocialSaving, setAddSocialSaving]     = useState(false)
  const [addSocialError, setAddSocialError]       = useState<string | null>(null)
  const [showSocialAddForm, setShowSocialAddForm] = useState(false)

  const handleAddSocialInPanel = async () => {
    if (!addSocialUrl.trim()) return
    setAddSocialSaving(true); setAddSocialError(null)
    const result = await addSocialAccount(
      addSocialPlatform, addSocialUrl.trim(),
      addSocialPlatform === 'custom' ? (addSocialLabel.trim() || null) : null,
    )
    setAddSocialSaving(false)
    if (result.error) { setAddSocialError(result.error); return }
    if (result.account) {
      setSocialAccounts(prev => [...prev, result.account!])
      setPanelShownIds(prev => [...prev, result.account!.id])
    }
    setAddSocialUrl(''); setAddSocialLabel(''); setAddSocialPlatform('instagram'); setShowSocialAddForm(false)
  }

  const [styleAnchor, setStyleAnchor] = useState<HTMLElement | null>(null)
  const [fontAnchor,  setFontAnchor]  = useState<HTMLElement | null>(null)
  const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null)
  const [activeColor, setActiveColor] = useState('#000000')
  const [activeStyle, setActiveStyle] = useState('Normal text')
  const [activeFont,  setActiveFont]  = useState('Nunito')

  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl,   setLinkUrl]   = useState('')
  const [linkText,  setLinkText]  = useState('')

  // ── Initial content ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialContent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Selection tracking ───────────────────────────────────────────────────────
  useEffect(() => {
    const onSelectionChange = () => {
      const editor = editorRef.current
      if (!editor) return
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0)
        if (editor.contains(range.commonAncestorContainer))
          savedRangeRef.current = range.cloneRange()
      }
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [])

  // ── Selection restore ────────────────────────────────────────────────────────
  const restoreSelection = () => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    const sel = window.getSelection()
    if (!sel) return
    if (savedRangeRef.current && editor.contains(savedRangeRef.current.commonAncestorContainer)) {
      sel.removeAllRanges()
      sel.addRange(savedRangeRef.current)
    } else {
      const range = document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false)
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }

  // ── Exec wrappers ────────────────────────────────────────────────────────────
  const exec = (cmd: string, value?: string) => {
    restoreSelection()
    document.execCommand(cmd, false, value ?? undefined)
    editorRef.current?.focus()
  }

  const clearFormatting = () => {
    restoreSelection()
    document.execCommand('removeFormat')
    document.execCommand('formatBlock', false, 'p')
    setActiveStyle('Normal text')
    editorRef.current?.focus()
  }

  const applyStyle = (tag: string, label: string) => {
    setActiveStyle(label); setStyleAnchor(null)
    setTimeout(() => { restoreSelection(); document.execCommand('formatBlock', false, tag); editorRef.current?.focus() }, 0)
  }

  const applyFont = (value: string, label: string) => {
    setActiveFont(label); setFontAnchor(null)
    setTimeout(() => { restoreSelection(); document.execCommand('fontName', false, value); editorRef.current?.focus() }, 0)
  }

  const applyColor = (color: string) => {
    setActiveColor(color); setColorAnchor(null)
    setTimeout(() => { restoreSelection(); document.execCommand('foreColor', false, color); editorRef.current?.focus() }, 0)
  }

  // ── Link dialog ──────────────────────────────────────────────────────────────
  const openLinkDialog = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      if (!range.collapsed) setLinkText(range.toString())
    }
    setLinkUrl('https://')
    setLinkDialogOpen(true)
  }

  const confirmInsertLink = () => {
    if (!linkUrl.trim()) return
    restoreSelection()
    const display = linkText.trim() || linkUrl
    const a = document.createElement('a')
    a.href = linkUrl
    a.textContent = display
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      range.deleteContents()
      range.insertNode(a)
      range.setStartAfter(a)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
    }
    setLinkDialogOpen(false)
    setLinkUrl('')
    setLinkText('')
    editorRef.current?.focus()
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const html = editorRef.current?.innerHTML ?? ''
    setSaveStatus('saving')
    startSave(async () => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sbAny = supabase as any
      const res = pageId
        ? await sbAny.from('pages').update({ content: html, updated_at: new Date().toISOString() }).eq('id', pageId)
        : await sbAny.from('pages').insert({ slug: 'about', title: 'About our club', content: html })
      setSaveStatus(res.error ? 'error' : 'saved')
      if (!res.error) setIsDirty(false)
      setTimeout(() => setSaveStatus('idle'), 2500)
    })
  }

  // ── Panel edit ───────────────────────────────────────────────────────────────
  const openPanelEdit = () => {
    setPanelForm({
      club_location:           panelInfo.club_location,
      contact_email:           panelInfo.contact_email,
      annual_dues:             panelInfo.annual_dues,
      join_fee:                panelInfo.join_fee,
      meeting_schedule:        panelInfo.meeting_schedule,
      meeting_notes:           panelInfo.meeting_notes,
      founded_year:            panelInfo.founded_year,
      website_url:             panelInfo.website_url,
      join_open:               panelInfo.join_open,
      panel_show_founded_year: panelInfo.panel_show_founded_year,
      panel_show_member_count: panelInfo.panel_show_member_count,
      panel_show_schedule:     panelInfo.panel_show_schedule,
      panel_show_location:     panelInfo.panel_show_location,
      panel_show_instagram:    panelInfo.panel_show_instagram,
      panel_show_facebook:     panelInfo.panel_show_facebook,
      panel_show_join_button:  panelInfo.panel_show_join_button,
      panel_show_contact:      panelInfo.panel_show_contact,
    })
    setPanelSaveError(null)
    setPanelEditOpen(true)
  }

  const handlePanelSave = async () => {
    setPanelSaving(true)
    setPanelSaveError(null)
    const result = await saveAboutPanelFields(panelForm)
    setPanelSaving(false)
    if (result.error) { setPanelSaveError(result.error); return }
    setPanelInfo(prev => ({
      ...prev,
      club_location:           panelForm.club_location           ?? prev.club_location,
      contact_email:           panelForm.contact_email           ?? prev.contact_email,
      annual_dues:             panelForm.annual_dues             ?? prev.annual_dues,
      join_fee:                panelForm.join_fee                ?? prev.join_fee,
      meeting_schedule:        panelForm.meeting_schedule        ?? prev.meeting_schedule,
      meeting_notes:           panelForm.meeting_notes           ?? prev.meeting_notes,
      founded_year:            panelForm.founded_year            ?? prev.founded_year,
      website_url:             panelForm.website_url             ?? prev.website_url,
      join_open:               panelForm.join_open               ?? prev.join_open,
      panel_show_founded_year: panelForm.panel_show_founded_year ?? prev.panel_show_founded_year,
      panel_show_member_count: panelForm.panel_show_member_count ?? prev.panel_show_member_count,
      panel_show_schedule:     panelForm.panel_show_schedule     ?? prev.panel_show_schedule,
      panel_show_location:     panelForm.panel_show_location     ?? prev.panel_show_location,
      panel_show_instagram:    prev.panel_show_instagram,
      panel_show_facebook:     prev.panel_show_facebook,
      panel_show_join_button:  panelForm.panel_show_join_button  ?? prev.panel_show_join_button,
      panel_show_contact:      panelForm.panel_show_contact      ?? prev.panel_show_contact,
      panel_shown_social_ids:  panelShownIds,
    }))
    await updatePanelShownSocials(panelShownIds)
    setPanelEditOpen(false)
  }

  // ── Derived tokens ────────────────────────────────────────────────────────────
  const tok = SITE_LIGHT

  const previewInfo: ClubInfo = panelEditOpen
    ? { ...panelInfo, ...(panelForm as Partial<ClubInfo>) }
    : panelInfo

  const editorContentSx = {
    fontFamily: CSS_FONT_NUNITO, fontSize: 16, lineHeight: 1.8, color: tok.textPrimary,
    outline: 'none', cursor: 'text', minHeight: 400,
    '& h1': { fontFamily: CSS_FONT_LORA, fontSize: '1.7em',  fontWeight: 700, lineHeight: 1.25, mt: '1em', mb: '0.4em',  letterSpacing: '-0.02em', color: tok.textPrimary },
    '& h2': { fontFamily: CSS_FONT_LORA, fontSize: '1.3em',  fontWeight: 600, lineHeight: 1.3,  mt: '1em', mb: '0.35em', letterSpacing: '-0.01em', color: tok.textPrimary },
    '& h3': { fontFamily: CSS_FONT_LORA, fontSize: '1.05em', fontWeight: 600, lineHeight: 1.35, mt: '1em', mb: '0.3em',  color: tok.textPrimary },
    '& h4': { fontFamily: CSS_FONT_LORA, fontSize: '1em',    fontWeight: 600, mt: '1em',        mb: '0.3em', color: tok.textPrimary },
    '& p':       { fontFamily: CSS_FONT_NUNITO, margin: '0 0 0.8em', color: tok.textSecondary },
    '& strong':  { fontWeight: 700, color: tok.textPrimary },
    '& em':      { fontStyle: 'italic' },
    [`& font[face="${EXEC_FONT_LORA}"]`]:   { fontFamily: CSS_FONT_LORA },
    [`& font[face="${EXEC_FONT_NUNITO}"]`]: { fontFamily: CSS_FONT_NUNITO },
    '& ul': { fontFamily: CSS_FONT_NUNITO, listStyleType: 'disc',    paddingLeft: '1.75em', margin: '0.5em 0 0.8em', color: tok.textSecondary },
    '& ol': { fontFamily: CSS_FONT_NUNITO, listStyleType: 'decimal', paddingLeft: '1.75em', margin: '0.5em 0 0.8em', color: tok.textSecondary },
    '& li': { display: 'list-item', lineHeight: 1.8, mb: '0.15em' },
    '& a':  { color: tok.actionPrimary, textDecoration: 'underline', textUnderlineOffset: '2px' },
    '& blockquote': { borderLeft: `3px solid ${tok.borderDefault}`, paddingLeft: '20px', marginLeft: 0, color: tok.textSecondary, fontStyle: 'italic', margin: '16px 0' },
    '& table': { borderCollapse: 'collapse', width: '100%', margin: '16px 0', fontSize: 14 },
    '& td':  { padding: '8px 12px', minWidth: '80px', verticalAlign: 'top', color: tok.textSecondary },
    '& th':  { padding: '8px 12px', minWidth: '80px', verticalAlign: 'top', fontWeight: 600, color: tok.textPrimary },
    '& hr':  { border: 'none', borderTop: `1px solid ${tok.borderDefault}`, margin: '24px 0' },
    '& img': { cursor: 'pointer', borderRadius: '4px', maxWidth: '100%', height: 'auto', display: 'block', margin: '12px 0' },
    '&:empty::before': { content: 'attr(data-placeholder)', color: tok.textSecondary, opacity: 0.5, pointerEvents: 'none' },
  } as const

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <PageEditorSheet
      title="About our club"
      isDirty={isDirty}
      backHref={`/${clubSlug}/admin/content/navigation`}
      headerRight={
        <>
          {saveStatus === 'saved' && (
            <Typography sx={{ fontSize: 13, color: 'success.main' }}>Saved</Typography>
          )}
          {saveStatus === 'error' && (
            <Typography sx={{ fontSize: 13, color: 'error.main' }}>Save failed</Typography>
          )}
          <Button variant="outlined" color="secondary" size="small"
            onClick={() => router.push(`/${clubSlug}/admin/content/navigation`)}>
            Cancel
          </Button>
          <Button variant="contained" size="small"
            disabled={saveStatus === 'saving'} onClick={handleSave}>
            {saveStatus === 'saving' ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
      toolbar={
        <>
          <ToolbarBtn title="Undo (Ctrl+Z)" onMouseDown={() => exec('undo')}><UndoIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
          <ToolbarBtn title="Redo (Ctrl+Y)" onMouseDown={() => exec('redo')}><RedoIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

          <DropdownBtn label={activeStyle} title="Text style"
            onMouseDown={e => { e.preventDefault(); setStyleAnchor(e.currentTarget) }} />
          <Menu anchorEl={styleAnchor} open={!!styleAnchor} onClose={() => setStyleAnchor(null)} {...MENU_FOCUS_PROPS}>
            {TEXT_STYLES.map(s => (
              <MenuItem key={s.tag} onClick={() => applyStyle(s.tag, s.label)} sx={s.sx}>{s.label}</MenuItem>
            ))}
          </Menu>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

          <DropdownBtn label={activeFont} title="Font"
            onMouseDown={e => { e.preventDefault(); setFontAnchor(e.currentTarget) }} />
          <Menu anchorEl={fontAnchor} open={!!fontAnchor} onClose={() => setFontAnchor(null)} {...MENU_FOCUS_PROPS}>
            {FONT_FAMILIES.map(f => (
              <MenuItem key={f.value} onClick={() => applyFont(f.value, f.label)}
                sx={{ fontSize: 13, fontFamily: f.label === 'Lora' ? CSS_FONT_LORA : f.label === 'Nunito' ? CSS_FONT_NUNITO : f.value }}>
                {f.label}
              </MenuItem>
            ))}
          </Menu>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

          <ToolbarBtn title="Bold"      onMouseDown={() => exec('bold')}>      <FormatBoldIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
          <ToolbarBtn title="Italic"    onMouseDown={() => exec('italic')}>    <FormatItalicIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
          <ToolbarBtn title="Underline" onMouseDown={() => exec('underline')}> <FormatUnderlinedIcon sx={{ fontSize: 16 }} /></ToolbarBtn>

          <Tooltip title="Text colour" placement="top">
            <Box component="button" onMouseDown={e => { e.preventDefault(); setColorAnchor(e.currentTarget) }}
              sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '4px', border: 'none', bgcolor: 'transparent', cursor: 'pointer', color: 'text.secondary', gap: '2px', flexShrink: 0, '&:hover': { bgcolor: 'action.hover' } }}>
              <FormatColorTextIcon sx={{ fontSize: 15 }} />
              <Box sx={{ width: 14, height: 3, borderRadius: '1px', bgcolor: activeColor }} />
            </Box>
          </Tooltip>
          <Popover open={!!colorAnchor} anchorEl={colorAnchor} onClose={() => setColorAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} {...MENU_FOCUS_PROPS}>
            <Box sx={{ p: 1.5, display: 'grid', gridTemplateColumns: 'repeat(8, 20px)', gap: '6px' }}>
              {COLOR_PALETTE.map(color => (
                <Box key={color} component="button" onClick={() => applyColor(color)}
                  sx={{ width: 20, height: 20, borderRadius: '3px', bgcolor: color, border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer', p: 0, outline: activeColor === color ? '2px solid' : 'none', outlineColor: 'primary.main', outlineOffset: '1px', '&:hover': { transform: 'scale(1.15)' } }} />
              ))}
            </Box>
          </Popover>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

          <ToolbarBtn title="Bullet list"   onMouseDown={() => exec('insertUnorderedList')}><FormatListBulletedIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
          <ToolbarBtn title="Numbered list" onMouseDown={() => exec('insertOrderedList')}>  <FormatListNumberedIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

          <ToolbarBtn title="Insert link" onMouseDown={openLinkDialog}><LinkIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
          <ToolbarBtn title="Remove link" onMouseDown={() => exec('unlink')}><LinkOffIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

          <ToolbarBtn title="Clear formatting" onMouseDown={clearFormatting}><FormatClearIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
        </>
      }
    >

      {/* ── Live-preview editor body ───────────────────────────────────────── */}
      <Box sx={{ bgcolor: '#FFFFFF', minHeight: '100%' }}>
        <Box sx={{ maxWidth: 1140, mx: 'auto', py: 6, px: 4, display: 'flex', gap: 5, alignItems: 'flex-start' }}>

          {/* Left: main content editor */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ mb: 4, pointerEvents: 'none', userSelect: 'none' }}>
              <Box sx={{ fontFamily: CSS_FONT_LORA, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25, color: tok.textPrimary }}>
                About our club
              </Box>
              <Box sx={{ mt: 0.5, fontFamily: CSS_FONT_LORA, fontSize: 17, fontWeight: 500, color: tok.textSecondary }}>
                {panelInfo.club_name || 'Club name'}
              </Box>
              <Box sx={{ mt: 2, height: 1, bgcolor: tok.borderDefault }} />
            </Box>
            <Box
              ref={editorRef}
              component="div"
              contentEditable
              suppressContentEditableWarning
              onInput={() => setIsDirty(true)}
              data-placeholder="Start writing about your club…"
              sx={editorContentSx}
            />
          </Box>

          {/* Right: club details panel */}
          <Box sx={{ width: 272, flexShrink: 0 }}>
            <Box sx={{
              bgcolor: '#FFFFFF',
              border: `1px solid ${tok.borderDefault}`,
              borderRadius: '12px',
              p: 2.5,
              position: 'sticky',
              top: 24,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: tok.textSecondary }}>
                  Club Details
                </Typography>
                <Box component="button" onClick={openPanelEdit} sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 0.5,
                  fontSize: 12, color: tok.actionPrimary, border: 'none',
                  bgcolor: 'transparent', cursor: 'pointer', p: '2px 6px',
                  borderRadius: '4px', fontFamily: 'inherit',
                  '&:hover': { textDecoration: 'underline' },
                }}>
                  <EditIcon sx={{ fontSize: 13 }} /> Edit
                </Box>
              </Box>

              {(() => {
                const rows: { icon: React.ReactNode; text: string }[] = []
                if (previewInfo.panel_show_location && previewInfo.club_location)
                  rows.push({ icon: <LocationOnIcon sx={{ fontSize: 15 }} />, text: previewInfo.club_location })
                if (previewInfo.panel_show_schedule && previewInfo.meeting_schedule)
                  rows.push({ icon: <CalendarMonthIcon sx={{ fontSize: 15 }} />, text: previewInfo.meeting_schedule })
                const showFounded = previewInfo.panel_show_founded_year && previewInfo.founded_year
                const showMembers = previewInfo.panel_show_member_count && previewInfo.member_count_actual
                if (showFounded || showMembers) {
                  const parts: string[] = []
                  if (showFounded) parts.push(`Est. ${previewInfo.founded_year}`)
                  if (showMembers) parts.push(`${previewInfo.member_count_actual} members`)
                  rows.push({ icon: <GroupsIcon sx={{ fontSize: 15 }} />, text: parts.join(' · ') })
                }
                if (previewInfo.annual_dues || previewInfo.join_fee) {
                  const parts: string[] = []
                  if (previewInfo.annual_dues) parts.push(`Dues: ${previewInfo.annual_dues}`)
                  if (previewInfo.join_fee)    parts.push(`Join fee: ${previewInfo.join_fee}`)
                  rows.push({ icon: <PaidOutlinedIcon sx={{ fontSize: 15 }} />, text: parts.join(' · ') })
                }
                if (rows.length === 0) return (
                  <Typography sx={{ fontSize: 12, color: tok.textSecondary, fontStyle: 'italic', mb: 1.5 }}>
                    Club details coming soon
                  </Typography>
                )
                return rows.map((row, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.25, mb: 1.25, alignItems: 'flex-start' }}>
                    <Box sx={{ color: tok.textSecondary, mt: '1px', flexShrink: 0 }}>{row.icon}</Box>
                    <Typography sx={{ fontSize: 13, color: tok.textSecondary, lineHeight: 1.5 }}>{row.text}</Typography>
                  </Box>
                ))
              })()}

              {(previewInfo.website_url || panelShownIds.length > 0) && (
                <Box sx={{ display: 'flex', gap: 0.75, mt: 1.5, flexWrap: 'wrap' }}>
                  {previewInfo.website_url && (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 12, color: tok.actionPrimary }}>
                      <PublicIcon sx={{ fontSize: 14 }} /> Website
                    </Box>
                  )}
                  {socialAccounts.filter(a => panelShownIds.includes(a.id)).map(acct => (
                    <Box key={acct.id} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 12, color: tok.actionPrimary }}>
                      {platformLabel(acct.platform, acct.label)}
                    </Box>
                  ))}
                </Box>
              )}

              <Box sx={{ height: 1, bgcolor: tok.borderDefault, my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {previewInfo.panel_show_join_button && (
                  <Box sx={{
                    textAlign: 'center', px: 2, py: 1, borderRadius: '8px', fontSize: 13, fontWeight: 600,
                    bgcolor: previewInfo.join_open ? tok.actionPrimary : 'transparent',
                    border: previewInfo.join_open ? 'none' : `1px solid ${tok.borderDefault}`,
                    color: previewInfo.join_open ? '#fff' : tok.textSecondary,
                  }}>
                    {previewInfo.join_open ? 'Join us' : 'Applications closed'}
                  </Box>
                )}
                {previewInfo.panel_show_contact && (
                  <Box sx={{
                    textAlign: 'center', px: 2, py: 1, borderRadius: '8px', fontSize: 13,
                    border: `1.5px solid ${tok.actionSecondary}`, color: tok.actionSecondary,
                  }}>
                    Contact us for more info
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

        </Box>
      </Box>

      {/* ── Social accounts modal */}
      <SocialAccountsModal
        open={socialModalOpen}
        onClose={() => setSocialModalOpen(false)}
        mode="pick"
        accounts={socialAccounts}
        clubSlug={clubSlug}
        selectedIds={panelShownIds}
        onSelectionSave={ids => { setPanelShownIds(ids); setSocialModalOpen(false) }}
        onAccountsChange={setSocialAccounts}
      />

      {/* ── Link dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>Insert link</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="URL" size="small" fullWidth value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)} placeholder="https://example.com" />
            <TextField label="Display text" size="small" fullWidth value={linkText}
              onChange={e => setLinkText(e.target.value)} placeholder="Leave blank to use URL" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" color="secondary" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={confirmInsertLink}
            disabled={!linkUrl.trim() || linkUrl === 'https://'}>
            Insert link
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Panel edit dialog ─────────────────────────────────────────────────── */}
      <Dialog open={panelEditOpen} onClose={() => setPanelEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>Side panel settings</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mt: 1.5, mb: 0.5 }}>
              Buttons
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Checkbox size="small" checked={panelForm.panel_show_join_button ?? true}
                onChange={e => setPanelForm(p => ({ ...p, panel_show_join_button: e.target.checked }))} sx={{ p: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13 }}>Show "Join us" button</Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Visible to non-members only</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Checkbox size="small" checked={panelForm.panel_show_contact ?? true}
                onChange={e => setPanelForm(p => ({ ...p, panel_show_contact: e.target.checked }))} sx={{ p: 0 }} />
              <Typography sx={{ fontSize: 13, flex: 1 }}>Show "Contact us" button</Typography>
              <TextField size="small" placeholder="contact@yourclub.org" sx={{ width: 220 }}
                value={(panelForm.contact_email as string | null) ?? ''}
                onChange={e => setPanelForm(p => ({ ...p, contact_email: e.target.value || null }))} />
            </Box>

            <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mt: 2, mb: 0.5 }}>
              Details
            </Typography>
            {[
              { label: 'Founded year', key: 'panel_show_founded_year' as const, field: 'founded_year' as const, type: 'number', placeholder: 'e.g. 1985', width: 130 },
            ].map(({ label, key, field, type, placeholder, width }) => (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Checkbox size="small" checked={(panelForm[key] as boolean) ?? true}
                  onChange={e => setPanelForm(p => ({ ...p, [key]: e.target.checked }))} sx={{ p: 0 }} />
                <Typography sx={{ fontSize: 13, flex: 1 }}>{label}</Typography>
                <TextField size="small" type={type} placeholder={placeholder} sx={{ width }}
                  value={(panelForm[field] as string | number | null) ?? ''}
                  onChange={e => setPanelForm(p => ({
                    ...p,
                    [field]: type === 'number' ? (e.target.value ? parseInt(e.target.value) : null) : (e.target.value || null),
                  } as AboutPanelFields))} />
              </Box>
            ))}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Checkbox size="small" checked={panelForm.panel_show_member_count ?? true}
                onChange={e => setPanelForm(p => ({ ...p, panel_show_member_count: e.target.checked }))} sx={{ p: 0, mt: 0.25 }} />
              <Box>
                <Typography sx={{ fontSize: 13 }}>Member count</Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Shows current active members automatically</Typography>
              </Box>
            </Box>
            {[
              { label: 'Meeting schedule', key: 'panel_show_schedule' as const, field: 'meeting_schedule' as const, placeholder: 'e.g. 1st Tuesday, 7 pm' },
              { label: 'Location',         key: 'panel_show_location' as const, field: 'club_location'    as const, placeholder: 'City, State' },
  ].map(({ label, key, field, placeholder }, idx) => (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Checkbox size="small" checked={(panelForm[key] as boolean) ?? true}
                  onChange={e => setPanelForm(p => ({ ...p, [key]: e.target.checked }))} sx={{ p: 0 }} />
                <Typography sx={{ fontSize: 13, flex: 1 }}>{label}</Typography>
                <TextField size="small" placeholder={placeholder} sx={{ width: 200 }}
                  value={(panelForm[field] as string | null) ?? ''}
                  onChange={e => setPanelForm(p => ({ ...p, [field]: e.target.value || null }))} />
              </Box>
            ))}
            <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mt: 2, mb: 0.75 }}>
              Social accounts
            </Typography>
            {socialAccounts.map(acct => (
              <Box key={acct.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Checkbox size="small" checked={panelShownIds.includes(acct.id)}
                  onChange={e => setPanelShownIds(prev => e.target.checked ? [...prev, acct.id] : prev.filter(id => id !== acct.id))}
                  sx={{ p: 0 }} />
                <Typography sx={{ fontSize: 13, flex: 1 }}>{platformLabel(acct.platform, acct.label)}</Typography>
              </Box>
            ))}
            {showSocialAddForm ? (
              <Box sx={{ p: 1.5, mt: 1, background: '#F7F8FA', borderRadius: '6px', border: '1px solid #D8DDE7', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl size="small" sx={{ flex: '0 0 140px' }}>
                    <Select value={addSocialPlatform} onChange={e => setAddSocialPlatform(e.target.value as SocialPlatform)}
                      sx={{ fontSize: 13, background: '#fff' }}>
                      {PLATFORM_LIST.map(p => <MenuItem key={p.value} value={p.value} sx={{ fontSize: 13 }}>{p.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField size="small" value={addSocialUrl} onChange={e => setAddSocialUrl(e.target.value)}
                    placeholder="https://…" sx={{ flex: 1, '& .MuiInputBase-root': { background: '#fff', fontSize: 13 } }} />
                </Box>
                {addSocialPlatform === 'custom' && (
                  <TextField size="small" value={addSocialLabel} onChange={e => setAddSocialLabel(e.target.value)}
                    placeholder="Display name" fullWidth sx={{ '& .MuiInputBase-root': { background: '#fff', fontSize: 13 } }} />
                )}
                {addSocialError && <Typography sx={{ fontSize: 12, color: 'error.main' }}>{addSocialError}</Typography>}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="contained" onClick={handleAddSocialInPanel} disabled={addSocialSaving || !addSocialUrl.trim()}
                    sx={{ textTransform: 'none', fontSize: 12 }}>
                    {addSocialSaving ? 'Adding…' : 'Add account'}
                  </Button>
                  <Button size="small" variant="outlined" color="secondary" onClick={() => setShowSocialAddForm(false)}
                    sx={{ textTransform: 'none', fontSize: 12 }}>Cancel</Button>
                </Box>
              </Box>
            ) : (
              <Button size="small" variant="outlined" color="secondary" sx={{ mt: 1 }}
                onClick={() => setShowSocialAddForm(true)}>
                + Add social account
              </Button>
            )}
            {panelSaveError && (
              <Typography sx={{ fontSize: 13, color: 'error.main', mt: 1.5 }}>{panelSaveError}</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" color="secondary" onClick={() => setPanelEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePanelSave} disabled={panelSaving}>
            {panelSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

    </PageEditorSheet>
  )
}

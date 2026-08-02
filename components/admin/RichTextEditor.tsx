'use client'

/**
 * RichTextEditor — shared inline rich-text editor (toolbar + contentEditable).
 * Extracted from AboutPageEditor / CustomPageEditor.
 *
 * Props:
 *   initialContent  — HTML string written into the editable on mount
 *   onChange        — fired on every keystroke / format action; receives current innerHTML
 *   minHeight       — minimum editing area height in px (default 240)
 *   placeholder     — placeholder text when empty
 */

import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Divider,
  FormControlLabel,
  InputAdornment,
  List, ListItemButton, ListItemText,
  Menu, MenuItem,
  Popover,
  TextField,
  ToggleButton, ToggleButtonGroup,
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
import FormatQuoteIcon        from '@mui/icons-material/FormatQuote'
import HorizontalRuleIcon     from '@mui/icons-material/HorizontalRule'
import TableChartIcon         from '@mui/icons-material/TableChart'
import InsertPhotoIcon        from '@mui/icons-material/InsertPhoto'
import LinkIcon               from '@mui/icons-material/Link'
import MoreHorizIcon          from '@mui/icons-material/MoreHoriz'
import KeyboardArrowDownIcon  from '@mui/icons-material/KeyboardArrowDown'
import UndoIcon               from '@mui/icons-material/Undo'
import RedoIcon               from '@mui/icons-material/Redo'
import SearchIcon             from '@mui/icons-material/Search'
import InsertDriveFileIcon    from '@mui/icons-material/InsertDriveFile'
import { createClient }       from '@/lib/supabase/client'

// ── Font / colour constants ────────────────────────────────────────────────────

const EXEC_FONT_LORA   = 'Lora'
const EXEC_FONT_NUNITO = 'Nunito'
const CSS_FONT_LORA    = "var(--font-lora, 'Lora', Georgia, serif)"
const CSS_FONT_NUNITO  = "var(--font-nunito, 'Nunito', system-ui, sans-serif)"

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
  '#000000','#434343','#666666','#999999','#b7b7b7','#cccccc','#d9d9d9','#ffffff',
  '#d32f2f','#e65100','#f9a825','#2e7d32','#0277bd','#1565c0','#6a1b9a','#ad1457',
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

// ── Document type (for link picker) ───────────────────────────────────────────
type Doc = { id: string; title: string; category: string | null }

// ── Sub-components ─────────────────────────────────────────────────────────────

function ToolbarBtn({ title, onMouseDown, active, disabled, children }: {
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
  label: string; title: string; onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void
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

// ── Main component ─────────────────────────────────────────────────────────────

export default function RichTextEditor({
  initialContent = '',
  onChange,
  minHeight = 240,
  placeholder = 'Start typing…',
}: {
  initialContent?: string
  onChange?:       (html: string) => void
  minHeight?:      number
  placeholder?:    string
}) {
  const editorRef     = useRef<HTMLDivElement>(null)
  const imageRef      = useRef<HTMLInputElement>(null)
  const savedRangeRef = useRef<Range | null>(null)

  // Toolbar state
  const [styleAnchor, setStyleAnchor] = useState<HTMLElement | null>(null)
  const [fontAnchor,  setFontAnchor]  = useState<HTMLElement | null>(null)
  const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null)
  const [moreAnchor,  setMoreAnchor]  = useState<HTMLElement | null>(null)
  const [activeColor, setActiveColor] = useState('#000000')
  const [activeStyle, setActiveStyle] = useState('Normal text')
  const [activeFont,  setActiveFont]  = useState('Nunito')

  // Image popover
  const [imgAnchor, setImgAnchor] = useState<HTMLImageElement | null>(null)

  // Table dialog
  const [tableDialogOpen, setTableDialogOpen] = useState(false)
  const [tableRows,    setTableRows]    = useState('3')
  const [tableCols,    setTableCols]    = useState('3')
  const [tableBorders, setTableBorders] = useState(true)

  // Inline table toolbar
  const [activeTable,        setActiveTable]        = useState<HTMLTableElement | null>(null)
  const [tableToolbarAnchor, setTableToolbarAnchor] = useState<HTMLTableElement | null>(null)

  // Link dialog
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkMode,    setLinkMode]    = useState<'url' | 'doc'>('url')
  const [linkUrl,     setLinkUrl]     = useState('')
  const [linkText,    setLinkText]    = useState('')
  const [docSearch,   setDocSearch]   = useState('')
  const [docs,        setDocs]        = useState<Doc[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null)

  // ── Seed initial content on mount ─────────────────────────────────────────
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialContent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Selection tracking ────────────────────────────────────────────────────
  useEffect(() => {
    const onSelectionChange = () => {
      const editor = editorRef.current
      if (!editor) return
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0)
        if (editor.contains(range.commonAncestorContainer)) {
          savedRangeRef.current = range.cloneRange()
        }
      }
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [])

  // ── Selection restore ─────────────────────────────────────────────────────
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

  // ── DOM insert helper ─────────────────────────────────────────────────────
  const domInsert = (buildNode: () => Node) => {
    const editor = editorRef.current
    if (!editor) return
    restoreSelection()
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    range.deleteContents()
    let anchor: Node = range.startContainer
    if (anchor !== editor) {
      while (anchor.parentNode && anchor.parentNode !== editor) anchor = anchor.parentNode
    }
    const node = buildNode()
    const p    = document.createElement('p')
    p.appendChild(document.createTextNode(' '))
    if (anchor === editor) { range.insertNode(p); range.insertNode(node) }
    else { (anchor as Element).after(p); (anchor as Element).after(node) }
    const newRange = document.createRange()
    newRange.setStart(p.firstChild!, 0)
    newRange.collapse(true)
    sel.removeAllRanges()
    sel.addRange(newRange)
    editor.focus()
  }

  // ── Exec wrappers ─────────────────────────────────────────────────────────
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

  const insertBlockquote = () => {
    setMoreAnchor(null)
    setTimeout(() => {
      restoreSelection()
      const sel = window.getSelection()
      const node = sel?.anchorNode
      const inBq = !!(node instanceof Element ? node : node?.parentElement)?.closest('blockquote')
      document.execCommand('formatBlock', false, inBq ? 'p' : 'blockquote')
      editorRef.current?.focus()
    }, 0)
  }

  const insertHR = () => {
    setMoreAnchor(null)
    setTimeout(() => { domInsert(() => document.createElement('hr')) }, 0)
  }

  // ── Link dialog ───────────────────────────────────────────────────────────
  const openLinkDialog = () => {
    const sel = window.getSelection()
    setLinkText(sel?.toString() ?? '')
    setLinkUrl('https://')
    setLinkMode('url')
    setDocSearch(''); setSelectedDoc(null)
    setLinkDialogOpen(true)
  }

  const handleLinkModeChange = async (mode: 'url' | 'doc') => {
    setLinkMode(mode)
    if (mode === 'doc' && docs.length === 0) {
      setDocsLoading(true)
      try {
        const supabase = createClient()
        const { data } = await supabase.from('documents')
          .select('id, title, document_categories(name)')
          .is('deleted_at', null).eq('visibility', 'members').order('title')
        if (data) {
          setDocs(data.map((d: { id: string; title: string; document_categories: { name: string } | null }) => ({
            id: d.id, title: d.title, category: d.document_categories?.name ?? null,
          })))
        }
      } finally { setDocsLoading(false) }
    }
  }

  const confirmInsertLink = () => {
    setLinkDialogOpen(false)
    setTimeout(() => {
      restoreSelection()
      let href = '', display = linkText.trim()
      if (linkMode === 'url') {
        href = linkUrl.trim()
        if (!href || href === 'https://') return
        if (!display) display = href
      } else {
        if (!selectedDoc) return
        href = `/our-club/documents/${selectedDoc.id}/download`
        if (!display) display = selectedDoc.title
      }
      document.execCommand('insertHTML', false,
        `<a href="${href}" ${linkMode === 'url' ? 'target="_blank" rel="noopener noreferrer"' : ''}>${display}</a>`)
      editorRef.current?.focus()
    }, 0)
  }

  const filteredDocs = docs.filter(d =>
    d.title.toLowerCase().includes(docSearch.toLowerCase()) ||
    (d.category ?? '').toLowerCase().includes(docSearch.toLowerCase())
  )

  // ── Table ─────────────────────────────────────────────────────────────────
  const buildTableEl = (rows: number, cols: number, borders: boolean) => {
    const table = document.createElement('table')
    table.style.cssText = 'border-collapse:collapse;width:100%;margin:12px 0'
    table.dataset.borders = borders ? 'on' : 'off'
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement('tr')
      for (let c = 0; c < cols; c++) {
        const td = r === 0 ? document.createElement('th') : document.createElement('td')
        td.style.cssText = `padding:8px 12px;min-width:80px;${borders ? 'border:1px solid rgba(0,0,0,0.14);' : ''}`
        if (r === 0) td.style.backgroundColor = 'rgba(0,0,0,0.04)'
        td.appendChild(document.createTextNode(' '))
        tr.appendChild(td)
      }
      table.appendChild(tr)
    }
    return table
  }

  const confirmInsertTable = () => {
    setTableDialogOpen(false)
    const rows = Math.max(1, Math.min(20, parseInt(tableRows) || 3))
    const cols = Math.max(1, Math.min(10, parseInt(tableCols) || 3))
    setTimeout(() => domInsert(() => buildTableEl(rows, cols, tableBorders)), 0)
  }

  const addTableRow = () => {
    if (!activeTable) return
    const lastRow = activeTable.rows[activeTable.rows.length - 1]
    const newRow  = document.createElement('tr')
    Array.from(lastRow.cells).forEach(() => {
      const td = document.createElement('td')
      td.style.cssText = lastRow.cells[0].style.cssText.replace(/background[^;]+;?/, '')
      td.appendChild(document.createTextNode(' '))
      newRow.appendChild(td)
    })
    activeTable.appendChild(newRow)
  }

  const addTableCol = () => {
    if (!activeTable) return
    Array.from(activeTable.rows).forEach((row, r) => {
      const td = r === 0 ? document.createElement('th') : document.createElement('td')
      td.style.cssText = row.cells[0].style.cssText
      if (r === 0) td.style.backgroundColor = 'rgba(0,0,0,0.04)'
      td.appendChild(document.createTextNode(' '))
      row.appendChild(td)
    })
  }

  const toggleTableBorders = () => {
    if (!activeTable) return
    const on = activeTable.dataset.borders !== 'on'
    activeTable.dataset.borders = on ? 'on' : 'off'
    Array.from(activeTable.querySelectorAll('td, th')).forEach(cell => {
      (cell as HTMLElement).style.border = on ? '1px solid rgba(0,0,0,0.14)' : ''
    })
  }

  // ── Image ─────────────────────────────────────────────────────────────────
  const handleInsertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    restoreSelection()
    document.execCommand('insertHTML', false,
      `<img src="${url}" style="width:60%;max-width:100%;height:auto;display:block;margin:12px 0" alt="${file.name}" />`)
    editorRef.current?.focus()
    e.target.value = ''
  }

  const applyImageWidth = (pct: number) => {
    if (imgAnchor) imgAnchor.style.width = `${pct}%`
    setImgAnchor(null)
    editorRef.current?.focus()
  }

  const applyImageAlign = (align: 'left' | 'center' | 'right') => {
    if (!imgAnchor) return
    const img = imgAnchor
    if (align === 'left') {
      img.style.float = 'left'; img.style.display = 'inline'
      img.style.margin = '4px 16px 8px 0'
    } else if (align === 'right') {
      img.style.float = 'right'; img.style.display = 'inline'
      img.style.margin = '4px 0 8px 16px'
    } else {
      img.style.float = ''; img.style.display = 'block'
      img.style.margin = '12px 0'
    }
    setImgAnchor(null)
    editorRef.current?.focus()
    if (onChange && editorRef.current) onChange(editorRef.current.innerHTML)
  }

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'IMG') {
      setImgAnchor(target as HTMLImageElement)
      setActiveTable(null); setTableToolbarAnchor(null)
      return
    }
    const cell = target.closest('td, th')
    if (cell) {
      const table = cell.closest('table') as HTMLTableElement
      setActiveTable(table); setTableToolbarAnchor(table)
      setImgAnchor(null)
      return
    }
    setImgAnchor(null); setActiveTable(null); setTableToolbarAnchor(null)
  }

  // ── onChange bridge ───────────────────────────────────────────────────────
  const handleInput = () => {
    if (onChange && editorRef.current) onChange(editorRef.current.innerHTML)
  }

  // ── Editor content styles ─────────────────────────────────────────────────
  const editorContentSx = {
    fontFamily: CSS_FONT_NUNITO,
    fontSize:   15,
    lineHeight: 1.7,
    color:      'text.primary',
    outline:    'none',
    cursor:     'text',
    minHeight,
    '& h1': { fontFamily: CSS_FONT_LORA, fontSize: '1.6em',  fontWeight: 700, lineHeight: 1.25, mt: '1em', mb: '0.4em',  letterSpacing: '-0.02em' },
    '& h2': { fontFamily: CSS_FONT_LORA, fontSize: '1.25em', fontWeight: 600, lineHeight: 1.3,  mt: '1em', mb: '0.35em', letterSpacing: '-0.01em' },
    '& h3': { fontFamily: CSS_FONT_LORA, fontSize: '1.05em', fontWeight: 600, lineHeight: 1.35, mt: '1em', mb: '0.3em' },
    '& p':        { margin: '0 0 0.75em' },
    '& strong':   { fontWeight: 700 },
    '& em':       { fontStyle: 'italic' },
    [`& font[face="${EXEC_FONT_LORA}"]`]:   { fontFamily: CSS_FONT_LORA },
    [`& font[face="${EXEC_FONT_NUNITO}"]`]: { fontFamily: CSS_FONT_NUNITO },
    '& ul': { listStyleType: 'disc',    paddingLeft: '1.75em', margin: '0.5em 0 0.75em' },
    '& ol': { listStyleType: 'decimal', paddingLeft: '1.75em', margin: '0.5em 0 0.75em' },
    '& li': { display: 'list-item', lineHeight: 1.7, mb: '0.1em' },
    '& a':  { color: 'primary.main', textDecoration: 'underline', textUnderlineOffset: '2px' },
    '& blockquote': { borderLeft: '3px solid', borderColor: 'divider', paddingLeft: '20px', marginLeft: 0, fontStyle: 'italic', margin: '16px 0', color: 'text.secondary' },
    '& table': { borderCollapse: 'collapse', width: '100%', margin: '16px 0', fontSize: 14 },
    '& td, & th': { padding: '8px 12px', minWidth: '80px', verticalAlign: 'top' },
    '& th': { fontWeight: 600 },
    '& hr': { border: 'none', borderTop: '1px solid', borderColor: 'divider', margin: '20px 0' },
    '& img': { cursor: 'pointer', borderRadius: '4px', maxWidth: '100%', height: 'auto', display: 'block', margin: '12px 0' },
    '&:empty::before': {
      content: 'attr(data-placeholder)',
      color: 'text.disabled',
      pointerEvents: 'none',
    },
  } as const

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '6px', overflow: 'hidden' }}>

      {/* Toolbar */}
      <Box sx={{
        px: 1, py: 0.625,
        display: 'flex', alignItems: 'center', gap: 0.25, flexWrap: 'wrap',
        borderBottom: '1px solid', borderColor: 'divider',
        bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      }}>
        {/* Undo / Redo */}
        <ToolbarBtn title="Undo" onMouseDown={() => exec('undo')}><UndoIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
        <ToolbarBtn title="Redo" onMouseDown={() => exec('redo')}><RedoIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

        {/* Text style */}
        <DropdownBtn label={activeStyle} title="Text style" onMouseDown={e => { e.preventDefault(); setStyleAnchor(e.currentTarget) }} />
        <Menu anchorEl={styleAnchor} open={!!styleAnchor} onClose={() => setStyleAnchor(null)} {...MENU_FOCUS_PROPS}>
          {TEXT_STYLES.map(s => <MenuItem key={s.tag} onClick={() => applyStyle(s.tag, s.label)} sx={s.sx}>{s.label}</MenuItem>)}
        </Menu>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

        {/* Font */}
        <DropdownBtn label={activeFont} title="Font" onMouseDown={e => { e.preventDefault(); setFontAnchor(e.currentTarget) }} />
        <Menu anchorEl={fontAnchor} open={!!fontAnchor} onClose={() => setFontAnchor(null)} {...MENU_FOCUS_PROPS}>
          {FONT_FAMILIES.map(f => (
            <MenuItem key={f.value} onClick={() => applyFont(f.value, f.label)}
              sx={{ fontSize: 13, fontFamily: f.label === 'Lora' ? CSS_FONT_LORA : f.label === 'Nunito' ? CSS_FONT_NUNITO : f.value }}>
              {f.label}
            </MenuItem>
          ))}
        </Menu>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

        {/* B I U */}
        <ToolbarBtn title="Bold"      onMouseDown={() => exec('bold')}><FormatBoldIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
        <ToolbarBtn title="Italic"    onMouseDown={() => exec('italic')}><FormatItalicIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
        <ToolbarBtn title="Underline" onMouseDown={() => exec('underline')}><FormatUnderlinedIcon sx={{ fontSize: 16 }} /></ToolbarBtn>

        {/* Colour */}
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
                sx={{ width: 20, height: 20, borderRadius: '3px', bgcolor: color, border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer', p: 0,
                  outline: activeColor === color ? '2px solid' : 'none', outlineColor: 'primary.main', outlineOffset: '1px',
                  '&:hover': { transform: 'scale(1.15)' } }} />
            ))}
          </Box>
        </Popover>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

        {/* Lists */}
        <ToolbarBtn title="Bullet list"   onMouseDown={() => exec('insertUnorderedList')}><FormatListBulletedIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
        <ToolbarBtn title="Numbered list" onMouseDown={() => exec('insertOrderedList')}><FormatListNumberedIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

        {/* Image / Link */}
        <ToolbarBtn title="Insert image" onMouseDown={() => imageRef.current?.click()}><InsertPhotoIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
        <ToolbarBtn title="Insert link"  onMouseDown={openLinkDialog}><LinkIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
        <input ref={imageRef} type="file" accept="image/*" hidden onChange={handleInsertImage} />
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

        {/* Clear / More */}
        <ToolbarBtn title="Clear formatting" onMouseDown={clearFormatting}><FormatClearIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
        <Tooltip title="More" placement="top">
          <Box component="button" onMouseDown={e => { e.preventDefault(); setMoreAnchor(e.currentTarget as HTMLElement) }}
            sx={{ ...btnSx, width: 28, height: 28 }}>
            <MoreHorizIcon sx={{ fontSize: 16 }} />
          </Box>
        </Tooltip>
        <Menu anchorEl={moreAnchor} open={!!moreAnchor} onClose={() => setMoreAnchor(null)} {...MENU_FOCUS_PROPS}>
          <MenuItem onClick={insertBlockquote} sx={{ fontSize: 13, gap: 1.5 }}>
            <FormatQuoteIcon sx={{ fontSize: 18, color: 'text.secondary' }} /> Block quote
          </MenuItem>
          <MenuItem onClick={insertHR} sx={{ fontSize: 13, gap: 1.5 }}>
            <HorizontalRuleIcon sx={{ fontSize: 18, color: 'text.secondary' }} /> Horizontal rule
          </MenuItem>
          <MenuItem onClick={() => { setMoreAnchor(null); setTimeout(() => setTableDialogOpen(true), 50) }} sx={{ fontSize: 13, gap: 1.5 }}>
            <TableChartIcon sx={{ fontSize: 18, color: 'text.secondary' }} /> Insert table…
          </MenuItem>
        </Menu>
      </Box>

      {/* Editable area */}
      <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
        <Box ref={editorRef} component="div" contentEditable suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={handleInput}
          onClick={handleEditorClick}
          sx={editorContentSx}
        />
      </Box>

      {/* Image resize + align popover */}
      <Popover open={!!imgAnchor} anchorEl={imgAnchor} onClose={() => setImgAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        disableRestoreFocus>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', mr: 0.5, minWidth: 36 }}>Width:</Typography>
            {[25, 50, 75, 100].map(pct => (
              <Button key={pct} size="small" variant="outlined" color="secondary"
                onClick={() => applyImageWidth(pct)}
                sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: 11 }}>
                {pct}%
              </Button>
            ))}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', mr: 0.5, minWidth: 36 }}>Align:</Typography>
            {(['left', 'center', 'right'] as const).map(a => (
              <Button key={a} size="small" variant="outlined" color="secondary"
                onClick={() => applyImageAlign(a)}
                sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: 11, textTransform: 'capitalize' }}>
                {a === 'left' ? '← Left' : a === 'right' ? 'Right →' : 'Center'}
              </Button>
            ))}
          </Box>
        </Box>
      </Popover>

      {/* Inline table toolbar */}
      <Popover open={!!tableToolbarAnchor} anchorEl={tableToolbarAnchor}
        onClose={() => { setTableToolbarAnchor(null); setActiveTable(null) }}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        {...MENU_FOCUS_PROPS}
        sx={{ pointerEvents: 'none', '& .MuiPopover-paper': { pointerEvents: 'auto' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.75 }}>
          <Button size="small" variant="text" color="secondary" sx={{ fontSize: 12, py: 0.25, px: 1, minWidth: 0 }} onClick={addTableRow}>+ Row</Button>
          <Button size="small" variant="text" color="secondary" sx={{ fontSize: 12, py: 0.25, px: 1, minWidth: 0 }} onClick={addTableCol}>+ Col</Button>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />
          <Button size="small" variant="text" color="secondary" sx={{ fontSize: 12, py: 0.25, px: 1, minWidth: 0 }} onClick={toggleTableBorders}>
            {activeTable?.dataset.borders === 'on' ? 'Hide borders' : 'Show borders'}
          </Button>
        </Box>
      </Popover>

      {/* Table insert dialog */}
      <Dialog open={tableDialogOpen} onClose={() => setTableDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>Insert table</DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField label="Rows"    type="number" size="small" value={tableRows} onChange={e => setTableRows(e.target.value)} slotProps={{ input: { min: 1, max: 20 } as any }} sx={{ flex: 1 }} />
            <TextField label="Columns" type="number" size="small" value={tableCols} onChange={e => setTableCols(e.target.value)} slotProps={{ input: { min: 1, max: 10 } as any }} sx={{ flex: 1 }} />
          </Box>
          <FormControlLabel control={<Checkbox checked={tableBorders} onChange={e => setTableBorders(e.target.checked)} size="small" />}
            label={<Typography sx={{ fontSize: 13 }}>Show cell borders</Typography>} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" color="secondary" onClick={() => setTableDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={confirmInsertTable}>Insert</Button>
        </DialogActions>
      </Dialog>

      {/* Link dialog */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>Insert link</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <ToggleButtonGroup value={linkMode} exclusive size="small"
            onChange={(_, v) => { if (v) handleLinkModeChange(v) }} sx={{ mb: 2.5 }}>
            <ToggleButton value="url" sx={{ fontSize: 12, px: 2 }}>External URL</ToggleButton>
            <ToggleButton value="doc" sx={{ fontSize: 12, px: 2, gap: 0.75 }}>
              <InsertDriveFileIcon sx={{ fontSize: 14 }} /> Document library
            </ToggleButton>
          </ToggleButtonGroup>

          {linkMode === 'url' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="URL"          size="small" fullWidth value={linkUrl}  onChange={e => setLinkUrl(e.target.value)}  placeholder="https://example.com" />
              <TextField label="Display text" size="small" fullWidth value={linkText} onChange={e => setLinkText(e.target.value)} placeholder="Leave blank to use URL" />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField size="small" fullWidth placeholder="Search documents…" value={docSearch} onChange={e => setDocSearch(e.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16 }} /></InputAdornment> } }} />
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, maxHeight: 240, overflow: 'auto' }}>
                {docsLoading ? (
                  <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} /></Box>
                ) : filteredDocs.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}><Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{docs.length === 0 ? 'No documents in library' : 'No matches'}</Typography></Box>
                ) : (
                  <List dense disablePadding>
                    {filteredDocs.map(doc => (
                      <ListItemButton key={doc.id} selected={selectedDoc?.id === doc.id}
                        onClick={() => { setSelectedDoc(doc); setLinkText(doc.title) }} sx={{ py: 0.75, px: 1.5 }}>
                        <InsertDriveFileIcon sx={{ fontSize: 15, mr: 1.25, color: 'text.secondary', flexShrink: 0 }} />
                        <ListItemText primary={doc.title} secondary={doc.category}
                          slotProps={{ primary: { sx: { fontSize: 13 } }, secondary: { sx: { fontSize: 11 } } }} />
                      </ListItemButton>
                    ))}
                  </List>
                )}
              </Box>
              <TextField label="Display text" size="small" fullWidth value={linkText} onChange={e => setLinkText(e.target.value)} placeholder="Leave blank to use document title" />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" color="secondary" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={confirmInsertLink}
            disabled={linkMode === 'url' ? !linkUrl.trim() || linkUrl === 'https://' : !selectedDoc}>
            Insert link
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import FormatBoldIcon           from '@mui/icons-material/FormatBold'
import FormatItalicIcon         from '@mui/icons-material/FormatItalic'
import FormatUnderlinedIcon     from '@mui/icons-material/FormatUnderlined'
import FormatListBulletedIcon   from '@mui/icons-material/FormatListBulleted'
import FormatListNumberedIcon   from '@mui/icons-material/FormatListNumbered'
import FormatClearIcon          from '@mui/icons-material/FormatClear'
import FormatColorTextIcon      from '@mui/icons-material/FormatColorText'
import FormatQuoteIcon          from '@mui/icons-material/FormatQuote'
import HorizontalRuleIcon       from '@mui/icons-material/HorizontalRule'
import TableChartIcon           from '@mui/icons-material/TableChart'
import AttachFileIcon           from '@mui/icons-material/AttachFile'
import InsertPhotoIcon          from '@mui/icons-material/InsertPhoto'
import MoreHorizIcon            from '@mui/icons-material/MoreHoriz'
import KeyboardArrowDownIcon    from '@mui/icons-material/KeyboardArrowDown'
import SendIcon                 from '@mui/icons-material/Send'
import { sendNotification }    from './actions'
import SearchIcon               from '@mui/icons-material/Search'
import CloseIcon                from '@mui/icons-material/Close'

type Member = {
  id: string
  display_name: string
  first_name: string | null
  last_name: string | null
  membership_status: string | null
}

type ToOption = 'all_active' | 'all_members' | 'custom'

const STATUS_LABEL: Record<string, string> = {
  active:    'Active',
  inactive:  'Inactive',
  suspended: 'Suspended',
  pending:   'Pending',
}

const TEXT_STYLES = [
  { label: 'Normal text', tag: 'p',  sx: { fontSize: 13 } },
  { label: 'Heading 1',   tag: 'h1', sx: { fontSize: 20, fontWeight: 700 } },
  { label: 'Heading 2',   tag: 'h2', sx: { fontSize: 16, fontWeight: 600 } },
  { label: 'Heading 3',   tag: 'h3', sx: { fontSize: 14, fontWeight: 600 } },
]

const FONT_FAMILIES = [
  { label: 'Sans-serif',  value: 'Arial' },
  { label: 'Serif',       value: 'Georgia' },
  { label: 'Monospace',   value: 'Courier New' },
  { label: 'Formal',      value: 'Times New Roman' },
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

function ToolbarBtn({
  title,
  onClick,
  children,
}: {
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip title={title} placement="top">
      <Box component="button" onClick={onClick}
        sx={{ ...btnSx, width: 28, height: 28 }}>
        {children}
      </Box>
    </Tooltip>
  )
}

function DropdownBtn({
  label,
  title,
  onMouseDown,
}: {
  label: string
  title: string
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <Tooltip title={title} placement="top">
      <Box component="button" onMouseDown={onMouseDown}
        sx={{ ...btnSx, gap: 0.25, height: 28, px: 1 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'inherit', lineHeight: 1 }}>
          {label}
        </Typography>
        <KeyboardArrowDownIcon sx={{ fontSize: 14 }} />
      </Box>
    </Tooltip>
  )
}

export default function ComposeClient({
  members,
  fromAddress,
  clubName,
  initialRecipientId,
}: {
  members: Member[]
  fromAddress: string
  clubName: string
  initialRecipientId?: string
}) {
  const validInitialId = initialRecipientId && members.some(m => m.id === initialRecipientId)
    ? initialRecipientId : undefined

  const [toOption, setToOption]         = useState<ToOption>(validInitialId ? 'custom' : 'all_active')
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(validInitialId ? new Set([validInitialId]) : new Set())
  const [pendingIds, setPendingIds]     = useState<Set<string>>(validInitialId ? new Set([validInitialId]) : new Set())
  const [selectOpen, setSelectOpen]     = useState(false)
  const [search, setSearch]             = useState('')
  const [subject, setSubject]           = useState('')
  const [attachments, setAttachments]   = useState<File[]>([])

  // Toolbar dropdown state
  const [styleAnchor, setStyleAnchor]   = useState<HTMLElement | null>(null)
  const [fontAnchor, setFontAnchor]     = useState<HTMLElement | null>(null)
  const [colorAnchor, setColorAnchor]   = useState<HTMLElement | null>(null)
  const [moreAnchor, setMoreAnchor]     = useState<HTMLElement | null>(null)
  const [activeColor, setActiveColor]   = useState('#000000')
  const [activeStyle, setActiveStyle]   = useState('Normal text')
  const [activeFont, setActiveFont]     = useState('Sans-serif')

  // Image resize state
  const [imgAnchor, setImgAnchor]       = useState<HTMLImageElement | null>(null)

  // Send state
  const [sending, setSending]     = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sentCount, setSentCount] = useState<number | null>(null)

  // Table insert dialog
  const [tableDialogOpen, setTableDialogOpen] = useState(false)
  const [tableRows, setTableRows]             = useState('3')
  const [tableCols, setTableCols]             = useState('3')
  const [tableBorders, setTableBorders]       = useState(true)

  // Inline table toolbar
  const [activeTable, setActiveTable]           = useState<HTMLTableElement | null>(null)
  const [tableToolbarAnchor, setTableToolbarAnchor] = useState<HTMLTableElement | null>(null)

  const editorRef        = useRef<HTMLDivElement>(null)
  const attachRef        = useRef<HTMLInputElement>(null)
  const imageRef         = useRef<HTMLInputElement>(null)
  const savedRangeRef    = useRef<Range | null>(null)

  // Continuously track selection so it's always available — even after focus leaves editor
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
    const p = document.createElement('p')
    p.appendChild(document.createTextNode(' '))

    if (anchor === editor) {
      range.insertNode(p)
      range.insertNode(node)
    } else {
      ;(anchor as Element).after(p)
      ;(anchor as Element).after(node)
    }

    const newRange = document.createRange()
    newRange.setStart(p.firstChild!, 0)
    newRange.collapse(true)
    sel.removeAllRanges()
    sel.addRange(newRange)
    editor.focus()
  }

  // ── Recipients ─────────────────────────────────────────────────────────────

  const filteredMembers = members.filter(m =>
    m.display_name.toLowerCase().includes(search.toLowerCase())
  )

  const toLabel = () => {
    if (toOption === 'all_active') return 'All active members'
    if (toOption === 'all_members') return 'All members'
    const n = selectedIds.size
    return `${n} member${n !== 1 ? 's' : ''} selected`
  }

  const handleToChange = (value: string) => {
    if (value === 'select') {
      setPendingIds(new Set(selectedIds))
      setSelectOpen(true)
    } else {
      setToOption(value as ToOption)
    }
  }

  const handleSelectConfirm = () => {
    setSelectedIds(new Set(pendingIds))
    setToOption('custom')
    setSelectOpen(false)
    setSearch('')
  }

  const handleSelectClose = () => {
    setSelectOpen(false)
    setSearch('')
  }

  const toggleMember = (id: string) => {
    setPendingIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allFilteredSelected = filteredMembers.length > 0 &&
    filteredMembers.every(m => pendingIds.has(m.id))

  const toggleAll = () => {
    if (allFilteredSelected) {
      setPendingIds(prev => {
        const next = new Set(prev)
        filteredMembers.forEach(m => next.delete(m.id))
        return next
      })
    } else {
      setPendingIds(prev => {
        const next = new Set(prev)
        filteredMembers.forEach(m => next.add(m.id))
        return next
      })
    }
  }

  // ── Formatting commands ─────────────────────────────────────────────────────

  // Direct toolbar buttons use onClick — selection is always current via selectionchange listener
  const exec = (cmd: string, value?: string) => {
    restoreSelection()
    document.execCommand(cmd, false, value)
  }

  // removeFormat only strips inline styles; formatBlock resets block-level tags (h1/h2/h3)
  const clearFormatting = () => {
    restoreSelection()
    document.execCommand('removeFormat')
    document.execCommand('formatBlock', false, 'p')
    setActiveStyle('Normal text')
    editorRef.current?.focus()
  }

  // For menu-triggered commands: close menu first, then restore selection + run in next tick
  // (setTimeout ensures the menu's focus trap is fully torn down before we touch the editor)
  const applyStyle = (tag: string, label: string) => {
    setActiveStyle(label)
    setStyleAnchor(null)
    setTimeout(() => {
      restoreSelection()
      document.execCommand('formatBlock', false, tag)
      editorRef.current?.focus()
    }, 0)
  }

  const applyFont = (value: string, label: string) => {
    setActiveFont(label)
    setFontAnchor(null)
    setTimeout(() => {
      restoreSelection()
      document.execCommand('fontName', false, value)
      editorRef.current?.focus()
    }, 0)
  }

  const applyColor = (color: string) => {
    setActiveColor(color)
    setColorAnchor(null)
    setTimeout(() => {
      restoreSelection()
      document.execCommand('foreColor', false, color)
      editorRef.current?.focus()
    }, 0)
  }

  const insertBlockquote = () => {
    setMoreAnchor(null)
    setTimeout(() => {
      restoreSelection()
      const sel = window.getSelection()
      const node = sel?.anchorNode
      const alreadyInBlockquote = !!(node instanceof Element ? node : node?.parentElement)?.closest('blockquote')
      // Toggle: if already a blockquote, revert to normal paragraph
      document.execCommand('formatBlock', false, alreadyInBlockquote ? 'p' : 'blockquote')
      editorRef.current?.focus()
    }, 0)
  }

  const insertHR = () => {
    setMoreAnchor(null)
    setTimeout(() => { domInsert(() => document.createElement('hr')) }, 0)
  }

  // ── Table helpers ───────────────────────────────────────────────────────────

  const buildTableEl = (rows: number, cols: number, borders: boolean) => {
    const table = document.createElement('table')
    table.style.cssText = 'border-collapse:collapse;width:100%;margin:8px 0'
    table.dataset.borders = borders ? 'on' : 'off'
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement('tr')
      for (let c = 0; c < cols; c++) {
        const td = document.createElement('td')
        td.style.cssText = 'padding:6px 10px;min-width:80px'
        td.appendChild(document.createTextNode(' '))
        tr.appendChild(td)
      }
      table.appendChild(tr)
    }
    return table
  }

  const insertTable = () => {
    setMoreAnchor(null)
    setTimeout(() => setTableDialogOpen(true), 50)
  }

  const confirmInsertTable = () => {
    setTableDialogOpen(false)
    const rows = Math.max(1, Math.min(20, parseInt(tableRows) || 3))
    const cols = Math.max(1, Math.min(10, parseInt(tableCols) || 3))
    setTimeout(() => domInsert(() => buildTableEl(rows, cols, tableBorders)), 0)
  }

  // Inline table toolbar actions — borders handled via CSS + data-borders attribute
  const addTableRow = () => {
    if (!activeTable) return
    const lastRow = activeTable.rows[activeTable.rows.length - 1]
    const newRow = document.createElement('tr')
    Array.from(lastRow.cells).forEach(() => {
      const td = document.createElement('td')
      td.style.cssText = 'padding:6px 10px;min-width:80px'
      td.appendChild(document.createTextNode(' '))
      newRow.appendChild(td)
    })
    activeTable.appendChild(newRow)
  }

  const addTableCol = () => {
    if (!activeTable) return
    Array.from(activeTable.rows).forEach(row => {
      const td = document.createElement('td')
      td.style.cssText = 'padding:6px 10px;min-width:80px'
      td.appendChild(document.createTextNode(' '))
      row.appendChild(td)
    })
  }

  const toggleTableBorders = () => {
    if (!activeTable) return
    activeTable.dataset.borders = activeTable.dataset.borders === 'on' ? 'off' : 'on'
  }
  // ── Media handlers ──────────────────────────────────────────────────────────

  const handleInsertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    restoreSelection()
    document.execCommand('insertHTML', false,
      `<img src="${url}" style="width:50%;max-width:100%;height:auto;display:block;margin:8px 0" alt="${file.name}" />`
    )
    editorRef.current?.focus()
    e.target.value = ''
  }

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) setAttachments(prev => [...prev, ...files])
    e.target.value = ''
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement

    if (target.tagName === 'IMG') {
      setImgAnchor(target as HTMLImageElement)
      setActiveTable(null)
      setTableToolbarAnchor(null)
      return
    }

    const cell = target.closest('td, th')
    if (cell) {
      const table = cell.closest('table') as HTMLTableElement
      setActiveTable(table)
      setTableToolbarAnchor(table)
      setImgAnchor(null)
      return
    }

    setImgAnchor(null)
    setActiveTable(null)
    setTableToolbarAnchor(null)
  }

  const applyImageWidth = (pct: number) => {
    if (imgAnchor) imgAnchor.style.width = `${pct}%`
    setImgAnchor(null)
    editorRef.current?.focus()
  }

  // ── Misc ───────────────────────────────────────────────────────────────────

  const activeMembers  = members.filter(m => m.membership_status === 'active')
  const recipientCount = toOption === 'all_active'  ? activeMembers.length
                       : toOption === 'all_members'  ? members.length
                       : selectedIds.size

  // ── Send ───────────────────────────────────────────────────────────────────

  async function handleSend() {
    const htmlBody = editorRef.current?.innerHTML ?? ''
    if (!subject.trim() || !htmlBody.trim() || recipientCount === 0) return
    setSending(true)
    setSendError(null)
    setSentCount(null)
    const result = await sendNotification({
      subject,
      htmlBody,
      toOption,
      customIds: toOption === 'custom' ? [...selectedIds] : undefined,
    })
    setSending(false)
    if (result.ok) {
      setSentCount(result.recipientCount)
      setSubject('')
      if (editorRef.current) editorRef.current.innerHTML = ''
    } else {
      setSendError(result.error)
    }
  }

  return (
    <>
      <Paper variant="outlined">

        {/* Top bar */}
        <Box sx={{
          px: 2.5, py: 1.5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
            New Message
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="text"
              size="small"
              color="secondary"
              onClick={() => {
                setSubject('')
                setAttachments([])
                if (editorRef.current) editorRef.current.innerHTML = ''
              }}
            >
              Discard
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<SendIcon sx={{ fontSize: '14px !important' }} />}
              disabled={!subject.trim() || recipientCount === 0 || sending}
              onClick={handleSend}
              sx={{ minWidth: 90 }}
            >
              {sending ? 'Sending…' : 'Send'}
            </Button>
          </Box>
          {sentCount !== null && (
            <Typography sx={{ fontSize: 12, color: 'success.main', mt: 0.5, textAlign: 'right' }}>
              ✓ Sent to {sentCount} recipient{sentCount !== 1 ? 's' : ''}
            </Typography>
          )}
          {sendError && (
            <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.5, textAlign: 'right' }}>
              {sendError}
            </Typography>
          )}
        </Box>

        {/* From — read-only, styled disabled */}
        <Box sx={{
          px: 2.5, py: 1.25,
          display: 'flex', alignItems: 'center', gap: 2,
          borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', minWidth: 56 }}>
            From
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>
            {fromAddress}
          </Typography>
        </Box>

        {/* To */}
        <Box sx={{
          px: 2.5, py: 0.75,
          display: 'flex', alignItems: 'center', gap: 2,
          borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', minWidth: 56 }}>
            To
          </Typography>
          <Select
            size="small"
            value={toOption === 'custom' ? '_custom' : toOption}
            onChange={e => handleToChange(e.target.value)}
            renderValue={() => (
              <Typography sx={{ fontSize: 13 }}>{toLabel()}</Typography>
            )}
            sx={{
              fontSize: 13,
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
            }}
          >
            <MenuItem value="all_active"  sx={{ fontSize: 13 }}>All active members</MenuItem>
            <MenuItem value="all_members" sx={{ fontSize: 13 }}>All members</MenuItem>
            <Divider />
            <MenuItem value="select" sx={{ fontSize: 13, color: 'primary.main' }}>
              Select members…
            </MenuItem>
            <MenuItem value="_custom" sx={{ display: 'none' }} />
          </Select>
          {recipientCount > 0 && (
            <Typography sx={{ fontSize: 12, color: 'text.secondary', ml: 'auto', pr: 1 }}>
              {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        {/* Subject */}
        <Box sx={{
          px: 2.5, py: 0.75,
          display: 'flex', alignItems: 'center', gap: 2,
          borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', minWidth: 56 }}>
            Subject
          </Typography>
          <TextField
            variant="outlined"
            size="small"
            fullWidth
            placeholder="Add a subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            slotProps={{ input: { sx: { fontSize: 13 } } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: t => t.palette.mode === 'dark' ? 'rgba(0,0,0,0.25)' : 'background.paper',
              },
            }}
          />
        </Box>

        {/* ── Formatting toolbar ─────────────────────────────────────────────── */}
        <Box sx={{
          px: 1.5, py: 0.75,
          display: 'flex', alignItems: 'center', gap: 0.25, flexWrap: 'wrap',
          borderBottom: '1px solid', borderColor: 'divider',
          bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        }}>

          {/* Text style */}
          <DropdownBtn
            label={activeStyle}
            title="Text style"
            onMouseDown={e => { e.preventDefault(); setStyleAnchor(e.currentTarget) }}
          />
          <Menu anchorEl={styleAnchor} open={!!styleAnchor} onClose={() => setStyleAnchor(null)}
            {...MENU_FOCUS_PROPS}>
            {TEXT_STYLES.map(s => (
              <MenuItem key={s.tag} onClick={() => applyStyle(s.tag, s.label)} sx={s.sx}>
                {s.label}
              </MenuItem>
            ))}
          </Menu>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

          {/* Font family */}
          <DropdownBtn
            label={activeFont}
            title="Font"
            onMouseDown={e => { e.preventDefault(); setFontAnchor(e.currentTarget) }}
          />
          <Menu anchorEl={fontAnchor} open={!!fontAnchor} onClose={() => setFontAnchor(null)}
            {...MENU_FOCUS_PROPS}>
            {FONT_FAMILIES.map(f => (
              <MenuItem
                key={f.value}
                onClick={() => applyFont(f.value, f.label)}
                sx={{ fontSize: 13, fontFamily: f.value }}
              >
                {f.label}
              </MenuItem>
            ))}
          </Menu>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

          {/* B I U */}
          <ToolbarBtn title="Bold"      onClick={() => exec('bold')}>
            <FormatBoldIcon sx={{ fontSize: 16 }} />
          </ToolbarBtn>
          <ToolbarBtn title="Italic"    onClick={() => exec('italic')}>
            <FormatItalicIcon sx={{ fontSize: 16 }} />
          </ToolbarBtn>
          <ToolbarBtn title="Underline" onClick={() => exec('underline')}>
            <FormatUnderlinedIcon sx={{ fontSize: 16 }} />
          </ToolbarBtn>

          {/* Font color */}
          <Tooltip title="Text colour" placement="top">
            <Box
              component="button"
              onMouseDown={e => { e.preventDefault(); setColorAnchor(e.currentTarget) }}
              sx={{
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', width: 28, height: 28, borderRadius: '4px',
                border: 'none', bgcolor: 'transparent', cursor: 'pointer',
                color: 'text.secondary', gap: '2px', flexShrink: 0,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <FormatColorTextIcon sx={{ fontSize: 15 }} />
              <Box sx={{ width: 14, height: 3, borderRadius: '1px', bgcolor: activeColor }} />
            </Box>
          </Tooltip>
          <Popover
            open={!!colorAnchor}
            anchorEl={colorAnchor}
            onClose={() => setColorAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            {...MENU_FOCUS_PROPS}
          >
            <Box sx={{ p: 1.5, display: 'grid', gridTemplateColumns: 'repeat(8, 20px)', gap: '6px' }}>
              {COLOR_PALETTE.map(color => (
                <Box
                  key={color}
                  component="button"
                  onClick={() => applyColor(color)}
                  sx={{
                    width: 20, height: 20, borderRadius: '3px',
                    bgcolor: color, border: '1px solid rgba(0,0,0,0.15)',
                    cursor: 'pointer', p: 0,
                    outline: activeColor === color ? '2px solid' : 'none',
                    outlineColor: 'primary.main',
                    outlineOffset: '1px',
                    '&:hover': { transform: 'scale(1.15)' },
                  }}
                />
              ))}
            </Box>
          </Popover>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

          {/* Lists */}
          <ToolbarBtn title="Bullet list"   onClick={() => exec('insertUnorderedList')}>
            <FormatListBulletedIcon sx={{ fontSize: 16 }} />
          </ToolbarBtn>
          <ToolbarBtn title="Numbered list" onClick={() => exec('insertOrderedList')}>
            <FormatListNumberedIcon sx={{ fontSize: 16 }} />
          </ToolbarBtn>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

          {/* Attach / Image */}
          <ToolbarBtn title="Attach file"  onClick={() => attachRef.current?.click()}>
            <AttachFileIcon sx={{ fontSize: 16 }} />
          </ToolbarBtn>
          <ToolbarBtn title="Insert image" onClick={() => imageRef.current?.click()}>
            <InsertPhotoIcon sx={{ fontSize: 16 }} />
          </ToolbarBtn>
          <input ref={attachRef} type="file" multiple hidden onChange={handleAttach} />
          <input ref={imageRef}  type="file" accept="image/*" hidden onChange={handleInsertImage} />

          <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

          {/* Clear formatting */}
          <ToolbarBtn title="Clear formatting" onClick={clearFormatting}>
            <FormatClearIcon sx={{ fontSize: 16 }} />
          </ToolbarBtn>

          {/* More options */}
          <Tooltip title="More options" placement="top">
            <Box component="button"
              onClick={e => setMoreAnchor(e.currentTarget as HTMLElement)}
              sx={{ ...btnSx, width: 28, height: 28 }}>
              <MoreHorizIcon sx={{ fontSize: 16 }} />
            </Box>
          </Tooltip>
          <Menu anchorEl={moreAnchor} open={!!moreAnchor} onClose={() => setMoreAnchor(null)}
            {...MENU_FOCUS_PROPS}>
            <MenuItem onClick={insertBlockquote} sx={{ fontSize: 13, gap: 1.5 }}>
              <FormatQuoteIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              Block quote
            </MenuItem>
            <MenuItem onClick={insertHR} sx={{ fontSize: 13, gap: 1.5 }}>
              <HorizontalRuleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              Horizontal rule
            </MenuItem>
            <MenuItem onClick={insertTable} sx={{ fontSize: 13, gap: 1.5 }}>
              <TableChartIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              Insert table…
            </MenuItem>
          </Menu>
        </Box>

        {/* Body */}
        <Box
          ref={editorRef}
          component="div"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Write your message here…"
          onClick={handleEditorClick}
          sx={{
            minHeight: 340,
            px: 2.5,
            py: 2,
            fontSize: 14,
            lineHeight: 1.75,
            color: 'text.primary',
            outline: 'none',
            fontFamily: 'inherit',
            '&:empty::before': {
              content: 'attr(data-placeholder)',
              color: 'text.hint',
              pointerEvents: 'none',
            },
            // Block element styles — must be explicit; MUI's global reset strips browser defaults
            '& p':  { fontSize: 14, margin: '0 0 0.2em' },
            '& h1': { fontSize: '1.6em', fontWeight: 700, lineHeight: 1.3, mt: 1, mb: 0.5 },
            '& h2': { fontSize: '1.3em', fontWeight: 600, lineHeight: 1.3, mt: 1, mb: 0.5 },
            '& h3': { fontSize: '1.1em', fontWeight: 600, lineHeight: 1.3, mt: 1, mb: 0.5 },
            // List styles — MUI CssBaseline sets list-style:none, padding:0, margin:0
            '& ul': { listStyleType: 'disc',    paddingLeft: '1.75em', margin: '0.25em 0' },
            '& ol': { listStyleType: 'decimal', paddingLeft: '1.75em', margin: '0.25em 0' },
            '& li': { display: 'list-item', lineHeight: 1.75 },
            '& blockquote': {
              borderLeft: '3px solid',
              borderColor: 'divider',
              pl: 2, ml: 0,
              color: 'text.secondary',
              fontStyle: 'italic',
              my: 1,
            },
            '& table': { borderCollapse: 'collapse', width: '100%', my: 1 },
            // Borders controlled via data-borders attribute — uses theme divider so it adapts to dark mode
            '& table[data-borders="on"] td, & table[data-borders="on"] th': {
              border: '1px solid',
              borderColor: 'divider',
            },
            '& td, & th': { p: '6px 10px', minWidth: '80px', verticalAlign: 'top' },
            '& hr': { border: 'none', borderTop: '1px solid', borderColor: 'divider', my: 2 },
            '& img': { cursor: 'pointer' },
          }}
        />

        {/* Email footer — non-editable, always included in send */}
        <Box sx={{
          px: 2.5, pt: 2, pb: 2.5,
          borderTop: '1px solid', borderColor: 'divider',
          userSelect: 'none',
          pointerEvents: 'none',
        }}>
          <Typography sx={{ fontSize: 11, color: 'text.disabled', lineHeight: 1.7 }}>
            Sent on behalf of {clubName} via Focal Point · <Box component="span" sx={{ fontWeight: 700 }}>Do not reply to this email</Box>
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.disabled', lineHeight: 1.7 }}>
            Questions? Contact your club president or visit your member profile to update your preferences.
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.disabled', lineHeight: 1.7, mt: 0.5 }}>
            © {new Date().getFullYear()} {clubName}
          </Typography>
        </Box>

        {/* Attachments */}
        {attachments.length > 0 && (
          <Box sx={{
            px: 2.5, py: 1.25,
            display: 'flex', flexWrap: 'wrap', gap: 1,
            borderTop: '1px solid', borderColor: 'divider',
          }}>
            {attachments.map((file, i) => (
              <Chip
                key={i}
                label={file.name}
                size="small"
                icon={<AttachFileIcon sx={{ fontSize: '14px !important' }} />}
                onDelete={() => removeAttachment(i)}
                deleteIcon={<CloseIcon sx={{ fontSize: '14px !important' }} />}
                sx={{ fontSize: 12, height: 26 }}
              />
            ))}
          </Box>
        )}
      </Paper>

      {/* Image resize popover */}
      <Popover
        open={!!imgAnchor}
        anchorEl={imgAnchor}
        onClose={() => setImgAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        disableRestoreFocus
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0.75 }}>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', mr: 0.5 }}>Width:</Typography>
          {[25, 50, 75, 100].map(pct => (
            <Button
              key={pct}
              size="small"
              variant="outlined"
              color="secondary"
              onClick={() => applyImageWidth(pct)}
              sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: 11 }}
            >
              {pct}%
            </Button>
          ))}
        </Box>
      </Popover>

      {/* Inline table toolbar */}
      <Popover
        open={!!tableToolbarAnchor}
        anchorEl={tableToolbarAnchor}
        onClose={() => { setTableToolbarAnchor(null); setActiveTable(null) }}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        {...MENU_FOCUS_PROPS}
        sx={{ pointerEvents: 'none', '& .MuiPopover-paper': { pointerEvents: 'auto' } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.75 }}>
          <Button size="small" variant="text" color="secondary"
            sx={{ fontSize: 12, py: 0.25, px: 1, minWidth: 0 }}
            onClick={addTableRow}>
            + Row
          </Button>
          <Button size="small" variant="text" color="secondary"
            sx={{ fontSize: 12, py: 0.25, px: 1, minWidth: 0 }}
            onClick={addTableCol}>
            + Column
          </Button>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />
          <Button size="small" variant="text" color="secondary"
            sx={{ fontSize: 12, py: 0.25, px: 1, minWidth: 0 }}
            onClick={toggleTableBorders}>
            {activeTable?.dataset.borders === 'on' ? 'Hide borders' : 'Show borders'}
          </Button>
        </Box>
      </Popover>

      {/* Table insert dialog */}
      <Dialog open={tableDialogOpen} onClose={() => setTableDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>
          Insert table
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Rows"
              type="number"
              size="small"
              value={tableRows}
              onChange={e => setTableRows(e.target.value)}
              slotProps={{ input: { min: 1, max: 20 } as any }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Columns"
              type="number"
              size="small"
              value={tableCols}
              onChange={e => setTableCols(e.target.value)}
              slotProps={{ input: { min: 1, max: 10 } as any }}
              sx={{ flex: 1 }}
            />
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={tableBorders}
                onChange={e => setTableBorders(e.target.checked)}
                size="small"
              />
            }
            label={<Typography sx={{ fontSize: 13 }}>Show cell borders</Typography>}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" color="secondary" onClick={() => setTableDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={confirmInsertTable}>
            Insert
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Select members dialog ───────────────────────────────────────────── */}
      <Dialog open={selectOpen} onClose={handleSelectClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 600 }}>
          Select recipients
        </DialogTitle>

        <DialogContent sx={{ pt: '8px !important' }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search members…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 1.5 }}
          />

          <Paper variant="outlined" sx={{ maxHeight: 380, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ bgcolor: 'background.paper' }}>
                    <Checkbox
                      size="small"
                      checked={allFilteredSelected}
                      indeterminate={pendingIds.size > 0 && !allFilteredSelected}
                      onChange={toggleAll}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary', bgcolor: 'background.paper' }}>
                    Name
                  </TableCell>
                  <TableCell sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary', bgcolor: 'background.paper' }}>
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4, color: 'text.secondary', fontSize: 13 }}>
                      No members found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map(m => (
                    <TableRow
                      key={m.id}
                      hover
                      onClick={() => toggleMember(m.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={pendingIds.has(m.id)}
                          onChange={() => toggleMember(m.id)}
                          onClick={e => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, color: 'text.primary' }}>
                        {m.display_name}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={STATUS_LABEL[m.membership_status ?? ''] ?? m.membership_status ?? '—'}
                          size="small"
                          sx={{ fontSize: 11, height: 20 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>

          {pendingIds.size > 0 && (
            <Typography sx={{ mt: 1.5, fontSize: 12, color: 'text.secondary' }}>
              {pendingIds.size} member{pendingIds.size !== 1 ? 's' : ''} selected
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" color="secondary" onClick={handleSelectClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={pendingIds.size === 0}
            onClick={handleSelectConfirm}
          >
            Confirm selection
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

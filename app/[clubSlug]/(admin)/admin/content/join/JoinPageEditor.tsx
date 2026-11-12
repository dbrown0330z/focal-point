'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material'
import FormatBoldIcon         from '@mui/icons-material/FormatBold'
import FormatItalicIcon       from '@mui/icons-material/FormatItalic'
import FormatUnderlinedIcon   from '@mui/icons-material/FormatUnderlined'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import FormatAlignLeftIcon    from '@mui/icons-material/FormatAlignLeft'
import FormatAlignCenterIcon  from '@mui/icons-material/FormatAlignCenter'
import FormatAlignRightIcon   from '@mui/icons-material/FormatAlignRight'
import LinkIcon               from '@mui/icons-material/Link'
import LinkOffIcon            from '@mui/icons-material/LinkOff'
import FormatClearIcon        from '@mui/icons-material/FormatClear'
import KeyboardArrowDownIcon  from '@mui/icons-material/KeyboardArrowDown'
import OpenInNewIcon          from '@mui/icons-material/OpenInNew'
import { saveJoinPageContent } from './actions'

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
  title, onMouseDown, active, children,
}: {
  title: string
  onMouseDown: () => void
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <Tooltip title={title} placement="top">
      <Box
        component="button"
        onMouseDown={e => { e.preventDefault(); onMouseDown() }}
        sx={{
          ...btnSx, width: 28, height: 28,
          ...(active ? { bgcolor: 'action.selected', color: 'text.primary' } : {}),
        }}
      >
        {children}
      </Box>
    </Tooltip>
  )
}

function DropdownBtn({
  label, title, onMouseDown,
}: {
  label: string; title: string
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

export default function JoinPageEditor({
  pageId: initialPageId,
  initialContent,
  clubSlug,
}: {
  pageId:         string | null
  initialContent: string
  clubSlug:       string
}) {
  const editorRef     = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const [pageId, setPageId] = useState(initialPageId)

  const [, startSave]  = useTransition()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const [styleAnchor, setStyleAnchor] = useState<HTMLElement | null>(null)
  const [fontAnchor,  setFontAnchor]  = useState<HTMLElement | null>(null)
  const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null)
  const [activeStyle, setActiveStyle] = useState('Normal text')
  const [activeFont,  setActiveFont]  = useState('Nunito')

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialContent
  }, [initialContent])

  const restoreSelection = () => {
    if (!savedRangeRef.current || !editorRef.current) return
    const sel = window.getSelection()
    if (!sel) return
    sel.removeAllRanges()
    if (editorRef.current.contains(savedRangeRef.current.commonAncestorContainer)) {
      sel.addRange(savedRangeRef.current)
    }
  }

  const exec = (cmd: string, val?: string) => {
    restoreSelection()
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
  }

  const handleSave = () => {
    const html = editorRef.current?.innerHTML ?? ''
    setSaveStatus('saving')
    startSave(async () => {
      const res = await saveJoinPageContent(pageId, html)
      if (res.error) {
        setSaveStatus('error')
      } else {
        setSaveStatus('saved')
        if (res.newPageId) setPageId(res.newPageId)
      }
      setTimeout(() => setSaveStatus('idle'), 2500)
    })
  }

  const divider = (
    <Box sx={{ width: '1px', height: 18, bgcolor: 'divider', mx: 0.25, flexShrink: 0 }} />
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Header */}
      <Box>
        <Typography variant="h1" sx={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.015em', color: 'text.primary' }}>
          Join / Renew Page
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 13, color: 'text.secondary' }}>
          Edit the introductory content shown on the public Join / Renew page. Payment instructions are generated automatically from your{' '}
          <Box
            component="a"
            href={`/${clubSlug}/admin/dues-payment`}
            sx={{ color: 'var(--action-primary)', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Dues &amp; Payment settings
          </Box>
          .
        </Typography>
      </Box>

      {/* Editor card */}
      <Box sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>

        {/* Toolbar */}
        <Box sx={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.25,
          px: 1.5, py: 0.75,
          borderBottom: '1px solid', borderColor: 'divider',
          bgcolor: 'background.default',
        }}>
          {/* Text style */}
          <DropdownBtn
            label={activeStyle}
            title="Text style"
            onMouseDown={e => { e.preventDefault(); setStyleAnchor(e.currentTarget) }}
          />
          <Menu
            anchorEl={styleAnchor}
            open={Boolean(styleAnchor)}
            onClose={() => setStyleAnchor(null)}
            slotProps={{ paper: { sx: { mt: 0.5 } }, list: MENU_FOCUS_PROPS }}
          >
            {TEXT_STYLES.map(s => (
              <MenuItem
                key={s.tag}
                onMouseDown={e => {
                  e.preventDefault()
                  restoreSelection()
                  document.execCommand('formatBlock', false, s.tag)
                  setActiveStyle(s.label)
                  setStyleAnchor(null)
                  editorRef.current?.focus()
                }}
                sx={s.sx}
              >
                {s.label}
              </MenuItem>
            ))}
          </Menu>

          {divider}

          {/* Font family */}
          <DropdownBtn
            label={activeFont}
            title="Font family"
            onMouseDown={e => { e.preventDefault(); setFontAnchor(e.currentTarget) }}
          />
          <Menu
            anchorEl={fontAnchor}
            open={Boolean(fontAnchor)}
            onClose={() => setFontAnchor(null)}
            slotProps={{ paper: { sx: { mt: 0.5 } }, list: MENU_FOCUS_PROPS }}
          >
            {FONT_FAMILIES.map(f => (
              <MenuItem
                key={f.value}
                onMouseDown={e => {
                  e.preventDefault()
                  restoreSelection()
                  document.execCommand('fontName', false, f.value)
                  setActiveFont(f.label)
                  setFontAnchor(null)
                  editorRef.current?.focus()
                }}
              >
                {f.label}
              </MenuItem>
            ))}
          </Menu>

          {divider}

          <ToolbarBtn title="Bold" onMouseDown={() => exec('bold')}>
            <FormatBoldIcon sx={{ fontSize: 16 }} />
          </ToolbarBtn>
          <ToolbarBtn title="Italic" onMouseDown={() => exec('italic')}>
            <FormatItalicIcon sx={{ fontSize: 16 }} />
          </ToolbarBtn>
          <ToolbarBtn title="Underline" onMouseDown={() => exec('underline')}>
            <FormatUnderlinedIcon sx={{ fontSize: 16 }} />
          </ToolbarBtn>

          {divider}

          {/* Color */}
          <DropdownBtn
            label="Color"
            title="Text color"
            onMouseDown={e => { e.preventDefault(); setColorAnchor(e.currentTarget) }}
          />
          <Tooltip title="Text color" placement="top">
            <Box
              component="button"
              onMouseDown={e => { e.preventDefault(); setColorAnchor(e.currentTarget as HTMLElement) }}
              sx={{ ...btnSx, width: 28, height: 28 }}
            >
              <Box sx={{
                width: 14, height: 4, bgcolor: 'currentColor',
                borderRadius: 1, mt: 0.5,
              }} />
            </Box>
          </Tooltip>
          <Menu
            anchorEl={colorAnchor}
            open={Boolean(colorAnchor)}
            onClose={() => setColorAnchor(null)}
            slotProps={{ paper: { sx: { mt: 0.5 } }, list: MENU_FOCUS_PROPS }}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 0.5, p: 1.5 }}>
              {COLOR_PALETTE.map(c => (
                <Box
                  key={c}
                  component="button"
                  onMouseDown={e => {
                    e.preventDefault()
                    restoreSelection()
                    document.execCommand('foreColor', false, c)
                    setColorAnchor(null)
                    editorRef.current?.focus()
                  }}
                  sx={{
                    width: 20, height: 20, borderRadius: '3px',
                    bgcolor: c, border: '1px solid rgba(0,0,0,0.12)',
                    cursor: 'pointer', p: 0,
                  }}
                />
              ))}
            </Box>
          </Menu>

          {divider}

          <ToolbarBtn title="Bulleted list" onMouseDown={() => exec('insertUnorderedList')}>
            <FormatListBulletedIcon sx={{ fontSize: 16 }} />
          </ToolbarBtn>
          <ToolbarBtn title="Numbered list" onMouseDown={() => exec('insertOrderedList')}>
            <FormatListNumberedIcon sx={{ fontSize: 16 }} />
          </ToolbarBtn>

          {divider}

          <ToolbarBtn title="Align left"   onMouseDown={() => exec('justifyLeft')}>
            <FormatAlignLeftIcon   sx={{ fontSize: 16 }} />
          </ToolbarBtn>
          <ToolbarBtn title="Align center" onMouseDown={() => exec('justifyCenter')}>
            <FormatAlignCenterIcon sx={{ fontSize: 16 }} />
          </ToolbarBtn>
          <ToolbarBtn title="Align right"  onMouseDown={() => exec('justifyRight')}>
            <FormatAlignRightIcon  sx={{ fontSize: 16 }} />
          </ToolbarBtn>

          {divider}

          <ToolbarBtn
            title="Insert link"
            onMouseDown={() => {
              restoreSelection()
              const url = window.prompt('Enter URL:')
              if (url) exec('createLink', url)
            }}
          >
            <LinkIcon sx={{ fontSize: 16 }} />
          </ToolbarBtn>
          <ToolbarBtn title="Remove link" onMouseDown={() => exec('unlink')}>
            <LinkOffIcon sx={{ fontSize: 16 }} />
          </ToolbarBtn>

          {divider}

          <ToolbarBtn title="Clear formatting" onMouseDown={() => exec('removeFormat')}>
            <FormatClearIcon sx={{ fontSize: 16 }} />
          </ToolbarBtn>
        </Box>

        {/* Editable content */}
        <Box
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onSelect={() => {
            const sel = window.getSelection()
            if (!sel || sel.rangeCount === 0) return
            const range = sel.getRangeAt(0)
            if (editorRef.current?.contains(range.commonAncestorContainer)) {
              savedRangeRef.current = range.cloneRange()
            }
          }}
          sx={{
            minHeight: 320,
            p: 3,
            outline: 'none',
            fontSize: 14,
            lineHeight: 1.7,
            color: 'text.primary',
            fontFamily: CSS_FONT_NUNITO,
            '& h1': { fontSize: 22, fontWeight: 700, mt: 2, mb: 1, fontFamily: CSS_FONT_LORA },
            '& h2': { fontSize: 18, fontWeight: 600, mt: 1.5, mb: 0.75, fontFamily: CSS_FONT_LORA },
            '& h3': { fontSize: 15, fontWeight: 600, mt: 1.5, mb: 0.5, fontFamily: CSS_FONT_LORA },
            '& p':  { mt: 0, mb: 1 },
            '& ul, & ol': { pl: 3, mb: 1 },
            '& a':  { color: 'var(--action-primary)', textDecoration: 'underline' },
          }}
        />
      </Box>

      {/* Auto-generated note */}
      <Box sx={{
        bgcolor: 'var(--status-warning-bg, #FFFBE6)',
        border: '1px solid',
        borderColor: 'var(--status-warning, #A67C00)',
        borderRadius: 'var(--radius-md)',
        px: 2.5,
        py: 2,
      }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'var(--status-warning-text, #6B5000)', mb: 0.5 }}>
          Payment instructions are auto-generated
        </Typography>
        <Typography sx={{ fontSize: 13, color: 'var(--status-warning-text, #6B5000)', lineHeight: 1.6 }}>
          Below your intro text, the page automatically shows payment method instructions based on your{' '}
          <Box
            component="a"
            href={`/${clubSlug}/admin/dues-payment`}
            sx={{ color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
          >
            Dues &amp; Payment settings
          </Box>
          . No payment methods are shown until you configure them there.
        </Typography>
      </Box>

      {/* Bottom bar */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pt: 2, borderTop: '1px solid', borderColor: 'divider',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            startIcon={saveStatus === 'saving' ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Save'}
          </Button>
          {saveStatus === 'saved' && (
            <Typography sx={{ fontSize: 13, color: 'var(--status-success)', fontWeight: 500 }}>Saved</Typography>
          )}
          {saveStatus === 'error' && (
            <Typography sx={{ fontSize: 13, color: 'var(--status-error)', fontWeight: 500 }}>Error saving</Typography>
          )}
        </Box>

        <Button
          variant="outlined"
          color="secondary"
          endIcon={<OpenInNewIcon sx={{ fontSize: 15 }} />}
          href={`/${clubSlug}/our-club/join`}
          target="_blank"
          component="a"
          size="small"
          sx={{ fontSize: 13 }}
        >
          View page
        </Button>
      </Box>
    </Box>
  )
}

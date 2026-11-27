'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Divider,
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
import UndoIcon               from '@mui/icons-material/Undo'
import RedoIcon               from '@mui/icons-material/Redo'
import OpenInNewIcon          from '@mui/icons-material/OpenInNew'
import { saveJoinPageContent } from './actions'
import type { ManualMethod } from '@/app/[clubSlug]/(admin)/admin/dues-payment/actions'
import PageEditorSheet        from '@/components/admin/PageEditorSheet'

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

export type DuesSummary = {
  annualAmount:    number | null
  methods:         ManualMethod[]
  chequePayableTo: string | null
  chequeMail:      string | null
  etransferEmail:  string | null
  paypalLink:      string | null
  venmoHandle:     string | null
  cashappHandle:   string | null
  zelleContact:    string | null
}

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

const METHOD_LABELS: Record<ManualMethod, string> = {
  cheque:       'Cheque',
  etransfer:    'e-Transfer',
  'paypal-link': 'PayPal',
  venmo:        'Venmo',
  zelle:        'Zelle',
  cashapp:      'Cash App',
}

function MethodDetail({ method, dues }: { method: ManualMethod; dues: DuesSummary }) {
  const detail = (() => {
    switch (method) {
      case 'cheque':       return dues.chequePayableTo ? `Payable to "${dues.chequePayableTo}"` : null
      case 'etransfer':    return dues.etransferEmail  ? dues.etransferEmail : null
      case 'paypal-link':  return dues.paypalLink      ? dues.paypalLink : null
      case 'venmo':        return dues.venmoHandle     ? dues.venmoHandle : null
      case 'cashapp':      return dues.cashappHandle   ? dues.cashappHandle : null
      case 'zelle':        return dues.zelleContact    ? dues.zelleContact : null
    }
  })()
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary' }}>
        {METHOD_LABELS[method]}
      </Typography>
      {detail && (
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{detail}</Typography>
      )}
    </Box>
  )
}

function DuesPanel({ dues, clubSlug }: { dues: DuesSummary; clubSlug: string }) {
  const isFree = !dues.annualAmount
  return (
    <Box sx={{
      width: 272,
      flexShrink: 0,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 'var(--radius-lg)',
      bgcolor: 'background.default',
      overflow: 'hidden',
    }}>
      <Box sx={{
        px: 2.5, py: 1.75,
        borderBottom: '1px solid', borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'text.secondary' }}>
          Dues &amp; Payment
        </Typography>
        <Box
          component="a"
          href={`/${clubSlug}/admin/dues-payment`}
          sx={{ fontSize: 11, color: 'var(--action-primary)', textDecoration: 'none', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}
        >
          Edit →
        </Box>
      </Box>

      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'text.secondary', mb: 0.75 }}>
            Annual dues
          </Typography>
          {isFree ? (
            <Typography sx={{ fontSize: 14, color: 'text.primary', fontWeight: 500 }}>
              Free — no charge to join
            </Typography>
          ) : (
            <Typography sx={{ fontSize: 18, color: 'text.primary', fontWeight: 700 }}>
              ${dues.annualAmount!.toFixed(2)}
              <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 400, ml: 0.5 }}>/ year</Typography>
            </Typography>
          )}
        </Box>

        {!isFree && (
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'text.secondary', mb: 1 }}>
              Payment methods
            </Typography>
            {dues.methods.length === 0 ? (
              <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.6 }}>
                No methods configured yet.{' '}
                <Box component="a" href={`/${clubSlug}/admin/dues-payment`} sx={{ color: 'var(--action-primary)', textDecoration: 'underline' }}>
                  Add one →
                </Box>
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {dues.methods.map(m => (
                  <MethodDetail key={m} method={m} dues={dues} />
                ))}
              </Box>
            )}
          </Box>
        )}

        <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.6, borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
          This information is generated automatically on the public Join / Renew page below your intro text.
        </Typography>
      </Box>
    </Box>
  )
}

export default function JoinPageEditor({
  pageId: initialPageId,
  initialContent,
  clubSlug,
  duesSummary,
}: {
  pageId:         string | null
  initialContent: string
  clubSlug:       string
  duesSummary:    DuesSummary
}) {
  const router        = useRouter()
  const editorRef     = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const [pageId, setPageId] = useState(initialPageId)

  const [, startSave]  = useTransition()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const [styleAnchor, setStyleAnchor] = useState<HTMLElement | null>(null)
  const [fontAnchor,  setFontAnchor]  = useState<HTMLElement | null>(null)
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

  return (
    <PageEditorSheet
      title="Join / Renew Page"
      backHref={`/${clubSlug}/admin/content/navigation`}
      headerRight={
        <>
          {saveStatus === 'saved' && (
            <Typography sx={{ fontSize: 13, color: 'success.main' }}>Saved</Typography>
          )}
          {saveStatus === 'error' && (
            <Typography sx={{ fontSize: 13, color: 'error.main' }}>Save failed</Typography>
          )}
          <Button
            variant="outlined" color="secondary" size="small"
            endIcon={<OpenInNewIcon sx={{ fontSize: 15 }} />}
            href={`/${clubSlug}/our-club/join`}
            target="_blank"
            component="a"
          >
            View page
          </Button>
          <Button
            variant="outlined" color="secondary" size="small"
            onClick={() => router.push(`/${clubSlug}/admin/content/navigation`)}
          >
            Cancel
          </Button>
          <Button
            variant="contained" size="small"
            disabled={saveStatus === 'saving'}
            onClick={handleSave}
          >
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
          <Menu anchorEl={styleAnchor} open={Boolean(styleAnchor)} onClose={() => setStyleAnchor(null)}
            slotProps={{ list: MENU_FOCUS_PROPS }}>
            {TEXT_STYLES.map(s => (
              <MenuItem key={s.tag}
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
          <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

          <DropdownBtn label={activeFont} title="Font family"
            onMouseDown={e => { e.preventDefault(); setFontAnchor(e.currentTarget) }} />
          <Menu anchorEl={fontAnchor} open={Boolean(fontAnchor)} onClose={() => setFontAnchor(null)}
            slotProps={{ list: MENU_FOCUS_PROPS }}>
            {FONT_FAMILIES.map(f => (
              <MenuItem key={f.value}
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
          <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

          <ToolbarBtn title="Bold"      onMouseDown={() => exec('bold')}>      <FormatBoldIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
          <ToolbarBtn title="Italic"    onMouseDown={() => exec('italic')}>    <FormatItalicIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
          <ToolbarBtn title="Underline" onMouseDown={() => exec('underline')}> <FormatUnderlinedIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

          <ToolbarBtn title="Bulleted list" onMouseDown={() => exec('insertUnorderedList')}><FormatListBulletedIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
          <ToolbarBtn title="Numbered list" onMouseDown={() => exec('insertOrderedList')}>  <FormatListNumberedIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

          <ToolbarBtn title="Align left"   onMouseDown={() => exec('justifyLeft')}>   <FormatAlignLeftIcon   sx={{ fontSize: 16 }} /></ToolbarBtn>
          <ToolbarBtn title="Align center" onMouseDown={() => exec('justifyCenter')}> <FormatAlignCenterIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
          <ToolbarBtn title="Align right"  onMouseDown={() => exec('justifyRight')}>  <FormatAlignRightIcon  sx={{ fontSize: 16 }} /></ToolbarBtn>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

          <ToolbarBtn title="Insert link" onMouseDown={() => {
            restoreSelection()
            const url = window.prompt('Enter URL:')
            if (url) exec('createLink', url)
          }}><LinkIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
          <ToolbarBtn title="Remove link" onMouseDown={() => exec('unlink')}><LinkOffIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

          <ToolbarBtn title="Clear formatting" onMouseDown={() => exec('removeFormat')}><FormatClearIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
        </>
      }
    >
      {/* ── Body: editor + dues panel ──────────────────────────────────────── */}
      <Box sx={{ maxWidth: 1140, mx: 'auto', py: 4, px: 3, display: 'flex', gap: 3, alignItems: 'flex-start' }}>

        {/* Editor */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onSelect={() => {
              const sel = window.getSelection()
              if (!sel || sel.rangeCount === 0) return
              const range = sel.getRangeAt(0)
              if (editorRef.current?.contains(range.commonAncestorContainer))
                savedRangeRef.current = range.cloneRange()
            }}
            sx={{
              minHeight: 400,
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

        {/* Dues panel */}
        <DuesPanel dues={duesSummary} clubSlug={clubSlug} />

      </Box>
    </PageEditorSheet>
  )
}

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
import InfoOutlinedIcon       from '@mui/icons-material/InfoOutlined'
import { saveJoinPageContent } from './actions'
import type { ManualMethod } from '@/app/[clubSlug]/(admin)/admin/dues-payment/actions'
import PageEditorSheet        from '@/components/admin/PageEditorSheet'

const CSS_FONT_LORA = "var(--font-lora, 'Lora', Georgia, serif)"

const TEXT_STYLES = [
  { label: 'Normal text', tag: 'p',  sx: { fontSize: 13, fontFamily: CSS_FONT_LORA } },
  { label: 'Heading 1',   tag: 'h1', sx: { fontSize: 20, fontWeight: 700, fontFamily: CSS_FONT_LORA } },
  { label: 'Heading 2',   tag: 'h2', sx: { fontSize: 16, fontWeight: 600, fontFamily: CSS_FONT_LORA } },
  { label: 'Heading 3',   tag: 'h3', sx: { fontSize: 14, fontWeight: 600, fontFamily: CSS_FONT_LORA } },
]

const MENU_FOCUS_PROPS = {
  disableAutoFocus: true, disableEnforceFocus: true, disableRestoreFocus: true,
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

function ToolbarBtn({ title, onMouseDown, active, children }: {
  title: string; onMouseDown: () => void; active?: boolean; children: React.ReactNode
}) {
  return (
    <Tooltip title={title} placement="top">
      <Box component="button" onMouseDown={e => { e.preventDefault(); onMouseDown() }}
        sx={{ ...btnSx, width: 28, height: 28, ...(active ? { bgcolor: 'action.selected', color: 'text.primary' } : {}) }}>
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

const METHOD_LABELS: Record<ManualMethod, string> = {
  cheque: 'Cheque', etransfer: 'e-Transfer', 'paypal-link': 'PayPal',
  venmo: 'Venmo', zelle: 'Zelle', cashapp: 'Cash App',
}

function MethodDetail({ method, dues }: { method: ManualMethod; dues: DuesSummary }) {
  const detail = (() => {
    switch (method) {
      case 'cheque':      return dues.chequePayableTo ? `Payable to "${dues.chequePayableTo}"` : null
      case 'etransfer':   return dues.etransferEmail  || null
      case 'paypal-link': return dues.paypalLink      || null
      case 'venmo':       return dues.venmoHandle     || null
      case 'cashapp':     return dues.cashappHandle   || null
      case 'zelle':       return dues.zelleContact    || null
    }
  })()
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary' }}>{METHOD_LABELS[method]}</Typography>
      {detail && <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{detail}</Typography>}
    </Box>
  )
}

function DuesPanel({ dues, clubSlug }: { dues: DuesSummary; clubSlug: string }) {
  const isFree = !dues.annualAmount
  return (
    <Box sx={{
      width: 272, flexShrink: 0,
      bgcolor: '#FFFFFF',
      border: '1px solid rgba(0,0,0,0.14)',
      borderRadius: '12px',
      p: 2.5,
      position: 'sticky', top: 24,
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'text.secondary' }}>
          Dues &amp; Payment
        </Typography>
        <Box component="a" href={`/${clubSlug}/admin/dues-payment`}
          sx={{ fontSize: 12, color: 'var(--action-primary)', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 0.5, '&:hover': { textDecoration: 'underline' } }}>
          Edit →
        </Box>
      </Box>

      {/* Amount */}
      <Box sx={{ mb: 1.5 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'text.secondary', mb: 0.75 }}>
          Annual dues
        </Typography>
        {isFree ? (
          <Typography sx={{ fontSize: 14, color: 'text.primary', fontWeight: 500 }}>Free — no charge to join</Typography>
        ) : (
          <Typography sx={{ fontSize: 18, color: 'text.primary', fontWeight: 700 }}>
            ${dues.annualAmount!.toFixed(2)}
            <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 400, ml: 0.5 }}>/ year</Typography>
          </Typography>
        )}
      </Box>

      {/* Payment methods */}
      {!isFree && dues.methods.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'text.secondary', mb: 1 }}>
            Payment methods
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {dues.methods.map(m => <MethodDetail key={m} method={m} dues={dues} />)}
          </Box>
        </Box>
      )}
      {!isFree && dues.methods.length === 0 && (
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1.5 }}>No payment methods configured yet.</Typography>
      )}

      {/* Admin note */}
      <Box sx={{
        mt: 1.5, p: 1.5, borderRadius: '8px',
        bgcolor: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)',
        display: 'flex', gap: 1, alignItems: 'flex-start',
      }}>
        <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0, mt: '1px' }} />
        <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.5 }}>
          This panel is auto-generated from your{' '}
          <Box component="a" href={`/${clubSlug}/admin/dues-payment`}
            sx={{ color: 'var(--action-primary)', textDecoration: 'none', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>
            Dues &amp; Payment settings
          </Box>
          {' '}— edit amounts and methods there.
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
  const [isDirty, setIsDirty] = useState(false)

  const [, startSave]  = useTransition()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const [styleAnchor, setStyleAnchor] = useState<HTMLElement | null>(null)
  const [activeStyle, setActiveStyle] = useState('Normal text')

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialContent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const restoreSelection = () => {
    if (!savedRangeRef.current || !editorRef.current) return
    const sel = window.getSelection()
    if (!sel) return
    sel.removeAllRanges()
    if (editorRef.current.contains(savedRangeRef.current.commonAncestorContainer))
      sel.addRange(savedRangeRef.current)
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
        setIsDirty(false)
        if (res.newPageId) setPageId(res.newPageId)
      }
      setTimeout(() => setSaveStatus('idle'), 2500)
    })
  }

  return (
    <PageEditorSheet
      title="Join / Renew Page"
      backHref={`/${clubSlug}/admin/content/navigation`}
      isDirty={isDirty}
      headerRight={
        <>
          {saveStatus === 'saved' && <Typography sx={{ fontSize: 13, color: 'success.main' }}>Saved</Typography>}
          {saveStatus === 'error' && <Typography sx={{ fontSize: 13, color: 'error.main' }}>Save failed</Typography>}
          <Button variant="outlined" color="secondary" size="small"
            onClick={() => router.push(`/${clubSlug}/admin/content/navigation`)}>
            Cancel
          </Button>
          <Button variant="contained" size="small" disabled={saveStatus === 'saving'} onClick={handleSave}>
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
                sx={s.sx}>{s.label}</MenuItem>
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

          <ToolbarBtn title="Insert link" onMouseDown={() => { restoreSelection(); const url = window.prompt('Enter URL:'); if (url) exec('createLink', url) }}><LinkIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
          <ToolbarBtn title="Remove link" onMouseDown={() => exec('unlink')}><LinkOffIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

          <ToolbarBtn title="Clear formatting" onMouseDown={() => exec('removeFormat')}><FormatClearIcon sx={{ fontSize: 16 }} /></ToolbarBtn>
        </>
      }
    >
      <Box sx={{ maxWidth: 1140, mx: 'auto', py: 4, px: 3, display: 'flex', gap: 3, alignItems: 'flex-start' }}>

        {/* Editor */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Page title */}
          <Typography sx={{
            fontFamily: "var(--font-lora, 'Lora', Georgia, serif)",
            fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em',
            color: '#1A1A1A', mb: 3, lineHeight: 1.2,
          }}>
            Join / Renew
          </Typography>
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
            onInput={() => setIsDirty(true)}
            sx={{
              minHeight: 400, outline: 'none',
              fontFamily: CSS_FONT_LORA,
              fontSize: 16, lineHeight: 1.8, color: '#1A1A1A',
              '& h1': { fontFamily: CSS_FONT_LORA, fontSize: '1.7em',  fontWeight: 700, lineHeight: 1.25, mt: '1em', mb: '0.4em',  letterSpacing: '-0.02em', color: '#1A1A1A' },
              '& h2': { fontFamily: CSS_FONT_LORA, fontSize: '1.3em',  fontWeight: 600, lineHeight: 1.3,  mt: '1em', mb: '0.35em', letterSpacing: '-0.01em', color: '#1A1A1A' },
              '& h3': { fontFamily: CSS_FONT_LORA, fontSize: '1.05em', fontWeight: 600, lineHeight: 1.35, mt: '1em', mb: '0.3em',  color: '#1A1A1A' },
              '& p':  { fontFamily: CSS_FONT_LORA, margin: '0 0 0.9em', color: '#696969', lineHeight: 1.8 },
              '& ul, & ol': { fontFamily: CSS_FONT_LORA, paddingLeft: '1.75em', margin: '0.5em 0 0.8em', color: '#696969' },
              '& li': { display: 'list-item', lineHeight: 1.8, mb: '0.15em' },
              '& a':  { color: '#1A6FC4', textDecoration: 'underline', textUnderlineOffset: '2px' },
              '& strong': { fontWeight: 700, color: '#1A1A1A' },
            }}
          />
        </Box>

        {/* Dues panel */}
        <DuesPanel dues={duesSummary} clubSlug={clubSlug} />

      </Box>
    </PageEditorSheet>
  )
}

'use client'

import { useState, useTransition } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon        from '@mui/icons-material/Add'
import DeleteForeverIcon  from '@mui/icons-material/DeleteForever'
import OpenInNewIcon  from '@mui/icons-material/OpenInNew'
import {
  addSocialAccount,
  deleteSocialAccount,
  updatePanelShownSocials,
} from '@/lib/social-accounts/actions'
import {
  PLATFORM_LIST,
  platformLabel,
  type SocialAccount,
  type SocialPlatform,
} from '@/lib/social-accounts/types'

// ─── Manage mode ──────────────────────────────────────────────────────────────
// Full CRUD for the club's master social account list.
// Used by Club Basics.

function ManageBody({
  accounts,
  onAccountsChange,
}: {
  accounts:         SocialAccount[]
  onAccountsChange: (a: SocialAccount[]) => void
}) {
  const [adding, setAdding]     = useState(false)
  const [platform, setPlatform] = useState<SocialPlatform>('instagram')
  const [url, setUrl]           = useState('')
  const [label, setLabel]       = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [, startAdd]            = useTransition()
  const [, startDel]            = useTransition()

  const placeholder = PLATFORM_LIST.find(p => p.value === platform)?.placeholder ?? 'https://...'

  const handleAdd = () => {
    if (!url.trim()) return
    setAddError(null)
    startAdd(async () => {
      const res = await addSocialAccount(platform, url.trim(), label.trim() || null)
      if (res.error) { setAddError(res.error); return }
      onAccountsChange([...accounts, res.account!])
      setAdding(false)
      setUrl('')
      setLabel('')
      setPlatform('instagram')
    })
  }

  const handleDelete = (id: string) => {
    startDel(async () => {
      await deleteSocialAccount(id)
      onAccountsChange(accounts.filter(a => a.id !== id))
    })
  }

  return (
    <Box>
      {accounts.length === 0 && !adding && (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', py: 1 }}>
          No social accounts yet. Add one below.
        </Typography>
      )}

      {/* Existing accounts */}
      {accounts.map((acct, i) => (
        <Box key={acct.id} sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25,
          borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
              {platformLabel(acct.platform, acct.label)}
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {acct.url}
            </Typography>
          </Box>
          <Tooltip title="Open URL">
            <IconButton size="small" component="a" href={acct.url} target="_blank" rel="noopener">
              <OpenInNewIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove">
            <IconButton size="small" onClick={() => handleDelete(acct.id)} sx={{ color: 'error.main' }}>
              <DeleteForeverIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ))}

      {/* Add form */}
      {adding ? (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Select size="small" value={platform} onChange={e => setPlatform(e.target.value as SocialPlatform)} sx={{ fontSize: 13 }}>
            {PLATFORM_LIST.map(p => (
              <MenuItem key={p.value} value={p.value} sx={{ fontSize: 13 }}>{p.label}</MenuItem>
            ))}
          </Select>
          {platform === 'custom' && (
            <TextField size="small" label="Display name" value={label}
              onChange={e => setLabel(e.target.value)} placeholder="e.g. Our Photo Gallery" />
          )}
          <TextField size="small" label="URL" value={url}
            onChange={e => setUrl(e.target.value)} placeholder={placeholder} />
          {addError && <Typography sx={{ fontSize: 12, color: 'error.main' }}>{addError}</Typography>}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" size="small" onClick={handleAdd} disabled={!url.trim()}>Add</Button>
            <Button variant="outlined" color="secondary" size="small" onClick={() => { setAdding(false); setUrl(''); setLabel('') }}>Cancel</Button>
          </Box>
        </Box>
      ) : (
        <Button
          startIcon={<AddIcon />}
          size="small"
          variant="outlined"
          color="secondary"
          sx={{ mt: 1.5 }}
          onClick={() => setAdding(true)}
        >
          Add account
        </Button>
      )}
    </Box>
  )
}

// ─── Pick mode ────────────────────────────────────────────────────────────────
// Select which existing accounts to show (About panel / Homepage).
// Also allows adding new accounts inline.

function PickBody({
  accounts,
  selectedIds,
  onChange,
  clubSlug,
}: {
  accounts:    SocialAccount[]
  selectedIds: string[]
  onChange:    (ids: string[]) => void
  clubSlug:    string
}) {
  const [localAccounts, setLocalAccounts] = useState(accounts)
  const [adding, setAdding]     = useState(false)
  const [platform, setPlatform] = useState<SocialPlatform>('instagram')
  const [url, setUrl]           = useState('')
  const [label, setLabel]       = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [, startAdd]            = useTransition()

  const placeholder = PLATFORM_LIST.find(p => p.value === platform)?.placeholder ?? 'https://...'

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id])
  }

  const handleAdd = () => {
    if (!url.trim()) return
    setAddError(null)
    startAdd(async () => {
      const res = await addSocialAccount(platform, url.trim(), label.trim() || null)
      if (res.error) { setAddError(res.error); return }
      const newAcct = res.account!
      setLocalAccounts(prev => [...prev, newAcct])
      onChange([...selectedIds, newAcct.id])
      setAdding(false)
      setUrl('')
      setLabel('')
      setPlatform('instagram')
    })
  }

  return (
    <Box>
      {localAccounts.length === 0 && !adding && (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', py: 1 }}>
          No social accounts configured yet.
        </Typography>
      )}

      {localAccounts.map(acct => (
        <Box key={acct.id} sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, py: 1,
          borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Checkbox
            size="small"
            checked={selectedIds.includes(acct.id)}
            onChange={() => toggle(acct.id)}
            sx={{ p: 0 }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 13 }}>
              {platformLabel(acct.platform, acct.label)}
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {acct.url}
            </Typography>
          </Box>
        </Box>
      ))}

      {/* Add inline */}
      {adding ? (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Select size="small" value={platform} onChange={e => setPlatform(e.target.value as SocialPlatform)} sx={{ fontSize: 13 }}>
            {PLATFORM_LIST.map(p => (
              <MenuItem key={p.value} value={p.value} sx={{ fontSize: 13 }}>{p.label}</MenuItem>
            ))}
          </Select>
          {platform === 'custom' && (
            <TextField size="small" label="Display name" value={label}
              onChange={e => setLabel(e.target.value)} placeholder="e.g. Our Photo Gallery" />
          )}
          <TextField size="small" label="URL" value={url}
            onChange={e => setUrl(e.target.value)} placeholder={placeholder} />
          {addError && <Typography sx={{ fontSize: 12, color: 'error.main' }}>{addError}</Typography>}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" size="small" onClick={handleAdd} disabled={!url.trim()}>Add</Button>
            <Button variant="outlined" color="secondary" size="small" onClick={() => { setAdding(false); setUrl(''); setLabel('') }}>Cancel</Button>
          </Box>
        </Box>
      ) : (
        <Button
          startIcon={<AddIcon />}
          size="small"
          variant="outlined"
          color="secondary"
          sx={{ mt: 1.5 }}
          onClick={() => setAdding(true)}
        >
          Add new account
        </Button>
      )}

      <Box sx={{ mt: 2, p: 1.5, borderRadius: '6px', bgcolor: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.5 }}>
          {'Manage the full list of social accounts in '}
          <Box component="a" href={`/${clubSlug}/admin/settings`}
            sx={{ color: 'var(--action-primary)', textDecoration: 'none', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>
            Club Basics
          </Box>
        </Typography>
      </Box>
    </Box>
  )
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type SocialAccountsModalMode = 'manage' | 'pick'

export interface SocialAccountsModalProps {
  open:              boolean
  onClose:           () => void
  mode:              SocialAccountsModalMode
  accounts:          SocialAccount[]
  clubSlug:          string
  // manage mode
  onAccountsChange?: (accounts: SocialAccount[]) => void
  // pick mode
  selectedIds?:      string[]
  onSelectionSave?:  (ids: string[]) => void
}

export default function SocialAccountsModal({
  open, onClose, mode, accounts, clubSlug,
  onAccountsChange,
  selectedIds = [],
  onSelectionSave,
}: SocialAccountsModalProps) {
  const [localAccounts, setLocalAccounts] = useState(accounts)
  const [localSelected, setLocalSelected] = useState(selectedIds)
  const [saving, startSave]               = useTransition()

  // Reset local state when modal opens
  const handleEnter = () => {
    setLocalAccounts(accounts)
    setLocalSelected(selectedIds)
  }

  const handleAccountsChange = (updated: SocialAccount[]) => {
    setLocalAccounts(updated)
    onAccountsChange?.(updated)
  }

  const handleSavePick = () => {
    startSave(async () => {
      await updatePanelShownSocials(localSelected)
      onSelectionSave?.(localSelected)
      onClose()
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>
        {mode === 'manage' ? 'Social accounts' : 'Show social accounts'}
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        {mode === 'manage' ? (
          <ManageBody accounts={localAccounts} onAccountsChange={handleAccountsChange} />
        ) : (
          <PickBody
            accounts={localAccounts}
            selectedIds={localSelected}
            onChange={setLocalSelected}
            clubSlug={clubSlug}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        {mode === 'manage' ? (
          <Button variant="outlined" color="secondary" onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="outlined" color="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="contained" onClick={handleSavePick} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

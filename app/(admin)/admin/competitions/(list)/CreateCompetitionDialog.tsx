'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  FormControlLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material'
import { AnimatedReveal } from '../wizard/shared'
import type { CompetitionConfig } from '@/types/competition'

type Template = {
  id:     string
  name:   string
  config: CompetitionConfig
}

type CompetitionStatus = 'draft' | 'open' | 'judging' | 'closed'

const STATUS_OPTIONS: { value: CompetitionStatus; label: string }[] = [
  { value: 'draft',   label: 'Draft'   },
  { value: 'open',    label: 'Open'    },
  { value: 'judging', label: 'Judging' },
  { value: 'closed',  label: 'Closed'  },
]

export default function CreateCompetitionDialog({
  open,
  onClose,
  templates,
  members,
}: {
  open:      boolean
  onClose:   () => void
  templates: Template[]
  members:   { id: string; name: string }[]
}) {
  const router = useRouter()

  const [templateId,     setTemplateId]     = useState('')
  const [name,           setName]           = useState('')
  const [showDesc,       setShowDesc]       = useState(false)
  const [description,    setDescription]    = useState('')
  const [opensAt,        setOpensAt]        = useState('')
  const [closesAt,       setClosesAt]       = useState('')
  const [judgingAt,      setJudgingAt]      = useState('')
  const [status,         setStatus]         = useState<CompetitionStatus>('draft')
  const [judges,         setJudges]         = useState<string[]>([])
  const [errors,         setErrors]         = useState<Record<string, string>>({})
  const [saving,         setSaving]         = useState(false)
  const [toast,          setToast]          = useState<string | null>(null)

  const selectedTemplate = templates.find(t => t.id === templateId)
  const judgeSlots       = selectedTemplate?.config?.numberOfJudges ?? 0

  const selectTemplate = (id: string) => {
    const tpl = templates.find(t => t.id === id)
    setTemplateId(id)
    if (tpl && !name) setName(tpl.name)
    setJudges(Array(tpl?.config?.numberOfJudges ?? 0).fill(''))
  }

  const setJudgeAtSlot = (index: number, memberId: string) => {
    setJudges(prev => {
      const next = [...prev]
      next[index] = memberId
      return next
    })
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!templateId) errs.templateId = 'Select a template'
    if (!name.trim()) errs.name = 'Competition name is required'
    if (!opensAt)     errs.opensAt = 'Required'
    if (!closesAt)    errs.closesAt = 'Required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async (saveStatus: CompetitionStatus) => {
    if (!validate()) return
    setSaving(true)
    try {
      const { createCompetitionFromTemplate } = await import('../actions')
      await createCompetitionFromTemplate({
        templateId,
        title:       name,
        description: showDesc ? description : null,
        opensAt:     opensAt  || null,
        closesAt:    closesAt || null,
        status:      saveStatus,
        judgeNames:  judges.filter(Boolean),
        submissionLimit: selectedTemplate?.config?.maxEntriesPerMember ?? 4,
      })
      setToast(`"${name}" created.`)
      onClose()
      router.push('/admin/competitions')
    } catch {
      setToast('Failed to create competition.')
    } finally {
      setSaving(false)
    }
  }

  const assignedIds = judges.filter(Boolean)

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        <DialogContent sx={{ px: 3, pt: 3, pb: 2 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 0.5 }}>Create competition</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose a template for the rules, then fill in the details for this run.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            {/* Template */}
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', mb: 0.75 }}>
                Based on template
              </Typography>
              <Select
                fullWidth
                size="small"
                displayEmpty
                value={templateId}
                onChange={e => selectTemplate(e.target.value)}
                error={!!errors.templateId}
                sx={{ fontSize: 13, fontFamily: 'inherit' }}
              >
                <MenuItem value="" disabled sx={{ fontSize: 13, fontFamily: 'inherit' }}>
                  Choose a template…
                </MenuItem>
                {templates.map(t => (
                  <MenuItem key={t.id} value={t.id} sx={{ fontSize: 13, fontFamily: 'inherit' }}>{t.name}</MenuItem>
                ))}
              </Select>
              {errors.templateId && <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.5 }}>{errors.templateId}</Typography>}
            </Box>

            {/* Name */}
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', mb: 0.75 }}>
                Competition name
              </Typography>
              <OutlinedInput
                fullWidth
                size="small"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. April 2026 Monthly Competition"
                error={!!errors.name}
              />
              {errors.name && <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.5 }}>{errors.name}</Typography>}
            </Box>

            {/* Description toggle */}
            <FormControlLabel
              control={<Checkbox size="small" checked={showDesc} onChange={e => setShowDesc(e.target.checked)} />}
              label={<Typography sx={{ fontSize: 13 }}>Add a description or theme</Typography>}
              sx={{ ml: 0 }}
            />
            <AnimatedReveal show={showDesc}>
              <TextField
                multiline
                fullWidth
                rows={3}
                size="small"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the theme or any special notes…"
                slotProps={{ input: { sx: { fontFamily: 'inherit', fontSize: 13 } } }}
              />
            </AnimatedReveal>

            {/* Dates */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', mb: 0.75 }}>
                  Submission opens
                </Typography>
                <OutlinedInput
                  fullWidth
                  size="small"
                  type="date"
                  value={opensAt}
                  onChange={e => setOpensAt(e.target.value)}
                  error={!!errors.opensAt}
                  slotProps={{ htmlInput: { style: { fontSize: 13 } } }}
                />
                {errors.opensAt && <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.5 }}>{errors.opensAt}</Typography>}
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', mb: 0.75 }}>
                  Submission closes
                </Typography>
                <OutlinedInput
                  fullWidth
                  size="small"
                  type="date"
                  value={closesAt}
                  onChange={e => setClosesAt(e.target.value)}
                  error={!!errors.closesAt}
                  slotProps={{ htmlInput: { style: { fontSize: 13 } } }}
                />
                {errors.closesAt && <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.5 }}>{errors.closesAt}</Typography>}
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', mb: 0.75 }}>
                Judging completed by (optional)
              </Typography>
              <OutlinedInput
                size="small"
                type="date"
                value={judgingAt}
                onChange={e => setJudgingAt(e.target.value)}
                slotProps={{ htmlInput: { style: { fontSize: 13 } } }}
                sx={{ width: 200 }}
              />
            </Box>

            {/* Judge assignment — shown after template is selected */}
            <AnimatedReveal show={!!templateId && judgeSlots > 0}>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>Assign judges</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {judgeSlots} judge slot{judgeSlots !== 1 ? 's' : ''} from the template.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {Array.from({ length: judgeSlots }).map((_, i) => {
                    const available = members.filter(m => m.id === judges[i] || !assignedIds.includes(m.id))
                    return (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#F7F8FA', borderRadius: 1.5, px: 2, py: 1.5 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', width: 56, flexShrink: 0 }}>
                          Judge {i + 1}
                        </Typography>
                        <Select
                          fullWidth
                          size="small"
                          displayEmpty
                          value={judges[i] ?? ''}
                          onChange={e => setJudgeAtSlot(i, e.target.value)}
                          sx={{ fontSize: 13, fontFamily: 'inherit' }}
                        >
                          <MenuItem value="" sx={{ fontSize: 13, fontFamily: 'inherit' }}>Select a judge…</MenuItem>
                          {available.map(m => (
                            <MenuItem key={m.id} value={m.id} sx={{ fontSize: 13, fontFamily: 'inherit' }}>{m.name}</MenuItem>
                          ))}
                        </Select>
                      </Box>
                    )
                  })}
                </Box>

                <Box sx={{ mt: 2, display: 'flex', gap: 1.5, p: 2, bgcolor: '#F7F8FA', borderRadius: 1.5 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7E8EA3" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5 }}>
                    Judges access the judging interface via a unique link generated once submissions close. You can share links from the competition dashboard.
                  </Typography>
                </Box>
              </Box>
            </AnimatedReveal>

          </Box>
        </DialogContent>

        {/* Footer */}
        <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" color="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => handleSave('draft')}
            disabled={saving}
          >
            Save as draft
          </Button>
          <Button
            variant="contained"
            onClick={() => handleSave(status)}
            disabled={saving}
          >
            {saving ? 'Creating…' : 'Create competition'}
          </Button>
        </Box>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setToast(null)} sx={{ fontFamily: 'inherit' }}>
          {toast}
        </Alert>
      </Snackbar>
    </>
  )
}

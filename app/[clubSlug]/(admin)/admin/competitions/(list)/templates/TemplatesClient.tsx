'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Menu,
  MenuItem,
  OutlinedInput,
  Snackbar,
  Typography,
} from '@mui/material'
import { StepIndicator }  from '../../wizard/StepIndicator'
import { StepCategories } from '../../wizard/StepCategories'
import { StepJudging }    from '../../wizard/StepJudging'
import { StepAwards }     from '../../wizard/StepAwards'
import { updateTemplate, deleteTemplate, duplicateTemplate } from './actions'
import { defaultConfig, type CompetitionConfig } from '@/types/competition'
import EmptyState from '@/components/admin/EmptyState'

// ─── Types ────────────────────────────────────────────────────────────────────

type Template = {
  id:         string
  name:       string
  config:     CompetitionConfig
  created_at: string
  updated_at: string
  usageCount: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EDIT_STEPS       = ['Entries & submissions', 'Judging & scoring', 'Recognition']
const TOTAL_EDIT_STEPS = 3

const PRESET_LABEL: Record<string, string> = {
  'simple-scored': 'Simple scored',
  'salon':         'Salon style',
  'awards-only':   'Awards only',
  'member-vote':   'Member vote',
  'end-of-year':   'End of year',
}

// ─── Small UI pieces ──────────────────────────────────────────────────────────

function UsageWarningBanner({ usageCount }: { usageCount: number }) {
  return (
    <Box sx={{
      px: 2.5, py: 2, borderRadius: 1.5,
      bgcolor: t => t.palette.mode === 'dark' ? 'rgba(0,151,167,0.10)' : '#F0FAF7',
      border:  t => `1px solid ${t.palette.mode === 'dark' ? 'rgba(0,151,167,0.30)' : '#9DD9C5'}`,
    }}>
      <Typography sx={{ fontSize: 13, lineHeight: 1.6, color: t => t.palette.mode === 'dark' ? '#4ECDE6' : '#0A5742' }}>
        This template has been used in{' '}
        <strong>{usageCount} {usageCount === 1 ? 'competition' : 'competitions'}</strong>.{' '}
        Changes here apply to future competitions only. Existing competitions are unaffected.
      </Typography>
    </Box>
  )
}

function RecognitionDerivedNote() {
  return (
    <Box sx={{
      mb: 3, px: 2.5, py: 2, borderRadius: 1.5,
      bgcolor: t => t.palette.mode === 'dark' ? 'rgba(0,151,167,0.08)' : '#F0FAF7',
      border:  t => `1px solid ${t.palette.mode === 'dark' ? 'rgba(0,151,167,0.25)' : '#BEE3D8'}`,
    }}>
      <Typography sx={{ fontSize: 13, lineHeight: 1.6, color: t => t.palette.mode === 'dark' ? '#4ECDE6' : '#0A5742' }}>
        ℹ Recognition settings have been updated to match your new judging method.
      </Typography>
    </Box>
  )
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5"  r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TemplatesClient({
  templates,
  clubCategories = [],
  clubSlug,
}: {
  templates:       Template[]
  clubCategories?: string[]
  clubSlug:        string
}) {
  const router = useRouter()
  const [activeCats, setActiveCats] = useState<string[]>(
    clubCategories.length ? clubCategories : defaultConfig.categories
  )

  // ── Edit wizard ────────────────────────────────────────────────────────────
  const [wizardOpen,      setWizardOpen]      = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [step,            setStep]            = useState(1)
  const [config,          setConfig]          = useState<CompetitionConfig>(defaultConfig)
  const [savedConfig,     setSavedConfig]     = useState<CompetitionConfig>(defaultConfig)
  const [completedSteps,  setCompletedSteps]  = useState<number[]>([])
  const [saving,          setSaving]          = useState(false)
  const [discardConfirm,  setDiscardConfirm]  = useState(false)

  // ── Inline name editing ────────────────────────────────────────────────────
  const [nameEditing, setNameEditing] = useState(false)
  const [nameDraft,   setNameDraft]   = useState('')

  // ── Kebab menu ─────────────────────────────────────────────────────────────
  const [kebabAnchor,   setKebabAnchor]   = useState<{ el: HTMLElement; tpl: Template } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Template | null>(null)
  const [deleting,      setDeleting]      = useState(false)

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)

  // ── Derived ───────────────────────────────────────────────────────────────
  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig)
  // Has the judging preset changed from the template's original saved value?
  const presetChangedInSession = editingTemplate
    ? config.judgingPreset !== editingTemplate.config.judgingPreset
    : false

  const updateConfig = useCallback((partial: Partial<CompetitionConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }))
  }, [])

  // ── Open edit ──────────────────────────────────────────────────────────────
  const openEdit = (tpl: Template) => {
    setEditingTemplate(tpl)
    setStep(1)
    setConfig(tpl.config)
    setSavedConfig(tpl.config)
    setCompletedSteps([])   // checkmarks only for steps saved this session
    setNameEditing(false)
    setDiscardConfirm(false)
    setWizardOpen(true)
  }

  // ── Save helpers ───────────────────────────────────────────────────────────
  const saveCurrentStep = async (): Promise<boolean> => {
    if (!editingTemplate) return false
    setSaving(true)
    try {
      await updateTemplate(editingTemplate.id, config.name, config)
      setSavedConfig({ ...config })
      setCompletedSteps(prev => prev.includes(step) ? prev : [...prev, step])
      return true
    } catch {
      setToast({ msg: 'Failed to save.', severity: 'error' })
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAndContinue = async () => {
    const ok = await saveCurrentStep()
    if (ok) setStep(s => Math.min(s + 1, TOTAL_EDIT_STEPS))
  }

  const handleSaveAndClose = async () => {
    const ok = await saveCurrentStep()
    if (!ok) return
    setToast({ msg: `"${config.name}" updated.`, severity: 'success' })
    setWizardOpen(false)
    router.refresh()
  }

  const goToStep = (s: number) => {
    if (s === step) return
    if (isDirty) {
      // Auto-save current step before jumping — no confirmation, no toast
      saveCurrentStep().then(() => setStep(s))
    } else {
      setStep(s)
    }
  }

  // ── Cancel ────────────────────────────────────────────────────────────────
  const handleCancel = () => {
    if (isDirty) {
      setDiscardConfirm(true)
    } else {
      setWizardOpen(false)
    }
  }

  // ── Inline name save ──────────────────────────────────────────────────────
  const saveNameChange = async () => {
    const newName = nameDraft.trim()
    setNameEditing(false)
    if (!newName || newName === config.name) return
    const updatedConfig = { ...config, name: newName }
    setConfig(updatedConfig)
    setSaving(true)
    try {
      await updateTemplate(editingTemplate!.id, newName, updatedConfig)
      setSavedConfig(updatedConfig)
    } catch {
      setToast({ msg: 'Failed to save name.', severity: 'error' })
      setConfig(config) // revert on failure
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      await deleteTemplate(deleteConfirm.id)
      setToast({ msg: `"${deleteConfirm.name}" deleted.`, severity: 'success' })
      setDeleteConfirm(null)
      router.refresh()
    } catch {
      setToast({ msg: 'Failed to delete template.', severity: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  // ── Duplicate ──────────────────────────────────────────────────────────────
  const handleDuplicate = async (tpl: Template) => {
    setKebabAnchor(null)
    try {
      await duplicateTemplate(tpl.id)
      setToast({ msg: `"Copy of ${tpl.name}" created.`, severity: 'success' })
      router.refresh()
    } catch {
      setToast({ msg: 'Failed to duplicate template.', severity: 'error' })
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Page header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          Reusable settings for judging rules, awards, and scoring. Templates are saved when you create a competition.
        </Typography>
        <Button
          variant="contained"
          size="small"
          sx={{ flexShrink: 0 }}
          onClick={() => router.push(`/${clubSlug}/admin/competitions/new`)}
        >
          + New template
        </Button>
      </Box>

      {/* Template list */}
      {templates.length === 0 ? (
        <EmptyState
          headline="No templates yet"
          body="Templates are saved automatically the first time you create a competition. Once saved, you can reuse and edit them here."
          action={
            <Button variant="contained" onClick={() => router.push(`/${clubSlug}/admin/competitions/new`)}>
              Create a competition
            </Button>
          }
        />
      ) : (
        <Card variant="outlined">
          {templates.map((tpl, idx) => (
            <Box key={tpl.id}>
              {idx > 0 && <Divider />}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2.5,
                  py: 2,
                  '&:hover': { bgcolor: 'action.hover' },
                  transition: 'background 0.1s',
                }}
              >
                {/* Left: icon + info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                  <Box sx={{ color: 'text.secondary', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
                      {tpl.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mt: 0.25 }}>
                      <Chip
                        label={PRESET_LABEL[tpl.config?.judgingPreset ?? ''] ?? tpl.config?.judgingPreset ?? '—'}
                        size="small"
                        sx={{ fontSize: 11, height: 20, fontFamily: 'inherit', bgcolor: 'background.default', color: 'text.secondary' }}
                      />
                      {tpl.config?.awardsEnabled && (
                        <Chip label="Awards" size="small" sx={{ fontSize: 11, height: 20, fontFamily: 'inherit', bgcolor: 'background.default', color: 'text.secondary' }} />
                      )}
                      {(tpl.config?.seasonPointsEnabled || tpl.config?.judgingPreset === 'simple-scored' || tpl.config?.judgingPreset === 'salon') && (
                        <Chip label="Season points" size="small" sx={{ fontSize: 11, height: 20, fontFamily: 'inherit', bgcolor: 'background.default', color: 'text.secondary' }} />
                      )}
                    </Box>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
                      {tpl.usageCount > 0
                        ? `Used in ${tpl.usageCount} competition${tpl.usageCount === 1 ? '' : 's'}`
                        : 'Never used'}
                    </Typography>
                  </Box>
                </Box>

                {/* Right: date + buttons */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', mr: 0.5 }}>
                    Updated {new Date(tpl.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    onClick={() => openEdit(tpl)}
                    sx={{ fontSize: 12 }}
                  >
                    Edit
                  </Button>
                  <Box
                    component="button"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => setKebabAnchor({ el: e.currentTarget, tpl })}
                    sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 30, height: 30, borderRadius: 1,
                      border: '1px solid', borderColor: 'divider',
                      bgcolor: 'transparent', cursor: 'pointer',
                      color: 'text.secondary',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    aria-label="More options"
                  >
                    <DotsIcon />
                  </Box>
                </Box>
              </Box>
            </Box>
          ))}
        </Card>
      )}

      {/* Kebab dropdown */}
      <Menu
        open={!!kebabAnchor}
        anchorEl={kebabAnchor?.el ?? undefined}
        onClose={() => setKebabAnchor(null)}
        slotProps={{ paper: { sx: { borderRadius: 1.5, minWidth: 200, boxShadow: 3 } } }}
      >
        <MenuItem
          onClick={() => kebabAnchor && handleDuplicate(kebabAnchor.tpl)}
          sx={{ fontSize: 13 }}
        >
          Duplicate
        </MenuItem>
        {kebabAnchor?.tpl.usageCount === 0 ? (
          <MenuItem
            onClick={() => { setDeleteConfirm(kebabAnchor!.tpl); setKebabAnchor(null) }}
            sx={{ fontSize: 13, color: 'error.main' }}
          >
            Delete
          </MenuItem>
        ) : (
          <MenuItem disabled sx={{ fontSize: 12, whiteSpace: 'normal', lineHeight: 1.5 }}>
            Templates used in competitions cannot be deleted
          </MenuItem>
        )}
      </Menu>

      {/* ── Edit wizard dialog ────────────────────────────────────────────── */}
      <Dialog
        open={wizardOpen}
        onClose={handleCancel}
        maxWidth={false}
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2, height: '94vh', width: '100%', maxWidth: 1000, display: 'flex', flexDirection: 'column' } } }}
      >
        {/* Usage warning banner — sits above the header chrome */}
        {editingTemplate && editingTemplate.usageCount > 0 && (
          <Box sx={{ px: '30px', pt: '24px', flexShrink: 0 }}>
            <UsageWarningBanner usageCount={editingTemplate.usageCount} />
          </Box>
        )}

        {/* Header: name + step indicator */}
        <Box sx={{
          px: '30px',
          pt: editingTemplate && editingTemplate.usageCount > 0 ? '16px' : '30px',
          pb: '24px',
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}>
          {/* Inline-editable template name */}
          {nameEditing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Typography sx={{ fontSize: 18, fontWeight: 600, color: 'text.secondary', flexShrink: 0 }}>
                Edit template:
              </Typography>
              <OutlinedInput
                size="small"
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                onBlur={saveNameChange}
                onKeyDown={e => {
                  if (e.key === 'Enter')  { e.preventDefault(); saveNameChange() }
                  if (e.key === 'Escape') { setNameEditing(false) }
                }}
                autoFocus
                sx={{ fontSize: 15, fontWeight: 600, fontFamily: 'inherit' }}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 3 }}>
              <Typography sx={{ fontSize: 18, fontWeight: 600, color: 'text.primary' }}>
                Edit template:
              </Typography>
              <Box
                component="button"
                onClick={() => { setNameDraft(config.name); setNameEditing(true) }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.75,
                  border: 'none', bgcolor: 'transparent', cursor: 'pointer',
                  p: '4px 8px', borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                  fontFamily: 'inherit',
                }}
              >
                <Typography sx={{ fontSize: 18, fontWeight: 600, color: 'text.primary' }}>
                  {config.name}
                </Typography>
                <Box sx={{ color: 'text.secondary', flexShrink: 0, lineHeight: 0 }}>
                  <PencilIcon />
                </Box>
              </Box>
            </Box>
          )}

          <StepIndicator
            currentStep={step}
            completedSteps={completedSteps}
            onStepClick={goToStep}
            steps={EDIT_STEPS}
            allClickable
          />
        </Box>

        {/* Scrollable step content */}
        <DialogContent sx={{ flex: 1, overflowY: 'auto', px: '30px', py: '30px' }}>
          {step === 1 && (
            <StepCategories
              config={config}
              onChange={updateConfig}
              clubCategories={activeCats}
              onAddClubCategory={name => setActiveCats(prev => [...prev, name])}
            />
          )}
          {step === 2 && (
            <StepJudging
              config={config}
              onChange={updateConfig}
              showPresetChangeWarning={
                !!(editingTemplate &&
                  editingTemplate.usageCount > 0 &&
                  config.judgingPreset !== editingTemplate.config.judgingPreset)
              }
            />
          )}
          {step === 3 && (
            <>
              {presetChangedInSession && <RecognitionDerivedNote />}
              <StepAwards
                config={config}
                onChange={updateConfig}
                savedPreset={editingTemplate?.config.judgingPreset}
              />
            </>
          )}
        </DialogContent>

        {/* Footer */}
        <Box sx={{
          px: '30px', py: '24px',
          borderTop: '1px solid', borderColor: 'divider',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          gap: 1.5, flexShrink: 0,
        }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleSaveAndClose}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save & close'}
          </Button>
          {step < TOTAL_EDIT_STEPS && (
            <Button
              variant="contained"
              onClick={handleSaveAndContinue}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save & continue →'}
            </Button>
          )}
        </Box>
      </Dialog>

      {/* ── Discard confirmation ──────────────────────────────────────────── */}
      <Dialog
        open={discardConfirm}
        onClose={() => setDiscardConfirm(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        <DialogTitle sx={{ pb: 0.5 }}>Discard changes to this step?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            Changes you&apos;ve made to <strong>{EDIT_STEPS[step - 1]}</strong> will not be saved.
            {completedSteps.length > 0 && ' Changes you saved on previous steps will be kept.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" color="secondary" onClick={() => setDiscardConfirm(false)}>
            Keep editing
          </Button>
          <Button
            variant="contained"
            onClick={() => { setDiscardConfirm(false); setWizardOpen(false) }}
          >
            Discard &amp; exit
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete confirmation ───────────────────────────────────────────── */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        <DialogTitle sx={{ pb: 0.5 }}>Delete template?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            <strong>{deleteConfirm?.name}</strong> will be permanently deleted. Any competitions that used this template will not be affected.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" color="secondary" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={handleDelete}
            disabled={deleting}
            sx={{
              bgcolor:     t => t.palette.mode === 'dark' ? 'rgba(211,47,47,0.12)' : '#FDEEEE',
              color:       t => t.palette.mode === 'dark' ? '#F09595' : '#7A1515',
              borderColor: 'rgba(211,47,47,0.3)',
              '&:hover': {
                bgcolor:     t => t.palette.mode === 'dark' ? 'rgba(211,47,47,0.22)' : '#F9D0D0',
                borderColor: 'rgba(211,47,47,0.5)',
              },
            }}
          >
            {deleting ? 'Deleting…' : 'Delete template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast?.severity ?? 'success'} onClose={() => setToast(null)} sx={{ fontFamily: 'inherit' }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </>
  )
}

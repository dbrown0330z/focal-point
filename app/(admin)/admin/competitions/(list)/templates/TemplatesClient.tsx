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
  Snackbar,
  Typography,
} from '@mui/material'
import { StepIndicator }  from '../../wizard/StepIndicator'
import { StepBasics }     from '../../wizard/StepBasics'
import { StepCategories } from '../../wizard/StepCategories'
import { StepJudging }    from '../../wizard/StepJudging'
import { StepAwards }     from '../../wizard/StepAwards'
import { StepReview }     from '../../wizard/StepReview'
import { updateTemplate, deleteTemplate } from './actions'
import { defaultConfig, type CompetitionConfig } from '@/types/competition'
import EmptyState from '@/components/admin/EmptyState'

// ─── Types ────────────────────────────────────────────────────────────────────

type Template = {
  id:         string
  name:       string
  config:     CompetitionConfig
  created_at: string
  updated_at: string
}

const TOTAL_STEPS = 5  // template flow: Basics, Categories, Judging, Awards, Review

const PRESET_LABEL: Record<string, string> = {
  'simple-scored': 'Simple scored',
  'salon':         'Salon style',
  'awards-only':   'Awards only',
  'member-vote':   'Member vote',
  'end-of-year':   'End of year',
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TemplatesClient({
  templates,
  clubCategories = [],
}: {
  templates:       Template[]
  clubCategories?: string[]
}) {
  const router = useRouter()

  const [activeCats, setActiveCats] = useState<string[]>(clubCategories.length ? clubCategories : defaultConfig.categories)

  // Wizard modal state
  const [wizardOpen,     setWizardOpen]     = useState(false)
  const [editingId,      setEditingId]      = useState<string | null>(null)
  const [step,           setStep]           = useState(1)
  const [config,         setConfig]         = useState<CompetitionConfig>(defaultConfig)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [errors,         setErrors]         = useState<Record<string, string>>({})
  const [saving,         setSaving]         = useState(false)

  // Delete state
  const [deleteConfirm,  setDeleteConfirm]  = useState<Template | null>(null)
  const [deleting,       setDeleting]       = useState(false)

  // Toast
  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)

  const updateConfig = useCallback((partial: Partial<CompetitionConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }))
  }, [])

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {}
    if (s === 1 && !config.name.trim()) errs.name = 'Template name is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const goNext = () => {
    if (!validateStep(step)) return
    setCompletedSteps(prev => prev.includes(step) ? prev : [...prev, step])
    if (step === 3) {
      const isAwardFocused = config.judgingPreset === 'awards-only' || config.judgingPreset === 'member-vote'
      setConfig(prev => ({
        ...prev,
        awardsEnabled:       isAwardFocused,
        seasonPointsEnabled: !isAwardFocused,
      }))
    }
    setStep(s => Math.min(s + 1, TOTAL_STEPS))
  }

  const goBack = () => setStep(s => Math.max(s - 1, 1))

  const goToStep = (s: number) => {
    if (completedSteps.includes(s) || s === step) setStep(s)
  }

  const openEdit = (tpl: Template) => {
    setEditingId(tpl.id)
    setStep(1)
    setConfig(tpl.config)
    setCompletedSteps([1, 2, 3, 4]) // steps 1-4 navigable when editing
    setErrors({})
    setWizardOpen(true)
  }

  const handleSave = async () => {
    if (!validateStep(step)) return
    setSaving(true)
    try {
      await updateTemplate(editingId!, config.name, config)
      setToast({ msg: `"${config.name}" updated.`, severity: 'success' })
      setWizardOpen(false)
      router.refresh()
    } catch {
      setToast({ msg: 'Failed to save template.', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

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

  return (
    <>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          Reusable settings for judging rules, awards, and scoring. Templates are saved when you create a competition.
        </Typography>
      </Box>

      {/* Template list */}
      {templates.length === 0 ? (
        <EmptyState
          headline="No templates yet"
          body="Templates are saved automatically the first time you create a competition. Once saved, you can reuse and edit them here."
          action={
            <Button variant="contained" onClick={() => router.push('/admin/competitions/new')}>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
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
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', mr: 1 }}>
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
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setDeleteConfirm(tpl)}
                    sx={{
                      fontSize: 12,
                      bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(211,47,47,0.12)' : '#FDEEEE',
                      color: (t) => t.palette.mode === 'dark' ? '#F09595' : '#7A1515',
                      borderColor: 'rgba(211,47,47,0.3)',
                      '&:hover': { bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(211,47,47,0.22)' : '#F9D0D0', borderColor: 'rgba(211,47,47,0.5)' },
                    }}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            </Box>
          ))}
        </Card>
      )}

      {/* ── Template wizard dialog ── */}
      <Dialog
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        maxWidth={false}
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2, height: '94vh', width: '100%', maxWidth: 1000, display: 'flex', flexDirection: 'column' } } }}
      >
        {/* Header — title + step indicator */}
        <Box sx={{ px: '30px', pt: '30px', pb: '24px', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: 'text.primary', mb: 3 }}>
            Edit Competition Template
          </Typography>
          <StepIndicator currentStep={step} completedSteps={completedSteps} onStepClick={goToStep} />
        </Box>

        {/* Scrollable content */}
        <DialogContent sx={{ flex: 1, overflowY: 'auto', px: '30px', py: '30px' }}>
          {step === 1 && (
            <StepBasics
              config={config}
              onChange={updateConfig}
              errors={errors}
              templates={[]}
              selectedTemplateId={null}
              onSelectTemplate={() => {}}
              competitionType={config.competitionType}
              onTypeChange={type => updateConfig({ competitionType: type })}
              onScheduleDirect={() => {}}
              onReviewSettings={() => {}}
              onScratchMode={() => {}}
            />
          )}
          {step === 2 && <StepCategories config={config} onChange={updateConfig} clubCategories={activeCats} onAddClubCategory={name => setActiveCats(prev => [...prev, name])} />}
          {step === 3 && <StepJudging    config={config} onChange={updateConfig} />}
          {step === 4 && <StepAwards     config={config} onChange={updateConfig} />}
          {step === 5 && (
            <StepReview
              config={config}
              onEdit={goToStep}
              saveAsTemplate={false}
              onSaveAsTemplate={() => {}}
              templateName={config.name}
              onTemplateName={name => updateConfig({ name })}
              selectedTemplateId="editing"
            />
          )}
        </DialogContent>

        {/* Footer */}
        <Box sx={{ px: '30px', py: '24px', borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={goBack}
            disabled={step === 1}
          >
            Back
          </Button>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="outlined" color="secondary" onClick={() => setWizardOpen(false)}>
              Cancel
            </Button>
            {step < TOTAL_STEPS ? (
              <Button variant="contained" onClick={goNext}>
                Continue
              </Button>
            ) : (
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            )}
          </Box>
        </Box>
      </Dialog>

      {/* ── Delete confirmation dialog ── */}
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
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(211,47,47,0.12)' : '#FDEEEE',
              color: (t) => t.palette.mode === 'dark' ? '#F09595' : '#7A1515',
              borderColor: 'rgba(211,47,47,0.3)',
              '&:hover': { bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(211,47,47,0.22)' : '#F9D0D0', borderColor: 'rgba(211,47,47,0.5)' },
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

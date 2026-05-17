'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  Snackbar,
  Typography,
} from '@mui/material'
import { StepIndicator }    from '../wizard/StepIndicator'
import { StepBasics }       from '../wizard/StepBasics'
import { StepCategories }   from '../wizard/StepCategories'
import { StepJudging }      from '../wizard/StepJudging'
import { StepAwards }       from '../wizard/StepAwards'
import { StepReview }       from '../wizard/StepReview'
import { StepSchedule }     from '../wizard/StepSchedule'
import { saveTemplate }                from './templates/actions'
import { createCompetitionFromSchedule, updateCompetitionFromSchedule } from '../actions'
import {
  defaultConfig,
  defaultSchedule,
  type CompetitionConfig,
  type CompetitionSchedule,
  type CompetitionType,
} from '@/types/competition'

type Template = {
  id:     string
  name:   string
  config: CompetitionConfig
}

type EditCompetition = {
  id:        string
  title:     string
  opens_at:  string | null
  closes_at: string | null
  judging_at: string | null
}

const TOTAL_STEPS = 6

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreateCompetitionWizard({
  open,
  onClose,
  templates,
  members,
  meetingLocations,
  clubCategories = [],
  clubDefaults = {},
  editCompetition = null,
  clubSlug,
}: {
  open:              boolean
  onClose:           () => void
  templates:         Template[]
  members:           { id: string; name: string }[]
  meetingLocations:  string[]
  clubCategories?:   string[]
  clubDefaults?:     Partial<CompetitionConfig>
  editCompetition?:  EditCompetition | null
  clubSlug:          string
}) {
  const baseConfig: CompetitionConfig = { ...defaultConfig, ...clubDefaults }
  const isEditMode = editCompetition !== null
  const [competitionType, setCompetitionType] = useState<CompetitionType>('digital')
  const [activeCats, setActiveCats] = useState<string[]>(clubCategories?.length ? clubCategories : baseConfig.categories)

  // Wizard state
  const [step,           setStep]           = useState(1)
  const [config,         setConfig]         = useState<CompetitionConfig>(baseConfig)
  const [schedule,       setSchedule]       = useState<CompetitionSchedule>(defaultSchedule)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [errors,         setErrors]         = useState<Record<string, string>>({})

  // Template selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [step1Scratch,       setStep1Scratch]       = useState(false) // true = scratch mode active

  // Template save (step 5)
  const [saveAsTemplate, setSaveAsTemplate] = useState(true)
  const [templateName,   setTemplateName]   = useState('')

  const [saving,       setSaving]       = useState<null | 'draft' | 'open'>(null)
  const [toast,        setToast]        = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)
  const [stepBlocked,  setStepBlocked]  = useState(false)

  const updateConfig = useCallback((partial: Partial<CompetitionConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }))
  }, [])

  const updateSchedule = useCallback((partial: Partial<CompetitionSchedule>) => {
    setSchedule(prev => ({ ...prev, ...partial }))
  }, [])

  const handleTypeChange = useCallback((type: CompetitionType) => {
    setCompetitionType(type)
    setConfig(prev => ({ ...prev, competitionType: type }))
  }, [])

  const selectTemplate = (id: string | null, tplConfig: CompetitionConfig | null) => {
    setSelectedTemplateId(id)
    if (tplConfig) {
      setConfig(() => ({ ...tplConfig, competitionType }))
    } else {
      setConfig({ ...baseConfig, competitionType })
    }
  }

  const handleOpen = useCallback(() => {
    setErrors({})
    if (editCompetition) {
      setStep(6)
      setCompletedSteps([1, 2, 3, 4, 5])
      setSchedule({
        ...defaultSchedule,
        instanceName:         editCompetition.title,
        submissionsOpenDate:  editCompetition.opens_at?.split('T')[0]  ?? '',
        submissionsCloseDate: editCompetition.closes_at?.split('T')[0] ?? '',
        judgingCloseDate:     (editCompetition.judging_at ?? '').split('T')[0] ?? '',
      })
    } else {
      setCompetitionType('digital')
      setStep(1)
      setConfig({ ...baseConfig, competitionType: 'digital', categories: activeCats.length ? activeCats : baseConfig.categories })
      setSchedule({ ...defaultSchedule })
      setCompletedSteps([])
      setSelectedTemplateId(null)
      setStep1Scratch(false)
      setSaveAsTemplate(true)
      setTemplateName('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editCompetition])

  useEffect(() => {
    if (open) handleOpen()
  }, [open, handleOpen])

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {}
    if (s === 6) {
      if (!schedule.instanceName.trim())  errs.instanceName         = 'Competition name is required'
      if (!schedule.submissionsOpenDate)  errs.submissionsOpenDate  = 'Required'
      if (!schedule.submissionsCloseDate) errs.submissionsCloseDate = 'Required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const goNext = () => {
    if (!validateStep(step)) return
    setCompletedSteps(prev => prev.includes(step) ? prev : [...prev, step])
    if (step === 5) {
      const fmt = (d: Date) => d.toISOString().split('T')[0]
      const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

      // Auto-populate competition name if not yet set
      if (!schedule.instanceName) {
        const now   = new Date()
        const month = now.toLocaleString('default', { month: 'long' })
        const year  = now.getFullYear()
        const base  = selectedTemplateId
          ? templates.find(t => t.id === selectedTemplateId)?.name ?? ''
          : ''
        const suggested = base ? `${base} — ${month} ${year}` : `${month} ${year}`
        setSchedule(prev => ({ ...prev, instanceName: suggested }))
      }

      // Auto-populate dates if not yet set
      if (!schedule.submissionsOpenDate) {
        const today     = new Date()
        const subOpen   = today
        const subClose  = addDays(today, 14)
        const jugOpen   = addDays(subClose, 3)
        const jugClose  = addDays(jugOpen, 10)
        setSchedule(prev => ({
          ...prev,
          submissionsOpenDate:  fmt(subOpen),
          submissionsCloseDate: fmt(subClose),
          judgingOpenDate:      fmt(jugOpen),
          judgingCloseDate:     fmt(jugClose),
        }))
      }
    }
    setStep(s => Math.min(s + 1, TOTAL_STEPS))
  }

  const goBack = () => setStep(s => Math.max(s - 1, 1))

  const goToStep = (s: number) => {
    if (completedSteps.includes(s) || s === step || s === step + 1) setStep(s)
  }

  // Step 1 — "Schedule this competition →": skip steps 2–5, jump straight to step 6
  const goDirectToSchedule = useCallback(() => {
    const fmt     = (d: Date) => d.toISOString().split('T')[0]
    const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }
    const now     = new Date()
    const month   = now.toLocaleString('default', { month: 'long' })
    const year    = now.getFullYear()
    const tplName = templates.find(t => t.id === selectedTemplateId)?.name ?? ''
    const instanceName = tplName ? `${tplName} — ${month} ${year}` : `${month} ${year}`
    const today    = new Date()
    const subClose = addDays(today, 14)
    const jugOpen  = addDays(subClose, 3)
    const jugClose = addDays(jugOpen, 10)
    setSchedule(prev => ({
      ...prev,
      instanceName,
      submissionsOpenDate:  fmt(today),
      submissionsCloseDate: fmt(subClose),
      judgingOpenDate:      fmt(jugOpen),
      judgingCloseDate:     fmt(jugClose),
    }))
    setCompletedSteps([1, 2, 3, 4, 5])
    setStep(6)
  }, [selectedTemplateId, templates])

  // Step 1 — "Review & adjust settings": enter step 2 pre-filled from template
  const goReviewSettings = useCallback(() => {
    setCompletedSteps(prev => prev.includes(1) ? prev : [...prev, 1])
    setStep(2)
  }, [])

  const handleSave = async (status: 'draft' | 'open') => {
    if (!validateStep(step)) return
    setSaving(status)
    try {
      if (isEditMode && editCompetition) {
        await updateCompetitionFromSchedule(editCompetition.id, { schedule })
      } else {
        await createCompetitionFromSchedule({ config, schedule, competitionType, status })

        // Optionally save as template — best-effort, don't block on failure
        if (saveAsTemplate && templateName.trim()) {
          try {
            await saveTemplate(templateName.trim(), config)
          } catch (err) {
            console.warn('Template save skipped:', err)
          }
        }
      }

      onClose()
      window.location.assign('/admin/competitions')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('saveCompetition failed:', err)
      setToast({ msg: `Failed to save competition: ${msg}`, severity: 'error' })
    } finally {
      setSaving(null)
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={false}
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2, height: '94vh', width: '100%', maxWidth: 1000, display: 'flex', flexDirection: 'column' } } }}
      >
        {/* Header */}
        <Box sx={{ px: '30px', pt: '30px', pb: '24px', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: 'text.primary', mb: 3 }}>
            {isEditMode ? 'Edit competition' : 'Create competition'}
          </Typography>
          <StepIndicator currentStep={step} completedSteps={completedSteps} onStepClick={goToStep} />
        </Box>

        {/* Scrollable content */}
        <DialogContent sx={{ flex: 1, overflowY: 'auto', px: '30px', py: '30px' }}>
          <Box sx={{ width: '90%', mx: 'auto' }}>
          {step === 1 && (
            <StepBasics
              config={config}
              onChange={updateConfig}
              errors={errors}
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              onSelectTemplate={selectTemplate}
              competitionType={competitionType}
              onTypeChange={handleTypeChange}
              onScheduleDirect={goDirectToSchedule}
              onReviewSettings={goReviewSettings}
              onScratchMode={setStep1Scratch}
              clubSlug={clubSlug}
            />
          )}
          {step === 2 && <StepCategories config={config} onChange={updateConfig} clubCategories={activeCats} onAddClubCategory={name => setActiveCats(prev => [...prev, name])} />}
          {step === 3 && <StepJudging    config={config} onChange={updateConfig} />}
          {step === 4 && <StepAwards     config={config} onChange={updateConfig} onBlocked={setStepBlocked} />}
          {step === 5 && (
            <StepReview
              config={config}
              onEdit={goToStep}
              saveAsTemplate={saveAsTemplate}
              onSaveAsTemplate={setSaveAsTemplate}
              templateName={templateName}
              onTemplateName={setTemplateName}
              selectedTemplateId={selectedTemplateId}
            />
          )}
          {step === 6 && (
            <StepSchedule
              schedule={schedule}
              onChange={updateSchedule}
              errors={errors}
              members={members}
              meetingLocations={meetingLocations}
              numberOfJudges={config.numberOfJudges}
            />
          )}
          </Box>
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
            <Button variant="outlined" color="secondary" onClick={onClose}>
              Cancel
            </Button>
            {step < TOTAL_STEPS && !(step === 1 && selectedTemplateId !== null) ? (
              <Button
                variant="contained"
                onClick={goNext}
                disabled={
                  (step === 1 && !step1Scratch && selectedTemplateId === null) ||
                  (step === 4 && stepBlocked)
                }
              >
                {step === 5 ? 'Continue to schedule' : 'Continue'}
              </Button>
            ) : step < TOTAL_STEPS ? null : (
              <>
                {!isEditMode && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => handleSave('draft')}
                    disabled={!!saving}
                  >
                    {saving === 'draft' ? 'Saving…' : 'Save as draft'}
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={() => handleSave(isEditMode ? 'open' : 'open')}
                  disabled={!!saving}
                >
                  {saving === 'open'
                    ? (isEditMode ? 'Saving…' : 'Publishing…')
                    : (isEditMode ? 'Save changes' : 'Publish competition')}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.severity ?? 'success'} onClose={() => setToast(null)} sx={{ fontFamily: 'inherit' }}>{toast?.msg}</Alert>
      </Snackbar>
    </>
  )
}

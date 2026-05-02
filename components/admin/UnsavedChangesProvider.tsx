'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'

type UnsavedChangesCtx = {
  isDirty: boolean
  markDirty: () => void
  markClean: () => void
  registerSave: (fn: () => Promise<void> | void) => void
  navigate: (href: string) => void
}

const UnsavedChangesContext = createContext<UnsavedChangesCtx>({
  isDirty:      false,
  markDirty:    () => {},
  markClean:    () => {},
  registerSave: () => {},
  navigate:     () => {},
})

export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext)
}

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const router                            = useRouter()
  const [isDirty, setIsDirty]             = useState(false)
  const [pendingHref, setPendingHref]     = useState<string | null>(null)
  const [saving, setSaving]               = useState(false)
  const saveFnRef                         = useRef<(() => Promise<void> | void) | null>(null)

  // Block browser close / refresh when dirty
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const markDirty    = useCallback(() => setIsDirty(true), [])
  const markClean    = useCallback(() => setIsDirty(false), [])
  const registerSave = useCallback((fn: () => Promise<void> | void) => {
    saveFnRef.current = fn
  }, [])

  const navigate = useCallback((href: string) => {
    if (!isDirty) { router.push(href); return }
    setPendingHref(href)
  }, [isDirty, router])

  async function handleSaveAndContinue() {
    setSaving(true)
    try {
      if (saveFnRef.current) await saveFnRef.current()
    } finally {
      setSaving(false)
      setIsDirty(false)
      const href = pendingHref
      setPendingHref(null)
      if (href) router.push(href)
    }
  }

  function handleContinueWithoutSaving() {
    setIsDirty(false)
    const href = pendingHref
    setPendingHref(null)
    if (href) router.push(href)
  }

  return (
    <UnsavedChangesContext.Provider value={{ isDirty, markDirty, markClean, registerSave, navigate }}>
      {children}

      <Dialog open={pendingHref !== null} onClose={() => setPendingHref(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 600, pb: 1 }}>Unsaved changes</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.6 }}>
            You&apos;ve made some changes here but didn&apos;t save them yet. What would you like to do?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined" color="secondary" size="small"
            onClick={handleContinueWithoutSaving}
          >
            Continue without saving
          </Button>
          <Button
            variant="contained" size="small"
            disabled={saving} onClick={handleSaveAndContinue}
          >
            {saving ? 'Saving…' : 'Save changes and continue'}
          </Button>
        </DialogActions>
      </Dialog>
    </UnsavedChangesContext.Provider>
  )
}

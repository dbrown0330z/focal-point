'use client'

import { useState, useTransition } from 'react'
import { withdrawSubmission } from '@/app/(member)/submit/actions'

export default function WithdrawButton({
  submissionId,
  competitionId,
  imageTitle,
  competitionTitle,
}: {
  submissionId:     string
  competitionId:    string
  imageTitle:       string
  competitionTitle: string
}) {
  const [open, setOpen]       = useState(false)
  const [error, setError]     = useState('')
  const [isPending, startTransition] = useTransition()

  function handleWithdraw() {
    setError('')
    startTransition(async () => {
      const result = await withdrawSubmission(submissionId, competitionId)
      if (!result.ok) {
        setError(result.error ?? 'Something went wrong.')
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-content-tertiary hover:text-status-error-text transition-colors"
      >
        Withdraw
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border-default bg-surface-2 p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-semibold text-content-primary">Withdraw this entry?</h2>
              <p className="mt-2 text-sm text-content-secondary leading-relaxed">
                Removing &ldquo;{imageTitle}&rdquo; from {competitionTitle} cannot be undone.
                Your entry slot will not be returned but this image can be entered in a future competition.
              </p>
            </div>

            {error && (
              <p className="text-sm text-status-error-text">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-content-secondary hover:bg-surface-1 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isPending}
                className="flex-1 rounded-lg bg-status-error px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isPending ? 'Withdrawing…' : 'Withdraw entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useState, useTransition } from 'react'
import {
  deleteCompetition,
  cancelCompetition,
  archiveCompetition,
} from '../actions'

type Props = {
  id:              string
  title:           string
  status:          string
  submissionCount: number
  isArchived:      boolean
}

export function LifecycleActions({ id, title, status, submissionCount, isArchived }: Props) {
  const [menuOpen,        setMenuOpen]        = useState(false)
  const [showArchive,     setShowArchive]     = useState(false)
  const [showCancel,      setShowCancel]      = useState(false)
  const [showDelete,      setShowDelete]      = useState(false)
  const [cancelReason,    setCancelReason]    = useState('')
  const [isPending,       startTransition]    = useTransition()

  // Eligibility
  const canDelete = (status === 'draft' || status === 'open') && submissionCount === 0
  const canCancel = ['open', 'judging', 'judging_on_hold'].includes(status)

  const handleArchive = () => {
    startTransition(async () => {
      await archiveCompetition(id)
      setShowArchive(false)
    })
  }

  const handleCancel = () => {
    if (!cancelReason.trim()) return
    startTransition(async () => {
      await cancelCompetition(id, cancelReason.trim())
      setShowCancel(false)
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await deleteCompetition(id)
    })
  }

  const btnBase = "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Archive button — always visible, non-destructive */}
        {!isArchived && (
          <button
            onClick={() => setShowArchive(true)}
            className={`${btnBase} border-border-default bg-surface-2 text-content-secondary hover:bg-surface-1`}
          >
            Archive
          </button>
        )}

        {/* Kebab menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className={`${btnBase} border-border-default bg-surface-2 text-content-secondary hover:bg-surface-1 px-2`}
            aria-label="More actions"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5"  r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="12" cy="19" r="2"/>
            </svg>
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-lg border border-border-default bg-surface-2 py-1 shadow-lg">
                {canCancel && (
                  <button
                    onClick={() => { setMenuOpen(false); setShowCancel(true) }}
                    className="w-full px-4 py-2 text-left text-sm text-content-primary hover:bg-surface-1 transition-colors"
                  >
                    Cancel competition
                  </button>
                )}

                {/* Delete — always shown, disabled if ineligible */}
                <div className="group relative">
                  <button
                    onClick={() => { if (canDelete) { setMenuOpen(false); setShowDelete(true) } }}
                    disabled={!canDelete}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      canDelete
                        ? 'text-[#D32F2F] hover:bg-[#FDEEEE]'
                        : 'text-content-disabled cursor-default'
                    }`}
                  >
                    Delete competition
                  </button>
                  {!canDelete && (
                    <div className="pointer-events-none absolute right-full top-0 z-30 mr-2 hidden w-64 rounded-lg border border-border-default bg-surface-2 p-3 text-xs text-content-secondary shadow-md group-hover:block">
                      Competitions with submissions or results cannot be deleted. Use Archive to remove from active views.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Archive dialog ─────────────────────────────────────────────────── */}
      {showArchive && (() => {
        const concluded = status === 'results_published' || status === 'closed'
        const hasSubmissions = submissionCount > 0
        const willRelease = !concluded && hasSubmissions
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-xl border border-border-default bg-surface-2 p-6 shadow-xl">
              <h3 className="text-base font-semibold text-content-primary mb-2">Archive this competition?</h3>
              <p className="text-sm text-content-secondary mb-4">
                <strong>"{title}"</strong> will be moved to your archived competitions list.
              </p>

              {willRelease && (
                <div className="mb-4 rounded-lg border border-[#F0D060] bg-[#FFFBE6] px-4 py-3">
                  <p className="text-sm font-semibold text-[#6B5000] mb-1">This competition never concluded</p>
                  <p className="text-xs text-[#6B5000] leading-relaxed">
                    Results were never published. All {submissionCount} submitted {submissionCount === 1 ? 'image' : 'images'} will be automatically released back to members' libraries so they can enter future competitions.
                  </p>
                </div>
              )}

              {concluded ? (
                <>
                  <p className="text-sm text-content-secondary mb-3">
                    Archiving only affects where this competition appears in your admin area. Nothing else changes:
                  </p>
                  <div className="mb-4 space-y-1">
                    {[
                      'All member submissions are untouched',
                      'All scores remain on record',
                      'All awards stay on member profiles',
                      'Benchmark classifications are unaffected',
                      'Photographer of the Year points continue to count',
                    ].map(item => (
                      <p key={item} className="text-xs text-content-tertiary">· {item}</p>
                    ))}
                  </div>
                  <p className="mb-4 text-xs text-content-secondary">
                    Members will no longer see this competition in their active list, but their results and awards remain visible on their profiles.
                  </p>
                </>
              ) : (
                <p className="text-sm text-content-secondary mb-4">
                  The competition will be hidden from members and removed from active views. No scores, awards, or POY points will be applied.
                </p>
              )}

              <p className="mb-5 text-xs text-content-tertiary">You can unarchive this competition at any time.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowArchive(false)} className={`${btnBase} border-border-default bg-surface-2 text-content-primary hover:bg-surface-1`}>Cancel</button>
                <button onClick={handleArchive} disabled={isPending} className={`${btnBase} border-transparent bg-action-primary text-white hover:bg-action-primary-hover`}>
                  {isPending ? 'Archiving…' : 'Archive competition'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Cancel dialog ──────────────────────────────────────────────────── */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl border border-border-default bg-surface-2 p-6 shadow-xl">
            <h3 className="text-base font-semibold text-content-primary mb-2">Cancel this competition?</h3>
            <p className="text-sm text-content-secondary mb-4">
              This will stop <strong>"{title}"</strong> immediately. Members who have submitted entries will be notified.
            </p>
            <label className="mb-1.5 block text-sm font-medium text-content-primary">
              Reason for cancellation <span className="text-[#D32F2F]">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Explain why this competition is being cancelled…"
              className="mb-1 w-full rounded-lg border border-border-default bg-surface-0 px-3 py-2 text-sm text-content-primary placeholder-content-muted focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20 resize-none"
            />
            <p className="mb-4 text-xs text-content-tertiary">This will be included in the member notification email and stored on the competition record.</p>
            <div className="mb-5 space-y-1">
              <p className="text-xs font-medium text-content-secondary mb-1">What happens when you cancel:</p>
              {[
                'Members are notified by email',
                "Submitted images are returned to members' available entry pool",
                'Any scores in progress are discarded',
                'No awards, benchmark, or POY data will be applied',
                'The competition remains visible in your admin area with a Cancelled status',
              ].map(item => (
                <p key={item} className="text-xs text-content-tertiary">· {item}</p>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowCancel(false); setCancelReason('') }} className={`${btnBase} border-border-default bg-surface-2 text-content-primary hover:bg-surface-1`}>Keep competition</button>
              <button
                onClick={handleCancel}
                disabled={isPending || !cancelReason.trim()}
                className={`${btnBase} border-transparent bg-[#D32F2F] text-white hover:bg-[#B71C1C] disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isPending ? 'Cancelling…' : 'Cancel competition'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete dialog ──────────────────────────────────────────────────── */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl border border-border-default bg-surface-2 p-6 shadow-xl">
            <h3 className="text-base font-semibold text-content-primary mb-2">Permanently delete this competition?</h3>
            <p className="text-sm text-content-secondary mb-2">
              <strong>"{title}"</strong> never opened to submissions and has no entries. Deleting it will:
            </p>
            <div className="mb-4 space-y-1">
              {[
                'Permanently remove all competition settings and configuration',
                'Remove all scheduled calendar events',
                'Deactivate the judge invitation link if one was sent',
                'Remove the competition from your admin area permanently',
              ].map(item => (
                <p key={item} className="text-xs text-content-tertiary">· {item}</p>
              ))}
            </div>
            <p className="mb-5 text-xs font-medium text-content-secondary">
              This cannot be undone. If you are unsure, use Archive instead.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDelete(false)} className={`${btnBase} border-border-default bg-surface-2 text-content-primary hover:bg-surface-1`}>Cancel</button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className={`${btnBase} border-transparent bg-[#D32F2F] text-white hover:bg-[#B71C1C] disabled:opacity-50`}
              >
                {isPending ? 'Deleting…' : 'Permanently delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

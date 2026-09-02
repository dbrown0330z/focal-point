'use client'

import Image from 'next/image'
import { useState, useTransition } from 'react'
import { moveSubmissionCategory, removeSubmission, reinstateSubmission } from './actions'

type Category = { id: string; name: string }

type Entry = {
  id:          string
  status:      string
  submittedAt: string
  categoryId:  string | null
  imageTitle:  string
  memberName:  string
  publicUrl:   string | null
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function EntryRow({
  entry,
  categories,
  competitionId,
  showCategories,
  even,
}: {
  entry:          Entry
  categories:     Category[]
  competitionId:  string
  showCategories: boolean
  even:           boolean
}) {
  const [confirmRemove,  setConfirmRemove]  = useState(false)
  const [movePending,    startMove]         = useTransition()
  const [removePending,  startRemove]       = useTransition()
  const [localCategory,  setLocalCategory]  = useState(entry.categoryId ?? '')
  const [localStatus,    setLocalStatus]    = useState(entry.status)

  const isWithdrawn = localStatus === 'withdrawn'

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newCatId = e.target.value
    setLocalCategory(newCatId)
    startMove(async () => {
      await moveSubmissionCategory(entry.id, newCatId, competitionId)
    })
  }

  function handleRemove() {
    startRemove(async () => {
      await removeSubmission(entry.id, competitionId)
      setLocalStatus('withdrawn')
      setConfirmRemove(false)
    })
  }

  function handleReinstate() {
    startRemove(async () => {
      await reinstateSubmission(entry.id, competitionId)
      setLocalStatus('submitted')
    })
  }

  const rowBg = isWithdrawn ? 'bg-surface-0 opacity-60' : even ? 'bg-surface-2' : 'bg-surface-1'

  return (
    <tr className={`border-b border-border-subtle last:border-0 ${rowBg}`}>

      {/* Thumbnail */}
      <td className="px-4 py-2.5">
        {entry.publicUrl ? (
          <div className="relative w-12 h-10 rounded-md overflow-hidden bg-surface-1 shrink-0">
            <Image src={entry.publicUrl} alt={entry.imageTitle} fill sizes="48px" className="object-cover" />
          </div>
        ) : (
          <div className="w-12 h-10 rounded-md bg-surface-1 border border-border-subtle" />
        )}
      </td>

      {/* Image title */}
      <td className="px-4 py-2.5 font-medium text-content-primary max-w-[180px]">
        <span className="block truncate">{entry.imageTitle}</span>
      </td>

      {/* Member */}
      <td className="px-4 py-2.5 text-content-secondary whitespace-nowrap">
        {entry.memberName}
      </td>

      {/* Category — inline select */}
      {showCategories && (
        <td className="px-4 py-2.5">
          {isWithdrawn ? (
            <span className="text-content-disabled text-sm">—</span>
          ) : (
            <div className="relative">
              <select
                value={localCategory}
                onChange={handleCategoryChange}
                disabled={movePending}
                className="w-full rounded-md border border-border-default bg-surface-1 px-2.5 py-1.5 text-sm text-content-primary focus:border-action-primary focus:outline-none focus:ring-1 focus:ring-action-primary/20 disabled:opacity-60 pr-7 appearance-none"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {/* Chevron */}
              <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-content-tertiary" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
              {movePending && (
                <span className="absolute -right-5 top-1/2 -translate-y-1/2 text-[10px] text-content-tertiary">✓</span>
              )}
            </div>
          )}
        </td>
      )}

      {/* Submitted date */}
      <td className="px-4 py-2.5 text-content-tertiary whitespace-nowrap text-sm">
        {fmtDate(entry.submittedAt)}
      </td>

      {/* Status chip */}
      <td className="px-4 py-2.5">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
          localStatus === 'submitted'
            ? 'bg-status-success-bg text-status-success-text'
            : 'bg-surface-1 text-content-tertiary'
        }`}>
          {localStatus === 'submitted' ? 'Submitted' : 'Withdrawn'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-2.5 text-right whitespace-nowrap">
        {isWithdrawn ? (
          <button
            type="button"
            disabled={removePending}
            onClick={handleReinstate}
            className="text-xs text-action-primary hover:underline disabled:opacity-50 transition-colors"
          >
            Reinstate
          </button>
        ) : confirmRemove ? (
          <span className="inline-flex items-center gap-2">
            <span className="text-xs text-content-secondary">Remove?</span>
            <button
              type="button"
              disabled={removePending}
              onClick={handleRemove}
              className="text-xs font-semibold text-status-error-text hover:underline disabled:opacity-50"
            >
              {removePending ? 'Removing…' : 'Yes'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmRemove(false)}
              className="text-xs text-content-tertiary hover:text-content-primary"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            className="text-xs text-content-tertiary hover:text-status-error-text transition-colors"
          >
            Remove
          </button>
        )}
      </td>
    </tr>
  )
}

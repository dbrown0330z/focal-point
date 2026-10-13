'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { provisionClub, suspendClub, reactivateClub, resendInvite, saveNotes, deleteClub } from './actions'

interface Club {
  id: string
  status: string
  notes: string | null
  invite_sent_at: string | null
}

export default function ClubDetailClient({ club }: { club: Club }) {
  const [notes, setNotes]         = useState(club.notes ?? '')
  const [message, setMessage]     = useState<{ text: string; error: boolean } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition]      = useTransition()
  const router = useRouter()

  function act(action: () => Promise<{ error?: string }>, successMsg: string) {
    startTransition(async () => {
      const result = await action()
      if (result.error) {
        setMessage({ text: result.error, error: true })
      } else {
        setMessage({ text: successMsg, error: false })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {club.status === 'pending' && (
            <ActionButton
              label="Provision & Activate"
              variant="primary"
              disabled={isPending}
              onClick={() => act(() => provisionClub(club.id), 'Club provisioned and invite sent.')}
            />
          )}
          {club.status === 'active' && (
            <>
              <ActionButton
                label="Resend Invite"
                variant="secondary"
                disabled={isPending}
                onClick={() => act(() => resendInvite(club.id), 'Invite resent.')}
              />
              <ActionButton
                label="Suspend Club"
                variant="danger"
                disabled={isPending}
                onClick={() => act(() => suspendClub(club.id), 'Club suspended.')}
              />
            </>
          )}
          {club.status === 'suspended' && (
            <ActionButton
              label="Reactivate Club"
              variant="primary"
              disabled={isPending}
              onClick={() => act(() => reactivateClub(club.id), 'Club reactivated.')}
            />
          )}
        </div>

        {/* Delete — always visible, requires confirmation */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={isPending}
              className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2 transition-colors disabled:opacity-50"
            >
              Delete this club…
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-red-700 font-medium">Delete permanently?</span>
              <button
                onClick={() => {
                  startTransition(async () => {
                    const result = await deleteClub(club.id)
                    if (result.error) {
                      setMessage({ text: result.error, error: true })
                      setConfirmDelete(false)
                    } else {
                      router.push('/fp-admin/clubs')
                    }
                  })
                }}
                disabled={isPending}
                className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={isPending}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {message && (
          <p className={`mt-3 text-sm ${message.error ? 'text-red-600' : 'text-green-700'}`}>
            {message.text}
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Notes</h2>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          placeholder="Internal notes about this club..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />
        <div className="mt-2 flex justify-end">
          <ActionButton
            label="Save notes"
            variant="secondary"
            disabled={isPending}
            onClick={() => act(() => saveNotes(club.id, notes), 'Notes saved.')}
          />
        </div>
      </div>
    </div>
  )
}

function ActionButton({
  label, variant, disabled, onClick,
}: {
  label: string
  variant: 'primary' | 'secondary' | 'danger'
  disabled: boolean
  onClick: () => void
}) {
  const styles = {
    primary:   'bg-[#1E4D8C] text-white hover:bg-[#163A6B]',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    danger:    'bg-white text-red-600 border border-red-300 hover:bg-red-50',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${styles[variant]}`}
    >
      {label}
    </button>
  )
}

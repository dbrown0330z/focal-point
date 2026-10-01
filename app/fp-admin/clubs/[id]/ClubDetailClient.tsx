'use client'

import { useState, useTransition } from 'react'
import { provisionClub, suspendClub, reactivateClub, resendInvite, saveNotes } from './actions'

interface Club {
  id: string
  status: string
  notes: string | null
  invite_sent_at: string | null
}

export default function ClubDetailClient({ club }: { club: Club }) {
  const [notes, setNotes]     = useState(club.notes ?? '')
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

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

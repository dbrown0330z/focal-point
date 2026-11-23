'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertScore } from '../actions'

export default function ScoreForm({
  token,
  submissionId,
  nextId,
  existingScore,
  existingNotes,
}: {
  token: string
  submissionId: string
  nextId: string | null
  existingScore: number | null
  existingNotes: string | null
}) {
  const [score, setScore] = useState<number>(existingScore ?? 5)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    await upsertScore(token, formData)
    setSaving(false)
    // Bust the client-side router cache so navigating back to /score or /landing
    // shows fresh scores rather than a stale cached version.
    router.refresh()
    if (nextId) {
      router.push(`/judge/${token}/score/${nextId}`)
    } else {
      router.push(`/judge/${token}/score`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border-default bg-surface-2 p-5">
      <input type="hidden" name="submission_id" value={submissionId} />

      {/* Score slider */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="score" className="text-sm font-medium text-content-primary">Score</label>
          <span className="text-2xl font-semibold tabular-nums text-content-primary">
            {score}<span className="text-base font-normal text-content-tertiary">/10</span>
          </span>
        </div>
        <input
          id="score"
          name="score"
          type="range"
          min={1}
          max={10}
          step={1}
          value={score}
          onChange={e => setScore(Number(e.target.value))}
          className="w-full accent-[var(--action-primary)]"
        />
        <div className="mt-1 flex justify-between text-xs text-content-disabled">
          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
          <span>6</span><span>7</span><span>8</span><span>9</span><span>10</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-content-primary">
          Notes <span className="font-normal text-content-muted">(optional — shared with member after competition closes)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={existingNotes ?? ''}
          placeholder="Feedback for the photographer…"
          className="w-full resize-none rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-sm text-content-primary placeholder-content-muted focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-action-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-action-primary-hover disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : nextId ? 'Save & next →' : 'Save & finish'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/judge/${token}/score`)}
          className="rounded-lg border border-border-default px-5 py-2.5 text-sm font-medium text-content-secondary hover:bg-surface-1 transition-colors"
        >
          Back to all entries
        </button>
      </div>

      {existingScore != null && (
        <p className="text-xs text-content-tertiary">Previously scored: {existingScore}/10. Saving will update your score.</p>
      )}
    </form>
  )
}

import { createCompetition } from '../actions'
import CategoryInputList from '@/components/competitions/CategoryInputList'

const inputCls = "w-full rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-sm text-content-primary focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
const labelCls = "mb-1.5 block text-sm font-medium text-content-primary"

export default function NewCompetitionPage() {
  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-xl font-semibold text-content-primary">New competition</h1>

      <form action={createCompetition} className="space-y-5">
        <div>
          <label htmlFor="title" className={labelCls}>
            Title <span className="text-status-error">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="April 2026 — Landscapes"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="opens_at" className={labelCls}>Opens</label>
            <input id="opens_at" name="opens_at" type="date" className={inputCls} />
          </div>
          <div>
            <label htmlFor="closes_at" className={labelCls}>Closes</label>
            <input id="closes_at" name="closes_at" type="date" className={inputCls} />
          </div>
        </div>

        <div>
          <label htmlFor="submission_limit" className={labelCls}>
            Submissions per member
          </label>
          <input
            id="submission_limit"
            name="submission_limit"
            type="number"
            min={1}
            max={20}
            defaultValue={3}
            required
            className="w-24 rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-sm text-content-primary focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
          />
        </div>

        <div>
          <label className={labelCls}>Categories</label>
          <CategoryInputList />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-action-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-action-primary-hover transition-colors"
          >
            Create competition
          </button>
          <a
            href="/admin/competitions"
            className="rounded-lg border border-border-default px-5 py-2.5 text-sm font-medium text-content-secondary hover:bg-surface-1 transition-colors"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}

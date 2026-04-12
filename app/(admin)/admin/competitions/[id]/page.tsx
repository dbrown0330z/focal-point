import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import StatusTransition from '@/components/competitions/StatusTransition'
import {
  updateCompetition,
  addCategory,
  removeCategory,
  addJudge,
  removeJudge,
} from '../actions'

const statusStyles: Record<string, string> = {
  draft:   'bg-surface-1 text-content-secondary',
  open:    'bg-status-success-bg text-status-success-text',
  judging: 'bg-status-warning-bg text-status-warning-text',
  closed:  'bg-surface-1 text-content-tertiary',
}

const inputCls = "w-full rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-sm text-content-primary focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20 disabled:bg-surface-1 disabled:text-content-disabled"
const labelCls = "mb-1.5 block text-sm font-medium text-content-primary"

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: competition } = await supabase
    .from('competitions')
    .select('*, competition_categories(*), judge_tokens(*)')
    .eq('id', id)
    .single()

  if (!competition) notFound()

  const headersList = await headers()
  const origin = `${headersList.get('x-forwarded-proto') ?? 'http'}://${headersList.get('host')}`

  const editable = competition.status !== 'closed'
  const canEditCategories = competition.status === 'draft'

  return (
    <div className="max-w-2xl space-y-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-content-primary">{competition.title}</h1>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[competition.status]}`}>
          {competition.status}
        </span>
      </div>

      {/* Details */}
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-content-tertiary">Details</h2>
        <div className="rounded-xl border border-border-default bg-surface-2 p-5">
          <form action={updateCompetition.bind(null, id)} className="space-y-4">
            <div>
              <label htmlFor="title" className={labelCls}>Title</label>
              <input
                id="title" name="title" type="text" required
                defaultValue={competition.title}
                disabled={!editable}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="opens_at" className={labelCls}>Opens</label>
                <input
                  id="opens_at" name="opens_at" type="date"
                  defaultValue={competition.opens_at?.slice(0, 10) ?? ''}
                  disabled={!editable}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="closes_at" className={labelCls}>Closes</label>
                <input
                  id="closes_at" name="closes_at" type="date"
                  defaultValue={competition.closes_at?.slice(0, 10) ?? ''}
                  disabled={!editable}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label htmlFor="submission_limit" className={labelCls}>
                Submissions per member
              </label>
              <input
                id="submission_limit" name="submission_limit" type="number" min={1} max={20} required
                defaultValue={competition.submission_limit}
                disabled={!editable}
                className="w-24 rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-sm text-content-primary focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20 disabled:bg-surface-1 disabled:text-content-disabled"
              />
            </div>
            {editable && (
              <button type="submit" className="rounded-lg bg-action-primary px-4 py-2 text-sm font-medium text-white hover:bg-action-primary-hover transition-colors">
                Save changes
              </button>
            )}
          </form>
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-content-tertiary">Categories</h2>
        <div className="rounded-xl border border-border-default bg-surface-2 divide-y divide-border-subtle">
          {competition.competition_categories.length === 0 && (
            <p className="px-4 py-3 text-sm text-content-tertiary">No categories added yet.</p>
          )}
          {competition.competition_categories.map((cat: { id: string; name: string }) => (
            <div key={cat.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-content-primary">{cat.name}</span>
              {canEditCategories && (
                <form action={removeCategory.bind(null, cat.id, id)}>
                  <button type="submit" className="text-xs text-content-tertiary hover:text-status-error-text transition-colors">
                    Remove
                  </button>
                </form>
              )}
            </div>
          ))}
          {canEditCategories && (
            <form action={addCategory.bind(null, id)} className="flex gap-2 px-4 py-3">
              <input
                name="name" type="text" required placeholder="New category name"
                className="flex-1 rounded-lg border border-border-default bg-surface-0 px-3 py-1.5 text-sm text-content-primary placeholder-content-muted focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
              />
              <button type="submit" className="rounded-lg bg-surface-1 px-3 py-1.5 text-sm font-medium text-content-primary hover:bg-border-default transition-colors">
                Add
              </button>
            </form>
          )}
        </div>
        {!canEditCategories && (
          <p className="mt-2 text-xs text-content-tertiary">Categories can only be edited while the competition is in draft.</p>
        )}
      </section>

      {/* Judges */}
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-content-tertiary">Judges</h2>
        <div className="rounded-xl border border-border-default bg-surface-2 divide-y divide-border-subtle">
          {competition.judge_tokens.length === 0 && (
            <p className="px-4 py-3 text-sm text-content-tertiary">No judges assigned yet.</p>
          )}
          {competition.judge_tokens.map((jt: { id: string; judge_name: string; judge_email: string; token: string }) => (
            <div key={jt.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-content-primary">{jt.judge_name}</p>
                  <p className="text-xs text-content-tertiary">{jt.judge_email}</p>
                </div>
                {competition.status !== 'closed' && (
                  <form action={removeJudge.bind(null, jt.id, id)}>
                    <button type="submit" className="text-xs text-content-tertiary hover:text-status-error-text transition-colors">
                      Remove
                    </button>
                  </form>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-surface-1 px-3 py-2">
                <span className="flex-1 truncate font-mono text-xs text-content-secondary">
                  {origin}/judge/{jt.token}
                </span>
                <CopyButton text={`${origin}/judge/${jt.token}`} />
              </div>
            </div>
          ))}
          {competition.status !== 'closed' && (
            <form action={addJudge.bind(null, id)} className="space-y-2 px-4 py-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="judge_name" type="text" required placeholder="Judge name"
                  className="rounded-lg border border-border-default bg-surface-0 px-3 py-1.5 text-sm text-content-primary placeholder-content-muted focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
                />
                <input
                  name="judge_email" type="email" required placeholder="judge@example.com"
                  className="rounded-lg border border-border-default bg-surface-0 px-3 py-1.5 text-sm text-content-primary placeholder-content-muted focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
                />
              </div>
              <button type="submit" className="rounded-lg bg-surface-1 px-3 py-1.5 text-sm font-medium text-content-primary hover:bg-border-default transition-colors">
                Add judge
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Status transition */}
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-content-tertiary">Status</h2>
        <StatusTransition competitionId={id} currentStatus={competition.status} />
      </section>
    </div>
  )
}

// Inline client component — small enough not to warrant its own file
function CopyButton({ text }: { text: string }) {
  'use client'
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text)}
      className="shrink-0 text-xs text-content-tertiary hover:text-content-primary transition-colors"
    >
      Copy
    </button>
  )
}

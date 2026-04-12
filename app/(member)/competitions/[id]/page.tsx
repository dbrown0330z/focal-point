import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SubmissionForm from '@/components/competitions/SubmissionForm'
import { withdrawSubmission } from './actions'

const statusStyles: Record<string, string> = {
  open:    'bg-status-success-bg text-status-success-text',
  judging: 'bg-status-warning-bg text-status-warning-text',
  closed:  'bg-surface-1 text-content-tertiary',
}

export default async function CompetitionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: competition } = await supabase
    .from('competitions')
    .select('*, competition_categories(id, name)')
    .eq('id', id)
    .neq('status', 'draft')
    .single()

  if (!competition) notFound()

  // Member's active submissions for this competition
  const { data: mySubmissions } = await supabase
    .from('submissions')
    .select('id, status, image_id, category_id, images(title, storage_path), competition_categories(name)')
    .eq('competition_id', id)
    .eq('member_id', user!.id)
    .eq('status', 'submitted')

  const submissionCount = mySubmissions?.length ?? 0
  const atLimit = submissionCount >= competition.submission_limit

  // Images available to submit: owned by user, not in any active submission
  const { data: allImages } = await supabase
    .from('images')
    .select('id, title, storage_path')
    .eq('owner_id', user!.id)

  // IDs of images currently submitted somewhere (any competition)
  const { data: activeSubmissions } = await supabase
    .from('submissions')
    .select('image_id')
    .eq('member_id', user!.id)
    .eq('status', 'submitted')

  const submittedImageIds = new Set(activeSubmissions?.map(s => s.image_id) ?? [])
  const availableImages = (allImages ?? [])
    .filter(img => !submittedImageIds.has(img.id))
    .map(img => ({
      id: img.id,
      title: img.title,
      publicUrl: supabase.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl,
    }))

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-content-primary">{competition.title}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[competition.status]}`}>
            {competition.status}
          </span>
        </div>
        <div className="mt-1.5 flex gap-4 text-sm text-content-secondary">
          {competition.closes_at && (
            <span>Closes {new Date(competition.closes_at).toLocaleDateString()}</span>
          )}
          <span>
            {submissionCount} / {competition.submission_limit} submissions used
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-status-error bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {error}
        </div>
      )}

      {/* My submissions */}
      {(mySubmissions?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-content-tertiary">
            Your submissions
          </h2>
          <div className="space-y-2">
            {mySubmissions!.map(sub => {
              const image = sub.images as unknown as { title: string; storage_path: string }
              const category = sub.competition_categories as unknown as { name: string }
              const publicUrl = supabase.storage.from('images').getPublicUrl(image.storage_path).data.publicUrl

              return (
                <div key={sub.id} className="flex items-center gap-4 rounded-xl border border-border-default bg-surface-2 p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={publicUrl} alt={image.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-content-primary">{image.title}</p>
                    <p className="text-xs text-content-tertiary">{category.name}</p>
                  </div>
                  <form action={withdrawSubmission.bind(null, sub.id, id)}>
                    <button
                      type="submit"
                      className="text-xs text-content-tertiary hover:text-status-error-text transition-colors"
                    >
                      Withdraw
                    </button>
                  </form>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Submit form or status messages */}
      <section>
        {competition.status === 'open' && !atLimit && (
          <SubmissionForm
            competitionId={id}
            categories={competition.competition_categories}
            availableImages={availableImages}
          />
        )}
        {competition.status === 'open' && atLimit && (
          <p className="text-sm text-content-secondary">
            You've used all {competition.submission_limit} submission{competition.submission_limit !== 1 ? 's' : ''} for this competition.
          </p>
        )}
        {competition.status === 'judging' && (
          <p className="text-sm text-content-secondary">Submissions are closed — judging is in progress.</p>
        )}
        {competition.status === 'closed' && (
          <p className="text-sm text-content-secondary">This competition has closed.</p>
        )}
      </section>
    </div>
  )
}

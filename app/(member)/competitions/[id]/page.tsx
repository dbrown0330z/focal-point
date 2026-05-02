import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WithdrawButton from './WithdrawButton'

const statusStyles: Record<string, string> = {
  open:    'bg-status-success-bg text-status-success-text',
  judging: 'bg-status-warning-bg text-status-warning-text',
  closed:  'bg-surface-1 text-content-tertiary',
}

export default async function CompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: competition } = await supabase
    .from('competitions')
    .select('*, competition_categories(id, name)')
    .eq('id', id)
    .neq('status', 'draft')
    .single()

  if (!competition) notFound()

  // Fetch new columns (not in generated types yet)
  const { data: compExtra } = await supabase
    .from('competitions')
    .select('withdrawal_frees_slot')
    .eq('id', id)
    .single()

  const withdrawalFreesSlot = (compExtra as Record<string, unknown> | null)?.withdrawal_frees_slot as boolean ?? true

  // Member's active submissions for this competition
  const { data: mySubmissions } = await supabase
    .from('submissions')
    .select('id, status, image_id, category_id, images(title, storage_path), competition_categories(name)')
    .eq('competition_id', id)
    .eq('member_id', user!.id)
    .eq('status', 'submitted')

  const submissionCount = mySubmissions?.length ?? 0
  const atLimit = submissionCount >= competition.submission_limit

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-content-primary">{competition.title}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[competition.status] ?? 'bg-surface-1 text-content-tertiary'}`}>
            {competition.status}
          </span>
        </div>
        <div className="mt-1.5 flex gap-4 text-sm text-content-secondary">
          {competition.closes_at && (
            <span>Closes {new Date(competition.closes_at).toLocaleDateString()}</span>
          )}
          <span>{submissionCount} / {competition.submission_limit} submissions used</span>
        </div>
      </div>

      {/* My submissions */}
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-content-tertiary">
          My submissions
        </h2>

        {submissionCount === 0 && competition.status === 'open' && (
          <div className="flex flex-col items-center py-10 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/no-submissions.svg"
              alt=""
              width={200}
              className="mb-6 opacity-70 dark:invert"
            />
            <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              You haven&apos;t submitted any images yet
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Upload or select photos from your library to enter this competition.
            </p>
          </div>
        )}

        {submissionCount > 0 && (
          <div className="space-y-2">
            {mySubmissions!.map(sub => {
              const image    = sub.images as unknown as { title: string; storage_path: string }
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
                  <WithdrawButton
                    submissionId={sub.id}
                    competitionId={id}
                    imageTitle={image.title}
                    competitionTitle={competition.title}
                    categoryName={category.name}
                    withdrawalFreesSlot={withdrawalFreesSlot}
                  />
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Submit CTA or status messages */}
      <section>
        {competition.status === 'open' && !atLimit && (
          <Link
            href={`/submit?competition=${id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-action-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-action-primary-hover transition-colors"
          >
            Submit an entry →
          </Link>
        )}
        {competition.status === 'open' && atLimit && (
          <p className="text-sm text-content-secondary">
            You&apos;ve used all {competition.submission_limit} submission{competition.submission_limit !== 1 ? 's' : ''} for this competition.
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

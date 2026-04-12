import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function JudgeScoringGridPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  const { data: judgeToken } = await supabase
    .from('judge_tokens')
    .select('id, judge_name, competition_id, competitions(title, status)')
    .eq('token', token)
    .single()

  const competition = judgeToken?.competitions as unknown as { title: string; status: string } | null

  if (!judgeToken || competition?.status !== 'judging') {
    redirect(`/judge/${token}/expired`)
  }

  // All submitted entries for this competition
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, image_id, images(title, storage_path), competition_categories(name)')
    .eq('competition_id', judgeToken.competition_id)
    .eq('status', 'submitted')

  // Scores this judge has already given
  const { data: myScores } = await supabase
    .from('scores')
    .select('submission_id, score')
    .eq('judge_token_id', judgeToken.id)

  const scoredMap = new Map(myScores?.map(s => [s.submission_id, s.score]) ?? [])
  const scoredCount = scoredMap.size
  const total = submissions?.length ?? 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm text-content-tertiary">Judging as {judgeToken.judge_name}</p>
        <h1 className="mt-1 text-xl font-semibold text-content-primary">{competition.title}</h1>
        <p className="mt-1 text-sm text-content-secondary">
          {scoredCount} of {total} scored
        </p>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-surface-1">
          <div
            className="h-1.5 rounded-full bg-action-primary transition-all"
            style={{ width: total > 0 ? `${(scoredCount / total) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {submissions?.map(sub => {
          const image    = sub.images as unknown as { title: string; storage_path: string }
          const category = sub.competition_categories as unknown as { name: string }
          const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(image.storage_path)
          const existingScore = scoredMap.get(sub.id)

          return (
            <Link
              key={sub.id}
              href={`/judge/${token}/score/${sub.id}`}
              className="group relative overflow-hidden rounded-xl border border-border-default bg-surface-2 hover:border-border-strong transition-colors"
            >
              <div className="aspect-square overflow-hidden bg-surface-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={publicUrl}
                  alt={image.title}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              <div className="p-2.5">
                <p className="truncate text-xs font-medium text-content-primary">{image.title}</p>
                <p className="text-xs text-content-tertiary">{category.name}</p>
              </div>
              {/* Score badge */}
              {existingScore != null ? (
                <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-action-primary text-xs font-semibold text-white shadow">
                  {existingScore}
                </div>
              ) : (
                <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-surface-2/80 text-xs text-content-tertiary shadow backdrop-blur-sm">
                  —
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {scoredCount === total && total > 0 && (
        <p className="text-center text-sm font-medium text-content-secondary">
          All entries scored. You can still update scores by clicking any entry.
        </p>
      )}
    </div>
  )
}

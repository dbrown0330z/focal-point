import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ScoreForm from './ScoreForm'

export default async function JudgeScorePage({
  params,
}: {
  params: Promise<{ token: string; submissionId: string }>
}) {
  const { token, submissionId } = await params
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

  const { data: submission } = await supabase
    .from('submissions')
    .select('id, images(title, description, storage_path), competition_categories(name)')
    .eq('id', submissionId)
    .eq('competition_id', judgeToken.competition_id)
    .eq('status', 'submitted')
    .single()

  if (!submission) redirect(`/judge/${token}/score`)

  const image    = submission.images as unknown as { title: string; description: string | null; storage_path: string }
  const category = submission.competition_categories as unknown as { name: string }
  const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(image.storage_path)

  // Existing score for this judge
  const { data: existingScore } = await supabase
    .from('scores')
    .select('score, notes')
    .eq('submission_id', submissionId)
    .eq('judge_token_id', judgeToken.id)
    .single()

  // Neighbouring submissions for prev/next navigation
  const { data: allSubmissions } = await supabase
    .from('submissions')
    .select('id')
    .eq('competition_id', judgeToken.competition_id)
    .eq('status', 'submitted')
    .order('submitted_at')

  const ids     = allSubmissions?.map(s => s.id) ?? []
  const current = ids.indexOf(submissionId)
  const prevId  = current > 0 ? ids[current - 1] : null
  const nextId  = current < ids.length - 1 ? ids[current + 1] : null

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
      {/* Back + nav */}
      <div className="flex items-center justify-between">
        <Link
          href={`/judge/${token}/score`}
          className="text-sm text-content-tertiary hover:text-content-primary transition-colors"
        >
          ← All entries
        </Link>
        <div className="flex gap-4 text-sm">
          {prevId ? (
            <Link href={`/judge/${token}/score/${prevId}`} className="text-content-secondary hover:text-content-primary transition-colors">
              ← Prev
            </Link>
          ) : <span className="text-content-disabled">← Prev</span>}
          <span className="text-content-disabled">|</span>
          {nextId ? (
            <Link href={`/judge/${token}/score/${nextId}`} className="text-content-secondary hover:text-content-primary transition-colors">
              Next →
            </Link>
          ) : <span className="text-content-disabled">Next →</span>}
        </div>
      </div>

      {/* Image */}
      <div className="overflow-hidden rounded-xl bg-surface-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={publicUrl}
          alt={image.title}
          className="w-full object-contain max-h-[60vh]"
        />
      </div>

      {/* Metadata */}
      <div>
        <h1 className="text-lg font-semibold text-content-primary">{image.title}</h1>
        <p className="mt-0.5 text-sm text-content-tertiary">{category.name}</p>
        {image.description && (
          <p className="mt-2 text-sm text-content-secondary">{image.description}</p>
        )}
      </div>

      {/* Score form */}
      <ScoreForm
        token={token}
        submissionId={submissionId}
        nextId={nextId}
        existingScore={existingScore?.score ?? null}
        existingNotes={existingScore?.notes ?? null}
      />
    </div>
  )
}

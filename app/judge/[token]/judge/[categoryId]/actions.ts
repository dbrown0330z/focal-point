'use server'

import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'

// ── Shared: validate token and return judge_token row ─────────────────────────
// Service client throughout — judges have no Supabase auth session.
async function getValidJudgeToken(token: string) {
  const service = createServiceClient()
  const { data: judgeToken } = await service
    .from('judge_tokens')
    .select('id, competitions(status, score_min, score_max)')
    .eq('token', token)
    .single()

  const competition = judgeToken?.competitions as unknown as {
    status:    string
    score_min: number
    score_max: number
  } | null

  if (!judgeToken || competition?.status !== 'judging') {
    redirect(`/judge/${token}/expired`)
  }

  return { judgeToken, competition: competition! }
}

// ── Save a numeric score (and notes) ─────────────────────────────────────────
export async function saveScore(
  token:        string,
  submissionId: string,
  score:        number,
  notes:        string | null,
): Promise<void> {
  const { judgeToken, competition } = await getValidJudgeToken(token)

  const min     = competition.score_min ?? 1
  const max     = competition.score_max ?? 10
  const clamped = Math.min(max, Math.max(min, score))

  const service = createServiceClient()
  await service.from('scores').upsert(
    {
      submission_id:  submissionId,
      judge_token_id: judgeToken.id,
      score:          clamped,
      notes:          notes ?? null,
    },
    { onConflict: 'submission_id,judge_token_id' },
  )
}

// ── Save within-group rank for tie-breaking ───────────────────────────────────
export async function saveRank(
  token:        string,
  submissionId: string,
  rank:         number | null,
): Promise<void> {
  const { judgeToken } = await getValidJudgeToken(token)

  const service = createServiceClient()
  await service
    .from('scores')
    .update({ rank })
    .eq('submission_id', submissionId)
    .eq('judge_token_id', judgeToken.id)
}

// ── Toggle flagged state ──────────────────────────────────────────────────────
export async function saveFlag(
  token:        string,
  submissionId: string,
  flagged:      boolean,
): Promise<void> {
  const { judgeToken } = await getValidJudgeToken(token)

  const service = createServiceClient()
  // Upsert so flagging works even on images that haven't been scored yet.
  // score is omitted intentionally — ON CONFLICT only updates the flagged column.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await service.from('scores').upsert(
    { submission_id: submissionId, judge_token_id: judgeToken.id, flagged } as any,
    { onConflict: 'submission_id,judge_token_id' },
  )
}

// ── Save an award assignment ──────────────────────────────────────────────────
export async function saveAward(
  token:        string,
  submissionId: string,
  awardId:      string | null,
): Promise<void> {
  const { judgeToken } = await getValidJudgeToken(token)

  const service = createServiceClient()
  await service
    .from('scores')
    .update({ award_id: awardId })
    .eq('submission_id', submissionId)
    .eq('judge_token_id', judgeToken.id)
}

// ── Mark the awards pass for a category as complete ───────────────────────────
export async function markAwardsComplete(
  token:      string,
  categoryId: string,
): Promise<void> {
  const { judgeToken } = await getValidJudgeToken(token)

  const service = createServiceClient()
  await service
    .from('judge_category_awards')
    .upsert(
      { judge_token_id: judgeToken.id, category_id: categoryId },
      { onConflict: 'judge_token_id,category_id' },
    )
}

// ── Apply bucket scores as starting points ────────────────────────────────────
export async function applyBucketScores(
  token:    string,
  buckets:  { submissionId: string; score: number }[],
): Promise<void> {
  const { judgeToken, competition } = await getValidJudgeToken(token)

  const min = competition.score_min ?? 1
  const max = competition.score_max ?? 10
  const service = createServiceClient()

  await Promise.all(
    buckets.map(({ submissionId, score }) => {
      const clamped = Math.min(max, Math.max(min, score))
      return service.from('scores').upsert(
        {
          submission_id:  submissionId,
          judge_token_id: judgeToken.id,
          score:          clamped,
          notes:          null,
        },
        { onConflict: 'submission_id,judge_token_id', ignoreDuplicates: true },
      )
    }),
  )
}

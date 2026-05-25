import { createServiceClient } from '@/lib/supabase/service'
import RecognitionClient from './RecognitionClient'

export const dynamic = 'force-dynamic'

export default async function RecognitionPage() {
  const admin = createServiceClient()

  const { data: s } = await admin
    .from('club_settings')
    .select('poy_categories_factor, poy_separate_per_category, poy_branch_a_counting, poy_branch_a_top_n, poy_branch_a_exclude_n, poy_b1_counting, poy_b1_top_n, poy_b1_exclude_n, poy_b2_counting, poy_b2_top_n, poy_b2_exclude_n, poy_tiebreaker, poy_eligibility, poy_eligibility_min_dur')
    .single()

  // scoreMax will be read from competition_defaults table once it exists.
  // For now, 30 matches the INITIAL.score_max default in CompetitionDefaultsClient.
  const scoreMax = 30

  return (
    <RecognitionClient
      scoreMax={scoreMax}
      initialPoy={s ? {
        poy_categories_factor:     s.poy_categories_factor     ?? false,
        poy_separate_per_category: s.poy_separate_per_category ?? false,
        poy_branch_a_counting:     (s.poy_branch_a_counting    ?? 'all') as 'all' | 'top_n' | 'exclude_lowest',
        poy_branch_a_top_n:        s.poy_branch_a_top_n        ?? 5,
        poy_branch_a_exclude_n:    s.poy_branch_a_exclude_n    ?? 1,
        poy_b1_counting:           (s.poy_b1_counting          ?? 'top_n') as 'all' | 'top_n' | 'exclude_lowest',
        poy_b1_top_n:              s.poy_b1_top_n              ?? 3,
        poy_b1_exclude_n:          s.poy_b1_exclude_n          ?? 1,
        poy_b2_counting:           (s.poy_b2_counting          ?? 'top_n') as 'top_n' | 'exclude_lowest',
        poy_b2_top_n:              s.poy_b2_top_n              ?? 4,
        poy_b2_exclude_n:          s.poy_b2_exclude_n          ?? 1,
        poy_tiebreaker:            (s.poy_tiebreaker           ?? 'next_highest') as 'next_highest' | 'most_images' | 'admin_decision',
        poy_eligibility:           (s.poy_eligibility          ?? 'active_members') as 'active_members' | 'all_members' | 'min_duration',
        poy_eligibility_min_dur:   (s.poy_eligibility_min_dur  ?? '6_months') as '1_month' | '3_months' | '6_months' | '1_year',
      } : undefined}
    />
  )
}

import { createClient } from '@/lib/supabase/server'
import RecognitionClient from './RecognitionClient'

export default async function RecognitionPage() {
  const supabase = await createClient()

  // scoreMax will be read from competition_defaults table once it exists.
  // For now, 30 matches the INITIAL.score_max default in CompetitionDefaultsClient.
  const scoreMax = 30

  return (
    <RecognitionClient
      scoreMax={scoreMax}
    />
  )
}

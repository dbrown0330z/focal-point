import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export const dynamic = 'force-dynamic'

type AwardTierRaw = { id: string; label: string }

export type HistoryEntry = {
  submissionId: string
  imageId:      string
  imageTitle:   string
  imageUrl:     string
  competitionId:    string
  competitionTitle: string
  categoryName: string
  score:        number | null
  awardId:      string | null
  awardLabel:   string | null
  seasonYear:   number
  closedAt:     string | null
}

export type ProfileData = {
  first_name:          string | null
  last_name:           string | null
  display_name:        string
  bio:                 string | null
  experience_level:    string | null
  shooting_interests:  string[]
  camera_brands:       string[]
  member_number:       number | null
  membership_class:    string | null
  membership_status:   string
  role:                string | null
  avatar_url:          string | null
  created_at:          string
  location:            string | null
  phone:               string | null
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: subsRaw }] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, last_name, display_name, bio, experience_level, shooting_interests, camera_brands, member_number, membership_class, membership_status, role, avatar_url, created_at, location, phone')
      .eq('id', user.id)
      .single(),
    supabase
      .from('submissions')
      .select(`
        id,
        competition_id,
        image_id,
        images(title, storage_path),
        competition_categories(name),
        competitions(id, title, short_title, closes_at, status, award_types),
        scores(score, award_id)
      `)
      .eq('member_id', user.id)
      .eq('status', 'submitted'),
  ])

  if (!profile) redirect('/login')

  // Process competition history
  // Scores are only returned by RLS for closed/results_published competitions
  const historyEntries: HistoryEntry[] = (subsRaw ?? []).flatMap(sub => {
    const img  = sub.images as { title: string; storage_path: string } | null
    const cat  = sub.competition_categories as { name: string } | null
    const comp = sub.competitions as unknown as {
      id: string; title: string; short_title: string | null;
      closes_at: string | null; status: string; award_types: AwardTierRaw[] | null
    } | null
    const scores = (sub.scores as { score: number; award_id: string | null }[] | null) ?? []

    if (!img || !comp) return []

    const avgScore  = scores.length
      ? scores.reduce((a, b) => a + b.score, 0) / scores.length
      : null
    const awardId    = scores.find(s => s.award_id)?.award_id ?? null
    const awardTypes = (comp.award_types ?? []) as AwardTierRaw[]
    const awardLabel = awardId ? (awardTypes.find(t => t.id === awardId)?.label ?? null) : null
    const year       = comp.closes_at ? new Date(comp.closes_at).getFullYear() : new Date().getFullYear()
    const publicUrl  = supabase.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl

    return [{
      submissionId:     sub.id,
      imageId:          sub.image_id,
      imageTitle:       img.title,
      imageUrl:         publicUrl,
      competitionId:    comp.id,
      competitionTitle: comp.short_title ?? comp.title,
      categoryName:     cat?.name ?? '',
      score:            avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
      awardId,
      awardLabel,
      seasonYear:       year,
      closedAt:         comp.closes_at,
    }]
  })

  return (
    <ProfileClient
      profile={profile as ProfileData}
      historyEntries={historyEntries}
      userEmail={user.email ?? ''}
      userId={user.id}
    />
  )
}

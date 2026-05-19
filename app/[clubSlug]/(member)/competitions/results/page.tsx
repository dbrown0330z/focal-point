import { redirect } from 'next/navigation'
import { getClubContext } from '@/lib/club-context'

// The competition list (including past competitions with results links) lives at /competitions.
export default async function CompetitionResultsIndexPage() {
  const ctx = await getClubContext()
  redirect(`/${ctx?.clubSlug ?? ''}/competitions`)
}

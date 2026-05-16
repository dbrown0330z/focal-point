import { redirect } from 'next/navigation'

// The competition list (including past competitions with results links) lives at /competitions.
export default function CompetitionResultsIndexPage() {
  redirect('/competitions')
}

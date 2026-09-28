import { redirect } from 'next/navigation'
import { getSections } from '@/lib/help'
import { requireClubSlug } from '@/lib/club-context'

export default async function HelpIndexPage() {
  const clubSlug = await requireClubSlug()
  const sections = getSections()
  const first    = sections[0]?.articles[0]
  if (first) redirect(`/${clubSlug}/help/${first.slug.join('/')}`)
  return null
}

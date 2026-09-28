import { redirect } from 'next/navigation'
import { getSections } from '@/lib/help'
import { requireClubSlug } from '@/lib/club-context'

export default async function HelpIndexPage() {
  const clubSlug = await requireClubSlug()
  const sections = getSections()
  const memberSection = sections.find(s => s.key === 'member') ?? sections[0]
  const first = memberSection?.articles[0]
  if (first) redirect(`/${clubSlug}/help/${first.slug.join('/')}`)
  return null
}

import { redirect } from 'next/navigation'
import { requireClubSlug } from '@/lib/club-context'
import { getSections } from '@/lib/help'

export default async function HelpRootPage() {
  const clubSlug = await requireClubSlug()
  const sections = getSections()
  const member   = sections.find(s => s.key === 'member') ?? sections[0]
  const first    = member?.articles[0]
  if (first) redirect(`/${clubSlug}/help/${first.slug.join('/')}`)
  return null
}

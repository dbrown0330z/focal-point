import { redirect } from 'next/navigation'
import { getSections } from '@/lib/help'

export default async function HelpSectionIndexPage({
  params,
}: {
  params: Promise<{ clubSlug: string; section: string }>
}) {
  const { clubSlug, section } = await params
  const sections = getSections()
  const current  = sections.find(s => s.key === section)
  const first    = current?.articles[0]
  if (first) redirect(`/${clubSlug}/help/${first.slug.join('/')}`)
  return null
}

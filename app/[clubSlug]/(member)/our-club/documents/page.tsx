import { redirect } from 'next/navigation'
import { getClubContext } from '@/lib/club-context'

export default async function DocumentsPage() {
  const ctx = await getClubContext()
  redirect(`/${ctx!.clubSlug}/resources`)
}

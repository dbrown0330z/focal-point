import { redirect } from 'next/navigation'
import { getClubContext } from '@/lib/club-context'

export default async function NavigationPage() {
  const ctx = await getClubContext()
  redirect(`/${ctx!.clubSlug}/admin/content`)
}

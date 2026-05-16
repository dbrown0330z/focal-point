import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireClubId } from '@/lib/club-context'
import AdminThemeProvider from '@/components/layout/AdminThemeProvider'
import AdminShell from '@/components/admin/AdminShell'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clubSlug: string }>
}) {
  const { clubSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const clubId = await requireClubId()

  const { data: membership } = await supabase
    .from('club_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('club_id', clubId)
    .maybeSingle()

  if (membership?.role !== 'admin') redirect(`/${clubSlug}`)

  return (
    <AdminThemeProvider>
      <AdminShell clubSlug={clubSlug}>{children}</AdminShell>
    </AdminThemeProvider>
  )
}

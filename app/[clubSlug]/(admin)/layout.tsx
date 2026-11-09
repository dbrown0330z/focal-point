import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId } from '@/lib/club-context'
import AdminThemeProvider from '@/components/layout/AdminThemeProvider'
import AdminShell from '@/components/admin/AdminShell'
import DraftBanner from '@/components/admin/DraftBanner'
import { AppFooter } from '@/components/layout/AppFooter'

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
  const admin = createServiceClient()

  if (!user) redirect(`/${clubSlug}/login`)

  const clubId = await requireClubId()

  const [{ data: membership }, { data: club }] = await Promise.all([
    admin.from('club_memberships').select('role').eq('user_id', user.id).eq('club_id', clubId).maybeSingle(),
    admin.from('clubs').select('is_published, dues_mode').eq('id', clubId).single(),
  ])

  if (membership?.role !== 'admin') redirect(`/${clubSlug}`)

  const draftBanner = !club?.is_published ? (
    <DraftBanner checklist={{ duesModeOk: !!club?.dues_mode, clubSlug }} />
  ) : null

  return (
    <AdminThemeProvider>
      <AdminShell clubSlug={clubSlug} banner={draftBanner} footer={<AppFooter variant="app" />}>
        {children}
      </AdminShell>
    </AdminThemeProvider>
  )
}

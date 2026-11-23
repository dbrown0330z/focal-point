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

  const [
    { data: membership },
    { data: club },
    { count: competitionCount },
    { count: postCount },
  ] = await Promise.all([
    admin.from('club_memberships').select('role').eq('user_id', user.id).eq('club_id', clubId).maybeSingle(),
    admin.from('clubs').select('is_published, dues_mode').eq('id', clubId).single(),
    admin.from('competitions').select('id', { count: 'exact', head: true }).eq('club_id', clubId).is('deleted_at', null),
    admin.from('posts').select('id', { count: 'exact', head: true }).eq('club_id', clubId),
  ])

  if (membership?.role !== 'admin') redirect(`/${clubSlug}`)

  const draftBanner = !club?.is_published ? (
    <DraftBanner checklist={{
      clubSlug,
      duesModeOk:     !!club?.dues_mode,
      hasCompetition: (competitionCount ?? 0) > 0,
      hasPost:        (postCount ?? 0) > 0,
    }} />
  ) : null

  return (
    <AdminThemeProvider>
      <AdminShell clubSlug={clubSlug} banner={draftBanner} footer={<AppFooter variant="app" />}>
        {children}
      </AdminShell>
    </AdminThemeProvider>
  )
}

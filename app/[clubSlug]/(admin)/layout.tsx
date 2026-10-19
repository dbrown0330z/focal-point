import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId } from '@/lib/club-context'
import AdminThemeProvider from '@/components/layout/AdminThemeProvider'
import AdminShell from '@/components/admin/AdminShell'
import DraftBanner, { type DraftChecklist } from '@/components/admin/DraftBanner'
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

  const [{ data: membership }, { data: club }, { data: settings }] = await Promise.all([
    admin.from('club_memberships').select('role').eq('user_id', user.id).eq('club_id', clubId).maybeSingle(),
    admin.from('clubs').select('is_published, dues_mode').eq('id', clubId).single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('club_settings').select('club_name, description').eq('club_id', clubId).maybeSingle(),
  ])

  if (membership?.role !== 'admin') redirect(`/${clubSlug}`)

  // Show banner only while site is in draft mode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settingsRow = settings as any
  const draftBanner = !club?.is_published ? (
    <DraftBanner
      checklist={{
        clubBasicsOk:    !!(settingsRow?.club_name?.trim() && settingsRow?.description?.trim()),
        duesModeOk:      !!club?.dues_mode,
        currentDuesMode: (club?.dues_mode as DraftChecklist['currentDuesMode']) ?? null,
        clubSlug,
      }}
    />
  ) : null

  return (
    <AdminThemeProvider>
      <AdminShell clubSlug={clubSlug} banner={draftBanner} footer={<AppFooter variant="app" />}>
        {children}
      </AdminShell>
    </AdminThemeProvider>
  )
}

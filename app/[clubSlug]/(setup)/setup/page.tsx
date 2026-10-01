import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { getClubContext } from '@/lib/club-context'
import SetupWizard from './SetupWizard'

export const dynamic = 'force-dynamic'

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getClubContext()
  if (!ctx) redirect('/')

  const admin = createServiceClient()
  const { data: settings } = await (admin as any)
    .from('club_settings')
    .select('setup_complete, club_name')
    .eq('club_id', ctx.clubId)
    .single()

  if (settings?.setup_complete) redirect(`/${ctx.clubSlug}/admin`)

  // Verify this user is an admin of this club
  const { data: membership } = await (admin as any)
    .from('club_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('club_id', ctx.clubId)
    .single()

  if (!membership || membership.role !== 'admin') redirect('/')

  return <SetupWizard clubSlug={ctx.clubSlug} clubId={ctx.clubId} clubName={ctx.clubName} />
}

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { getClubContext } from '@/lib/club-context'

export const dynamic = 'force-dynamic'

// Skip the setup wizard — mark setup complete and go straight to admin.
// Short name, timezone, and other basics are configurable in Admin → Club Basics.
export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getClubContext()
  if (!ctx) redirect('/')

  const admin = createServiceClient()

  const { data: membership } = await (admin as any)
    .from('club_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('club_id', ctx.clubId)
    .single()

  if (!membership || membership.role !== 'admin') redirect('/')

  await (admin as any)
    .from('club_settings')
    .update({ setup_complete: true })
    .eq('club_id', ctx.clubId)

  redirect(`/${ctx.clubSlug}/admin`)
}

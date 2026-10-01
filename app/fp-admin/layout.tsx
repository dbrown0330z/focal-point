import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import FPAdminSidebar from '@/components/fp-admin/FPAdminSidebar'

export const dynamic = 'force-dynamic'

export default async function FPAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?fp=1')

  const admin = createServiceClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('is_fp_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_fp_admin) redirect('/')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F9FAFB' }}>
      <FPAdminSidebar />
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto max-w-[1100px]">
          {children}
        </div>
      </main>
    </div>
  )
}

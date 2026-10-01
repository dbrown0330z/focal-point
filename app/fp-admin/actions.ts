'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function fpAdminLogout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login?fp=1')
}

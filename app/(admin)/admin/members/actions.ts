'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

type MembershipStatus = Database['public']['Enums']['membership_status']

export async function setMemberStatus(memberId: string, status: MembershipStatus) {
  const supabase = createServiceClient()

  const roleByStatus: Partial<Record<MembershipStatus, 'member' | 'admin' | null>> = {
    active:        'member',
    complimentary: 'member',
    pending:       null,
    approved:      null,
    expired:       null,
    cancelled:     null,
    paused:        null,
    banned:        null,
  }

  await supabase
    .from('profiles')
    .update({
      membership_status: status,
      ...(status in roleByStatus ? { role: roleByStatus[status] } : {}),
    })
    .eq('id', memberId)

  revalidatePath('/admin/members')
}

export async function approveMember(memberId: string) {
  return setMemberStatus(memberId, 'approved')
}

export async function makeAdmin(memberId: string) {
  const supabase = createServiceClient()
  await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', memberId)
  revalidatePath('/admin/members')
}

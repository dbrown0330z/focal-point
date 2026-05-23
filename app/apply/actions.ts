'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'

export interface ApplyData {
  firstName: string
  lastName: string
  email: string
  password: string
}

export async function applyForMembership(data: ApplyData): Promise<{ error?: string }> {
  const displayName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim()
  const ctx = await getClubContext()

  // Use the service client to create the user without sending a verification
  // email. email_confirm: true marks the address as already verified so
  // Supabase never triggers the confirmation flow.
  // Admin approval is the only gate — email verification adds no value here
  // and creates a confusing two-email experience for applicants.
  const service = createServiceClient()
  const { data: newUser, error: createErr } = await service.auth.admin.createUser({
    email:         data.email,
    password:      data.password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      first_name:   data.firstName.trim(),
      last_name:    data.lastName.trim(),
    },
  })

  if (createErr) return { error: createErr.message }

  // Ensure a club_memberships row exists for this applicant. The DB trigger
  // should create one, but it isn't always reliable (e.g. if migrations haven't
  // fully run or the trigger fires after this function returns). Upserting here
  // guarantees the row is present before the admin tries to activate them.
  if (newUser?.user?.id && ctx?.clubId) {
    await service
      .from('club_memberships')
      .upsert(
        { user_id: newUser.user.id, club_id: ctx.clubId, membership_status: 'pending' },
        { onConflict: 'user_id,club_id' }
      )
  }

  // Sign them in immediately so the root page can show the pending-approval
  // state without requiring a separate login step.
  const supabase = await createClient()
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email:    data.email,
    password: data.password,
  })

  // Non-fatal — user can sign in manually if this fails
  if (signInErr) console.warn('[apply] auto sign-in failed:', signInErr.message)

  return {}
}

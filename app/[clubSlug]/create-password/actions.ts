'use server'

import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function setInitialPassword(
  clubSlug: string,
  uid: string,
  password: string,
): Promise<{ error?: string }> {
  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const admin = createServiceClient()

  // Validate: club is active and this uid's email matches contact_email
  const { data: club } = await (admin as any)
    .from('clubs')
    .select('contact_email, status')
    .eq('slug', clubSlug)
    .maybeSingle()

  if (!club || club.status !== 'active') {
    return { error: 'Club not found or not yet active.' }
  }

  const { data: { user }, error: lookupErr } = await admin.auth.admin.getUserById(uid)
  if (lookupErr || !user) return { error: 'Account not found.' }
  if (user.email !== club.contact_email) return { error: 'Account mismatch.' }

  // Set the password
  const { error: pwErr } = await admin.auth.admin.updateUserById(uid, { password })
  if (pwErr) return { error: pwErr.message }

  // Sign them in so they land on setup already authenticated
  const supabase = await createClient()
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: club.contact_email,
    password,
  })
  if (signInErr) {
    // Password set but sign-in failed — send to login, they can sign in manually
    redirect(`/${clubSlug}/login?reset=1`)
  }

  redirect(`/${clubSlug}/setup`)
}

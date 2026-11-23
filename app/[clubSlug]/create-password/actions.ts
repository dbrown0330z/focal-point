'use server'

import { createServiceClient } from '@/lib/supabase/service'

export async function setInitialPassword(
  clubSlug: string,
  uid: string,
  password: string,
): Promise<{ error?: string; email?: string }> {
  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const admin = createServiceClient()

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

  const { error: pwErr } = await admin.auth.admin.updateUserById(uid, { password })
  if (pwErr) return { error: pwErr.message }

  // Return email so the client can POST to /api/auth/login directly,
  // which reliably sets session cookies on the redirect response.
  return { email: club.contact_email }
}

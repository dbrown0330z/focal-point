'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export interface ApplyData {
  firstName: string
  lastName: string
  email: string
  password: string
}

export async function applyForMembership(data: ApplyData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const displayName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim()

  // Build the origin from request headers so this works in dev, staging,
  // and production without needing a SITE_URL env var.
  const headersList = await headers()
  const host     = headersList.get('host') ?? 'localhost:3000'
  const proto    = headersList.get('x-forwarded-proto') ?? 'http'
  const origin   = `${proto}://${host}`

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      // After Supabase sends the confirmation email, the link points here.
      // The callback exchanges the PKCE code for a session, then redirects
      // to '/' where the root page shows the pending-approval state.
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        display_name: displayName,
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
      },
    },
  })

  if (error) return { error: error.message }
  return {}
}

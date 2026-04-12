'use server'

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

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
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

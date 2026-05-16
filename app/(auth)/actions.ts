'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  // app/page.tsx handles the club redirect for authenticated users
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const firstName = (formData.get('first_name') as string).trim()
  const lastName  = (formData.get('last_name') as string).trim()
  const displayName = `${firstName} ${lastName}`.trim()

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: { display_name: displayName, first_name: firstName, last_name: lastName },
    },
  })

  if (error) {
    redirect('/signup?error=' + encodeURIComponent(error.message))
  }

  // Account created — role is null until admin approves
  redirect('/login?pending=1')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect('/reset-password?error=' + encodeURIComponent(error.message))
  }

  redirect('/login?reset=1')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

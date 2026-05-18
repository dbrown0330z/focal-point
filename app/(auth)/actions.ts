'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  console.log('[login] action started')
  let supabase
  try {
    supabase = await createClient()
    console.log('[login] client created, URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30))
  } catch (e) {
    console.error('[login] createClient threw:', e)
    redirect('/login?error=client_init_failed')
  }

  const { error } = await supabase!.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  console.log('[login] signInWithPassword result — error:', error?.message ?? 'none')

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  console.log('[login] success, redirecting to /')
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
  // Determine where to send the user after sign-out.
  // If we're inside a club route the context cookie is still set at this point,
  // so we can build a ?next= URL that brings them back to the right login page.
  const { getClubContext } = await import('@/lib/club-context')
  const ctx = await getClubContext()
  const next = ctx ? `/${ctx.clubSlug}` : null
  redirect(next ? `/login?next=${encodeURIComponent(next)}` : '/login')
}

import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import LoginForm from './LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; pending?: string; reset?: string; next?: string }>
}) {
  const { error, pending, reset, next } = await searchParams

  // Look up the default club and redirect to the club-specific login
  const admin = createServiceClient()
  const { data: club } = await admin
    .from('clubs')
    .select('slug')
    .limit(1)
    .single()

  if (club?.slug) {
    const params = new URLSearchParams()
    if (error)   params.set('error',   error)
    if (pending) params.set('pending', pending)
    if (reset)   params.set('reset',   reset)
    if (next)    params.set('next',    next)
    const qs = params.toString()
    redirect(`/${club.slug}/login${qs ? `?${qs}` : ''}`)
  }

  // Fallback: no club found — render form as-is
  return <LoginForm errorParam={error} pendingParam={pending} resetParam={reset} nextParam={next} />
}

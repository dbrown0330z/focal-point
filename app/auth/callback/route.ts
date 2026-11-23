import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code   = searchParams.get('code')
  const next   = searchParams.get('next') ?? '/'
  const verify = searchParams.get('verify') === '1'

  if (code) {
    const cookieStore = await cookies()
    const redirectResponse = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              redirectResponse.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    // After a successful signup email verification, promote the member from
    // 'pending' → 'approved' so they land on the onboarding profile page.
    // The 'verify=1' flag is only set by the apply form's emailRedirectTo URL,
    // so this block never runs for password resets or other auth callbacks.
    if (verify) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id) {
          const service = createServiceClient()
          await Promise.all([
            service
              .from('club_memberships')
              .update({ membership_status: 'approved' })
              .eq('user_id', user.id)
              .eq('membership_status', 'pending'),
            service
              .from('profiles')
              .update({ membership_status: 'approved' })
              .eq('id', user.id)
              .neq('membership_status', 'active'),
          ])
        }
      } catch (err) {
        // Non-fatal — member can be manually approved if this fails
        console.error('[auth/callback] failed to promote member status:', err)
      }
    }

    return redirectResponse
  }

  return NextResponse.redirect(`${origin}/login?error=Invalid+or+expired+link`)
}

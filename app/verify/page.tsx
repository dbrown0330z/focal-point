import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) redirect('/?verified=invalid')

  const admin = createServiceClient()

  const { data: club } = await admin
    .from('clubs')
    .select('id, slug, contact_email, admin_first_name, name, verification_expires_at, verified_at')
    .eq('verification_token', token)
    .maybeSingle()

  if (!club) redirect('/?verified=invalid')

  // Already verified — they may have clicked the link twice; send to login
  if (club.verified_at) redirect('/login')

  if (!club.verification_expires_at || new Date(club.verification_expires_at) < new Date()) {
    redirect('/?verified=expired')
  }

  // ── Provision the club ────────────────────────────────────────────────────

  // Create (or retrieve) the Supabase auth user — email already confirmed
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email:         club.contact_email!,
    email_confirm: true,
  })

  // 'User already registered' is fine — they clicked verify a second time
  if (userError && !userError.message.includes('already')) {
    redirect('/?verified=error')
  }

  // Upsert club_settings so the club exists as a tenant
  await admin
    .from('club_settings')
    .upsert({ club_id: club.id }, { onConflict: 'club_id' })

  // Mark the club active and clear the one-time token
  await admin
    .from('clubs')
    .update({
      status:             'active',
      verified_at:        new Date().toISOString(),
      verification_token: null,
    })
    .eq('id', club.id)

  // ── Generate a magic sign-in link → setup wizard ──────────────────────────
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://focalpointhq.com'

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type:  'magiclink',
    email: club.contact_email!,
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/${club.slug}/setup`,
    },
  })

  if (linkError || !linkData?.properties?.action_link) {
    // Fallback: send to club login page — they can request a magic link or reset password there
    redirect(`/${club.slug}/login?verified=1&email=${encodeURIComponent(club.contact_email!)}`)
  }

  redirect(linkData.properties.action_link)
}

'use server'

import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'

export async function confirmVerification(token: string) {
  const admin = createServiceClient()

  const { data: club } = await admin
    .from('clubs')
    .select('id, slug, contact_email, name, verification_expires_at, verified_at')
    .eq('verification_token', token)
    .maybeSingle()

  if (!club) redirect('/?verified=invalid')

  // Already verified — send to their club login
  if (club.verified_at) redirect(`/${club.slug}/login`)

  if (!club.verification_expires_at || new Date(club.verification_expires_at) < new Date()) {
    redirect('/?verified=expired')
  }

  // ── Provision the club ─────────────────────────────────────────────────────

  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email:         club.contact_email!,
    email_confirm: true,
  })

  if (userError && !userError.message.includes('already')) {
    redirect('/?verified=error')
  }

  await admin
    .from('club_settings')
    .upsert({ club_id: club.id }, { onConflict: 'club_id' })

  await admin
    .from('clubs')
    .update({
      status:             'active',
      verified_at:        new Date().toISOString(),
      verification_token: null,
    })
    .eq('id', club.id)

  // ── Generate magic sign-in link → setup wizard ─────────────────────────────

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://focalpointhq.com'

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type:  'magiclink',
    email: club.contact_email!,
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/${club.slug}/setup`,
    },
  })

  if (linkError || !linkData?.properties?.action_link) {
    redirect(`/${club.slug}/login?verified=1&email=${encodeURIComponent(club.contact_email!)}`)
  }

  redirect(linkData.properties.action_link)
}

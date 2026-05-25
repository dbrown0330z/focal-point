'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendMemberWelcome, sendAdminNewActiveMember } from '@/lib/email/send'

export async function completeProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const experienceLevel = formData.get('experienceLevel') as string
  const bio = (formData.get('bio') as string | null)?.trim() ?? ''
  const location = (formData.get('location') as string | null)?.trim() ?? ''
  const phone = (formData.get('phone') as string | null)?.trim() ?? ''
  const avatarUrl = formData.get('avatarUrl') as string | null
  const shootingInterests = formData.getAll('shootingInterests') as string[]
  const cameraBrands = formData.getAll('cameraBrands') as string[]

  await supabase
    .from('profiles')
    .update({
      experience_level: experienceLevel || null,
      shooting_interests: shootingInterests,
      camera_brands: cameraBrands,
      bio: bio || null,
      location: location || null,
      phone: phone || null,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq('id', user.id)

  redirect('/onboarding/payment')
}

export async function completePayment(_formData?: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  // Activate the membership — update both profiles and club_memberships
  await service
    .from('profiles')
    .update({ membership_status: 'active', role: 'member' })
    .eq('id', user.id)

  // Find this user's club membership to update it and get the club slug
  const { data: memberships } = await service
    .from('club_memberships')
    .select('club_id, clubs!inner(slug, name)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const clubId   = memberships?.club_id ?? null
  const club     = memberships
    ? (memberships as { clubs: { slug: string; name: string } }).clubs
    : null
  const clubSlug = club?.slug ?? null
  const clubName = club?.name ?? 'the club'

  if (clubId) {
    await service
      .from('club_memberships')
      .update({ membership_status: 'active', role: 'member' })
      .eq('user_id', user.id)
      .eq('club_id', clubId)
  }

  // Send welcome email to member and notification to all club admins
  try {
    const [{ data: profile }, { data: { user: authUser } }] = await Promise.all([
      service.from('profiles').select('first_name, display_name, shooting_interests').eq('id', user.id).single(),
      service.auth.admin.getUserById(user.id),
    ])

    const firstName   = profile?.first_name || profile?.display_name?.split(' ')[0] || 'there'
    const memberName  = profile?.display_name ?? firstName
    const email       = authUser?.email ?? user.email
    const base        = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://focalpointhq.com'
    const clubUrl     = clubSlug ? `${base}/${clubSlug}` : base
    const membersUrl  = clubSlug ? `${base}/${clubSlug}/admin/members` : base
    const interests   = (profile?.shooting_interests as string[]) ?? []

    if (email) {
      await sendMemberWelcome({ memberEmail: email, firstName, clubName, interests, clubUrl })
    }

    // Notify all admins
    if (clubId) {
      const { data: adminMemberships } = await service
        .from('club_memberships')
        .select('user_id')
        .eq('club_id', clubId)
        .eq('role', 'admin')

      if (adminMemberships?.length) {
        const adminUserIds = adminMemberships.map(a => a.user_id)
        const [{ data: adminProfiles }, { data: { users: adminUsers } }] = await Promise.all([
          service.from('profiles').select('id, first_name, display_name').in('id', adminUserIds),
          service.auth.admin.listUsers({ perPage: 1000 }),
        ])
        const adminEmails: Record<string, string> = {}
        for (const u of adminUsers) {
          if (u.email && adminUserIds.includes(u.id)) adminEmails[u.id] = u.email
        }
        const profileById: Record<string, { first_name: string | null; display_name: string }> = {}
        for (const p of adminProfiles ?? []) profileById[p.id] = p

        await Promise.allSettled(
          adminUserIds.map(adminId => {
            const adminEmail = adminEmails[adminId]
            if (!adminEmail) return Promise.resolve()
            const p = profileById[adminId]
            const adminFirstName = p?.first_name || p?.display_name?.split(' ')[0] || 'Admin'
            return sendAdminNewActiveMember({
              adminEmail, adminFirstName, memberName, clubName, memberUrl: membersUrl,
            })
          })
        )
      }
    }
  } catch (err) {
    console.error('[completePayment] notification failed:', err)
  }

  redirect(clubSlug ? `/${clubSlug}` : '/')
}

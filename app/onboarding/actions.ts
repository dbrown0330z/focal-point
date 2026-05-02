'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function completeProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const experienceLevel = formData.get('experienceLevel') as string
  const bio = (formData.get('bio') as string | null)?.trim() ?? ''
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
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq('id', user.id)

  redirect('/onboarding/payment')
}

export async function completePayment(_formData?: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Dummy payment — activate the membership
  const service = createServiceClient()
  await service
    .from('profiles')
    .update({ membership_status: 'active', role: 'member' })
    .eq('id', user.id)

  redirect('/')
}

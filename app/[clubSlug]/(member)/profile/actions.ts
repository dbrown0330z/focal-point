'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type ProfileUpdateData = {
  first_name: string
  last_name: string
  display_name: string
  bio: string
  experience_level: string
  shooting_interests: string[]
  camera_brands: string[]
  location: string
  phone: string
}

export async function updateProfile(data: ProfileUpdateData): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await admin
    .from('profiles')
    .update({
      first_name:         data.first_name || null,
      last_name:          data.last_name || null,
      display_name:       data.display_name,
      bio:                data.bio || null,
      experience_level:   data.experience_level || null,
      shooting_interests: data.shooting_interests,
      camera_brands:      data.camera_brands,
      location:           data.location || null,
      phone:              data.phone || null,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { error: null }
}

export async function updateAvatarUrl(avatarUrl: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await admin
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { error: null }
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Not authenticated' }

  // Verify current password by re-signing in
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (verifyError) return { error: 'Current password is incorrect' }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }

  return { error: null }
}

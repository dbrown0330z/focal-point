'use server'

import { createServiceClient } from '@/lib/supabase/service'

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
}

export async function submitClubApplication(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const clubName      = (formData.get('clubName')      as string)?.trim()
  const location      = (formData.get('location')      as string)?.trim() || null
  const firstName     = (formData.get('firstName')     as string)?.trim()
  const lastName      = (formData.get('lastName')      as string)?.trim()
  const contactEmail  = (formData.get('contactEmail')  as string)?.trim()

  if (!clubName || !firstName || !lastName || !contactEmail) {
    return { error: 'Please fill in all required fields.' }
  }

  const baseSlug = slugify(clubName)
  if (!baseSlug) return { error: 'Club name produced an invalid URL slug.' }

  const admin = createServiceClient()

  // Ensure slug uniqueness by appending a counter if needed
  let slug = baseSlug
  let attempt = 0
  while (true) {
    const { data } = await admin.from('clubs').select('id').eq('slug', slug).maybeSingle()
    if (!data) break
    attempt++
    slug = `${baseSlug}-${attempt}`
  }

  const { error } = await admin.from('clubs').insert({
    name:             clubName,
    slug,
    status:           'pending',
    contact_email:    contactEmail,
    admin_first_name: firstName,
    admin_last_name:  lastName,
    submitted_at:     new Date().toISOString(),
  })

  if (error) return { error: error.message }
  return { ok: true }
}

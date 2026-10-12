'use server'

import { randomUUID } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { sendClubSignupVerification } from '@/lib/email/send'

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
}

function looksLikeRandomString(s: string): boolean {
  if (!s || s.length < 3) return false
  const upper = (s.match(/[A-Z]/g) ?? []).length
  const lower = (s.match(/[a-z]/g) ?? []).length
  const total = upper + lower
  if (total === 0) return false
  const mixRatio = Math.min(upper, lower) / total
  if (s.length > 12 && mixRatio > 0.35 && !s.includes(' ')) return true
  const vowels = (s.match(/[aeiouAEIOU]/g) ?? []).length
  if (s.length > 8 && vowels / total < 0.1) return true
  return false
}

function isLikelyBot(clubName: string, firstName: string, lastName: string): boolean {
  if (clubName.length > 10 && !clubName.includes(' ') && looksLikeRandomString(clubName)) return true
  if (looksLikeRandomString(firstName)) return true
  if (looksLikeRandomString(lastName)) return true
  const fullName = `${firstName} ${lastName}`
  if (fullName.length > 15 && looksLikeRandomString(fullName.replace(' ', ''))) return true
  return false
}

export async function submitClubApplication(formData: FormData): Promise<{ error?: string; ok?: boolean; alreadyActive?: boolean }> {
  // ── Honeypot ───────────────────────────────────────────────────────────────
  const trap = (formData.get('website') as string | null) ?? ''
  if (trap.length > 0) return { ok: true }

  const clubName     = (formData.get('clubName')     as string)?.trim()
  const location     = (formData.get('location')     as string)?.trim() || null
  const firstName    = (formData.get('firstName')    as string)?.trim()
  const lastName     = (formData.get('lastName')     as string)?.trim()
  const contactEmail = (formData.get('contactEmail') as string)?.trim()

  if (!clubName || !firstName || !lastName || !contactEmail) {
    return { error: 'Please fill in all required fields.' }
  }

  if (isLikelyBot(clubName, firstName, lastName)) return { ok: true }

  const baseSlug = slugify(clubName)
  if (!baseSlug || baseSlug.length < 2) return { error: 'Club name produced an invalid URL slug.' }

  if (!contactEmail.includes('.') || contactEmail.split('@')[1]?.length < 3) {
    return { error: 'Please enter a valid email address.' }
  }

  const admin = createServiceClient()

  // ── Duplicate email check ──────────────────────────────────────────────────
  const { data: existing } = await admin
    .from('clubs')
    .select('id, slug, status, admin_first_name, name, verification_token')
    .eq('contact_email', contactEmail)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'active') {
      // Already a live club with this email — tell them to sign in
      return { alreadyActive: true }
    }

    // Pending (unverified) — resend with a fresh token
    const verificationToken   = randomUUID()
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await admin
      .from('clubs')
      .update({
        verification_token:      verificationToken,
        verification_expires_at: verificationExpires,
        admin_first_name:        firstName,
        admin_last_name:         lastName,
      })
      .eq('id', existing.id)

    const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://focalpointhq.com'
    const verifyUrl = `${siteUrl}/verify?token=${verificationToken}`

    try {
      await sendClubSignupVerification({
        contactEmail,
        firstName,
        clubName: existing.name,
        verifyUrl,
      })
    } catch { /* non-fatal */ }

    return { ok: true }
  }

  // ── New application ────────────────────────────────────────────────────────

  // Ensure slug uniqueness
  let slug = baseSlug
  let attempt = 0
  while (true) {
    const { data } = await admin.from('clubs').select('id').eq('slug', slug).maybeSingle()
    if (!data) break
    attempt++
    slug = `${baseSlug}-${attempt}`
    if (attempt > 20) return { error: 'Could not generate a unique slug. Please try a different club name.' }
  }

  const verificationToken   = randomUUID()
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { error } = await admin.from('clubs').insert({
    name:                    clubName,
    slug,
    location,
    status:                  'pending',
    contact_email:           contactEmail,
    admin_first_name:        firstName,
    admin_last_name:         lastName,
    submitted_at:            new Date().toISOString(),
    verification_token:      verificationToken,
    verification_expires_at: verificationExpires,
  })

  if (error) return { error: error.message }

  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://focalpointhq.com'
  const verifyUrl = `${siteUrl}/verify?token=${verificationToken}`

  try {
    await sendClubSignupVerification({ contactEmail, firstName, clubName, verifyUrl })
  } catch { /* non-fatal — application saved; email can be resent from fp-admin */ }

  return { ok: true }
}

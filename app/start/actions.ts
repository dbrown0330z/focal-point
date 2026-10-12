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

// Detects bot-like strings: long, no spaces, high ratio of uppercase/random chars
function looksLikeRandomString(s: string): boolean {
  if (!s || s.length < 3) return false
  // Must contain at least one space for multi-word names / club names
  // Single words are fine for first/last name — skip space check for those
  // Check for high entropy: alternating case with no vowel clusters is a giveaway
  const upper = (s.match(/[A-Z]/g) ?? []).length
  const lower = (s.match(/[a-z]/g) ?? []).length
  const total = upper + lower
  if (total === 0) return false
  // Random strings tend to be very mixed case with no natural word structure
  const mixRatio = Math.min(upper, lower) / total
  // A real name like "McPherson" has ratio ~0.18; random gibberish ~0.45+
  if (s.length > 12 && mixRatio > 0.35 && !s.includes(' ')) return true
  // Reject if it looks like base64/random alphanum: no vowels at all
  const vowels = (s.match(/[aeiouAEIOU]/g) ?? []).length
  if (s.length > 8 && vowels / total < 0.1) return true
  return false
}

function isLikelyBot(clubName: string, firstName: string, lastName: string): boolean {
  // Club names should have spaces (e.g. "Six Rivers Camera Club")
  if (clubName.length > 10 && !clubName.includes(' ') && looksLikeRandomString(clubName)) return true
  if (looksLikeRandomString(firstName)) return true
  if (looksLikeRandomString(lastName)) return true
  // Contact field: first+last as one string shouldn't be random gibberish
  const fullName = `${firstName} ${lastName}`
  if (fullName.length > 15 && looksLikeRandomString(fullName.replace(' ', ''))) return true
  return false
}

export async function submitClubApplication(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  // ── Honeypot check ─────────────────────────────────────────────────────────
  // Bots fill every field; real users never see or touch this one
  const trap = (formData.get('website') as string | null) ?? ''
  if (trap.length > 0) return { ok: true } // silently succeed so bots don't retry

  const clubName     = (formData.get('clubName')     as string)?.trim()
  const location     = (formData.get('location')     as string)?.trim() || null
  const firstName    = (formData.get('firstName')    as string)?.trim()
  const lastName     = (formData.get('lastName')     as string)?.trim()
  const contactEmail = (formData.get('contactEmail') as string)?.trim()

  if (!clubName || !firstName || !lastName || !contactEmail) {
    return { error: 'Please fill in all required fields.' }
  }

  // ── Bot-pattern detection ──────────────────────────────────────────────────
  if (isLikelyBot(clubName, firstName, lastName)) {
    return { ok: true } // silently succeed
  }

  // Club name must have at least 2 characters after slugification
  const baseSlug = slugify(clubName)
  if (!baseSlug || baseSlug.length < 2) return { error: 'Club name produced an invalid URL slug.' }

  // Email must look plausible (basic sanity beyond type="email")
  if (!contactEmail.includes('.') || contactEmail.split('@')[1]?.length < 3) {
    return { error: 'Please enter a valid email address.' }
  }

  const admin = createServiceClient()

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

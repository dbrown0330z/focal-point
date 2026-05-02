// Shared option lists used on both the onboarding profile page and the
// member profile edit drawer.  Keep these in sync — one source of truth.

export const SHOOTING_INTERESTS = [
  'Landscape', 'Portrait', 'Wildlife', 'Street', 'Macro',
  'Architectural', 'Abstract', 'Black & white', 'Astrophotography', 'Other',
]

export const CAMERA_BRANDS = [
  'Canon', 'Nikon', 'Sony', 'Fujifilm', 'Olympus',
  'Panasonic', 'Pentax / Ricoh', 'Phone', 'Film — other',
]

export const EXPERIENCE_LEVELS = [
  { value: 'beginner',     label: 'Beginner',     description: 'Just getting started' },
  { value: 'intermediate', label: 'Intermediate', description: 'Shooting regularly' },
  { value: 'advanced',     label: 'Advanced',     description: 'Experienced photographer' },
]

/** Returns "Label — description" for a stored experience_level value, or null. */
export function skillFull(val: string | null): string | null {
  if (!val) return null
  const level = EXPERIENCE_LEVELS.find(l => l.value === val)
  return level ? `${level.label} — ${level.description}` : val
}

/** Returns just the capitalised label ("Intermediate") or null. */
export function skillLabel(val: string | null): string | null {
  if (!val) return null
  const level = EXPERIENCE_LEVELS.find(l => l.value === val)
  return level ? level.label : val.charAt(0).toUpperCase() + val.slice(1)
}

// ─── Shared avatar gradient utility ──────────────────────────────────────────
// Used by every component that renders an initials avatar so they all match.

const PALETTE = [
  'var(--action-primary)',
  'var(--spot-teal)',
  'var(--spot-purple)',
  'var(--spot-green)',
  'var(--spot-pink)',
  'var(--spot-orange)',
]

/** Deterministic hash of a name → two-colour diagonal gradient */
export function avatarGradient(name: string): string {
  let h = 0
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  const i1 = Math.abs(h) % PALETTE.length
  const i2 = (i1 + 2) % PALETTE.length
  return `linear-gradient(135deg, ${PALETTE[i1]} 0%, ${PALETTE[i2]} 100%)`
}

/** Two letters for an initials avatar */
export function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

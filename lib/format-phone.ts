/**
 * Best-effort phone number formatter.
 *
 * Rules:
 *  - 10 bare digits                → North American  (XXX) XXX-XXXX
 *  - 11 digits starting with 1     → North American  +1 (XXX) XXX-XXXX
 *  - Already has + prefix          → normalise to    +CC XXXX XXXX... (basic grouping)
 *  - Anything else                 → return cleaned string unchanged
 *
 * Applied on blur so the user can still type freely.
 */
export function formatPhone(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed

  const hasPlus   = trimmed.startsWith('+')
  const digitsAll = trimmed.replace(/\D/g, '')

  if (!digitsAll) return trimmed

  // ── North American ────────────────────────────────────────────────────────
  if (digitsAll.length === 10) {
    const a = digitsAll.slice(0, 3)
    const b = digitsAll.slice(3, 6)
    const c = digitsAll.slice(6)
    return `(${a}) ${b}-${c}`
  }

  if (digitsAll.length === 11 && digitsAll[0] === '1') {
    const a = digitsAll.slice(1, 4)
    const b = digitsAll.slice(4, 7)
    const c = digitsAll.slice(7)
    return `+1 (${a}) ${b}-${c}`
  }

  // ── International (user typed a + prefix) ────────────────────────────────
  // Preserve the + and space-separate the digits in groups of 3–4.
  if (hasPlus) {
    // Country codes are 1–3 digits; try to keep them together with the first group.
    // Simple heuristic: first chunk = min(3, total) digits, rest in groups of 4.
    const cc   = digitsAll.slice(0, Math.min(3, digitsAll.length))
    const rest = digitsAll.slice(cc.length)
    const groups: string[] = []
    for (let i = 0; i < rest.length; i += 4) {
      groups.push(rest.slice(i, i + 4))
    }
    return `+${cc}${groups.length ? ' ' + groups.join(' ') : ''}`
  }

  // ── Unknown length / format — leave as-is ─────────────────────────────────
  return trimmed
}

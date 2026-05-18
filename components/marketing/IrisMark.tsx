// Static iris mark — works in server and client components

export function IrisMark({
  size = 56,
  ink = '#161412',
  accent = '#E8B14A',
  paper = '#F6F1E5',
}: {
  size?:   number
  ink?:    string
  accent?: string
  paper?:  string
}) {
  const R     = 92
  const inner = 30
  const chords = Array.from({ length: 6 }, (_, i) => {
    const a     = (i * 60 * Math.PI) / 180
    const aNext = ((i + 1) * 60 * Math.PI) / 180
    return (
      <line
        key={i}
        x1={R * Math.cos(a)}         y1={R * Math.sin(a)}
        x2={inner * Math.cos(aNext)} y2={inner * Math.sin(aNext)}
        stroke={ink} strokeWidth="6" strokeLinecap="round"
      />
    )
  })
  const hexPts = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 * Math.PI) / 180
    return `${inner * Math.cos(a)},${inner * Math.sin(a)}`
  }).join(' ')

  return (
    <svg width={size} height={size} viewBox="-100 -100 200 200" style={{ display: 'block' }}>
      <circle cx="0" cy="0" r="95" fill={paper} stroke={ink} strokeWidth="6" />
      {chords}
      <polygon points={hexPts} fill={accent} stroke={ink} strokeWidth="6" strokeLinejoin="round" />
    </svg>
  )
}

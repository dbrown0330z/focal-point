import type { ReactNode } from 'react'

export function SectionHeader({
  kicker,
  title,
  lead,
  align = 'left',
  kickerColor,
}: {
  kicker?:      string
  title:        ReactNode
  lead?:        string
  align?:       'left' | 'center'
  kickerColor?: string
}) {
  const isCenter = align === 'center'
  return (
    <div style={{
      display:      'grid',
      gap:          18,
      marginBottom: 56,
      textAlign:    align,
      maxWidth:     isCenter ? '60ch' : 'none',
      marginLeft:   isCenter ? 'auto' : 0,
      marginRight:  isCenter ? 'auto' : 0,
    }}>
      {kicker && (
        <div className="mkt-kicker">
          <span className="mkt-kicker-dot" style={kickerColor ? { background: kickerColor } : {}} />
          {kicker}
        </div>
      )}
      <h2 className="mkt-display">{title}</h2>
      {lead && (
        <p className="mkt-lead" style={{
          marginLeft:  isCenter ? 'auto' : 0,
          marginRight: isCenter ? 'auto' : 0,
        }}>
          {lead}
        </p>
      )}
    </div>
  )
}

import Link from 'next/link'
import { IrisMark } from './IrisMark'

export function Logo({ size = 36, ink = '#161412' }: { size?: number; ink?: string }) {
  return (
    <Link
      href="/"
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            12,
        textDecoration: 'none',
        color:          ink,
      }}
    >
      <IrisMark size={size} ink={ink} accent="#E8B14A" />
      <span
        style={{
          fontFamily:    'var(--wordmark)',
          fontSize:      24,
          fontWeight:    600,
          letterSpacing: '-0.8px',
          lineHeight:    1,
          color:         ink,
        }}
      >
        Focal<span style={{ color: '#E26A3E' }}>.</span>Point
      </span>
    </Link>
  )
}

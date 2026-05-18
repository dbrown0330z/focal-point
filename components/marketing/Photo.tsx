export function Photo({
  palette,
  label,
  tag,
}: {
  palette: string[]
  label:   string
  tag:     string
}) {
  const grad = `linear-gradient(135deg, ${palette.join(', ')})`
  return (
    <div className="mkt-photo" style={{ background: grad }}>
      <div className="mkt-photo-corner">{tag}</div>
      <div style={{
        position:      'absolute',
        left:          12, bottom: 12, right: 12,
        color:         '#ffffffEE',
        fontFamily:    'var(--mono)',
        fontSize:      11,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        textShadow:    '0 1px 0 #00000040',
      }}>
        {label}
      </div>
    </div>
  )
}

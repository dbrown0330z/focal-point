export type JudgeStatus = 'not-started' | 'in-progress' | 'complete'

const config: Record<JudgeStatus, { label: string; bg: string; color: string; border: string }> = {
  'not-started': {
    label:  'Not started',
    bg:     'var(--surface-1)',
    color:  'var(--text-tertiary)',
    border: 'var(--border-default)',
  },
  'in-progress': {
    label:  'In progress',
    bg:     'var(--status-warning-bg)',
    color:  'var(--status-warning-text)',
    border: 'var(--status-warning)',
  },
  'complete': {
    label:  'Complete',
    bg:     'var(--status-success-bg)',
    color:  'var(--status-success-text)',
    border: 'var(--status-success)',
  },
}

export default function StatusBadge({
  status,
  labelOverride,
}: {
  status: JudgeStatus
  labelOverride?: string
}) {
  const c = config[status]
  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      borderRadius: 9999,
      border:       `1px solid ${c.border}`,
      background:   c.bg,
      color:        c.color,
      fontSize:     12,
      fontWeight:   500,
      letterSpacing: '0.02em',
      padding:      '3px 10px',
      whiteSpace:   'nowrap',
    }}>
      {labelOverride ?? c.label}
    </span>
  )
}

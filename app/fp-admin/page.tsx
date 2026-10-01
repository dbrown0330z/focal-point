import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'

const STATUS_CHIP: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: 'var(--status-warning-bg)',  color: 'var(--status-warning-text)',  label: 'Pending'   },
  active:    { bg: 'var(--status-success-bg)',  color: 'var(--status-success-text)',  label: 'Active'    },
  suspended: { bg: 'var(--status-error-bg)',    color: 'var(--status-error-text)',    label: 'Suspended' },
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function FPAdminDashboard() {
  const admin = createServiceClient()

  const { data: clubs } = await (admin as any)
    .from('clubs')
    .select('id, name, slug, status, contact_email, admin_first_name, admin_last_name, submitted_at, approved_at')
    .order('submitted_at', { ascending: false })

  const all       = (clubs ?? []) as any[]
  const active    = all.filter(c => c.status === 'active').length
  const pending   = all.filter(c => c.status === 'pending').length
  const suspended = all.filter(c => c.status === 'suspended').length
  const recent    = all.filter(c => c.status === 'pending').slice(0, 6)

  const stats = [
    { label: 'Active clubs',     value: active,    color: 'var(--status-success)' },
    { label: 'Pending signups',  value: pending,   color: 'var(--status-warning)' },
    { label: 'Suspended',        value: suspended, color: 'var(--status-error)'   },
    { label: 'Total',            value: all.length, color: 'var(--text-secondary)' },
  ]

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold" style={{ color: '#111827', letterSpacing: '-0.02em' }}>
        Dashboard
      </h1>
      <p className="mb-8 text-sm" style={{ color: '#6B7280' }}>Focal Point platform overview</p>

      {/* Stat cards */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border bg-white p-5" style={{ borderColor: '#E5E7EB' }}>
            <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#9CA3AF' }}>
              {s.label}
            </p>
            <p className="text-3xl font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Pending signups */}
      <div className="rounded-xl border bg-white" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: '#E5E7EB' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#111827' }}>Pending signups</h2>
          <Link href="/fp-admin/clubs?status=pending"
                className="text-xs font-medium" style={{ color: 'var(--action-primary)' }}>
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-6 py-8 text-sm text-center" style={{ color: '#9CA3AF' }}>
            No pending applications right now.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                {['Club', 'Contact', 'Submitted', ''].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((c: any) => {
                const chip = STATUS_CHIP[c.status] ?? STATUS_CHIP.pending
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <td className="px-6 py-3">
                      <p className="font-medium" style={{ color: '#111827' }}>{c.name}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>{c.slug}</p>
                    </td>
                    <td className="px-6 py-3">
                      <p style={{ color: '#374151' }}>{[c.admin_first_name, c.admin_last_name].filter(Boolean).join(' ') || '—'}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>{c.contact_email ?? '—'}</p>
                    </td>
                    <td className="px-6 py-3" style={{ color: '#6B7280' }}>{fmtDate(c.submitted_at)}</td>
                    <td className="px-6 py-3 text-right">
                      <Link href={`/fp-admin/clubs/${c.id}`}
                            className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                            style={{ borderColor: '#E5E7EB', color: '#374151' }}>
                        Review →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

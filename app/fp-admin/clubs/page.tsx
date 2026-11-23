import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'

const TABS = ['all', 'pending', 'active', 'suspended'] as const
type Tab = typeof TABS[number]

const CHIP: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'var(--status-warning-bg)',  color: 'var(--status-warning-text)'  },
  active:    { bg: 'var(--status-success-bg)',  color: 'var(--status-success-text)'  },
  suspended: { bg: 'var(--status-error-bg)',    color: 'var(--status-error-text)'    },
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function FPAdminClubsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: rawStatus } = await searchParams
  const tab: Tab = (TABS as readonly string[]).includes(rawStatus ?? '') ? rawStatus as Tab : 'all'

  const admin = createServiceClient()
  let q = (admin as any).from('clubs').select('*').order('submitted_at', { ascending: false })
  if (tab !== 'all') q = q.eq('status', tab)
  const { data: clubs } = await q
  const rows = (clubs ?? []) as any[]

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold" style={{ color: '#111827', letterSpacing: '-0.02em' }}>
        Clubs
      </h1>
      <p className="mb-6 text-sm" style={{ color: '#6B7280' }}>All clubs and pending applications</p>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 border-b" style={{ borderColor: '#E5E7EB' }}>
        {TABS.map(t => (
          <Link
            key={t}
            href={t === 'all' ? '/fp-admin/clubs' : `/fp-admin/clubs?status=${t}`}
            className="px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px"
            style={{
              color:       tab === t ? 'var(--action-primary)' : '#6B7280',
              borderColor: tab === t ? 'var(--action-primary)' : 'transparent',
            }}
          >
            {t}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
        {rows.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm" style={{ color: '#9CA3AF' }}>
            No clubs found.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #F3F4F6', background: '#F9FAFB' }}>
                {['Club', 'Status', 'Contact', 'Submitted', 'Approved', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c: any) => {
                const chip = CHIP[c.status] ?? CHIP.pending
                return (
                  <tr key={c.id} className="transition-colors hover:bg-gray-50"
                      style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium" style={{ color: '#111827' }}>{c.name}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>/{c.slug}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                            style={{ background: chip.bg, color: chip.color }}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p style={{ color: '#374151' }}>
                        {[c.admin_first_name, c.admin_last_name].filter(Boolean).join(' ') || '—'}
                      </p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>{c.contact_email ?? '—'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: '#6B7280' }}>{fmtDate(c.submitted_at)}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: '#6B7280' }}>{fmtDate(c.approved_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/fp-admin/clubs/${c.id}`}
                            className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                            style={{ borderColor: '#E5E7EB', color: '#374151' }}>
                        Manage →
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

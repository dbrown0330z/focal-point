import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { count: pendingCount },
    { count: memberCount },
    { data: activeCompetitions },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).is('role', null),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'member'),
    supabase.from('competitions').select('id, title, status, closes_at').in('status', ['open', 'judging']).order('created_at', { ascending: false }),
  ])

  const stats = [
    { label: 'Pending approvals', value: pendingCount ?? 0, href: '/admin/members', urgent: (pendingCount ?? 0) > 0 },
    { label: 'Active members', value: memberCount ?? 0, href: '/admin/members', urgent: false },
    { label: 'Active competitions', value: activeCompetitions?.length ?? 0, href: '/admin/competitions', urgent: false },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-content-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-content-secondary">Club overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, href, urgent }) => (
          <Link
            key={label}
            href={href}
            className={`rounded-xl border p-5 transition-colors ${
              urgent
                ? 'border-status-warning bg-status-warning-bg hover:bg-[#FFF5CC]'
                : 'border-border-default bg-surface-2 hover:bg-surface-1'
            }`}
          >
            <p className={`text-3xl font-semibold ${urgent ? 'text-status-warning-text' : 'text-content-primary'}`}>
              {value}
            </p>
            <p className={`mt-1 text-sm ${urgent ? 'text-status-warning-text' : 'text-content-secondary'}`}>
              {label}
            </p>
          </Link>
        ))}
      </div>

      {/* Active competitions */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-content-tertiary">Active competitions</h2>
          <Link href="/admin/competitions" className="text-sm text-content-secondary hover:text-content-primary transition-colors">
            View all →
          </Link>
        </div>

        {!activeCompetitions?.length ? (
          <div className="rounded-xl border border-border-default bg-surface-2 px-5 py-8 text-center">
            <p className="text-sm text-content-tertiary">No competitions currently open or in judging.</p>
            <Link href="/admin/competitions/new" className="mt-3 inline-block text-sm font-medium text-action-primary hover:underline">
              Create one →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle rounded-xl border border-border-default bg-surface-2">
            {activeCompetitions.map(c => (
              <Link
                key={c.id}
                href={`/admin/competitions/${c.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-1 transition-colors"
              >
                <p className="text-sm font-medium text-content-primary">{c.title}</p>
                <div className="flex items-center gap-3">
                  {c.closes_at && (
                    <span className="text-xs text-content-tertiary">Closes {new Date(c.closes_at).toLocaleDateString()}</span>
                  )}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    c.status === 'open'
                      ? 'bg-status-success-bg text-status-success-text'
                      : 'bg-status-warning-bg text-status-warning-text'
                  }`}>
                    {c.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

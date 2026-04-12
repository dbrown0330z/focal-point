import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const statusStyles: Record<string, string> = {
  draft:   'bg-surface-1 text-content-secondary',
  open:    'bg-status-success-bg text-status-success-text',
  judging: 'bg-status-warning-bg text-status-warning-text',
  closed:  'bg-surface-1 text-content-tertiary',
}

export default async function AdminCompetitionsPage() {
  const supabase = await createClient()

  const { data: competitions } = await supabase
    .from('competitions')
    .select('id, title, status, opens_at, closes_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-content-primary">Competitions</h1>
        <Link
          href="/admin/competitions/new"
          className="rounded-lg bg-action-primary px-4 py-2 text-sm font-medium text-white hover:bg-action-primary-hover transition-colors"
        >
          New competition
        </Link>
      </div>

      {!competitions?.length ? (
        <p className="text-sm text-content-tertiary">No competitions yet.</p>
      ) : (
        <div className="divide-y divide-border-subtle rounded-xl border border-border-default bg-surface-2">
          {competitions.map(c => (
            <Link
              key={c.id}
              href={`/admin/competitions/${c.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-surface-1 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-content-primary">{c.title}</p>
                {c.opens_at && (
                  <p className="mt-0.5 text-xs text-content-tertiary">
                    {new Date(c.opens_at).toLocaleDateString()} –{' '}
                    {c.closes_at ? new Date(c.closes_at).toLocaleDateString() : 'TBD'}
                  </p>
                )}
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[c.status]}`}>
                {c.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

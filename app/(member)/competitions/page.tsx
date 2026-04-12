import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const statusStyles: Record<string, string> = {
  open:    'bg-status-success-bg text-status-success-text',
  judging: 'bg-status-warning-bg text-status-warning-text',
  closed:  'bg-surface-1 text-content-tertiary',
}

export default async function CompetitionsPage() {
  const supabase = await createClient()

  const { data: competitions } = await supabase
    .from('competitions')
    .select('id, title, status, opens_at, closes_at, submission_limit')
    .neq('status', 'draft')
    .order('created_at', { ascending: false })

  const open = competitions?.filter(c => c.status === 'open') ?? []
  const past = competitions?.filter(c => c.status !== 'open') ?? []

  return (
    <div className="space-y-10">
      <h1 className="text-xl font-semibold text-content-primary">Competitions</h1>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-content-tertiary">
          Open for submissions
        </h2>
        {open.length === 0 ? (
          <p className="text-sm text-content-tertiary">No competitions open right now.</p>
        ) : (
          <div className="space-y-3">
            {open.map(c => (
              <Link key={c.id} href={`/competitions/${c.id}`}
                className="flex items-center justify-between rounded-xl border border-status-success bg-status-success-bg px-5 py-4 hover:bg-[#D5F0DA] transition-colors"
              >
                <div>
                  <p className="font-medium text-content-primary">{c.title}</p>
                  {c.closes_at && (
                    <p className="mt-0.5 text-xs text-content-secondary">
                      Closes {new Date(c.closes_at).toLocaleDateString()}
                      {' · '}up to {c.submission_limit} {c.submission_limit === 1 ? 'submission' : 'submissions'}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-status-success-bg px-2.5 py-0.5 text-xs font-medium text-status-success-text border border-status-success">
                  Open
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-content-tertiary">
            Past competitions
          </h2>
          <div className="divide-y divide-border-subtle rounded-xl border border-border-default bg-surface-2">
            {past.map(c => (
              <Link key={c.id} href={`/competitions/${c.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-1 transition-colors"
              >
                <p className="text-sm font-medium text-content-primary">{c.title}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[c.status]}`}>
                  {c.status}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

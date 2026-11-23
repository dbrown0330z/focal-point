import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug } from '@/lib/club-context'
import { EntryRow } from './EntryRow'

export const dynamic = 'force-dynamic'

export default async function CompetitionEntriesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const clubSlug = await requireClubSlug()
  const admin    = createServiceClient()

  const { data: competition } = await admin
    .from('competitions')
    .select('id, title, status, competition_categories(id, name)')
    .eq('id', id)
    .single()

  if (!competition) notFound()

  const categories = (competition.competition_categories as { id: string; name: string }[]) ?? []

  // Fetch submissions — note: profiles column is display_name, not full_name
  const { data: rows, error: rowsError } = await admin
    .from('submissions')
    .select('id, status, submitted_at, category_id, member_id, images(title, storage_path), profiles(display_name)')
    .eq('competition_id', id)
    .order('submitted_at', { ascending: true })

  if (rowsError) console.error('Entries query error:', rowsError.message)

  type Row = typeof rows extends (infer R)[] | null ? R : never
  const submissions = (rows ?? []).map((r: Row) => {
    const img  = (r as unknown as { images:   { title: string; storage_path: string } | null }).images
    const prof = (r as unknown as { profiles: { display_name: string } | null }).profiles
    return {
      id:          r.id as string,
      status:      r.status as string,
      submittedAt: r.submitted_at as string,
      categoryId:  r.category_id as string | null,
      imageTitle:  img?.title ?? '—',
      memberName:  prof?.display_name ?? 'Unknown member',
      publicUrl:   img?.storage_path
        ? admin.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl
        : null,
    }
  })

  const active    = submissions.filter(s => s.status === 'submitted')
  const withdrawn = submissions.filter(s => s.status === 'withdrawn')

  // Per-category counts (active only)
  const byCat: Record<string, number> = {}
  for (const s of active) {
    const key = s.categoryId ?? '__none__'
    byCat[key] = (byCat[key] ?? 0) + 1
  }

  const showCategories = categories.length > 0

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <Link
        href={`/${clubSlug}/admin/competitions/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {competition.title}
      </Link>

      {/* Header */}
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-bold text-content-primary tracking-tight">Entries</h1>
        <span className="text-sm text-content-secondary">
          {active.length} submitted{withdrawn.length > 0 ? ` · ${withdrawn.length} withdrawn` : ''}
        </span>
      </div>

      {/* Category summary chips */}
      {showCategories && (
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-1 px-3 py-1 text-xs font-medium text-content-secondary"
            >
              {cat.name}
              <span className="font-semibold text-content-primary">{byCat[cat.id] ?? 0}</span>
            </span>
          ))}
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="rounded-xl border border-border-default bg-surface-1 py-16 text-center">
          <p className="text-sm font-medium text-content-secondary">No entries yet</p>
          <p className="mt-1 text-xs text-content-tertiary">Submissions will appear here once members enter.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border-default overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default bg-surface-0">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-content-tertiary w-16" />
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-content-tertiary">Title</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-content-tertiary">Member</th>
                {showCategories && (
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-content-tertiary">Category</th>
                )}
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-content-tertiary">Submitted</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-content-tertiary">Status</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-content-tertiary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub, idx) => (
                <EntryRow
                  key={sub.id}
                  entry={sub}
                  categories={categories}
                  competitionId={id}
                  showCategories={showCategories}
                  even={idx % 2 === 0}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin guidance note */}
      <p className="text-xs text-content-tertiary">
        Removing an entry withdraws it and frees the image for resubmission. Category changes take effect immediately.
        Withdrawn entries can be reinstated if needed.
      </p>

    </div>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug } from '@/lib/club-context'

export const dynamic = 'force-dynamic'

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default async function CompetitionEntriesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const clubSlug = await requireClubSlug()
  const admin    = createServiceClient()

  // Fetch competition title
  const { data: competition } = await admin
    .from('competitions')
    .select('id, title, status, competition_categories(id, name)')
    .eq('id', id)
    .single()

  if (!competition) notFound()

  const categories = (competition.competition_categories as { id: string; name: string }[]) ?? []
  const catMap     = Object.fromEntries(categories.map(c => [c.id, c.name]))

  // Fetch all submissions with image and profile info
  const { data: rows } = await admin
    .from('submissions')
    .select('id, status, submitted_at, category_id, image_id, member_id, images(title, storage_path), profiles(full_name)')
    .eq('competition_id', id)
    .order('submitted_at', { ascending: true })

  const submissions = (rows ?? []).map(r => {
    const img  = r.images  as unknown as { title: string; storage_path: string } | null
    const prof = r.profiles as unknown as { full_name: string | null } | null
    return {
      id:          r.id,
      status:      r.status as string,
      createdAt:   r.submitted_at as string,
      categoryId:  r.category_id as string | null,
      imageId:     r.image_id   as string | null,
      memberId:    r.member_id  as string | null,
      imageTitle:  img?.title ?? '—',
      storagePath: img?.storage_path ?? '',
      memberName:  prof?.full_name ?? 'Unknown member',
      publicUrl:   img?.storage_path
        ? admin.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl
        : null,
    }
  })

  // Group by category for the summary header
  const byCat: Record<string, number> = {}
  for (const s of submissions) {
    const key = s.categoryId ?? '__none__'
    byCat[key] = (byCat[key] ?? 0) + 1
  }

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

      {/* Page title + count */}
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-bold text-content-primary tracking-tight">Entries</h1>
        <span className="text-sm text-content-secondary">{submissions.length} total</span>
      </div>

      {/* Category summary chips */}
      {categories.length > 0 && (
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
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-content-tertiary w-16">
                  Image
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-content-tertiary">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-content-tertiary">
                  Member
                </th>
                {categories.length > 0 && (
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-content-tertiary">
                    Category
                  </th>
                )}
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-content-tertiary">
                  Submitted
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-content-tertiary">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub, idx) => (
                <tr
                  key={sub.id}
                  className={`border-b border-border-subtle last:border-0 ${idx % 2 === 0 ? 'bg-surface-2' : 'bg-surface-1'}`}
                >
                  {/* Thumbnail */}
                  <td className="px-4 py-2.5">
                    {sub.publicUrl ? (
                      <div className="relative w-12 h-10 rounded-md overflow-hidden bg-surface-1 shrink-0">
                        <Image
                          src={sub.publicUrl}
                          alt={sub.imageTitle}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-10 rounded-md bg-surface-1 border border-border-subtle" />
                    )}
                  </td>

                  {/* Image title */}
                  <td className="px-4 py-2.5 font-medium text-content-primary max-w-[200px] truncate">
                    {sub.imageTitle}
                  </td>

                  {/* Member name */}
                  <td className="px-4 py-2.5 text-content-secondary whitespace-nowrap">
                    {sub.memberName}
                  </td>

                  {/* Category */}
                  {categories.length > 0 && (
                    <td className="px-4 py-2.5 text-content-secondary whitespace-nowrap">
                      {sub.categoryId ? (catMap[sub.categoryId] ?? '—') : '—'}
                    </td>
                  )}

                  {/* Submitted date */}
                  <td className="px-4 py-2.5 text-content-tertiary whitespace-nowrap">
                    {fmtDate(sub.createdAt)}
                  </td>

                  {/* Status chip */}
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        sub.status === 'submitted'
                          ? 'bg-status-success-bg text-status-success-text'
                          : sub.status === 'withdrawn'
                          ? 'bg-surface-1 text-content-tertiary'
                          : 'bg-surface-1 text-content-secondary'
                      }`}
                    >
                      {sub.status === 'submitted' ? 'Submitted' : sub.status === 'withdrawn' ? 'Withdrawn' : sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

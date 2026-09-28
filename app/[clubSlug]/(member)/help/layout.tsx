import { getSections } from '@/lib/help'
import Link from 'next/link'
import { requireClubSlug } from '@/lib/club-context'

export default async function HelpLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params:   Promise<{ clubSlug: string }>
}) {
  const clubSlug = await requireClubSlug()
  const sections = getSections()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">

        {/* Sidebar */}
        <aside className="w-full shrink-0 md:w-52">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
            Help & guides
          </p>
          {sections.map(sec => (
            <div key={sec.key} className="mb-4">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                {sec.label}
              </p>
              <ul className="space-y-0.5">
                {sec.articles.map(a => (
                  <li key={a.slug.join('/')}>
                    <Link
                      href={`/${clubSlug}/help/${a.slug.join('/')}`}
                      className="block rounded-md px-2.5 py-1.5 text-sm transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        {/* Article */}
        <main className="min-w-0 flex-1">
          {children}
        </main>

      </div>
    </div>
  )
}

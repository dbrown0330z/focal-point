import Link from 'next/link'
import { getSections } from '@/lib/help'

export default async function HelpSectionLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clubSlug: string; section: string }>
}) {
  const { clubSlug, section } = await params
  const allSections  = getSections()
  const current      = allSections.find(s => s.key === section)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">

        {/* Sidebar */}
        <aside className="w-full shrink-0 md:w-52">
          <p
            className="mb-3 text-[11px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {current?.label ?? 'Help'}
          </p>
          <ul className="space-y-0.5">
            {(current?.articles ?? []).map(a => (
              <li key={a.slug.join('/')}>
                <Link
                  href={`/${clubSlug}/help/${a.slug.join('/')}`}
                  className="block rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-surface-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Article */}
        <main className="min-w-0 flex-1">{children}</main>

      </div>
    </div>
  )
}

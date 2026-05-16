import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function CustomPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: page } = await supabase
    .from('nav_custom_pages')
    .select('title, content, page_type, external_url, status, visibility')
    .eq('slug', slug)
    .single()

  // Only serve published, non-hidden pages
  if (!page || page.status !== 'published' || page.visibility === 'hidden') notFound()

  // External links redirect rather than render
  if (page.page_type === 'external_link' && page.external_url) {
    const { redirect } = await import('next/navigation')
    redirect(page.external_url)
  }

  return (
    <article className="mx-auto max-w-3xl">
      <header className="mb-8">
        <h1
          className="text-[28px] font-bold leading-tight tracking-[-0.02em]"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}
        >
          {page.title}
        </h1>
        <div className="mt-4 h-px" style={{ background: 'var(--border-default)' }} />
      </header>

      {page.content ? (
        <div
          className="prose-custom"
          // The content is admin-authored HTML stored in Supabase — safe to render
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      ) : (
        <p style={{ color: 'var(--text-secondary)' }}>No content yet.</p>
      )}
    </article>
  )
}

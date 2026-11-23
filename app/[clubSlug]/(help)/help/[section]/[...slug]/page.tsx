import { notFound } from 'next/navigation'
import { getArticle } from '@/lib/help'
import { MDXRemote } from 'next-mdx-remote/rsc'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ clubSlug: string; section: string; slug: string[] }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section, slug } = await params
  const article = getArticle([section, ...slug])
  return { title: article?.title ?? 'Help' }
}

export default async function HelpArticlePage({ params }: Props) {
  const { section, slug } = await params
  const article = getArticle([section, ...slug])
  if (!article) notFound()

  return (
    <article className="help-article prose max-w-none">
      <MDXRemote source={article.content} />
    </article>
  )
}

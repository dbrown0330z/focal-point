import { notFound } from 'next/navigation'
import { getArticle } from '@/lib/help'
import { MDXRemote } from 'next-mdx-remote/rsc'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ clubSlug: string; slug: string[] }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article  = getArticle(slug)
  return { title: article?.title ?? 'Help' }
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug }  = await params
  const article   = getArticle(slug)
  if (!article) notFound()

  return (
    <article className="help-article prose max-w-none">
      <MDXRemote source={article.content} />
    </article>
  )
}

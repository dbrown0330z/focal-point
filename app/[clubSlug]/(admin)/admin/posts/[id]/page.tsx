import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import PostEditClient from './PostEditClient'

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createServiceClient()

  const { data: post } = await admin
    .from('posts')
    .select('id, title, body, published_at, created_at')
    .eq('id', id)
    .single()

  if (!post) notFound()

  return <PostEditClient post={post} />
}

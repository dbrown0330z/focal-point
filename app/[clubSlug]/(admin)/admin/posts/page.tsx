import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export default async function AdminPostsPage() {
  const supabase = await createClient()
  const admin = createServiceClient()

  const { data: posts } = await admin
    .from('posts')
    .select('id, title, published_at, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">News &amp; Posts</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-lg bg-action-primary px-4 py-2 text-sm font-medium text-white hover:bg-action-primary-hover transition-colors"
        >
          New post
        </Link>
      </div>

      {!posts?.length ? (
        <p className="text-sm text-content-tertiary">No posts yet.</p>
      ) : (
        <div className="divide-y divide-border-subtle rounded-xl border border-border-default bg-surface-2">
          {posts.map(post => (
            <Link
              key={post.id}
              href={`/admin/posts/${post.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-surface-1 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-content-primary">{post.title}</p>
                <p className="mt-0.5 text-xs text-content-tertiary">
                  {post.published_at
                    ? `Published ${new Date(post.published_at).toLocaleDateString()}`
                    : `Created ${new Date(post.created_at).toLocaleDateString()}`}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                post.published_at
                  ? 'bg-status-success-bg text-status-success-text'
                  : 'bg-surface-1 text-content-secondary'
              }`}>
                {post.published_at ? 'Published' : 'Draft'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

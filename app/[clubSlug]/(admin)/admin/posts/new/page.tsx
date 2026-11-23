import { createPost } from '../actions'
import { requireClubSlug } from '@/lib/club-context'

const inputCls  = "w-full rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-sm text-content-primary focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
const labelCls  = "mb-1.5 block text-sm font-medium text-content-primary"

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const [{ error }, clubSlug] = await Promise.all([searchParams, requireClubSlug()])

  return (
    <div>
      <h1 className="mb-6 text-[22px] font-bold tracking-[-0.015em] text-content-primary">New post</h1>

      {error && (
        <div className="mb-5 rounded-lg border border-status-error bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {error}
        </div>
      )}

      <form action={createPost} className="space-y-5">
        <div>
          <label htmlFor="title" className={labelCls}>
            Title <span className="text-status-error">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="May club news"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="body" className={labelCls}>
            Body <span className="text-status-error">*</span>
          </label>
          <textarea
            id="body"
            name="body"
            required
            rows={12}
            placeholder="Write your post here..."
            className={inputCls + ' resize-y'}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            name="publish"
            value="1"
            className="rounded-lg bg-action-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-action-primary-hover transition-colors"
          >
            Publish now
          </button>
          <button
            type="submit"
            name="publish"
            value="0"
            className="rounded-lg border border-border-default px-5 py-2.5 text-sm font-medium text-content-secondary hover:bg-surface-1 transition-colors"
          >
            Save as draft
          </button>
          <a
            href={`/${clubSlug}/admin/posts`}
            className="ml-auto rounded-lg border border-border-default px-5 py-2.5 text-sm font-medium text-content-secondary hover:bg-surface-1 transition-colors"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}

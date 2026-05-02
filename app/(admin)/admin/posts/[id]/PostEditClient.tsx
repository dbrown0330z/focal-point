'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePost, deletePost } from '../actions'

type Post = {
  id: string
  title: string
  body: string
  published_at: string | null
  created_at: string
}

const inputCls = "w-full rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-sm text-content-primary focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
const labelCls = "mb-1.5 block text-sm font-medium text-content-primary"

export default function PostEditClient({ post }: { post: Post }) {
  const router = useRouter()

  const [title,   setTitle]   = useState(post.title)
  const [body,    setBody]    = useState(post.body)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isPublished = !!post.published_at

  async function save(publishOverride?: boolean) {
    if (!title.trim() || !body.trim()) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    let published_at = post.published_at
    if (publishOverride === true  && !post.published_at) published_at = new Date().toISOString()
    if (publishOverride === false && post.published_at)  published_at = null

    const { error } = await updatePost(post.id, { title: title.trim(), body: body.trim(), published_at })
    setSaving(false)
    if (error) {
      setError(error)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      if (publishOverride !== undefined) router.refresh()
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await deletePost(post.id)
    router.push('/admin/posts')
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Edit post</h1>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          isPublished
            ? 'bg-status-success-bg text-status-success-text'
            : 'bg-surface-1 text-content-secondary'
        }`}>
          {isPublished ? 'Published' : 'Draft'}
        </span>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-status-error bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 rounded-lg border border-status-success bg-status-success-bg px-4 py-3 text-sm text-status-success-text">
          Saved.
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className={labelCls}>Title <span className="text-status-error">*</span></label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Body <span className="text-status-error">*</span></label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={12}
            className={inputCls + ' resize-y'}
          />
        </div>

        {isPublished && post.published_at && (
          <p className="text-xs text-content-tertiary">
            Published {new Date(post.published_at).toLocaleDateString()}
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => save()}
            disabled={saving || !title.trim() || !body.trim()}
            className="rounded-lg bg-action-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-action-primary-hover disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>

          {!isPublished && (
            <button
              onClick={() => save(true)}
              disabled={saving}
              className="rounded-lg border border-action-primary px-5 py-2.5 text-sm font-medium text-action-primary hover:bg-surface-1 disabled:opacity-50 transition-colors"
            >
              Publish
            </button>
          )}

          {isPublished && (
            <button
              onClick={() => save(false)}
              disabled={saving}
              className="rounded-lg border border-border-default px-5 py-2.5 text-sm font-medium text-content-secondary hover:bg-surface-1 disabled:opacity-50 transition-colors"
            >
              Unpublish
            </button>
          )}

          <div className="ml-auto flex items-center gap-3">
            {confirmDelete ? (
              <>
                <span className="text-sm text-status-error-text">Delete this post?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg bg-status-error px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                >
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-sm text-content-secondary hover:text-content-primary"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleDelete}
                className="text-sm text-content-tertiary hover:text-status-error-text transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

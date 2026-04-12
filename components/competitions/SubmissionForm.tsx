'use client'

import { useState } from 'react'
import { submitImage } from '@/app/(member)/competitions/[id]/actions'

type Category = { id: string; name: string }
type Image = { id: string; title: string; publicUrl: string }

export default function SubmissionForm({
  competitionId,
  categories,
  availableImages,
}: {
  competitionId: string
  categories: Category[]
  availableImages: Image[]
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-action-primary px-4 py-2 text-sm font-medium text-white hover:bg-action-primary-hover transition-colors"
      >
        Submit a photo
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-border-default bg-surface-2 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-content-primary">Submit a photo</h3>
        <button
          onClick={() => { setOpen(false); setSelectedImage(null) }}
          className="text-sm text-content-tertiary hover:text-content-secondary"
        >
          Cancel
        </button>
      </div>

      <form action={submitImage} className="space-y-4">
        <input type="hidden" name="competition_id" value={competitionId} />
        <input type="hidden" name="image_id" value={selectedImage ?? ''} />

        {/* Category */}
        <div>
          <label htmlFor="category_id" className="mb-1.5 block text-sm font-medium text-content-primary">
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            required
            className="w-full rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-sm text-content-primary focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
          >
            <option value="">Select a category…</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Image picker */}
        <div>
          <p className="mb-2 text-sm font-medium text-content-primary">Choose a photo from your library</p>
          {availableImages.length === 0 ? (
            <p className="text-sm text-content-tertiary">
              No photos available. All your photos are either already submitted or your library is empty.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {availableImages.map(image => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedImage(image.id)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImage === image.id
                      ? 'border-action-primary ring-2 ring-action-primary ring-offset-1'
                      : 'border-transparent hover:border-border-default'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.publicUrl} alt={image.title} className="h-full w-full object-cover" />
                  {selectedImage === image.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="rounded-full bg-white p-0.5 text-content-primary">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!selectedImage}
          className="rounded-lg bg-action-primary px-4 py-2 text-sm font-medium text-white hover:bg-action-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Submit photo
        </button>
      </form>
    </div>
  )
}

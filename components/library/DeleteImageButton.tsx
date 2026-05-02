'use client'

import { useState } from 'react'
import { deleteImage } from '@/app/(member)/library/actions'

export default function DeleteImageButton({
  imageId,
  storagePath,
}: {
  imageId: string
  storagePath: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    const result = await deleteImage(imageId, storagePath)
    if (result?.error) {
      setError(result.error)
      setConfirming(false)
    }
  }

  if (error) {
    return (
      <p className="mt-1 text-xs text-status-error-text">{error}</p>
    )
  }

  if (confirming) {
    return (
      <div className="mt-1 flex gap-2 items-center">
        <button
          onClick={handleDelete}
          className="text-xs font-medium px-2 py-0.5 rounded border border-red-200 bg-[#FDEEEE] text-[#7A1515] hover:bg-[#F9D0D0] hover:border-red-300 transition-colors"
        >
          Confirm delete
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-content-tertiary hover:underline"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="mt-1 text-xs text-content-tertiary hover:text-status-error-text transition-colors"
    >
      Delete
    </button>
  )
}

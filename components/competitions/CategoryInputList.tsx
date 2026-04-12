'use client'

import { useState } from 'react'

export default function CategoryInputList() {
  const [categories, setCategories] = useState([''])

  function update(index: number, value: string) {
    setCategories(prev => prev.map((c, i) => (i === index ? value : c)))
  }

  function add() {
    setCategories(prev => [...prev, ''])
  }

  function remove(index: number) {
    setCategories(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {categories.map((cat, i) => (
        <div key={i} className="flex gap-2">
          <input
            name="category"
            type="text"
            value={cat}
            onChange={e => update(i, e.target.value)}
            placeholder={`Category ${i + 1}`}
            className="flex-1 rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-sm text-content-primary placeholder-content-muted focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
          />
          {categories.length > 1 && (
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-content-tertiary hover:text-status-error-text transition-colors px-1"
              aria-label="Remove category"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-sm text-content-secondary hover:text-content-primary transition-colors"
      >
        + Add another category
      </button>
    </div>
  )
}

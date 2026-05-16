'use client'

import { useState, useTransition, useRef } from 'react'
import { updateCompetitionTitle } from '../actions'

export function InlineTitle({ id, title, editable }: { id: string; title: string; editable: boolean }) {
  const [editing, setEditing]   = useState(false)
  const [value,   setValue]     = useState(title)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSave() {
    if (!value.trim() || value.trim() === title) {
      setEditing(false)
      setValue(title)
      return
    }
    startTransition(async () => {
      await updateCompetitionTitle(id, value.trim())
      setEditing(false)
    })
  }

  if (!editable) {
    return <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">{title}</h1>
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') { setEditing(false); setValue(title) }
          }}
          onBlur={handleSave}
          disabled={isPending}
          className="text-[22px] font-bold tracking-[-0.015em] text-content-primary bg-transparent border-b-2 border-action-primary outline-none min-w-0 w-full"
          autoFocus
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => { setEditing(true); setValue(title) }}
      className="text-[22px] font-bold tracking-[-0.015em] text-content-primary text-left hover:text-action-primary transition-colors group"
      title="Click to edit"
    >
      {title}
      <span className="ml-2 text-xs font-normal text-content-disabled opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
    </button>
  )
}

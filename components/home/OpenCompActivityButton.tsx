'use client'

import { useState } from 'react'
import SubmitModal from '@/app/[clubSlug]/(member)/competitions/SubmitModal'

type Category = { id: string; name: string; count?: number }

type Props = {
  comp: {
    id:         string
    name:       string
    memberMax:  number
    memberUsed: number
    categories: Category[]
  }
  userId: string
  complete: boolean
}

export default function OpenCompActivityButton({ comp, userId, complete }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          fontSize:       12,
          fontWeight:     600,
          color:          'var(--action-primary)',
          background:     'none',
          border:         'none',
          padding:        0,
          cursor:         'pointer',
          flexShrink:     0,
          whiteSpace:     'nowrap',
          textDecoration: 'none',
        }}
      >
        {complete ? 'Edit your submissions →' : 'Submit an image →'}
      </button>

      {open && (
        <SubmitModal
          open
          onClose={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
          userId={userId}
          competitionId={comp.id}
          competitionTitle={comp.name}
          categories={comp.categories}
        />
      )}
    </>
  )
}

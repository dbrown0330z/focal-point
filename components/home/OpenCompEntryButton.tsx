'use client'

import { useState } from 'react'
import SubmitModal from '@/app/[clubSlug]/(member)/competitions/SubmitModal'

type Category = { id: string; name: string; count?: number }

type Props = {
  comp: {
    id:               string
    title:            string
    short_title:      string | null
    submission_limit: number
    memberUsed:       number
    categories:       Category[]
  }
  userId: string
  status: 'none' | 'partial' | 'full'
}

export default function OpenCompEntryButton({ comp, userId, status }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        style={{
          flexShrink:     0,
          fontSize:       13,
          fontWeight:     600,
          color:          'var(--action-primary)',
          background:     'none',
          border:         'none',
          padding:        0,
          cursor:         'pointer',
          whiteSpace:     'nowrap',
          textDecoration: 'none',
        }}
      >
        {status === 'none' ? 'Enter now →' : 'Enter again →'}
      </button>

      {modalOpen && (
        <SubmitModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => setModalOpen(false)}
          userId={userId}
          competitionId={comp.id}
          competitionTitle={comp.short_title ?? comp.title}
          categories={comp.categories}
        />
      )}
    </>
  )
}

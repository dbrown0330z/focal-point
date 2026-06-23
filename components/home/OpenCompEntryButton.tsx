'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  const [modalOpen, setModalOpen]       = useState(false)
  const [libraryImages, setLibraryImages] = useState<{
    id: string; title: string; storage_path: string; created_at: string; publicUrl: string
  }[]>([])
  const [loading, setLoading]           = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)
    // Fetch available library images client-side (images not already submitted)
    const supabase = createClient()
    const { data: imgs } = await supabase
      .from('images')
      .select(`id, title, storage_path, created_at, submissions!submissions_image_id_fkey(status)`)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    const available = (imgs ?? []).filter(img => {
      const subs = Array.isArray(img.submissions) ? img.submissions : []
      return !subs.some((s: { status: string }) => s.status === 'submitted')
    })

    const withUrls = available.map(img => ({
      id:           img.id,
      title:        img.title,
      storage_path: img.storage_path,
      created_at:   img.created_at,
      publicUrl:    supabase.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl,
    }))

    setLibraryImages(withUrls)
    setLoading(false)
    setModalOpen(true)
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          flexShrink:     0,
          fontSize:       13,
          fontWeight:     600,
          color:          'var(--action-primary)',
          background:     'none',
          border:         'none',
          padding:        0,
          cursor:         loading ? 'wait' : 'pointer',
          whiteSpace:     'nowrap',
          textDecoration: 'none',
          opacity:        loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Loading…' : status === 'none' ? 'Enter now →' : 'Enter again →'}
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
          libraryImages={libraryImages}
        />
      )}
    </>
  )
}

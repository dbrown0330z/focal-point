'use client'

import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { Lightbox, type LightboxImage } from '@/components/ui/Lightbox'

export default function GalleryViewer({
  galleryName,
  ownerName,
  images,
}: {
  galleryName: string
  ownerName:   string
  images:      { id: string; title: string; publicUrl: string; exifData: Record<string, unknown> | null }[]
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const lightboxImages: LightboxImage[] = images.map(img => ({
    src:      img.publicUrl,
    title:    img.title,
    exifData: img.exifData,
  }))

  if (images.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{galleryName}</Typography>
        <Typography color="text.secondary">This gallery has no images yet.</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" sx={{
          fontSize:      'var(--text-page-title-size)',
          fontWeight:    'var(--text-page-title-weight)',
          letterSpacing: 'var(--text-page-title-ls)',
          mb:            0.5,
        }}>
          {galleryName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          by {ownerName} · {images.length} image{images.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Masonry-ish grid */}
      <Box sx={{
        columns:     { xs: 2, sm: 3, md: 4 },
        gap:         '12px',
        '& > *': { breakInside: 'avoid', mb: '12px' },
      }}>
        {images.map((img, i) => (
          <Box
            key={img.id}
            onClick={() => setLightboxIndex(i)}
            sx={{
              cursor:        'pointer',
              borderRadius:  2,
              overflow:      'hidden',
              display:       'block',
              '&:hover img': { transform: 'scale(1.03)', transition: 'transform 0.2s' },
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.publicUrl}
              alt={img.title}
              style={{ width: '100%', display: 'block', transition: 'transform 0.2s' }}
            />
          </Box>
        ))}
      </Box>

      {lightboxIndex !== null && (
        <Lightbox
          images={lightboxImages}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          contextTitle={galleryName}
        />
      )}
    </Box>
  )
}

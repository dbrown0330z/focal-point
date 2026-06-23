'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteImage } from '@/app/[clubSlug]/(member)/library/actions'
import { Lightbox, type LightboxImage } from '@/components/ui/Lightbox'
import UploadModal, { type OpenCompetition } from '@/components/library/UploadModal'
import SubmitModal from '@/app/[clubSlug]/(member)/competitions/SubmitModal'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

type Image = {
  id: string
  title: string
  description: string | null
  storage_path: string
  created_at: string
  publicUrl: string
  isSubmitted: boolean
  exifData: Record<string, unknown> | null
  competitionTitle: string | null
  competitionDate: string | null
  categoryName: string | null
  score: number | null
}

type View         = 'gallery' | 'list'
type GallerySort  = 'date_desc' | 'title_asc' | 'title_desc'
type StatusFilter = 'all' | 'submitted' | 'available'
type SortKey      = 'title' | 'created_at'
type SortDir      = 'asc' | 'desc'

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconGrid() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z" />
    </svg>
  )
}

function IconList() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
    </svg>
  )
}

function IconChevronUp() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 15l-6-6-6 6" />
    </svg>
  )
}

function IconChevronDown() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  )
}

// ─── Status badges ────────────────────────────────────────────────────────────

function SubmittedBadge() {
  return (
    <span className="text-xs font-medium" style={{ background: 'var(--badge-available-bg)', border: '1px solid var(--badge-available-border)', color: 'var(--badge-available-text)', borderRadius: 4, padding: '2px 7px' }}>
      Submitted
    </span>
  )
}

// ─── Delete button ────────────────────────────────────────────────────────────

function DeleteImageButtonIcon({ imageId, storagePath }: { imageId: string; storagePath: string }) {
  const [error, setError]           = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    const result = await deleteImage(imageId, storagePath)
    if (result?.error) { setError(result.error); setConfirming(false) }
  }

  if (error) return <span className="text-xs text-status-error-text">{error}</span>

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button onClick={handleDelete} className="text-xs font-medium text-status-error-text hover:underline">Confirm</button>
        <button onClick={() => setConfirming(false)} className="text-xs text-content-tertiary hover:underline">Cancel</button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-content-tertiary hover:text-status-error-text transition-colors" aria-label="Delete">
      <IconTrash />
    </button>
  )
}

// ─── Sort header cell ─────────────────────────────────────────────────────────

function SortTh({ label, sortKey, current, dir, onSort, className }: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir
  onSort: (k: SortKey) => void; className?: string
}) {
  const active = current === sortKey
  return (
    <th className={`px-4 py-2.5 text-left ${className ?? ''}`}>
      <button
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-content-secondary hover:text-content-primary transition-colors"
      >
        {label}
        <span className={active ? 'text-action-primary' : 'text-content-tertiary'}>
          {active && dir === 'asc' ? <IconChevronUp /> : <IconChevronDown />}
        </span>
      </button>
    </th>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'submitted', label: 'Submitted' },
  { key: 'available', label: 'Available' },
]

export default function LibraryClient({
  images,
  clubSlug,
  userId,
  openCompetition,
}: {
  images:          Image[]
  clubSlug:        string
  userId:          string
  openCompetition: OpenCompetition | null
}) {
  const router = useRouter()
  const [view, setView]                         = useState<View>('gallery')
  const [lightboxIndex, setLightboxIndex]       = useState<number | null>(null)
  const [uploadOpen, setUploadOpen]             = useState(false)
  const [quickSubmitImage, setQuickSubmitImage] = useState<Image | null>(null)
  // Gallery controls
  const [gallerySort, setGallerySort]     = useState<GallerySort>('date_desc')
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>('all')
  // List sort
  const [sortKey, setSortKey]             = useState<SortKey>('created_at')
  const [sortDir, setSortDir]             = useState<SortDir>('desc')

  // Gallery: sort + filter
  const gallerySorted = [...images].sort((a, b) => {
    if (gallerySort === 'title_asc')  return a.title.localeCompare(b.title)
    if (gallerySort === 'title_desc') return b.title.localeCompare(a.title)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
  const galleryFiltered = gallerySorted.filter(img => {
    if (statusFilter === 'submitted') return img.isSubmitted
    if (statusFilter === 'available') return !img.isSubmitted
    return true
  })

  // List sort + filter
  const listSorted = [...images].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'title')      return mul * a.title.localeCompare(b.title)
    if (sortKey === 'created_at') return mul * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    return 0
  })
  const listFiltered = listSorted.filter(img => {
    if (statusFilter === 'submitted') return img.isSubmitted
    if (statusFilter === 'available') return !img.isSubmitted
    return true
  })

  function handleListSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const lightboxImages = view === 'list' ? listFiltered : galleryFiltered
  const openLightbox   = (i: number) => setLightboxIndex(i)

  // suppress unused warning — clubSlug may be needed by future child actions
  void clubSlug

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-lora)] text-[28px] font-bold leading-tight tracking-[-0.02em] text-content-primary">My Images</h1>
        </div>
        <div className="flex items-center gap-4">
          {images.length > 0 && (
            <div style={{ display: 'inline-flex' }}>
              {([['gallery', <IconGrid key="g" />], ['list', <IconList key="l" />]] as const).map(([v, icon], i) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  aria-label={v}
                  className="toggle-btn"
                  data-active={view === v ? 'true' : undefined}
                  style={{
                    background:   view === v ? 'var(--toggle-selected)' : 'transparent',
                    border:       `1px solid ${view === v ? 'var(--toggle-selected)' : 'var(--border-default)'}`,
                    borderRadius: i === 0 ? '7px 0 0 7px' : '0 7px 7px 0',
                    marginLeft:   i > 0 ? -1 : 0,
                    padding:      '5px 9px',
                    cursor:       'pointer',
                    color:        view === v ? '#fff' : 'var(--text-tertiary)',
                    display:      'flex',
                    alignItems:   'center',
                    position:     'relative',
                    zIndex:       view === v ? 1 : 0,
                    transition:   'background 0.12s, color 0.12s',
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          )}
          {images.length > 0 && (
            <Button variant="contained" onClick={() => setUploadOpen(true)}>
              + Add image
            </Button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {images.length === 0 && (
        <div className="flex flex-col items-center justify-center pb-16 pt-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/no-images-library.svg"
            alt=""
            width={510}
            className="-mb-4 opacity-70 dark:invert"
          />
          <p className="text-[22px] font-bold tracking-[-0.01em]" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-secondary)' }}>
            Every great library starts with one photo
          </p>
          <p className="mt-2 text-[15px]" style={{ color: 'var(--text-secondary)' }}>
            You haven&apos;t added anything yet — upload your first image to get started.
          </p>
          <Button variant="contained" onClick={() => setUploadOpen(true)} sx={{ mt: 4 }}>
            + Add image
          </Button>
        </div>
      )}

      {/* ── Gallery ── */}
      {images.length > 0 && view === 'gallery' && (
        <>
          {/* Gallery toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {/* Status filter */}
            <div style={{ display: 'inline-flex' }}>
              {STATUS_FILTERS.map((f, i) => {
                const active = statusFilter === f.key
                return (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className="toggle-btn"
                    data-active={active ? 'true' : undefined}
                    style={{
                      padding:      '5px 18px',
                      background:   active ? 'var(--toggle-selected)' : 'transparent',
                      border:       `1px solid ${active ? 'var(--toggle-selected)' : 'var(--border-default)'}`,
                      borderRadius: i === 0 ? '7px 0 0 7px' : i === STATUS_FILTERS.length - 1 ? '0 7px 7px 0' : 0,
                      marginLeft:   i > 0 ? -1 : 0,
                      cursor:       'pointer',
                      color:        active ? '#fff' : 'var(--text-secondary)',
                      fontSize:     13,
                      fontWeight:   active ? 700 : 500,
                      fontFamily:   'inherit',
                      position:     'relative',
                      zIndex:       active ? 1 : 0,
                      transition:   'background 0.12s, color 0.12s',
                    }}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>

            {/* Sort by */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'inherit' }}>Sort by:</span>
              <Select
                value={gallerySort}
                onChange={e => setGallerySort(e.target.value as GallerySort)}
                size="small"
                sx={{ fontSize: 14, fontFamily: 'inherit', minWidth: 140 }}
              >
                <MenuItem value="date_desc" sx={{ fontSize: 14, fontFamily: 'inherit' }}>Date added</MenuItem>
                <MenuItem value="title_asc"  sx={{ fontSize: 14, fontFamily: 'inherit' }}>Name (A–Z)</MenuItem>
                <MenuItem value="title_desc" sx={{ fontSize: 14, fontFamily: 'inherit' }}>Name (Z–A)</MenuItem>
              </Select>
            </div>

            {/* Live count */}
            <span className="ml-auto text-sm" style={{ color: 'var(--text-secondary)' }}>
              {galleryFiltered.length} {galleryFiltered.length === 1 ? 'photo' : 'photos'}
              {statusFilter !== 'all' && images.length !== galleryFiltered.length && (
                <span style={{ color: 'var(--text-tertiary)' }}> of {images.length}</span>
              )}
            </span>
          </div>

          {galleryFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-default py-16 text-center">
              <p className="text-sm font-medium text-content-secondary">No photos match this filter</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: 18 }}>
              {galleryFiltered.map((image, i) => (
                <div key={image.id} className="group">
                  <button
                    onClick={() => openLightbox(i)}
                    className="relative block w-full overflow-hidden rounded-lg bg-surface-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-primary"
                    style={{ paddingTop: '72%' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.publicUrl} alt={image.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>
                  <div className="mt-2 flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-content-primary" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>{image.title}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        {image.isSubmitted ? (
                          <>
                            <SubmittedBadge />
                            {image.score !== null && (
                              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{image.score}</span>
                            )}
                          </>
                        ) : openCompetition ? (
                          <button
                            onClick={e => { e.stopPropagation(); setQuickSubmitImage(image) }}
                            className="text-[12px] font-semibold transition-colors hover:underline"
                            style={{ color: 'var(--action-primary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                          >
                            Submit →
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {!image.isSubmitted && (
                      <div className="flex-shrink-0">
                        <DeleteImageButtonIcon imageId={image.id} storagePath={image.storage_path} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── List ── */}
      {images.length > 0 && view === 'list' && (
        <>
          {/* List toolbar */}
          <div className="mb-4 flex items-center">
            <div style={{ display: 'inline-flex' }}>
              {STATUS_FILTERS.map((f, i) => {
                const active = statusFilter === f.key
                return (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className="toggle-btn"
                    data-active={active ? 'true' : undefined}
                    style={{
                      padding:      '5px 18px',
                      background:   active ? 'var(--toggle-selected)' : 'transparent',
                      border:       `1px solid ${active ? 'var(--toggle-selected)' : 'var(--border-default)'}`,
                      borderRadius: i === 0 ? '7px 0 0 7px' : i === STATUS_FILTERS.length - 1 ? '0 7px 7px 0' : 0,
                      marginLeft:   i > 0 ? -1 : 0,
                      cursor:       'pointer',
                      color:        active ? '#fff' : 'var(--text-secondary)',
                      fontSize:     13,
                      fontWeight:   active ? 700 : 500,
                      fontFamily:   'inherit',
                      position:     'relative',
                      zIndex:       active ? 1 : 0,
                      transition:   'background 0.12s, color 0.12s',
                    }}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>

            {/* Live count */}
            <span className="ml-auto text-sm" style={{ color: 'var(--text-secondary)' }}>
              {listFiltered.length} {listFiltered.length === 1 ? 'photo' : 'photos'}
              {statusFilter !== 'all' && images.length !== listFiltered.length && (
                <span style={{ color: 'var(--text-tertiary)' }}> of {images.length}</span>
              )}
            </span>
          </div>

          {listFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-default py-16 text-center">
              <p className="text-sm font-medium text-content-secondary">No photos match this filter</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border-default">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default bg-surface-1">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-content-secondary w-16">Photo</th>
                    <SortTh label="Name"       sortKey="title"      current={sortKey} dir={sortDir} onSort={handleListSort} />
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-content-secondary whitespace-nowrap">Status</th>
                    <SortTh label="Date Added" sortKey="created_at" current={sortKey} dir={sortDir} onSort={handleListSort} className="hidden sm:table-cell" />
                    <th className="hidden lg:table-cell px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-content-secondary whitespace-nowrap">Competition date</th>
                    <th className="hidden lg:table-cell px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-content-secondary">Category</th>
                    <th className="hidden lg:table-cell px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-content-secondary">Score</th>
                    <th className="px-4 py-2.5 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {listFiltered.map((image, i) => (
                    <tr
                      key={image.id}
                      className="border-b border-border-default last:border-0 hover:bg-surface-1 transition-colors"
                    >
                      {/* Thumbnail */}
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => openLightbox(i)}
                          className="block overflow-hidden rounded-md bg-surface-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-primary flex-shrink-0"
                          style={{ width: 52, height: 38 }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image.publicUrl} alt={image.title} className="h-full w-full object-cover" />
                        </button>
                      </td>
                      {/* Name */}
                      <td className="px-4 py-2.5 font-medium text-content-primary">{image.title}</td>
                      {/* Status */}
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {image.isSubmitted ? (
                          !(image.score !== null || image.competitionDate) && <SubmittedBadge />
                        ) : openCompetition ? (
                          <button
                            onClick={() => setQuickSubmitImage(image)}
                            className="text-[12px] font-semibold transition-colors hover:underline"
                            style={{ color: 'var(--action-primary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                          >
                            Submit →
                          </button>
                        ) : null}
                      </td>
                      {/* Date added */}
                      <td className="hidden px-4 py-2.5 text-content-secondary whitespace-nowrap sm:table-cell">
                        {new Date(image.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      {/* Competition date */}
                      <td className="hidden lg:table-cell px-4 py-2.5 text-content-secondary whitespace-nowrap">
                        {image.competitionDate
                          ? new Date(image.competitionDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          : <span className="text-content-tertiary">—</span>}
                      </td>
                      {/* Category */}
                      <td className="hidden lg:table-cell px-4 py-2.5 text-content-secondary">
                        {image.categoryName ?? <span className="text-content-tertiary">—</span>}
                      </td>
                      {/* Score */}
                      <td className="hidden lg:table-cell px-4 py-2.5 text-content-secondary">
                        {image.score !== null ? image.score : <span className="text-content-tertiary">—</span>}
                      </td>
                      {/* Delete — hidden when submitted */}
                      <td className="px-4 py-2.5 text-right">
                        {!image.isSubmitted && <DeleteImageButtonIcon imageId={image.id} storagePath={image.storage_path} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={lightboxImages.map((img): LightboxImage => ({
            src:             img.publicUrl,
            title:           img.title,
            score:           img.score,
            exifData:        img.exifData,
            competitionDate: img.competitionDate
              ? new Date(img.competitionDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : null,
            categoryName:    img.categoryName,
          }))}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          contextTitle="My Image Gallery"
        />
      )}

      {/* Submit modal (library-entry mode) */}
      {quickSubmitImage && openCompetition && (
        <SubmitModal
          open
          onClose={() => setQuickSubmitImage(null)}
          onSuccess={() => { setQuickSubmitImage(null); router.refresh() }}
          userId={userId}
          competitionId={openCompetition.id}
          competitionTitle={openCompetition.title}
          categories={openCompetition.categories.map(cat => ({
            id:    cat.id,
            name:  cat.name,
            count: cat.count,
          }))}
          fullCategoryIds={openCompetition.categories
            .filter(cat => cat.limit !== null && cat.count >= cat.limit)
            .map(cat => cat.id)}
          preselectedImage={{
            id:        quickSubmitImage.id,
            title:     quickSubmitImage.title,
            publicUrl: quickSubmitImage.publicUrl,
          }}
        />
      )}

      {/* Upload modal */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        userId={userId}
        openCompetition={openCompetition}
      />

    </>
  )
}

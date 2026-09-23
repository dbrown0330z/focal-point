'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { ResourceCategory, Resource, ResourceCategoryLayout, ResourceSourceType } from './types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

function isNew(r: Resource): boolean {
  if (!r.show_new_badge || !r.published_at) return false
  return Date.now() - new Date(r.published_at).getTime() < 30 * 24 * 60 * 60 * 1000
}

function isUpdated(r: Resource): boolean {
  if (isNew(r) || !r.content_updated_at) return false
  return Date.now() - new Date(r.content_updated_at).getTime() < 30 * 24 * 60 * 60 * 1000
}

function resolveLayout(r: ResourceCategoryLayout, resources: Resource[]): ResourceCategoryLayout {
  if (r !== 'auto') return r
  const hasVideos = resources.some(x => x.source_type === 'video')
  const hasLinks  = resources.every(x => x.source_type === 'link')
  if (hasVideos) return 'video_grid'
  if (hasLinks)  return 'link_cards'
  return 'list'
}

const PREVIEW_LIMIT = 3

// ── Icons ────────────────────────────────────────────────────────────────────

function DocIcon({ mime }: { mime: string | null }) {
  if (!mime) return <FileIcon />
  if (mime.includes('pdf')) return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold" style={{ background: 'rgba(211,47,47,0.10)', color: 'var(--status-error)' }}>PDF</span>
  )
  if (mime.includes('word') || mime.includes('docx')) return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold" style={{ background: 'rgba(26,111,196,0.10)', color: 'var(--action-primary)' }}>DOC</span>
  )
  if (mime.includes('powerpoint') || mime.includes('pptx')) return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold" style={{ background: 'rgba(230,81,0,0.10)', color: 'var(--spot-orange)' }}>PPT</span>
  )
  return <FileIcon />
}

function FileIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function VideoIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function Badge({ type }: { type: 'new' | 'updated' }) {
  const color = type === 'new' ? 'var(--status-success)' : 'var(--action-primary)'
  const bg    = type === 'new' ? 'rgba(46,125,50,0.10)' : 'rgba(26,111,196,0.10)'
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ color, background: bg }}>
      {type === 'new' ? 'New' : 'Updated'}
    </span>
  )
}

// ── Type icon + label ─────────────────────────────────────────────────────────

function TypeLabel({ type, mime }: { type: ResourceSourceType; mime?: string | null }) {
  if (type === 'video') return <span className="text-xs text-content-tertiary flex items-center gap-1"><VideoIcon />Video</span>
  if (type === 'link')  return <span className="text-xs text-content-tertiary flex items-center gap-1"><LinkIcon />Link</span>
  // file
  if (mime?.includes('pdf')) return <span className="text-xs text-content-tertiary">PDF</span>
  if (mime?.includes('word') || mime?.includes('docx')) return <span className="text-xs text-content-tertiary">Word</span>
  if (mime?.includes('powerpoint') || mime?.includes('pptx')) return <span className="text-xs text-content-tertiary">PowerPoint</span>
  return <span className="text-xs text-content-tertiary">File</span>
}

// ── Meta line ─────────────────────────────────────────────────────────────────

function MetaLine({ r }: { r: Resource }) {
  const date = formatDate(r.content_updated_at ?? r.published_at)
  const parts: string[] = []

  if (r.source_type === 'video') {
    const dur = formatDuration(r.duration_seconds)
    if (dur) parts.push(dur)
    if (r.video_provider) parts.push(r.video_provider === 'youtube' ? 'YouTube' : 'Vimeo')
    if (r.author) parts.push(r.author)
  } else if (r.source_type === 'link') {
    if (r.url_host) parts.push(r.url_host)
    if (r.author) parts.push(r.author)
  } else {
    // file
    const mime = r.file_mime ?? ''
    if (mime.includes('pdf') && r.page_count) parts.push(`${r.page_count} pages`)
    if (mime.includes('word') || mime.includes('docx')) parts.push('Word')
    if (mime.includes('powerpoint') || mime.includes('pptx')) parts.push('PowerPoint')
    if (r.author) parts.push(r.author)
  }

  if (date) parts.push(date)

  if (parts.length === 0) return null
  return <span className="text-xs text-content-tertiary">{parts.join(' · ')}</span>
}

// ── Resource Row ──────────────────────────────────────────────────────────────

function ResourceRow({
  r, clubSlug, onVideoOpen,
}: {
  r: Resource
  clubSlug: string
  onVideoOpen: (id: string) => void
}) {
  const badge = isNew(r) ? 'new' : isUpdated(r) ? 'updated' : null
  const isPdf = r.source_type === 'file' && r.file_mime?.includes('pdf')
  const isDownload = r.source_type === 'file' && !isPdf

  const href = r.source_type === 'video'
    ? '#'
    : `/${clubSlug}/r/${r.id}`

  const handleClick = (e: React.MouseEvent) => {
    if (r.source_type === 'video') {
      e.preventDefault()
      onVideoOpen(r.id)
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-lg px-3 py-3 -mx-3 hover:bg-surface-1 transition-colors group">
      {/* Icon */}
      <div className="mt-0.5">
        {r.source_type === 'video' ? <VideoIcon /> : r.source_type === 'link' ? <LinkIcon /> : <DocIcon mime={r.file_mime} />}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <a
            href={href}
            target={r.source_type !== 'video' ? '_blank' : undefined}
            rel={r.source_type !== 'video' ? 'noopener noreferrer' : undefined}
            onClick={handleClick}
            className="text-sm font-medium text-content-primary hover:text-action-primary transition-colors"
            aria-label={r.source_type !== 'video' ? `${r.title} (opens in new tab)` : `Play ${r.title}`}
          >
            {r.title}
          </a>
          {badge && <Badge type={badge} />}
          {r.source_type !== 'video' && (
            <span className="text-content-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalIcon />
            </span>
          )}
        </div>
        {r.description && (
          <p className="mt-0.5 text-xs text-content-secondary line-clamp-1">{r.description}</p>
        )}
        <div className="mt-0.5">
          <MetaLine r={r} />
        </div>
      </div>

      {/* Secondary download button for PDFs */}
      {isPdf && (
        <a
          href={`/${clubSlug}/r/${r.id}?download=1`}
          className="shrink-0 rounded-md p-1.5 text-content-tertiary hover:bg-surface-1 hover:text-content-primary transition-colors"
          aria-label={`Download ${r.title}`}
          title="Download"
          download
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      )}
    </div>
  )
}

// ── Video Thumbnail Card ──────────────────────────────────────────────────────

function VideoCard({
  r, onVideoOpen,
}: {
  r: Resource
  onVideoOpen: (id: string) => void
}) {
  const badge = isNew(r) ? 'new' : isUpdated(r) ? 'updated' : null
  const dur   = formatDuration(r.duration_seconds)

  return (
    <button
      onClick={() => onVideoOpen(r.id)}
      className="group flex flex-col rounded-xl overflow-hidden border border-border-default bg-surface-1 hover:border-border-strong transition-colors text-left w-full"
      aria-label={`Play ${r.title}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-surface-0 flex items-center justify-center">
        {r.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-surface-1 text-content-tertiary">
            <VideoIcon />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-content-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <PlayIcon />
          </span>
        </div>
        {dur && (
          <span className="absolute bottom-2 right-2 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ background: 'rgba(0,0,0,0.75)' }}>
            {dur}
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-1">
          <h3 className="text-sm font-semibold text-content-primary line-clamp-2 flex-1">{r.title}</h3>
          {badge && <Badge type={badge} />}
        </div>
        {r.description && <p className="mt-1 text-xs text-content-secondary line-clamp-1">{r.description}</p>}
        <div className="mt-1.5"><MetaLine r={r} /></div>
      </div>
    </button>
  )
}

// ── Link Card ─────────────────────────────────────────────────────────────────

function LinkCard({ r, clubSlug }: { r: Resource; clubSlug: string }) {
  const badge = isNew(r) ? 'new' : isUpdated(r) ? 'updated' : null
  return (
    <a
      href={`/${clubSlug}/r/${r.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-2 rounded-xl border border-border-default bg-surface-1 p-4 hover:border-border-strong transition-colors"
      aria-label={`${r.title} (opens in new tab)`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-content-primary group-hover:text-action-primary line-clamp-2 flex-1">{r.title}</h3>
        {badge && <Badge type={badge} />}
      </div>
      {r.description && <p className="text-xs text-content-secondary line-clamp-2">{r.description}</p>}
      <div className="flex items-center gap-1 text-xs text-content-tertiary">
        <ExternalIcon />
        <span>{r.url_host ?? 'External link'}</span>
      </div>
    </a>
  )
}

// ── Featured Card (Start Here) ────────────────────────────────────────────────

function FeaturedCard({
  r, clubSlug, onVideoOpen,
}: {
  r: Resource
  clubSlug: string
  onVideoOpen: (id: string) => void
}) {
  const badge = isNew(r) ? 'new' : isUpdated(r) ? 'updated' : null

  const href = r.source_type === 'video'
    ? '#'
    : `/${clubSlug}/r/${r.id}`

  const handleClick = (e: React.MouseEvent) => {
    if (r.source_type === 'video') {
      e.preventDefault()
      onVideoOpen(r.id)
    }
  }

  return (
    <a
      href={href}
      target={r.source_type !== 'video' ? '_blank' : undefined}
      rel={r.source_type !== 'video' ? 'noopener noreferrer' : undefined}
      onClick={handleClick}
      className="flex flex-col gap-3 rounded-xl border border-border-default bg-surface-1 p-4 hover:border-action-primary hover:bg-[rgba(26,111,196,0.03)] transition-colors"
      aria-label={r.source_type !== 'video' ? `${r.title} (opens in new tab)` : `Play ${r.title}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-action-primary">
          {r.source_type === 'video' ? <VideoIcon /> : r.source_type === 'link' ? <LinkIcon /> : <FileIcon />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold text-content-primary">{r.title}</span>
            {badge && <Badge type={badge} />}
          </div>
          {r.description && <p className="mt-1 text-xs text-content-secondary line-clamp-2">{r.description}</p>}
          <div className="mt-1.5"><MetaLine r={r} /></div>
        </div>
      </div>
    </a>
  )
}

// ── Video Dialog ──────────────────────────────────────────────────────────────

function VideoDialog({
  resource,
  onClose,
}: {
  resource: Resource | null
  onClose: () => void
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!resource) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [resource, onClose])

  // Stop video on close by removing src
  useEffect(() => {
    if (!resource && iframeRef.current) {
      iframeRef.current.src = ''
    }
  }, [resource])

  if (!resource) return null

  const embedUrl = resource.video_provider === 'youtube'
    ? `https://www.youtube-nocookie.com/embed/${resource.video_id}?autoplay=1&rel=0`
    : `https://player.vimeo.com/video/${resource.video_id}?dnt=1&autoplay=1`

  const providerName = resource.video_provider === 'youtube' ? 'YouTube' : 'Vimeo'
  const externalUrl  = resource.video_provider === 'youtube'
    ? `https://www.youtube.com/watch?v=${resource.video_id}`
    : `https://vimeo.com/${resource.video_id}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      role="dialog"
      aria-modal="true"
      aria-label={resource.title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex w-full max-w-4xl flex-col gap-3 rounded-2xl bg-surface-2 shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-0">
          <div>
            <h2 className="text-base font-bold text-content-primary">{resource.title}</h2>
            {resource.description && <p className="mt-0.5 text-sm text-content-secondary">{resource.description}</p>}
            <div className="mt-1 flex items-center gap-3">
              <MetaLine r={resource} />
              <a href={externalUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-action-primary hover:underline flex items-center gap-1">
                Watch on {providerName} <ExternalIcon />
              </a>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-content-tertiary hover:bg-surface-1 hover:text-content-primary transition-colors"
            aria-label="Close video"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Embed */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%', height: 0 }}>
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title={resource.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}

// ── Category Section ──────────────────────────────────────────────────────────

function CategorySection({
  category,
  items,
  clubSlug,
  onVideoOpen,
  preview = false,
}: {
  category: ResourceCategory
  items: Resource[]
  clubSlug: string
  onVideoOpen: (id: string) => void
  preview?: boolean
}) {
  const layout = resolveLayout(category.layout, items)
  const shown  = preview ? items.slice(0, PREVIEW_LIMIT) : items

  const videos    = shown.filter(r => r.source_type === 'video')
  const nonVideos = shown.filter(r => r.source_type !== 'video')

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-content-primary">{category.name}</h2>
        {preview && items.length > PREVIEW_LIMIT && (
          <a
            href={`?category=${category.slug}`}
            className="text-sm text-action-primary hover:underline"
          >
            View all {items.length}
          </a>
        )}
      </div>

      {layout === 'video_grid' && (
        <>
          {videos.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
              {videos.map(r => <VideoCard key={r.id} r={r} onVideoOpen={onVideoOpen} />)}
            </div>
          )}
          {nonVideos.length > 0 && (
            <div className="divide-y divide-border-subtle">
              {nonVideos.map(r => <ResourceRow key={r.id} r={r} clubSlug={clubSlug} onVideoOpen={onVideoOpen} />)}
            </div>
          )}
        </>
      )}

      {layout === 'link_cards' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map(r => <LinkCard key={r.id} r={r} clubSlug={clubSlug} />)}
        </div>
      )}

      {(layout === 'list' || layout === 'featured_cards') && (
        <div className="divide-y divide-border-subtle">
          {shown.map(r => <ResourceRow key={r.id} r={r} clubSlug={clubSlug} onVideoOpen={onVideoOpen} />)}
        </div>
      )}
    </section>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ResourcesClient({
  categories,
  resources,
  hiddenCount,
  isAuthenticated,
  clubSlug,
  activeCategorySlug,
  initialVideoId,
}: {
  categories:          ResourceCategory[]
  resources:           Resource[]
  hiddenCount:         number
  isAuthenticated:     boolean
  clubSlug:            string
  activeCategorySlug?: string | null
  initialVideoId?:    string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query,        setQuery]        = useState(searchParams.get('q') ?? '')
  const [typeFilter,   setTypeFilter]   = useState<ResourceSourceType | 'all'>(
    (searchParams.get('type') as ResourceSourceType | 'all') ?? 'all'
  )
  const [selectedCat,  setSelectedCat]  = useState<string | null>(
    activeCategorySlug ?? searchParams.get('category') ?? null
  )
  const [newFilter,    setNewFilter]    = useState(searchParams.get('new') === '1')
  const [openVideoId,  setOpenVideoId]  = useState<string | null>(
    initialVideoId ?? searchParams.get('v') ?? null
  )
  const [debouncedQ,   setDebouncedQ]   = useState(query)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 250)
    return () => clearTimeout(t)
  }, [query])

  // Sync URL
  useEffect(() => {
    const p = new URLSearchParams()
    if (debouncedQ) p.set('q', debouncedQ)
    if (typeFilter !== 'all') p.set('type', typeFilter)
    if (selectedCat) p.set('category', selectedCat)
    if (newFilter) p.set('new', '1')
    if (openVideoId) p.set('v', openVideoId)
    const qs = p.toString()
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, typeFilter, selectedCat, newFilter, openVideoId])

  const openVideo = useCallback((id: string) => setOpenVideoId(id), [])
  const closeVideo = useCallback(() => setOpenVideoId(null), [])

  const openVideoResource = useMemo(
    () => resources.find(r => r.id === openVideoId) ?? null,
    [resources, openVideoId]
  )

  // Filtered resources
  const filtered = useMemo(() => {
    let rs = resources
    if (typeFilter !== 'all') rs = rs.filter(r => r.source_type === typeFilter)
    if (newFilter) rs = rs.filter(r => isNew(r) || isUpdated(r))
    if (debouncedQ) {
      const q = debouncedQ.toLowerCase()
      rs = rs.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        (r.author ?? '').toLowerCase().includes(q) ||
        (r.url_host ?? '').toLowerCase().includes(q)
      )
    }
    return rs
  }, [resources, typeFilter, newFilter, debouncedQ])

  // Pinned items (not duplicated in sections)
  const pinnedIds  = useMemo(() => new Set(resources.filter(r => r.is_pinned).map(r => r.id)), [resources])
  const pinnedItems = useMemo(() => {
    if (debouncedQ || newFilter) return []
    return resources
      .filter(r => r.is_pinned && (typeFilter === 'all' || r.source_type === typeFilter))
      .sort((a, b) => (a.pinned_order ?? 99) - (b.pinned_order ?? 99))
      .slice(0, 3)
  }, [resources, typeFilter, debouncedQ, newFilter])

  // Items by category (excluding pinned when showing all)
  const catItems = useCallback((catId: string) => {
    const base = filtered.filter(r => r.category_id === catId)
    if (!debouncedQ && !newFilter && !selectedCat) {
      return base.filter(r => !pinnedIds.has(r.id))
    }
    return base
  }, [filtered, pinnedIds, debouncedQ, newFilter, selectedCat])

  // Visible categories with items
  const visibleCats = useMemo(() =>
    categories.filter(c => {
      const count = filtered.filter(r => r.category_id === c.id).length
      return count > 0
    })
  , [categories, filtered])

  // Category nav counts
  const catCounts = useMemo(() => {
    const m: Record<string, number> = {}
    categories.forEach(c => {
      m[c.slug] = filtered.filter(r => r.category_id === c.id).length
    })
    return m
  }, [categories, filtered])

  const newBadgeCount = useMemo(() =>
    resources.filter(r => isNew(r) || isUpdated(r)).length
  , [resources])

  // Show/hide sections based on selected cat
  const sectionsToShow = selectedCat
    ? categories.filter(c => c.slug === selectedCat)
    : visibleCats

  return (
    <>
      <VideoDialog resource={openVideoResource} onClose={closeVideo} />

      <div className="flex gap-8">
        {/* ── Left rail (desktop category nav) ─────────────────────────────── */}
        <aside className="hidden lg:flex w-48 shrink-0 flex-col gap-1 pt-1">
          <nav aria-label="Resource categories">
            <button
              onClick={() => setSelectedCat(null)}
              aria-current={!selectedCat ? 'page' : undefined}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                !selectedCat
                  ? 'font-semibold text-action-primary bg-[rgba(26,111,196,0.08)]'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-1'
              }`}
            >
              <span>All</span>
              <span className="text-xs text-content-tertiary">{filtered.length}</span>
            </button>
            {categories.filter(c => catCounts[c.slug] > 0 || c.slug === selectedCat).map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.slug === selectedCat ? null : c.slug)}
                aria-current={selectedCat === c.slug ? 'page' : undefined}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  selectedCat === c.slug
                    ? 'font-semibold text-action-primary bg-[rgba(26,111,196,0.08)]'
                    : 'text-content-secondary hover:text-content-primary hover:bg-surface-1'
                }`}
              >
                <span className="truncate text-left">{c.name}</span>
                <span className="text-xs text-content-tertiary ml-1 shrink-0">{catCounts[c.slug] ?? 0}</span>
              </button>
            ))}
          </nav>
          {isAuthenticated && resources.length > 0 && (
            <div className="mt-4 border-t border-border-subtle pt-4">
              <a
                href="#suggest"
                className="text-xs text-content-tertiary hover:text-content-secondary transition-colors"
              >
                Suggest a resource
              </a>
            </div>
          )}
        </aside>

        {/* ── Main content ──────────────────────────────────────────────────── */}
        <div className="min-w-0 flex-1">
          {/* Page header */}
          <div className="mb-5">
            <h1 className="font-bold text-content-primary" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>Resources</h1>
            <p className="mt-1 text-sm text-content-secondary">Club documents, lessons, and links worth your time.</p>
          </div>

          {/* Search */}
          <div className="mb-4 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-tertiary pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search resources…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full rounded-lg border border-border-default bg-surface-2 py-2 pl-9 pr-9 text-sm text-content-primary placeholder:text-content-hint focus:outline-none focus:border-action-primary transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-tertiary hover:text-content-primary"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter bar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="Type filter" className="flex gap-1">
              {(['all', 'file', 'video', 'link'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  aria-pressed={typeFilter === t}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    typeFilter === t
                      ? 'bg-action-primary text-white font-medium'
                      : 'bg-surface-1 text-content-secondary hover:bg-surface-0'
                  }`}
                >
                  {t === 'all' ? 'All' : t === 'file' ? 'Documents' : t === 'video' ? 'Videos' : 'Links'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-sm text-content-secondary">
              <span aria-live="polite">
                {debouncedQ
                  ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${debouncedQ}"`
                  : `${filtered.length} resource${filtered.length !== 1 ? 's' : ''}`}
              </span>
              {newBadgeCount > 0 && (
                <button
                  onClick={() => setNewFilter(f => !f)}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    newFilter
                      ? 'bg-action-primary text-white'
                      : 'bg-surface-1 text-content-secondary hover:bg-surface-0'
                  }`}
                >
                  ✦ What&apos;s new ({newBadgeCount})
                </button>
              )}
            </div>
          </div>

          {/* Mobile category chips */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            <button
              onClick={() => setSelectedCat(null)}
              aria-pressed={!selectedCat}
              className={`shrink-0 rounded-full px-3 py-1 text-sm transition-colors ${
                !selectedCat ? 'bg-action-primary text-white font-medium' : 'bg-surface-1 text-content-secondary'
              }`}
            >
              All
            </button>
            {categories.filter(c => catCounts[c.slug] > 0).map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.slug === selectedCat ? null : c.slug)}
                aria-pressed={selectedCat === c.slug}
                className={`shrink-0 rounded-full px-3 py-1 text-sm transition-colors ${
                  selectedCat === c.slug ? 'bg-action-primary text-white font-medium' : 'bg-surface-1 text-content-secondary'
                }`}
              >
                {c.name} {catCounts[c.slug] > 0 && <span className="text-xs opacity-70">({catCounts[c.slug]})</span>}
              </button>
            ))}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && resources.length === 0 && (
            <div className="rounded-xl border border-border-default bg-surface-1 px-6 py-14 text-center">
              <svg className="mx-auto mb-3 h-8 w-8 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="text-sm font-medium text-content-primary">Nothing here yet</p>
              <p className="mt-1 text-sm text-content-secondary">Check back soon — resources will appear here once an admin publishes them.</p>
            </div>
          )}

          {filtered.length === 0 && resources.length > 0 && (
            <div className="rounded-xl border border-border-default bg-surface-1 px-6 py-12 text-center">
              <p className="text-sm font-medium text-content-primary">No resources match &ldquo;{debouncedQ}&rdquo;</p>
              <button
                onClick={() => { setQuery(''); setTypeFilter('all'); setNewFilter(false) }}
                className="mt-3 text-sm text-action-primary hover:underline"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Start here */}
          {pinnedItems.length > 0 && !selectedCat && (
            <section className="mb-8">
              <h2 className="mb-3 text-base font-semibold text-content-primary">Start here</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pinnedItems.map(r => <FeaturedCard key={r.id} r={r} clubSlug={clubSlug} onVideoOpen={openVideo} />)}
              </div>
            </section>
          )}

          {/* Category sections */}
          {sectionsToShow.map(cat => {
            const items = catItems(cat.id)
            if (items.length === 0) return null
            const isPreview = !selectedCat && !debouncedQ && !newFilter
            return (
              <section key={cat.id} className="mb-8">
                <CategorySection
                  category={cat}
                  items={items}
                  clubSlug={clubSlug}
                  onVideoOpen={openVideo}
                  preview={isPreview}
                />
              </section>
            )
          })}

          {/* Sign-in prompt for public visitors */}
          {!isAuthenticated && hiddenCount > 0 && (
            <div className="mt-8 rounded-xl border border-border-default bg-surface-1 px-6 py-8 text-center">
              <p className="text-sm text-content-primary">
                Members can see {hiddenCount} more resource{hiddenCount !== 1 ? 's' : ''}.
              </p>
              <div className="mt-3 flex justify-center gap-3">
                <a href={`/${clubSlug}/login`}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                  style={{ background: 'var(--action-primary)' }}>
                  Sign in
                </a>
                <a href={`/${clubSlug}/apply`}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  style={{ border: '1.5px solid var(--action-secondary)', color: 'var(--action-secondary)' }}>
                  Join the club
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

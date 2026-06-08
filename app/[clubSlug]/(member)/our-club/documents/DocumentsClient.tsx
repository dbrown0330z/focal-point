'use client'

import { useState, useMemo } from 'react'
import type { DocumentRow } from './page'

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function FileIcon({ mimeType }: { mimeType: string | null }) {
  const isPdf  = mimeType === 'application/pdf' || mimeType?.includes('pdf')
  const isWord = mimeType?.includes('word') || mimeType?.includes('docx')

  if (isPdf) {
    return (
      <svg className="h-8 w-8 flex-shrink-0" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="rgba(211,47,47,0.10)"/>
        <text x="16" y="22" textAnchor="middle" fontSize="10" fontWeight="700" fill="#D32F2F" fontFamily="system-ui">PDF</text>
      </svg>
    )
  }
  if (isWord) {
    return (
      <svg className="h-8 w-8 flex-shrink-0" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="rgba(26,111,196,0.10)"/>
        <text x="16" y="22" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1A6FC4" fontFamily="system-ui">DOC</text>
      </svg>
    )
  }
  return (
    <svg className="h-8 w-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="text-content-tertiary" />
    </svg>
  )
}

export default function DocumentsClient({
  documents,
  categories,
}: {
  documents:  DocumentRow[]
  categories: { id: string; name: string }[]
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!activeCategory) return documents
    return documents.filter(d => d.category?.id === activeCategory)
  }, [documents, activeCategory])

  // Only show categories that have documents
  const usedCategoryIds = new Set(documents.map(d => d.category?.id).filter(Boolean))
  const visibleCategories = categories.filter(c => usedCategoryIds.has(c.id))

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-bold text-content-primary" style={{ fontFamily: 'var(--font-heading)', fontSize: 28, letterSpacing: '-0.02em' }}>Documents</h1>
        <p className="mt-1 text-sm text-content-secondary">Club documents, forms, and reference materials.</p>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-border-default bg-surface-1 px-6 py-14 text-center">
          <svg className="mx-auto mb-3 h-8 w-8 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium text-content-primary">No documents yet</p>
          <p className="mt-1 text-sm text-content-secondary">Club documents will appear here once an admin uploads them.</p>
        </div>
      ) : (
        <>
          {/* Category filter chips */}
          {visibleCategories.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === null
                    ? 'bg-action-primary text-white'
                    : 'border border-border-default bg-surface-2 text-content-secondary hover:text-content-primary hover:bg-surface-1'
                }`}
              >
                All
              </button>
              {visibleCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-action-primary text-white'
                      : 'border border-border-default bg-surface-2 text-content-secondary hover:text-content-primary hover:bg-surface-1'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Document list */}
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border-default bg-surface-1 px-6 py-10 text-center">
              <p className="text-sm text-content-secondary">No documents in this category.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map(doc => (
                <a
                  key={doc.id}
                  href={`/our-club/documents/${doc.id}/download`}
                  className="group flex items-start gap-4 rounded-xl border border-border-default bg-surface-2 px-5 py-4 transition-colors hover:border-action-primary hover:bg-[rgba(26,111,196,0.04)] dark:hover:bg-[rgba(74,144,212,0.06)]"
                >
                  <FileIcon mimeType={doc.mime_type} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-content-primary group-hover:text-action-primary transition-colors truncate">
                          {doc.title}
                        </p>
                        {doc.description && (
                          <p className="mt-0.5 text-sm text-content-secondary leading-relaxed line-clamp-2">
                            {doc.description}
                          </p>
                        )}
                      </div>
                      {/* Download icon */}
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-content-tertiary group-hover:text-action-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>

                    {/* Meta row */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-content-tertiary">
                      {doc.category && (
                        <span
                          className="rounded-full px-2 py-0.5 font-medium"
                          style={{ background: 'var(--surface-1)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                        >
                          {doc.category.name}
                        </span>
                      )}
                      <span>{doc.file_name}</span>
                      {doc.file_size && <span>{formatBytes(doc.file_size)}</span>}
                      <span>Added {formatDate(doc.uploaded_at)}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

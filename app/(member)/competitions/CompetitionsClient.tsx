'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SubmitModal from './SubmitModal'
import { withdrawFromCompetition, changeCategoryAction, editImageTitleAction } from './actions'

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = { id: string; name: string }

type Submission = {
  id: string
  imageId: string
  categoryId: string
  categoryName: string
  imageTitle: string
  publicUrl: string
}

type CategoryStat = { name: string; count: number }

type ClubStats = {
  totalImages: number
  membersEntered: number
  byCat: CategoryStat[]
}

type CurrentCompetition = {
  id: string
  title: string
  status: string
  closes_at: string | null
  results_at: string | null
  submission_limit: number
  // categoryLimit: per-category club cap — null until DB field is added
  categoryLimit: number | null
  categories: Category[]
  judgeName: string | null
  mySubmissions: Submission[]
  clubStats: ClubStats
}

type PreviousCompetition = {
  id: string
  title: string
  status: string
  closes_at: string | null
  imageCount: number
  judgeName: string | null
}

type LibraryImage = {
  id: string
  title: string
  storage_path: string
  created_at: string
  publicUrl: string
}

type Props = {
  userId: string
  currentCompetitions: CurrentCompetition[]
  previousCompetitions: PreviousCompetition[]
  libraryImages: LibraryImage[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFullCategoryIds(competition: CurrentCompetition): string[] {
  if (!competition.categoryLimit) return []
  return competition.categories
    .filter(cat => {
      const stat = competition.clubStats.byCat.find(c => c.name === cat.name)
      return (stat?.count ?? 0) >= competition.categoryLimit!
    })
    .map(c => c.id)
}

// ─── Icons ───────────────────────────────────────────────────────────────────
// Using Heroicons solid style (viewBox 0 0 20 20, fill) to match library

function IconTrash() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
    </svg>
  )
}

function IconPencil() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
      <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 17a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
    </svg>
  )
}

function IconUpload() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
  )
}

function IconTrophy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
    </svg>
  )
}

function IconChevronRightNav() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
    </svg>
  )
}

function IconImages() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
      <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0l-2.97 2.97zM12 7a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
    </svg>
  )
}

// ─── Phase logic ──────────────────────────────────────────────────────────────

type Phase = 'open' | 'warning' | 'judging'

function getPhase(closesAt: string | null, status: string): Phase {
  if (status !== 'open') return 'judging'
  if (!closesAt) return 'open'
  const diffMs = new Date(closesAt).getTime() - Date.now()
  const days = diffMs / (1000 * 60 * 60 * 24)
  if (days < 0) return 'judging'
  if (days <= 7) return 'warning'
  return 'open'
}

function phaseTint(phase: Phase) {
  if (phase === 'open' || phase === 'warning') return 'var(--phase-open-bg)'
  return 'rgba(0,0,0,0.02)'
}
function phaseBorder(phase: Phase) {
  if (phase === 'open' || phase === 'warning') return 'var(--phase-open-border)'
  return 'transparent'
}

function formatDate(iso: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, opts ?? { month: 'long', day: 'numeric', year: 'numeric' })
}

function daysLeft(closesAt: string | null): number | null {
  if (!closesAt) return null
  return Math.ceil((new Date(closesAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

// ─── Status pill ─────────────────────────────────────────────────────────────

function PhasePill({ phase }: { phase: Phase }) {
  const configs = {
    open:    { label: 'Submissions open',      bg: 'var(--status-success-bg)',        color: 'var(--status-success-text)' },
    warning: { label: 'Open — closing soon',   bg: 'rgba(230, 81, 0, 0.12)',          color: '#D44F00' },
    judging: { label: 'Judging in progress',   bg: 'var(--status-warning-bg)',        color: 'var(--status-warning-text)' },
  }
  const cfg = configs[phase]
  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-[0.03em]"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

// ─── Category buttons (shared, with full-state support) ───────────────────────

function CategoryButtons({
  categories,
  selected,
  onSelect,
  fullCategoryIds = [],
}: {
  categories: Category[]
  selected: string
  onSelect: (id: string) => void
  fullCategoryIds?: string[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(cat => {
        const isFull = fullCategoryIds.includes(cat.id) && cat.id !== selected
        return (
          <button
            key={cat.id}
            type="button"
            disabled={isFull}
            onClick={() => !isFull && onSelect(cat.id)}
            className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--action-primary)]/40"
            style={{
              background: selected === cat.id
                ? 'var(--action-primary)'
                : isFull ? 'var(--surface-0)' : 'var(--surface-2)',
              borderColor: selected === cat.id
                ? 'var(--action-primary)'
                : isFull ? 'var(--border-subtle)' : 'var(--border-default)',
              color: selected === cat.id
                ? '#fff'
                : isFull ? 'var(--text-disabled)' : 'var(--text-secondary)',
              cursor: isFull ? 'not-allowed' : 'pointer',
              opacity: isFull ? 0.6 : 1,
            }}
          >
            {cat.name}{isFull ? ' · Full' : ''}
          </button>
        )
      })}
    </div>
  )
}

// ─── Submissions lightbox ─────────────────────────────────────────────────────

function SubmissionsLightbox({
  submissions,
  startId,
  onClose,
}: {
  submissions: Submission[]
  startId: string
  onClose: () => void
}) {
  const [currentId, setCurrentId] = useState(startId)
  const idx = submissions.findIndex(s => s.id === currentId)
  const current = submissions[idx] ?? submissions[0]

  const prev = useCallback(() => {
    if (idx > 0) setCurrentId(submissions[idx - 1].id)
  }, [submissions, idx])
  const next = useCallback(() => {
    if (idx < submissions.length - 1) setCurrentId(submissions[idx + 1].id)
  }, [submissions, idx])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-3xl flex-col items-center px-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-4 flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white"
          style={{ background: 'rgba(255,255,255,0.12)' }}
        >
          <IconClose />
        </button>

        {/* Image */}
        <div className="relative w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.publicUrl}
            alt={current.imageTitle}
            className="max-h-[72vh] w-full rounded-xl object-contain"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          />
          {idx > 0 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); prev() }}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors"
              style={{ background: 'rgba(0,0,0,0.55)' }}
            >
              <IconChevronLeft />
            </button>
          )}
          {idx < submissions.length - 1 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); next() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors"
              style={{ background: 'rgba(0,0,0,0.55)' }}
            >
              <IconChevronRightNav />
            </button>
          )}
        </div>

        {/* Caption */}
        <div className="mt-3 text-center">
          <p className="text-[15px] font-semibold text-white">{current.imageTitle}</p>
          <p className="mt-0.5 text-[12px] text-white/60">{current.categoryName}</p>
        </div>

        {/* Dots */}
        {submissions.length > 1 && (
          <div className="mt-3 flex gap-1.5">
            {submissions.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={e => { e.stopPropagation(); setCurrentId(s.id) }}
                className="h-2 rounded-full transition-all"
                style={{
                  width: s.id === currentId ? 20 : 8,
                  background: s.id === currentId ? 'white' : 'rgba(255,255,255,0.35)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Edit entry dialog ────────────────────────────────────────────────────────

function EditEntryDialog({
  submission,
  categories,
  fullCategoryIds,
  onClose,
  onSaved,
}: {
  submission: Submission
  categories: Category[]
  fullCategoryIds: string[]
  onClose: () => void
  onSaved: (newTitle: string, newCategoryId: string, newCategoryName: string) => void
}) {
  const [title, setTitle] = useState(submission.imageTitle)
  const [categoryId, setCategoryId] = useState(submission.categoryId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true); setError(null)

    const titleChanged = title.trim() !== submission.imageTitle
    const catChanged = categoryId !== submission.categoryId

    if (titleChanged) {
      const { error: err } = await editImageTitleAction(submission.imageId, title.trim())
      if (err) { setError(err); setSaving(false); return }
    }
    if (catChanged) {
      const { error: err } = await changeCategoryAction(submission.id, categoryId)
      if (err) { setError(err); setSaving(false); return }
    }

    const newCat = categories.find(c => c.id === categoryId)
    onSaved(title.trim(), categoryId, newCat?.name ?? submission.categoryName)
  }

  const hasChanges = title.trim() !== submission.imageTitle || categoryId !== submission.categoryId

  return (
    <div
      className="fixed inset-0 z-[1500] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-default)' }}
        >
          <h3 className="text-[16px] font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            Edit entry
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-tertiary)', background: 'var(--surface-2)' }}
          >
            <IconClose />
          </button>
        </div>

        {/* Preview */}
        <div style={{ padding: '0 22px' }}>
          <div className="relative overflow-hidden rounded-xl" style={{ marginTop: 18, paddingTop: '40%' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={submission.publicUrl}
              alt={submission.imageTitle}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Fields */}
        <div style={{ padding: '18px 22px 22px' }}>
          {/* Title */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              Image title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={120}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
              style={{
                border: '1.5px solid var(--border-default)',
                background: 'var(--surface-2)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--action-primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border-default)')}
            />
          </div>

          {/* Category */}
          <div className="mb-5">
            <p className="mb-2 text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Category</p>
            <CategoryButtons
              categories={categories}
              selected={categoryId}
              onSelect={setCategoryId}
              fullCategoryIds={fullCategoryIds}
            />
          </div>

          {error && (
            <div className="mb-3 rounded-lg px-3 py-2 text-[13px]" style={{ background: 'var(--status-error-bg)', color: 'var(--status-error-text)' }}>
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-[14px] font-semibold"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)', background: 'transparent' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges || !title.trim()}
              className="rounded-lg px-4 py-2 text-[14px] font-bold text-white transition-opacity"
              style={{
                background: 'var(--action-primary)',
                opacity: saving || !hasChanges || !title.trim() ? 0.5 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Withdraw-during-judging dialog ───────────────────────────────────────────

function WithdrawJudgingDialog({
  imageTitle,
  onCancel,
  onConfirm,
  working,
}: {
  imageTitle: string
  onCancel: () => void
  onConfirm: () => void
  working: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-[1500] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(3px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="mb-1 text-[17px] font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
          Withdraw during judging?
        </h3>
        <p className="mb-1 text-[13px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
          &ldquo;{imageTitle}&rdquo;
        </p>
        <p className="mb-5 mt-3 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Judging is currently in progress for this competition.
          Withdrawing now will remove your image from consideration.
          Your judge may have already scored this image — the score will be discarded.
          This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 text-[14px] font-semibold"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)', background: 'transparent' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={working}
            className="rounded-lg px-4 py-2 text-[14px] font-bold text-white"
            style={{ background: 'var(--status-error)', opacity: working ? 0.6 : 1 }}
          >
            {working ? 'Withdrawing…' : 'Withdraw entry'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Open competition photo card ──────────────────────────────────────────────

function OpenPhotoCard({
  submission,
  categories,
  fullCategoryIds,
  onOpenLightbox,
  onWithdraw,
  onEdited,
}: {
  submission: Submission
  categories: Category[]
  fullCategoryIds: string[]
  onOpenLightbox: () => void
  onWithdraw: (id: string) => Promise<void>
  onEdited: (newTitle: string, newCategoryId: string, newCategoryName: string) => void
}) {
  const [mode, setMode] = useState<'idle' | 'confirm-withdraw' | 'editing'>('idle')
  const [working, setWorking] = useState(false)

  async function doWithdraw() {
    setWorking(true)
    await onWithdraw(submission.id)
    setWorking(false)
  }

  return (
    <>
      <div
        className="overflow-hidden rounded-[10px]"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}
      >
        {/* Clickable image */}
        <button
          type="button"
          onClick={onOpenLightbox}
          className="group relative block w-full overflow-hidden"
          style={{ paddingTop: '68%' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={submission.publicUrl}
            alt={submission.imageTitle}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            style={{ background: 'rgba(0,0,0,0.28)' }}
          >
            <span className="rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ background: 'rgba(0,0,0,0.50)' }}>
              View
            </span>
          </div>
          <span
            className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ background: 'rgba(0,0,0,0.65)' }}
          >
            {submission.categoryName}
          </span>
        </button>

        {/* Title */}
        <div className="px-2.5 pt-2">
          <p
            className="overflow-hidden text-[12px] font-semibold leading-snug"
            style={{
              color: 'var(--text-primary)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              minHeight: '2.4em',
            }}
          >
            {submission.imageTitle}
          </p>
        </div>

        {/* Badge + icons on same row */}
        {mode === 'idle' && (
          <div className="flex items-center justify-between px-2.5 pb-2.5 pt-1">
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.03em]"
              style={{ background: 'var(--status-success-bg)', color: 'var(--status-success-text)' }}
            >
              Submitted
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                title="Edit title or category"
                onClick={() => setMode('editing')}
                className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--action-primary)')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)')}
              >
                <IconPencil />
              </button>
              <button
                type="button"
                title="Remove entry"
                onClick={() => setMode('confirm-withdraw')}
                className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--status-error)')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)')}
              >
                <IconTrash />
              </button>
            </div>
          </div>
        )}

        {/* Withdraw confirm */}
        {mode === 'confirm-withdraw' && (
          <div
            className="mx-2.5 mb-2.5 mt-1.5 rounded-lg p-3 text-[12px]"
            style={{ background: 'var(--status-error-bg)', border: '1px solid rgba(211,47,47,0.3)' }}
          >
            <p className="leading-snug" style={{ color: 'var(--status-error-text)' }}>
              Remove this entry? The slot will become available again.
            </p>
            <div className="mt-2.5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMode('idle')}
                className="rounded px-2.5 py-1 text-[12px] font-semibold"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={doWithdraw}
                disabled={working}
                className="rounded px-2.5 py-1 text-[12px] font-bold text-white"
                style={{ background: 'var(--status-error)', opacity: working ? 0.6 : 1 }}
              >
                {working ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit dialog */}
      {mode === 'editing' && (
        <EditEntryDialog
          submission={submission}
          categories={categories}
          fullCategoryIds={fullCategoryIds}
          onClose={() => setMode('idle')}
          onSaved={(newTitle, newCategoryId, newCategoryName) => {
            setMode('idle')
            onEdited(newTitle, newCategoryId, newCategoryName)
          }}
        />
      )}
    </>
  )
}

// ─── Category count indicator ─────────────────────────────────────────────────

function CategoryIndicator({
  categories,
  byCat,
  categoryLimit,
}: {
  categories: Category[]
  byCat: CategoryStat[]
  categoryLimit: number | null
}) {
  if (categories.length === 0) return null

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {categories.map(cat => {
        const stat = byCat.find(c => c.name === cat.name)
        const count = stat?.count ?? 0
        const isFull = categoryLimit !== null && count >= categoryLimit
        const isEmpty = count === 0

        let bg: string, border: string, textColor: string, badgeBg: string, badgeColor: string
        if (isFull) {
          bg = 'rgba(211,47,47,0.07)'
          border = 'rgba(211,47,47,0.30)'
          textColor = 'var(--status-error-text)'
          badgeBg = 'var(--status-error)'
          badgeColor = '#fff'
        } else if (isEmpty) {
          bg = 'var(--surface-2)'
          border = 'var(--border-subtle)'
          textColor = 'var(--text-disabled)'
          badgeBg = 'var(--border-default)'
          badgeColor = 'var(--text-disabled)'
        } else {
          bg = 'rgba(26,111,196,0.07)'
          border = 'rgba(26,111,196,0.25)'
          textColor = 'var(--action-primary)'
          badgeBg = 'var(--action-primary)'
          badgeColor = '#fff'
        }

        return (
          <div
            key={cat.id}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: bg, border: `1px solid ${border}`, color: textColor }}
          >
            <span>{cat.name}</span>
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
              style={{ background: badgeBg, color: badgeColor, minWidth: 18, textAlign: 'center' as const }}
            >
              {count}
            </span>
            {isFull && (
              <span className="text-[10px] font-bold uppercase tracking-wide">Full</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Add entry slot ───────────────────────────────────────────────────────────

function AddEntrySlot({ onClick, minHeight = 155 }: { onClick: () => void; minHeight?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed opacity-60 transition-opacity hover:opacity-90"
      style={{ borderColor: 'var(--border-default)', minHeight }}
    >
      <div style={{ color: 'var(--text-tertiary)' }}><IconPlus /></div>
      <span className="text-[12px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>Submit an image</span>
    </button>
  )
}

// ─── Open competition card ────────────────────────────────────────────────────

function OpenCompetitionCard({
  competition,
  submissions,
  fullCategoryIds,
  clubStats,
  onSubmitClick,
  onWithdraw,
  onEdited,
}: {
  competition: CurrentCompetition
  submissions: Submission[]
  fullCategoryIds: string[]
  clubStats: ClubStats
  onSubmitClick: () => void
  onWithdraw: (id: string) => Promise<void>
  onEdited: (submissionId: string, newTitle: string, newCategoryId: string, newCategoryName: string) => void
}) {
  const phase = getPhase(competition.closes_at, competition.status)
  const days = daysLeft(competition.closes_at)
  const atLimit = submissions.length >= competition.submission_limit
  const canSubmit = !atLimit
  const maxBar = Math.max(...clubStats.byCat.map(c => c.count), 1)

  const total = submissions.length + (canSubmit ? 1 : 0)

  const [lightboxId, setLightboxId] = useState<string | null>(null)

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: 14,
        border: '1px solid var(--border-default)',
        background: 'var(--surface-1)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      }}
    >
      {/* Header */}
      <div
        className="flex flex-wrap items-start justify-between gap-4"
        style={{
          padding: '24px 28px 20px',
          borderBottom: '1px solid var(--border-default)',
          borderLeft: `3px solid ${phaseBorder(phase)}`,
          background: phaseTint(phase),
        }}
      >
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--text-tertiary)' }}>
            Current Competition
          </p>
          <h2
            className="text-[26px] font-bold tracking-[-0.02em] leading-tight"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
          >
            {competition.title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
            {phase === 'judging' ? (
              <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <IconClock />
                <strong style={{ color: 'var(--text-primary)' }}>Submissions Closed</strong>
              </div>
            ) : competition.closes_at ? (
              <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <IconClock />
                {phase === 'warning' && days !== null ? (
                  <span>
                    {formatDate(competition.closes_at, { month: 'long', day: 'numeric', year: 'numeric' })} ·{' '}
                    <span style={{ color: '#D44F00', fontWeight: 700 }}>{days} day{days !== 1 ? 's' : ''} left</span>
                  </span>
                ) : (
                  <span>
                    Submissions close{' '}
                    <strong>{formatDate(competition.closes_at, { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                  </span>
                )}
              </div>
            ) : null}
            {competition.judgeName && (
              <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <IconUsers />
                Judge <strong>{competition.judgeName}</strong>
              </div>
            )}
            {phase === 'judging' && competition.results_at && (
              <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Results Revealed: <strong>{formatDate(competition.results_at, { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2.5">
          <PhasePill phase={phase} />
          {canSubmit && phase !== 'judging' && (
            <button
              type="button"
              onClick={onSubmitClick}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors"
              style={{ background: 'var(--action-primary)' }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--action-primary-hover)')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--action-primary)')}
            >
              <IconUpload />
              Submit an image
            </button>
          )}
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px' }}>
        {/* My Submissions */}
        <div style={{ padding: '22px 28px', borderRight: '1px solid var(--border-default)' }}>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--text-tertiary)' }}>
              My Submissions
            </p>
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {submissions.length} of {competition.submission_limit} max
            </p>
          </div>

          {submissions.length === 0 ? (
            phase === 'judging' ? (
              <div className="flex flex-col items-center py-10 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/submissions-closed.svg"
                  alt=""
                  width={420}
                  className="mb-5 opacity-70 dark:invert"
                />
                <p className="text-[17px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Sorry, the submission window for this competition has closed.
                </p>
                <p className="mt-2 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                  Looking forward to seeing what you submit in the next competition!
                </p>
              </div>
            ) : (
            <div className="flex flex-col items-center pb-8 pt-2 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/no-submissions.svg"
                alt=""
                width={520}
                className="mb-5 opacity-70 dark:invert"
              />
              <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                Don&apos;t leave the judge waiting!
              </p>
              <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                You haven&apos;t entered this competition yet — add your images before the deadline closes.
              </p>
              <div className="mt-4" style={{ width: 160 }}>
                <AddEntrySlot onClick={onSubmitClick} minHeight={78} />
              </div>
            </div>
            )
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 10,
                }}
              >
                {submissions.map(sub => (
                  <OpenPhotoCard
                    key={sub.id}
                    submission={sub}
                    categories={competition.categories}
                    fullCategoryIds={fullCategoryIds}
                    onOpenLightbox={() => setLightboxId(sub.id)}
                    onWithdraw={onWithdraw}
                    onEdited={(newTitle, newCategoryId, newCategoryName) =>
                      onEdited(sub.id, newTitle, newCategoryId, newCategoryName)
                    }
                  />
                ))}
                {canSubmit && <AddEntrySlot onClick={onSubmitClick} />}
              </div>

              <CategoryIndicator
                categories={competition.categories}
                byCat={clubStats.byCat}
                categoryLimit={competition.categoryLimit}
              />
            </>
          )}
        </div>

        {/* Club Stats */}
        <div style={{ padding: '22px 24px' }}>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--text-tertiary)' }}>
            Club Stats
          </p>

          <div
            className="mb-5 grid grid-cols-2"
            style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 20 }}
          >
            {[
              { value: clubStats.totalImages, label: 'total images' },
              { value: clubStats.membersEntered, label: 'members entered' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{ borderLeft: i > 0 ? '1px solid var(--border-subtle)' : undefined, paddingLeft: i > 0 ? 16 : 0 }}
              >
                <p
                  className="text-[38px] font-bold leading-none"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {competition.categories.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--text-tertiary)' }}>
                By category
              </p>
              <div className="space-y-2">
                {competition.categories.map(cat => {
                  const count = clubStats.byCat.find(c => c.name === cat.name)?.count ?? 0
                  return (
                    <div key={cat.name} className="grid items-center gap-2" style={{ gridTemplateColumns: '72px 1fr 38px' }}>
                      <p className="truncate text-right text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                        {cat.name}
                      </p>
                      <div className="h-3 overflow-hidden rounded-full" style={{ background: 'var(--surface-3, var(--surface-0))' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: maxBar > 0 ? `${(count / maxBar) * 100}%` : '0%', background: 'var(--action-primary)' }}
                        />
                      </div>
                      <p
                        className="text-center text-[13px] font-bold"
                        style={{ fontFamily: 'var(--font-heading)', color: count === 0 ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
                      >
                        {count}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {competition.closes_at && (
            <p className="mt-5 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              Deadline: {formatDate(competition.closes_at, { month: 'long', day: 'numeric', year: 'numeric' })}
              {daysLeft(competition.closes_at) !== null && daysLeft(competition.closes_at)! > 0 && (
                <> · {daysLeft(competition.closes_at)} days remaining</>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxId !== null && submissions.length > 0 && (
        <SubmissionsLightbox
          submissions={submissions}
          startId={lightboxId}
          onClose={() => setLightboxId(null)}
        />
      )}
    </div>
  )
}

// ─── Judging competition card ─────────────────────────────────────────────────

function JudgingCompetitionCard({
  competition,
  submissions,
  onWithdraw,
}: {
  competition: CurrentCompetition
  submissions: Submission[]
  onWithdraw: (id: string) => Promise<void>
}) {
  const [withdrawTarget, setWithdrawTarget] = useState<Submission | null>(null)
  const [working, setWorking] = useState(false)
  const [lightboxId, setLightboxId] = useState<string | null>(null)
  const { clubStats } = competition

  async function confirmWithdraw() {
    if (!withdrawTarget) return
    setWorking(true)
    await onWithdraw(withdrawTarget.id)
    setWorking(false)
    setWithdrawTarget(null)
  }

  return (
    <>
      <div
        className="overflow-hidden"
        style={{
          borderRadius: 14,
          border: '1px solid var(--border-default)',
          background: 'var(--surface-1)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        {/* Header */}
        <div
          className="flex flex-wrap items-center justify-between gap-3"
          style={{
            padding: '16px 28px',
            borderBottom: '1px solid var(--border-default)',
            background: 'rgba(0,0,0,0.02)',
          }}
        >
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--text-tertiary)' }}>
              Current Competition
            </p>
            <h2
              className="text-[22px] font-bold tracking-[-0.015em] leading-tight"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
            >
              {competition.title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1">
              <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <IconClock />
                <strong style={{ color: 'var(--text-primary)' }}>Submissions Closed</strong>
              </div>
              {competition.judgeName && (
                <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <IconUsers />
                  Judge <strong>{competition.judgeName}</strong>
                </div>
              )}
              {competition.results_at && (
                <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Results Revealed: <strong>{formatDate(competition.results_at, { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                </div>
              )}
            </div>
          </div>
          <PhasePill phase="judging" />
        </div>

        {/* Two-column body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px' }}>
          {/* My Entries */}
          <div style={{ padding: '22px 28px', borderRight: '1px solid var(--border-default)' }}>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--text-tertiary)' }}>
              My Entries
            </p>
            {submissions.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
                {submissions.map(sub => (
                  <div key={sub.id} className="shrink-0" style={{ width: 148 }}>
                    <button
                      type="button"
                      onClick={() => setLightboxId(sub.id)}
                      className="group relative block w-full overflow-hidden rounded-[8px]"
                      style={{ paddingTop: '72%' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sub.publicUrl}
                        alt={sub.imageTitle}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.04]"
                      />
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ background: 'rgba(0,0,0,0.25)' }}
                      >
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: 'rgba(0,0,0,0.50)' }}>
                          View
                        </span>
                      </div>
                      <span
                        className="absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white"
                        style={{ background: 'rgba(0,0,0,0.65)' }}
                      >
                        {sub.categoryName}
                      </span>
                    </button>
                    <p className="mt-1.5 truncate text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {sub.imageTitle}
                    </p>
                    <button
                      type="button"
                      onClick={() => setWithdrawTarget(sub)}
                      className="mt-1 text-[11px] font-medium underline-offset-2 hover:underline"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      Withdraw
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                You did not enter this competition.
              </p>
            )}
          </div>

          {/* Club Totals */}
          <div style={{ padding: '22px 24px' }}>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--text-tertiary)' }}>
              Club Totals
            </p>

            <div
              className="mb-5 grid grid-cols-2"
              style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 20 }}
            >
              {[
                { value: clubStats.totalImages, label: 'total images' },
                { value: clubStats.membersEntered, label: 'members entered' },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  style={{ borderLeft: i > 0 ? '1px solid var(--border-subtle)' : undefined, paddingLeft: i > 0 ? 16 : 0 }}
                >
                  <p
                    className="text-[28px] font-bold leading-none"
                    style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {withdrawTarget && (
        <WithdrawJudgingDialog
          imageTitle={withdrawTarget.imageTitle}
          onCancel={() => setWithdrawTarget(null)}
          onConfirm={confirmWithdraw}
          working={working}
        />
      )}

      {lightboxId !== null && submissions.length > 0 && (
        <SubmissionsLightbox
          submissions={submissions}
          startId={lightboxId}
          onClose={() => setLightboxId(null)}
        />
      )}
    </>
  )
}

// ─── Previous competitions ────────────────────────────────────────────────────

function PreviousCompetitionsBlock({ competitions }: { competitions: PreviousCompetition[] }) {
  return (
    <div
      className="overflow-hidden"
      style={{ borderRadius: 14, border: '1px solid var(--border-default)', background: 'var(--surface-1)' }}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: '1fr 90px 120px 130px',
          padding: '10px 22px',
          borderBottom: '1px solid var(--border-default)',
          background: 'var(--surface-2)',
        }}
      >
        {['Competition', 'Images', 'Judge', ''].map(h => (
          <p key={h} className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--text-tertiary)' }}>
            {h}
          </p>
        ))}
      </div>
      {competitions.length === 0 ? (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
          No past competitions yet.
        </div>
      ) : (
        competitions.map((comp, i) => (
          <div
            key={comp.id}
            className="grid items-center"
            style={{
              gridTemplateColumns: '1fr 90px 120px 130px',
              padding: '13px 22px',
              borderBottom: i < competitions.length - 1 ? '1px solid var(--border-subtle)' : undefined,
            }}
          >
            <div>
              <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>{comp.title}</p>
              {comp.closes_at && (
                <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  {formatDate(comp.closes_at, { month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
            <p className="text-[15px] font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              {comp.imageCount}
            </p>
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{comp.judgeName ?? '—'}</p>
            <div>
              <Link
                href={`/competitions/results/${comp.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold"
                style={{ borderColor: 'var(--border-default)', color: 'var(--action-primary)', background: 'transparent' }}
              >
                Results <IconChevronRight />
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ─── No competition ───────────────────────────────────────────────────────────

function NoCompetition() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" style={{ color: 'var(--text-tertiary)' }}>
      <IconTrophy />
      <p className="mt-4 text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>No competitions open right now.</p>
      <p className="mt-1 text-sm">Keep your camera ready — the next one is coming.</p>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function CompetitionsClient({
  userId, currentCompetitions, previousCompetitions, libraryImages,
}: Props) {
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, Submission[]>>(
    () => Object.fromEntries(currentCompetitions.map(c => [c.id, c.mySubmissions]))
  )
  const [modalCompId, setModalCompId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setSubmissionsMap(Object.fromEntries(currentCompetitions.map(c => [c.id, c.mySubmissions])))
  }, [currentCompetitions])

  async function handleWithdraw(submissionId: string, competitionId: string) {
    const { error } = await withdrawFromCompetition(submissionId)
    if (!error) {
      setSubmissionsMap(prev => ({
        ...prev,
        [competitionId]: (prev[competitionId] ?? []).filter(s => s.id !== submissionId),
      }))
      router.refresh()
    }
  }

  function handleEdited(
    submissionId: string,
    competitionId: string,
    newTitle: string,
    newCategoryId: string,
    newCategoryName: string,
  ) {
    setSubmissionsMap(prev => ({
      ...prev,
      [competitionId]: (prev[competitionId] ?? []).map(s =>
        s.id === submissionId
          ? { ...s, imageTitle: newTitle, categoryId: newCategoryId, categoryName: newCategoryName }
          : s
      ),
    }))
    router.refresh()
  }

  const modalCompetition = currentCompetitions.find(c => c.id === modalCompId) ?? null
  const modalFullCategoryIds = modalCompetition ? getFullCategoryIds(modalCompetition) : []

  return (
    <div style={{ paddingBottom: 48 }}>
      <h1
        className="mb-6 text-[28px] font-bold tracking-[-0.02em]"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginTop: 0 }}
      >
        Competitions
      </h1>

      <div className="space-y-8">
        {/* Current */}
        <div>
          {currentCompetitions.length === 0 ? (
            <NoCompetition />
          ) : (
            <div className="space-y-6">
              {currentCompetitions.map(comp => {
                const fullCategoryIds = getFullCategoryIds(comp)
                return comp.status === 'open' ? (
                  <OpenCompetitionCard
                    key={comp.id}
                    competition={comp}
                    submissions={submissionsMap[comp.id] ?? []}
                    fullCategoryIds={fullCategoryIds}
                    clubStats={comp.clubStats}
                    onSubmitClick={() => setModalCompId(comp.id)}
                    onWithdraw={id => handleWithdraw(id, comp.id)}
                    onEdited={(subId, newTitle, newCategoryId, newCategoryName) =>
                      handleEdited(subId, comp.id, newTitle, newCategoryId, newCategoryName)
                    }
                  />
                ) : (
                  <JudgingCompetitionCard
                    key={comp.id}
                    competition={comp}
                    submissions={submissionsMap[comp.id] ?? []}
                    onWithdraw={id => handleWithdraw(id, comp.id)}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Previous — only shown when there are closed competitions with results ready */}
        {previousCompetitions.length > 0 && (
          <div>
            <h2 className="mb-4 text-[15px] font-bold tracking-[0.05em]" style={{ color: 'var(--text-primary)' }}>
              Previous Competitions
            </h2>
            <PreviousCompetitionsBlock competitions={previousCompetitions} />
          </div>
        )}
      </div>

      {/* Submit modal */}
      {modalCompetition && (
        <SubmitModal
          open={modalCompId !== null}
          onClose={() => setModalCompId(null)}
          onSuccess={() => router.refresh()}
          userId={userId}
          competitionId={modalCompetition.id}
          competitionTitle={modalCompetition.title}
          categories={modalCompetition.categories}
          libraryImages={libraryImages}
          fullCategoryIds={modalFullCategoryIds}
        />
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import Dialog       from '@mui/material/Dialog'
import Tabs         from '@mui/material/Tabs'
import Tab          from '@mui/material/Tab'
import FormControl  from '@mui/material/FormControl'
import Select       from '@mui/material/Select'
import MenuItem     from '@mui/material/MenuItem'
import Slider       from '@mui/material/Slider'
import Button       from '@mui/material/Button'
import IconButton   from '@mui/material/IconButton'
import type { MemberRow } from './page'
import type { ProfileData, HistoryEntry } from '@/app/[clubSlug]/(member)/profile/page'
import { getMemberPublicProfile } from './actions'
import type { MemberGallery } from './actions'
import { avatarGradient as getAvatarGradient, avatarInitials } from '@/lib/avatar'
import { skillLabel, skillFull } from '@/lib/profile-options'

// ─── Shared helpers ───────────────────────────────────────────────────────────

function fmtSince(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function AvatarOrInitials({ avatarUrl, name, size, fontSize }: { avatarUrl: string | null; name: string; size: number; fontSize: number }) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-default)', display: 'block' }} />
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: getAvatarGradient(name), display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-default)', flexShrink: 0, userSelect: 'none' }}>
      <span style={{ fontSize, fontWeight: 600, color: 'white', lineHeight: 1 }}>{avatarInitials(name)}</span>
    </div>
  )
}

function getAwardStyle(label: string | null) {
  if (!label) return null
  const l = label.toLowerCase()
  if (l.includes('first') || l.includes('gold') || l.includes('1st') || l.includes('best'))
    return { bg: 'color-mix(in srgb, var(--spot-gold) 18%, transparent)', color: 'var(--spot-gold)' }
  if (l.includes('second') || l.includes('silver') || l.includes('2nd'))
    return { bg: 'color-mix(in srgb, var(--text-secondary) 15%, transparent)', color: 'var(--text-secondary)' }
  if (l.includes('third') || l.includes('bronze') || l.includes('3rd') || l.includes('highly'))
    return { bg: 'color-mix(in srgb, var(--spot-teal) 14%, transparent)', color: 'var(--spot-teal)' }
  return { bg: 'color-mix(in srgb, var(--spot-green) 14%, transparent)', color: 'var(--spot-green)' }
}

function CloseIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

const ENTRIES_PER_PAGE = 15

// ─── Read-only profile body ───────────────────────────────────────────────────

function ProfileBody({
  profile,
  historyEntries,
  clubSlug,
  memberId,
  galleries,
}: {
  profile:        ProfileData
  historyEntries: HistoryEntry[]
  clubSlug:       string
  memberId:       string
  galleries:      MemberGallery[]
}) {
  const [lightbox,    setLightbox]    = useState<HistoryEntry | null>(null)
  const [activeSeason, setActiveSeason] = useState<number>(() => {
    const years = historyEntries.map(e => e.seasonYear)
    return years.length ? Math.max(...years) : new Date().getFullYear()
  })
  const [filterCat,  setFilterCat]  = useState('')
  const [minScore,   setMinScore]   = useState(0)
  const [historyPage, setHistoryPage] = useState(1)

  const serifFont   = 'var(--font-heading)'
  const accentColor = 'var(--action-primary)'
  const borderColor = 'var(--border-default)'
  const surfaceColor = 'var(--surface-1)'

  const scoredEntries = historyEntries.filter(e => e.score !== null)

  const stats = {
    entered:   new Set(historyEntries.map(e => e.competitionId)).size,
    submitted: historyEntries.length,
    awards:    historyEntries.filter(e => e.awardId).length,
    bestScore: scoredEntries.length ? Math.max(...scoredEntries.map(e => e.score ?? 0)) : null,
  }

  const seasons       = [...new Set(historyEntries.map(e => e.seasonYear))].sort((a, b) => b - a)
  const seasonEntries = historyEntries.filter(e => e.seasonYear === activeSeason)
  const allCategories = [...new Set(historyEntries.map(e => e.categoryName).filter(Boolean))]
  const filtered      = seasonEntries.filter(e => (!filterCat || e.categoryName === filterCat) && (!minScore || (e.score ?? 0) >= minScore))
  const totalPages    = Math.max(1, Math.ceil(filtered.length / ENTRIES_PER_PAGE))
  const pageEntries   = filtered.slice((historyPage - 1) * ENTRIES_PER_PAGE, historyPage * ENTRIES_PER_PAGE)

  return (
    <>
      {/* Image lightbox */}
      <Dialog open={!!lightbox} onClose={() => setLightbox(null)} maxWidth="lg" fullWidth slotProps={{ paper: { sx: { background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 2, overflow: 'hidden' } } }}>
        {lightbox && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px' }}>
            <div style={{ background: 'black', display: 'flex', alignItems: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightbox.imageUrl} alt={lightbox.imageTitle} style={{ width: '100%', maxHeight: 580, objectFit: 'contain', display: 'block' }} />
            </div>
            <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton size="small" onClick={() => setLightbox(null)}><CloseIcon /></IconButton>
              </div>
              <p style={{ fontFamily: serifFont, fontSize: 22, fontWeight: 400, color: 'var(--text-primary)' }}>{lightbox.imageTitle}</p>
              {lightbox.score !== null && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Score</p>
                  <p style={{ fontFamily: serifFont, fontSize: 56, fontWeight: 300, color: accentColor, lineHeight: 1 }}>{lightbox.score}</p>
                </div>
              )}
              {lightbox.awardLabel && (() => { const s = getAwardStyle(lightbox.awardLabel); return s ? <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 4, background: s.bg, color: s.color, fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', alignSelf: 'flex-start' }}>{lightbox.awardLabel}</span> : null })()}
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Competition</p>
                <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>{lightbox.competitionTitle}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Category</p>
                <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>{lightbox.categoryName}</p>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'clamp(80px,100px,100px) 1fr', gap: 28, alignItems: 'start', paddingBottom: 32, marginBottom: 28, borderBottom: `1px solid ${borderColor}` }}>
        <AvatarOrInitials avatarUrl={profile.avatar_url} name={profile.display_name} size={100} fontSize={32} />
        <div style={{ paddingTop: 4 }}>
          <h2 style={{ fontFamily: serifFont, fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: 8 }}>
            {profile.display_name}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Member since {fmtSince(profile.created_at)}</span>
            {skillLabel(profile.experience_level) && (
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '3px 10px', borderRadius: 20, background: 'color-mix(in srgb, var(--action-primary) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--action-primary) 30%, transparent)', color: accentColor }}>
                {skillLabel(profile.experience_level)}
              </span>
            )}
          </div>
          {profile.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{profile.location}</span>
            </div>
          )}
          {profile.membership_class && <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{profile.membership_class}</p>}
        </div>
      </div>

      {/* About card */}
      <div style={{ background: surfaceColor, border: `1px solid ${borderColor}`, borderRadius: 12, padding: 28, marginBottom: 40 }}>
        <h3 style={{ fontFamily: serifFont, fontSize: 20, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 16 }}>About</h3>

        {profile.bio && (
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 20px', padding: '10px 0', borderBottom: `1px solid ${borderColor}`, alignItems: 'start' }}>
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', paddingTop: 2 }}>Bio</span>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>{profile.bio}</p>
          </div>
        )}

        {profile.experience_level && (
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 20px', padding: '10px 0', borderBottom: (profile.shooting_interests.length > 0 || profile.camera_brands.length > 0) ? `1px solid ${borderColor}` : 'none', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>Experience</span>
            <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>{skillFull(profile.experience_level)}</p>
          </div>
        )}

        {profile.shooting_interests.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 20px', padding: '10px 0', borderBottom: profile.camera_brands.length > 0 ? `1px solid ${borderColor}` : 'none', alignItems: 'start' }}>
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', paddingTop: 4 }}>Interests</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {profile.shooting_interests.map(i => (
                <span key={i} style={{ fontSize: 13, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: 'color-mix(in srgb, var(--action-primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--action-primary) 25%, transparent)', color: accentColor }}>{i}</span>
              ))}
            </div>
          </div>
        )}

        {profile.camera_brands.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 20px', padding: '10px 0', alignItems: 'start' }}>
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', paddingTop: 4 }}>Cameras</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {profile.camera_brands.map(c => (
                <span key={c} style={{ fontSize: 13, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: 'var(--surface-2)', border: `1px solid ${borderColor}`, color: 'var(--text-secondary)' }}>{c}</span>
              ))}
            </div>
          </div>
        )}

        {!profile.bio && !profile.experience_level && profile.shooting_interests.length === 0 && profile.camera_brands.length === 0 && (
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>This member hasn't filled out their profile yet.</p>
        )}
      </div>

      {/* Galleries */}
      {galleries.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontFamily: serifFont, fontSize: 24, fontWeight: 400, color: accentColor, marginBottom: 16 }}>Galleries</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {galleries.map(gallery => (
              <div key={gallery.id} style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--surface-1)', border: '1px solid var(--border-default)' }}>
                <a
                  href={`/${clubSlug}/gallery/${memberId}/${gallery.slug}`}
                  style={{ display: 'block', aspectRatio: '4/3', overflow: 'hidden' }}
                >
                  {gallery.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={gallery.coverImageUrl}
                      alt={gallery.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.25s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-0)' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>No images yet</span>
                    </div>
                  )}
                </a>
                <div style={{ padding: 12 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{gallery.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                    {gallery.imageCount} photo{gallery.imageCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {historyEntries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 40 }}>
          {[
            { label: 'Competitions entered', value: stats.entered },
            { label: 'Images submitted',     value: stats.submitted },
            { label: 'Awards won',           value: stats.awards },
            { label: 'Best score',           value: stats.bestScore ?? '—' },
          ].map(s => (
            <div key={s.label} style={{ background: surfaceColor, border: `1px solid ${borderColor}`, borderRadius: 10, padding: '18px 14px', textAlign: 'center' }}>
              <p style={{ fontFamily: serifFont, fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 300, color: accentColor, lineHeight: 1, marginBottom: 6 }}>{s.value}</p>
              <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Competition history */}
      {seasons.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontFamily: serifFont, fontSize: 24, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 16 }}>Competition History</h3>
          <Tabs value={activeSeason} onChange={(_, v) => { setActiveSeason(v); setHistoryPage(1); setFilterCat(''); setMinScore(0) }} sx={{ borderBottom: `1px solid ${borderColor}`, mb: 2.5, '& .MuiTabs-indicator': { background: accentColor } }}>
            {seasons.map(yr => {
              const count = historyEntries.filter(e => e.seasonYear === yr).length
              return (
                <Tab key={yr} value={yr} label={<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{yr}<span style={{ fontSize: 11, background: 'var(--surface-2)', border: `1px solid ${borderColor}`, borderRadius: 10, padding: '1px 6px', color: 'var(--text-secondary)' }}>{count}</span></span>} sx={{ fontSize: 14, fontFamily: 'inherit', textTransform: 'none', color: 'var(--text-secondary)', '&.Mui-selected': { color: accentColor } }} />
              )
            })}
          </Tabs>

          {allCategories.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select value={filterCat} onChange={e => { setFilterCat(e.target.value); setHistoryPage(1) }} displayEmpty sx={{ fontSize: 14, bgcolor: surfaceColor }}>
                  <MenuItem value="">All categories</MenuItem>
                  {allCategories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              {scoredEntries.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 200 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Min score: {minScore || 'any'}</span>
                  <Slider value={minScore} onChange={(_, v) => { setMinScore(v as number); setHistoryPage(1) }} min={0} max={10} step={1} size="small" sx={{ color: accentColor, width: 100 }} />
                </div>
              )}
              {(filterCat || minScore > 0) && (
                <button onClick={() => { setFilterCat(''); setMinScore(0); setHistoryPage(1) }} style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>
              )}
            </div>
          )}

          {pageEntries.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', padding: '28px 0', textAlign: 'center' }}>No entries match your filters.</p>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 1fr 72px 130px', gap: 14, padding: '6px 0', marginBottom: 2 }}>
                <div /><span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)' }}>Image</span>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)' }}>Competition</span>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', textAlign: 'right' }}>Score</span>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', textAlign: 'right' }}>Award</span>
              </div>
              {pageEntries.map(entry => (
                <div key={entry.submissionId} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 1fr 72px 130px', gap: 14, alignItems: 'center', padding: '10px 0', borderTop: `1px solid ${borderColor}` }}>
                  <div onClick={() => setLightbox(entry)} style={{ width: 50, height: 36, borderRadius: 4, overflow: 'hidden', background: 'var(--surface-2)', cursor: 'pointer', flexShrink: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={entry.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.imageTitle}</p>
                  <div>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.competitionTitle}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{entry.categoryName}</p>
                  </div>
                  <p style={{ fontFamily: serifFont, fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', textAlign: 'right' }}>{entry.score ?? '—'}</p>
                  <div style={{ textAlign: 'right' }}>
                    {entry.awardLabel && (() => { const s = getAwardStyle(entry.awardLabel); return s ? <span style={{ display: 'inline-block', fontSize: 12, padding: '2px 8px', borderRadius: 3, background: s.bg, color: s.color, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{entry.awardLabel}</span> : null })()}
                  </div>
                </div>
              ))}
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 20 }}>
                  <Button variant="outlined" color="secondary" size="small" disabled={historyPage <= 1} onClick={() => setHistoryPage(p => p - 1)}>← Prev</Button>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Page {historyPage} of {totalPages}</span>
                  <Button variant="outlined" color="secondary" size="small" disabled={historyPage >= totalPages} onClick={() => setHistoryPage(p => p + 1)}>Next →</Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface MemberProfileModalProps {
  members:  MemberRow[]
  index:    number
  onClose:  () => void
  onNav:    (i: number) => void
  clubSlug: string
}

export default function MemberProfileModal({ members, index, onClose, onNav, clubSlug }: MemberProfileModalProps) {
  const member = members[index]
  const [profile,   setProfile]   = useState<ProfileData | null>(null)
  const [history,   setHistory]   = useState<HistoryEntry[]>([])
  const [galleries, setGalleries] = useState<MemberGallery[]>([])
  const [loading,   setLoading]   = useState(true)

  // Fetch on mount and whenever the displayed member changes
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setProfile(null)
    setHistory([])
    setGalleries([])
    getMemberPublicProfile(member.id).then(({ profile, historyEntries, galleries }) => {
      if (cancelled) return
      setProfile(profile)
      setHistory(historyEntries)
      setGalleries(galleries)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [member.id])

  // Keyboard nav
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape')      onClose()
    if (e.key === 'ArrowLeft'  && index > 0)                  onNav(index - 1)
    if (e.key === 'ArrowRight' && index < members.length - 1) onNav(index + 1)
  }, [index, members.length, onClose, onNav])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // Lock body scroll
  useEffect(() => {
    const sb = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (sb > 0) document.body.style.paddingRight = `${sb}px`
    return () => { document.body.style.overflow = ''; document.body.style.paddingRight = '' }
  }, [])

  return (
    // Backdrop — overflow-hidden so the page never scrolls behind it
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden px-4 py-10"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      {/* Panel — flex-column with capped height; content scrolls inside */}
      <div
        className="relative flex w-full max-w-3xl flex-col rounded-2xl shadow-2xl"
        style={{
          background:  'var(--surface-2)',
          border:      '1px solid var(--border-default)',
          maxHeight:   '88vh',
          minHeight:   280,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
          style={{ background: 'var(--surface-1)', color: 'var(--text-secondary)' }}
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        {/* Scrollable content area — grows to fill available height */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 0', minHeight: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
              Loading…
            </div>
          ) : profile ? (
            <ProfileBody profile={profile} historyEntries={history} clubSlug={clubSlug} memberId={member.id} galleries={galleries} />
          ) : (
            <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
              Profile not available.
            </div>
          )}
        </div>

        {/* Footer nav — always pinned at the bottom of the panel */}
        <div
          className="flex flex-shrink-0 items-center justify-between rounded-b-2xl px-6 py-4"
          style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--border-subtle)' }}
        >
          <button
            onClick={() => onNav(index - 1)}
            disabled={index === 0}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: 'var(--text-secondary)', background: index === 0 ? 'transparent' : 'var(--surface-1)' }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Previous
          </button>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {index + 1} of {members.length}
          </span>
          <button
            onClick={() => onNav(index + 1)}
            disabled={index === members.length - 1}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: 'var(--text-secondary)', background: index === members.length - 1 ? 'transparent' : 'var(--surface-1)' }}
          >
            Next
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

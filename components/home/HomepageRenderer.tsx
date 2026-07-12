import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import HeroSlideshow, { type Slide } from './HeroSlideshow'
import CustomContentNote from './CustomContentNote'
import { Grid8Gallery, Strip8Gallery, SpotlightImageLightbox, type GalleryImage } from './ImageGallery'
import CompetitionsBlock from './CompetitionsBlock'
import DualPanelBlock from './DualPanelBlock'
import DualPanelEvents from './DualPanelEvents'
import type {
  ContentBlock,
  ContentNote,
  CustomContentSettings,
  AffiliationsSettings,
  SpotlightSettings,
  GalleryPreviewSettings,
  ClubGalleriesSettings,
} from '@/lib/homepage/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

const tintedBox: React.CSSProperties = {
  background:   'var(--surface-1)',
  borderRadius: 14,
  padding:      '20px 22px',
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`pt-11 pb-8 ${className}`}>
      {children}
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily:    'var(--font-lora, Georgia, serif)',
      fontSize:      24,
      fontWeight:    400,
      letterSpacing: '-0.01em',
      color:         'var(--text-primary)',
      marginTop:     4,
      marginBottom:  12,
      lineHeight:    1.3,
    }}>
      {children}
    </h2>
  )
}

// ─── Custom content block ─────────────────────────────────────────────────────

function CustomContentBlock({
  settings,
  label,
}: {
  settings: CustomContentSettings
  label: string
}) {
  const { notes, columns, previewLines } = settings
  const gridCols = columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'

  // When notes are empty show placeholder columns so the block is visible
  const displayNotes: ContentNote[] = notes.length > 0
    ? notes
    : Array.from({ length: columns }, (_, i) => ({
        id:      `placeholder-${i}`,
        heading: '',
        body:    '',
      }))

  const heading = (label && label !== 'Custom content') ? label : 'News & Notes'

  return (
    <Section>
      <SectionHeading>{heading}</SectionHeading>
      <div className={`grid gap-4 ${gridCols}`}>
        {displayNotes.map(note => (
          <CustomContentNote
            key={note.id}
            heading={note.heading}
            body={note.body}
            previewLines={previewLines}
          />
        ))}
      </div>
    </Section>
  )
}

// ─── Upcoming events block ────────────────────────────────────────────────────

type CalendarEvent = {
  id: string
  title: string
  starts_at: string
  ends_at: string | null
  all_day: boolean
  event_type: string
  location: string | null
}

function UpcomingEventsBlock({ events, limit }: { events: CalendarEvent[]; limit: number }) {
  return (
    <Section>
      <div className="flex items-center justify-between mb-4">
        <SectionHeading>Next {limit} events</SectionHeading>
        <Link href="/calendar" className="text-[13px] font-medium" style={{ color: 'var(--action-primary)' }}>
          View all →
        </Link>
      </div>
      <DualPanelEvents events={events} />
    </Section>
  )
}

// ─── Image grid / strip blocks ────────────────────────────────────────────────


const GALLERY_LABELS: Record<string, string> = {
  'competition-winners': 'Competition winners',
  'recent-uploads':      'Recent uploads',
  'member-picks':        'Member picks',
  'portrait':            'Portrait collection',
  'landscape':           'Landscape collection',
}

function Grid8Block({ images, block }: { images: GalleryImage[]; block: ContentBlock }) {
  const gallerySource = block.grid6Settings?.gallerySource ?? 'recent-uploads'
  const galleryName   = GALLERY_LABELS[gallerySource] ?? 'Recent uploads'

  if (images.length === 0) return (
    <Section>
      <SectionHeading>Gallery Snapshot</SectionHeading>
      <div style={tintedBox}>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic', margin: 0 }}>No images in the library yet.</p>
      </div>
    </Section>
  )

  return (
    <Section>
      <SectionHeading>Gallery Snapshot</SectionHeading>
      <div style={tintedBox}>
        <Grid8Gallery images={images} galleryName={galleryName} galleryHref="/library" totalImages={images.length} />
      </div>
    </Section>
  )
}

function Strip8Block({ images }: { images: GalleryImage[] }) {
  if (images.length === 0) return (
    <Section>
      <SectionHeading>Member photos</SectionHeading>
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No images in the library yet.</p>
    </Section>
  )

  return (
    <Section>
      <SectionHeading>Member photos</SectionHeading>
      <Strip8Gallery images={images} />
    </Section>
  )
}

// ─── Member spotlight block ───────────────────────────────────────────────────

type SpotlightMember = {
  id:                 string
  display_name:       string
  avatar_url:         string | null
  bio:                string | null
  experience_level:   string | null
  membership_class:   string | null
  member_number:      number
  camera_brands:      string[]
  shooting_interests: string[]
}

type SpotlightStats = {
  bestImageUrl:    string | null
  totalSubs:       number
  categoryCounts:  { name: string; count: number }[]
  avgScore:        number | null
  bestScore:       number | null
}

const DONUT_COLORS = [
  '#0097A7', // teal
  '#6C47D4', // purple
  '#E65100', // orange
  '#00796B', // green
  '#AD1457', // pink
  '#7B6B38', // gold
]

function DonutChart({
  segments,
  total,
  size = 88,
}: {
  segments: { name: string; count: number }[]
  total:    number
  size?:    number
}) {
  const strokeWidth = 13
  const gap  = 2.5      // gap between slices in SVG units — stays within ring bounds
  const r    = (size - strokeWidth) / 2
  const cx   = size / 2
  const cy   = size / 2
  const circ = 2 * Math.PI * r

  // Build arc segments — each dash shrunk by gap on both ends so track shows through
  let offset = 0
  const arcs = segments.map((seg, i) => {
    const fraction = total > 0 ? seg.count / total : 0
    const fullDash = fraction * circ
    const dash     = Math.max(0, fullDash - gap)
    const arc = { dash, offset: offset + gap / 2, color: DONUT_COLORS[i % DONUT_COLORS.length] }
    offset += fullDash
    return arc
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', flexShrink: 0 }}>
      {/* Track — also acts as the gap colour between slices */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={strokeWidth} />
      {/* Segments */}
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
          strokeDashoffset={-(arc.offset - circ / 4)}
        />
      ))}
      {/* Centre label */}
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        style={{ fontFamily: 'var(--font-lora, Georgia, serif)', fontSize: 20, fontWeight: 600, fill: 'var(--text-primary)' }}>
        {total}
      </text>
    </svg>
  )
}

function MemberSpotlightBlock({
  member,
  settings,
  stats,
}: {
  member:   SpotlightMember
  settings: SpotlightSettings
  stats:    SpotlightStats
}) {
  const photoUrl  = stats.bestImageUrl ?? member.avatar_url
  const hasAbout  = member.camera_brands.length > 0 || member.shooting_interests.length > 0
  const hasStats  = stats.totalSubs > 0
  const hasScores = stats.avgScore !== null || stats.bestScore !== null

  return (
    <Section>
      <SectionHeading>Member spotlight</SectionHeading>
      <div style={tintedBox}>

      {/* Main row: photo + info */}
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

        {/* Photo */}
        <div style={{
          flexShrink:  0,
          width:       240,
          height:      240,
          borderRadius: 12,
          overflow:    'hidden',
          background:  'var(--surface-1)',
          display:     'flex',
          alignItems:  'center',
          justifyContent: 'center',
          fontSize:    40,
          fontWeight:  700,
          color:       'var(--text-tertiary)',
          fontFamily:  'var(--font-lora, Georgia, serif)',
        }}>
          {photoUrl ? (
            <SpotlightImageLightbox
              src={photoUrl}
              alt={member.display_name}
              title={member.display_name}
              maker={member.display_name}
            />
          ) : (
            <span>{initials(member.display_name)}</span>
          )}
        </div>

        {/* Right side */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Name + level badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
            <h3 style={{
              fontFamily:    'var(--font-lora, Georgia, serif)',
              fontSize:      32,
              fontWeight:    400,
              fontStyle:     'italic',
              letterSpacing: '-0.02em',
              color:         'var(--text-secondary)',
              margin:        0,
              lineHeight:    1.15,
            }}>
              {member.display_name}
            </h3>
            {member.experience_level && (
              <span style={{
                fontSize:      12,
                fontWeight:    600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding:       '3px 10px',
                borderRadius:  20,
                background:    'color-mix(in srgb, var(--action-primary) 12%, transparent)',
                border:        '1px solid color-mix(in srgb, var(--action-primary) 30%, transparent)',
                color:         'var(--action-primary)',
                whiteSpace:    'nowrap',
              }}>
                {member.experience_level}
              </span>
            )}
          </div>

          {/* Bio */}
          {member.bio && (
            <p style={{
              fontSize:   14,
              lineHeight: 1.65,
              color:      'var(--text-secondary)',
              margin:     '0 0 18px',
              display:    '-webkit-box',
              WebkitBoxOrient:  'vertical',
              WebkitLineClamp:  3,
              overflow:         'hidden',
            }}>
              {member.bio}
            </p>
          )}

          {/* Stats row */}
          {(hasAbout || hasStats || hasScores) && (
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap:                 '0 1px',
              background:          'var(--border-default)',
              marginTop:           member.bio ? 0 : 4,
            }}>

              {/* About */}
              <div style={{ background: 'var(--surface-1)', padding: '14px 22px' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px', fontFamily: 'var(--font-lora, Georgia, serif)' }}>
                  About
                </p>
                {member.camera_brands.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gear</span>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '2px 0 0', lineHeight: 1.5 }}>
                      {member.camera_brands.join(', ')}
                    </p>
                  </div>
                )}
                {member.shooting_interests.length > 0 && (
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Interests</span>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '2px 0 0', lineHeight: 1.5 }}>
                      {member.shooting_interests.join(', ')}
                    </p>
                  </div>
                )}
                {!hasAbout && (
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', margin: 0 }}>—</p>
                )}
              </div>

              {/* Submissions */}
              <div style={{ background: 'var(--surface-1)', padding: '14px 22px' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px', fontFamily: 'var(--font-lora, Georgia, serif)' }}>
                  Submissions
                </p>
                {hasStats ? (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <DonutChart
                      segments={stats.categoryCounts.slice(0, DONUT_COLORS.length)}
                      total={stats.totalSubs}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {stats.categoryCounts.slice(0, DONUT_COLORS.length).map((c, i) => (
                        <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: DONUT_COLORS[i % DONUT_COLORS.length],
                            flexShrink: 0, display: 'inline-block',
                          }} />
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1 }}>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', margin: 0 }}>No entries yet</p>
                )}
              </div>

              {/* Results */}
              <div style={{ background: 'var(--surface-1)', padding: '14px 22px' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px', fontFamily: 'var(--font-lora, Georgia, serif)' }}>
                  Results
                </p>
                {hasScores ? (
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    {member.membership_class && (
                      <div style={{
                        flexShrink:   0,
                        width:        52,
                        border:       '1px solid var(--border-default)',
                        borderRadius: 8,
                        textAlign:    'center',
                        padding:      '6px 4px 8px',
                        background:   'var(--surface-2)',
                      }}>
                        <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: '0 0 3px' }}>Class</p>
                        <p style={{ fontFamily: 'var(--font-lora, Georgia, serif)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>
                          {member.membership_class}
                        </p>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {stats.avgScore !== null && (
                        <div>
                          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Avg Score </span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{stats.avgScore.toFixed(1)}</span>
                        </div>
                      )}
                      {stats.bestScore !== null && (
                        <div>
                          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Best Score </span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{stats.bestScore}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', margin: 0 }}>No results yet</p>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
      </div>{/* end tintedBox */}
    </Section>
  )
}

// ─── Affiliation logo SVGs (monochrome, uses currentColor) ────────────────────

function FacebookSvg({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  )
}
function InstagramSvg({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}
function YouTubeSvg({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" style={{ fill: 'var(--surface-2, #fff)' }}/>
    </svg>
  )
}
function FlickrSvg({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="7" cy="12" r="4.5"/>
      <circle cx="17" cy="12" r="4.5" opacity="0.45"/>
    </svg>
  )
}
function FiveHundredSvg({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.5 3C7.25 3 3 7.25 3 12.5S7.25 22 12.5 22 22 17.75 22 12.5 17.75 3 12.5 3zm.5 13.5c-2.21 0-4-1.79-4-4s1.79-4 4-4c1.1 0 2.09.45 2.81 1.17L14.5 11H17V8.5l-.83.83A5.47 5.47 0 0 0 13 8c-3.04 0-5.5 2.46-5.5 5.5S9.96 19 13 19c2.72 0 4.99-1.97 5.43-4.57h-1.53c-.43 1.73-1.99 3.07-3.9 3.07z"/>
    </svg>
  )
}
function TwitterXSvg({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.733-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}
function VimeoSvg({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.396 7.164c-.093 2.026-1.507 4.799-4.242 8.32C15.322 19.04 12.93 20.8 10.97 20.8c-1.202 0-2.22-1.137-3.055-3.41L6.49 12.69C5.83 10.42 5.125 9.285 4.37 9.285c-.165 0-.74.348-1.726.98L2 9.01c1.386-.617 2.66-1.793 3.835-3.498C7.17 3.93 8.06 3.077 8.587 3.001c1.232-.119 1.99.72 2.277 2.514.304 1.917.515 3.109.632 3.578.35 1.593.737 2.39 1.158 2.39.327 0 .819-.516 1.475-1.547.654-1.032 1.004-1.815 1.052-2.35.094-1.12-.324-1.68-1.254-1.68-.447 0-.908.104-1.38.31.917-3.003 2.666-4.462 5.252-4.377 1.914.057 2.816 1.297 2.597 3.325z"/>
    </svg>
  )
}

function AffiliationLogo({ type, name }: { type?: string; name: string }) {
  const sz = 28
  switch (type) {
    case 'PSA':       return <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', fontFamily: 'var(--font-primary, serif)', color: 'currentColor' }}>PSA</span>
    case 'facebook':  return <FacebookSvg size={sz} />
    case 'instagram': return <InstagramSvg size={sz - 2} />
    case 'youtube':   return <YouTubeSvg size={sz} />
    case 'flickr':    return <FlickrSvg size={sz} />
    case '500px':     return <FiveHundredSvg size={sz} />
    case 'twitter':   return <TwitterXSvg size={sz - 4} />
    case 'vimeo':     return <VimeoSvg size={sz - 2} />
    default:          return <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', wordBreak: 'break-word', maxWidth: 56, lineHeight: 1.25, color: 'currentColor' }}>{name}</span>
  }
}

// ─── Affiliations block ───────────────────────────────────────────────────────

function AffiliationsBlock({ settings }: { settings: AffiliationsSettings }) {
  const { affiliations } = settings

  if (affiliations.length === 0) {
    return (
      <Section>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic', textAlign: 'center' }}>
          No affiliations configured yet.
        </p>
      </Section>
    )
  }

  return (
    <Section>
      {/* CSS-only hover — server component can't use onMouseOver */}
      <style>{`
        .affil-link:hover .affil-tile { border-color: var(--action-primary); color: var(--action-primary); }
      `}</style>
      <div className="flex flex-wrap gap-4 justify-center items-end">
        {affiliations.map(a => {
          const aff = a as typeof a & { type?: string }
          const tile = (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div
                className="affil-tile"
                style={{
                  width: 72, height: 72, borderRadius: 10,
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-default)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
              >
                <AffiliationLogo type={aff.type} name={a.name} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textAlign: 'center', maxWidth: 80 }}>
                {a.name}
              </span>
            </div>
          )
          return a.url ? (
            <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
               className="affil-link" style={{ textDecoration: 'none' }}>
              {tile}
            </a>
          ) : <div key={a.id}>{tile}</div>
        })}
      </div>
    </Section>
  )
}

// ─── Gallery preview block ────────────────────────────────────────────────────

type GalleryPreviewImage = { id: string; publicUrl: string }

function GalleryPreviewBlock({
  settings,
  images,
  imageCount,
  clubSlug,
}: {
  settings:   GalleryPreviewSettings
  images:     GalleryPreviewImage[]
  imageCount: number
  clubSlug:   string
}) {
  const href = `/${clubSlug}/gallery/${settings.gallerySlug}`
  return (
    <Section>
      <SectionHeading>Gallery preview</SectionHeading>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '-8px 0 14px', fontWeight: 500 }}>
        {settings.galleryName || 'Gallery'} · {imageCount} photo{imageCount !== 1 ? 's' : ''}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
        {images.slice(0, 4).map(img => (
          <div key={img.id} style={{ aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: 'var(--surface-1)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.publicUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ))}
        {/* Pad empty image slots so the link cell always sits in column 5 */}
        {Array.from({ length: Math.max(0, 4 - images.length) }).map((_, i) => (
          <div key={`empty-${i}`} style={{ aspectRatio: '1', borderRadius: 8, background: 'var(--surface-1)' }} />
        ))}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            aspectRatio:    '1',
            borderRadius:   8,
            border:         '1px solid var(--border-default)',
            background:     'var(--surface-1)',
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            6,
            textDecoration: 'none',
            color:          'var(--action-primary)',
            fontSize:       13,
            fontWeight:     500,
            textAlign:      'center',
            padding:        '8px',
          }}
        >
          <span style={{ fontSize: 22, lineHeight: 1 }}>→</span>
          <span style={{ lineHeight: 1.3 }}>View full gallery</span>
        </a>
      </div>
    </Section>
  )
}

// ─── Club galleries block ─────────────────────────────────────────────────────

type ClubGalleryItem = {
  id:         string
  name:       string
  slug:       string
  imageCount: number
  coverUrl:   string | null
}

function ClubGalleriesBlock({
  settings,
  galleries,
  clubSlug,
}: {
  settings:  ClubGalleriesSettings
  galleries: ClubGalleryItem[]
  clubSlug:  string
}) {
  if (galleries.length === 0) return (
    <Section>
      <SectionHeading>Club galleries</SectionHeading>
      <div style={tintedBox}>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic', margin: 0 }}>No galleries configured yet.</p>
      </div>
    </Section>
  )

  return (
    <Section>
      <SectionHeading>Club galleries</SectionHeading>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
        {galleries.map(g => (
          <a
            key={g.id}
            href={`/${clubSlug}/gallery/${g.slug}`}
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <div style={{
              borderRadius:  14,
              overflow:      'hidden',
              border:        '1px solid var(--border-default)',
              background:    'var(--surface-1)',
            }}>
              <div style={{ aspectRatio: '3/2', background: 'var(--surface-0)', position: 'relative', overflow: 'hidden' }}>
                {g.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={g.coverUrl}
                    alt={g.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>No cover</span>
                  </div>
                )}
              </div>
              <div style={{ padding: '14px 16px' }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', lineHeight: 1.2 }}>
                  {g.name}
                </p>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: 0 }}>
                  {g.imageCount} photo{g.imageCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </Section>
  )
}

// ─── Main renderer (server component) ────────────────────────────────────────

export default async function HomepageRenderer({
  blocks,
  clubName,
  clubId,
  clubSlug,
  isGuest = false,
}: {
  blocks:    ContentBlock[]
  clubName:  string
  clubId:    string
  clubSlug:  string
  isGuest?:  boolean
}) {
  const supabaseRaw = await createClient()
  const supabase    = supabaseRaw
  // Service client for public gallery data — images are club content visible to all visitors,
  // not subject to the per-member RLS that would hide other members' images.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svcSupabase = createServiceClient() as any
  const enabled     = blocks.filter(b => b.enabled)

  // ── Fetch events if the block is on ──────────────────────────────────────
  const eventsBlock = enabled.find(b => b.type === 'upcoming-events')
  let events: CalendarEvent[] = []
  const eventsLimit = 4   // hard cap — DB value is ignored
  if (eventsBlock) {
    const limit  = eventsLimit
    const nowIso = new Date().toISOString()

    // Manual calendar events + upcoming competition milestones in parallel
    const [{ data: calData }, { data: compData }] = await Promise.all([
      supabase
        .from('calendar_events')
        .select('id, title, starts_at, ends_at, all_day, event_type, location')
        .gte('starts_at', nowIso)
        .order('starts_at'),
      supabase
        .from('competitions')
        .select('id, title, short_title, opens_at, closes_at, status')
        .in('status', ['draft', 'open'])
        .or(`opens_at.gte.${nowIso},closes_at.gte.${nowIso}`)
        .order('opens_at', { ascending: true, nullsFirst: false }),
    ])

    // Synthesise competition milestones as CalendarEvent-shaped objects
    type CompRow = { id: string; title: string; short_title: string | null; opens_at: string | null; closes_at: string | null; status: string }
    const compEvents: CalendarEvent[] = []
    for (const c of (compData ?? []) as CompRow[]) {
      const name = c.short_title?.trim() || c.title
      // Opens event: draft or open-but-not-yet-started (opens_at still in the future)
      if ((c.status === 'draft' || c.status === 'open') && c.opens_at && c.opens_at >= nowIso) {
        compEvents.push({ id: `${c.id}-opens`, title: name, starts_at: c.opens_at, ends_at: null, all_day: true, event_type: 'submission_open', location: null })
      }
      // Closes event: open competitions with a future deadline
      if (c.status === 'open' && (!c.opens_at || c.opens_at < nowIso) && c.closes_at && c.closes_at >= nowIso) {
        compEvents.push({ id: `${c.id}-closes`, title: name, starts_at: c.closes_at, ends_at: null, all_day: true, event_type: 'submission_closed', location: null })
      }
    }

    // Merge, sort chronologically, apply limit
    const all = [...(calData ?? []) as CalendarEvent[], ...compEvents]
    all.sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    events = all.slice(0, limit)
  }

  // ── Fetch images for large-image block when a club gallery is selected ───────
  let heroSlides: Slide[] = []
  const largeImageBlock = enabled.find(b => b.type === 'large-image')
  const largeImageGallerySource = largeImageBlock?.largeImageSettings?.gallerySource ?? ''
  if (largeImageBlock && largeImageGallerySource.startsWith('club:')) {
    const galleryId = largeImageGallerySource.slice(5)
    type GalleryRow = { image_ids: string[] | null }
    const { data: galleryRow } = await svcSupabase
      .from('club_galleries')
      .select('image_ids')
      .eq('id', galleryId)
      .eq('club_id', clubId)
      .maybeSingle() as { data: GalleryRow | null }

    const imageIds = (galleryRow?.image_ids ?? []).slice(0, 12)
    if (imageIds.length > 0) {
      type ImgRow = { id: string; storage_path: string; title: string; profiles: { display_name: string } | null }
      const { data: imgRows } = await svcSupabase
        .from('images')
        .select('id, storage_path, title, profiles!images_owner_id_fkey(display_name)')
        .in('id', imageIds)
      const rowMap = new Map((imgRows ?? [] as ImgRow[]).map((r: ImgRow) => [r.id, r]))
      for (const id of imageIds) {
        const r = rowMap.get(id) as ImgRow | undefined
        if (!r) continue
        heroSlides.push({
          src:   supabaseRaw.storage.from('images').getPublicUrl(r.storage_path).data.publicUrl,
          title: r.title,
          maker: r.profiles?.display_name ?? '',
        })
      }
    }
  }

  // ── Fetch gallery-preview block data ──────────────────────────────────────
  const galleryPreviewBlock = enabled.find(b => b.type === 'gallery-preview')
  let galleryPreviewImages: GalleryPreviewImage[] = []
  let galleryPreviewImageCount = 0
  if (galleryPreviewBlock?.galleryPreviewSettings?.galleryId) {
    const { galleryId } = galleryPreviewBlock.galleryPreviewSettings
    type GalleryRow = { image_ids: string[] | null }
    const { data: gRow } = await svcSupabase
      .from('club_galleries')
      .select('image_ids')
      .eq('id', galleryId)
      .eq('club_id', clubId)
      .maybeSingle() as { data: GalleryRow | null }

    const imageIds = gRow?.image_ids ?? []
    galleryPreviewImageCount = imageIds.length
    const previewIds = imageIds.slice(0, 4)
    if (previewIds.length > 0) {
      type ImgRow = { id: string; storage_path: string }
      const { data: imgRows } = await svcSupabase
        .from('images')
        .select('id, storage_path')
        .in('id', previewIds)
      const rowMap = new Map((imgRows ?? [] as ImgRow[]).map((r: ImgRow) => [r.id, r]))
      for (const id of previewIds) {
        const r = rowMap.get(id) as ImgRow | undefined
        if (!r) continue
        galleryPreviewImages.push({
          id:        r.id,
          publicUrl: supabaseRaw.storage.from('images').getPublicUrl(r.storage_path).data.publicUrl,
        })
      }
    }
  }

  // ── Fetch club-galleries block data ───────────────────────────────────────
  const clubGalleriesBlock = enabled.find(b => b.type === 'club-galleries')
  let clubGalleriesItems: ClubGalleryItem[] = []
  if (clubGalleriesBlock?.clubGalleriesSettings?.galleryIds?.length) {
    const ids = clubGalleriesBlock.clubGalleriesSettings.galleryIds.slice(0, 3)
    type GalleryRow = { id: string; name: string; slug: string; image_ids: string[] | null; cover_image_id: string | null }
    const { data: galleryRows } = await svcSupabase
      .from('club_galleries')
      .select('id, name, slug, image_ids, cover_image_id')
      .in('id', ids)
      .eq('club_id', clubId) as { data: GalleryRow[] | null }

    const rowMap = new Map((galleryRows ?? []).map(r => [r.id, r]))
    for (const id of ids) {
      const r = rowMap.get(id)
      if (!r) continue
      let coverUrl: string | null = null
      const coverId = r.cover_image_id ?? r.image_ids?.[0] ?? null
      if (coverId) {
        const { data: imgRow } = await svcSupabase
          .from('images')
          .select('storage_path')
          .eq('id', coverId)
          .maybeSingle()
        if (imgRow?.storage_path) {
          coverUrl = supabaseRaw.storage.from('images').getPublicUrl(imgRow.storage_path).data.publicUrl
        }
      }
      clubGalleriesItems.push({
        id:         r.id,
        name:       r.name,
        slug:       r.slug,
        imageCount: r.image_ids?.length ?? 0,
        coverUrl,
      })
    }
  }

  // ── Fetch spotlight member ────────────────────────────────────────────────
  const spotlightBlock = enabled.find(b => b.type === 'member-spotlight')
  let spotlightMember: SpotlightMember | null = null
  let spotlightStats: SpotlightStats = { bestImageUrl: null, totalSubs: 0, categoryCounts: [], avgScore: null, bestScore: null }

  if (spotlightBlock?.spotlightSettings) {
    const { mode, memberName } = spotlightBlock.spotlightSettings
    const profileSelect = 'id, display_name, avatar_url, bio, experience_level, membership_class, member_number, camera_brands, shooting_interests'

    // Spotlight queries use service client — profiles/images/scores are club content,
    // not accessible to non-admin members under the current RLS.
    if (mode === 'manual' && memberName?.trim()) {
      const { data } = await svcSupabase
        .from('profiles')
        .select(profileSelect)
        .ilike('display_name', `%${memberName.trim()}%`)
        .eq('membership_status', 'active')
        .limit(1)
        .maybeSingle()
      spotlightMember = data as SpotlightMember | null
    } else {
      const { data } = await svcSupabase
        .from('profiles')
        .select(profileSelect)
        .eq('membership_status', 'active')
        .limit(20)
      const pool = (data ?? []) as SpotlightMember[]
      if (pool.length > 0) {
        spotlightMember = pool[Math.floor(Math.random() * pool.length)]
      }
    }

    if (spotlightMember) {
      // Submissions for this member with category names
      const { data: memberSubs } = await svcSupabase
        .from('submissions')
        .select('id, category_id, image_id, competition_categories(name)')
        .eq('member_id', spotlightMember.id)
        .eq('status', 'submitted')

      type SubRow = { id: string; category_id: string; image_id: string; competition_categories: { name: string } | null }
      const subIds = ((memberSubs ?? []) as SubRow[]).map(s => s.id)

      // Category counts
      const catMap: Record<string, { name: string; count: number }> = {}
      for (const sub of (memberSubs ?? []) as SubRow[]) {
        const catName = sub.competition_categories?.name ?? 'Uncategorised'
        if (!catMap[sub.category_id]) catMap[sub.category_id] = { name: catName, count: 0 }
        catMap[sub.category_id].count++
      }

      // Scores and best image (parallel)
      let bestImageUrl: string | null = null
      let avgScore: number | null = null
      let bestScore: number | null = null

      if (subIds.length > 0) {
        const [{ data: allScores }, { data: topScoreRow }] = await Promise.all([
          svcSupabase.from('scores').select('score').in('submission_id', subIds),
          svcSupabase.from('scores').select('score, submission_id').in('submission_id', subIds).order('score', { ascending: false }).limit(1).maybeSingle(),
        ])

        if (allScores?.length) {
          const vals = (allScores as { score: number }[]).map(s => s.score)
          avgScore  = vals.reduce((a, b) => a + b, 0) / vals.length
          bestScore = Math.max(...vals)
        }

        // Get the image for the best-scored submission
        if (topScoreRow) {
          const tsr = topScoreRow as { score: number; submission_id: string }
          const bestSub = ((memberSubs ?? []) as SubRow[]).find(s => s.id === tsr.submission_id)
          if (bestSub?.image_id) {
            const { data: imgRow } = await svcSupabase
              .from('images')
              .select('storage_path')
              .eq('id', bestSub.image_id)
              .single()
            if ((imgRow as { storage_path?: string } | null)?.storage_path) {
              bestImageUrl = supabaseRaw.storage.from('images').getPublicUrl((imgRow as { storage_path: string }).storage_path).data.publicUrl
            }
          }
        }
      }

      // Fall back to most recent library image if no competition image found
      if (!bestImageUrl) {
        const { data: imgData } = await svcSupabase
          .from('images')
          .select('storage_path')
          .eq('owner_id', spotlightMember.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if ((imgData as { storage_path?: string } | null)?.storage_path) {
          bestImageUrl = supabaseRaw.storage.from('images').getPublicUrl((imgData as { storage_path: string }).storage_path).data.publicUrl
        }
      }

      spotlightStats = {
        bestImageUrl,
        totalSubs:      (memberSubs ?? []).length,
        categoryCounts: Object.values(catMap),
        avgScore,
        bestScore,
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {enabled.map(block => {
        switch (block.type) {

          case 'welcome':
            // Always skipped inside the renderer — guest welcome block is rendered
            // directly in page.tsx above the constrained content wrapper
            return null

          case 'large-image':
            return (
              <div key={block.id} className="mx-auto w-full max-w-6xl px-4 pt-4">
                <HeroSlideshow clubName={clubName} slides={heroSlides.length > 0 ? heroSlides : undefined} />
              </div>
            )

          case 'gallery-preview':
            return block.galleryPreviewSettings?.galleryId ? (
              <GalleryPreviewBlock
                key={block.id}
                settings={block.galleryPreviewSettings}
                images={galleryPreviewImages}
                imageCount={galleryPreviewImageCount}
                clubSlug={clubSlug}
              />
            ) : null

          case 'club-galleries':
            return block.clubGalleriesSettings ? (
              <ClubGalleriesBlock
                key={block.id}
                settings={block.clubGalleriesSettings}
                galleries={clubGalleriesItems}
                clubSlug={clubSlug}
              />
            ) : null

          case 'custom-content':
            return block.customContentSettings ? (
              <CustomContentBlock
                key={block.id}
                settings={block.customContentSettings}
                label={block.label ?? block.name}
              />
            ) : null

          case 'upcoming-events':
            return <UpcomingEventsBlock key={block.id} events={events} limit={eventsLimit} />

          case 'member-spotlight':
            return spotlightMember && block.spotlightSettings ? (
              <MemberSpotlightBlock
                key={block.id}
                member={spotlightMember}
                settings={block.spotlightSettings}
                stats={spotlightStats}
              />
            ) : null

          case 'competitions':
            return block.competitionsSettings ? (
              <CompetitionsBlock key={block.id} settings={block.competitionsSettings} />
            ) : null

          case 'affiliations':
            return block.affiliationsSettings ? (
              <AffiliationsBlock key={block.id} settings={block.affiliationsSettings} />
            ) : null

          case 'dual-panel':
            return <DualPanelBlock key={block.id} />

          default:
            return null
        }
      })}
    </>
  )
}

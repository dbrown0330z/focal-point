import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HeroSlideshow from './HeroSlideshow'
import CustomContentNote from './CustomContentNote'
import { Grid8Gallery, Strip8Gallery, type GalleryImage } from './ImageGallery'
import CompetitionsBlock from './CompetitionsBlock'
import DualPanelBlock from './DualPanelBlock'
import DualPanelEvents from './DualPanelEvents'
import type {
  ContentBlock,
  ContentNote,
  CustomContentSettings,
  AffiliationsSettings,
  SpotlightSettings,
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

function UpcomingEventsBlock({ events }: { events: CalendarEvent[] }) {
  return (
    <Section>
      <div className="flex items-center justify-between mb-4">
        <SectionHeading>Upcoming events</SectionHeading>
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
  const strokeWidth = 10
  const r    = (size - strokeWidth) / 2
  const cx   = size / 2
  const cy   = size / 2
  const circ = 2 * Math.PI * r

  // Build arc segments
  let offset = 0
  const arcs = segments.map((seg, i) => {
    const fraction = total > 0 ? seg.count / total : 0
    const dash     = fraction * circ
    const arc = { dash, offset, color: DONUT_COLORS[i % DONUT_COLORS.length] }
    offset += dash
    return arc
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', flexShrink: 0 }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-1)" strokeWidth={strokeWidth} />
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
          width:       200,
          height:      200,
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
            <Image
              src={photoUrl}
              alt={member.display_name}
              width={200}
              height={200}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span>{initials(member.display_name)}</span>
          )}
        </div>

        {/* Right side */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Name + level badge */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <h3 style={{
              fontFamily:    'var(--font-lora, Georgia, serif)',
              fontSize:      28,
              fontWeight:    400,
              letterSpacing: '-0.02em',
              color:         'var(--text-primary)',
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
              <div style={{ background: 'var(--surface-1)', padding: '14px 16px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px', fontFamily: 'var(--font-lora, Georgia, serif)' }}>
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
              <div style={{ background: 'var(--surface-1)', padding: '14px 16px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px', fontFamily: 'var(--font-lora, Georgia, serif)' }}>
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
              <div style={{ background: 'var(--surface-1)', padding: '14px 16px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px', fontFamily: 'var(--font-lora, Georgia, serif)' }}>
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
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Avg Score </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{stats.avgScore.toFixed(1)}</span>
                        </div>
                      )}
                      {stats.bestScore !== null && (
                        <div>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Best Score </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{stats.bestScore}</span>
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

          {settings.mode === 'automatic' && (
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 10, fontStyle: 'italic' }}>
              Auto-selected · changes each visit
            </p>
          )}
        </div>
      </div>
      </div>{/* end tintedBox */}
    </Section>
  )
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
      <div className="flex flex-wrap gap-3 justify-center">
        {affiliations.map(a => {
          const inner = (
            <span
              key={a.id}
              style={{
                display: 'inline-block',
                fontSize: 13, fontWeight: 600,
                color: 'var(--text-secondary)',
                background: 'var(--surface-1)',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                padding: '6px 16px',
              }}
            >
              {a.name}
            </span>
          )
          return a.url ? (
            <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" style={{ opacity: 1, transition: 'opacity 0.15s' }}
               onMouseOver={e => (e.currentTarget.style.opacity = '0.7')}
               onMouseOut={e  => (e.currentTarget.style.opacity = '1')}>
              {inner}
            </a>
          ) : <span key={a.id}>{inner}</span>
        })}
      </div>
    </Section>
  )
}

// ─── Main renderer (server component) ────────────────────────────────────────

export default async function HomepageRenderer({
  blocks,
  clubName,
}: {
  blocks:   ContentBlock[]
  clubName: string
}) {
  const supabaseRaw = await createClient()
  const supabase    = supabaseRaw
  const enabled     = blocks.filter(b => b.enabled)

  // ── Fetch events if the block is on ──────────────────────────────────────
  const eventsBlock = enabled.find(b => b.type === 'upcoming-events')
  let events: CalendarEvent[] = []
  if (eventsBlock) {
    const limit  = eventsBlock.eventsSettings?.count ?? 5
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
      if (c.status === 'draft' && c.opens_at && c.opens_at >= nowIso) {
        compEvents.push({ id: `${c.id}-opens`, title: name, starts_at: c.opens_at, ends_at: null, all_day: true, event_type: 'submission_open', location: null })
      }
      if (c.status === 'open' && c.closes_at && c.closes_at >= nowIso) {
        compEvents.push({ id: `${c.id}-closes`, title: name, starts_at: c.closes_at, ends_at: null, all_day: true, event_type: 'submission_closed', location: null })
      }
    }

    // Merge, sort chronologically, apply limit
    const all = [...(calData ?? []) as CalendarEvent[], ...compEvents]
    all.sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    events = all.slice(0, limit)
  }

  // ── Fetch images for grid-6 / strip-8 ────────────────────────────────────
  const needsImages = enabled.some(b => ['grid-6', 'strip-8'].includes(b.type))
  let galleryImages: GalleryImage[] = []
  if (needsImages) {
    const grid6Block     = enabled.find(b => b.type === 'grid-6')
    const gallerySource  = grid6Block?.grid6Settings?.gallerySource ?? 'recent-uploads'
    const isWinners      = gallerySource === 'competition-winners'

    if (isWinners) {
      // For competition winners: pull top-scored submissions with image + category + score
      const { data: scoredRows } = await supabase
        .from('scores')
        .select('score, submissions!inner(image_id, competition_categories(name), competitions(closes_at), images(id, title, storage_path, profiles!images_owner_id_fkey(display_name)))')
        .order('score', { ascending: false })
        .limit(12) // fetch extra to deduplicate by image

      type ScoredRow = {
        score: number
        submissions: {
          image_id: string
          competition_categories: { name: string } | null
          competitions: { closes_at: string | null } | null
          images: { id: string; title: string; storage_path: string; profiles: { display_name: string } | null } | null
        }
      }

      const seen = new Set<string>()
      for (const row of (scoredRows ?? []) as ScoredRow[]) {
        const img = row.submissions?.images
        if (!img || seen.has(img.id)) continue
        seen.add(img.id)
        const closesAt   = row.submissions?.competitions?.closes_at
        const monthYear  = closesAt
          ? new Date(closesAt).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
          : undefined
        galleryImages.push({
          id:       img.id,
          title:    img.title,
          maker:    img.profiles?.display_name ?? undefined,
          date:     monthYear,
          category: row.submissions?.competition_categories?.name ?? undefined,
          score:    row.score,
          publicUrl: supabaseRaw.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl,
        })
        if (galleryImages.length >= 6) break
      }
    } else {
      // Recent uploads or other sources: images with upload date
      const { data } = await supabase
        .from('images')
        .select('id, storage_path, title, created_at, profiles!images_owner_id_fkey(display_name)')
        .order('created_at', { ascending: false })
        .limit(8)
      type ImgRow = { id: string; storage_path: string; title: string; created_at: string; profiles: { display_name: string } | null }
      galleryImages = (data ?? []).map((img: ImgRow) => ({
        id:       img.id,
        title:    img.title,
        maker:    img.profiles?.display_name ?? undefined,
        date:     new Date(img.created_at).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }),
        publicUrl: supabaseRaw.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl,
      }))
    }
  }

  // ── Fetch spotlight member ────────────────────────────────────────────────
  const spotlightBlock = enabled.find(b => b.type === 'member-spotlight')
  let spotlightMember: SpotlightMember | null = null
  let spotlightStats: SpotlightStats = { bestImageUrl: null, totalSubs: 0, categoryCounts: [], avgScore: null, bestScore: null }

  if (spotlightBlock?.spotlightSettings) {
    const { mode, memberName } = spotlightBlock.spotlightSettings
    const profileSelect = 'id, display_name, avatar_url, bio, experience_level, membership_class, member_number, camera_brands, shooting_interests'

    if (mode === 'manual' && memberName?.trim()) {
      const { data } = await supabase
        .from('profiles')
        .select(profileSelect)
        .ilike('display_name', `%${memberName.trim()}%`)
        .eq('membership_status', 'active')
        .limit(1)
        .maybeSingle()
      spotlightMember = data as SpotlightMember | null
    } else {
      const { data } = await supabase
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
      const { data: memberSubs } = await supabase
        .from('submissions')
        .select('id, category_id, image_id, competition_categories(name)')
        .eq('member_id', spotlightMember.id)
        .eq('status', 'submitted')

      const subIds = (memberSubs ?? []).map(s => s.id)

      // Category counts
      const catMap: Record<string, { name: string; count: number }> = {}
      for (const sub of memberSubs ?? []) {
        const catName = (sub.competition_categories as { name: string } | null)?.name ?? 'Uncategorised'
        if (!catMap[sub.category_id]) catMap[sub.category_id] = { name: catName, count: 0 }
        catMap[sub.category_id].count++
      }

      // Scores and best image (parallel)
      let bestImageUrl: string | null = null
      let avgScore: number | null = null
      let bestScore: number | null = null

      if (subIds.length > 0) {
        const [{ data: allScores }, { data: topScoreRow }] = await Promise.all([
          supabase.from('scores').select('score').in('submission_id', subIds),
          supabase.from('scores').select('score, submission_id').in('submission_id', subIds).order('score', { ascending: false }).limit(1).maybeSingle(),
        ])

        if (allScores?.length) {
          const vals = allScores.map(s => s.score)
          avgScore  = vals.reduce((a, b) => a + b, 0) / vals.length
          bestScore = Math.max(...vals)
        }

        // Get the image for the best-scored submission
        if (topScoreRow) {
          const bestSub = (memberSubs ?? []).find(s => s.id === topScoreRow.submission_id)
          if (bestSub?.image_id) {
            const { data: imgRow } = await supabase
              .from('images')
              .select('storage_path')
              .eq('id', bestSub.image_id)
              .single()
            if (imgRow?.storage_path) {
              bestImageUrl = supabaseRaw.storage.from('images').getPublicUrl(imgRow.storage_path).data.publicUrl
            }
          }
        }
      }

      // Fall back to most recent library image if no competition image found
      if (!bestImageUrl) {
        const { data: imgData } = await supabase
          .from('images')
          .select('storage_path')
          .eq('owner_id', spotlightMember.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (imgData?.storage_path) {
          bestImageUrl = supabaseRaw.storage.from('images').getPublicUrl(imgData.storage_path).data.publicUrl
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
            // Visitor-only block — members see the static "Welcome back" greeting
            return null

          case 'large-image':
            return (
              <div key={block.id} className="mx-auto w-full max-w-6xl px-4 pt-4">
                <HeroSlideshow clubName={clubName} />
              </div>
            )

          case 'custom-content':
            return block.customContentSettings ? (
              <CustomContentBlock
                key={block.id}
                settings={block.customContentSettings}
                label={block.label ?? block.name}
              />
            ) : null

          case 'upcoming-events':
            return <UpcomingEventsBlock key={block.id} events={events} />

          case 'grid-6':
            return <Grid8Block key={block.id} images={galleryImages.slice(0, 6)} block={block} />

          case 'strip-8':
            return <Strip8Block key={block.id} images={galleryImages} />

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

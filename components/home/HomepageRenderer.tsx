import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HeroSlideshow from './HeroSlideshow'
import CustomContentNote from './CustomContentNote'
import { Grid8Gallery, Strip8Gallery } from './ImageGallery'
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

function Section({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`border-b border-[var(--border-subtle)] py-7 last:border-b-0 ${className}`}>
      {children}
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'var(--font-lora, Georgia, serif)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)', marginBottom: 16, lineHeight: 1.3 }}>
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

  return (
    <Section>
      {label && label !== 'Custom content' && <SectionHeading>{label}</SectionHeading>}
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

type GalleryImage = { id: string; publicUrl: string; title: string; maker?: string }

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
      <div className="flex items-center justify-between mb-1">
        <SectionHeading>Gallery Snapshot</SectionHeading>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No images in the library yet.</p>
    </Section>
  )

  return (
    <Section>
      <Grid8Gallery images={images} galleryName={galleryName} galleryHref="/library" totalImages={images.length} />
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
  id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  membership_class: string | null
  member_number: number
}

function MemberSpotlightBlock({
  member,
  settings,
  memberPhotoUrl,
}: {
  member:         SpotlightMember
  settings:       SpotlightSettings
  memberPhotoUrl: string | null
}) {
  // Show a library photo if available, fall back to avatar, then initials
  const photoUrl = memberPhotoUrl ?? member.avatar_url

  return (
    <Section>
      <SectionHeading>Member spotlight</SectionHeading>
      <div className="flex gap-5 items-start">
        {/* Square photo */}
        <div
          className="flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
          style={{
            width:      140,
            height:     140,
            background: 'var(--surface-1)',
            fontSize:   32,
            fontWeight: 700,
            color:      'var(--text-tertiary)',
            fontFamily: 'var(--font-lora, Georgia, serif)',
          }}
        >
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={member.display_name}
              width={140}
              height={140}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initials(member.display_name)}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pt-1">
          <p style={{ fontFamily: 'var(--font-lora, Georgia, serif)', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {member.display_name}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3 }}>
            {member.membership_class
              ? `${member.membership_class} · Member #${member.member_number}`
              : `Member #${member.member_number}`}
          </p>
          {member.bio && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.6, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 4, overflow: 'hidden' }}>
              {member.bio}
            </p>
          )}
          {settings.mode === 'automatic' && (
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8, fontStyle: 'italic' }}>
              Auto-selected · changes each visit
            </p>
          )}
        </div>
      </div>
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
    const { data } = await supabase
      .from('images')
      .select('id, storage_path, title, profiles!images_owner_id_fkey(display_name)')
      .order('created_at', { ascending: false })
      .limit(8)
    galleryImages = (data ?? []).map((img: { id: string; storage_path: string; title: string; profiles: { display_name: string } | null }) => ({
      id:        img.id,
      title:     img.title,
      maker:     img.profiles?.display_name ?? undefined,
      publicUrl: supabaseRaw.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl,
    }))
  }

  // ── Fetch spotlight member ────────────────────────────────────────────────
  const spotlightBlock = enabled.find(b => b.type === 'member-spotlight')
  let spotlightMember: SpotlightMember | null = null
  let spotlightPhotoUrl: string | null = null
  if (spotlightBlock?.spotlightSettings) {
    const { mode, memberName } = spotlightBlock.spotlightSettings
    if (mode === 'manual' && memberName?.trim()) {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, bio, membership_class, member_number')
        .ilike('display_name', `%${memberName.trim()}%`)
        .eq('membership_status', 'active')
        .limit(1)
        .maybeSingle()
      spotlightMember = data as SpotlightMember | null
    } else {
      // Automatic: pull up to 20 active members and pick one randomly server-side
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, bio, membership_class, member_number')
        .eq('membership_status', 'active')
        .limit(20)
      const pool = (data ?? []) as SpotlightMember[]
      if (pool.length > 0) {
        spotlightMember = pool[Math.floor(Math.random() * pool.length)]
      }
    }

    // Fetch one library image for the spotlight member
    if (spotlightMember) {
      const { data: imgData } = await supabase
        .from('images')
        .select('storage_path')
        .eq('owner_id', spotlightMember.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (imgData?.storage_path) {
        spotlightPhotoUrl = supabaseRaw.storage
          .from('images')
          .getPublicUrl(imgData.storage_path).data.publicUrl
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
            return <Grid8Block key={block.id} images={galleryImages.slice(0, 8)} block={block} />

          case 'strip-8':
            return <Strip8Block key={block.id} images={galleryImages} />

          case 'member-spotlight':
            return spotlightMember && block.spotlightSettings ? (
              <MemberSpotlightBlock
                key={block.id}
                member={spotlightMember}
                settings={block.spotlightSettings}
                memberPhotoUrl={spotlightPhotoUrl}
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

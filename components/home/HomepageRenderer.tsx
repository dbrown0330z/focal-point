import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HeroSlideshow from './HeroSlideshow'
import type {
  ContentBlock,
  CustomContentSettings,
  AffiliationsSettings,
  SpotlightSettings,
  ContentNote,
} from '@/lib/homepage/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_TYPE_LABEL: Record<string, string> = {
  competition:      'Competition',
  regular_meeting:  'Meeting',
  board_meeting:    'Board meeting',
  field_trip:       'Field trip',
  other:            'Event',
  submission_open:  'Submissions open',
  submission_closed:'Submissions close',
}

function formatEventDate(iso: string): { month: string; day: string; weekday: string } {
  const d = new Date(iso)
  return {
    month:   d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day:     String(d.getDate()),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
  }
}

function formatEventTime(iso: string, allDay: boolean): string {
  if (allDay) return 'All day'
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

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

function CustomContentNote({ note, previewLines }: { note: ContentNote; previewLines: number }) {
  const hasBody = !!note.body && note.body.trim() !== '' && note.body !== '<p><br></p>'
  return (
    <div className="rounded-lg p-4" style={{ background: 'var(--surface-1)' }}>
      {note.heading && (
        <h3 style={{ fontFamily: 'var(--font-lora, Georgia, serif)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.35 }}>
          {note.heading}
        </h3>
      )}
      {hasBody ? (
        <div
          className="prose-sm text-content-secondary"
          style={{
            fontSize: 14,
            lineHeight: 1.65,
            color: 'var(--text-secondary)',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: previewLines,
            overflow: 'hidden',
          }}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: note.body }}
        />
      ) : (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No content yet.</p>
      )}
    </div>
  )
}

function CustomContentBlock({
  settings,
  label,
}: {
  settings: CustomContentSettings
  label: string
}) {
  const { notes, columns, previewLines } = settings
  if (notes.length === 0) return null

  const gridCols = columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'

  return (
    <Section>
      {label && label !== 'Custom content' && <SectionHeading>{label}</SectionHeading>}
      <div className={`grid gap-4 ${gridCols}`}>
        {notes.map(note => (
          <CustomContentNote key={note.id} note={note} previewLines={previewLines} />
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
  if (events.length === 0) return null

  return (
    <Section>
      <div className="flex items-center justify-between mb-4">
        <SectionHeading>Upcoming events</SectionHeading>
        <Link href="/calendar" className="text-[13px] font-medium" style={{ color: 'var(--action-primary)' }}>
          View all →
        </Link>
      </div>
      <div className="flex flex-col divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
        {events.map(ev => {
          const { month, day, weekday } = formatEventDate(ev.starts_at)
          const time = formatEventTime(ev.starts_at, ev.all_day)
          const typeLabel = EVENT_TYPE_LABEL[ev.event_type] ?? 'Event'
          return (
            <div key={ev.id} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
              {/* Date badge */}
              <div className="flex-shrink-0 w-11 text-center rounded-md py-1.5" style={{ background: 'var(--surface-1)' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--action-primary)' }}>{month}</div>
                <div style={{ fontFamily: 'var(--font-lora, Georgia, serif)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{day}</div>
                <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{weekday}</div>
              </div>
              {/* Event info */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{ev.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {time}
                  {ev.location && <> · {ev.location}</>}
                </p>
              </div>
              {/* Type badge */}
              <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', background: 'var(--surface-1)', borderRadius: 4, padding: '2px 7px', border: '1px solid var(--border-subtle)' }}>
                {typeLabel}
              </span>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// ─── Image grid / strip blocks ────────────────────────────────────────────────

type GalleryImage = { id: string; publicUrl: string; title: string; ownerName?: string }

function Grid6Block({ images }: { images: GalleryImage[] }) {
  if (images.length === 0) return null
  const shown = images.slice(0, 6)

  return (
    <Section>
      <SectionHeading>Recent images</SectionHeading>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {shown.map(img => (
          <div key={img.id} className="aspect-square rounded-lg overflow-hidden" style={{ background: 'var(--surface-1)' }}>
            <Image
              src={img.publicUrl}
              alt={img.title}
              width={400} height={400}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </Section>
  )
}

function Strip8Block({ images }: { images: GalleryImage[] }) {
  if (images.length === 0) return null
  const shown = images.slice(0, 8)

  return (
    <Section>
      <SectionHeading>Member photos</SectionHeading>
      {/* Horizontal scroll strip — scrollbar hidden via CSS */}
      <div
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {shown.map(img => (
          <div
            key={img.id}
            className="flex-shrink-0 rounded-lg overflow-hidden"
            style={{ width: 140, height: 140, background: 'var(--surface-1)' }}
          >
            <Image
              src={img.publicUrl}
              alt={img.title}
              width={280} height={280}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </Section>
  )
}

// ─── Member spotlight block ───────────────────────────────────────────────────

type SpotlightMember = {
  display_name: string
  avatar_url: string | null
  bio: string | null
  membership_class: string | null
  member_number: number
}

function MemberSpotlightBlock({
  member,
  settings,
}: {
  member: SpotlightMember
  settings: SpotlightSettings
}) {
  const avatarUrl = member.avatar_url

  return (
    <Section>
      <SectionHeading>Member spotlight</SectionHeading>
      <div className="flex gap-5 items-start">
        {/* Avatar */}
        <div
          className="flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
          style={{ width: 80, height: 80, background: 'var(--surface-1)', fontSize: 24, fontWeight: 700, color: 'var(--text-tertiary)', fontFamily: 'var(--font-lora, Georgia, serif)' }}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt={member.display_name} width={80} height={80} className="w-full h-full object-cover" />
          ) : (
            <span>{initials(member.display_name)}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p style={{ fontFamily: 'var(--font-lora, Georgia, serif)', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {member.display_name}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {member.membership_class
              ? `${member.membership_class} · Member #${member.member_number}`
              : `Member #${member.member_number}`}
          </p>
          {member.bio && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' }}>
              {member.bio}
            </p>
          )}
          {settings.mode === 'automatic' && (
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, fontStyle: 'italic' }}>
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
  if (affiliations.length === 0) return null

  return (
    <Section>
      <div className="flex flex-wrap gap-3 justify-center">
        {affiliations.map(a => {
          const inner = (
            <span
              key={a.id}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{
                fontSize: 13, fontWeight: 600,
                color: 'var(--text-secondary)',
                background: 'var(--surface-1)',
                border: '1px solid var(--border-default)',
              }}
            >
              {a.name}
            </span>
          )
          return a.url ? (
            <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              {inner}
            </a>
          ) : inner
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase    = supabaseRaw as any
  const enabled     = blocks.filter(b => b.enabled)

  // ── Fetch events if the block is on ──────────────────────────────────────
  const eventsBlock = enabled.find(b => b.type === 'upcoming-events')
  let events: CalendarEvent[] = []
  if (eventsBlock) {
    const limit = eventsBlock.eventsSettings?.count ?? 5
    const { data } = await supabase
      .from('calendar_events')
      .select('id, title, starts_at, ends_at, all_day, event_type, location')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at')
      .limit(limit)
    events = (data ?? []) as CalendarEvent[]
  }

  // ── Fetch images for grid-6 / strip-8 ────────────────────────────────────
  const needsImages = enabled.some(b => ['grid-6', 'strip-8'].includes(b.type))
  let galleryImages: GalleryImage[] = []
  if (needsImages) {
    const { data } = await supabase
      .from('images')
      .select('id, storage_path, title')
      .order('created_at', { ascending: false })
      .limit(8)
    galleryImages = (data ?? []).map((img: { id: string; storage_path: string; title: string }) => ({
      id:        img.id,
      title:     img.title,
      publicUrl: supabaseRaw.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl,
    }))
  }

  // ── Fetch spotlight member ────────────────────────────────────────────────
  const spotlightBlock = enabled.find(b => b.type === 'member-spotlight')
  let spotlightMember: SpotlightMember | null = null
  if (spotlightBlock?.spotlightSettings) {
    const { mode, memberName } = spotlightBlock.spotlightSettings
    if (mode === 'manual' && memberName?.trim()) {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, bio, membership_class, member_number')
        .ilike('display_name', `%${memberName.trim()}%`)
        .eq('membership_status', 'active')
        .limit(1)
        .maybeSingle()
      spotlightMember = data as SpotlightMember | null
    } else {
      // Automatic: pull up to 20 active members and pick one randomly server-side
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, bio, membership_class, member_number')
        .eq('membership_status', 'active')
        .limit(20)
      const pool = (data ?? []) as SpotlightMember[]
      if (pool.length > 0) {
        spotlightMember = pool[Math.floor(Math.random() * pool.length)]
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
            return <Grid6Block key={block.id} images={galleryImages.slice(0, 6)} />

          case 'strip-8':
            return <Strip8Block key={block.id} images={galleryImages} />

          case 'member-spotlight':
            return spotlightMember && block.spotlightSettings ? (
              <MemberSpotlightBlock
                key={block.id}
                member={spotlightMember}
                settings={block.spotlightSettings}
              />
            ) : null

          case 'affiliations':
            return block.affiliationsSettings ? (
              <AffiliationsBlock key={block.id} settings={block.affiliationsSettings} />
            ) : null

          default:
            return null
        }
      })}
    </>
  )
}

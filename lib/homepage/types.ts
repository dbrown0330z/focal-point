// Shared types for the homepage block system.
// Used by both the admin HomepageEditor (client) and the member HomepageRenderer (server).

export type GallerySource = 'competition-winners' | 'recent-uploads' | 'member-picks' | 'portrait' | 'landscape'

export interface WelcomeContent {
  heading: string; body: string; ctaLabel: string; ctaLink: string
}
export interface LargeImageSettings {
  // gallerySource is a GallerySource OR 'club:<galleryId>' for a specific club gallery
  gallerySource: string; intervalSeconds: number
}
export interface Grid6Settings {
  gallerySource: GallerySource; criteria: 'latest' | 'top-rated' | 'competition-winners'
}
export interface Strip8Settings {
  gallerySource: GallerySource; criteria: 'latest' | 'top-rated' | 'competition-winners'
}
export interface GalleryPreviewSettings {
  galleryId:   string
  gallerySlug: string
  galleryName: string
}
export interface ClubGalleriesSettings {
  galleryIds: string[]  // up to 3
}
export interface SpotlightSettings {
  mode: 'automatic' | 'manual'; memberName: string
}
export interface EventsSettings {
  count: number
}
export interface ContentNote {
  id: string; heading: string; body: string  // body is HTML from rich-text editor
}
export interface CustomContentSettings {
  columns: 1 | 2 | 3; previewLines: number; notes: ContentNote[]
}
export type AffiliationType = 'PSA' | 'facebook' | 'instagram' | 'youtube' | 'flickr' | '500px' | 'twitter' | 'vimeo' | 'other'

export interface Affiliation {
  id: string
  type: AffiliationType
  name: string   // label shown on the tile; auto-set for known types, user-entered for 'other'
  url: string
}
export interface AffiliationsSettings {
  maxColumns: number; affiliations: Affiliation[]
}

export interface DualPanelSettings {
  eventCount: 3 | 4 | 5 | 6
}

export interface CompetitionsSettings {
  heading:          string
  showScoreChart:   boolean
  showTopImages:    boolean
  topImageCount:    2 | 3 | 4
  showMemberResult: boolean
  showComingSoon:   boolean
  maxOpenShown:     1 | 2 | 3
}

export interface ContentBlock {
  id:                      string
  name:                    string
  label?:                  string
  type:                    string
  enabled:                 boolean
  fixed?:                  boolean
  visibleToAnonymous?:     boolean   // undefined treated as true
  welcomeContent?:         WelcomeContent
  largeImageSettings?:     LargeImageSettings
  grid6Settings?:          Grid6Settings
  strip8Settings?:         Strip8Settings
  galleryPreviewSettings?: GalleryPreviewSettings
  clubGalleriesSettings?:  ClubGalleriesSettings
  spotlightSettings?:      SpotlightSettings
  eventsSettings?:         EventsSettings
  customContentSettings?:  CustomContentSettings
  affiliationsSettings?:   AffiliationsSettings
  dualPanelSettings?:      DualPanelSettings
  competitionsSettings?:   CompetitionsSettings
}

/**
 * Merge saved blocks with the current DEFAULT_BLOCKS.
 * Any block id present in defaults but missing from saved is inserted at its
 * default position (immediately after the nearest preceding sibling that IS in
 * saved), rather than being appended to the end.
 */
export function mergeBlocks(saved: ContentBlock[], defaults: ContentBlock[]): ContentBlock[] {
  const defaultMap = new Map(defaults.map(d => [d.id, d]))
  const savedIds   = new Set(saved.map(b => b.id))
  const newDefaults = defaults.filter(d => !savedIds.has(d.id))

  // Enrich existing saved blocks with any settings fields that are present in
  // the default but missing from the saved version (e.g. a new settings object
  // added after the block was first persisted to the DB).
  const enriched = saved.map(b => {
    const def = defaultMap.get(b.id)
    if (!def) return b
    const patch: Partial<ContentBlock> = {}
    if (def.welcomeContent          && !b.welcomeContent)          patch.welcomeContent          = def.welcomeContent
    if (def.largeImageSettings      && !b.largeImageSettings)      patch.largeImageSettings      = def.largeImageSettings
    if (def.grid6Settings           && !b.grid6Settings)           patch.grid6Settings           = def.grid6Settings
    if (def.strip8Settings          && !b.strip8Settings)          patch.strip8Settings          = def.strip8Settings
    if (def.galleryPreviewSettings  && !b.galleryPreviewSettings)  patch.galleryPreviewSettings  = def.galleryPreviewSettings
    if (def.clubGalleriesSettings   && !b.clubGalleriesSettings)   patch.clubGalleriesSettings   = def.clubGalleriesSettings
    if (def.spotlightSettings       && !b.spotlightSettings)       patch.spotlightSettings       = def.spotlightSettings
    if (def.eventsSettings          && !b.eventsSettings)          patch.eventsSettings          = def.eventsSettings
    if (def.customContentSettings   && !b.customContentSettings)   patch.customContentSettings   = def.customContentSettings
    if (def.affiliationsSettings    && !b.affiliationsSettings)    patch.affiliationsSettings    = def.affiliationsSettings
    if (def.dualPanelSettings       && !b.dualPanelSettings)       patch.dualPanelSettings       = def.dualPanelSettings
    if (def.competitionsSettings    && !b.competitionsSettings)    patch.competitionsSettings    = def.competitionsSettings
    return Object.keys(patch).length > 0 ? { ...b, ...patch } : b
  })

  if (newDefaults.length === 0) return enriched

  const result = [...enriched]

  for (const newBlock of newDefaults) {
    const defaultIdx = defaults.findIndex(d => d.id === newBlock.id)
    // Walk backwards through defaults to find the nearest sibling already in result
    let insertAfterIdx = -1  // -1 means prepend
    for (let i = defaultIdx - 1; i >= 0; i--) {
      const siblingIdx = result.findIndex(b => b.id === defaults[i].id)
      if (siblingIdx !== -1) { insertAfterIdx = siblingIdx; break }
    }
    result.splice(insertAfterIdx + 1, 0, newBlock)
  }

  return result
}

export const DEFAULT_BLOCKS: ContentBlock[] = [
  {
    id: 'welcome', name: 'Welcome', type: 'welcome', enabled: true, fixed: true,
    welcomeContent: {
      heading:  'Every great shot starts somewhere.',
      body:     '[Club Name] brings together photographers of all skill levels for monthly competitions, workshops, field trips, and plenty of good company. If you love making images and want to grow alongside people who share that passion, you\'re in the right place.',
      ctaLabel: 'Join the club',
      ctaLink:  '/apply',
    },
  },
  {
    id: 'large-image', name: 'Hero slideshow', type: 'large-image', enabled: true,
    largeImageSettings: { gallerySource: 'competition-winners', intervalSeconds: 5 },
  },
  {
    id: 'dual-panel', name: 'Events & competitions', type: 'dual-panel', enabled: true,
    dualPanelSettings: { eventCount: 4 },
  },
  {
    id: 'custom-content-1', name: 'Custom content', type: 'custom-content', enabled: true,
    customContentSettings: { columns: 3, previewLines: 4, notes: [] },
  },
  {
    id: 'gallery-preview', name: 'Gallery showcase', type: 'gallery-preview', enabled: false,
    galleryPreviewSettings: { galleryId: '', gallerySlug: '', galleryName: '' },
  },
  {
    id: 'club-galleries', name: 'Club galleries', type: 'club-galleries', enabled: false,
    clubGalleriesSettings: { galleryIds: [] },
  },
  {
    id: 'upcoming-events', name: 'Events (full width)', type: 'upcoming-events', enabled: false,
    eventsSettings: { count: 4 },
  },
  {
    id: 'member-spotlight', name: 'Member spotlight', type: 'member-spotlight', enabled: true,
    spotlightSettings: { mode: 'automatic', memberName: '' },
  },
  {
    id: 'competitions', name: 'Competitions', type: 'competitions', enabled: true,
    competitionsSettings: {
      heading:          'Competitions',
      showScoreChart:   true,
      showTopImages:    true,
      topImageCount:    4,
      showMemberResult: true,
      showComingSoon:   true,
      maxOpenShown:     2,
    },
  },
  {
    id: 'affiliations', name: 'Affiliations & links', type: 'affiliations', enabled: true,
    affiliationsSettings: { maxColumns: 6, affiliations: [] },
  },
]

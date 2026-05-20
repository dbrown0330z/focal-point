// Shared types for the homepage block system.
// Used by both the admin HomepageEditor (client) and the member HomepageRenderer (server).

export type GallerySource = 'competition-winners' | 'recent-uploads' | 'member-picks' | 'portrait' | 'landscape'

export interface WelcomeContent {
  heading: string; body: string; ctaLabel: string; ctaLink: string
}
export interface LargeImageSettings {
  gallerySource: GallerySource; intervalSeconds: number
}
export interface Grid6Settings {
  gallerySource: GallerySource; criteria: 'latest' | 'top-rated' | 'competition-winners'
}
export interface Strip8Settings {
  gallerySource: GallerySource; criteria: 'latest' | 'top-rated' | 'competition-winners'
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
export interface Affiliation {
  id: string; name: string; url: string
}
export interface AffiliationsSettings {
  maxColumns: number; affiliations: Affiliation[]
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
  welcomeContent?:         WelcomeContent
  largeImageSettings?:     LargeImageSettings
  grid6Settings?:          Grid6Settings
  strip8Settings?:         Strip8Settings
  spotlightSettings?:      SpotlightSettings
  eventsSettings?:         EventsSettings
  customContentSettings?:  CustomContentSettings
  affiliationsSettings?:   AffiliationsSettings
  competitionsSettings?:   CompetitionsSettings
}

/**
 * Merge saved blocks with the current DEFAULT_BLOCKS.
 * Any block id present in defaults but missing from saved is inserted at its
 * default position (immediately after the nearest preceding sibling that IS in
 * saved), rather than being appended to the end.
 */
export function mergeBlocks(saved: ContentBlock[], defaults: ContentBlock[]): ContentBlock[] {
  const savedIds = new Set(saved.map(b => b.id))
  const newDefaults = defaults.filter(d => !savedIds.has(d.id))
  if (newDefaults.length === 0) return saved

  const result = [...saved]

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
      heading:  'Welcome to our camera club',
      body:     'A community of passionate photographers. We meet regularly for critique nights, competitions, and workshops. All skill levels welcome.',
      ctaLabel: 'Apply for membership',
      ctaLink:  '/apply',
    },
  },
  {
    id: 'large-image', name: 'Large image', type: 'large-image', enabled: true,
    largeImageSettings: { gallerySource: 'competition-winners', intervalSeconds: 5 },
  },
  {
    id: 'dual-panel', name: 'Events & competitions', type: 'dual-panel', enabled: true,
  },
  {
    id: 'custom-content-1', name: 'Custom content', type: 'custom-content', enabled: true,
    customContentSettings: { columns: 3, previewLines: 4, notes: [] },
  },
  {
    id: 'grid-6', name: '8-image grid', type: 'grid-6', enabled: true,
    grid6Settings: { gallerySource: 'competition-winners', criteria: 'top-rated' },
  },
  {
    id: 'strip-8', name: '8-image strip', type: 'strip-8', enabled: true,
    strip8Settings: { gallerySource: 'recent-uploads', criteria: 'latest' },
  },
  {
    id: 'upcoming-events', name: 'Upcoming events', type: 'upcoming-events', enabled: true,
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

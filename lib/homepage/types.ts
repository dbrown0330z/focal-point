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
    id: 'custom-content-1', name: 'Custom content', type: 'custom-content', enabled: true,
    customContentSettings: { columns: 3, previewLines: 4, notes: [] },
  },
  {
    id: 'grid-6', name: '6-image grid', type: 'grid-6', enabled: true,
    grid6Settings: { gallerySource: 'competition-winners', criteria: 'top-rated' },
  },
  {
    id: 'strip-8', name: '8-image strip', type: 'strip-8', enabled: true,
    strip8Settings: { gallerySource: 'recent-uploads', criteria: 'latest' },
  },
  {
    id: 'upcoming-events', name: 'Upcoming events', type: 'upcoming-events', enabled: true,
    eventsSettings: { count: 5 },
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

// Shared types for the member-facing Resources feature.
// Keep in sync with the admin actions.ts types.

export type ResourceCategoryLayout = 'auto' | 'list' | 'video_grid' | 'link_cards' | 'featured_cards'
export type ResourceSourceType     = 'file' | 'link' | 'video'
export type ResourceVisibility     = 'public' | 'members' | 'board'
export type ResourceStatus         = 'draft' | 'published'
export type ResourceVideoProvider  = 'youtube' | 'vimeo'

export type ResourceCategory = {
  id:         string
  club_id:    string
  name:       string
  slug:       string
  layout:     ResourceCategoryLayout
  is_visible: boolean
  is_system:  boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type Resource = {
  id:                 string
  club_id:            string
  category_id:        string
  source_type:        ResourceSourceType
  title:              string
  description:        string | null
  author:             string | null
  visibility:         ResourceVisibility
  status:             ResourceStatus
  is_pinned:          boolean
  pinned_order:       number | null
  sort_order:         number
  show_new_badge:     boolean
  published_at:       string | null
  content_updated_at: string | null
  file_path:          string | null
  file_name:          string | null
  file_mime:          string | null
  file_size:          number | null
  page_count:         number | null
  url:                string | null
  url_host:           string | null
  video_provider:     ResourceVideoProvider | null
  video_id:           string | null
  duration_seconds:   number | null
  thumbnail_url:      string | null
  view_count:         number
  created_at:         string
  updated_at:         string
}

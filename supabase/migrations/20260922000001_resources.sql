-- Resources feature: replaces the old documents system.
-- Provides categorised resource library (files, links, videos) per club.

-- Enums
CREATE TYPE resource_category_layout AS ENUM ('auto', 'list', 'video_grid', 'link_cards', 'featured_cards');
CREATE TYPE resource_source_type     AS ENUM ('file', 'link', 'video');
CREATE TYPE resource_visibility      AS ENUM ('public', 'members', 'board');
CREATE TYPE resource_status          AS ENUM ('draft', 'published');
CREATE TYPE resource_link_status     AS ENUM ('ok', 'broken', 'unchecked');
CREATE TYPE resource_video_provider  AS ENUM ('youtube', 'vimeo');

-- Categories
CREATE TABLE resource_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name        text NOT NULL,
  slug        text NOT NULL,
  layout      resource_category_layout NOT NULL DEFAULT 'auto',
  is_visible  boolean NOT NULL DEFAULT true,
  is_system   boolean NOT NULL DEFAULT false,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, slug),
  UNIQUE (club_id, name)
);

-- Resources
CREATE TABLE resources (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id             uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  category_id         uuid NOT NULL REFERENCES resource_categories(id) ON DELETE RESTRICT,
  source_type         resource_source_type NOT NULL,
  title               text NOT NULL,
  description         text,
  author              text,
  visibility          resource_visibility NOT NULL DEFAULT 'members',
  status              resource_status NOT NULL DEFAULT 'draft',
  is_pinned           boolean NOT NULL DEFAULT false,
  pinned_order        int,
  sort_order          int NOT NULL DEFAULT 0,
  show_new_badge      boolean NOT NULL DEFAULT true,
  published_at        timestamptz,
  content_updated_at  timestamptz,
  review_on           date,
  -- file fields
  file_path           text,
  file_name           text,
  file_mime           text,
  file_size           int,
  page_count          int,
  -- link/video fields
  url                 text,
  url_host            text,
  video_provider      resource_video_provider,
  video_id            text,
  duration_seconds    int,
  thumbnail_url       text,
  -- health
  link_status         resource_link_status NOT NULL DEFAULT 'unchecked',
  link_checked_at     timestamptz,
  link_error          text,
  view_count          int NOT NULL DEFAULT 0,
  created_by          uuid REFERENCES auth.users(id),
  updated_by          uuid REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Members: read published resources in visible categories
CREATE POLICY "club members can read published resources"
  ON resources FOR SELECT
  USING (status = 'published');

CREATE POLICY "club members can read visible categories"
  ON resource_categories FOR SELECT
  USING (is_visible = true);

-- Service role bypass (used by server actions)
CREATE POLICY "service role bypass" ON resources FOR ALL USING (true);
CREATE POLICY "service role bypass cats" ON resource_categories FOR ALL USING (true);

-- Storage bucket for resource file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', false)
ON CONFLICT DO NOTHING;

-- Default categories are seeded per-club when a club is created (or on first
-- visit to the resources admin page). The 6 defaults are:
--   Start here   (is_system=true, layout=featured_cards, sort_order=0)
--   Club Info                                              sort_order=1
--   Competitions                                           sort_order=2
--   Lessons & Tutorials                                    sort_order=3
--   Meeting Recordings  (layout=video_grid)                sort_order=4
--   Inspiration                                            sort_order=5

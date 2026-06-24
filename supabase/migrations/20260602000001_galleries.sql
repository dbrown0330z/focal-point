-- Shared trigger function for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ─── Member galleries ────────────────────────────────────────────────────────
-- Personal galleries created by members.
-- image_ids: ordered JSONB array of image UUIDs from the images table.

CREATE TABLE member_galleries (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id        uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL,                          -- auth.users.id
  name           text NOT NULL CHECK (length(trim(name)) > 0),
  slug           text NOT NULL,
  visibility     text NOT NULL DEFAULT 'private'
                   CHECK (visibility IN ('public', 'members_only', 'private')),
  cover_image_id uuid REFERENCES images(id) ON DELETE SET NULL,
  image_ids      jsonb NOT NULL DEFAULT '[]',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, club_id, slug)
);

ALTER TABLE member_galleries ENABLE ROW LEVEL SECURITY;

-- Owner has full control
CREATE POLICY "mg_owner_all" ON member_galleries
  FOR ALL USING  (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

-- Authenticated users can read members-only galleries
CREATE POLICY "mg_members_read" ON member_galleries
  FOR SELECT USING (visibility = 'members_only' AND auth.uid() IS NOT NULL);

-- Anyone can read public galleries
CREATE POLICY "mg_public_read" ON member_galleries
  FOR SELECT USING (visibility = 'public');

CREATE TRIGGER mg_updated_at BEFORE UPDATE ON member_galleries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Club galleries ───────────────────────────────────────────────────────────
-- Curated by admins. Not scoped per-member — shared club assets.

CREATE TABLE club_galleries (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id              uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name                 text NOT NULL CHECK (length(trim(name)) > 0),
  slug                 text NOT NULL,
  description          text,
  visibility           text NOT NULL DEFAULT 'public'
                         CHECK (visibility IN ('public', 'members_only')),
  cover_submission_id  uuid REFERENCES submissions(id) ON DELETE SET NULL,
  featured_on_homepage boolean NOT NULL DEFAULT false,
  archived_at          timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, slug)
);

ALTER TABLE club_galleries ENABLE ROW LEVEL SECURITY;

-- Ensure only one gallery is featured on homepage per club
CREATE UNIQUE INDEX club_galleries_single_featured
  ON club_galleries (club_id)
  WHERE featured_on_homepage = true AND archived_at IS NULL;

CREATE POLICY "cg_public_read" ON club_galleries
  FOR SELECT USING (visibility = 'public' AND archived_at IS NULL);

CREATE POLICY "cg_members_read" ON club_galleries
  FOR SELECT USING (visibility = 'members_only' AND archived_at IS NULL AND auth.uid() IS NOT NULL);

CREATE TRIGGER cg_updated_at BEFORE UPDATE ON club_galleries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Club gallery images ──────────────────────────────────────────────────────
-- Junction table: ordered submissions within a club gallery.

CREATE TABLE club_gallery_images (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_id     uuid NOT NULL REFERENCES club_galleries(id) ON DELETE CASCADE,
  submission_id  uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  sort_order     integer NOT NULL DEFAULT 0,
  added_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gallery_id, submission_id)
);

ALTER TABLE club_gallery_images ENABLE ROW LEVEL SECURITY;

-- Readable when parent gallery is accessible
CREATE POLICY "cgi_read" ON club_gallery_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_galleries g
      WHERE g.id = gallery_id
        AND g.archived_at IS NULL
        AND (
          g.visibility = 'public'
          OR (g.visibility = 'members_only' AND auth.uid() IS NOT NULL)
        )
    )
  );

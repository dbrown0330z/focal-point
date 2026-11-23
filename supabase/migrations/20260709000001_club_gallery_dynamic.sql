-- Add dynamic gallery support and draft visibility to club_galleries

ALTER TABLE club_galleries
  DROP CONSTRAINT IF EXISTS club_galleries_visibility_check;

ALTER TABLE club_galleries
  ADD CONSTRAINT club_galleries_visibility_check
    CHECK (visibility IN ('draft', 'members_only', 'public'));

-- Update existing galleries: 'public' stays 'public', 'members_only' stays 'members_only'
-- New galleries default to 'draft'
ALTER TABLE club_galleries
  ALTER COLUMN visibility SET DEFAULT 'draft';

-- Dynamic filter support
ALTER TABLE club_galleries
  ADD COLUMN IF NOT EXISTS filters jsonb,
  ADD COLUMN IF NOT EXISTS image_ids jsonb NOT NULL DEFAULT '[]';

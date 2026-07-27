-- Additional results event fields for admin detail page
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS results_location_mode    TEXT DEFAULT 'not-confirmed',
  ADD COLUMN IF NOT EXISTS results_location_venue   TEXT,
  ADD COLUMN IF NOT EXISTS results_publish_visibility TEXT DEFAULT 'members-only';

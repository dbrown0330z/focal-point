-- Member directory visibility preference.
-- Defaults to true — existing members remain visible until they opt out.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pref_show_in_directory boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN profiles.pref_show_in_directory IS 'Member appears in the public member directory';

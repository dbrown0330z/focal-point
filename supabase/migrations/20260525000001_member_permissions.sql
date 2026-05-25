-- Add per-member permission flags to profiles.
-- These grant elevated capabilities within a member role without
-- promoting the member to full admin.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS perm_competition_manager boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS perm_event_manager       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS perm_comms_manager       boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.perm_competition_manager IS 'Can create and manage competitions';
COMMENT ON COLUMN profiles.perm_event_manager       IS 'Can create and manage calendar events';
COMMENT ON COLUMN profiles.perm_comms_manager       IS 'Can send club-wide notifications and emails';

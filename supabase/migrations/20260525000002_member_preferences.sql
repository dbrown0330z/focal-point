-- Member notification preferences — member-controlled, admin-visible.
-- Defaults to true so existing members receive notifications until
-- they opt out.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pref_competition_reminders  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pref_results_notifications  boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN profiles.pref_competition_reminders IS 'Member wants reminder emails before competition closes';
COMMENT ON COLUMN profiles.pref_results_notifications IS 'Member wants email when competition results are published';

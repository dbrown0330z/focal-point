-- Additional member-controlled preferences shown in the admin member modal
-- (read-only for admins, editable by the member via their own profile settings).
-- Default true so existing members are opted in until they explicitly opt out.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pref_club_newsletter       boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pref_public_profile        boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pref_show_scores_publicly  boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN profiles.pref_club_newsletter      IS 'Member wants to receive club newsletter emails';
COMMENT ON COLUMN profiles.pref_public_profile       IS 'Member profile is visible in the member directory';
COMMENT ON COLUMN profiles.pref_show_scores_publicly IS 'Member competition scores shown publicly in results';

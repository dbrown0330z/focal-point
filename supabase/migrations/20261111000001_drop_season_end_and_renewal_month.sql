-- season_end_month is replaced by deriving it from season_start_month in the UI.
-- dues_renewal_month is replaced by season_start_month as the single source of truth.
ALTER TABLE club_settings
  DROP COLUMN IF EXISTS season_end_month,
  DROP COLUMN IF EXISTS dues_renewal_month;

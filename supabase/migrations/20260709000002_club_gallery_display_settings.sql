-- Add display_settings to club_galleries so admins can persist viewer layout preferences

ALTER TABLE club_galleries
  ADD COLUMN IF NOT EXISTS display_settings jsonb;

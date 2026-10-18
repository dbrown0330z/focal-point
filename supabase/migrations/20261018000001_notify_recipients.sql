-- Replace notify_all_admins boolean with a 3-way notify_recipients column.
-- Existing rows: true → 'all', false → 'owner'
ALTER TABLE club_settings
  ADD COLUMN IF NOT EXISTS notify_recipients text NOT NULL DEFAULT 'all';

UPDATE club_settings
  SET notify_recipients = CASE WHEN notify_all_admins THEN 'all' ELSE 'owner' END;

ALTER TABLE club_settings
  DROP COLUMN IF EXISTS notify_all_admins;

ALTER TABLE club_settings
  ADD CONSTRAINT notify_recipients_check
    CHECK (notify_recipients IN ('all', 'owner', 'none'));

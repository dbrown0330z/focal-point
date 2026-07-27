-- Extended results event fields to match wizard StepSchedule
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS results_reveal_mode              TEXT DEFAULT 'meeting',
  ADD COLUMN IF NOT EXISTS results_publish_timing           TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS results_publish_specific_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS results_public_visibility_delay  INT  DEFAULT 24;

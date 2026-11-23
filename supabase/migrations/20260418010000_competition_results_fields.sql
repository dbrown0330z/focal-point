-- Competition results event fields
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS results_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS results_event_type TEXT;

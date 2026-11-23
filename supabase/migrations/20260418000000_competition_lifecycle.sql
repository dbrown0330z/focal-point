-- New status enum values
ALTER TYPE competition_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE competition_status ADD VALUE IF NOT EXISTS 'results_pending';
ALTER TYPE competition_status ADD VALUE IF NOT EXISTS 'results_published';

-- New lifecycle columns
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS archived_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason  TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at           TIMESTAMPTZ;

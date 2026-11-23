-- ─── Judge reminder tracking ──────────────────────────────────────────────────
-- Adds judging window columns, reminder state, and judging_on_hold status.

-- New competition status for when the judging window opens with no judge assigned
ALTER TYPE competition_status ADD VALUE IF NOT EXISTS 'judging_on_hold';

-- Separate judging open/close columns (previously only judging_at existed as an approximation)
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS judging_opens_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS judging_closes_at TIMESTAMPTZ;

-- Track which reminder emails have been sent per competition (idempotent job support)
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS reminders_sent JSONB NOT NULL DEFAULT
    '{"admin7Day":false,"admin1Day":false,"adminOnOpen":false,"adminFollowUpCount":0,"judge1Day":false,"judgeClosingDay":false}'::jsonb;

-- Track when the judge invitation email was sent
ALTER TABLE judge_tokens
  ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ;

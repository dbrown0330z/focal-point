-- ─────────────────────────────────────────────────────────────────────────────
-- Automated club signup: email verification fields
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS location               text,
  ADD COLUMN IF NOT EXISTS verification_token     text UNIQUE,
  ADD COLUMN IF NOT EXISTS verification_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at            timestamptz;

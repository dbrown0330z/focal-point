-- ─────────────────────────────────────────────────────────────────────────────
-- Club draft mode
--
-- Adds two columns to clubs:
--   is_published  — false until the admin explicitly goes live
--   dues_mode     — how the club collects dues (must be set before publishing)
--
-- Existing clubs (dev / already-live) are set to published = true so they
-- are unaffected by the new middleware guard.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dues_mode    text
    CHECK (dues_mode IN ('stripe', 'paypal', 'offline'));

-- All existing clubs are already live — don't block them.
UPDATE public.clubs SET is_published = true;

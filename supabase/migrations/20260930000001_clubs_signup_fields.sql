-- ─────────────────────────────────────────────────────────────────────────────
-- FP Admin: clubs signup fields + RLS for public application submissions
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS admin_first_name text,
  ADD COLUMN IF NOT EXISTS admin_last_name  text,
  ADD COLUMN IF NOT EXISTS submitted_at     timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS invite_sent_at   timestamptz,
  ADD COLUMN IF NOT EXISTS notes            text;

-- club_settings: track whether the new-club setup wizard has been completed
ALTER TABLE public.club_settings
  ADD COLUMN IF NOT EXISTS setup_complete boolean NOT NULL DEFAULT false;

-- Allow unauthenticated visitors to submit a club application (status must be pending)
DROP POLICY IF EXISTS "clubs: public apply" ON public.clubs;
CREATE POLICY "clubs: public apply"
  ON public.clubs FOR INSERT
  WITH CHECK (status = 'pending');

-- FP admins can read and manage all clubs
DROP POLICY IF EXISTS "clubs: fp_admin all" ON public.clubs;
CREATE POLICY "clubs: fp_admin all"
  ON public.clubs FOR ALL
  USING (is_fp_admin())
  WITH CHECK (is_fp_admin());

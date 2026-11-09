-- ─────────────────────────────────────────────────────────────────────────────
-- Dues configuration fields
--
-- Adds dues and one-time fee config to club_settings so the
-- Dues & Payment admin page can persist all amounts and toggles.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.club_settings
  ADD COLUMN IF NOT EXISTS dues_annual_standard       numeric(10,2),
  ADD COLUMN IF NOT EXISTS dues_renewal_month         integer  DEFAULT 1 CHECK (dues_renewal_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS dues_prorate               boolean  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dues_exempt_honorary       boolean  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dues_grace_period_days     integer,
  ADD COLUMN IF NOT EXISTS dues_discount_categories   jsonb    DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS dues_onetimefees_enabled   boolean  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dues_application_fee       numeric(10,2),
  ADD COLUMN IF NOT EXISTS dues_join_fee              numeric(10,2);

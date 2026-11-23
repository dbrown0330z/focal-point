ALTER TABLE public.club_settings
  ADD COLUMN IF NOT EXISTS dues_manual_methods  text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dues_etransfer_email  text,
  ADD COLUMN IF NOT EXISTS dues_paypal_link      text,
  ADD COLUMN IF NOT EXISTS dues_venmo_handle     text,
  ADD COLUMN IF NOT EXISTS dues_zelle_contact    text;

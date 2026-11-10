ALTER TABLE public.club_settings
  ADD COLUMN IF NOT EXISTS dues_cashapp_handle text;

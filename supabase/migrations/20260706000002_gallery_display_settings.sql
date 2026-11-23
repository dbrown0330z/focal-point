ALTER TABLE public.member_galleries
  ADD COLUMN IF NOT EXISTS display_settings jsonb;

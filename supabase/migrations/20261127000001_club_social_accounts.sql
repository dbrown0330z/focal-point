-- Club social accounts — flexible, ordered list of social links per club.
-- Replaces the hardcoded instagram_url / facebook_url columns on club_settings
-- and the panel_show_instagram / panel_show_facebook boolean flags.

CREATE TABLE IF NOT EXISTS public.club_social_accounts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     uuid        NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  platform    text        NOT NULL,  -- 'instagram' | 'facebook' | 'x' | ... | 'custom'
  url         text        NOT NULL,
  label       text,                  -- display label; required for 'custom' platform
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.club_social_accounts ENABLE ROW LEVEL SECURITY;

-- Public read (shown on the public About page)
CREATE POLICY "public_read_social_accounts"
  ON public.club_social_accounts FOR SELECT
  USING (true);

-- Admins of that club can manage
CREATE POLICY "admin_manage_social_accounts"
  ON public.club_social_accounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role    = 'admin'
        AND p.club_id = club_social_accounts.club_id
    )
  );

-- panel_shown_social_ids: which social accounts the About panel shows
ALTER TABLE public.club_settings
  ADD COLUMN IF NOT EXISTS panel_shown_social_ids uuid[] NOT NULL DEFAULT '{}';

-- Migrate existing instagram / facebook data into club_social_accounts
-- (safe to run multiple times — only inserts when the url column is set)
INSERT INTO public.club_social_accounts (club_id, platform, url, sort_order)
SELECT club_id, 'instagram', instagram_url, 0
FROM   public.club_settings
WHERE  instagram_url IS NOT NULL AND instagram_url <> ''
ON CONFLICT DO NOTHING;

INSERT INTO public.club_social_accounts (club_id, platform, url, sort_order)
SELECT club_id, 'facebook', facebook_url, 1
FROM   public.club_settings
WHERE  facebook_url IS NOT NULL AND facebook_url <> ''
ON CONFLICT DO NOTHING;

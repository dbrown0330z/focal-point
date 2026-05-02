-- Add status and updated_at to nav_custom_pages
ALTER TABLE public.nav_custom_pages
  ADD COLUMN IF NOT EXISTS status     text        NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

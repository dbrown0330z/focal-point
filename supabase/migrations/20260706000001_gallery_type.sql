-- Add gallery_type ('standard' | 'dynamic') and filters JSONB to member_galleries.
-- Existing galleries default to 'standard'.

ALTER TABLE public.member_galleries
  ADD COLUMN IF NOT EXISTS gallery_type text NOT NULL DEFAULT 'standard'
    CHECK (gallery_type IN ('standard', 'dynamic')),
  ADD COLUMN IF NOT EXISTS filters jsonb;

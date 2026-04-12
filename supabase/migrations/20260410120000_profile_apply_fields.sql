-- Add membership application fields to profiles

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS experience_level text
    CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS shooting_interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS camera_brands      text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bio                text;

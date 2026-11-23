-- Add location and phone fields to member profiles.

alter table public.profiles
  add column if not exists location text,
  add column if not exists phone    text;

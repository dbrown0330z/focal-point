alter table public.club_settings
  add column if not exists default_meeting_location_id uuid references public.meeting_locations(id) on delete set null;

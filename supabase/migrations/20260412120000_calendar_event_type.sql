create type public.calendar_event_type as enum (
  'competition',
  'regular_meeting',
  'board_meeting',
  'field_trip',
  'other'
);

alter table public.calendar_events
  add column event_type public.calendar_event_type not null default 'other';

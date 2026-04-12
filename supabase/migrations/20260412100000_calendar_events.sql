create table public.calendar_events (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  description text,
  location    text,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  all_day     boolean     not null default false,
  created_by  uuid        references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.calendar_events enable row level security;

-- All active members can read events
create policy "members can view events"
  on public.calendar_events for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and membership_status = 'active'
    )
  );

-- Only admins can insert / update / delete
create policy "admins can manage events"
  on public.calendar_events for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'admin'
    )
  );

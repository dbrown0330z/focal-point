-- Stores a log of bulk emails sent to members from the admin compose screen.
-- Keeps a record for audit/history purposes (not full recipient list).

create table public.sent_messages (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid references public.clubs(id) on delete set null,
  sent_by     uuid references public.profiles(id) on delete set null,
  subject     text not null,
  html_body   text not null,
  sent_to     text not null,         -- human-readable summary e.g. "All active members (42)"
  recipient_count int not null default 0,
  sent_at     timestamptz not null default now()
);

alter table public.sent_messages enable row level security;

-- Admins can read and insert; no one can update or delete
create policy "sent_messages: admin read"
  on public.sent_messages for select
  using (is_admin());

create policy "sent_messages: admin insert"
  on public.sent_messages for insert
  with check (is_admin());

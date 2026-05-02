-- Competition templates: reusable structures that define judging rules, awards, and scoring.
-- A competition is an instance of a template with specific dates, name, and assigned judges.

create table public.competition_templates (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  config      jsonb       not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.competition_templates enable row level security;

create policy "admins manage competition templates"
  on public.competition_templates for all to authenticated
  using   (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "members read competition templates"
  on public.competition_templates for select to authenticated using (true);

-- Extend competitions with a template reference and additional scheduling fields
alter table public.competitions
  add column if not exists template_id  uuid references public.competition_templates(id) on delete set null,
  add column if not exists description  text,
  add column if not exists judging_at   timestamptz;

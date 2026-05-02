-- Competition default categories
-- Used to pre-populate categories when creating a new competition template.

create table public.competition_default_categories (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  sort_order int         not null default 0,
  created_at timestamptz not null default now()
);

alter table public.competition_default_categories enable row level security;

create policy "Admins manage competition default categories"
  on public.competition_default_categories for all to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Authenticated read competition default categories"
  on public.competition_default_categories for select to authenticated using (true);

-- Seed common defaults
insert into public.competition_default_categories (name, sort_order) values
  ('Open',       0),
  ('Nature',     1),
  ('Monochrome', 2);

-- ─────────────────────────────────────────────────────────
-- Pages table — stores rich HTML content for editable site pages
-- ─────────────────────────────────────────────────────────

create table if not exists public.pages (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null,
  title      text not null,
  content    text,                    -- stored as HTML
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create unique index if not exists pages_slug_idx on public.pages (slug);

-- RLS: public read, admin write
alter table public.pages enable row level security;

create policy "pages: public read"
  on public.pages for select
  using (true);

create policy "pages: admin write"
  on public.pages for all
  using (is_admin())
  with check (is_admin());

-- Seed the About page with starter content
insert into public.pages (slug, title, content)
values (
  'about',
  'About our club',
  '<h1>Welcome to our club</h1><p>We are a community of passionate photographers who come together to learn, share, and grow. Whether you are a seasoned professional or just picking up a camera for the first time, you will find a welcoming home here.</p><h2>What we do</h2><p>Each month we meet to share our work, learn from invited speakers, and take part in themed photography competitions. Our members range from complete beginners to award-winning professionals, and everyone brings something unique to the group.</p><hr><h2>How to join</h2><p>Membership is open to anyone with a passion for photography. New members are welcome throughout the year — simply attend one of our meetings as a guest, then apply online when you are ready. We look forward to welcoming you.</p>'
)
on conflict (slug) do nothing;

-- Guest-facing tables for the wedding site. The browser talks to these
-- directly with the publishable key, so every rule a guest must not be able to
-- bypass lives here as a constraint or policy rather than in client code.

create table public.wishes (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'A well-wisher',
  message text not null,
  event text not null default '',
  created_at timestamptz not null default now(),

  constraint wishes_message_not_blank check (length(btrim(message)) > 0),
  constraint wishes_message_len check (length(message) <= 500),
  constraint wishes_name_len check (length(name) <= 60),
  constraint wishes_event_len check (length(event) <= 40)
);

create table public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  by_name text not null default 'A guest',
  created_at timestamptz not null default now(),

  constraint songs_title_not_blank check (length(btrim(title)) > 0),
  constraint songs_title_len check (length(title) <= 80),
  constraint songs_by_name_len check (length(by_name) <= 40)
);

-- Both lists are always read newest first.
create index wishes_created_at_idx on public.wishes (created_at desc);
create index songs_created_at_idx on public.songs (created_at desc);

alter table public.wishes enable row level security;
alter table public.songs enable row level security;

-- Anyone may read the wall and the playlist: they are public by design.
create policy "wishes are readable by anyone"
  on public.wishes for select
  to anon, authenticated
  using (true);

create policy "songs are readable by anyone"
  on public.songs for select
  to anon, authenticated
  using (true);

-- Anyone may add, because guests are not asked to sign in.
create policy "anyone may leave a wish"
  on public.wishes for insert
  to anon, authenticated
  with check (true);

create policy "anyone may add a song"
  on public.songs for insert
  to anon, authenticated
  with check (true);

-- No update or delete policy exists, so guests cannot edit or remove entries.
-- The couple moderates from the Supabase dashboard, which bypasses RLS.

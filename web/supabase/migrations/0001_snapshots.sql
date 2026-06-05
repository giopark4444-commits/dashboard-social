-- snapshots: 1 fila por plataforma por día
create table public.snapshots (
  id bigint generated always as identity primary key,
  platform text not null,
  snapshot_date date not null,
  followers integer,
  total_views bigint,
  posts_count integer,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (platform, snapshot_date)
);

alter table public.snapshots enable row level security;

-- lectura para usuarios logueados; escritura SOLO via service role (bypassa RLS)
create policy "authenticated_read_snapshots"
  on public.snapshots for select to authenticated using (true);

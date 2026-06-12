-- 0002: Vantage Studio — marcas/workspaces + agentes

-- marcas (workspaces)
create table public.brands (
  id text primary key,              -- slug estable usado por la app
  name text not null,
  color text not null default '#4f8cff',
  position int not null default 0
);
alter table public.brands enable row level security;
create policy "authenticated_read_brands"
  on public.brands for select to authenticated using (true);

insert into public.brands (id, name, color, position) values
  ('personal', 'Marca Personal', '#4f8cff', 1),
  ('vendalo',  'Vendalo',        '#25d366', 2),
  ('oriole',   'Oriole 1060',    '#f0b429', 3),
  ('bar1060',  '1060 Bar',       '#e4573d', 4),
  ('clientes', 'Clientes',       '#a06bfa', 5);

-- snapshots pasa a ser por marca (lo existente era de la marca personal)
alter table public.snapshots
  add column brand_id text not null default 'personal' references public.brands(id);
alter table public.snapshots
  drop constraint snapshots_platform_snapshot_date_key;
alter table public.snapshots
  add constraint snapshots_brand_platform_date_key unique (brand_id, platform, snapshot_date);

-- autonomía y reglas por agente y por marca
create table public.agent_settings (
  agent_id text not null,
  brand_id text not null references public.brands(id),
  autonomy text not null default 'manual'
    check (autonomy in ('manual','copiloto','auto')),
  rules jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (agent_id, brand_id)
);
alter table public.agent_settings enable row level security;
create policy "authenticated_all_agent_settings"
  on public.agent_settings for all to authenticated
  using (true) with check (true);

-- bitácora de agentes (escriben los agentes vía service role; el usuario lee)
create table public.agent_runs (
  id bigint generated always as identity primary key,
  agent_id text not null,
  brand_id text references public.brands(id),
  action text not null,
  status text not null default 'ok' check (status in ('ok','error','pending')),
  detail jsonb not null default '{}'::jsonb,
  cost_usd numeric(8,4),
  created_at timestamptz not null default now()
);
alter table public.agent_runs enable row level security;
create policy "authenticated_read_agent_runs"
  on public.agent_runs for select to authenticated using (true);

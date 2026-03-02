-- Solicitudes de usuarios para que un recurso aparezca próximamente (ej. buscan "diálogo", no está, lo piden).

create table if not exists public.recursos_solicitudes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  texto text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_recursos_solicitudes_user on public.recursos_solicitudes(user_id);
create index if not exists idx_recursos_solicitudes_created on public.recursos_solicitudes(created_at desc);

alter table public.recursos_solicitudes enable row level security;

-- El usuario puede ver sus propias solicitudes.
create policy "Usuario ve sus solicitudes"
  on public.recursos_solicitudes for select
  using (auth.uid() = user_id);

-- Cualquier autenticado puede crear una solicitud (para sí mismo).
create policy "Usuario crea solicitud"
  on public.recursos_solicitudes for insert
  with check (auth.uid() = user_id);

comment on table public.recursos_solicitudes is 'Solicitudes de usuarios para agregar recursos que no existen (ej. "diálogo").';

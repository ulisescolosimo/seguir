-- Recursos de escritura (contenido editorial) y favoritos por usuario.
-- El admin puede marcar un recurso como destacado (destacado = true).

create table if not exists public.recursos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null,
  ejemplo_label text,
  ejemplo_texto text,
  destacado boolean not null default false,
  orden smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_recursos_destacado on public.recursos(destacado) where destacado = true;
create index if not exists idx_recursos_orden on public.recursos(orden);

alter table public.recursos enable row level security;

-- Cualquiera autenticado puede leer recursos.
create policy "Usuarios leen recursos"
  on public.recursos for select
  to authenticated
  using (true);

-- Solo usuarios con is_admin pueden actualizar (p. ej. marcar destacado). Si no tienes columna is_admin aún, esta policy fallará; añade is_admin a profiles y luego crea policy "Admin actualiza recursos" with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)).
-- Por ahora permitimos update a authenticated para que el cliente pueda llamar; restringir por is_admin en la app o añadir policy cuando exista is_admin.
create policy "Usuarios actualizan recursos"
  on public.recursos for update
  to authenticated
  using (true)
  with check (true);

-- Solo service role o migraciones insertan recursos (contenido editorial).
-- Para insert/delete en recursos no damos policy a authenticated.

create table if not exists public.recursos_favoritos (
  user_id uuid not null references auth.users(id) on delete cascade,
  recurso_id uuid not null references public.recursos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recurso_id)
);

create index if not exists idx_recursos_favoritos_user on public.recursos_favoritos(user_id);

alter table public.recursos_favoritos enable row level security;

create policy "Usuario ve sus favoritos"
  on public.recursos_favoritos for select
  using (auth.uid() = user_id);

create policy "Usuario agrega favorito"
  on public.recursos_favoritos for insert
  with check (auth.uid() = user_id);

create policy "Usuario quita favorito"
  on public.recursos_favoritos for delete
  using (auth.uid() = user_id);

-- Trigger updated_at en recursos
create trigger recursos_updated_at
  before update on public.recursos
  for each row execute function public.set_updated_at();

comment on table public.recursos is 'Recursos de escritura (editorial). Un recurso puede ser destacado por admin.';
comment on table public.recursos_favoritos is 'Favoritos de recursos por usuario.';

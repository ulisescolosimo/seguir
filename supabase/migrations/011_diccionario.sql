-- Palabras del diccionario (catálogo) y definiciones por usuario.
-- Cada persona puede completar su propia definición por palabra.

create table if not exists public.palabras_diccionario (
  id uuid primary key default gen_random_uuid(),
  palabra text not null unique,
  orden smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_palabras_diccionario_orden on public.palabras_diccionario(orden);

alter table public.palabras_diccionario enable row level security;

-- Cualquiera autenticado puede leer las palabras.
create policy "Usuarios leen palabras_diccionario"
  on public.palabras_diccionario for select
  to authenticated
  using (true);

-- Solo migraciones insertan el catálogo.
-- No policy de insert/update/delete para authenticated.

comment on table public.palabras_diccionario is 'Catálogo de palabras a definir por el usuario (diccionario personal).';

create table if not exists public.definiciones_diccionario (
  user_id uuid not null references auth.users(id) on delete cascade,
  palabra_id uuid not null references public.palabras_diccionario(id) on delete cascade,
  definicion text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, palabra_id)
);

create index if not exists idx_definiciones_diccionario_user on public.definiciones_diccionario(user_id);

alter table public.definiciones_diccionario enable row level security;

create policy "Usuario ve sus definiciones"
  on public.definiciones_diccionario for select
  using (auth.uid() = user_id);

create policy "Usuario inserta su definición"
  on public.definiciones_diccionario for insert
  with check (auth.uid() = user_id);

create policy "Usuario actualiza su definición"
  on public.definiciones_diccionario for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuario elimina su definición"
  on public.definiciones_diccionario for delete
  using (auth.uid() = user_id);

create trigger definiciones_diccionario_updated_at
  before update on public.definiciones_diccionario
  for each row execute function public.set_updated_at();

comment on table public.definiciones_diccionario is 'Definiciones personales de cada usuario para cada palabra del diccionario.';

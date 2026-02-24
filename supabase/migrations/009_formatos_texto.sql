-- Formato del texto (ficción: cuento, novela... / no ficción: ensayo, crónica...).
-- No usamos la palabra "género" para no confundir con fantástico, ciencia ficción, etc.

create table if not exists public.formatos_texto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null check (categoria in ('ficcion', 'no_ficcion')),
  orden smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_formatos_texto_nombre_categoria
  on public.formatos_texto(categoria, nombre);
create index if not exists idx_formatos_texto_orden on public.formatos_texto(categoria, orden);

alter table public.formatos_texto enable row level security;

-- Cualquiera autenticado puede leer los formatos (son catálogo).
create policy "Usuarios leen formatos_texto"
  on public.formatos_texto for select
  to authenticated
  using (true);

-- Solo migraciones/service role insertan o modifican el catálogo.
-- No damos policy de insert/update/delete a authenticated.

create trigger formatos_texto_updated_at
  before update on public.formatos_texto
  for each row execute function public.set_updated_at();

comment on table public.formatos_texto is 'Catálogo de formato del texto: Ficción (cuento, novela...) y No ficción (ensayo, crónica...).';

-- Referencia en texts: reemplazamos tematica por formato_id.
alter table public.texts
  add column if not exists formato_id uuid references public.formatos_texto(id) on delete set null;

create index if not exists idx_texts_formato_id on public.texts(formato_id);

comment on column public.texts.formato_id is 'Formato del texto (cuento, novela, ensayo, etc.). Reemplaza tematica.';

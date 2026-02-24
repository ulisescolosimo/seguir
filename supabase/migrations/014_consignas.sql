-- Consignas de escritura: sugerencias diarias o por categoría.
-- Los textos pueden estar ligados a una consigna (texts.consigna_id).

create table if not exists public.consignas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null default '',
  tipo text not null default 'OTRO' check (tipo in ('POESÍA', 'FICCIÓN', 'NO FICCIÓN', 'OTRO')),
  orden smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_consignas_orden on public.consignas(orden);
create index if not exists idx_consignas_tipo on public.consignas(tipo);

alter table public.consignas enable row level security;

-- Cualquiera autenticado puede leer consignas (catálogo).
create policy "Usuarios leen consignas"
  on public.consignas for select
  to authenticated
  using (true);

-- Solo service role / migraciones insertan o modifican.
create trigger consignas_updated_at
  before update on public.consignas
  for each row execute function public.set_updated_at();

comment on table public.consignas is 'Consignas de escritura creativa para inspirar textos.';

-- Vincular textos a consigna (opcional).
alter table public.texts
  add column if not exists consigna_id uuid references public.consignas(id) on delete set null;

create index if not exists idx_texts_consigna_id on public.texts(consigna_id);
comment on column public.texts.consigna_id is 'Consigna que inspiró este texto, si fue escrito desde Consignas.';

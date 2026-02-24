-- Vincular consignas a formato/temática (formatos_texto: Poesía, Cuento, etc.).
alter table public.consignas
  add column if not exists formato_id uuid references public.formatos_texto(id) on delete set null;

create index if not exists idx_consignas_formato_id on public.consignas(formato_id);
comment on column public.consignas.formato_id is 'Formato/temática de la consigna (catálogo formatos_texto).';

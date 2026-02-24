-- Ampliar tipos de consigna: RECURSOS (por recursos formales) y TEMAS (por temas).
alter table public.consignas
  drop constraint if exists consignas_tipo_check;

alter table public.consignas
  add constraint consignas_tipo_check check (
    tipo in ('POESÍA', 'FICCIÓN', 'NO FICCIÓN', 'OTRO', 'RECURSOS', 'TEMAS')
  );

-- Seed de formatos de texto. UUIDs fijos para idempotencia (on conflict do update).
-- Ficción: cuento, novela, híbrido, microrrelato, no tengo idea
-- No ficción: ensayo, crónica, diario, poesía, no tengo idea

insert into public.formatos_texto (id, nombre, categoria, orden) values
-- Ficción
('b0000001-0001-4000-8000-000000000001', 'Cuento', 'ficcion', 0),
('b0000002-0001-4000-8000-000000000002', 'Novela', 'ficcion', 1),
('b0000003-0001-4000-8000-000000000003', 'Híbrido', 'ficcion', 2),
('b0000004-0001-4000-8000-000000000004', 'Microrrelato', 'ficcion', 3),
('b0000005-0001-4000-8000-000000000005', 'No tengo idea', 'ficcion', 4),
-- No ficción
('b0000006-0001-4000-8000-000000000006', 'Ensayo', 'no_ficcion', 0),
('b0000007-0001-4000-8000-000000000007', 'Crónica', 'no_ficcion', 1),
('b0000008-0001-4000-8000-000000000008', 'Diario', 'no_ficcion', 2),
('b0000009-0001-4000-8000-000000000009', 'Poesía', 'no_ficcion', 3),
('b000000a-0001-4000-8000-00000000000a', 'No tengo idea', 'no_ficcion', 4)
on conflict (id) do update set
  nombre = excluded.nombre,
  categoria = excluded.categoria,
  orden = excluded.orden,
  updated_at = now();

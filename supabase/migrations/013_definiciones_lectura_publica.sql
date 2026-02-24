-- Permitir que usuarios autenticados lean todas las definiciones del diccionario
-- para la Biblioteca de significados (conteos y listado público).
-- Siguen pudiendo insert/update/delete solo las propias.

drop policy if exists "Usuario ve sus definiciones" on public.definiciones_diccionario;

create policy "Usuarios leen todas las definiciones (biblioteca)"
  on public.definiciones_diccionario for select
  to authenticated
  using (true);

-- Permitir que la comunidad vea textos publicados de usuarios con "Quiero que me lean" (want_to_be_read).
-- Los usuarios siguen viendo solo sus propios textos con la política existente.

create policy "Comunidad ve textos publicados de quienes quieren ser leídos"
  on public.texts for select
  using (
    status = 'published'
    and exists (
      select 1 from public.profiles p
      where p.id = texts.user_id and p.want_to_be_read = true
    )
  );

-- Permitir que usuarios autenticados lean perfiles con want_to_be_read para mostrar autor en Comunidad.
create policy "Ver perfiles que quieren ser leídos"
  on public.profiles for select
  using (want_to_be_read = true);

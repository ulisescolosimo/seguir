-- Marca cuándo se publicó por primera vez un texto (para mostrar "editado después de publicarse").
alter table public.texts
  add column if not exists published_at timestamptz default null;

comment on column public.texts.published_at is 'Fecha en que el texto pasó a publicado por primera vez. Si updated_at > published_at, se muestra "Este texto fue editado después de publicarse".';

-- Al publicar, guardar la fecha solo la primera vez.
create or replace function public.set_published_at_on_publish()
returns trigger as $$
begin
  if new.status = 'published' and (old.status is distinct from 'published' or old.published_at is null) then
    new.published_at = coalesce(old.published_at, now());
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists texts_set_published_at on public.texts;
create trigger texts_set_published_at
  before update on public.texts
  for each row
  execute function public.set_published_at_on_publish();

-- Textos ya publicados: considerar "publicados ahora" para no marcar como editados hasta la próxima edición.
update public.texts
set published_at = updated_at
where status = 'published' and published_at is null;

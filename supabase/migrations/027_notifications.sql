-- Notificaciones in-app: comentarios, textos guardados, recordatorios de escritura.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('comment', 'saved_text', 'reminder')),
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_user_read_created on public.notifications(user_id, read_at, created_at desc);

alter table public.notifications enable row level security;

create policy "Usuario ve sus notificaciones"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Usuario marca como leída"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- El usuario puede insertar solo notificaciones de tipo reminder para sí mismo (recordatorios de escritura).
create policy "Usuario inserta su recordatorio"
  on public.notifications for insert
  with check (auth.uid() = user_id and type = 'reminder');

-- Inserciones desde triggers (SECURITY DEFINER) se hacen como owner y no requieren policy.
comment on table public.notifications is 'Notificaciones in-app: comentarios en mi texto, alguien guardó mi texto, recordatorios de escritura.';
comment on column public.notifications.payload is 'Datos según type: comment { text_id, comment_id, actor_name, actor_user_id }, saved_text { text_id, actor_user_id, text_title }, reminder {}.';

-- Función: al comentar un texto, notificar al autor del texto (no al comentarista).
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_actor_id uuid;
  v_actor_name text;
begin
  select t.user_id into v_owner_id from public.texts t where t.id = new.text_id;
  if v_owner_id is null or v_owner_id = new.user_id then
    return new;
  end if;
  v_actor_id := new.user_id;
  v_actor_name := coalesce(new.author_name, 'Alguien');
  insert into public.notifications (user_id, type, payload)
  values (
    v_owner_id,
    'comment',
    jsonb_build_object(
      'text_id', new.text_id,
      'comment_id', new.id,
      'actor_user_id', v_actor_id,
      'actor_name', v_actor_name,
      'body_preview', left(new.body, 80)
    )
  );
  return new;
end;
$$;

create trigger trigger_notify_on_comment
  after insert on public.text_comments
  for each row execute function public.notify_on_comment();

-- Función: al guardar un texto, notificar al autor del texto (no a quien guarda).
create or replace function public.notify_on_saved_text()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_text_title text;
begin
  select t.user_id, coalesce(nullif(trim(t.title), ''), 'Sin título') into v_owner_id, v_text_title
  from public.texts t where t.id = new.text_id;
  if v_owner_id is null or v_owner_id = new.user_id then
    return new;
  end if;
  insert into public.notifications (user_id, type, payload)
  values (
    v_owner_id,
    'saved_text',
    jsonb_build_object(
      'text_id', new.text_id,
      'actor_user_id', new.user_id,
      'text_title', v_text_title
    )
  );
  return new;
end;
$$;

create trigger trigger_notify_on_saved_text
  after insert on public.saved_texts
  for each row execute function public.notify_on_saved_text();

-- Opcional: habilitar Realtime para notificaciones (desplegable se actualiza en vivo).
-- alter publication supabase_realtime add table public.notifications;
